// misura-statistiche-varianti.js — Punto 9, statistiche V0/V1/V2/V3.
// Sola misura: nessuna modifica a genera.js/server.js. Scrive righe di prova
// temporanee in meal_outcomes e le rimuove sempre.
// Uso: node misura-statistiche-varianti.js <USER_ID di test>

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva, caricaPiatti, FAMIGLIE_PER_CUCINA } = require('./genera.js');

const USER_ID = process.argv[2];
if (!USER_ID) { console.error('Uso: node misura-statistiche-varianti.js <USER_ID di test>'); process.exit(1); }

// Guardrail: gli utenti veri si misurano solo dicendolo a voce alta.
const UTENTE_DI_TEST = 'c29890d4-a37f-4995-a00d-543d07263c32';

if (USER_ID !== UTENTE_DI_TEST && !process.argv.includes('--utente-reale')) {
  console.error(
    `FERMO: ${USER_ID} non e' l'utente di test.\n` +
    `Se e' voluto, rilancia aggiungendo --utente-reale.`
  );
  process.exit(1);
}
if (USER_ID !== UTENTE_DI_TEST) {
  console.warn(`ATTENZIONE: sto misurando su un utente reale (${USER_ID}).\n`);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);
let usatiTot = [];

async function pulisciTutto() {
  if (!usatiTot.length) return;
  const { error } = await supabase.from('meal_outcomes').delete().in('plan_item_id', usatiTot);
  console.log(error ? `PULIZIA FALLITA: ${error.message}` : `Pulizia finale: ${usatiTot.length} righe di prova rimosse.`);
}

async function svuota(ids) {
  if (!ids.length) return;
  await supabase.from('meal_outcomes').delete().in('plan_item_id', ids);
}

async function metti(ids, dishId) {
  for (const pid of ids) {
    const { error } = await supabase.from('meal_outcomes').upsert({
      user_id: USER_ID, plan_item_id: pid, dish_id: dishId,
      status: 'saltato', skip_reason: 'gusto', reported_at: new Date().toISOString(),
    }, { onConflict: 'plan_item_id' });
    if (error) throw new Error(`upsert: ${error.message}`);
  }
}

async function serie() {
  const righe = [];
  for (const seed of SEEDS) {
    const r = await generaESalva(supabase, USER_ID, seed, { salva: false });
    righe.push({ seed, giorni_conformi: r.giorni_conformi, gradino: r.gradino, concessioni: (r.concessioni || []).length });
  }
  return righe;
}

function statistiche(etichetta, righe) {
  const valori = righe.map((r) => r.giorni_conformi);
  const media = valori.reduce((a, b) => a + b, 0) / valori.length;
  const minimo = Math.min(...valori);
  const perGradino = {};
  for (const r of righe) perGradino[r.gradino] = (perGradino[r.gradino] || 0) + 1;
  const totConcessioni = righe.reduce((a, r) => a + r.concessioni, 0);

  console.log(`\n--- ${etichetta} ---`);
  console.log(`  media giorni_conformi: ${media.toFixed(2)}   minimo: ${minimo}`);
  console.log('  seed per gradino:');
  const ORDINE = ['0', '1', '2', '2b', '3a', '3b', '4', '4b', '5'];
  for (const g of ORDINE) {
    if (perGradino[g]) console.log(`    ${g}: ${perGradino[g]}`);
  }
  for (const g of Object.keys(perGradino)) {
    if (!ORDINE.includes(g)) console.log(`    ${g} (fuori elenco atteso): ${perGradino[g]}`);
  }
  console.log(`  concessioni totali sui 20 seed: ${totConcessioni}`);
}

(async () => {
  try {
    const { data: piani } = await supabase.from('plans').select('id').eq('user_id', USER_ID);
    const { data: righePiano } = await supabase.from('plan_items').select('id')
      .in('plan_id', (piani || []).map((p) => p.id)).order('id').limit(50);
    const { data: gia } = await supabase.from('meal_outcomes').select('plan_item_id')
      .in('plan_item_id', (righePiano || []).map((r) => r.id));
    const occupati = new Set((gia || []).map((g) => g.plan_item_id));
    const liberi = (righePiano || []).map((r) => r.id).filter((id) => !occupati.has(id));
    if (liberi.length < 12) throw new Error(`servono 12 righe di piano libere, trovate ${liberi.length}`);
    usatiTot = liberi.slice(0, 12);

    const { data: prefRaw } = await supabase
      .from('user_cuisine_preferences').select('cucina, rank').eq('user_id', USER_ID);
    const preferenze = (prefRaw && prefRaw.length) ? prefRaw : [{ cucina: 'europea', rank: 1 }];
    const famiglie = [...new Set(
      preferenze.sort((a, b) => (a.rank || 9) - (b.rank || 9)).flatMap((p) => FAMIGLIE_PER_CUCINA[p.cucina] || [])
    )];
    const catalogo = await caricaPiatti(supabase, famiglie.length ? famiglie : ['mediterranea'], 6);
    const infoDi = new Map(catalogo.map((p) => [p.id, p]));

    const baseIds = [...new Set((await generaESalva(supabase, USER_ID, 1, { salva: false })).dish_ids)];
    const bersagli = {
      colazione: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'colazione'),
      spuntino: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'spuntino'),
      primo: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'primo'),
      secondo: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'secondo'),
      contorno: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'contorno' && !infoDi.get(id)?.base_amidacea),
      base: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'contorno' && infoDi.get(id)?.base_amidacea),
    };

    await svuota(usatiTot);
    const v0 = await serie();
    statistiche('V0 = nessun rifiuto', v0);

    await svuota(usatiTot);
    await metti([usatiTot[0], usatiTot[1]], bersagli.primo);
    await metti([usatiTot[2], usatiTot[3]], bersagli.secondo);
    await metti([usatiTot[4], usatiTot[5]], bersagli.contorno);
    const v1 = await serie();
    statistiche('V1 = primo+secondo+contorno', v1);

    await svuota(usatiTot);
    await metti([usatiTot[6], usatiTot[7]], bersagli.colazione);
    await metti([usatiTot[8], usatiTot[9]], bersagli.spuntino);
    await metti([usatiTot[10], usatiTot[11]], bersagli.base);
    const v2 = await serie();
    statistiche('V2 = colazione+spuntino+base', v2);

    // V3: tutti e sei insieme
    await metti([usatiTot[0], usatiTot[1]], bersagli.primo);
    await metti([usatiTot[2], usatiTot[3]], bersagli.secondo);
    await metti([usatiTot[4], usatiTot[5]], bersagli.contorno);
    const v3 = await serie();
    statistiche('V3 = tutti e 6 i rifiuti', v3);

    await svuota(usatiTot);
  } catch (e) {
    console.error(`ERRORE: ${e.message}`);
  } finally {
    await pulisciTutto();
  }
})();
