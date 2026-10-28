-- Le preferenze sono personali, non un catalogo pubblico. Nessuna riga
-- viene riscritta: il backend mantiene l'accesso, il client solo al proprietario.
ALTER TABLE public.user_cuisine_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.user_cuisine_preferences FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON TABLE public.user_cuisine_preferences TO authenticated;
GRANT ALL ON TABLE public.user_cuisine_preferences TO service_role;
CREATE POLICY quadrio_cucine_proprietario ON public.user_cuisine_preferences
 FOR ALL TO authenticated USING((SELECT auth.uid())=user_id) WITH CHECK((SELECT auth.uid())=user_id);

-- Il catalogo e' pubblico in lettura. Le scritture erano gia' riservate
-- al backend: la stessa intenzione e' ora esplicita anche sotto RLS.
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ricetta_passi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ricetta_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.azioni_cook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonality ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.dishes,public.foods,public.dish_ingredients,public.ricetta_passi,public.ricetta_info,public.azioni_cook,public.seasonality FROM PUBLIC,anon,authenticated;
GRANT SELECT ON TABLE public.dishes,public.foods,public.dish_ingredients,public.ricetta_passi,public.ricetta_info,public.azioni_cook,public.seasonality TO anon,authenticated;
GRANT ALL ON TABLE public.dishes,public.foods,public.dish_ingredients,public.ricetta_passi,public.ricetta_info,public.azioni_cook,public.seasonality TO service_role;
CREATE POLICY quadrio_catalogo_lettura ON public.dishes FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY quadrio_catalogo_lettura ON public.foods FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY quadrio_catalogo_lettura ON public.dish_ingredients FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY quadrio_catalogo_lettura ON public.ricetta_passi FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY quadrio_catalogo_lettura ON public.ricetta_info FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY quadrio_catalogo_lettura ON public.azioni_cook FOR SELECT TO anon,authenticated USING(true);
CREATE POLICY quadrio_catalogo_lettura ON public.seasonality FOR SELECT TO anon,authenticated USING(true);
NOTIFY pgrst,'reload schema';
