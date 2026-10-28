-- Nessun piano esistente viene riscritto. Solo metadati interni di versione.
CREATE SCHEMA IF NOT EXISTS quadrio_internal;
REVOKE ALL ON SCHEMA quadrio_internal FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA quadrio_internal TO service_role;
CREATE TABLE IF NOT EXISTS quadrio_internal.generazione_versioni (
 user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
 versione bigint NOT NULL DEFAULT 0 CHECK(versione>=0)
);
ALTER TABLE quadrio_internal.generazione_versioni ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE quadrio_internal.generazione_versioni FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE quadrio_internal.generazione_versioni TO service_role;

-- Trigger interno: necessario anche per le preferenze che un utente puo'
-- modificare direttamente sotto RLS. Non espone dati e non cambia proprieta'.
CREATE OR REPLACE FUNCTION quadrio_internal.registra_contesto_generazione()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid; sorgente jsonb;
BEGIN
 sorgente=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 IF TG_TABLE_NAME='users' THEN
  uid=(sorgente->>'id')::uuid;
  IF TG_OP='UPDATE' AND
    (to_jsonb(OLD)-ARRAY['display_name','avatar_path','reminder_onboarding_fatto','updated_at'])
      IS NOT DISTINCT FROM
    (to_jsonb(NEW)-ARRAY['display_name','avatar_path','reminder_onboarding_fatto','updated_at']) THEN RETURN NULL; END IF;
 ELSIF TG_TABLE_NAME='plan_items' THEN
  SELECT p.user_id INTO uid FROM public.plans p WHERE p.id=(sorgente->>'plan_id')::uuid;
 ELSE uid=(sorgente->>'user_id')::uuid;
 END IF;
 IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.users u WHERE u.id=uid) THEN RETURN NULL; END IF;
 -- Un chiamante autenticato puo' far avanzare solo il proprio contesto.
 -- I trigger di creazione account e il backend operano con ruoli interni.
 IF current_setting('role',true) IN ('authenticated','anon') AND auth.uid() IS DISTINCT FROM uid THEN
  RAISE EXCEPTION 'Contesto non autorizzato' USING ERRCODE='42501';
 END IF;
 INSERT INTO quadrio_internal.generazione_versioni AS v(user_id,versione) VALUES(uid,1)
  ON CONFLICT(user_id) DO UPDATE SET versione=v.versione+1;
 RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION quadrio_internal.registra_contesto_generazione() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION quadrio_internal.registra_contesto_generazione() TO service_role;

CREATE TRIGGER quadrio_generazione_users AFTER INSERT OR UPDATE ON public.users
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();
CREATE TRIGGER quadrio_generazione_vincoli AFTER INSERT OR UPDATE OR DELETE ON public.user_constraints
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();
CREATE TRIGGER quadrio_generazione_cucine AFTER INSERT OR UPDATE OR DELETE ON public.user_cuisine_preferences
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();
CREATE TRIGGER quadrio_generazione_target AFTER INSERT OR UPDATE OR DELETE ON public.energy_targets
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();
CREATE TRIGGER quadrio_generazione_esiti AFTER INSERT OR UPDATE OR DELETE ON public.meal_outcomes
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();
CREATE TRIGGER quadrio_generazione_piani AFTER INSERT OR UPDATE OR DELETE ON public.plans
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();
CREATE TRIGGER quadrio_generazione_righe AFTER INSERT OR UPDATE OR DELETE ON public.plan_items
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();

CREATE OR REPLACE FUNCTION public.quadrio_contesto_generazione_v1(p_user_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT jsonb_build_object('versione',coalesce(v.versione,0)::text)
 FROM public.users u LEFT JOIN quadrio_internal.generazione_versioni v ON v.user_id=u.id
 WHERE u.id=p_user_id;
$$;
REVOKE ALL ON FUNCTION public.quadrio_contesto_generazione_v1(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_contesto_generazione_v1(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.quadrio_salva_generazione_v1(
 p_user_id uuid,p_contesto jsonb,p_piano jsonb,p_righe jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE attuale bigint; piano_id uuid; meta public.plans%ROWTYPE; n integer;
BEGIN
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
REVOKE ALL ON FUNCTION public.quadrio_salva_generazione_v1(uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_salva_generazione_v1(uuid,jsonb,jsonb,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
