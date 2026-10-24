// Controllo automatico sulle ricette per la modalita' Cook
// (scripts/cook-prova-dati.json). SOLA LETTURA: legge dish_ingredients dal
// database solo per confrontare le quote dichiarate con gli ingredienti
// veri del piatto, non scrive nulla.
require('dotenv').config({ quiet: true });
const path = require('path');
const { Client } = require('pg');
const file = process.argv[2] || './cook-prova-dati.json';
const dati = require(path.resolve(__dirname, file));

const AZIONI_CHIUSE = new Set(dati.azioni_cook.map(a => a.codice));
const FUOCO_VALIDI = new Set(['basso', 'medio', 'alto']);
const TIPO_TEMPO_VALIDI = new Set(['attiva', 'attesa']);
const AZIONI_DI_COTTURA = new Set([
  'cuocere', 'bollire', 'infornare', 'stufare', 'soffriggere', 'saltare', 'rosolare', 'grigliare', 'arrostire', 'tostare',
]);
const MAX_CARATTERI = 210; // ~200 con un piccolo margine

// Niente quantita' assolute (litri/ml/grammi/kg): temperature in C e
// lunghezze in cm restano permesse (vedi regola 4).
const RX_UNITA_VIETATE = /\b\d+([.,]\d+)?\s*(ml|millilitri|l|litri?|kg|chil[oi]|g|grammi)\b/i;
const RX_ULTIMI_MINUTI = /\b(ultim[oi]\s+\d+\s+minut\w*|last\s+\d+\s+minutes?)\b/i;

// Ingredienti che richiedono una preparazione in anticipo (ammollo,
// dissalare...) - devono avere una riga in ricetta.prep_anticipo.
const FOOD_IDS_RICHIEDONO_ANTICIPO = new Set([
  'ceci_secchi_it', 'fave_secche_it', 'piselli_secchi_it', 'fagioli_secchi_it', 'baccala_it',
]);

// ---- linea del tempo reale: i passi in_parallelo si assorbono dentro
// l'attesa aperta piu' recente, finche' c'e' capienza; l'eccedenza (se
// durano di piu' dell'attesa che dovrebbe contenerli) si somma al totale
// ed e' segnalata come avviso.
function calcolaTimeline(passi, avvisi, etichetta) {
  let totale = 0;
  let residuo = 0; // capienza rimasta nell'attesa aperta, per assorbire i passi in_parallelo

  for (const p of passi) {
    if (p.durata_min == null) continue;
    if (p.tipo_tempo === 'attesa') {
      totale += p.durata_min;
      residuo = p.durata_min; // nuova finestra di attesa aperta
      continue;
    }
    // attiva
    if (p.in_parallelo) {
      if (p.durata_min <= residuo) {
        residuo -= p.durata_min; // assorbito, non si somma
      } else {
        const eccedenza = p.durata_min - residuo;
        totale += eccedenza;
        avvisi.push(
          `${etichetta} passo ${p.ordine}: in_parallelo dura ${p.durata_min} min ma l'attesa che lo contiene ne aveva ${residuo === 0 ? 0 : residuo} residui - eccedenza di ${eccedenza} min sommata al totale`
        );
        residuo = 0;
      }
    } else {
      totale += p.durata_min;
      residuo = 0; // un passo sequenziale dedicato chiude la finestra di attesa aperta
    }
  }
  return Math.round(totale * 10) / 10;
}

(async () => {
  const dishIds = dati.ricette.map(r => r.dish_id);
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  let ingredientiReali;
  try {
    const { rows } = await client.query(
      'select dish_id, food_id, grams from dish_ingredients where dish_id = any($1::uuid[])',
      [dishIds]
    );
    ingredientiReali = rows;
  } finally {
    await client.end();
  }

  const realiPerPiatto = new Map();
  for (const r of ingredientiReali) {
    if (!realiPerPiatto.has(r.dish_id)) realiPerPiatto.set(r.dish_id, new Set());
    realiPerPiatto.get(r.dish_id).add(r.food_id);
  }

  const errori = [];
  const avvisi = [];

  for (const ricetta of dati.ricette) {
    const etichetta = `${ricetta.nome} (${ricetta.dish_id.slice(0, 8)})`;
    const reali = realiPerPiatto.get(ricetta.dish_id) || new Set();
    if (!reali.size) {
      errori.push(`${etichetta}: nessun ingrediente trovato nel database per questo dish_id`);
      continue;
    }

    const quotePerFood = new Map();
    let nPassi = 0;

    let primoPreriscaldare = null;
    let primoInfornare = null;
    let primoScaldaAcqua = null;
    let primoBollire = null;
    const passiScaldaAcqua = [];

    for (const p of ricetta.passi) {
      nPassi++;
      const dove = `${etichetta} passo ${p.ordine}`;

      // 1. azione nell'elenco chiuso
      if (!AZIONI_CHIUSE.has(p.azione)) {
        errori.push(`${dove}: azione "${p.azione}" non e' nell'elenco chiuso`);
      }
      if (p.azione === 'preriscaldare' && primoPreriscaldare == null) primoPreriscaldare = p.ordine;
      if (p.azione === 'infornare' && primoInfornare == null) primoInfornare = p.ordine;
      if (p.azione === 'bollire' && primoBollire == null) primoBollire = p.ordine;
      if (p.azione === 'scaldare' && /\bacqua\b/i.test(p.testo_it || '')) {
        if (primoScaldaAcqua == null) primoScaldaAcqua = p.ordine;
        passiScaldaAcqua.push(p);
      }

      // 2. testo IT/EN presenti e non vuoti
      if (!p.testo_it || !p.testo_it.trim()) errori.push(`${dove}: testo_it mancante`);
      if (!p.testo_en || !p.testo_en.trim()) errori.push(`${dove}: testo_en mancante`);

      // 3. lunghezza massima
      if (p.testo_it && p.testo_it.length > MAX_CARATTERI) {
        avvisi.push(`${dove}: testo_it lungo ${p.testo_it.length} caratteri`);
      }
      if (p.testo_en && p.testo_en.length > MAX_CARATTERI) {
        avvisi.push(`${dove}: testo_en lungo ${p.testo_en.length} caratteri`);
      }

      // 4. niente quantita' assolute (litri/ml/g/kg) nel testo
      for (const [lingua, testo] of [['IT', p.testo_it], ['EN', p.testo_en]]) {
        if (testo && RX_UNITA_VIETATE.test(testo)) {
          errori.push(`${dove}: quantita' assoluta vietata nel testo ${lingua}: "${testo}"`);
        }
        if (testo && RX_ULTIMI_MINUTI.test(testo)) {
          avvisi.push(`${dove}: possibile doppio conteggio del tempo (${lingua}): "${testo}"`);
        }
      }

      // 5. ogni cottura ha un tempo, e il tempo ha un tipo valido
      if (AZIONI_DI_COTTURA.has(p.azione) && p.durata_min == null) {
        errori.push(`${dove}: azione di cottura "${p.azione}" senza durata_min`);
      }
      if (p.durata_min != null && !TIPO_TEMPO_VALIDI.has(p.tipo_tempo)) {
        errori.push(`${dove}: durata_min presente ma tipo_tempo non valido ("${p.tipo_tempo}")`);
      }

      // 6. forno: temperatura e modalita' insieme, mai da sole
      const haForno = p.temperatura_c != null || p.forno_modalita != null;
      if (haForno && (p.temperatura_c == null || !p.forno_modalita)) {
        errori.push(`${dove}: forno con temperatura o modalita' mancante (temp=${p.temperatura_c}, modalita=${p.forno_modalita})`);
      }

      // 7. fuoco valido, se presente
      if (p.fuoco != null && !FUOCO_VALIDI.has(p.fuoco)) {
        errori.push(`${dove}: fuoco "${p.fuoco}" non valido (basso/medio/alto)`);
      }

      // 8. tempo_da_confezione e in_parallelo solo booleani
      if (typeof p.tempo_da_confezione !== 'boolean') {
        errori.push(`${dove}: tempo_da_confezione deve essere booleano`);
      }
      if (typeof p.in_parallelo !== 'boolean') {
        errori.push(`${dove}: in_parallelo deve essere booleano`);
      }
      if (p.in_parallelo && p.tipo_tempo === 'attesa') {
        errori.push(`${dove}: in_parallelo=true su un passo di attesa non ha senso (attesa apre la finestra, non la consuma)`);
      }
      if (p.in_parallelo && p.durata_min == null) {
        errori.push(`${dove}: in_parallelo=true ma durata_min mancante`);
      }

      // 9. accumulo quote per ingrediente
      for (const ing of (p.ingredienti || [])) {
        if (!reali.has(ing.food_id)) {
          errori.push(`${dove}: usa food_id "${ing.food_id}" che non e' tra gli ingredienti reali del piatto`);
          continue;
        }
        quotePerFood.set(ing.food_id, (quotePerFood.get(ing.food_id) || 0) + ing.quota);
      }
    }

    // 10. ogni ingrediente reale e' usato, e le quote sommano a 1
    for (const foodId of reali) {
      const somma = quotePerFood.get(foodId);
      if (somma == null) {
        errori.push(`${etichetta}: l'ingrediente reale "${foodId}" non compare in nessun passo`);
      } else if (Math.abs(somma - 1) > 0.01) {
        errori.push(`${etichetta}: le quote di "${foodId}" sommano a ${somma.toFixed(3)}, non 1`);
      }
    }

    // 11. forno: preriscaldare prima del primo infornare
    if (primoInfornare != null) {
      if (primoPreriscaldare == null) {
        errori.push(`${etichetta}: usa "infornare" ma non ha nessun passo "preriscaldare"`);
      } else if (primoPreriscaldare > primoInfornare) {
        errori.push(`${etichetta}: "preriscaldare" (passo ${primoPreriscaldare}) viene dopo il primo "infornare" (passo ${primoInfornare})`);
      }
    }

    // 12. bollire/sbollentare: un passo che scalda l'acqua prima
    if (primoBollire != null) {
      if (primoScaldaAcqua == null) {
        errori.push(`${etichetta}: usa "bollire" ma non ha nessun passo che scalda l'acqua prima (azione scaldare + testo con "acqua")`);
      } else if (primoScaldaAcqua > primoBollire) {
        errori.push(`${etichetta}: lo scaldare l'acqua (passo ${primoScaldaAcqua}) viene dopo il primo "bollire" (passo ${primoBollire})`);
      }
    }

    // 13. pentole in parallelo: ogni "scaldare acqua" oltre il primo deve
    // stare fra i primi due passi (messa sul fuoco subito insieme alle
    // altre) oppure essere in_parallelo (fatta mentre un'altra attesa gia'
    // aperta e' in corso) - mai una seconda pentola accesa solo dopo che
    // la prima cottura e' finita.
    for (const p of passiScaldaAcqua) {
      if (p.ordine > 2 && !p.in_parallelo) {
        avvisi.push(
          `${etichetta} passo ${p.ordine}: "scaldare" l'acqua non e' fra i primi due passi e non e' in_parallelo - rischia di essere una seconda pentola accesa dopo la prima cottura invece che all'inizio`
        );
      }
    }

    // 14. preparazioni in anticipo: legumi secchi/baccala' richiedono una
    // riga ricetta.prep_anticipo (va in ricetta_info, non in ricetta_passi)
    const serveAnticipo = [...reali].some(f => FOOD_IDS_RICHIEDONO_ANTICIPO.has(f));
    if (serveAnticipo && !ricetta.prep_anticipo) {
      errori.push(`${etichetta}: ha un ingrediente che richiede ammollo/dissalatura (${[...reali].filter(f => FOOD_IDS_RICHIEDONO_ANTICIPO.has(f)).join(', ')}) ma non ha prep_anticipo`);
    }
    if (ricetta.prep_anticipo) {
      const pa = ricetta.prep_anticipo;
      if (!pa.it || !pa.en || !(pa.ore > 0)) {
        errori.push(`${etichetta}: prep_anticipo presente ma incompleto (serve it, en, ore > 0)`);
      }
    }

    // 15. tempo totale sulla linea del tempo reale (i passi in_parallelo si
    // assorbono nell'attesa che li contiene, non si sommano due volte) -
    // le preparazioni in anticipo (prep_anticipo) non entrano qui.
    const totale = calcolaTimeline(ricetta.passi, avvisi, etichetta);

    console.log(`${etichetta}: ${nPassi} passi, ${reali.size} ingredienti reali, ${ricetta.note.length} note${ricetta.prep_anticipo ? ', ' + ricetta.prep_anticipo.ore + 'h anticipo' : ''} | tempo totale reale ${totale} min`);
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
})();
