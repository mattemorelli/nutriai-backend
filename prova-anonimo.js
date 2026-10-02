// Prova end-to-end del flusso "sign up spostato alla fine": utente anonimo
// -> onboarding -> salvataggio con email/password. Script temporaneo, non
// pensato per restare nel repo ne' per girare in CI - usa la chiave anon
// (mai la service key) per le azioni utente, la service key solo per le
// verifiche e per la pulizia finale.
//
// Uso: node prova-anonimo.js
// Richiede il backend locale in ascolto (npm run dev / node server.js).

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const API = process.env.PROVA_API || 'http://localhost:3000';

const EMAIL_PROVA = 'prova+anonimo@example.com';
const PASSWORD_PROVA = 'ProvaAnonima-2026-xyz';

let fallimenti = 0;
function fallisce(messaggio) {
  fallimenti++;
  console.error('FALLITO:', messaggio);
}

(async () => {
  if (!URL || !ANON_KEY || !SERVICE_KEY) {
    console.error('Mancano SUPABASE_URL / SUPABASE_KEY / SUPABASE_SERVICE_KEY in .env.');
    process.exit(1);
  }

  const anon = createClient(URL, ANON_KEY, { auth: { persistSession: false } });
  const admin = createClient(URL, SERVICE_KEY, { auth: { persistSession: false } });

  let userId = null;

  try {
    console.log('--- 1. signInAnonymously ---');
    const { data: datiAuth, error: erroreAuth } = await anon.auth.signInAnonymously();
    if (erroreAuth) { fallisce(`signInAnonymously: ${erroreAuth.message}`); return; }
    userId = datiAuth.user.id;
    console.log(`utente anonimo creato - id: ${userId} - is_anonymous: ${datiAuth.user.is_anonymous}`);

    console.log('\n--- 2. riga in public.users ---');
    await new Promise((r) => setTimeout(r, 300)); // margine di sicurezza, il trigger e' nella stessa transazione
    const { data: rigaUtente, error: erroreRiga } = await admin
      .from('users').select('id, consent_health, is_pro').eq('id', userId).maybeSingle();
    if (erroreRiga) { fallisce(`lettura public.users: ${erroreRiga.message}`); return; }
    if (!rigaUtente) { fallisce(`nessuna riga in public.users per ${userId}`); return; }
    console.log('riga trovata:', rigaUtente);

    console.log('\n--- 3. POST /onboarding ---');
    const { data: { session } } = await anon.auth.getSession();
    if (!session) { fallisce('nessuna sessione dopo signInAnonymously'); return; }

    const rOnboarding = await fetch(`${API}/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
        sex: 'F',
        birth_year: 1992,
        height_cm: 168,
        weight_kg: 62,
        goal: 'mantenimento',
        occupation_level: 'sedentario',
        cuisines: ['europea'],
        diet: 'onnivoro',
        paesi: ['italia'],
      }),
    });
    const corpoOnboarding = await rOnboarding.json().catch(() => null);
    console.log('status:', rOnboarding.status);
    if (!rOnboarding.ok) {
      fallisce(`POST /onboarding -> ${rOnboarding.status} ${JSON.stringify(corpoOnboarding)}`);
      return;
    }

    console.log('\n--- 4. kcal / tdee / piano nella risposta ---');
    console.log(`kcal: ${corpoOnboarding.kcal} - tdee: ${corpoOnboarding.tdee} - plan_id: ${corpoOnboarding.plan_id}`);
    if (corpoOnboarding.kcal == null) fallisce('manca kcal nella risposta');
    if (corpoOnboarding.tdee == null) fallisce('manca tdee nella risposta');
    if (!corpoOnboarding.plan_id) fallisce('manca il piano (plan_id) nella risposta');
    if (fallimenti > 0) return;

    console.log('\n--- 5. updateUser: email poi password ---');
    const { data: datiEmail, error: erroreEmail } = await anon.auth.updateUser({ email: EMAIL_PROVA });
    if (erroreEmail) { fallisce(`updateUser(email): ${erroreEmail.message}`); return; }
    console.log(`email impostata - id invariato: ${datiEmail.user.id === userId}`);

    const { data: datiPassword, error: errorePassword } = await anon.auth.updateUser({ password: PASSWORD_PROVA });
    if (errorePassword) { fallisce(`updateUser(password): ${errorePassword.message}`); return; }
    console.log(`password impostata - id invariato: ${datiPassword.user.id === userId} - is_anonymous ora: ${datiPassword.user.is_anonymous}`);

    if (datiEmail.user.id !== userId || datiPassword.user.id !== userId) {
      fallisce("l'id e' cambiato durante il salvataggio - non dovrebbe mai succedere");
      return;
    }

    console.log('\n--- 6. il piano resta dello stesso utente dopo il salvataggio ---');
    const { data: pianoVerifica, error: errorePiano } = await admin
      .from('plans').select('id, user_id').eq('id', corpoOnboarding.plan_id).maybeSingle();
    if (errorePiano) { fallisce(`lettura plans: ${errorePiano.message}`); return; }
    if (!pianoVerifica || pianoVerifica.user_id !== userId) {
      fallisce(`il piano risulta di user_id=${pianoVerifica?.user_id}, non piu' di ${userId}`);
    } else {
      console.log('piano ancora dello stesso utente: OK');
    }

    if (fallimenti === 0) console.log('\n=== TUTTI I PASSAGGI COMPLETATI SENZA ERRORI ===');
  } catch (e) {
    fallisce(`eccezione non gestita: ${e.message}`);
  } finally {
    if (userId) {
      console.log(`\n--- pulizia: cancello l'utente di prova ${userId} ---`);
      const { error: erroreCancella } = await admin.auth.admin.deleteUser(userId);
      if (erroreCancella) console.error('ATTENZIONE: cancellazione non riuscita:', erroreCancella.message);
      else console.log('utente di prova cancellato.');
    }
    process.exit(fallimenti > 0 ? 1 : 0);
  }
})();
