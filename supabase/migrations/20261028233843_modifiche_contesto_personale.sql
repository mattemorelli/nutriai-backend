-- Modifiche basate su righe e scelte personali ancora attuali.
-- La v1 resta riservata al backend per la compatibilita del rilascio.
CREATE OR REPLACE FUNCTION public.quadrio_modifica_piano_v2(
  p_user_id uuid, p_plan_id uuid, p_attese jsonb, p_modifiche jsonb, p_contesto jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  reale jsonb;
  attese jsonb;
  modifica jsonb;
  originale public.plan_items%ROWTYPE;
  nuova public.plan_items%ROWTYPE;
  n integer;
  versione_attuale bigint;
BEGIN
  -- Il server autentica la richiesta; il controllo di proprieta' e' ripetuto qui.
  PERFORM 1 FROM public.plans WHERE id=p_plan_id AND user_id=p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Non autorizzato' USING ERRCODE='42501'; END IF;
  IF jsonb_typeof(p_attese) IS DISTINCT FROM 'array' OR jsonb_typeof(p_modifiche) IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_modifiche) NOT BETWEEN 1 AND 140 THEN
    RAISE EXCEPTION 'Modifiche non valide' USING ERRCODE='22023';
  END IF;
  -- Piano prima, poi utente e versione: ordine compatibile con le
  -- modifiche precedenti e con la creazione di nuove settimane.
  PERFORM 1 FROM public.users WHERE id=p_user_id FOR UPDATE;
  INSERT INTO quadrio_internal.generazione_versioni(user_id,versione) VALUES(p_user_id,0) ON CONFLICT DO NOTHING;
  SELECT versione INTO versione_attuale FROM quadrio_internal.generazione_versioni WHERE user_id=p_user_id FOR UPDATE;
  PERFORM 1 FROM public.plan_items WHERE plan_id=p_plan_id ORDER BY id FOR UPDATE;
  SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.id),'[]'::jsonb) INTO reale
    FROM public.plan_items i WHERE i.plan_id=p_plan_id;
  SELECT coalesce(jsonb_agg(x ORDER BY x->>'id'),'[]'::jsonb) INTO attese FROM jsonb_array_elements(p_attese) x;
  IF reale IS DISTINCT FROM attese THEN
    RAISE EXCEPTION 'Il piano e cambiato' USING ERRCODE='PT409';
  END IF;
  IF jsonb_typeof(p_contesto) IS DISTINCT FROM 'object' OR jsonb_typeof(p_contesto->'versione') IS DISTINCT FROM 'string'
    OR (p_contesto->>'versione') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Contesto non valido' USING ERRCODE='22023'; END IF;
  IF versione_attuale IS DISTINCT FROM (p_contesto->>'versione')::bigint THEN
    RAISE EXCEPTION 'Le scelte sono cambiate' USING ERRCODE='PT412';
  END IF;
  IF jsonb_array_length(p_modifiche)>2 AND EXISTS(
    SELECT 1 FROM jsonb_array_elements(p_modifiche) x WHERE x->'patch' IS DISTINCT FROM jsonb_build_object('bloccato',x->'patch'->'bloccato')
  ) THEN RAISE EXCEPTION 'Modifica multipla non consentita' USING ERRCODE='22023'; END IF;
  SELECT count(DISTINCT x->>'id') INTO n FROM jsonb_array_elements(p_modifiche) x;
  IF n<>jsonb_array_length(p_modifiche) THEN RAISE EXCEPTION 'Riga ripetuta' USING ERRCODE='22023'; END IF;
  FOR modifica IN SELECT value FROM jsonb_array_elements(p_modifiche) LOOP
    IF jsonb_typeof(modifica->'patch') IS DISTINCT FROM 'object' OR EXISTS (
      SELECT 1 FROM jsonb_object_keys(modifica->'patch') k WHERE k NOT IN
        ('day_of_week','dish_id','portion_g','kcal','protein_g','fibre_g','sat_fat_g','salt_g',
         'stato','spostato_da_giorno','sostituito_da_dish_id','modificato_il','ripristino_salto','bloccato')
    ) THEN RAISE EXCEPTION 'Campo non ammesso' USING ERRCODE='22023'; END IF;
    IF modifica->'patch' ? 'bloccato' AND jsonb_typeof(modifica->'patch'->'bloccato') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Blocco non valido' USING ERRCODE='22023'; END IF;
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
      modificato_il=nuova.modificato_il,ripristino_salto=nuova.ripristino_salto,bloccato=nuova.bloccato WHERE id=originale.id;
  END LOOP;
  RETURN jsonb_build_object('ok',true,'righe_modificate',n);
END;
$$;
REVOKE ALL ON FUNCTION public.quadrio_modifica_piano_v2(uuid,uuid,jsonb,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_modifica_piano_v2(uuid,uuid,jsonb,jsonb,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
