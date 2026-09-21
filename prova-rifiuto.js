// prova-rifiuto.js — il gusto toglie un piatto, "ero fuori" no. Su TUTTI gli
// slot (colazione, spuntino, primo, secondo, contorno, base), non solo uno a
// caso: e' proprio quello che ha nascosto il buco di colazione/spuntino/base
// (misurato il 21/09/2026 - candidatiColazione/Spuntino/Base non chiamavano
// mai rifiutato(p)).
// Scrive esiti di prova su plan_items dell'utente di test e li cancella alla fine.
// Uso: node prova-rifiuto.js <USER_ID di test>

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva, caricaPiatti, FAMIGLIE_PER_CUCINA } = require('./genera.js');

const USER_ID = process.argv[2];
if (!USER_ID) { console.error('Uso: node prova-rifiuto.js <USER_ID di test>'); process.exit(1); }

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

const SEED = 1;
let usati = [];

async function pulisci() {
  if (!usati.length) return;
  const { error } = await supabase.from('meal_outcomes').delete().in('plan_item_id', usati);
  console.log(error ? `PULIZIA FALLITA: ${error.message}` : `Pulizia: ${usati.length} esiti di prova rimossi.`);
}

async function metti(dishId, motivo) {
  for (const pid of usati) {
    const { error } = await supabase.from('meal_outcomes').upsert({
      user_id: USER_ID, plan_item_id: pid, dish_id: dishId,
      status: 'saltato', skip_reason: motivo, reported_at: new Date().toISOString(),
    }, { onConflict: 'plan_item_id' });
    if (error) throw new Error(`upsert: ${error.message}`);
  }
}

async function generaDishIds() {
  const r = await generaESalva(supabase, USER_ID, SEED, { salva: false });
  if (!r.dish_ids) throw new Error('dish_ids assente nel ritorno: modifica 1 incompleta');
  return new Set(r.dish_ids);
}

(async () => {
  const risultati = [];
  try {
    // due righe di piano dell'utente di test che non abbiano gia' un esito
    const { data: piani } = await supabase.from('plans').select('id').eq('user_id', USER_ID);
    const { data: righe } = await supabase.from('plan_items').select('id')
      .in('plan_id', (piani || []).map((p) => p.id)).order('id').limit(50);
    const { data: gia } = await supabase.from('meal_outcomes').select('plan_item_id')
      .in('plan_item_id', (righe || []).map((r) => r.id));
    const occupati = new Set((gia || []).map((g) => g.plan_item_id));
    usati = (righe || []).map((r) => r.id).filter((id) => !occupati.has(id)).slice(0, 2);
    if (usati.length < 2) throw new Error('servono 2 righe di piano libere');

    // catalogo, per sapere di che slot e' ogni dish_id della settimana base
    const { data: prefRaw } = await supabase
      .from('user_cuisine_preferences').select('cucina, rank').eq('user_id', USER_ID);
    const preferenze = (prefRaw && prefRaw.length) ? prefRaw : [{ cucina: 'europea', rank: 1 }];
    const famiglie = [...new Set(
      preferenze.sort((a, b) => (a.rank || 9) - (b.rank || 9)).flatMap((p) => FAMIGLIE_PER_CUCINA[p.cucina] || [])
    )];
    const catalogo = await caricaPiatti(supabase, famiglie.length ? famiglie : ['mediterranea'], 6);
    const infoDi = new Map(catalogo.map((p) => [p.id, p]));

    const baseIds = [...await generaDishIds()];
    console.log(`Settimana di riferimento: ${baseIds.length} piatti.\n`);

    // un bersaglio rappresentativo per ciascuno slot, se il piano ce l'ha
    const bersagli = {
      colazione: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'colazione'),
      spuntino: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'spuntino'),
      primo: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'primo'),
      secondo: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'secondo'),
      contorno: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'contorno' && !infoDi.get(id)?.base_amidacea),
      base: baseIds.find((id) => infoDi.get(id)?.meal_slot === 'contorno' && infoDi.get(id)?.base_amidacea),
    };

    for (const [slot, dishId] of Object.entries(bersagli)) {
      if (!dishId) {
        risultati.push({ slot, piatto: '(nessun piatto di questo tipo nel piano di prova)', motivo: '-', atteso: '-', ottenuto: 'SALTATO' });
        continue;
      }
      const nome = infoDi.get(dishId)?.name || dishId;

      await metti(dishId, 'fuori_casa');
      const dopoFuori = await generaDishIds();
      risultati.push({
        slot, piatto: nome, motivo: 'fuori_casa x2',
        atteso: 'RESTA', ottenuto: dopoFuori.has(dishId) ? 'RESTA' : 'SPARISCE',
      });

      await metti(dishId, 'gusto');
      const dopoGusto = await generaDishIds();
      risultati.push({
        slot, piatto: nome, motivo: 'gusto x2',
        atteso: 'SPARISCE', ottenuto: dopoGusto.has(dishId) ? 'RESTA' : 'SPARISCE',
      });
    }

    console.log('slot        | piatto                               | motivo        | atteso   | ottenuto');
    console.log('------------|--------------------------------------|---------------|----------|----------');
    let falliti = 0;
    for (const r of risultati) {
      const ok = r.atteso === '-' || r.atteso === r.ottenuto;
      if (!ok) falliti++;
      console.log(
        r.slot.padEnd(11) + ' | ' + String(r.piatto).slice(0, 36).padEnd(36) + ' | ' +
        r.motivo.padEnd(13) + ' | ' + r.atteso.padEnd(8) + ' | ' + r.ottenuto + (ok ? '' : '  <-- FALLITO')
      );
    }
    console.log(`\n${falliti === 0 ? 'PROVA SUPERATA' : `PROVA FALLITA (${falliti} righe non combaciano)`}\n`);
  } catch (e) {
    console.error(`ERRORE: ${e.message}`);
  } finally {
    await pulisci();
  }
})();
