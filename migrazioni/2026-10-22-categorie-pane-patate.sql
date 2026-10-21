-- Migrazione 2026-10-22: categorie 'pane' e 'patate' su categorie_alimenti.
-- NON ESEGUITA sul database vero (regola di sicurezza della notte) - solo
-- preparata, pronta per domani. Corregge il bug di forma del 2026-10-21
-- (stesso tipo del fix allergeni): il riconoscimento di pane/patate come
-- accompagnamento del secondo viveva in due elenchi fissi di food_id dentro
-- genera.js (5 pani + 1 patata), mai aggiornabili senza una modifica al
-- codice. Qui diventano due categorie vere, come 'glutine'/'lattosio'/ecc.
--
-- 'categorie_alimenti.categoria' ha una foreign key verso categorie.codice
-- (verificato 2026-10-22, sola lettura): 'pane' e 'patate' non esistono
-- ancora in quella tabella, vanno creati prima. tipo='gruppo' (come
-- carne_bianca/legumi/ecc.), NON 'allergene': pane e patate non sono
-- allergeni scelti in onboarding, questa categoria serve solo alla
-- composizione del pasto dentro il generatore. Nessuna riga in
-- alias_categoria: non deve essere raggiungibile da risolviSubject/un
-- vincolo utente, solo da genera.js internamente via categorie_alimenti.
--
-- Sicura da rilanciare: "insert ... on conflict do nothing" e' no-op se
-- gia' applicata.
--
-- ORDINE DI LANCIO (vedi RAPPORTO-NOTTE.md):
--   1. backup-2026-10-22-categorie-pane-patate.sql (salva lo stato attuale)
--   2. questo file
--   3. verifica-tipo-amido.js (controllo permanente, deve dare 0 problemi)
--   4. se qualcosa non va: rollback-2026-10-22-categorie-pane-patate.sql

insert into public.categorie (codice, nome_it, nome_en, tipo, sinonimi) values
  ('pane', 'Pane', 'Bread', 'gruppo', array['bread', 'grissini', 'piadina', 'cracker', 'pita']),
  ('patate', 'Patate', 'Potatoes', 'gruppo', array['potato', 'potatoes', 'patata'])
on conflict (codice) do nothing;

insert into public.categorie_alimenti (categoria, food_id) values
  ('pane', 'pane_comune_crea'),
  ('pane', 'pane_integrale_it'),
  ('pane', 'pane_senza_glutine_it'),
  ('pane', 'pane_segale_it'),
  ('pane', 'pane_carasau_it'),
  ('pane', 'grissini_it'),
  ('pane', '174957'),   -- Crackers graham
  ('pane', '167942'),   -- Crackers integrali
  ('pane', '174915'),   -- Pane pita
  ('pane', '174924'),   -- Pane bianco
  ('patate', '170028')  -- Patate bianche (unico alimento "patata" nel catalogo oggi)
on conflict (categoria, food_id) do nothing;

-- Verifica rapida da eseguire a mano dopo il lancio:
-- select categoria, count(*) from categorie_alimenti where categoria in ('pane','patate') group by categoria;
-- Atteso: pane=10, patate=1.
