-- Il profilo iniziale e tutti i dati del fabbisogno devono riuscire insieme.
-- Nessun dato storico viene riscritto durante l'installazione.
CREATE TRIGGER quadrio_generazione_allenamenti AFTER INSERT OR UPDATE OR DELETE ON public.training_sessions
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();
CREATE TRIGGER quadrio_generazione_attivita AFTER INSERT OR UPDATE OR DELETE ON public.activity_periods
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();
CREATE TRIGGER quadrio_generazione_consensi AFTER INSERT OR UPDATE OR DELETE ON public.consensi
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();

CREATE OR REPLACE FUNCTION public.quadrio_salva_onboarding_v1(
 p_user_id uuid,p_contesto jsonb,p_profilo jsonb,p_misura jsonb,p_sport jsonb,p_vincoli jsonb,p_preferenze jsonb,p_target jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE u public.users%ROWTYPE; nuova public.users%ROWTYPE; misura public.body_measurements%ROWTYPE;
 versione_attuale bigint; consenso text; inserito uuid; elemento jsonb;
BEGIN
 SELECT * INTO u FROM public.users WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Utente non disponibile' USING ERRCODE='42501'; END IF;
 INSERT INTO quadrio_internal.generazione_versioni(user_id,versione) VALUES(p_user_id,0) ON CONFLICT DO NOTHING;
 SELECT versione INTO versione_attuale FROM quadrio_internal.generazione_versioni WHERE user_id=p_user_id FOR UPDATE;
 IF jsonb_typeof(p_contesto) IS DISTINCT FROM 'object' OR jsonb_typeof(p_contesto->'versione') IS DISTINCT FROM 'string'
  OR (p_contesto->>'versione') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Contesto non valido' USING ERRCODE='22023'; END IF;
 IF versione_attuale IS DISTINCT FROM (p_contesto->>'versione')::bigint THEN RAISE EXCEPTION 'Dati modificati' USING ERRCODE='PT409'; END IF;
 IF jsonb_typeof(p_profilo) IS DISTINCT FROM 'object' OR jsonb_typeof(p_misura) IS DISTINCT FROM 'object'
  OR jsonb_typeof(p_target) IS DISTINCT FROM 'object' OR jsonb_typeof(p_sport) IS DISTINCT FROM 'array'
  OR jsonb_typeof(p_vincoli) IS DISTINCT FROM 'array' OR jsonb_typeof(p_preferenze) IS DISTINCT FROM 'array' THEN
  RAISE EXCEPTION 'Dati non validi' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_profilo) k WHERE k NOT IN
  ('sex','birth_year','height_cm','city','region_zone','goal','pasti_casa','cook_days','lunch_away','household_size','evening_minutes','diet','paesi','occupation_level'))
  OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_misura) k WHERE k NOT IN ('measured_on','weight_kg','source','body_fat_pct'))
  OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_target) k WHERE k NOT IN
  ('user_id','computed_at','kcal','protein_g_min','fibre_g_min','sat_fat_g_max','free_sugar_g_max','salt_g_max','method','confidence','tdee_predetto','notes')) THEN
  RAISE EXCEPTION 'Campo non ammesso' USING ERRCODE='22023'; END IF;
 IF (p_target->>'user_id')::uuid IS DISTINCT FROM p_user_id OR EXISTS(
  SELECT 1 FROM unnest(ARRAY['kcal','protein_g_min','fibre_g_min','sat_fat_g_max','free_sugar_g_max','salt_g_max','tdee_predetto']) k
  WHERE jsonb_typeof(p_target->k) IS DISTINCT FROM 'number' OR (p_target->>k)::numeric<0
 ) OR (p_target->>'kcal')::numeric<=0 THEN RAISE EXCEPTION 'Target non valido' USING ERRCODE='22023'; END IF;
 SELECT * INTO nuova FROM jsonb_populate_record(u,p_profilo);
 SELECT * INTO misura FROM jsonb_populate_record(NULL::public.body_measurements,p_misura);
 IF coalesce(nuova.sex,'') NOT IN ('M','F') OR coalesce(nuova.goal,'') NOT IN ('dimagrimento','mantenimento','massa')
  OR coalesce(nuova.occupation_level,'') NOT IN ('sedentario','in_piedi','fisico','molto_fisico')
  OR misura.measured_on IS NULL OR misura.weight_kg IS NULL OR misura.weight_kg<=0
  OR misura.weight_kg IN ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) OR misura.source IS DISTINCT FROM 'utente' THEN
  RAISE EXCEPTION 'Profilo o misura non validi' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(p_preferenze) NOT BETWEEN 1 AND 5 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_preferenze) x
   WHERE jsonb_typeof(x) IS DISTINCT FROM 'string' OR x#>>'{}' NOT IN ('europea','usa','asiatica','sud_americana','australiana'))
  OR (SELECT count(DISTINCT x) FROM jsonb_array_elements(p_preferenze) x)<>jsonb_array_length(p_preferenze) THEN
  RAISE EXCEPTION 'Preferenze non valide' USING ERRCODE='22023'; END IF;
 FOR elemento IN SELECT value FROM jsonb_array_elements(p_sport) LOOP
  IF jsonb_typeof(elemento) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(elemento) k WHERE k NOT IN ('activity','intensity','minutes_per_week'))
   OR coalesce(elemento->>'activity','') NOT IN ('camminata','corsa','ciclismo','pesi','nuoto','squadra','hiit','yoga')
   OR coalesce(elemento->>'intensity','') NOT IN ('leggera','moderata','intensa') OR jsonb_typeof(elemento->'minutes_per_week') IS DISTINCT FROM 'number'
   OR (elemento->>'minutes_per_week')::numeric NOT BETWEEN 0 AND 1200 OR mod((elemento->>'minutes_per_week')::numeric,1)<>0 THEN RAISE EXCEPTION 'Allenamento non valido' USING ERRCODE='22023'; END IF;
 END LOOP;
 FOR elemento IN SELECT value FROM jsonb_array_elements(p_vincoli) LOOP
  IF jsonb_typeof(elemento) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(elemento) k WHERE k NOT IN
    ('user_id','kind','subject','severity','declared_at','food_id','categoria'))
   OR (elemento->>'user_id')::uuid IS DISTINCT FROM p_user_id OR coalesce(elemento->>'kind','') NOT IN ('allergia','intolleranza','non_gradito','preferenza')
   OR coalesce(elemento->>'severity','') NOT IN ('assoluto','preferibile') OR length(btrim(coalesce(elemento->>'subject',''))) NOT BETWEEN 1 AND 80 THEN
   RAISE EXCEPTION 'Vincolo non valido' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_vincoli) v WHERE v->>'kind' IN ('allergia','intolleranza')) THEN
  SELECT c.stato INTO consenso FROM public.consensi c WHERE c.user_id=p_user_id AND c.tipo='dati_sanitari'
   ORDER BY c.registrato_at DESC,c.stato DESC,c.id DESC LIMIT 1;
  IF consenso IS DISTINCT FROM 'accettato' THEN RAISE EXCEPTION 'Consenso mancante' USING ERRCODE='PT403'; END IF;
 END IF;
 UPDATE public.users SET sex=nuova.sex,birth_year=nuova.birth_year,height_cm=nuova.height_cm,city=nuova.city,region_zone=nuova.region_zone,
  goal=nuova.goal,pasti_casa=nuova.pasti_casa,cook_days=nuova.cook_days,lunch_away=nuova.lunch_away,household_size=nuova.household_size,
  evening_minutes=nuova.evening_minutes,diet=nuova.diet,paesi=nuova.paesi,occupation_level=nuova.occupation_level WHERE id=p_user_id;
 DELETE FROM public.training_sessions WHERE user_id=p_user_id;
 INSERT INTO public.training_sessions(user_id,activity,intensity,minutes_per_week)
  SELECT p_user_id,v->>'activity',v->>'intensity',(v->>'minutes_per_week')::numeric FROM jsonb_array_elements(p_sport) v;
 INSERT INTO public.body_measurements(user_id,measured_on,weight_kg,source,body_fat_pct)
  VALUES(p_user_id,misura.measured_on,misura.weight_kg,misura.source,misura.body_fat_pct)
  ON CONFLICT(user_id,measured_on) DO UPDATE SET weight_kg=excluded.weight_kg,source=excluded.source,body_fat_pct=excluded.body_fat_pct;
 -- Le esclusioni preesistenti si conservano: questo flusso non e' una
 -- revoca delle allergie gia' dichiarate. Le nuove vengono aggiunte insieme.
 INSERT INTO public.user_constraints(user_id,kind,subject,severity,declared_at,food_id,categoria)
  SELECT p_user_id,v->>'kind',v->>'subject',v->>'severity',(v->>'declared_at')::timestamptz,v->>'food_id',v->>'categoria'
  FROM jsonb_array_elements(p_vincoli) v;
 DELETE FROM public.user_cuisine_preferences WHERE user_id=p_user_id;
 INSERT INTO public.user_cuisine_preferences(user_id,cucina,rank)
  SELECT p_user_id,v#>>'{}',n::integer FROM jsonb_array_elements(p_preferenze) WITH ORDINALITY AS x(v,n);
 INSERT INTO public.energy_targets(user_id,computed_at,kcal,protein_g_min,fibre_g_min,sat_fat_g_max,free_sugar_g_max,salt_g_max,method,confidence,tdee_predetto,notes)
  VALUES(p_user_id,(p_target->>'computed_at')::timestamptz,(p_target->>'kcal')::numeric,(p_target->>'protein_g_min')::numeric,
   (p_target->>'fibre_g_min')::numeric,(p_target->>'sat_fat_g_max')::numeric,(p_target->>'free_sugar_g_max')::numeric,
   (p_target->>'salt_g_max')::numeric,p_target->>'method',p_target->>'confidence',(p_target->>'tdee_predetto')::numeric,p_target->>'notes') RETURNING id INTO inserito;
 RETURN jsonb_build_object('ok',true,'target_id',inserito);
END;
$$;
REVOKE ALL ON FUNCTION public.quadrio_salva_onboarding_v1(uuid,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_salva_onboarding_v1(uuid,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
