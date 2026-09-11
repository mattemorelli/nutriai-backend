require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { caricaPiatti } = require('./genera');

const GENERICO_DI = {
  italia: 'mediterraneo_generico', francia: 'mediterraneo_generico',
  spagna: 'mediterraneo_generico', grecia: 'mediterraneo_generico',
  portogallo: 'mediterraneo_generico',
  germania: 'centro_nord_generico', regno_unito: 'centro_nord_generico',
  messico: 'latino_generico', argentina: 'latino_generico',
  stati_uniti: null, australia: 'mediterraneo_generico',
};
const FAMIGLIE_PER_CUCINA = {
  europea: ['mediterranea'], australiana: ['mediterranea'],
  sud_americana: ['latina'], usa: ['americana'],
};
const CUCINA_DI = { australia: 'australiana', messico: 'sud_americana', argentina: 'sud_americana' };
const LIMITE_FERIALE = 45;

async function diagnostica(paese) {
  const cucina = CUCINA_DI[paese];
  const famiglie = FAMIGLIE_PER_CUCINA[cucina];
  const paesiRilevanti = new Set([paese, GENERICO_DI[paese]].filter(Boolean));

  // La STESSA funzione che usa il generatore vero, non una copia - cosi'
  // "gruppo" (calcolato dagli ingredienti) e' calcolato esattamente allo
  // stesso modo, non da un mio duplicato semplificato.
  const piatti = await caricaPiatti(supabase, famiglie);

  console.log(`\n=== ${paese} (cucina=${cucina}, famiglie=${famiglie.join(',')}, paesi rilevanti=${[...paesiRilevanti].join('+')}) ===`);
  console.log('piatti totali caricati per la famiglia (caricaPiatti):', piatti.length);

  const secondiUtilizzabili = piatti.filter(p =>
    p.meal_slot === 'secondo' && p.profilo !== 'neutro' &&
    (p.prep_min || 30) <= LIMITE_FERIALE && (p.tecnica || 'semplice') === 'semplice'
  );
  console.log('secondi utilizzabili (tempo+tecnica ok), OVUNQUE nella famiglia:', secondiUtilizzabili.length);

  const secondiLocali = secondiUtilizzabili.filter(p => paesiRilevanti.has(p.paese));
  console.log('di cui SOLO nel paese scelto + il suo generico:', secondiLocali.length);

  const perProfilo = {};
  const gruppiPerProfilo = {};
  for (const p of secondiLocali) {
    perProfilo[p.profilo] = (perProfilo[p.profilo] || 0) + 1;
    if (p.gruppo) { if (!gruppiPerProfilo[p.profilo]) gruppiPerProfilo[p.profilo] = new Set(); gruppiPerProfilo[p.profilo].add(p.gruppo); }
  }
  console.log('secondi locali per profilo:');
  for (const [k, v] of Object.entries(perProfilo)) {
    console.log(`  ${k}: ${v} piatti, gruppi proteici: [${[...(gruppiPerProfilo[k] || [])].join(', ')}] (${(gruppiPerProfilo[k] || new Set()).size})`);
  }

  const dominanti = Object.keys(perProfilo).filter(pr => perProfilo[pr] >= 5 && (gruppiPerProfilo[pr]?.size || 0) >= 2);
  console.log('profili DOMINANTI (>=5 secondi locali E >=2 gruppi proteici):', dominanti.length ? dominanti : '(NESSUNO - qui fallisce subito)');

  const soloSpecifico = piatti.filter(p => p.paese === paese);
  const perSlotSpecifico = {};
  for (const p of soloSpecifico) perSlotSpecifico[p.meal_slot] = (perSlotSpecifico[p.meal_slot] || 0) + 1;
  console.log(`piatti del solo ${paese} (non generico) per slot:`, perSlotSpecifico);

  const generico = GENERICO_DI[paese];
  const soloGenerico = piatti.filter(p => p.paese === generico);
  const perSlotGenerico = {};
  for (const p of soloGenerico) perSlotGenerico[p.meal_slot] = (perSlotGenerico[p.meal_slot] || 0) + 1;
  console.log(`piatti del generico ${generico} per slot:`, perSlotGenerico);
}

(async () => {
  try {
    await diagnostica('australia');
    await diagnostica('messico');
    await diagnostica('argentina');
  } catch (e) {
    console.error('ERRORE:', e);
  }
})();
