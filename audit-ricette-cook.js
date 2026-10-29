// audit-ricette-cook.js — SOLO LETTURA. Controlla se dishes.steps_en è abbastanza
// detagliato per una modalità "Cook" (un passaggio alla volta). Non scrive nulla
// nel database: usa node db.js internamente via require('child_process').
//
// Uso: node audit-ricette-cook.js
// Output: stdout (tabella + esempi + valutazione) e audit-ricette-cook.json

require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const fs = require('fs');

// ---------- helper statistiche ----------
function media(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function mediana(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function contaParole(testo) {
  return testo.trim().split(/\s+/).filter(Boolean).length;
}

// ---------- pattern di riconoscimento ----------
// tempo: "5 minutes", "2-3 min", "10-15 mins", "30 seconds", "1 hour"
const RE_TEMPO = /\b\d+(\s*[-–to]\s*\d+)?\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)\b/i;

// segnali di cottura riconoscibili (in inglese, perché steps_en è in inglese)
const SEGNALI_COTTURA = [
  'golden', 'until', 'translucent', 'bubbling', 'bubbles', 'simmer', 'simmering',
  'boil', 'boiling', 'opaque', 'tender', 'crisp', 'crispy', 'browned', 'brown',
  'softened', 'soft', 'firm', 'set', 'through', 'cooked through', 'internal',
  '°c', '°f', 'degrees', 'reduce', 'reduced', 'thicken', 'thickened', 'wilted',
  'wilt', 'caramelized', 'caramelize', 'char', 'charred', 'flake', 'flakes',
];
const RE_SEGNALE_COTTURA = new RegExp('\\b(' + SEGNALI_COTTURA.join('|') + ')\\b', 'i');

// temperatura interna esplicita (regola 7 del CLAUDE.md: 74C pollame, 63C maiale/pesce, 52C manzo)
const RE_TEMP_INTERNA = /\b(\d{2,3})\s*°?\s*c\b|\binternal\b.{0,20}\btemperature\b|\btemp(erature)?\b.{0,20}\b\d{2,3}\s*°?\s*c\b/i;

const CATEGORIE_CARNE_PESCE = ['carne_bianca', 'carne_rossa', 'carne_processata', 'maiale', 'pesce', 'crostacei', 'molluschi'];

// stopword da ignorare nel match ingrediente/passaggi (articoli, preposizioni comuni IT/EN già tradotte)
const STOPWORDS = new Set(['di', 'e', 'con', 'il', 'la', 'le', 'lo', 'i', 'gli', 'un', 'una', 'del', 'della', 'dei', 'delle', 'al', 'alla', 'the', 'and', 'with', 'of', 'a', 'an']);

function normalizza(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // rimuove accenti
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// estrae "parole significative" (>=4 lettere, non stopword) da un nome alimento
function paroleSignificative(nome) {
  return normalizza(nome)
    .split(' ')
    .filter(w => w.length >= 4 && !STOPWORDS.has(w));
}

// un ingrediente è "citato" nei passaggi se almeno una sua parola significativa
// (nome_it, name, o un sinonimo) appare come sottostringa nel testo normalizzato dei passaggi.
// Approssimazione dichiarata al punto 8 della richiesta: falsi negativi possibili per
// traduzioni libere (es. "chicken" per "pollo" se name_it manca di sinonimo inglese),
// falsi positivi improbabili ma possibili per parole molto corte o generiche.
function ingredienteCitato(food, testoPassaggiNormalizzato) {
  const candidati = [];
  if (food.name_it) candidati.push(...paroleSignificative(food.name_it));
  if (food.name) candidati.push(...paroleSignificative(food.name));
  if (food.name_en) candidati.push(...paroleSignificative(food.name_en));
  if (Array.isArray(food.sinonimi)) {
    for (const s of food.sinonimi) candidati.push(...paroleSignificative(s));
  }
  if (Array.isArray(food.aliases)) {
    for (const s of food.aliases) candidati.push(...paroleSignificative(s));
  }
  const unici = [...new Set(candidati)];
  if (!unici.length) return { citato: null, parola: null }; // nessuna parola utile da cercare -> non valutabile
  for (const parola of unici) {
    if (testoPassaggiNormalizzato.includes(parola)) return { citato: true, parola };
  }
  return { citato: false, parola: null };
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // ---------- 1. piatti utilizzabili dal generatore ----------
  const dishesRes = await client.query(`
    select id, name, name_en, meal_slot, steps_en
    from dishes
    where health_score is not null
  `);
  const dishes = dishesRes.rows;

  // ---------- ingredienti per piatto ----------
  const ingrRes = await client.query(`
    select di.dish_id, di.food_id, di.grams, f.name, f.name_it, f.name_en, f.sinonimi, f.aliases
    from dish_ingredients di
    join foods f on f.id = di.food_id
  `);
  const ingrPerDish = new Map();
  for (const row of ingrRes.rows) {
    if (!ingrPerDish.has(row.dish_id)) ingrPerDish.set(row.dish_id, []);
    ingrPerDish.get(row.dish_id).push(row);
  }

  // ---------- categorie alimenti per food_id ----------
  const catRes = await client.query(`select food_id, categoria from categorie_alimenti`);
  const categoriePerFood = new Map();
  for (const row of catRes.rows) {
    if (!categoriePerFood.has(row.food_id)) categoriePerFood.set(row.food_id, []);
    categoriePerFood.get(row.food_id).push(row.categoria);
  }

  // ---------- piatti che compaiono nei plan_items (SQL diretto, no PostgREST, no limite) ----------
  const planDishRes = await client.query(`select distinct dish_id from plan_items where dish_id is not null`);
  const dishIdsInPlans = new Set(planDishRes.rows.map(r => r.dish_id));

  // ================= CALCOLO METRICHE =================

  function calcolaMetriche(listaDishes) {
    const out = {
      totale: listaDishes.length,
      perMealSlot: {},
      stepsVuotiNulli: 0,
      distribuzionePassaggi: { '0': 0, '1-2': 0, '3-4': 0, '5-6': 0, '7+': 0 },
      lunghezzaParole: [],
      passaggiCorti: 0, // < 8 parole
      totalePassaggi: 0,
      passaggiConTempo: 0,
      passaggiConSegnaleCottura: 0,
      carnePesceSenzaCotturaSegnalata: [], // {id, name}
      ingredientiNonCitati: [], // {dishId, dishName, foodName, affidabile}
      dettaglioPerDish: [], // per trovare i peggiori/migliori
    };

    for (const d of listaDishes) {
      out.perMealSlot[d.meal_slot] = (out.perMealSlot[d.meal_slot] || 0) + 1;

      const steps = Array.isArray(d.steps_en) ? d.steps_en.filter(s => typeof s === 'string' && s.trim()) : [];
      const n = steps.length;

      if (n === 0) out.stepsVuotiNulli++;

      if (n === 0) out.distribuzionePassaggi['0']++;
      else if (n <= 2) out.distribuzionePassaggi['1-2']++;
      else if (n <= 4) out.distribuzionePassaggi['3-4']++;
      else if (n <= 6) out.distribuzionePassaggi['5-6']++;
      else out.distribuzionePassaggi['7+']++;

      let passaggiCortiDish = 0;
      let tempoDish = 0;
      let cotturaDish = 0;
      const paroleDish = [];

      for (const step of steps) {
        out.totalePassaggi++;
        const nParole = contaParole(step);
        out.lunghezzaParole.push(nParole);
        paroleDish.push(nParole);
        if (nParole < 8) { out.passaggiCorti++; passaggiCortiDish++; }
        if (RE_TEMPO.test(step)) { out.passaggiConTempo++; tempoDish++; }
        if (RE_SEGNALE_COTTURA.test(step)) { out.passaggiConSegnaleCottura++; cotturaDish++; }
      }

      // --- punto 7: carne/pollame/pesce senza temp interna o segnale cottura ---
      const ingredienti = ingrPerDish.get(d.id) || [];
      const categorieDelPiatto = new Set();
      for (const ing of ingredienti) {
        const cats = categoriePerFood.get(ing.food_id) || [];
        for (const c of cats) categorieDelPiatto.add(c);
      }
      const haCarneOPesce = CATEGORIE_CARNE_PESCE.some(c => categorieDelPiatto.has(c));
      let haSegnaleCotturaOTemp = false;
      for (const step of steps) {
        if (RE_SEGNALE_COTTURA.test(step) || RE_TEMP_INTERNA.test(step)) { haSegnaleCotturaOTemp = true; break; }
      }
      if (haCarneOPesce && !haSegnaleCotturaOTemp) {
        out.carnePesceSenzaCotturaSegnalata.push({ id: d.id, name: d.name, categorie: [...categorieDelPiatto].filter(c => CATEGORIE_CARNE_PESCE.includes(c)) });
      }

      // --- punto 8: ingredienti mai nominati nei passaggi ---
      const testoPassaggi = normalizza(steps.join(' '));
      for (const ing of ingredienti) {
        const { citato } = ingredienteCitato(ing, testoPassaggi);
        if (citato === false) {
          out.ingredientiNonCitati.push({ dishId: d.id, dishName: d.name, foodName: ing.name_it || ing.name, grams: ing.grams });
        }
      }

      out.dettaglioPerDish.push({
        id: d.id,
        name: d.name,
        meal_slot: d.meal_slot,
        nPassaggi: n,
        parole: paroleDish,
        mediaParole: media(paroleDish),
        passaggiCorti: passaggiCortiDish,
        haTempo: tempoDish > 0,
        haCottura: cotturaDish > 0,
        steps,
      });
    }

    out.mediaParole = media(out.lunghezzaParole);
    out.medianaParole = mediana(out.lunghezzaParole);

    return out;
  }

  const metricheTutti = calcolaMetriche(dishes);
  const dishesInPlans = dishes.filter(d => dishIdsInPlans.has(d.id));
  const metrichePiani = calcolaMetriche(dishesInPlans);

  // ---------- punteggio "qualità" per piatto per trovare peggiori/migliori ----------
  // punteggio piu' basso = peggio: pochi passaggi, passaggi corti, nessun segnale cottura
  function punteggio(d) {
    let p = 0;
    p += d.nPassaggi * 10;
    p -= d.passaggiCorti * 8;
    p += d.mediaParole;
    if (d.haCottura) p += 15;
    if (d.haTempo) p += 5;
    return p;
  }

  const conPunteggio = metricheTutti.dettaglioPerDish.map(d => ({ ...d, punteggio: punteggio(d) }));
  const peggiori = [...conPunteggio].sort((a, b) => a.punteggio - b.punteggio).slice(0, 10);
  const migliori = [...conPunteggio].sort((a, b) => b.punteggio - a.punteggio).slice(0, 3);

  // ================= STAMPA =================

  console.log('='.repeat(78));
  console.log('AUDIT RICETTE PER MODALITÀ "COOK" — steps_en — SOLO LETTURA');
  console.log('='.repeat(78));

  console.log('\n--- 1. Piatti totali utilizzabili dal generatore (health_score non nullo) ---');
  console.log(`Totale: ${metricheTutti.totale}`);
  for (const [slot, n] of Object.entries(metricheTutti.perMealSlot).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${slot}: ${n}`);
  }

  function stampaBlocco(etichetta, m) {
    console.log(`\n=== ${etichetta} ===`);
    console.log(`Piatti totali: ${m.totale}`);
    console.log(`\n2. steps_en vuoto o nullo: ${m.stepsVuotiNulli} (${(100 * m.stepsVuotiNulli / m.totale).toFixed(1)}%)`);

    console.log('\n3. Distribuzione numero di passaggi:');
    for (const [fascia, n] of Object.entries(m.distribuzionePassaggi)) {
      console.log(`  ${fascia}: ${n} (${(100 * n / m.totale).toFixed(1)}%)`);
    }

    console.log('\n4. Lunghezza passaggi in parole:');
    console.log(`  Media: ${m.mediaParole.toFixed(1)} parole`);
    console.log(`  Mediana: ${m.medianaParole.toFixed(1)} parole`);
    console.log(`  Passaggi con meno di 8 parole: ${m.passaggiCorti} / ${m.totalePassaggi} (${(100 * m.passaggiCorti / (m.totalePassaggi || 1)).toFixed(1)}%)`);

    console.log('\n5. Passaggi con un tempo (minuti/secondi):');
    console.log(`  ${m.passaggiConTempo} / ${m.totalePassaggi} (${(100 * m.passaggiConTempo / (m.totalePassaggi || 1)).toFixed(1)}%)`);

    console.log('\n6. Passaggi con segnale di cottura riconoscibile:');
    console.log(`  ${m.passaggiConSegnaleCottura} / ${m.totalePassaggi} (${(100 * m.passaggiConSegnaleCottura / (m.totalePassaggi || 1)).toFixed(1)}%)`);

    console.log('\n7. Piatti con carne/pollame/pesce SENZA temp. interna né segnale di cottura in nessun passaggio:');
    console.log(`  ${m.carnePesceSenzaCotturaSegnalata.length} piatti`);

    console.log('\n8. Piatti con almeno un ingrediente mai nominato nei passaggi (approssimazione testuale):');
    const dishSetNonCitati = new Set(m.ingredientiNonCitati.map(x => x.dishId));
    console.log(`  ${dishSetNonCitati.size} piatti, ${m.ingredientiNonCitati.length} coppie piatto-ingrediente totali`);
  }

  stampaBlocco('TUTTI I PIATTI UTILIZZABILI', metricheTutti);
  stampaBlocco('SOLO PIATTI CHE COMPAIONO NEI PLAN_ITEMS (9)', metrichePiani);

  console.log('\n' + '='.repeat(78));
  console.log('10 PIATTI PEGGIORI (pochi passaggi, passaggi corti, nessun segnale cottura)');
  console.log('='.repeat(78));
  for (const d of peggiori) {
    console.log(`\n### ${d.name} [${d.meal_slot}] — punteggio ${d.punteggio.toFixed(1)}, ${d.nPassaggi} passaggi, media ${d.mediaParole.toFixed(1)} parole, cottura:${d.haCottura} tempo:${d.haTempo}`);
    d.steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    if (d.nPassaggi === 0) console.log('  (nessun passaggio)');
  }

  console.log('\n' + '='.repeat(78));
  console.log('3 PIATTI BUONI (esempio di confronto)');
  console.log('='.repeat(78));
  for (const d of migliori) {
    console.log(`\n### ${d.name} [${d.meal_slot}] — punteggio ${d.punteggio.toFixed(1)}, ${d.nPassaggi} passaggi, media ${d.mediaParole.toFixed(1)} parole, cottura:${d.haCottura} tempo:${d.haTempo}`);
    d.steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
  }

  // ---------- esempi carne/pesce senza segnale cottura (primi 10) ----------
  console.log('\n' + '='.repeat(78));
  console.log('ESEMPI: carne/pollame/pesce senza temp. interna/segnale cottura (primi 10 di ' + metricheTutti.carnePesceSenzaCotturaSegnalata.length + ')');
  console.log('='.repeat(78));
  for (const d of metricheTutti.carnePesceSenzaCotturaSegnalata.slice(0, 10)) {
    console.log(`  - ${d.name} (categorie: ${d.categorie.join(', ')})`);
  }

  // ---------- esempi ingredienti non citati (primi 15) ----------
  console.log('\n' + '='.repeat(78));
  console.log('ESEMPI: ingredienti mai nominati nei passaggi (primi 15 di ' + metricheTutti.ingredientiNonCitati.length + ')');
  console.log('='.repeat(78));
  for (const x of metricheTutti.ingredientiNonCitati.slice(0, 15)) {
    console.log(`  - "${x.dishName}" non cita "${x.foodName}" (${x.grams}g)`);
  }
  const conteggioPerIngrediente = {};
  for (const x of metricheTutti.ingredientiNonCitati) conteggioPerIngrediente[x.foodName] = (conteggioPerIngrediente[x.foodName] || 0) + 1;
  const topNonCitati = Object.entries(conteggioPerIngrediente).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const nonCitatiSenzaOlio = metricheTutti.ingredientiNonCitati.filter(x => x.foodName !== 'Olio di oliva').length;
  console.log('\nIngredienti più frequenti tra i "non citati" (top 10):');
  for (const [nome, n] of topNonCitati) console.log(`  ${nome}: ${n} piatti`);
  console.log(`\nNOTA affidabilità punto 8: "Olio di oliva" da solo è ${metricheTutti.ingredientiNonCitati.filter(x => x.foodName === 'Olio di oliva').length} delle ${metricheTutti.ingredientiNonCitati.length} coppie (${(100 * metricheTutti.ingredientiNonCitati.filter(x => x.foodName === 'Olio di oliva').length / metricheTutti.ingredientiNonCitati.length).toFixed(0)}%):`);
  console.log('i passaggi dicono spesso "a little oil" / "drizzle of oil" senza la parola "olive", quindi è quasi sempre');
  console.log('un falso positivo (l\'ingrediente è citato, solo non col nome specifico). Escludendo "Olio di oliva" restano');
  console.log(`${nonCitatiSenzaOlio} coppie piatto-ingrediente, numero più rappresentativo di ingredienti davvero assenti dai passaggi.`);
  console.log('Il controllo è una sottostringa su nome_it/name/name_en/sinonimi/aliases normalizzati: falsi positivi restano');
  console.log('probabili per altri condimenti generici (sale, pepe, spezie) e per traduzioni libere nel passaggio inglese.');
  console.log('Affidabilità stimata: bassa per i condimenti (oli, sale, spezie, aromi), medio-alta per gli ingredienti');
  console.log('principali (proteine, verdure, amidi) — usare come lista di candidati da controllare a mano, non come conteggio esatto.');

  // ---------- valutazione finale ----------
  const pctSenzaCottura = 100 * metricheTutti.carnePesceSenzaCotturaSegnalata.length / metricheTutti.totale;
  const pctPochiPassaggi = 100 * (metricheTutti.distribuzionePassaggi['0'] + metricheTutti.distribuzionePassaggi['1-2']) / metricheTutti.totale;
  const pctPassaggiCorti = 100 * metricheTutti.passaggiCorti / (metricheTutti.totalePassaggi || 1);

  console.log('\n' + '='.repeat(78));
  console.log('VALUTAZIONE');
  console.log('='.repeat(78));
  const valutazione = `Le ricette NON sono pronte per Cook così com'è: ${metricheTutti.stepsVuotiNulli} piatti hanno steps_en vuoto e ${metricheTutti.distribuzionePassaggi['0'] + metricheTutti.distribuzionePassaggi['1-2']} (${pctPochiPassaggi.toFixed(0)}%) hanno 0-2 passaggi, troppo pochi per una schermata-per-passo. Il ${pctPassaggiCorti.toFixed(0)}% dei passaggi ha meno di 8 parole: in modalità Cook, da solo su una schermata, un passaggio così corto non basta. Più critico: ${metricheTutti.carnePesceSenzaCotturaSegnalata.length} piatti con carne/pollame/pesce non citano mai una temperatura o un segnale di cottura riconoscibile, un problema di sicurezza alimentare oltre che di UX. Stima: andrebbero riscritti almeno i piatti con 0-2 passaggi e quelli di carne/pesce senza segnale di cottura, cioè un totale stimato di circa ${(metricheTutti.distribuzionePassaggi['0'] + metricheTutti.distribuzionePassaggi['1-2'] + metricheTutti.carnePesceSenzaCotturaSegnalata.length)} piatti (con sovrapposizione non dedotta). Priorità: i piatti già nei plan_items (vedi blocco 9), perché sono quelli che gli utenti vedono per primi.`;
  console.log(valutazione);

  // ================= JSON =================
  const risultato = {
    generato_il: new Date().toISOString(),
    tutti_i_piatti: {
      totale: metricheTutti.totale,
      perMealSlot: metricheTutti.perMealSlot,
      stepsVuotiNulli: metricheTutti.stepsVuotiNulli,
      distribuzionePassaggi: metricheTutti.distribuzionePassaggi,
      mediaParole: metricheTutti.mediaParole,
      medianaParole: metricheTutti.medianaParole,
      passaggiCorti: metricheTutti.passaggiCorti,
      totalePassaggi: metricheTutti.totalePassaggi,
      passaggiConTempo: metricheTutti.passaggiConTempo,
      passaggiConSegnaleCottura: metricheTutti.passaggiConSegnaleCottura,
      carnePesceSenzaCotturaSegnalata: metricheTutti.carnePesceSenzaCotturaSegnalata,
      ingredientiNonCitati: metricheTutti.ingredientiNonCitati,
      ingredientiNonCitati_affidabilita: {
        nota: 'Controllo per sottostringa, non semantico. "Olio di oliva" da solo genera la maggioranza dei falsi positivi perché i passaggi dicono genericamente "a little oil" senza il nome specifico. Affidabilità bassa per condimenti generici (olio, sale, pepe, spezie), medio-alta per ingredienti principali (proteine, verdure, amidi).',
        top_ingredienti_non_citati: topNonCitati,
        coppie_totali: metricheTutti.ingredientiNonCitati.length,
        coppie_escludendo_olio_di_oliva: nonCitatiSenzaOlio,
      },
    },
    solo_piatti_nei_plan_items: {
      totale: metrichePiani.totale,
      perMealSlot: metrichePiani.perMealSlot,
      stepsVuotiNulli: metrichePiani.stepsVuotiNulli,
      distribuzionePassaggi: metrichePiani.distribuzionePassaggi,
      mediaParole: metrichePiani.mediaParole,
      medianaParole: metrichePiani.medianaParole,
      passaggiCorti: metrichePiani.passaggiCorti,
      totalePassaggi: metrichePiani.totalePassaggi,
      passaggiConTempo: metrichePiani.passaggiConTempo,
      passaggiConSegnaleCottura: metrichePiani.passaggiConSegnaleCottura,
      carnePesceSenzaCotturaSegnalata: metrichePiani.carnePesceSenzaCotturaSegnalata,
      ingredientiNonCitati: metrichePiani.ingredientiNonCitati,
    },
    peggiori_10: peggiori.map(({ id, name, meal_slot, nPassaggi, mediaParole, passaggiCorti, haTempo, haCottura, steps, punteggio }) =>
      ({ id, name, meal_slot, nPassaggi, mediaParole, passaggiCorti, haTempo, haCottura, steps, punteggio })),
    migliori_3: migliori.map(({ id, name, meal_slot, nPassaggi, mediaParole, passaggiCorti, haTempo, haCottura, steps, punteggio }) =>
      ({ id, name, meal_slot, nPassaggi, mediaParole, passaggiCorti, haTempo, haCottura, steps, punteggio })),
    valutazione,
  };

  fs.writeFileSync('audit-ricette-cook.json', JSON.stringify(risultato, null, 2));
  console.log('\nSalvato in audit-ricette-cook.json');

  await client.end();
}

main().catch(e => {
  console.error('ERRORE:', e.message);
  process.exitCode = 1;
});
