-- Dati pubblici di riferimento, senza dati personali: restano leggibili.
-- Scritture soltanto dal backend. Nessun valore o criterio viene riscritto.
DO $quadrio$
DECLARE tabella text; colonna text;
BEGIN
 FOREACH tabella IN ARRAY ARRAY['alias_categoria','categorie_alimenti','tag_nutrizionali','assi_voto','categorie','criteri_voto','impatto_categorie','marche','prodotti','punteggi_marca','rilevazioni_prezzi','voto_componenti','voto_modificatori','voto_pesi'] LOOP
  EXECUTE format('REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE public.%I FROM PUBLIC,anon,authenticated',tabella);
  FOR colonna IN SELECT a.attname FROM pg_catalog.pg_attribute a
   WHERE a.attrelid=format('public.%I',tabella)::regclass AND a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL LOOP
   EXECUTE format('REVOKE INSERT(%I),UPDATE(%I),REFERENCES(%I) ON TABLE public.%I FROM PUBLIC,anon,authenticated',colonna,colonna,colonna,tabella);
  END LOOP;
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tabella);
  EXECUTE format('CREATE POLICY quadrio_catalogo_lettura ON public.%I FOR SELECT TO anon,authenticated USING(true)',tabella);
 END LOOP;
END;
$quadrio$;
NOTIFY pgrst,'reload schema';
