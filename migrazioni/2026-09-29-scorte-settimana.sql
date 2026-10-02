-- 2026-09-29 — "Ho in casa": voci fresche tolte solo per questa settimana.
--
-- pantry_items gia' fa la versione "per sempre" (un food_id sparisce da
-- ogni lista futura). Qui serve l'opposto: un food_id fuori dalla lista di
-- QUESTO piano soltanto - la settimana dopo, con un plan_id diverso, torna
-- da solo. Per questo la riga e' legata a plan_id, non solo a user_id: un
-- piano nuovo (settimana nuova) ha un plan_id nuovo, quindi le righe
-- vecchie smettono da sole di contare per listaSpesa, senza bisogno di
-- cancellarle esplicitamente (restano come storico, innocue).
--
-- Sicura da rilanciare: "create table if not exists" e il blocco della
-- policy sono entrambi no-op se gia' applicati.

create table if not exists public.scorte_settimana (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  food_id text not null,
  creato_il timestamptz not null default now(),
  unique (user_id, plan_id, food_id)
);

create index if not exists scorte_settimana_piano on public.scorte_settimana (user_id, plan_id);

-- Stessa policy di pantry_items (RLS non riguarda il backend, che usa la
-- service_role, ma resta coerente se in futuro un client parlasse
-- direttamente con Supabase).
alter table public.scorte_settimana enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'scorte_settimana' and policyname = 'solo i propri'
  ) then
    create policy "solo i propri" on public.scorte_settimana
      for all using (auth.uid() = user_id);
  end if;
end $$;
