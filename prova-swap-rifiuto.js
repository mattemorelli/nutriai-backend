// prova-swap-rifiuto.js — lo Swap non deve proporre un piatto rifiutato due
// volte per gusto ("fuori casa" invece non conta, come nel generatore).
// Genera un piano vero per l'utente di test (salva:true), chiama trovaProposte,
// segna 2 esiti finti su un piatto proposto e verifica che sparisca; con
// "fuori_casa" invece deve restare. Pulisce sempre: esiti, plan_items, piano.
// Uso: node prova-swap-rifiuto.js <USER_ID di test>

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva } = require('./genera.js');
const { trovaProposte } = require('./sostituisci.js');

const USER_ID = process.argv[2];
if (!USER_ID) { console.error('Uso: node prova-swap-rifiuto.js <USER_ID di test>'); process.exit(1); }

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

let planId = null;
let usatiEsiti = [];

async function pulisci() {
  if (usatiEsiti.length) {
    await supabase.from('meal_outcomes').delete().in('plan_item_id', usatiEsiti);
  }
  if (planId) {
    await supabase.from('plan_items').delete().eq('plan_id', planId);
    await supabase.from('plans').delete().eq('id', planId);
  }
  const { count: c1 } = await supabase
    .from('meal_outcomes').select('id', { count: 'exact', head: true }).eq('user_id', USER_ID);
  const { count: c2 } = await supabase
    .from('plans').select('id', { count: 'exact', head: true }).eq('user_id', USER_ID);
  console.log(`\nPulizia: meal_outcomes residui = ${c1}, plans residui = ${c2}`);
}

async function metti(plan_item_id, dish_id, skip_reason) {
  const { error } = await supabase.from('meal_outcomes').upsert({
    user_id: USER_ID, plan_item_id, dish_id,
    status: 'saltato', skip_reason, reported_at: new Date().toISOString(),
  }, { onConflict: 'plan_item_id' });
  if (error) throw new Error(`upsert: ${error.message}`);
  usatiEsiti.push(plan_item_id);
}

(async () => {
  const risultati = [];
  try {
    const piano = await generaESalva(supabase, USER_ID, 1, { salva: true });
    planId = piano.plan_id;
    console.log(`Piano di prova: ${planId}`);

    const { data: righe } = await supabase
      .from('plan_items').select('id, slot, dish_id')
      .eq('plan_id', planId).order('id');
    const itemPrimo = righe.find((r) => r.slot === 'primo');
    if (!itemPrimo) throw new Error('nessun primo nel piano di prova');

    const libere = righe.filter((r) => r.id !== itemPrimo.id).map((r) => r.id).slice(0, 4);
    if (libere.length < 4) throw new Error('servono almeno 4 altre righe di piano');
    const [pidD1, pidD2, pidE1, pidE2] = libere;

    const primaDiTutto = await trovaProposte(supabase, USER_ID, itemPrimo.id);
    if (!primaDiTutto.proposte || primaDiTutto.proposte.length < 2) {
      throw new Error('servono almeno 2 proposte per la prova');
    }
    const D = primaDiTutto.proposte[0].dish_id;
    const E = primaDiTutto.proposte[1].dish_id;
    console.log(`Proposte iniziali: ${primaDiTutto.proposte.map((p) => p.dish_id).join(', ')}`);
    console.log(`D (verra' rifiutato per gusto): ${D}`);
    console.log(`E (verra' segnato fuori_casa):  ${E}\n`);

    await metti(pidD1, D, 'gusto');
    await metti(pidD2, D, 'gusto');
    const dopoGusto = await trovaProposte(supabase, USER_ID, itemPrimo.id);
    const dInclusoDopoGusto = (dopoGusto.proposte || []).some((p) => p.dish_id === D);
    risultati.push({ caso: 'D con 2 esiti "gusto"', atteso: 'ASSENTE', ottenuto: dInclusoDopoGusto ? 'PRESENTE' : 'ASSENTE' });

    await metti(pidE1, E, 'fuori_casa');
    await metti(pidE2, E, 'fuori_casa');
    const dopoFuoriCasa = await trovaProposte(supabase, USER_ID, itemPrimo.id);
    const eInclusoDopoFuoriCasa = (dopoFuoriCasa.proposte || []).some((p) => p.dish_id === E);
    risultati.push({ caso: 'E con 2 esiti "fuori_casa"', atteso: 'PRESENTE', ottenuto: eInclusoDopoFuoriCasa ? 'PRESENTE' : 'ASSENTE' });

    console.log('caso                         | atteso    | ottenuto');
    console.log('------------------------------|-----------|---------');
    let falliti = 0;
    for (const r of risultati) {
      const ok = r.atteso === r.ottenuto;
      if (!ok) falliti++;
      console.log(r.caso.padEnd(30) + ' | ' + r.atteso.padEnd(9) + ' | ' + r.ottenuto + (ok ? '' : '  <-- FALLITO'));
    }
    console.log(`\n${falliti === 0 ? 'PROVA SUPERATA' : `PROVA FALLITA (${falliti} righe non combaciano)`}`);
  } catch (e) {
    console.error(`ERRORE: ${e.message}`);
  } finally {
    await pulisci();
  }
})();
