// misura-rifiuti-slot.js — Punto 9, PASSO D: con 6 rifiuti attivi (uno per
// slot: colazione, spuntino, primo, secondo, contorno, base), le settimane
// reggono ancora? Confronta seed 1..20 con e senza i rifiuti.
// Sola lettura sul piano (dry run, salva:false); scrive 12 righe di prova in
// meal_outcomes e le rimuove alla fine.
// Uso: node misura-rifiuti-slot.js <USER_ID di test>

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva, caricaPiatti, FAMIGLIE_PER_CUCINA } = require('./genera.js');

const USER_ID = process.argv[2];
if (!USER_ID) { console.error('Uso: node misura-rifiuti-slot.js <USER_ID di test>'); process.exit(1); }

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
let usati = [];

async function pulisci() {
  if (!usati.length) return;
  const { error } = await supabase.from('meal_outcomes').delete().in('plan_item_id', usati);
  console.log(error ? `PULIZIA FALLITA: ${error.message}` : `Pulizia: ${usati.length} esiti di prova rimossi.`);
}

async function misuraSerie(etichetta) {
  console.log(`\n--- ${etichetta} ---`);
  const righe = [];
  for (const seed of SEEDS) {
    const r = await generaESalva(supabase, USER_ID, seed, { salva: false });
    righe.push({ seed, giorni_conformi: r.giorni_conformi, gradino: r.gradino });
  }
  console.log('seed | giorni_conformi | gradino');
  for (const r of righe) {
    console.log(String(r.seed).padStart(4) + ' | ' + String(r.giorni_conformi).padStart(15) + ' | ' + r.gradino);
  }
  return righe;
}

(async () => {
  try {
    const { data: piani } = await supabase.from('plans').select('id').eq('user_id', USER_ID);
    const { data: righePiano } = await supabase.from('plan_items').select('id')
      .in('plan_id', (piani || []).map((p) => p.id)).order('id').limit(50);
    const { data: gia } = await supabase.from('meal_outcomes').select('plan_item_id')
      .in('plan_item_id', (righePiano || []).map((r) => r.id));
    const occupati = new Set((gia || []).map((g) => g.plan_item_id));
    usati = (righePiano || []).map((r) => r.id).filter((id) => !occupati.has(id)).slice(0, 12);
    if (usati.length < 12) throw new Error(`servono 12 righe di piano libere, trovate ${usati.length}`);

    // baseline SENZA rifiuti (nessuna riga in meal_outcomes per questo utente)
    const senza = await misuraSerie('SENZA rifiuti');

    // catalogo, per scegliere un bersaglio per slot
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
    console.log('\nBersagli scelti (2 salti "gusto" ciascuno):');
    for (const [slot, id] of Object.entries(bersagli)) {
      console.log(`  ${slot}: ${id ? (infoDi.get(id)?.name || id) : '(nessuno trovato, salto questo slot)'}`);
    }

    let cursore = 0;
    for (const [, dishId] of Object.entries(bersagli)) {
      if (!dishId) continue;
      const due = [usati[cursore], usati[cursore + 1]];
      cursore += 2;
      for (const pid of due) {
        const { error } = await supabase.from('meal_outcomes').upsert({
          user_id: USER_ID, plan_item_id: pid, dish_id: dishId,
          status: 'saltato', skip_reason: 'gusto', reported_at: new Date().toISOString(),
        }, { onConflict: 'plan_item_id' });
        if (error) throw new Error(`upsert: ${error.message}`);
      }
    }

    const con = await misuraSerie('CON 6 rifiuti attivi');

    console.log('\n=== Confronto ===');
    console.log('seed | giorni_conformi (senza -> con) | gradino (senza -> con)');
    let calati = 0, saliti = 0;
    for (let i = 0; i < SEEDS.length; i++) {
      const s = senza[i], c = con[i];
      const giorniCalati = c.giorni_conformi < s.giorni_conformi;
      const gradinoSalito = String(c.gradino) !== String(s.gradino);
      if (giorniCalati) calati++;
      if (gradinoSalito) saliti++;
      console.log(
        String(s.seed).padStart(4) + ' | ' +
        `${s.giorni_conformi} -> ${c.giorni_conformi}`.padEnd(31) + ' | ' +
        `${s.gradino} -> ${c.gradino}` + (giorniCalati || gradinoSalito ? '   <-- CAMBIATO' : '')
      );
    }
    console.log(`\nSeed con giorni_conformi calati: ${calati} / ${SEEDS.length}`);
    console.log(`Seed con gradino diverso:        ${saliti} / ${SEEDS.length}`);
  } catch (e) {
    console.error(`ERRORE: ${e.message}`);
  } finally {
    await pulisci();
  }
})();
