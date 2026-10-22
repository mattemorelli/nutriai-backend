-- Migrazione 2026-10-23: corregge contiene_lattosio=false -> true su
-- "Kolokithakia sti schara" (fe1eb556-ecb4-429f-9c9a-0f34a38347e5),
-- l'unica discrepanza trovata da verifica-flag-allergeni.js su TUTTO il
-- catalogo (2122 piatti, 8705 ingredienti controllati) oggi, 2026-10-23 -
-- nessun altro piatto ha lo stesso errore, su nessuno dei tre flag
-- (glutine/lattosio/frutta_secca). Piatto greco (paese='grecia',
-- mercati=[]), non ancora nel mercato IT: nessun impatto sul generatore
-- oggi, ma l'etichetta nell'app sarebbe comunque sbagliata se/quando
-- questo mercato si aprisse.
--
-- ORDINE DI LANCIO:
--   1. node migrazioni/backup-2026-10-23-correzione-flag-lattosio.js
--   2. questo file
--   3. node verifica-flag-allergeni.js (deve dare 0 discrepanze)
--   4. se qualcosa non va: rollback-2026-10-23-correzione-flag-lattosio.sql

update public.dishes
set contiene_lattosio = true
where id = 'fe1eb556-ecb4-429f-9c9a-0f34a38347e5';
