-- Anche istruzioni Cook e preparazioni anticipate appartengono al catalogo.
-- Nessuna ricetta o riga esistente viene riscritta.
CREATE TRIGGER quadrio_catalogo_ricetta_passi BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.ricetta_passi
 FOR EACH STATEMENT EXECUTE FUNCTION quadrio_internal.registra_contesto_catalogo();
CREATE TRIGGER quadrio_catalogo_ricetta_info BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.ricetta_info
 FOR EACH STATEMENT EXECUTE FUNCTION quadrio_internal.registra_contesto_catalogo();
NOTIFY pgrst,'reload schema';
