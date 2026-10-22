-- Migrazione 2026-10-22 (seconda, mattina): 9 accompagnamenti "pane"/
-- "patate" sempre disponibili per il ruolo di base amidacea a pranzo/cena.
-- NON ESEGUITA sul database vero.
--
-- Perche': dopo la Correzione 1 (categorie vere pane/patate, migrazione
-- precedente), il mercato Italia ha ancora solo ~1 piatto "pane" per un
-- utente senza glutine e un numero comunque ridotto di contorni patate -
-- non un piatto in piu' nel catalogo risolve questo, perche' pane e patate
-- in una cena italiana non sono "un piatto", sono una porzione semplice
-- sempre sul tavolo. Simulato stanotte senza scrivere nulla: porta la
-- matrice di prova da 6/108 a 45/108 successi (vedi RAPPORTO-NOTTE.md).
--
-- Sono piatti REALI come tutti gli altri (stesso schema, stesso profilo
-- 'neutro' che li rende disponibili a qualunque famiglia di cucina, stesso
-- base_amidacea=true che li fa riconoscere dalla regola "pane o patate a
-- cena" esistente, NON TOCCATA): nessuna modifica di codice e' necessaria
-- oltre a questa migrazione, genera.js li tratta come qualunque altro
-- contorno. Grammature e valori nutrizionali derivano dagli alimenti reali
-- in foods (pane_comune_crea, pane_integrale_it, pane_senza_glutine_it,
-- pane_segale_it, pane_carasau_it, 170028 patate) tramite dish_ingredients,
-- non sono scritti a mano.
--
-- Richiede che 2026-10-22-categorie-pane-patate.sql sia GIA' applicata
-- (altrimenti questi 9 piatti non verrebbero riconosciuti come pane/patate
-- piu' di quanto lo fossero gli altri prima di quella correzione).
--
-- ORDINE DI LANCIO (vedi RAPPORTO-NOTTE.md):
--   1. 2026-10-22-categorie-pane-patate.sql (se non gia' fatto)
--   2. node migrazioni/backup-2026-10-22-accompagnamenti.js
--   3. questo file
--   4. node verifica-tipo-amido.js (deve continuare a dare esito positivo,
--      ora anche con i 9 piatti nuovi nel conteggio)
--   5. se qualcosa non va: rollback-2026-10-22-accompagnamenti.sql

insert into public.dishes (
  id, name, name_en, meal_slot, cucina, profilo, famiglia, ha_amido, ha_proteina,
  prep_min, occasione, tecnica, health_score, salsa_industriale, base_amidacea,
  trasportabile, contiene_glutine, contiene_lattosio, contiene_frutta_secca,
  paese, ruolo_primario, ruoli_coperti, mercati, steps, steps_en
) values
  ('40cc7014-35fb-4703-8e72-dd0a67d7488e', 'Pane', 'Bread', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 1, 'quotidiano', 'semplice', 7.5, false, true, true, true, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Taglia il pane a fette."]'::jsonb, '["Slice the bread."]'::jsonb),
  ('310c3710-c4ed-44eb-930d-e9de7413d218', 'Pane integrale', 'Whole wheat bread', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 1, 'quotidiano', 'semplice', 7.5, false, true, true, true, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Taglia il pane integrale a fette."]'::jsonb, '["Slice the whole-wheat bread."]'::jsonb),
  ('1ea88888-90e2-4b78-9e89-6c7982e21a4e', 'Pane di segale', 'Rye bread', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 1, 'quotidiano', 'semplice', 7.5, false, true, true, true, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Taglia il pane di segale a fette sottili."]'::jsonb, '["Thinly slice the rye bread."]'::jsonb),
  ('64be79c2-797d-45be-b728-cc9896e46c73', 'Pane carasau', 'Carasau bread', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 1, 'quotidiano', 'semplice', 7.5, false, true, true, true, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Rompi il pane carasau in pezzi."]'::jsonb, '["Break the carasau bread into pieces."]'::jsonb),
  ('950107bb-00a2-4b6b-9983-b01e4f8c779e', 'Pane senza glutine', 'Gluten-free bread', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 1, 'quotidiano', 'semplice', 7, false, true, true, false, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Taglia il pane senza glutine a fette."]'::jsonb, '["Slice the gluten-free bread."]'::jsonb),
  ('37fa37d2-1706-42bf-b2a4-c071e6e777aa', 'Patate lesse', 'Boiled potatoes', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 30, 'quotidiano', 'bollitura', 8, false, true, true, false, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Lava le patate e lessale intere in acqua salata per 25-30 minuti, finché sono morbide al centro.", "Scola, lascia intiepidire e pela, poi taglia a tocchi."]'::jsonb,
   '["Wash the potatoes and boil them whole in salted water for 25-30 minutes until tender in the centre.", "Drain, let cool slightly and peel, then cut into chunks."]'::jsonb),
  ('8b168db5-ea79-4fda-83b6-806d773462c5', 'Patate al forno', 'Roasted potatoes', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 35, 'quotidiano', 'forno', 8, false, true, true, false, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Taglia le patate a tocchi e condiscile con un filo d''olio e sale.", "Cuoci in forno a 200°C per 30-35 minuti, girandole a metà cottura, finché sono dorate."]'::jsonb,
   '["Cut the potatoes into chunks and toss with a little oil and salt.", "Bake at 200°C for 30-35 minutes, turning halfway, until golden."]'::jsonb),
  ('e58925ab-a8f7-43c3-8363-7ae436c3a878', 'Purè di patate leggero', 'Light mashed potatoes', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 30, 'quotidiano', 'bollitura', 8, false, true, true, false, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Lessa le patate intere in acqua salata per 25-30 minuti finché sono morbide.", "Scola, pela e schiaccia con uno schiacciapatate, aggiungendo un filo d''olio."]'::jsonb,
   '["Boil the potatoes whole in salted water for 25-30 minutes until tender.", "Drain, peel and mash with a potato masher, adding a drizzle of oil."]'::jsonb),
  ('9fd0677e-228e-4b27-a33a-f96c4247cae6', 'Patate in padella', 'Pan-fried potatoes', 'contorno', 'europea', 'neutro', 'neutra',
   true, false, 18, 'quotidiano', 'padella', 8, false, true, true, false, false, false,
   'italia', 'base_amidacea', array['base_amidacea'], array['it'],
   '["Taglia le patate a cubetti piccoli.", "Cuocile in padella con un filo d''olio per 15-18 minuti, mescolando, finché sono dorate e morbide."]'::jsonb,
   '["Cut the potatoes into small cubes.", "Cook in a pan with a little oil for 15-18 minutes, stirring, until golden and tender."]'::jsonb)
on conflict (id) do nothing;

insert into public.dish_ingredients (dish_id, food_id, grams) values
  ('40cc7014-35fb-4703-8e72-dd0a67d7488e', 'pane_comune_crea', 60),
  ('310c3710-c4ed-44eb-930d-e9de7413d218', 'pane_integrale_it', 60),
  ('1ea88888-90e2-4b78-9e89-6c7982e21a4e', 'pane_segale_it', 50),
  ('64be79c2-797d-45be-b728-cc9896e46c73', 'pane_carasau_it', 30),
  ('950107bb-00a2-4b6b-9983-b01e4f8c779e', 'pane_senza_glutine_it', 60),
  ('37fa37d2-1706-42bf-b2a4-c071e6e777aa', '170028', 250),
  ('8b168db5-ea79-4fda-83b6-806d773462c5', '170028', 250),
  ('e58925ab-a8f7-43c3-8363-7ae436c3a878', '170028', 220),
  ('9fd0677e-228e-4b27-a33a-f96c4247cae6', '170028', 220)
on conflict (dish_id, food_id) do nothing;

-- Verifica rapida da eseguire a mano dopo il lancio:
-- select id, name, health_score from dishes where id in (
--   '40cc7014-35fb-4703-8e72-dd0a67d7488e','310c3710-c4ed-44eb-930d-e9de7413d218',
--   '1ea88888-90e2-4b78-9e89-6c7982e21a4e','64be79c2-797d-45be-b728-cc9896e46c73',
--   '950107bb-00a2-4b6b-9983-b01e4f8c779e','37fa37d2-1706-42bf-b2a4-c071e6e777aa',
--   '8b168db5-ea79-4fda-83b6-806d773462c5','e58925ab-a8f7-43c3-8363-7ae436c3a878',
--   '9fd0677e-228e-4b27-a33a-f96c4247cae6'
-- );
-- Atteso: 9 righe.
