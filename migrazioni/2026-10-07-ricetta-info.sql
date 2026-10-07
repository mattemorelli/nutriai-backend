-- 2026-10-07 — Cook: preparazioni da fare in anticipo (ammollo, dissalare,
-- marinare, scongelare...). Non sono passaggi di Cook (non hanno un timer,
-- non entrano nel tempo totale della ricetta): sono un avviso separato,
-- da mostrare prima di iniziare. Non tocca dishes/ricetta_passi.
--
-- Una riga per piatto (al massimo una preparazione in anticipo per
-- piatto, quella piu' vincolante se ce ne fosse piu' di una).
--
-- Stessa visibilita' di ricetta_passi: lettura pubblica, scrittura solo
-- dal backend (service_role).
--
-- Sicura da rilanciare: "create table if not exists" e' no-op se gia'
-- applicata.

create table if not exists public.ricetta_info (
  dish_id uuid primary key references public.dishes(id) on delete cascade,
  prep_anticipo_it text not null,
  prep_anticipo_en text not null,
  ore_anticipo numeric not null check (ore_anticipo > 0),
  creato_il timestamptz not null default now()
);

grant select on public.ricetta_info to anon, authenticated;
grant select, insert, update, delete on public.ricetta_info to service_role;
