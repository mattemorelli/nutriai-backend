// prova-esiti-get.js — verifica la logica dietro GET /esiti (replicata qui,
// senza avviare il server): dato un piano, per ogni riga con un esito
// restituisce status/skip_reason e rifiuti_gusto per il piatto di quella riga.
// Crea un piano di prova e 3 esiti finti, legge, verifica, pulisce sempre.
// Uso: node prova-esiti-get.js <USER_ID di test>

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva } = require('./genera.js');

const USER_ID = process.argv[2];
if (!USER_ID) { console.error('Uso: node prova-esiti-get.js <USER_ID di test>'); process.exit(1); }

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

// Stessa identica logica della rotta GET /esiti in server.js.
async function leggiEsiti(planId, userId) {
  const { data: righe, error: eRighe } = await supabase
    .from('plan_items').select('id, dish_id').eq('plan_id', planId);
  if (eRighe) throw new Error('lettura plan_items: ' + eRighe.message);

  const itemIds = (righe || []).map((r) => r.id);
  const dishIds = [...new Set((righe || []).map((r) => r.dish_id))];
  const segnaposto = '00000000-0000-0000-0000-000000000000';

  const { data: esitiRighe, error: eEsiti } = await supabase
    .from('meal_outcomes')
    .select('plan_item_id, status, skip_reason')
    .in('plan_item_id', itemIds.length ? itemIds : [segnaposto]);
  if (eEsiti) throw new Error('lettura meal_outcomes: ' + eEsiti.message);

  const { data: rifiutiRighe, error: eRifiuti } = await supabase
    .from('meal_outcomes')
    .select('dish_id')
    .eq('user_id', userId)
    .eq('status', 'saltato')
    .eq('skip_reason', 'gusto')
    .in('dish_id', dishIds.length ? dishIds : [segnaposto]);
  if (eRifiuti) throw new Error('lettura meal_outcomes (rifiuti): ' + eRifiuti.message);

  const rifiutiGustoPerPiatto = {};
  for (const r of (rifiutiRighe || [])) {
    rifiutiGustoPerPiatto[r.dish_id] = (rifiutiGustoPerPiatto[r.dish_id] || 0) + 1;
  }
  const dishIdDiRiga = {};
  for (const r of righe) dishIdDiRiga[r.id] = r.dish_id;

  return (esitiRighe || []).map((e) => ({
    plan_item_id: e.plan_item_id,
    status: e.status,
    skip_reason: e.skip_reason,
    rifiuti_gusto: rifiutiGustoPerPiatto[dishIdDiRiga[e.plan_item_id]] || 0,
  }));
}

let planId = null;
let usatiEsiti = [];

async function pulisci() {
  if (usatiEsiti.length) await supabase.from('meal_outcomes').delete().in('plan_item_id', usatiEsiti);
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

(async () => {
  try {
    const piano = await generaESalva(supabase, USER_ID, 1, { salva: true });
    planId = piano.plan_id;
    console.log(`Piano di prova: ${planId}`);

    const { data: righe } = await supabase
      .from('plan_items').select('id, dish_id').eq('plan_id', planId).order('id').limit(3);
    if (righe.length < 3) throw new Error('servono almeno 3 righe di piano');
    const [r1, r2, r3] = righe;

    // r1: cucinato. r2: saltato/tempo. r3: saltato/gusto (2 volte, su r3 e su
    // un secondo alias dello stesso piatto se esiste, altrimenti solo su r3).
    async function metti(plan_item_id, dish_id, status, skip_reason) {
      const { error } = await supabase.from('meal_outcomes').upsert({
        user_id: USER_ID, plan_item_id, dish_id, status, skip_reason,
        reported_at: new Date().toISOString(),
      }, { onConflict: 'plan_item_id' });
      if (error) throw new Error(`upsert: ${error.message}`);
      usatiEsiti.push(plan_item_id);
    }

    await metti(r1.id, r1.dish_id, 'cucinato', null);
    await metti(r2.id, r2.dish_id, 'saltato', 'tempo');
    await metti(r3.id, r3.dish_id, 'saltato', 'gusto');

    // una seconda riga "gusto" sullo stesso piatto di r3, per verificare
    // rifiuti_gusto = 2: deve essere una VERA ripetizione dello stesso piatto
    // nel piano (plan_items.dish_id uguale), non un dish_id scritto a mano
    // in meal_outcomes - la rotta si fida di plan_items, non di quello che
    // gli scriviamo qui, esattamente come fa /esito in produzione.
    const { data: altre } = await supabase
      .from('plan_items').select('id').eq('plan_id', planId)
      .eq('dish_id', r3.dish_id)
      .not('id', 'in', `(${r3.id})`).order('id').limit(1);
    const r4 = altre && altre[0];
    if (r4) await metti(r4.id, r3.dish_id, 'saltato', 'gusto');
    else console.log(`(nessuna ripetizione di "${r3.dish_id}" in questo piano: salto il caso rifiuti_gusto=2)`);

    const esiti = await leggiEsiti(planId, USER_ID);
    const trova = (id) => esiti.find((e) => e.plan_item_id === id);

    const attesi = [
      { id: r1.id, etichetta: 'cucinato', status: 'cucinato', skip_reason: null, rifiuti_gusto: 0 },
      { id: r2.id, etichetta: 'saltato/tempo', status: 'saltato', skip_reason: 'tempo', rifiuti_gusto: 0 },
      { id: r3.id, etichetta: 'saltato/gusto', status: 'saltato', skip_reason: 'gusto', rifiuti_gusto: r4 ? 2 : 1 },
    ];
    if (r4) attesi.push({ id: r4.id, etichetta: 'saltato/gusto (2a riga)', status: 'saltato', skip_reason: 'gusto', rifiuti_gusto: 2 });

    console.log('\ncaso                     | atteso                          | ottenuto');
    console.log('-------------------------|----------------------------------|---------');
    let falliti = 0;
    for (const a of attesi) {
      const e = trova(a.id);
      const attesoStr = `status=${a.status}, skip=${a.skip_reason}, rifiuti=${a.rifiuti_gusto}`;
      const ottenutoStr = e
        ? `status=${e.status}, skip=${e.skip_reason}, rifiuti=${e.rifiuti_gusto}`
        : 'RIGA ASSENTE';
      const ok = e && e.status === a.status && e.skip_reason === a.skip_reason && e.rifiuti_gusto === a.rifiuti_gusto;
      if (!ok) falliti++;
      console.log(a.etichetta.padEnd(24) + ' | ' + attesoStr.padEnd(32) + ' | ' + ottenutoStr + (ok ? '' : '  <-- FALLITO'));
    }
    console.log(`\n${falliti === 0 ? 'PROVA SUPERATA' : `PROVA FALLITA (${falliti} righe non combaciano)`}`);
  } catch (e) {
    console.error(`ERRORE: ${e.message}`);
  } finally {
    await pulisci();
  }
})();
