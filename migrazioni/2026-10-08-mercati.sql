-- 2026-10-08 — Lancio Italia: il generatore deve proporre solo piatti del
-- mercato IT. Colonna array (non un singolo booleano disponibile_it) per
-- poter aggiungere altri mercati in futuro senza nuove colonne: un piatto
-- che vale per piu' mercati avra' piu' codici in mercati (es. ['it','fr']).
--
-- Default '{}' (nessun mercato): un piatto nuovo non entra in nessun
-- generatore finche' qualcuno non lo qualifica esplicitamente - piu'
-- sicuro di un default che lo farebbe comparire ovunque per errore.
--
-- Il popolamento vero (quali dish_id diventano ['it']) e' nello script
-- scripts/applica-mercati-it.js, non qui: qui solo lo schema, cosi' la
-- migrazione resta rilanciabile e la lista di id (derivata dall'analisi
-- in audit/solo-italiano.md) resta tracciata nel suo script.
--
-- Sicura da rilanciare: "add column if not exists" e' no-op se gia' applicata.

alter table public.dishes
  add column if not exists mercati text[] not null default '{}';

comment on column public.dishes.mercati is
  'Codici mercato per cui il piatto e'' approvato (es. it). Vuoto = non ancora qualificato per nessun mercato, mai proposto dal generatore. Vedi audit/solo-italiano.md.';
