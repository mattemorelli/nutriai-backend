// Controllo automatico sulle ricette (passi Cook) - versione generica,
// derivata da verifica-cook.js (stessa logica, stesse regole) ma con due
// differenze pensate per essere richiamabile sia PRIMA di scrivere un lotto
// nuovo sia DOPO, come controllo permanente in "npm run verifica":
//   1. usa supabase-js (REST) invece di una connessione diretta a
//      Postgres - quella non e' sempre raggiungibile da qui (vedi la
//      diagnosi del 23 ottobre sul lotto 02).
//   2. gli "ingredienti reali" di un piatto, con cui si confrontano le
//      quote dei passi, possono venire dal database (comportamento di
//      default, per il controllo permanente su cio' che e' gia' scritto)
//      OPPURE da un file piatti.json locale passato con --piatti=, per
//      validare un lotto nuovo PRIMA di scriverlo (i piatti non esistono
//      ancora nel database, quindi non c'e' niente da leggere li').
//
// SOLA LETTURA in entrambi i casi: non scrive mai nulla.
//
// Uso:
//   node scripts/verifica-ricette.js <ricette.json>                 (contro il database)
//   node scripts/verifica-ricette.js <ricette.json> --piatti=<piatti.json>   (contro un lotto non ancora scritto)
//   node scripts/verifica-ricette.js --db                           (controllo permanente: TUTTE le ricette gia' nel database)
//
// Fallisce (exit code 1) se trova almeno un errore. Gli avvisi non
// bloccano, ma vale la pena leggerli.
require('dotenv').config();
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const argv = process.argv.slice(2);
const modoDb = argv.includes('--db');
const argPiatti = argv.find((a) => a.startsWith('--piatti='));
const fileRicette = argv.find((a) => !a.startsWith('--'));
const filePiatti = argPiatti ? argPiatti.slice('--piatti='.length) : null;

const FUOCO_VALIDI = new Set(['basso', 'medio', 'alto']);
const TIPO_TEMPO_VALIDI = new Set(['attiva', 'attesa']);
const AZIONI_DI_COTTURA = new Set([
  'cuocere', 'bollire', 'infornare', 'stufare', 'soffriggere', 'saltare', 'rosolare', 'grigliare', 'arrostire', 'tostare',
]);
const MAX_CARATTERI = 210;
const RX_UNITA_VIETATE = /\b\d+([.,]\d+)?\s*(ml|millilitri|l|litri?|kg|chil[oi]|g|grammi)\b/i;
const RX_ULTIMI_MINUTI = /\b(ultim[oi]\s+\d+\s+minut\w*|last\s+\d+\s+minutes?)\b/i;
const FOOD_IDS_RICHIEDONO_ANTICIPO = new Set([
  'ceci_secchi_it', 'fave_secche_it', 'piselli_secchi_it', 'fagioli_secchi_it', 'baccala_it',
]);

function calcolaTimeline(passi, avvisi, etichetta) {
  let totale = 0;
  let residuo = 0;
  for (const p of passi) {
    if (p.durata_min == null) continue;
    if (p.tipo_tempo === 'attesa') { totale += p.durata_min; residuo = p.durata_min; continue; }
    if (p.in_parallelo) {
      if (p.durata_min <= residuo) { residuo -= p.durata_min; }
      else {
        const eccedenza = p.durata_min - residuo;
        totale += eccedenza;
        avvisi.push(`${etichetta} passo ${p.ordine}: in_parallelo dura ${p.durata_min} min ma l'attesa che lo contiene ne aveva ${residuo === 0 ? 0 : residuo} residui - eccedenza di ${eccedenza} min sommata al totale`);
        residuo = 0;
      }
    } else { totale += p.durata_min; residuo = 0; }
  }
  return Math.round(totale * 10) / 10;
}

(async () => {
  const { data: azioniCook, error: eAz } = await supabase.from('azioni_cook').select('codice');
  if (eAz) throw new Error('lettura azioni_cook: ' + eAz.message);
  const AZIONI_CHIUSE = new Set(azioniCook.map((a) => a.codice));

  let ricette;
  const realiPerPiatto = new Map();

  if (modoDb) {
    const { data: passi, error: eP } = await supabase.from('ricetta_passi').select('*, dishes(name)').order('dish_id').order('ordine');
    if (eP) throw new Error('lettura ricetta_passi: ' + eP.message);
    const { data: info } = await supabase.from('ricetta_info').select('*');
    const infoPerDish = new Map((info || []).map((i) => [i.dish_id, i]));
    const perDish = new Map();
    for (const p of passi) {
      if (!perDish.has(p.dish_id)) perDish.set(p.dish_id, { dish_id: p.dish_id, nome: p.dishes?.name || p.dish_id, nome_en: '', note: [], passi: [] });
      const r = infoPerDish.get(p.dish_id);
      perDish.get(p.dish_id).prep_anticipo = r ? { it: r.prep_anticipo_it, en: r.prep_anticipo_en, ore: r.ore_anticipo } : null;
      perDish.get(p.dish_id).passi.push(p);
    }
    ricette = [...perDish.values()];
    const dishIds = ricette.map((r) => r.dish_id);
    const { data: ing, error: eIng } = await supabase.from('dish_ingredients').select('dish_id, food_id').in('dish_id', dishIds);
    if (eIng) throw new Error('lettura dish_ingredients: ' + eIng.message);
    for (const r of ing) {
      if (!realiPerPiatto.has(r.dish_id)) realiPerPiatto.set(r.dish_id, new Set());
      realiPerPiatto.get(r.dish_id).add(r.food_id);
    }
    console.log(`Controllo permanente: ${ricette.length} piatti con ricetta_passi nel database.`);
  } else {
    if (!fileRicette) {
      console.error('Uso: node scripts/verifica-ricette.js <ricette.json> [--piatti=<piatti.json>] oppure --db');
      process.exit(1);
    }
    const dati = require(path.resolve(process.cwd(), fileRicette));
    ricette = dati.ricette;
    if (filePiatti) {
      const piatti = require(path.resolve(process.cwd(), filePiatti)).piatti;
      for (const p of piatti) realiPerPiatto.set(p.id, new Set(p.ingredienti.map(([fid]) => fid)));
      console.log(`Controllo pre-scrittura: ${ricette.length} ricette contro ${filePiatti} (piatti non ancora nel database).`);
    } else {
      const dishIds = ricette.map((r) => r.dish_id);
      const { data: ing, error: eIng } = await supabase.from('dish_ingredients').select('dish_id, food_id').in('dish_id', dishIds);
      if (eIng) throw new Error('lettura dish_ingredients: ' + eIng.message);
      for (const r of ing) {
        if (!realiPerPiatto.has(r.dish_id)) realiPerPiatto.set(r.dish_id, new Set());
        realiPerPiatto.get(r.dish_id).add(r.food_id);
      }
      console.log(`Controllo: ${ricette.length} ricette da ${fileRicette}, ingredienti letti dal database.`);
    }
  }

  const errori = [];
  const avvisi = [];

  for (const ricetta of ricette) {
    const etichetta = `${ricetta.nome} (${String(ricetta.dish_id).slice(0, 8)})`;
    const reali = realiPerPiatto.get(ricetta.dish_id) || new Set();
    if (!reali.size) { errori.push(`${etichetta}: nessun ingrediente trovato per questo dish_id`); continue; }

    const quotePerFood = new Map();
    let nPassi = 0;
    let primoPreriscaldare = null, primoInfornare = null, primoBollire = null, primoScaldaAcqua = null;
    const passiScaldaAcqua = [];

    for (const p of ricetta.passi) {
      nPassi++;
      const dove = `${etichetta} passo ${p.ordine}`;

      if (!AZIONI_CHIUSE.has(p.azione)) errori.push(`${dove}: azione "${p.azione}" non e' nell'elenco chiuso`);
      if (p.azione === 'preriscaldare' && primoPreriscaldare == null) primoPreriscaldare = p.ordine;
      if (p.azione === 'infornare' && primoInfornare == null) primoInfornare = p.ordine;
      if (p.azione === 'bollire' && primoBollire == null) primoBollire = p.ordine;
      if (p.azione === 'scaldare' && /\bacqua\b/i.test(p.testo_it || '')) {
        if (primoScaldaAcqua == null) primoScaldaAcqua = p.ordine;
        passiScaldaAcqua.push(p);
      }

      if (!p.testo_it || !p.testo_it.trim()) errori.push(`${dove}: testo_it mancante`);
      if (!p.testo_en || !p.testo_en.trim()) errori.push(`${dove}: testo_en mancante`);
      if (p.testo_it && p.testo_it.length > MAX_CARATTERI) avvisi.push(`${dove}: testo_it lungo ${p.testo_it.length} caratteri`);
      if (p.testo_en && p.testo_en.length > MAX_CARATTERI) avvisi.push(`${dove}: testo_en lungo ${p.testo_en.length} caratteri`);

      for (const [lingua, testo] of [['IT', p.testo_it], ['EN', p.testo_en]]) {
        if (testo && RX_UNITA_VIETATE.test(testo)) errori.push(`${dove}: quantita' assoluta vietata nel testo ${lingua}: "${testo}"`);
        if (testo && RX_ULTIMI_MINUTI.test(testo)) avvisi.push(`${dove}: possibile doppio conteggio del tempo (${lingua}): "${testo}"`);
      }

      if (AZIONI_DI_COTTURA.has(p.azione) && p.durata_min == null) errori.push(`${dove}: azione di cottura "${p.azione}" senza durata_min`);
      if (p.durata_min != null && !TIPO_TEMPO_VALIDI.has(p.tipo_tempo)) errori.push(`${dove}: durata_min presente ma tipo_tempo non valido ("${p.tipo_tempo}")`);

      const haForno = p.temperatura_c != null || p.forno_modalita != null;
      if (haForno && (p.temperatura_c == null || !p.forno_modalita)) errori.push(`${dove}: forno con temperatura o modalita' mancante (temp=${p.temperatura_c}, modalita=${p.forno_modalita})`);

      if (p.fuoco != null && !FUOCO_VALIDI.has(p.fuoco)) errori.push(`${dove}: fuoco "${p.fuoco}" non valido (basso/medio/alto)`);

      if (typeof p.tempo_da_confezione !== 'boolean') errori.push(`${dove}: tempo_da_confezione deve essere booleano`);
      if (typeof p.in_parallelo !== 'boolean') errori.push(`${dove}: in_parallelo deve essere booleano`);
      if (p.in_parallelo && p.tipo_tempo === 'attesa') errori.push(`${dove}: in_parallelo=true su un passo di attesa non ha senso`);
      if (p.in_parallelo && p.durata_min == null) errori.push(`${dove}: in_parallelo=true ma durata_min mancante`);

      for (const ing of (p.ingredienti || [])) {
        if (!reali.has(ing.food_id)) { errori.push(`${dove}: usa food_id "${ing.food_id}" che non e' tra gli ingredienti reali del piatto`); continue; }
        quotePerFood.set(ing.food_id, (quotePerFood.get(ing.food_id) || 0) + ing.quota);
      }
    }

    for (const foodId of reali) {
      const somma = quotePerFood.get(foodId);
      if (somma == null) errori.push(`${etichetta}: l'ingrediente reale "${foodId}" non compare in nessun passo`);
      else if (Math.abs(somma - 1) > 0.01) errori.push(`${etichetta}: le quote di "${foodId}" sommano a ${somma.toFixed(3)}, non 1`);
    }

    if (primoInfornare != null) {
      if (primoPreriscaldare == null) errori.push(`${etichetta}: usa "infornare" ma non ha nessun passo "preriscaldare"`);
      else if (primoPreriscaldare > primoInfornare) errori.push(`${etichetta}: "preriscaldare" (passo ${primoPreriscaldare}) viene dopo il primo "infornare" (passo ${primoInfornare})`);
    }
    if (primoBollire != null) {
      if (primoScaldaAcqua == null) errori.push(`${etichetta}: usa "bollire" ma non ha nessun passo che scalda l'acqua prima`);
      else if (primoScaldaAcqua > primoBollire) errori.push(`${etichetta}: lo scaldare l'acqua (passo ${primoScaldaAcqua}) viene dopo il primo "bollire" (passo ${primoBollire})`);
    }
    for (const p of passiScaldaAcqua) {
      if (p.ordine > 2 && !p.in_parallelo) avvisi.push(`${etichetta} passo ${p.ordine}: "scaldare" l'acqua non e' fra i primi due passi e non e' in_parallelo`);
    }

    const serveAnticipo = [...reali].some((f) => FOOD_IDS_RICHIEDONO_ANTICIPO.has(f));
    if (serveAnticipo && !ricetta.prep_anticipo) errori.push(`${etichetta}: ha un ingrediente che richiede ammollo/dissalatura ma non ha prep_anticipo`);
    if (ricetta.prep_anticipo) {
      const pa = ricetta.prep_anticipo;
      if (!pa.it || !pa.en || !(pa.ore > 0)) errori.push(`${etichetta}: prep_anticipo presente ma incompleto (serve it, en, ore > 0)`);
    }

    const totale = calcolaTimeline(ricetta.passi, avvisi, etichetta);
    console.log(`${etichetta}: ${nPassi} passi, ${reali.size} ingredienti reali${ricetta.prep_anticipo ? ', ' + ricetta.prep_anticipo.ore + 'h anticipo' : ''} | tempo totale reale ${totale} min`);
  }

  console.log('\n=== Esito ===');
  if (avvisi.length) {
    console.log(`${avvisi.length} avvisi (non bloccanti):`);
    for (const a of avvisi) console.log('  -', a);
  }
  if (errori.length) {
    console.log(`\n${errori.length} ERRORI:`);
    for (const e of errori) console.log('  -', e);
    process.exitCode = 1;
  } else {
    console.log('\nNessun errore. Tutte le ricette passano il controllo.');
  }
})().catch((e) => { console.error('ERRORE nello script:', e.message); process.exitCode = 1; });
