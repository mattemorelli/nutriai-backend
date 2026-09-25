-- 2026-09-25 — Tabella dei consensi: una riga per ogni si' e per ogni revoca,
-- mai aggiornata (append-only), per poter dimostrare quando e su quale
-- versione del testo l'utente ha dato o tolto il consenso ai dati sanitari.

create table if not exists public.consensi (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  tipo          text not null check (tipo in ('dati_sanitari')),
  versione_testo text not null,
  lingua        text not null check (lingua in ('it','en')),
  stato         text not null check (stato in ('accettato','revocato')),
  registrato_at timestamptz not null default now()
);

create index if not exists consensi_utente_tipo on public.consensi (user_id, tipo, registrato_at desc);

alter table public.consensi enable row level security;

create policy consensi_propri on public.consensi
  for select using (auth.uid() = user_id);
