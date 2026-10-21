// Controllo permanente, sola lettura: il riconoscimento dell'accompagnamento
// pane/patate di un secondo deve dipendere dalle categorie vere 'pane' e
// 'patate' su categorie_alimenti (migrazione 2026-10-22-categorie-pane-
// patate.sql), mai da un elenco fisso di food_id scritto in genera.js.
//
// Bug corretto il 2026-10-22 (diagnosi del crollo del generatore del 9
// ottobre, vedi RAPPORTO-NOTTE.md): un elenco di 6 food_id scritti a mano
// (5 pani + "Patate bianche") riconosceva come accompagnamento valido solo
// 123 piatti amidacei su 243 nel catalogo intero - 120 (quinoa, farro,
// pasta integrale, ceci, insalata di ceci...) restavano "orfani", mai
// utilizzabili. Da quel momento la ricerca del generatore si bloccava quasi
// sempre, su qualunque dieta o allergia, perche' un ruolo richiesto quasi
// ogni pranzo/cena aveva pochissimi candidati validi.
//
// Due controlli, entrambi devono passare:
// 1. STATICO: il codice di tipoAmidoDiAccompagnamento in genera.js deve
//    leggere piatto.tipoAmido (precalcolato in arricchisciPiatti dalle
//    categorie vere), non contenere un elenco di stringhe tipo food_id
//    scritto in quella zona del file.
// 2. DINAMICO: le categorie 'pane' e 'patate' devono esistere ed essere
//    popolate sopra una soglia minima (registrata qui sotto il giorno
//    della correzione - meta' di quel numero e' gia' un crollo da
//    controllare, non una normale oscillazione del catalogo).
//
// NOTA PER CHI LANCIA QUESTO SCRIPT PRIMA CHE LA MIGRAZIONE SIA APPLICATA:
// finche' 2026-10-22-categorie-pane-patate.sql non e' stata eseguita sul
// database vero, il controllo dinamico fallira' onestamente con "0
// alimenti" - e' il comportamento corretto, non un bug di questo script.
//
// Uso: node verifica-tipo-amido.js
require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const SOGLIA_REGISTRATA = { pane: 10, patate: 1 }; // misurato il 2026-10-22

const problemi = [];

(async () => {
  // --- controllo statico ---
  const src = fs.readFileSync('./genera.js', 'utf8');
  const mFunzione = src.match(/function tipoAmidoDiAccompagnamento\([^)]*\)\s*{([^}]*)}/);
  if (!mFunzione) {
    problemi.push('tipoAmidoDiAccompagnamento non trovata in genera.js - impossibile controllare.');
  } else {
    const corpo = mFunzione[1];
    // Un elenco fisso tradirebbe la propria presenza con stringhe di
    // food_id (snake_case con "pane"/"patat") o un Set/Array letterale
    // dentro la funzione stessa - la versione corretta e' una riga sola
    // che legge piatto.tipoAmido.
    if (/new Set\(|FOOD_ID_PANE|FOOD_ID_PATATE/.test(corpo)) {
      problemi.push('tipoAmidoDiAccompagnamento sembra contenere di nuovo un elenco fisso (new Set/FOOD_ID_*) invece di leggere piatto.tipoAmido.');
    }
    if (!/piatto\.tipoAmido/.test(corpo)) {
      problemi.push('tipoAmidoDiAccompagnamento non legge piatto.tipoAmido: il riconoscimento potrebbe non passare piu\' dalle categorie.');
    }
  }

  // --- controllo dinamico ---
  for (const [categoria, soglia] of Object.entries(SOGLIA_REGISTRATA)) {
    const { data, error } = await supabase.from('categorie_alimenti').select('food_id').eq('categoria', categoria);
    if (error) { problemi.push(`lettura categorie_alimenti (${categoria}): ${error.message}`); continue; }
    const n = (data || []).length;
    if (n < soglia * 0.5) {
      problemi.push(`categoria '${categoria}': solo ${n} alimenti (erano ${soglia} il 2026-10-22, sotto la meta' e' un crollo da controllare - se la migrazione non e' ancora stata lanciata e' normale, altrimenti no).`);
    } else {
      console.log(`OK  categoria '${categoria}': ${n} alimenti (erano ${soglia})`);
    }
  }

  if (problemi.length) {
    console.log(`\n${problemi.length} PROBLEMA/I TROVATO/I:`);
    for (const p of problemi) console.log('  - ' + p);
    process.exitCode = 1;
  } else {
    console.log('\nIl riconoscimento di pane/patate passa dalle categorie vere, numeri coerenti.');
  }
})();
