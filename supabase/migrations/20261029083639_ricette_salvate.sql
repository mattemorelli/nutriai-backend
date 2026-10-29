-- Solo nuove generazioni e sostituzioni esplicite. Non attribuisce una
-- versione storica ai piani esistenti e non riscrive ricette o alimenti.
CREATE TABLE public.recipe_snapshots (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 catalogo_id uuid NOT NULL,
 catalogo_versione bigint NOT NULL CHECK(catalogo_versione>=0),
 dish_id uuid NOT NULL,
 ricetta jsonb NOT NULL CHECK(jsonb_typeof(ricetta)='object'),
 creato_il timestamptz NOT NULL DEFAULT now(),
 UNIQUE(catalogo_id,catalogo_versione,dish_id)
);
ALTER TABLE public.recipe_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.recipe_snapshots FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT ON TABLE public.recipe_snapshots TO service_role;
ALTER TABLE public.plan_items ADD COLUMN recipe_snapshot_id uuid REFERENCES public.recipe_snapshots(id);
CREATE INDEX plan_items_recipe_snapshot_id_idx ON public.plan_items(recipe_snapshot_id) WHERE recipe_snapshot_id IS NOT NULL;
ALTER TABLE public.plans ADD COLUMN catalogo_origine jsonb;

CREATE FUNCTION quadrio_internal.salva_ricetta(p_dish_id uuid,p_contesto jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE risultato uuid; contenuto jsonb;
BEGIN
 PERFORM quadrio_internal.blocca_catalogo_attuale(p_contesto);
 SELECT id INTO risultato FROM public.recipe_snapshots
  WHERE catalogo_id=(p_contesto->>'catalogo_id')::uuid
  AND catalogo_versione=(p_contesto->>'catalogo_versione')::bigint AND dish_id=p_dish_id;
 IF risultato IS NOT NULL THEN RETURN risultato; END IF;
 SELECT jsonb_build_object('piatto',to_jsonb(d),
  'ingredienti',(SELECT jsonb_agg(to_jsonb(i)||jsonb_build_object('foods',to_jsonb(f)) ORDER BY i.food_id)
    FROM public.dish_ingredients i JOIN public.foods f ON f.id=i.food_id WHERE i.dish_id=d.id),
  'passi',coalesce((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.ordine) FROM public.ricetta_passi p WHERE p.dish_id=d.id),'[]'::jsonb),
  'info',(SELECT to_jsonb(i) FROM public.ricetta_info i WHERE i.dish_id=d.id),
  'categorie',coalesce((SELECT jsonb_agg(to_jsonb(c) ORDER BY c.food_id,c.categoria) FROM public.categorie_alimenti c
    WHERE EXISTS(SELECT 1 FROM public.dish_ingredients i WHERE i.dish_id=d.id AND i.food_id=c.food_id)),'[]'::jsonb),
  'tag',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.food_id,t.tag) FROM public.tag_nutrizionali t
    WHERE EXISTS(SELECT 1 FROM public.dish_ingredients i WHERE i.dish_id=d.id AND i.food_id=t.food_id)),'[]'::jsonb),
  'catalogo',jsonb_build_object('id',p_contesto->>'catalogo_id','versione',p_contesto->>'catalogo_versione'))
 INTO contenuto FROM public.dishes d WHERE d.id=p_dish_id;
 IF contenuto IS NULL OR jsonb_typeof(contenuto->'ingredienti') IS DISTINCT FROM 'array'
  OR jsonb_array_length(contenuto->'ingredienti')=0
  OR jsonb_array_length(contenuto->'ingredienti') IS DISTINCT FROM (SELECT count(*) FROM public.dish_ingredients WHERE dish_id=p_dish_id)
  OR EXISTS(SELECT 1 FROM jsonb_array_elements(contenuto->'ingredienti') i WHERE (i->>'grams')::numeric<=0 OR i->>'grams' IN ('NaN','Infinity','-Infinity')) THEN
  RAISE EXCEPTION 'Ricetta non verificabile' USING ERRCODE='22023'; END IF;
 INSERT INTO public.recipe_snapshots(catalogo_id,catalogo_versione,dish_id,ricetta)
 VALUES((p_contesto->>'catalogo_id')::uuid,(p_contesto->>'catalogo_versione')::bigint,p_dish_id,contenuto)
 ON CONFLICT(catalogo_id,catalogo_versione,dish_id) DO NOTHING RETURNING id INTO risultato;
 IF risultato IS NULL THEN
  SELECT id INTO risultato FROM public.recipe_snapshots WHERE catalogo_id=(p_contesto->>'catalogo_id')::uuid
   AND catalogo_versione=(p_contesto->>'catalogo_versione')::bigint AND dish_id=p_dish_id;
 END IF;
 RETURN risultato;
END;
$$;
REVOKE ALL ON FUNCTION quadrio_internal.salva_ricetta(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION quadrio_internal.salva_ricetta(uuid,jsonb) TO service_role;

CREATE FUNCTION public.quadrio_salva_generazione_v3(p_user_id uuid,p_contesto jsonb,p_piano jsonb,p_righe jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE risultato jsonb; piatto uuid;
BEGIN
 risultato:=public.quadrio_salva_generazione_v2(p_user_id,p_contesto,p_piano,p_righe);
 -- Ordinamento comune a tutte le transazioni: evita l'inversione dei
 -- lock univoci quando utenti diversi scelgono gli stessi piatti.
 FOR piatto IN SELECT DISTINCT (r->>'dish_id')::uuid FROM jsonb_array_elements(p_righe) r ORDER BY 1 LOOP
  PERFORM quadrio_internal.salva_ricetta(piatto,p_contesto);
 END LOOP;
 UPDATE public.plan_items i SET recipe_snapshot_id=s.id FROM public.recipe_snapshots s
 WHERE i.plan_id=(risultato->>'id')::uuid AND s.dish_id=i.dish_id
  AND s.catalogo_id=(p_contesto->>'catalogo_id')::uuid AND s.catalogo_versione=(p_contesto->>'catalogo_versione')::bigint;
 UPDATE public.plans SET catalogo_origine=jsonb_build_object('id',p_contesto->>'catalogo_id','versione',p_contesto->>'catalogo_versione')
 WHERE id=(risultato->>'id')::uuid;
 RETURN risultato;
END;
$$;
REVOKE ALL ON FUNCTION public.quadrio_salva_generazione_v3(uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_salva_generazione_v3(uuid,jsonb,jsonb,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.quadrio_modifica_piano_v3(
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

 -- Catalogo prima dei dati personali: un aggiornamento del catalogo
 -- prende lo stesso lock PRIMA di modificare ingredienti o allergeni.
 PERFORM 1 FROM quadrio_internal.catalogo_versione WHERE id=1 FOR SHARE;
 IF jsonb_typeof(p_contesto->'catalogo_id') IS DISTINCT FROM 'string'
  OR jsonb_typeof(p_contesto->'catalogo_versione') IS DISTINCT FROM 'string'
  OR (p_contesto->>'catalogo_versione') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Catalogo non verificato' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM quadrio_internal.catalogo_versione c WHERE c.id=1
  AND c.catalogo_id::text=p_contesto->>'catalogo_id' AND c.versione::text=p_contesto->>'catalogo_versione') THEN
  RAISE EXCEPTION 'Catalogo modificato' USING ERRCODE='PT410'; END IF;
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
    UPDATE public.plan_items SET
      -- Compatibilita' durante il rilascio: un server precedente che
      -- sostituisce la ricetta non puo' lasciarle la copia della vecchia.
      recipe_snapshot_id=CASE WHEN
       (originale.dish_id,originale.portion_g,originale.kcal,originale.protein_g,originale.fibre_g,originale.sat_fat_g,originale.salt_g)
        IS DISTINCT FROM (nuova.dish_id,nuova.portion_g,nuova.kcal,nuova.protein_g,nuova.fibre_g,nuova.sat_fat_g,nuova.salt_g)
       THEN NULL ELSE originale.recipe_snapshot_id END,
      day_of_week=nuova.day_of_week,dish_id=nuova.dish_id,portion_g=nuova.portion_g,
      kcal=nuova.kcal,protein_g=nuova.protein_g,fibre_g=nuova.fibre_g,sat_fat_g=nuova.sat_fat_g,salt_g=nuova.salt_g,
      stato=nuova.stato,spostato_da_giorno=nuova.spostato_da_giorno,sostituito_da_dish_id=nuova.sostituito_da_dish_id,
      modificato_il=nuova.modificato_il,ripristino_salto=nuova.ripristino_salto,bloccato=nuova.bloccato WHERE id=originale.id;
  END LOOP;
  RETURN jsonb_build_object('ok',true,'righe_modificate',n);
END;
$$;
REVOKE ALL ON FUNCTION public.quadrio_modifica_piano_v3(uuid,uuid,jsonb,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_modifica_piano_v3(uuid,uuid,jsonb,jsonb,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';

CREATE FUNCTION public.quadrio_modifica_piano_v4(p_user_id uuid,p_plan_id uuid,p_attese jsonb,p_modifiche jsonb,p_contesto jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE risultato jsonb; piatto uuid;
BEGIN
 risultato:=public.quadrio_modifica_piano_v3(p_user_id,p_plan_id,p_attese,p_modifiche,p_contesto);
 FOR piatto IN SELECT DISTINCT i.dish_id FROM public.plan_items i JOIN jsonb_array_elements(p_modifiche) m ON i.id=(m->>'id')::uuid
  WHERE i.plan_id=p_plan_id AND (m->'patch') ?| ARRAY['dish_id','portion_g','kcal','protein_g','fibre_g','sat_fat_g','salt_g'] ORDER BY 1 LOOP
  PERFORM quadrio_internal.salva_ricetta(piatto,p_contesto);
 END LOOP;
 UPDATE public.plan_items i SET recipe_snapshot_id=s.id FROM public.recipe_snapshots s,jsonb_array_elements(p_modifiche) m
 WHERE i.plan_id=p_plan_id AND i.id=(m->>'id')::uuid
  AND (m->'patch') ?| ARRAY['dish_id','portion_g','kcal','protein_g','fibre_g','sat_fat_g','salt_g']
  AND s.dish_id=i.dish_id AND s.catalogo_id=(p_contesto->>'catalogo_id')::uuid
  AND s.catalogo_versione=(p_contesto->>'catalogo_versione')::bigint;
 RETURN risultato;
END;
$$;
REVOKE ALL ON FUNCTION public.quadrio_modifica_piano_v4(uuid,uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_modifica_piano_v4(uuid,uuid,jsonb,jsonb,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
