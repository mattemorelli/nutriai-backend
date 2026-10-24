// 2026-10-08 — Verifica il filtro mercati=['it'] appena introdotto:
// genera 4 settimane per 4 profili di prova e controlla, con uno script
// (non a occhio), che non compaia MAI un piatto fuori mercato; conta le
// ripetizioni per portata; conta quante volte il generatore e' dovuto
// scendere ai gradini di allentamento piu' bassi. Prova anche 20 Swap
// a caso: nessuna alternativa fuori mercato.
//
// Nota: questi utenti di prova non hanno meal_outcomes pregressi, quindi
// il generatore non ha memoria di "cosa ho mangiato la settimana scorsa"
// tra una chiamata e l'altra - le ripetizioni misurate qui sono quindi
// un limite superiore onesto, non quello che vedrebbe un utente vero con
// settimane di storico reale.
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');
const { generaESalva, MERCATO_ATTIVO } = require('../genera');
const { trovaProposte } = require('../sostituisci');
const { TEST_USERS, assertUtenteDiTest } = require('../test-users');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const PROFILI = [
  { nome: 'onnivoro', userKey: 'basso' },
  { nome: 'vegano', userKey: 'vegano' },
  { nome: 'pescetariano + senza glutine', userKey: 'pescetarianoGlutine' },
  { nome: 'vegetariano + senza glutine + senza lattosio', userKey: 'vegetarianoGlutineLattosio' },
];

async function righePiano(planId) {
  const { data, error } = await supabase
    .from('plan_items')
    .select('slot, dish_id')
    .eq('plan_id', planId);
  if (error) throw new Error(error.message);
  return data;
}

async function mercatiDi(dishIds) {
  const { data, error } = await supabase
    .from('dishes')
    .select('id, name, mercati')
    .in('id', [...new Set(dishIds)]);
  if (error) throw new Error(error.message);
  const m = {};
  for (const r of data) m[r.id] = r;
  return m;
}

(async () => {
  const risultatiFinali = [];
  const planIdPerUtente = []; // { userId, planId } per il campione di Swap dopo

  for (const profilo of PROFILI) {
    const userId = TEST_USERS[profilo.userKey].id;
    assertUtenteDiTest(userId);
    console.log(`\n=== ${profilo.nome} (utente ${profilo.userKey}) ===`);

    const gradiniUsati = {};
    const conteggioPerSlot = {}; // slot -> { dishId: count }
    let fuoriMercatoTrovati = [];
    let settimaneOk = 0;

    for (let settimana = 1; settimana <= 4; settimana++) {
      let r;
      try {
        r = await generaESalva(supabase, userId, null, {});
      } catch (e) {
        console.log(`  settimana ${settimana}: ERRORE generazione — ${e.message}`);
        continue;
      }
      settimaneOk++;
      gradiniUsati[r.gradino] = (gradiniUsati[r.gradino] || 0) + 1;
      planIdPerUtente.push({ userId, planId: r.plan_id });

      const righe = await righePiano(r.plan_id);
      const mercati = await mercatiDi(righe.map(x => x.dish_id));
      for (const riga of righe) {
        const d = mercati[riga.dish_id];
        if (!d || !(d.mercati || []).includes(MERCATO_ATTIVO)) {
          fuoriMercatoTrovati.push({ settimana, slot: riga.slot, dish_id: riga.dish_id, name: d?.name || '(non trovato)' });
        }
        (conteggioPerSlot[riga.slot] ||= {})[riga.dish_id] = ((conteggioPerSlot[riga.slot] ||= {})[riga.dish_id] || 0) + 1;
      }
      console.log(`  settimana ${settimana}: gradino ${r.gradino}, ${righe.length} pasti, plan_id ${r.plan_id}`);
    }

    console.log(`  Piatti fuori mercato trovati: ${fuoriMercatoTrovati.length}`);
    if (fuoriMercatoTrovati.length) {
      fuoriMercatoTrovati.forEach(f => console.log(`    - settimana ${f.settimana} [${f.slot}] ${f.name} (${f.dish_id})`));
    }

    console.log('  Gradini usati:', JSON.stringify(gradiniUsati));

    console.log('  Ripetizioni per portata (su 4 settimane):');
    const riepilogoSlot = {};
    for (const [slot, conteggi] of Object.entries(conteggioPerSlot)) {
      const usi = Object.values(conteggi);
      const distinti = usi.length;
      const usiTotali = usi.reduce((a, b) => a + b, 0);
      const ripetizioni = usiTotali - distinti; // quante volte un piatto e' stato riusato oltre alla prima
      const maxRipetuto = Math.max(...usi);
      riepilogoSlot[slot] = { distinti, usiTotali, ripetizioni, maxRipetuto };
      console.log(`    ${slot}: ${distinti} piatti distinti su ${usiTotali} usi, ${ripetizioni} ripetizioni, il piu' ripetuto ${maxRipetuto} volte`);
    }

    risultatiFinali.push({
      profilo: profilo.nome, settimaneOk, fuoriMercato: fuoriMercatoTrovati.length,
      gradiniUsati, riepilogoSlot,
    });
  }

  // ---- 20 Swap a caso, presi dai piani appena generati sopra ----
  console.log('\n=== 20 Swap a caso ===');
  const tuttePlanId = [...new Set(planIdPerUtente.map(x => x.planId))];
  const { data: righeCandidate, error: eCand } = await supabase
    .from('plan_items')
    .select('id, plan_id, dish_id')
    .in('plan_id', tuttePlanId);
  if (eCand) throw new Error(eCand.message);

  const utenteDiPlan = {};
  for (const x of planIdPerUtente) utenteDiPlan[x.planId] = x.userId;

  const campione = [...righeCandidate].sort(() => Math.random() - 0.5).slice(0, 20);
  let swapFuoriMercato = 0;
  let swapTotaleProposte = 0;
  let swapErrori = 0;
  for (const riga of campione) {
    const userId = utenteDiPlan[riga.plan_id];
    let risposta;
    try {
      risposta = await trovaProposte(supabase, userId, riga.id);
    } catch (e) {
      swapErrori++;
      console.log(`  ERRORE Swap su plan_item ${riga.id}: ${e.message}`);
      continue;
    }
    const proposte = risposta?.proposte || [];
    const mercati = await mercatiDi(proposte.map(p => p.dish_id));
    for (const p of proposte) {
      swapTotaleProposte++;
      const d = mercati[p.dish_id];
      if (!d || !(d.mercati || []).includes(MERCATO_ATTIVO)) {
        swapFuoriMercato++;
        console.log(`  FUORI MERCATO: proposta ${p.nome} (${p.dish_id}) per plan_item ${riga.id}`);
      }
    }
  }
  console.log(`Swap testati: ${campione.length} (errori: ${swapErrori}), proposte totali: ${swapTotaleProposte}, fuori mercato: ${swapFuoriMercato}`);

  console.log('\n=== RIEPILOGO ===');
  console.log(JSON.stringify(risultatiFinali, null, 2));
  console.log(`Swap: ${swapTotaleProposte} proposte, ${swapFuoriMercato} fuori mercato`);
})().catch(e => { console.error('ERRORE:', e.message, e.stack); process.exitCode = 1; });
