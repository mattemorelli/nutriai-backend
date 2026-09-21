// misura-varianti-rifiuti.js — Punto 9, misura di dettaglio prima di decidere.
// Sola misura: nessuna modifica a genera.js/server.js. Scrive righe di prova
// temporanee in meal_outcomes e le rimuove sempre, in ogni variante.
// Uso: node misura-varianti-rifiuti.js <USER_ID di test>

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva, caricaPiatti, caricaVincoli, gruppoDa, FAMIGLIE_PER_CUCINA, QUOTE } = require('./genera.js');

const USER_ID = process.argv[2];
if (!USER_ID) { console.error('Uso: node misura-varianti-rifiuti.js <USER_ID di test>'); process.exit(1); }

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

async function serie(etichetta) {
  const righe = [];
  const avvisiPerSeed = {};
  const origWarn = console.warn;
  for (const seed of SEEDS) {
    const catturati = [];
    console.warn = (...args) => { catturati.push(args.join(' ')); origWarn(...args); };
    const r = await generaESalva(supabase, USER_ID, seed, { salva: false });
    console.warn = origWarn;
    const avvisi0Secondi = catturati.filter((a) => a.includes('0 secondi disponibili'));
    if (avvisi0Secondi.length) avvisiPerSeed[seed] = avvisi0Secondi;
    righe.push({ seed, giorni_conformi: r.giorni_conformi, gradino: r.gradino, avvisi: avvisi0Secondi });
  }
  console.log(`\n--- ${etichetta} ---`);
  console.log('seed | giorni_conformi | gradino | avvisi');
  for (const r of righe) {
    console.log(
      String(r.seed).padStart(4) + ' | ' + String(r.giorni_conformi).padStart(15) + ' | ' +
      String(r.gradino).padEnd(7) + ' | ' + (r.avvisi.length ? r.avvisi.join(' / ') : '-')
    );
  }
  return { righe, avvisiPerSeed };
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

    // catalogo del test user (stesse famiglie che usa genera.js per lui)
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

    console.log('=== 1) Bersagli ===\n');
    for (const [slot, id] of Object.entries(bersagli)) {
      const p = infoDi.get(id);
      const extra = slot === 'secondo' ? `  | gruppo: ${p?.gruppo}` : '';
      console.log(`  ${slot.padEnd(10)} dish_id=${id}  "${p?.name}"${extra}`);
    }

    // === 2) conteggio secondi ammessi+graditi per gruppo, prima/dopo il rifiuto del secondo ===
    console.log('\n=== 2) Secondi ammessi e graditi per gruppo proteico ===\n');
    const { data: profiloUtente } = await supabase.from('users').select('diet').eq('id', USER_ID).maybeSingle();
    const { ammesso, gradito } = await caricaVincoli(supabase, USER_ID, profiloUtente?.diet || 'onnivoro');
    const secondi = catalogo.filter((p) => p.meal_slot === 'secondo' && ammesso(p) && gradito(p));

    const conteggio = {};
    for (const p of secondi) {
      const g = p.gruppo || '(nessun gruppo)';
      conteggio[g] = (conteggio[g] || 0) + 1;
    }
    const dishIdSecondoRifiutato = bersagli.secondo;
    const secondiDopo = secondi.filter((p) => p.id !== dishIdSecondoRifiutato);
    const conteggioDopo = {};
    for (const p of secondiDopo) {
      const g = p.gruppo || '(nessun gruppo)';
      conteggioDopo[g] = (conteggioDopo[g] || 0) + 1;
    }
    const tuttiGruppi = new Set([...Object.keys(conteggio), ...Object.keys(conteggioDopo), ...Object.keys(QUOTE)]);
    console.log('  gruppo         prima   dopo (tolto il bersaglio "secondo")');
    for (const g of tuttiGruppi) {
      console.log(`  ${g.padEnd(14)} ${String(conteggio[g] || 0).padStart(5)}   ${String(conteggioDopo[g] || 0).padStart(5)}`);
    }

    // === 3) V0 / V1 / V2 ===
    console.log('\n=== 3) Tre varianti, seed 1..20 ===');

    await svuota(usatiTot);
    const v0 = await serie('V0 = nessun rifiuto');

    await svuota(usatiTot);
    await metti([usatiTot[0], usatiTot[1]], bersagli.primo);
    await metti([usatiTot[2], usatiTot[3]], bersagli.secondo);
    await metti([usatiTot[4], usatiTot[5]], bersagli.contorno);
    const v1 = await serie('V1 = solo primo + secondo + contorno (i "vecchi")');
    await svuota(usatiTot);

    await metti([usatiTot[6], usatiTot[7]], bersagli.colazione);
    await metti([usatiTot[8], usatiTot[9]], bersagli.spuntino);
    await metti([usatiTot[10], usatiTot[11]], bersagli.base);
    const v2 = await serie('V2 = solo colazione + spuntino + base (i "nuovi")');
    await svuota(usatiTot);

    console.log('\n=== Riepilogo: seed peggiorati rispetto a V0 ===\n');
    let peggV1 = 0, peggV2 = 0;
    for (let i = 0; i < SEEDS.length; i++) {
      const s0 = v0.righe[i];
      const s1 = v1.righe[i];
      const s2 = v2.righe[i];
      const peggiora1 = s1.giorni_conformi < s0.giorni_conformi || String(s1.gradino) !== String(s0.gradino);
      const peggiora2 = s2.giorni_conformi < s0.giorni_conformi || String(s2.gradino) !== String(s0.gradino);
      if (peggiora1) peggV1++;
      if (peggiora2) peggV2++;
    }
    console.log(`  V1 (primo+secondo+contorno): ${peggV1} / ${SEEDS.length} seed peggiorati rispetto a V0`);
    console.log(`  V2 (colazione+spuntino+base): ${peggV2} / ${SEEDS.length} seed peggiorati rispetto a V0`);

    // === 4) seed con avvisi carne_rossa / uova, e se hanno perso un giorno conforme ===
    console.log('\n=== 4) Seed con avvisi carne_rossa/uova e giorni_conformi ===\n');
    for (const [etichetta, v] of [['V1', v1], ['V2', v2]]) {
      const seedConAvvisi = Object.keys(v.avvisiPerSeed).map(Number);
      console.log(`  ${etichetta}: seed con avviso 0-secondi-disponibili: ${seedConAvvisi.join(', ') || '(nessuno)'}`);
      for (const seed of seedConAvvisi) {
        const s0 = v0.righe.find((r) => r.seed === seed);
        const s = v.righe.find((r) => r.seed === seed);
        const persoGiorno = s.giorni_conformi < s0.giorni_conformi;
        console.log(`    seed ${seed}: giorni_conformi V0=${s0.giorni_conformi} -> ${etichetta}=${s.giorni_conformi}  ${persoGiorno ? '(sì, ha perso un giorno)' : '(no, giorni_conformi invariato)'}`);
      }
    }
  } catch (e) {
    console.error(`ERRORE: ${e.message}`);
  } finally {
    await pulisciTutto();
  }
})();
