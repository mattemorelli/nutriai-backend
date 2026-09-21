require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { trovaCategoria, normalizza, CONTENUTE_IN } = require('./genera');

// Conteggio atteso per le categorie di tipo 'allergene' (istantanea di oggi,
// dopo Fase 3 Passo A bis: ricostruzione + correzione cioccolato fondente +
// separazione crostacei/molluschi). Se qualcuno tocca categorie_alimenti e
// il numero cambia, questo test deve cadere: e' il canary.
const ATTESO_ALLERGENI = {
  arachidi: 2,
  crostacei: 11,
  molluschi: 6,
  frutta_guscio: 14,
  glutine: 59, // 60 il 2026-09-13 (+1 per soba_it) poi -1 il 2026-09-16: 168933 (Semola) era un doppione di semola_it, gia' taggato glutine - la deduplica dei food_id ha eliminato 168933 (che non esiste piu' in foods), non una categoria persa per errore
  lattosio: 60,
  pesce: 42,
  soia: 17, // +1 il 2026-09-16: soia_gialla_cotta_it (blocco 3 F0bis), aggiunta oggi insieme a legumi - mancava del tutto da categorie_alimenti
  uova: 9,
};

let falliti = 0;
function assert(cond, msg) {
  if (!cond) { falliti++; console.log('FAIL:', msg); }
}

async function foodIdPerCategoria(categoria) {
  const { data } = await supabase.from('categorie_alimenti').select('food_id').eq('categoria', categoria);
  return new Set((data || []).map(r => r.food_id));
}

function stessoInsieme(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

(async () => {
  const { data: categorie } = await supabase.from('categorie').select('codice, nome_it, nome_en, tipo, sinonimi');
  const { data: aliasRighe } = await supabase.from('alias_categoria').select('alias, codice');
  const mappaAlias = new Map((aliasRighe || []).map(r => [r.alias, r.codice]));

  console.log(`Categorie in tabella: ${categorie.length}, alias in tabella: ${mappaAlias.size}\n`);

  // --- 1) risoluzione identica da codice / nome_it / nome_en / sinonimi ---
  console.log('=== Test 1: risoluzione identica da codice / nome_it / nome_en / sinonimi ===');
  for (const cat of categorie) {
    for (const [via, valore] of [['codice', cat.codice], ['nome_it', cat.nome_it], ['nome_en', cat.nome_en]]) {
      const trovata = trovaCategoria(valore, mappaAlias);
      assert(trovata && trovata.codice === cat.codice, `${cat.codice}: ${via} "${valore}" risolve a "${trovata && trovata.codice}", atteso "${cat.codice}"`);
    }
    for (const sin of (cat.sinonimi || [])) {
      const viaSin = trovaCategoria(sin, mappaAlias);
      assert(viaSin && viaSin.codice === cat.codice, `${cat.codice}: sinonimo "${sin}" risolve a "${viaSin && viaSin.codice}", atteso "${cat.codice}"`);
    }
  }

  // --- 1b) A5: varianti di maiuscole/spazi/underscore/accenti risolvono uguali ---
  console.log('\n=== Test 1b: normalizzazione (maiuscole, spazi/underscore, accenti) ===');
  const varianti = [
    ['Frutta a guscio', 'frutta_guscio'],
    ['FRUTTA A GUSCIO', 'frutta_guscio'],
    ['frutta_guscio', 'frutta_guscio'],
    ['tree nuts', 'frutta_guscio'],
    ['Tree Nuts', 'frutta_guscio'],
    ['Crostacei', 'crostacei'],
    ['CROSTACEI', 'crostacei'],
    ['Molluschi', 'molluschi'],
    ['Carne bianca', 'carne_bianca'],
    ['carne_bianca', 'carne_bianca'],
    ['Carne rossa', 'carne_rossa'],
  ];
  for (const [input, atteso] of varianti) {
    const trovata = trovaCategoria(input, mappaAlias);
    assert(trovata && trovata.codice === atteso, `"${input}" risolve a "${trovata && trovata.codice}", atteso "${atteso}"`);
  }
  assert(normalizza('Perché') === normalizza('perche'), 'normalizza non rimuove correttamente gli accenti');

  // --- 2) nessun alias e' condiviso fra categorie diverse (bug latticini/lattosio, maiale/carne_rossa) ---
  console.log('\n=== Test 2: nessun alias condiviso fra categorie diverse ===');
  const proprietario = {};
  for (const cat of categorie) {
    const candidati = [cat.codice, cat.nome_it, cat.nome_en, ...(cat.sinonimi || [])].map(normalizza);
    for (const c of candidati) {
      if (!c) continue;
      if (!proprietario[c]) proprietario[c] = new Set();
      proprietario[c].add(cat.codice);
    }
  }
  for (const [chiave, codici] of Object.entries(proprietario)) {
    assert(codici.size === 1, `"${chiave}" e' rivendicata da piu' categorie: ${[...codici].join(', ')}`);
  }
  // Casi specifici del bug gia' corretto: non devono MAI ripresentarsi.
  assert(trovaCategoria('dairy', mappaAlias)?.codice === 'latticini', '"dairy" non risolve piu\' a latticini');
  assert(trovaCategoria('pork', mappaAlias)?.codice === 'maiale', '"pork" non risolve piu\' a maiale');

  // --- 2b) vincolo di unicita' REALE sul database, non solo in memoria ---
  console.log('\n=== Test 2b: il database rifiuta un alias duplicato su un\'altra categoria ===');
  try {
    const { error } = await supabase.from('alias_categoria').insert([{ alias: 'dairy', codice: 'lattosio' }]);
    assert(error && error.code === '23505', 'inserire "dairy" su lattosio doveva violare la chiave primaria di alias_categoria, invece: ' + JSON.stringify(error));
  } catch (e) {
    falliti++; console.log('FAIL: eccezione inattesa nel test del vincolo DB:', e.message);
  }

  // --- 3) conteggio atteso per le categorie allergeniche ---
  console.log('\n=== Test 3: conteggio atteso per categoria allergenica (tipo=\'allergene\') ===');
  for (const cat of categorie.filter(c => c.tipo === 'allergene')) {
    const insieme = await foodIdPerCategoria(cat.codice);
    const atteso = ATTESO_ALLERGENI[cat.codice];
    if (atteso === undefined) {
      console.log(`  ATTENZIONE: "${cat.codice}" e' di tipo allergene ma non ha un conteggio atteso scritto nel test.`);
      falliti++;
      continue;
    }
    assert(insieme.size === atteso, `${cat.codice}: ${insieme.size} alimenti in categorie_alimenti, atteso ${atteso}`);
  }

  // --- 4) insieme food_id espanso identico per ogni via di risoluzione ---
  console.log('\n=== Test 4: insieme food_id espanso identico per ogni via di risoluzione ===');
  for (const cat of categorie) {
    const atteso = await foodIdPerCategoria(cat.codice);
    for (const via of [cat.codice, cat.nome_it, cat.nome_en, ...(cat.sinonimi || [])]) {
      const trovata = trovaCategoria(via, mappaAlias);
      if (!trovata) continue; // gia' segnalato nel test 1
      const risolto = await foodIdPerCategoria(trovata.codice);
      assert(stessoInsieme(risolto, atteso), `${cat.codice}: passando da "${via}" l'insieme risolto (${risolto.size}) non coincide con quello atteso (${atteso.size})`);
    }
  }

  // --- 5) A7: contenimento - escludere carne_rossa esclude anche maiale, latticini esclude anche lattosio ---
  console.log('\n=== Test 5: contenimento fra categorie (carne_rossa contiene maiale, latticini contiene lattosio) ===');
  assert(JSON.stringify(CONTENUTE_IN.carne_rossa) === JSON.stringify(['maiale']), 'CONTENUTE_IN.carne_rossa non e\' [\'maiale\']');
  assert(JSON.stringify(CONTENUTE_IN.latticini) === JSON.stringify(['lattosio']), 'CONTENUTE_IN.latticini non e\' [\'lattosio\']');

  // Caso concreto: un alimento taggato SOLO maiale (senza carne_rossa) deve
  // comunque finire nell'insieme escluso quando il vincolo dichiarato e'
  // 'carne_rossa' - non per doppio tag nei dati, ma per la regola di
  // contenimento nel codice. Verifichiamo simulando l'espansione come la fa
  // generaESalva (stesso codice, non una copia): risolviamo 'carne_rossa' e
  // controlliamo che l'insieme unito includa anche tutto cio' che e' 'maiale'.
  const soloCarneRossa = await foodIdPerCategoria('carne_rossa');
  const soloMaiale = await foodIdPerCategoria('maiale');
  const unione = new Set([...soloCarneRossa, ...soloMaiale]);
  const catCarneRossa = trovaCategoria('carne_rossa', mappaAlias);
  const codiciEspansi = [catCarneRossa.codice, ...(CONTENUTE_IN[catCarneRossa.codice] || [])];
  let insiemeEspanso = new Set();
  for (const c of codiciEspansi) insiemeEspanso = new Set([...insiemeEspanso, ...(await foodIdPerCategoria(c))]);
  assert(stessoInsieme(insiemeEspanso, unione), 'escludere carne_rossa non porta con se\' tutto il maiale (regola di contenimento non applicata)');

  const soloLatticini = await foodIdPerCategoria('latticini');
  const soloLattosio = await foodIdPerCategoria('lattosio');
  const unioneLatte = new Set([...soloLatticini, ...soloLattosio]);
  const catLatticini = trovaCategoria('latticini', mappaAlias);
  const codiciEspansiLatte = [catLatticini.codice, ...(CONTENUTE_IN[catLatticini.codice] || [])];
  let insiemeEspansoLatte = new Set();
  for (const c of codiciEspansiLatte) insiemeEspansoLatte = new Set([...insiemeEspansoLatte, ...(await foodIdPerCategoria(c))]);
  assert(stessoInsieme(insiemeEspansoLatte, unioneLatte), 'escludere latticini non porta con se\' tutto il lattosio (regola di contenimento non applicata)');

  console.log(`\n${falliti === 0 ? 'TUTTI I TEST PASSATI' : `${falliti} FALLIMENTI`}`);
  process.exit(falliti === 0 ? 0 : 1);
})();
