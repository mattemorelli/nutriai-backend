-- 2026-10-07 — Modalita' Cook: passo-passo con animazioni e timer.
--
-- Due tabelle nuove, non toccano dishes/dish_ingredients:
--  - azioni_cook: elenco chiuso delle azioni (ognuna avra' una sua
--    animazione nell'app). 34 azioni + "altro", partendo dalle 30 piu'
--    frequenti trovate nell'audit ricette (~/Progetti/nutriai/audit), piu'
--    4 azioni precise aggiunte per Cook: preriscaldare (forno), saltare
--    (verdure/pasta in padella), rosolare (carne/pesce), battere (fettine).
--  - ricetta_passi: un passo per riga (dish_id, ordine). ingredienti e'
--    jsonb [{food_id, quota}] - la quota e' la frazione del grammo totale
--    di quel food_id nel piatto usata in QUESTO passo (le quote di uno
--    stesso food_id sommano a 1 sull'intera ricetta - verificato da
--    scripts/verifica-cook.js, non da un vincolo SQL).
--
-- tempo_da_confezione: per i passi di pasta bollita, la durata scritta e'
-- il default ma l'app puo' sostituirla con il tempo letto dalla confezione
-- meno un minuto.
-- in_parallelo: true quando il passo si fa MENTRE un'attesa precedente e'
-- ancora in corso ("nel frattempo", "mentre l'acqua bolle") - serve a
-- calcolare il tempo totale reale della ricetta (i passi in parallelo non
-- si sommano se finiscono dentro l'attesa che li contiene).
--
-- Stessa visibilita' di dishes/foods: lettura pubblica (anon e
-- authenticated, SELECT soltanto), scrittura solo dal backend
-- (service_role, che e' il ruolo con cui si connette server.js/genera.js).
-- Niente RLS per-utente: sono dati di catalogo condivisi, non righe di un
-- singolo utente (a differenza di scorte_settimana/pantry_items).
--
-- Sicura da rilanciare: "create table if not exists" e gli insert sulle
-- azioni sono "on conflict do nothing".

create table if not exists public.azioni_cook (
  codice text primary key,
  nome_it text not null,
  nome_en text not null
);

insert into public.azioni_cook (codice, nome_it, nome_en) values
  ('cuocere', 'Cuocere', 'Cook'),
  ('aggiungere', 'Aggiungere', 'Add'),
  ('soffriggere', 'Soffriggere', 'Sauté aromatics'),
  ('servire', 'Servire', 'Serve'),
  ('condire', 'Condire', 'Season'),
  ('tagliare', 'Tagliare', 'Cut'),
  ('bollire', 'Bollire', 'Boil'),
  ('infornare', 'Infornare', 'Bake'),
  ('disporre', 'Disporre', 'Arrange'),
  ('stufare', 'Stufare', 'Braise'),
  ('versare', 'Versare', 'Pour'),
  ('tostare', 'Tostare', 'Toast'),
  ('mescolare', 'Mescolare', 'Stir/Whisk together'),
  ('grigliare', 'Grigliare', 'Grill'),
  ('frullare', 'Frullare', 'Blend'),
  ('scaldare', 'Scaldare', 'Heat (oil/water)'),
  ('marinare', 'Marinare', 'Marinate'),
  ('scolare', 'Scolare', 'Drain'),
  ('farcire', 'Farcire', 'Stuff/fill'),
  ('schiacciare', 'Schiacciare', 'Crush'),
  ('formare', 'Formare', 'Shape'),
  ('pulire', 'Pulire', 'Clean/trim'),
  ('coprire', 'Coprire', 'Cover'),
  ('sbattere', 'Sbattere', 'Whisk/beat (eggs)'),
  ('lavare', 'Lavare', 'Wash/Rinse'),
  ('rompere', 'Rompere', 'Crack/Break'),
  ('sbucciare', 'Sbucciare', 'Peel'),
  ('spegnere', 'Spegnere', 'Turn off heat'),
  ('arrostire', 'Arrostire', 'Roast'),
  ('asciugare', 'Asciugare', 'Pat dry'),
  ('preriscaldare', 'Preriscaldare', 'Preheat (oven)'),
  ('saltare', 'Saltare', 'Pan-toss (vegetables/pasta)'),
  ('rosolare', 'Rosolare', 'Brown/sear (meat/fish)'),
  ('battere', 'Battere', 'Pound (meat slices)'),
  ('altro', 'Altro', 'Other')
on conflict (codice) do nothing;

create table if not exists public.ricetta_passi (
  dish_id uuid not null references public.dishes(id) on delete cascade,
  ordine int not null check (ordine > 0),
  azione text not null references public.azioni_cook(codice),
  testo_it text not null,
  testo_en text not null,
  durata_min numeric null check (durata_min is null or durata_min >= 0),
  tipo_tempo text null check (tipo_tempo in ('attiva', 'attesa')),
  temperatura_c int null,
  forno_modalita text null check (forno_modalita in ('statico', 'ventilato')),
  fuoco text null check (fuoco in ('basso', 'medio', 'alto')),
  tempo_da_confezione boolean not null default false,
  in_parallelo boolean not null default false,
  ingredienti jsonb not null default '[]'::jsonb,
  creato_il timestamptz not null default now(),
  primary key (dish_id, ordine),
  -- un tempo ha sempre un tipo, e viceversa
  check ((durata_min is null) = (tipo_tempo is null)),
  -- il forno si dichiara sempre con temperatura e modalita' insieme
  check ((temperatura_c is null) = (forno_modalita is null))
);

create index if not exists ricetta_passi_azione on public.ricetta_passi (azione);

grant select on public.azioni_cook to anon, authenticated;
grant select, insert, update, delete on public.azioni_cook to service_role;

grant select on public.ricetta_passi to anon, authenticated;
grant select, insert, update, delete on public.ricetta_passi to service_role;
