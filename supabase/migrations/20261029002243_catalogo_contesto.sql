-- Metadati soltanto: nessuna ricetta o alimento esistente viene riscritto.
CREATE TABLE quadrio_internal.catalogo_versione (
 id smallint PRIMARY KEY CHECK(id=1),
 catalogo_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 versione bigint NOT NULL DEFAULT 0 CHECK(versione>=0)
);
INSERT INTO quadrio_internal.catalogo_versione(id) VALUES(1);
ALTER TABLE quadrio_internal.catalogo_versione ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE quadrio_internal.catalogo_versione FROM PUBLIC,anon,authenticated;
GRANT SELECT,UPDATE ON TABLE quadrio_internal.catalogo_versione TO service_role;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public.categorie_alimenti,public.tag_nutrizionali,public.alias_categoria FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION quadrio_internal.registra_contesto_catalogo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF current_setting('role',true) IN ('anon','authenticated') THEN RAISE EXCEPTION 'Catalogo in sola lettura' USING ERRCODE='42501'; END IF;
 UPDATE quadrio_internal.catalogo_versione SET versione=versione+1 WHERE id=1;
 RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION quadrio_internal.registra_contesto_catalogo() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION quadrio_internal.registra_contesto_catalogo() TO service_role;
CREATE TRIGGER quadrio_catalogo_dishes BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.dishes
 FOR EACH STATEMENT EXECUTE FUNCTION quadrio_internal.registra_contesto_catalogo();
CREATE TRIGGER quadrio_catalogo_dish_ingredients BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.dish_ingredients
 FOR EACH STATEMENT EXECUTE FUNCTION quadrio_internal.registra_contesto_catalogo();
CREATE TRIGGER quadrio_catalogo_foods BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.foods
 FOR EACH STATEMENT EXECUTE FUNCTION quadrio_internal.registra_contesto_catalogo();
CREATE TRIGGER quadrio_catalogo_categorie_alimenti BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.categorie_alimenti
 FOR EACH STATEMENT EXECUTE FUNCTION quadrio_internal.registra_contesto_catalogo();
CREATE TRIGGER quadrio_catalogo_tag_nutrizionali BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.tag_nutrizionali
 FOR EACH STATEMENT EXECUTE FUNCTION quadrio_internal.registra_contesto_catalogo();
CREATE TRIGGER quadrio_catalogo_alias_categoria BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.alias_categoria
 FOR EACH STATEMENT EXECUTE FUNCTION quadrio_internal.registra_contesto_catalogo();

CREATE OR REPLACE FUNCTION public.quadrio_contesto_catalogo_v1()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('catalogo_id',catalogo_id::text,'catalogo_versione',versione::text) FROM quadrio_internal.catalogo_versione WHERE id=1;
$$;
REVOKE ALL ON FUNCTION public.quadrio_contesto_catalogo_v1() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_contesto_catalogo_v1() TO service_role;
CREATE OR REPLACE FUNCTION public.quadrio_contesto_generazione_v2(p_user_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('versione',coalesce(v.versione,0)::text,'catalogo_id',c.catalogo_id::text,'catalogo_versione',c.versione::text)
 FROM public.users u LEFT JOIN quadrio_internal.generazione_versioni v ON v.user_id=u.id
 CROSS JOIN quadrio_internal.catalogo_versione c WHERE u.id=p_user_id AND c.id=1;
$$;
REVOKE ALL ON FUNCTION public.quadrio_contesto_generazione_v2(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_contesto_generazione_v2(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.quadrio_salva_generazione_v2(
 p_user_id uuid,p_contesto jsonb,p_piano jsonb,p_righe jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE attuale bigint; piano_id uuid; meta public.plans%ROWTYPE; n integer;
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
 -- Ordine dei lock coerente con il salvataggio atomico di peso/target.
 PERFORM 1 FROM public.users WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Utente non disponibile' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_contesto) IS DISTINCT FROM 'object' OR jsonb_typeof(p_contesto->'versione') IS DISTINCT FROM 'string'
   OR (p_contesto->>'versione') !~ '^[0-9]+$' OR jsonb_typeof(p_piano) IS DISTINCT FROM 'object'
   OR jsonb_typeof(p_righe) IS DISTINCT FROM 'array' OR jsonb_array_length(p_righe) NOT BETWEEN 7 AND 140 THEN
  RAISE EXCEPTION 'Dati generazione non validi' USING ERRCODE='22023';
 END IF;
 INSERT INTO quadrio_internal.generazione_versioni(user_id,versione) VALUES(p_user_id,0) ON CONFLICT DO NOTHING;
 SELECT versione INTO attuale FROM quadrio_internal.generazione_versioni WHERE user_id=p_user_id FOR UPDATE;
 IF attuale IS DISTINCT FROM (p_contesto->>'versione')::bigint THEN
  RAISE EXCEPTION 'Le scelte sono cambiate durante la generazione' USING ERRCODE='PT409';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_piano) k WHERE k NOT IN
  ('week_start','giorno_gratis','generated_at','energy_target_id','corpus_version','seed','gradino_raggiunto','concessioni','dieta','paesi'))
   OR jsonb_typeof(p_piano->'concessioni') IS DISTINCT FROM 'array'
   OR jsonb_typeof(p_piano->'paesi') IS DISTINCT FROM 'array'
   OR jsonb_typeof(p_piano->'corpus_version') IS DISTINCT FROM 'string' THEN
  RAISE EXCEPTION 'Campi piano non validi' USING ERRCODE='22023';
 END IF;
 SELECT * INTO meta FROM jsonb_populate_record(NULL::public.plans,p_piano);
 IF meta.week_start IS NULL OR meta.giorno_gratis IS NULL OR meta.giorno_gratis NOT BETWEEN 1 AND 7
   OR meta.corpus_version='' OR meta.generated_at IS NULL OR meta.seed IS NULL OR meta.seed NOT BETWEEN 0 AND 4294967295
   OR (meta.energy_target_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.energy_targets e WHERE e.id=meta.energy_target_id AND e.user_id=p_user_id)) THEN
  RAISE EXCEPTION 'Metadati piano non validi' USING ERRCODE='22023';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_righe) r WHERE jsonb_typeof(r) IS DISTINCT FROM 'object')
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_righe) r CROSS JOIN LATERAL jsonb_object_keys(r) k
    WHERE k NOT IN ('day_of_week','meal','slot','dish_id','portion_g','kcal','protein_g','sat_fat_g','fibre_g','salt_g','avanzi','bloccato'))
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_righe) r CROSS JOIN unnest(ARRAY['portion_g','kcal','protein_g','sat_fat_g','fibre_g','salt_g']) k
    WHERE jsonb_typeof(r->k) IS DISTINCT FROM 'number' OR (r->>k)::numeric<0)
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_righe) r WHERE (r->>'portion_g')::numeric<=0 OR (r->>'kcal')::numeric<=0
    OR jsonb_typeof(r->'day_of_week') IS DISTINCT FROM 'number' OR (r->>'day_of_week')::numeric NOT BETWEEN 1 AND 7
    OR (r->>'day_of_week')::numeric<>trunc((r->>'day_of_week')::numeric)
    OR jsonb_typeof(r->'meal') IS DISTINCT FROM 'string' OR jsonb_typeof(r->'slot') IS DISTINCT FROM 'string' OR jsonb_typeof(r->'dish_id') IS DISTINCT FROM 'string'
    OR jsonb_typeof(r->'avanzi') IS DISTINCT FROM 'boolean' OR jsonb_typeof(r->'bloccato') IS DISTINCT FROM 'boolean'
    OR NOT ((r->>'meal'='colazione' AND r->>'slot'='colazione') OR (r->>'meal'='spuntino' AND r->>'slot'='spuntino')
      OR (r->>'meal' IN ('pranzo','cena') AND r->>'slot' IN ('primo','secondo','contorno')))) THEN
  RAISE EXCEPTION 'Portate non valide' USING ERRCODE='22023';
 END IF;
 SELECT count(DISTINCT (r->>'day_of_week')::integer) INTO n FROM jsonb_array_elements(p_righe) r;
 IF n<>7 THEN RAISE EXCEPTION 'Settimana incompleta' USING ERRCODE='22023'; END IF;
 INSERT INTO public.plans(user_id,week_start,giorno_gratis,generated_at,energy_target_id,corpus_version,seed,gradino_raggiunto,concessioni,dieta,paesi)
 VALUES(p_user_id,meta.week_start,meta.giorno_gratis,meta.generated_at,meta.energy_target_id,meta.corpus_version,meta.seed,meta.gradino_raggiunto,meta.concessioni,meta.dieta,meta.paesi)
 RETURNING id INTO piano_id;
 INSERT INTO public.plan_items(plan_id,day_of_week,meal,slot,dish_id,portion_g,kcal,protein_g,sat_fat_g,fibre_g,salt_g,avanzi,bloccato)
 SELECT piano_id,r.day_of_week,r.meal,r.slot,r.dish_id,r.portion_g,r.kcal,r.protein_g,r.sat_fat_g,r.fibre_g,r.salt_g,r.avanzi,r.bloccato
 FROM jsonb_to_recordset(p_righe) AS r(day_of_week integer,meal text,slot text,dish_id uuid,portion_g numeric,kcal numeric,protein_g numeric,sat_fat_g numeric,fibre_g numeric,salt_g numeric,avanzi boolean,bloccato boolean);
 IF EXISTS(SELECT 1 FROM public.plan_items i JOIN public.dishes d ON d.id=i.dish_id WHERE i.plan_id=piano_id AND i.slot IS DISTINCT FROM d.meal_slot) THEN
  RAISE EXCEPTION 'Slot diverso dalla portata' USING ERRCODE='22023';
 END IF;
 RETURN jsonb_build_object('id',piano_id,'righe',jsonb_array_length(p_righe));
END;
$$;
REVOKE ALL ON FUNCTION public.quadrio_salva_generazione_v2(uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_salva_generazione_v2(uuid,jsonb,jsonb,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';

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
    UPDATE public.plan_items SET day_of_week=nuova.day_of_week,dish_id=nuova.dish_id,portion_g=nuova.portion_g,
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
