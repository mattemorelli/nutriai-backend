-- Migrazione 2026-10-22 (sera, terza di oggi): 3 accompagnamenti "pane"
-- senza glutine in più, sempre disponibili per il ruolo di base amidacea
-- a pranzo/cena. NON ESEGUITA sul database vero.
--
-- Perché: dopo le due migrazioni precedenti di oggi (categorie vere
-- pane/patate + i 9 accompagnamenti reali), chi ha il glutine come
-- vincolo assoluto aveva comunque un solo accompagnamento "morbido"
-- disponibile ("Pane senza glutine") - un piatto solo per tutta la
-- settimana, sia a pranzo sia a cena. Simulato stanotte senza scrivere
-- nulla, insieme alla correzione del contorno di emergenza a pranzo (che
-- prima era sempre "pane" a prescindere dal secondo, ora segue la stessa
-- regola "pane o patate secondo il secondo" della cena, vedi genera.js):
-- con seed 42, le combinazioni onnivoro+glutine e pescetariano+glutine
-- (comprese le varianti con lattosio/frutta a guscio) passano tutte da
-- FALLITO a riuscite; confermato anche con seed 7. Vegetariano/vegano con
-- glutine restano FALLITI: un problema diverso e separato (vedi l'analisi
-- della regola sulla varietà dei secondi, non toccata da questa
-- migrazione).
--
-- Sono piatti REALI come gli altri 9 (stesso schema, stesso profilo
-- 'neutro', stesso base_amidacea=true): gallette di riso e "polenta" (il
-- prodotto già cotto) erano già alimenti presenti in foods, usati altrove
-- nel catalogo come ingrediente di una colazione e di un primo esistenti
-- - qui diventano ANCHE un contorno a sé stante. Nessuna di queste due
-- modifiche tocca quei piatti esistenti: la categoria 'pane' qui sotto
-- serve solo a genera.js per riconoscere il NUOVO contorno come tale,
-- "tipoAmido" non è letto da nessun altro punto del codice (verificato:
-- solo candidatiContorno/candidatiBase/candidatiBasePranzo in genera.js
-- lo consultano, mai sostituisci.js o spesa.js).
--
-- Grammature: porzione CREA di gallette/cracker (20-25g, qui 25g) per le
-- due gallette di riso; porzione CREA di un contorno di polenta (150-
-- 200g, qui 200g, come le patate in padella/purè a 220g del lotto
-- precedente) per la polenta.
--
-- Richiede che 2026-10-22-categorie-pane-patate.sql e
-- 2026-10-22-accompagnamenti-pane-patate.sql siano GIA' applicate.
--
-- ORDINE DI LANCIO:
--   1. node migrazioni/backup-2026-10-22-accompagnamenti-pane-senza-glutine.js
--   2. questo file
--   3. node verifica-tipo-amido.js (deve continuare a dare esito positivo)
--   4. se qualcosa non va: rollback-2026-10-22-accompagnamenti-pane-senza-glutine.sql

insert into public.categorie_alimenti (categoria, food_id) values
  ('pane', 'gallette_riso_it'),
  ('pane', '167557'),
  ('pane', 'polenta_it')
on conflict (categoria, food_id) do nothing;

insert into public.dishes (
  id, name, name_en, meal_slot, cucina, profilo, famiglia, ha_amido, ha_proteina,
  prep_min, occasione, tecnica, health_score, salsa_industriale, base_amidacea,
  trasportabile, contiene_glutine, contiene_lattosio, contiene_frutta_secca,
  paese, ruolo_primario, ruoli_coperti, mercati, steps, steps_en
) values
  ('9560b1b7-e1d6-40f2-9331-788dee9b6208', 'Gallette di riso', 'Rice cakes', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 1, 'quotidiano', 'semplice', 7, false, true, true, false, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Servi le gallette di riso."]'::jsonb, '["Serve the rice cakes."]'::jsonb),
  ('a27106fb-e60f-44c7-86f8-faa8ac121ce4', 'Gallette di riso al sesamo', 'Sesame rice cakes', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 1, 'quotidiano', 'semplice', 7, false, true, true, false, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Servi le gallette di riso al sesamo."]'::jsonb, '["Serve the sesame rice cakes."]'::jsonb),
  ('0e1b7e2e-769e-4dbb-aded-fee28989712f', 'Polenta', 'Polenta', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 5, 'quotidiano', 'padella', 7, false, true, true, false, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Scalda la polenta già cotta in padella con un filo d''olio per 5 minuti, o al microonde."]'::jsonb,
   '["Warm the pre-cooked polenta in a pan with a little oil for 5 minutes, or in the microwave."]'::jsonb)
on conflict (id) do nothing;

insert into public.dish_ingredients (dish_id, food_id, grams) values
  ('9560b1b7-e1d6-40f2-9331-788dee9b6208', 'gallette_riso_it', 25),
  ('a27106fb-e60f-44c7-86f8-faa8ac121ce4', '167557', 25),
  ('0e1b7e2e-769e-4dbb-aded-fee28989712f', 'polenta_it', 200)
on conflict (dish_id, food_id) do nothing;

-- Verifica rapida da eseguire a mano dopo il lancio:
-- select id, name, health_score from dishes where id in (
--   '9560b1b7-e1d6-40f2-9331-788dee9b6208','a27106fb-e60f-44c7-86f8-faa8ac121ce4',
--   '0e1b7e2e-769e-4dbb-aded-fee28989712f'
-- );
-- Atteso: 3 righe.
-- select categoria, count(*) from categorie_alimenti where categoria = 'pane' and food_id in ('gallette_riso_it','167557','polenta_it') group by categoria;
-- Atteso: pane=3.
