require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const { assertUtenteDiTest } = require('./test-users');
assertUtenteDiTest(USER_ID);

// Stessa sequenza esatta di Fase 1 / Fase 2 bis Passo 2a.
const CUCINA_DI = {
  italia: 'europea', francia: 'europea', spagna: 'europea', grecia: 'europea',
  germania: 'europea', regno_unito: 'europea', portogallo: 'europea',
  stati_uniti: 'usa', messico: 'sud_americana', argentina: 'sud_americana',
  australia: 'australiana',
};

const CONFIG = [
  { diet: 'onnivoro',      paesi: ['italia'] },
  { diet: 'vegetariano',   paesi: ['francia'] },
  { diet: 'vegano',        paesi: ['spagna'] },
  { diet: 'pescetariano',  paesi: ['grecia'] },
  { diet: 'onnivoro',      paesi: ['portogallo'] },
  { diet: 'vegetariano',   paesi: ['germania'] },
  { diet: 'vegano',        paesi: ['regno_unito'] },
  { diet: 'pescetariano',  paesi: ['stati_uniti'] },
  { diet: 'onnivoro',      paesi: ['australia'] },
  { diet: 'vegetariano',   paesi: ['messico'] },
  { diet: 'vegano',        paesi: ['argentina'] },
  { diet: 'pescetariano',  paesi: ['italia', 'francia'], cook_days: [1,2,3,4,5] },
  { diet: 'onnivoro',      paesi: ['spagna', 'grecia'], cook_days: [1,2,3,4,5] },
  { diet: 'vegetariano',   paesi: ['portogallo', 'germania'], cook_days: [1,2,3,4,5] },
  { diet: 'vegano',        paesi: ['regno_unito', 'stati_uniti'], cook_days: [1,3,5,7] },
  { diet: 'pescetariano',  paesi: ['australia', 'messico'], cook_days: [1,3,5,7] },
  { diet: 'onnivoro',      paesi: ['argentina', 'italia'], cook_days: [1,3,5,7] },
  { diet: 'vegetariano',   paesi: ['francia', 'spagna'] },
  { diet: 'vegano',        paesi: ['grecia', 'portogallo'] },
  { diet: 'pescetariano',  paesi: ['germania', 'regno_unito'] },
];

(async () => {
  const risultati = [];
  for (let i = 0; i < CONFIG.length; i++) {
    const cfg = CONFIG[i];
    const cook_days = cfg.cook_days || [1,2,3,4,5,6,7];
    await supabase.from('users').update({
      diet: cfg.diet, paesi: cfg.paesi, cook_days,
      lunch_away: false, evening_minutes: 45, household_size: 2,
    }).eq('id', USER_ID);
    const cucine = [...new Set(cfg.paesi.map((p) => CUCINA_DI[p]))];
    await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
    await supabase.from('user_cuisine_preferences').insert(
      cucine.map((c, idx) => ({ user_id: USER_ID, cucina: c, rank: idx + 1 }))
    );

    const seed = Math.floor(Math.random() * 4294967296);
    const etichetta = `${i + 1} ${cfg.diet} ${cfg.paesi.join('+')}`;
    const t0 = Date.now();
    try {
      const r = await generaESalva(supabase, USER_ID, seed);
      const dt = Date.now() - t0;
      console.log(`${etichetta} -> OK, gradino ${r.gradino}, concessioni ${r.concessioni.length}, ${dt}ms (seed ${seed})`);
      risultati.push({ i: i + 1, ...cfg, ok: true, gradino: r.gradino, concessioni: r.concessioni.length, ms: dt, seed });
    } catch (e) {
      const dt = Date.now() - t0;
      console.log(`${etichetta} -> FALLITO, ${dt}ms (seed ${seed}): ${e.message}`);
      risultati.push({ i: i + 1, ...cfg, ok: false, errore: e.message, ms: dt, seed });
    }
  }

  const okCount = risultati.filter(r => r.ok).length;
  console.log(`\n=== ${okCount}/${CONFIG.length} riuscite ===`);
  const perGradino = {};
  for (const r of risultati.filter(r => r.ok)) perGradino[r.gradino] = (perGradino[r.gradino] || 0) + 1;
  console.log('Distribuzione gradini:', perGradino);

  require('fs').writeFileSync(
    '/private/tmp/claude-501/-Users-matte-Progetti-nutriai-backend/ccb3e334-56d9-45e1-8546-79eb96660e29/scratchpad/passoD-replay20-risultati.json',
    JSON.stringify(risultati, null, 2)
  );
})();
