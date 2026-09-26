-- 2026-09-26 — Griglia dei pasti in casa/fuori, giorno per giorno.
-- Prima solo lunch_away (booleano unico per tutta la settimana): non
-- distingueva "pranzo fuori 2 giorni su 7" da "sempre fuori". pasti_casa
-- aggiunge il dettaglio senza rompere chi non lo compila mai: le righe
-- esistenti restano NULL, ed e' proprio quel NULL il segnale per il
-- generatore di usare ancora il vecchio comportamento (filtro su tutta la
-- settimana da lunch_away).
--
-- Forma del valore, un oggetto con i sette giorni (1 = lunedi'):
-- {"1":{"pranzo":false,"cena":true}, "2":{...}, ... "7":{...}}

alter table public.users add column if not exists pasti_casa jsonb;
