// Crea i 4 utenti di test dedicati (una tantum, idempotente: salta chi esiste
// gia' per email). Usa supabase.auth.admin.createUser, non tocca auth.users
// via SQL diretto.
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const PROFILI = [
  {
    chiave: 'basso', email: 'test-basso@nutriai-test.invalid',
    diet: 'onnivoro', paesi: ['italia'], evening_minutes: 45,
    kcal: 1800, height_cm: null, birth_year: null, goal: 'mantenimento',
  },
  {
    chiave: 'alto', email: 'test-alto@nutriai-test.invalid',
    diet: 'onnivoro', paesi: ['italia'], evening_minutes: 45,
    kcal: 2900, height_cm: 184, birth_year: 2007, goal: 'mantenimento',
  },
  {
    chiave: 'vegano', email: 'test-vegano@nutriai-test.invalid',
    diet: 'vegano', paesi: ['italia'], evening_minutes: 45,
    kcal: 2200, height_cm: null, birth_year: null, goal: 'mantenimento',
  },
  {
    chiave: 'pescetarianoGlutine', email: 'test-pescetariano-glutine@nutriai-test.invalid',
    diet: 'pescetariano', paesi: ['italia'], evening_minutes: 45,
    kcal: 2200, height_cm: null, birth_year: null, goal: 'mantenimento',
    glutine: true,
  },
  {
    // Aggiunto 2026-10-08 per la verifica del filtro mercati (solo-italiano.md):
    // mancava un profilo vegetariano + senza glutine + senza lattosio.
    chiave: 'vegetarianoGlutineLattosio', email: 'test-vegetariano-glutine-lattosio@nutriai-test.invalid',
    diet: 'vegetariano', paesi: ['italia'], evening_minutes: 45,
    kcal: 2200, height_cm: null, birth_year: null, goal: 'mantenimento',
    glutine: true, lattosio: true,
  },
];

(async () => {
  const risultati = {};
  for (const p of PROFILI) {
    const { data: elenco, error: eList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (eList) throw new Error('listUsers: ' + eList.message);
    let utente = elenco.users.find(u => u.email === p.email);

    if (!utente) {
      const password = require('crypto').randomBytes(24).toString('hex');
      const { data: creato, error: eCreate } = await supabase.auth.admin.createUser({
        email: p.email, password, email_confirm: true,
      });
      if (eCreate) throw new Error(`createUser ${p.email}: ` + eCreate.message);
      utente = creato.user;
      console.log(`creato: ${p.email} -> ${utente.id}`);
    } else {
      console.log(`gia' esistente: ${p.email} -> ${utente.id}`);
    }

    const { error: eUsers } = await supabase.from('users').upsert({
      id: utente.id, diet: p.diet, paesi: p.paesi, evening_minutes: p.evening_minutes,
      height_cm: p.height_cm, birth_year: p.birth_year, goal: p.goal,
      consent_health: true, cook_days: [1, 2, 3, 4, 5, 6, 7], lunch_away: false,
    }, { onConflict: 'id' });
    if (eUsers) throw new Error(`public.users upsert ${p.email}: ` + eUsers.message);

    const { error: eCucina } = await supabase.from('user_cuisine_preferences')
      .upsert({ user_id: utente.id, cucina: 'europea', rank: 1 }, { onConflict: 'user_id,cucina' });
    if (eCucina) console.log(`  (cucina) ${eCucina.message}`);

    if (p.glutine || p.lattosio) {
      await supabase.from('user_constraints').delete().eq('user_id', utente.id);
      const righe = [];
      // categoria (non solo subject) e' quello che caricaVincoli espande
      // davvero in food_id da escludere - con solo "subject" la riga finiva
      // tra i vincoli "non risolti" e non escludeva nulla (bug corretto qui
      // il 2026-10-08, verificando il filtro mercati).
      if (p.glutine) righe.push({ user_id: utente.id, kind: 'allergia', subject: 'glutine', categoria: 'glutine', severity: 'assoluto' });
      if (p.lattosio) righe.push({ user_id: utente.id, kind: 'intolleranza', subject: 'lattosio', categoria: 'lattosio', severity: 'assoluto' });
      const { error: eVinc } = await supabase.from('user_constraints').insert(righe);
      if (eVinc) console.log(`  (vincoli) ${eVinc.message}`);
    }

    const { error: eEnergy } = await supabase.from('energy_targets').insert([{
      user_id: utente.id, kcal: p.kcal, method: 'stima_iniziale', confidence: 'bassa',
      computed_at: new Date().toISOString(),
      protein_g_min: Math.round(p.kcal * 0.06), fibre_g_min: 25, sat_fat_g_max: p.kcal * 0.10 / 9,
      free_sugar_g_max: 50, salt_g_max: 5,
    }]);
    if (eEnergy) console.log(`  (energy_targets) ${eEnergy.message}`);

    risultati[p.chiave] = { id: utente.id, email: p.email };
  }

  console.log('\n=== Copia questi id in test-users.js ===');
  console.log(JSON.stringify(risultati, null, 2));
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
