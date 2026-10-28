-- Aggiornamenti peso/profilo e target nella stessa transazione.
-- Nessun dato storico viene riscritto durante l'installazione.
CREATE OR REPLACE FUNCTION public.quadrio_salva_fabbisogno_v1(
 p_user_id uuid,p_attese jsonb,p_profilo jsonb,p_misura jsonb,p_target jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
 u public.users%ROWTYPE;
 nuova public.users%ROWTYPE;
 misura public.body_measurements%ROWTYPE;
 m jsonb;
 sport jsonb;
 pal numeric;
 target_id uuid;
 inserito uuid;
 reale jsonb;
BEGIN
 SELECT * INTO u FROM public.users WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Utente non disponibile' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_attese) IS DISTINCT FROM 'object' OR jsonb_typeof(p_profilo) IS DISTINCT FROM 'object'
   OR jsonb_typeof(p_target) IS DISTINCT FROM 'object' OR (p_misura IS NOT NULL AND jsonb_typeof(p_misura) IS DISTINCT FROM 'object') THEN
  RAISE EXCEPTION 'Dati non validi' USING ERRCODE='22023';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(p_profilo) k WHERE k NOT IN
   ('goal','height_cm','birth_year','diet','cook_days','lunch_away','pasti_casa','household_size','evening_minutes','paesi','display_name','avatar_path','calendario_regola'))
   OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_target) k WHERE k NOT IN
   ('user_id','computed_at','kcal','protein_g_min','fibre_g_min','sat_fat_g_max','free_sugar_g_max','salt_g_max','method','confidence','tdee_predetto','notes')) THEN
  RAISE EXCEPTION 'Campo non ammesso' USING ERRCODE='22023';
 END IF;
 IF p_misura IS NOT NULL AND EXISTS(SELECT 1 FROM jsonb_object_keys(p_misura) k WHERE k NOT IN
   ('measured_on','weight_kg','body_fat_pct','source')) THEN
  RAISE EXCEPTION 'Campo misura non ammesso' USING ERRCODE='22023';
 END IF;
 SELECT jsonb_build_object('id',b.id,'measured_on',b.measured_on,'weight_kg',b.weight_kg,'body_fat_pct',b.body_fat_pct)
  INTO m FROM public.body_measurements b WHERE user_id=p_user_id ORDER BY measured_on DESC,id DESC LIMIT 1;
 SELECT coalesce(jsonb_agg(jsonb_build_object('activity',s.activity,'minutes_per_week',s.minutes_per_week,'intensity',s.intensity)
  ORDER BY s.activity,s.minutes_per_week,s.intensity),'[]'::jsonb) INTO sport FROM public.training_sessions s WHERE user_id=p_user_id;
 IF coalesce(u.occupation_level,'')='' THEN
  SELECT a.pal INTO pal FROM public.activity_periods a WHERE user_id=p_user_id ORDER BY valid_from DESC,id DESC LIMIT 1;
 END IF;
 SELECT e.id INTO target_id FROM public.energy_targets e WHERE user_id=p_user_id ORDER BY computed_at DESC,id DESC LIMIT 1;
 reale=jsonb_build_object('profilo',jsonb_build_object('sex',u.sex,'birth_year',u.birth_year,'height_cm',u.height_cm,'goal',u.goal,'occupation_level',u.occupation_level),
   'misura',m,'sport',sport,'pal',pal,'target_id',target_id);
 IF reale IS DISTINCT FROM p_attese THEN RAISE EXCEPTION 'Dati modificati' USING ERRCODE='PT409'; END IF;
 IF (p_target->>'user_id')::uuid IS DISTINCT FROM p_user_id OR EXISTS(
  SELECT 1 FROM unnest(ARRAY['kcal','protein_g_min','fibre_g_min','sat_fat_g_max','free_sugar_g_max','salt_g_max','tdee_predetto']) k
  WHERE jsonb_typeof(p_target->k) IS DISTINCT FROM 'number' OR (p_target->>k)::numeric<0
 ) OR (p_target->>'kcal')::numeric<=0 THEN RAISE EXCEPTION 'Target non valido' USING ERRCODE='22023'; END IF;
 SELECT * INTO nuova FROM jsonb_populate_record(u,p_profilo);
 IF p_profilo<>'{}'::jsonb THEN
  UPDATE public.users SET goal=nuova.goal,height_cm=nuova.height_cm,birth_year=nuova.birth_year,diet=nuova.diet,
   cook_days=nuova.cook_days,lunch_away=nuova.lunch_away,pasti_casa=nuova.pasti_casa,household_size=nuova.household_size,
   evening_minutes=nuova.evening_minutes,paesi=nuova.paesi,display_name=nuova.display_name,avatar_path=nuova.avatar_path,
   calendario_regola=nuova.calendario_regola WHERE id=p_user_id;
 END IF;
 IF p_misura IS NOT NULL THEN
  SELECT * INTO misura FROM jsonb_populate_record(NULL::public.body_measurements,p_misura);
  IF misura.measured_on IS NULL OR misura.weight_kg IS NULL OR misura.weight_kg<=0 OR misura.weight_kg IN ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric)
    OR misura.source IS DISTINCT FROM 'utente' THEN RAISE EXCEPTION 'Misura non valida' USING ERRCODE='22023'; END IF;
  INSERT INTO public.body_measurements(user_id,measured_on,weight_kg,body_fat_pct,source)
   VALUES(p_user_id,misura.measured_on,misura.weight_kg,misura.body_fat_pct,misura.source)
   ON CONFLICT(user_id,measured_on) DO UPDATE SET weight_kg=excluded.weight_kg,body_fat_pct=excluded.body_fat_pct,source=excluded.source;
 END IF;
 INSERT INTO public.energy_targets(user_id,computed_at,kcal,protein_g_min,fibre_g_min,sat_fat_g_max,free_sugar_g_max,salt_g_max,method,confidence,tdee_predetto,notes)
  VALUES(p_user_id,(p_target->>'computed_at')::timestamptz,(p_target->>'kcal')::numeric,(p_target->>'protein_g_min')::numeric,
   (p_target->>'fibre_g_min')::numeric,(p_target->>'sat_fat_g_max')::numeric,(p_target->>'free_sugar_g_max')::numeric,
   (p_target->>'salt_g_max')::numeric,p_target->>'method',p_target->>'confidence',(p_target->>'tdee_predetto')::numeric,p_target->>'notes') RETURNING id INTO inserito;
 RETURN jsonb_build_object('ok',true,'target_id',inserito);
END;
$$;
REVOKE ALL ON FUNCTION public.quadrio_salva_fabbisogno_v1(uuid,jsonb,jsonb,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_salva_fabbisogno_v1(uuid,jsonb,jsonb,jsonb,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
