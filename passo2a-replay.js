require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';

// Stessa sequenza esatta di Fase 1 (genera-20.js), stesso ordine, stesso utente.
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

async function impostaConfig(cfg) {
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
}

async function contestoBloccati() {
  const { data: pianoVecchio } = await supabase
    .from('plans').select('id, generated_at')
    .eq('user_id', USER_ID)
    .order('generated_at', { ascending: false }).limit(1).maybeSingle();
  const { count: totalePiani } = await supabase
    .from('plans').select('*', { count: 'exact', head: true }).eq('user_id', USER_ID);

  let bloccatiPerGiorno = {};
  if (pianoVecchio) {
    const { data: righeBloccate } = await supabase
      .from('plan_items').select('day_of_week, slot')
      .eq('plan_id', pianoVecchio.id).eq('bloccato', true);
    for (const r of (righeBloccate || [])) {
      if (!bloccatiPerGiorno[r.day_of_week]) bloccatiPerGiorno[r.day_of_week] = [];
      bloccatiPerGiorno[r.day_of_week].push(r.slot);
    }
  }
  return { totalePiani, pianoVecchioId: pianoVecchio?.id ?? null, bloccatiPerGiorno };
}

(async () => {
  const risultati = [];

  for (let i = 0; i < CONFIG.length; i++) {
    const cfg = CONFIG[i];
    await impostaConfig(cfg);

    const seed = Math.floor(Math.random() * 4294967296);
    const etichetta = `${i + 1} ${cfg.diet} ${cfg.paesi.join('+')}`;

    let esito;
    try {
      const r = await generaESalva(supabase, USER_ID, seed);
      esito = { ok: true, plan_id: r.plan_id, seed: r.seed };
      console.log(`${etichetta} -> OK (seed ${r.seed})`);
    } catch (e) {
      esito = { ok: false, seed, errore: e.message };
      console.log(`${etichetta} -> FALLITO nella sequenza (seed ${seed}): ${e.message}`);

      // Rigioca SUBITO, isolato, con lo stesso identico seed.
      const { totalePiani, pianoVecchioId, bloccatiPerGiorno } = await contestoBloccati();
      try {
        const r2 = await generaESalva(supabase, USER_ID, seed);
        console.log(`  -> ISOLATO con lo stesso seed: RIUSCITO (plan_id ${r2.plan_id}). Il contesto della sequenza conta.`);
        console.log(`     piani totali per l'utente in quel momento: ${totalePiani}, piano piu' recente: ${pianoVecchioId}`);
        console.log(`     bloccatiPerGiorno al momento del fallimento: ${JSON.stringify(bloccatiPerGiorno)}`);
        esito.isolato = { ok: true, plan_id: r2.plan_id, totalePiani, bloccatiPerGiorno };
      } catch (e2) {
        console.log(`  -> ISOLATO con lo stesso seed: FALLITO ANCHE COSI' (${e2.message}). Era solo il caso, non stato condiviso.`);
        esito.isolato = { ok: false, errore: e2.message };
      }
    }
    risultati.push({ i: i + 1, ...cfg, ...esito });
  }

  const nFalliti = risultati.filter(r => !r.ok).length;
  console.log(`\n=== Riepilogo: ${CONFIG.length - nFalliti}/${CONFIG.length} riuscite nella sequenza, ${nFalliti} fallite ===`);
  for (const r of risultati.filter(r => !r.ok)) {
    console.log(`  ${r.i} ${r.diet} ${r.paesi.join('+')}: fallito in sequenza; isolato con stesso seed -> ${r.isolato.ok ? 'RIUSCITO (contesto conta)' : 'fallito anche cosi\' (solo il caso)'}`);
  }

  require('fs').writeFileSync(
    '/private/tmp/claude-501/-Users-matte-Progetti-nutriai-backend/ccb3e334-56d9-45e1-8546-79eb96660e29/scratchpad/passo2a-risultati.json',
    JSON.stringify(risultati, null, 2)
  );
})();
