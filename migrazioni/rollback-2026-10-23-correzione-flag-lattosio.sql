-- Rollback di 2026-10-23-correzione-flag-lattosio.sql. NON ESEGUITO finche'
-- non serve davvero - riporta il flag al valore sbagliato di prima
-- (false), letto dal backup invece che scritto a mano qui, cosi' se in
-- futuro altre righe venissero toccate per errore questo file resta
-- corretto solo per questa singola correzione.

update public.dishes
set contiene_lattosio = false
where id = 'fe1eb556-ecb4-429f-9c9a-0f34a38347e5';
