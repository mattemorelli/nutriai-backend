-- 2026-09-29 — Rilevazione Quadrio dei prezzi (Iper, Unes, Crai).
--
-- Le tre catene senza dato Altroconsumo verificabile (Iper, Unes, Crai -
-- vedi la ricerca del 2026-09-28, nessuna fonte esterna trovata dopo tre
-- livelli di ricerca) restano coperte solo se misuriamo noi un paniere di
-- prodotti sugli stessi siti/app di spesa online, confrontandolo con tre
-- catene di cui conosciamo gia' l'indice Altroconsumo (Esselunga 121,
-- Carrefour 125). Questa tabella e' la registrazione grezza di quella
-- misura, riga per riga: un prodotto, un prezzo, una fonte, una data.
--
-- Sicura da rilanciare: "create table if not exists" e il blocco di
-- ricreazione del vincolo sono entrambi no-op se gia' applicati.

create table if not exists public.rilevazioni_prezzi (
  id uuid primary key default gen_random_uuid(),
  catena text not null,
  categoria text not null,
  prodotto text not null,
  formato text not null,
  prezzo numeric not null,
  prezzo_unitario numeric not null,
  unita text not null check (unita in ('kg', 'l', 'pezzo', 'uovo')),
  note text,
  fonte text,
  data date not null,
  cap text not null,
  -- una sola rilevazione per catena+categoria+data: rilanciare l'import
  -- con lo stesso file aggiorna la riga invece di duplicarla.
  unique (catena, categoria, data)
);

-- fascia_metodo deve ammettere anche 'rilevazione_quadrio' (misura nostra,
-- non una fonte esterna) accanto ai quattro valori gia' in uso. Postgres
-- non permette di aggiungere un valore a un CHECK con un ALTER diretto:
-- va ricreato. Il nome del vincolo (marche_fascia_metodo_check) e' quello
-- assegnato automaticamente da Postgres quando la colonna e' stata creata
-- nella migrazione del 2026-09-28 - verificato via pg_constraint prima di
-- scrivere questo blocco, non e' un'invenzione.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'public.marche'::regclass
      and conname = 'marche_fascia_metodo_check'
  ) then
    alter table public.marche drop constraint marche_fascia_metodo_check;
  end if;

  alter table public.marche add constraint marche_fascia_metodo_check
    check (fascia_metodo in ('diretto', 'media_formati', 'gruppo', 'stima_locale', 'rilevazione_quadrio'));
end $$;

-- I tre indici sotto sono l'output di calcola-fasce-rilevazione.js sul
-- paniere di 28 categorie comuni importato sopra (controllo di validita'
-- passato: rapporto Carrefour/Esselunga nel paniere 1,026 contro un atteso
-- Altroconsumo di 1,033, scarto 0,7% - ben sotto il 5% ammesso). Non sono
-- ricalcolati qui: se il paniere cambia, si rilancia lo script e si
-- aggiornano questi UPDATE a mano, non il contrario.
update public.marche set
  fascia_prezzo = 3, fascia_indice = 143.7, fascia_metodo = 'rilevazione_quadrio',
  fascia_nota = 'Paniere di 28 prodotti confrontato con Esselunga e Carrefour, prezzi dal sito Unes',
  fascia_fonte = 'Rilevazione Quadrio, prezzi online a Milano (CAP 20149), 29/09/2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Unes';

update public.marche set
  fascia_prezzo = 3, fascia_indice = 134.5, fascia_metodo = 'rilevazione_quadrio',
  fascia_nota = 'Paniere di 28 prodotti confrontato con Esselunga e Carrefour, prezzi Iper letti su Glovo (valore vicino alla soglia)',
  fascia_fonte = 'Rilevazione Quadrio, prezzi online a Milano (CAP 20149), 29/09/2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Iper';

update public.marche set
  fascia_prezzo = 3, fascia_indice = 181.1, fascia_metodo = 'rilevazione_quadrio',
  fascia_nota = 'Paniere di 28 prodotti confrontato con Esselunga e Carrefour, prezzi Crai letti su Glovo',
  fascia_fonte = 'Rilevazione Quadrio, prezzi online a Milano (CAP 20149), 29/09/2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Crai';
