-- Stessi proprietari, ruoli e comandi. auth.uid() valutato una volta per
-- istruzione, invece di ripeterlo per ogni riga esaminata.
ALTER POLICY "profilo proprio: lettura" ON public.users USING ((SELECT auth.uid())=id);
ALTER POLICY "profilo proprio: modifica" ON public.users USING ((SELECT auth.uid())=id);
ALTER POLICY "propri allenamenti" ON public.training_sessions USING ((SELECT auth.uid())=user_id) WITH CHECK ((SELECT auth.uid())=user_id);
ALTER POLICY "solo i propri" ON public.pantry_items USING ((SELECT auth.uid())=user_id);
ALTER POLICY "consensi_propri" ON public.consensi USING ((SELECT auth.uid())=user_id);
ALTER POLICY "dispositivi_propri" ON public.dispositivi USING ((SELECT auth.uid())=user_id);
ALTER POLICY "solo i propri" ON public.scorte_settimana USING ((SELECT auth.uid())=user_id);
NOTIFY pgrst,'reload schema';
