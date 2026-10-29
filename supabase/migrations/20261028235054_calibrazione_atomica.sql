-- Anche i dati sorgente della calibrazione invalidano decisioni in corso.
-- Nessun peso, consumo o target esistente viene riscritto.
CREATE TRIGGER quadrio_generazione_pesi AFTER INSERT OR UPDATE OR DELETE ON public.body_measurements
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();
CREATE TRIGGER quadrio_generazione_introiti AFTER INSERT OR UPDATE OR DELETE ON public.intake_estimates
 FOR EACH ROW EXECUTE FUNCTION quadrio_internal.registra_contesto_generazione();

CREATE OR REPLACE FUNCTION public.quadrio_salva_calibrazione_v1(
 p_user_id uuid,p_contesto jsonb,p_target_id uuid,p_target jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE versione_attuale bigint; ultimo public.energy_targets%ROWTYPE; inserito uuid;
BEGIN
 PERFORM 1 FROM public.users WHERE id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Utente non disponibile' USING ERRCODE='42501'; END IF;
 INSERT INTO quadrio_internal.generazione_versioni(user_id,versione) VALUES(p_user_id,0) ON CONFLICT DO NOTHING;
 SELECT versione INTO versione_attuale FROM quadrio_internal.generazione_versioni WHERE user_id=p_user_id FOR UPDATE;
 IF jsonb_typeof(p_contesto) IS DISTINCT FROM 'object' OR jsonb_typeof(p_contesto->'versione') IS DISTINCT FROM 'string'
  OR (p_contesto->>'versione') !~ '^[0-9]+$' THEN RAISE EXCEPTION 'Contesto non valido' USING ERRCODE='22023'; END IF;
 IF versione_attuale IS DISTINCT FROM (p_contesto->>'versione')::bigint THEN
  RAISE EXCEPTION 'Dati modificati' USING ERRCODE='PT409'; END IF;
 SELECT * INTO ultimo FROM public.energy_targets WHERE user_id=p_user_id ORDER BY computed_at DESC,id DESC LIMIT 1;
 IF ultimo.id IS DISTINCT FROM p_target_id OR ultimo.id IS NULL THEN RAISE EXCEPTION 'Target modificato' USING ERRCODE='PT409'; END IF;
 IF jsonb_typeof(p_target) IS DISTINCT FROM 'object' OR EXISTS(SELECT 1 FROM jsonb_object_keys(p_target) k WHERE k NOT IN
  ('computed_at','kcal','confidence','tdee_predetto','tdee_misurato','giorni_dati','notes')) THEN
  RAISE EXCEPTION 'Target non valido' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(ARRAY['kcal','tdee_predetto','tdee_misurato','giorni_dati']) k
  WHERE jsonb_typeof(p_target->k) IS DISTINCT FROM 'number' OR (p_target->>k)::numeric<=0)
  OR (p_target->>'giorni_dati')::numeric NOT BETWEEN 10 AND 29
  OR mod((p_target->>'giorni_dati')::numeric,1)<>0
  OR coalesce(p_target->>'confidence','') NOT IN ('media','alta')
  OR nullif(p_target->>'computed_at','') IS NULL THEN RAISE EXCEPTION 'Valori non validi' USING ERRCODE='22023'; END IF;
 INSERT INTO public.energy_targets(user_id,computed_at,kcal,protein_g_min,fibre_g_min,sat_fat_g_max,free_sugar_g_max,salt_g_max,
  method,confidence,guardrail_hit,input_window_days,notes,tdee_predetto,tdee_misurato,giorni_dati)
 VALUES(p_user_id,(p_target->>'computed_at')::timestamptz,(p_target->>'kcal')::numeric,ultimo.protein_g_min,ultimo.fibre_g_min,
  ultimo.sat_fat_g_max,ultimo.free_sugar_g_max,ultimo.salt_g_max,'calibrato',p_target->>'confidence',ultimo.guardrail_hit,
  ultimo.input_window_days,p_target->>'notes',(p_target->>'tdee_predetto')::numeric,(p_target->>'tdee_misurato')::numeric,
  (p_target->>'giorni_dati')::integer) RETURNING id INTO inserito;
 RETURN jsonb_build_object('ok',true,'target_id',inserito);
END;
$$;
REVOKE ALL ON FUNCTION public.quadrio_salva_calibrazione_v1(uuid,jsonb,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.quadrio_salva_calibrazione_v1(uuid,jsonb,uuid,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
