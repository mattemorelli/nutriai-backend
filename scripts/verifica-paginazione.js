// Controllo permanente contro la troncatura silenziosa a 1000 righe di
// PostgREST (vedi CLAUDE.md regola 11, e la scoperta del 23 ottobre in
// verifica-ricette.js su ricetta_passi: 1208 righe, lette senza .range(),
// troncate senza errore). Nato dall'audit del 24 ottobre: genera.js leggeva
// foods/categorie_alimenti/tag_nutrizionali/alias_categoria per intero, a
// ogni generazione, senza paginazione - tabelle oggi sotto 1000 righe ma
// che crescono col catalogo.
//
// Analisi statica (regex, non un parser vero - sufficiente per lo stile
// di questo codice, non per qualunque JS): per ogni file di produzione,
// cerca ogni `.from('tabella')` su una delle tabelle a rischio (grandi
// oggi, o destinate a crescere col catalogo). Se la stessa istruzione e'
// una lettura (.select, non insert/update/delete/upsert) e NON contiene
// ne' `.range(` ne' un filtro che la restringe (.eq/.in/.single/
// .maybeSingle/.limit), e' una lettura a tutta tabella non paginata:
// fallisce.
//
// SOLA LETTURA: non tocca il database, legge solo i file.
const fs = require('fs');
const path = require('path');

const RADICE = path.join(__dirname, '..');

// Tabelle grandi oggi, o che crescono col catalogo (piatti/alimenti
// aggiunti nel tempo) - le uniche per cui una lettura a tutta tabella e'
// un rischio reale. Le tabelle piccole e stabili (criteri_voto, marche,
// voto_pesi...) sono escluse apposta: estenderle qui non aggiungerebbe
// sicurezza, solo falsi allarmi.
const TABELLE_A_RISCHIO = [
  'dishes', 'dish_ingredients', 'plan_items', 'prodotti', 'ricetta_passi',
  'foods', 'categorie_alimenti', 'tag_nutrizionali', 'alias_categoria', 'user_constraints', 'recipe_snapshots',
];

const FILE_DI_PRODUZIONE = [
  'server.js', 'genera.js', 'fabbisogno.js', 'calibra.js', 'sostituisci.js',
  'spesa.js', 'modifiche-piano.js', 'voto.js', 'tu.js', 'auth-middleware.js',
  'vincoli-verificabili.js', 'classifica-ruoli-piatti.js', 'salvataggio-generazione.js', 'ricette-salvate.js', 'piatti-piano.js',
];

const VERBI_SCRITTURA = ['.insert(', '.update(', '.delete(', '.upsert('];
const SEGNI_DI_FILTRO = ['.eq(', '.in(', '.single(', '.maybeSingle(', '.limit(', '.gte(', '.gt(', '.lte(', '.lt('];

// Dall'indice di un `.from('tabella')`, il testo della stessa istruzione:
// fino al `;` che la chiude, tenendo conto delle parentesi annidate (una
// `.select(...)` con una colonna tra parentesi non deve far chiudere
// l'istruzione troppo presto).
function testoIstruzione(testo, daIndice) {
  let profondita = 0;
  let i = daIndice;
  for (; i < testo.length; i++) {
    const c = testo[i];
    if (c === '(') profondita++;
    else if (c === ')') profondita--;
    else if (c === ';' && profondita <= 0) break;
    if (i - daIndice > 2000) break; // rete di sicurezza, non dovrebbe mai servire
  }
  return testo.slice(daIndice, i);
}

function controllaFile(nomeFile) {
  const percorso = path.join(RADICE, nomeFile);
  if (!fs.existsSync(percorso)) return [];
  const testo = fs.readFileSync(percorso, 'utf8');
  const violazioni = [];

  for (const tabella of TABELLE_A_RISCHIO) {
    const ago = `.from('${tabella}')`;
    let da = 0;
    while (true) {
      const idx = testo.indexOf(ago, da);
      if (idx === -1) break;
      da = idx + ago.length;

      const istruzione = testoIstruzione(testo, idx);
      const primoVerboScrittura = VERBI_SCRITTURA.find((v) => istruzione.indexOf(v) !== -1);
      if (primoVerboScrittura) continue; // scrittura, non una lettura a rischio

      const haRange = istruzione.includes('.range(');
      const haFiltro = SEGNI_DI_FILTRO.some((s) => istruzione.includes(s));
      if (!haRange && !haFiltro) {
        const numeroRiga = testo.slice(0, idx).split('\n').length;
        violazioni.push({ file: nomeFile, riga: numeroRiga, tabella, estratto: istruzione.replace(/\s+/g, ' ').trim().slice(0, 160) });
      }
    }
  }
  return violazioni;
}

(() => {
  const tutte = FILE_DI_PRODUZIONE.flatMap(controllaFile);
  console.log(`${FILE_DI_PRODUZIONE.length} file controllati, tabelle a rischio: ${TABELLE_A_RISCHIO.join(', ')}.`);

  if (tutte.length) {
    console.log(`\n${tutte.length} lettura/e a tutta tabella, non paginate e non filtrate:`);
    for (const v of tutte) console.log(`  - ${v.file}:${v.riga} (${v.tabella}) — ${v.estratto}`);
    console.error(`\n${tutte.length} lettura/e a rischio di troncatura silenziosa (PostgREST tronca a 1000 righe senza errore). Aggiungi .range() con un ordinamento unico, o un filtro (.eq/.in) che la restringa.`);
    process.exitCode = 1;
  } else {
    console.log('\nNessuna lettura a tutta tabella non paginata sulle tabelle a rischio.');
  }
})();
