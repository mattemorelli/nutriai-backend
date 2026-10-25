// Prova dal vivo su Render (non locale) dei 5 casi della verifica
// sicurezza-input del 26-27 ottobre 2026: eta' 17, BMI 17 + dimagrire,
// BMI 17 + mantenere, profilo normale, peso 250. Un utente temporaneo per
// caso (createUser + password, poi signInWithPassword come farebbe l'app),
// POST /onboarding sull'URL di Render passato come primo argomento.
// Cancella tutto a fine corsa (--pulisci) o lascia gli utenti per ispezione.
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const API = process.argv[2];
if (!API) {
  console.error('Uso: node test-sicurezza-input-live.js <URL_RENDER> [--pulisci]');
  process.exit(1);
}
const pulisci = process.argv[3] === '--pulisci';

const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const anon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const annoCorrente = new Date().getFullYear();

// pasti_casa: {"1":{pranzo,cena}, ..., "7":{...}} - vedi derivaPastiCasa in
// server.js, non un oggetto colazione/pranzo/cena/spuntino.
const PASTI_CASA_TUTTI = Object.fromEntries(
  [1, 2, 3, 4, 5, 6, 7].map((g) => [String(g), { pranzo: true, cena: true }])
);
const CORPO_BASE = {
  sex: 'M', diet: 'onnivoro', occupation_level: 'sedentario', training_sessions: [],
  pasti_casa: PASTI_CASA_TUTTI,
  evening_minutes: 35, household_size: 1, constraints: [], cuisines: ['europea'], paesi: ['italia'],
};

const CASI = [
  {
    nome: 'eta_17', attesa: '400 anno di nascita non valida',
    corpo: { ...CORPO_BASE, birth_year: annoCorrente - 17, height_cm: 175, weight_kg: 70, goal: 'mantenimento' },
  },
  {
    nome: 'bmi17_dimagrire', attesa: '400 obiettivo_non_adatto/bmi_basso',
    corpo: { ...CORPO_BASE, birth_year: annoCorrente - 30, height_cm: 170, weight_kg: 49, goal: 'dimagrimento' },
  },
  {
    nome: 'bmi17_mantenere', attesa: '200 piano generato (stesso BMI, obiettivo diverso)',
    corpo: { ...CORPO_BASE, birth_year: annoCorrente - 30, height_cm: 170, weight_kg: 49, goal: 'mantenimento' },
  },
  {
    nome: 'profilo_normale', attesa: '200 piano generato',
    corpo: { ...CORPO_BASE, birth_year: annoCorrente - 30, height_cm: 175, weight_kg: 78, goal: 'mantenimento' },
  },
  {
    nome: 'peso_250', attesa: '400 peso non valida',
    corpo: { ...CORPO_BASE, birth_year: annoCorrente - 30, height_cm: 175, weight_kg: 250, goal: 'mantenimento' },
  },
];

async function creaUtente(nome) {
  const email = `test-sicurezza-${nome}-${Date.now()}@nutriai-test.invalid`;
  const password = require('crypto').randomBytes(24).toString('hex');
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw new Error(`createUser ${email}: ${error.message}`);
  const { data: sessione, error: eLogin } = await anon.auth.signInWithPassword({ email, password });
  if (eLogin) throw new Error(`signIn ${email}: ${eLogin.message}`);
  return { id: data.user.id, email, token: sessione.session.access_token };
}

async function puliziaCompleta(ids) {
  if (!ids.length) return;
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    await c.query('BEGIN');
    const tabelle = ['plans', 'energy_targets', 'user_constraints', 'user_cuisine_preferences', 'body_measurements', 'users'];
    for (const t of tabelle) {
      const { rowCount } = await c.query(`delete from ${t} where ${t === 'plans' ? 'user_id' : t === 'users' ? 'id' : 'user_id'} = any($1::uuid[])`, [ids]);
      console.log(`  ${t}: ${rowCount} righe cancellate`);
    }
    await c.query('COMMIT');
  } catch (e) {
    await c.query('ROLLBACK');
    console.error('ERRORE pulizia DB, ROLLBACK:', e.message);
    throw e;
  } finally {
    await c.end();
  }
  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`  auth.deleteUser ${id}: ${error.message}`);
  }
  console.log(`${ids.length} utente/i di test cancellati (auth + tabelle).`);
}

(async () => {
  const idsCreati = [];
  try {
    for (const caso of CASI) {
      const utente = await creaUtente(caso.nome);
      idsCreati.push(utente.id);
      const r = await fetch(`${API}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${utente.token}` },
        body: JSON.stringify(caso.corpo),
      });
      const corpo = await r.json().catch(() => ({}));
      console.log(`\n=== ${caso.nome} (atteso: ${caso.attesa}) ===`);
      console.log(`status: ${r.status}`);
      console.log('body:', r.status === 200 ? { kcal: corpo.kcal, tdee: corpo.tdee } : corpo);
    }
  } finally {
    if (pulisci) {
      console.log('\n--- pulizia dati di prova ---');
      await puliziaCompleta(idsCreati);
    } else {
      console.log('\nUtenti di test creati (NON cancellati, rilancia con --pulisci per toglierli):');
      console.log(idsCreati);
    }
  }
})().catch((e) => { console.error('ERRORE:', e.message); process.exitCode = 1; });
