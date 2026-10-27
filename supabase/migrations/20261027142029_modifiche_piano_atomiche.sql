-- Unica scrittura atomica per Swap, scambio di giorno e salto/ripristino.
-- Nessun dato esistente viene riscritto o cancellato.
ALTER TABLE public.plan_items ADD COLUMN IF NOT EXISTS ripristino_salto jsonb;

CREATE OR REPLACE FUNCTION public.quadrio_modifica_piano_v1(
  p_user_id uuid, p_plan_id uuid, p_attese jsonb, p_modifiche jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  reale jsonb;
  attese jsonb;
  modifica jsonb;
  originale public.plan_items%ROWTYPE;
  nuova public.plan_items%ROWTYPE;
  n integer;
BEGIN
  -- Il server autentica la richiesta; il controllo di proprieta' e' ripetuto qui.
  PERFORM 1 FROM public.plans WHERE id=p_plan_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Non autorizzato' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_attese) IS DISTINCT FROM 'array' OR jsonb_typeof(p_modifiche) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_modifiche) NOT BETWEEN 1 AND 2 THEN
    RAISE EXCEPTION 'Modifiche non valide' USING ERRCODE='22023';
  END IF;
  PERFORM 1 FROM public.plan_items WHERE plan_id=p_plan_id ORDER BY id FOR UPDATE;
  SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.id),'[]'::jsonb) INTO reale
    FROM public.plan_items i WHERE i.plan_id=p_plan_id;
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'id'),'[]'::jsonb) INTO attese FROM jsonb_array_elements(p_attese) x;
  IF reale IS DISTINCT FROM attese THEN
    RAISE EXCEPTION 'Il piano e cambiato' USING ERRCODE='PT409';
  END IF;
  SELECT count(DISTINCT x->>'id') INTO n FROM jsonb_array_elements(p_modifiche) x;
  IF n<>jsonb_array_length(p_modifiche) THEN RAISE EXCEPTION 'Riga ripetuta' USING ERRCODE='22023'; END IF;
  FOR modifica IN SELECT value FROM jsonb_array_elements(p_modifiche) LOOP
    IF jsonb_typeof(modifica->'patch') IS DISTINCT FROM 'object' OR EXISTS (
      SELECT 1 FROM jsonb_object_keys(modifica->'patch') k WHERE k NOT IN
        ('day_of_week','dish_id','portion_g','kcal','protein_g','fibre_g','sat_fat_g','salt_g',
         'stato','spostato_da_giorno','sostituito_da_dish_id','modificato_il','ripristino_salto')
    ) THEN RAISE EXCEPTION 'Campo non ammesso' USING ERRCODE='22023'; END IF;
    SELECT * INTO originale FROM public.plan_items WHERE id=(modifica->>'id')::uuid AND plan_id=p_plan_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Riga non appartenente al piano' USING ERRCODE='42501'; END IF;
    SELECT * INTO nuova FROM jsonb_populate_record(originale,modifica->'patch');
    IF nuova.day_of_week IS NULL OR nuova.day_of_week NOT BETWEEN 1 AND 7 OR nuova.portion_g IS NULL OR nuova.portion_g<=0
      OR nuova.portion_g='NaN'::numeric OR nuova.portion_g='Infinity'::numeric OR nuova.portion_g='-Infinity'::numeric
      OR nuova.stato IS NULL OR nuova.stato NOT IN ('previsto','sostituito','spostato','saltato') THEN
      RAISE EXCEPTION 'Valori non validi' USING ERRCODE='22023';
    END IF;
    UPDATE public.plan_items SET day_of_week=nuova.day_of_week,dish_id=nuova.dish_id,portion_g=nuova.portion_g,
      kcal=nuova.kcal,protein_g=nuova.protein_g,fibre_g=nuova.fibre_g,sat_fat_g=nuova.sat_fat_g,salt_g=nuova.salt_g,
      stato=nuova.stato,spostato_da_giorno=nuova.spostato_da_giorno,sostituito_da_dish_id=nuova.sostituito_da_dish_id,
      modificato_il=nuova.modificato_il,ripristino_salto=nuova.ripristino_salto WHERE id=originale.id;
  END LOOP;
  RETURN jsonb_build_object('ok',true,'righe_modificate',n);
END;
$$;
REVOKE ALL ON FUNCTION public.quadrio_modifica_piano_v1(uuid,uuid,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_modifica_piano_v1(uuid,uuid,jsonb,jsonb) TO service_role;
NOTIFY pgrst, 'reload schema';

-- L'app legge e modifica i piani tramite il backend autenticato.
-- Le chiavi pubbliche non devono aggirare proprieta', limiti e accesso Pro.
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.plans, public.plan_items FROM PUBLIC, anon, authenticated;
