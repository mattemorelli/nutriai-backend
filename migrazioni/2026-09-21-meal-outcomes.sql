-- 2026-09-21 — Punto 9: meal_outcomes funzionante.
-- meal_outcomes aveva solo (id, plan_item_id, status, skip_reason, liked,
-- reported_at): ne' genera.js ne' server.js /esito potevano leggere/scrivere
-- dish_id o user_id, colonne che il codice gia' esistente presupponeva da
-- prima di oggi. La funzione "non riproporre un piatto rifiutato due volte"
-- non ha mai funzionato in produzione. Aggiunte le due colonne mancanti
-- (derivabili comunque via plan_item_id -> plan_items -> dish_id/plan_id ->
-- plans -> user_id, ma tenerle dirette evita un join a ogni lettura), il
-- vincolo UNIQUE su plan_item_id richiesto dall'upsert di /esito, e un
-- indice per le letture per utente+piatto. reported_at NON e' stata
-- rinominata: il codice e' stato adattato a lei, non il contrario.
-- Tabella vuota al momento dell'esecuzione: nessun rischio, nessun dry run.

ALTER TABLE meal_outcomes
  ADD COLUMN user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN dish_id uuid NOT NULL REFERENCES dishes(id);

ALTER TABLE meal_outcomes
  ADD CONSTRAINT meal_outcomes_plan_item_unico UNIQUE (plan_item_id);

CREATE INDEX IF NOT EXISTS meal_outcomes_utente_piatto ON meal_outcomes (user_id, dish_id);
