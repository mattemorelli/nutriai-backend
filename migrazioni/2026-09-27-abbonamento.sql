-- 2026-09-27 — I blocchi dell'abbonamento (Pro).
--
-- Oggi POST /genera-piano e POST /onboarding sono completamente aperti: un
-- utente non pagante puo' rigenerare il piano all'infinito chiamando le
-- rotte direttamente (curl, non serve nemmeno l'app). Questa migrazione
-- prepara le tre cose sul database che servono per chiudere quel buco senza
-- cambiare la logica del generatore: chi e' Pro (gia' presente ma mai
-- documentata), quale giorno della settimana resta visibile gratis in un
-- piano nuovo, e un modo per riconoscere lo stesso telefono sotto email
-- diverse (altrimenti basterebbe registrarsi di nuovo per riavere un altro
-- giorno gratis).
--
-- Sicura da eseguire piu' volte: ogni pezzo e' "if not exists", quindi
-- rilanciarla su un database dove e' gia' passata non fa niente (nessun
-- errore, nessuna riga toccata). Nessuna riga esistente viene modificata da
-- questo file: le colonne nuove nascono NULL o col default dichiarato, mai
-- da un UPDATE retroattivo.

-- a) is_pro esiste gia' sul database (verificato: boolean, not null,
-- default false) ma non era mai stata dichiarata in una migrazione del
-- repo. La dichiariamo qui solo per lasciarne traccia scritta - su un
-- database dove esiste gia' con questo stesso tipo, la riga sotto e' un
-- no-op.
alter table public.users
  add column if not exists is_pro boolean not null default false;

-- b) Il giorno della settimana (1 = lunedi' ... 7 = domenica) che resta
-- aperto gratis in QUESTO piano. Scritto da generaESalva al momento della
-- generazione, con la stessa regola di fuso di lunediCorrente() in
-- genera.js (ora del server, vedi il commento li' per il perche').
-- NULL sui piani generati prima di questa migrazione, e resta NULL per
-- sempre su di loro: un piano vecchio senza questo valore va trattato come
-- "nessun limite", non come "lunedi'" - non e' la stessa cosa.
alter table public.plans
  add column if not exists giorno_gratis smallint;

-- c) L'impronta di un dispositivo, per impedire che si rifaccia
-- l'onboarding con un'altra email dallo stesso telefono solo per riavere un
-- giorno gratis. Una riga per dispositivo, mai aggiornata: se l'impronta
-- esiste gia' su un user_id diverso da chi sta facendo l'onboarding adesso,
-- il piano non si genera (vedi POST /onboarding).
create table if not exists public.dispositivi (
  impronta  text primary key,
  user_id   uuid not null references auth.users(id) on delete cascade,
  creato_at timestamptz not null default now()
);

create index if not exists dispositivi_utente on public.dispositivi (user_id);

-- Il server usa sempre la service_role key (RLS non lo riguarda: legge e
-- scrive comunque tutto), ma le altre tabelle di questo tipo nel repo hanno
-- una policy di sola lettura sui propri, per coerenza se in futuro un
-- client parlasse direttamente con Supabase. Blocco idempotente perche'
-- "create policy" non ha di suo una clausola "if not exists".
alter table public.dispositivi enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'dispositivi' and policyname = 'dispositivi_propri'
  ) then
    create policy dispositivi_propri on public.dispositivi
      for select using (auth.uid() = user_id);
  end if;
end $$;
