// correggi-ingredienti-nome.js — corregge i 26 piatti il cui nome nomina un
// ingrediente assente dagli ingredienti veri (vedi indagine della stessa
// conversazione: 14 "...and walnuts" con Mandorle invece di Noci, 7 piatti
// ceci/lenticchie con Fagioli rossi, 3 "...and Honey" con Marmellata o senza
// miele, 2 aggiunte - olive nel piatto di tonno, feta nello zucchine grigliate).
//
// Regola del compito: il nome dice la verita', si corregge l'ingrediente,
// non il nome - eccetto "Bean and vegetable salad", dove il nome inglese
// ("Bean", generico) e quello italiano ("ceci di Insalata di ceci e verdure",
// specifico) si contraddicono fra loro: corretto l'ingrediente a ceci (come
// dice l'italiano) e il nome inglese a "Chickpea and vegetable salad" per
// farlo coincidere, non lasciato "Bean" generico.
//
// Uso: node scripts/correggi-ingredienti-nome.js --prova   (non scrive niente)
//      node scripts/correggi-ingredienti-nome.js            (scrive)
//
// NOTA (24 ottobre 2026, spostato da root a scripts/): questa migrazione e'
// GIA' STATA APPLICATA per davvero in una sessione precedente (verificato:
// tutti i food_id sostituiti, la rinomina EN gia' presente). Non e'
// idempotente - le query WHERE cercano lo stato PRIMA della correzione, e
// non lo trovano piu': un rilancio, anche con --prova, fallisce subito al
// primo "aspettata 1 riga aggiornata, trovate 0". E' il comportamento
// corretto per una migrazione una tantum gia' consumata, non un bug -
// resta qui come registro di cosa e' stato corretto e perche', sullo
// stesso modello dei file in migrazioni/.
require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const { votoCalcolato } = require('../voto-piatti.js');

const SOLO_PROVA = process.argv.includes('--prova');

// ---------- 1. sostituzioni (stesso food, nuovo food_id, stessi grammi) ----------
const SOSTITUZIONI = [
  // 14 "...and walnuts": Mandorle (mandorle_it) -> Noci (noci_it)
  ['a1900001-0000-0000-0000-000000000005', 'mandorle_it', 'noci_it', 'Farro with radicchio and walnuts'],
  ['a5900001-0000-0000-0000-000000000006', 'mandorle_it', 'noci_it', 'Persimmons and walnuts'],
  ['b5a00001-0000-0000-0000-000000000008', 'mandorle_it', 'noci_it', 'Plums and Walnuts'],
  ['c0000003-0000-0000-0000-000000000002', 'mandorle_it', 'noci_it', 'Pear and walnuts'],
  ['c1000001-0000-0000-0000-000000000018', 'mandorle_it', 'noci_it', 'Rice with valerian and walnuts'],
  ['c3000001-0000-0000-0000-000000000003', 'mandorle_it', 'noci_it', "Lamb's Lettuce with Walnuts"],
  ['c4000001-0000-0000-0000-000000000006', 'mandorle_it', 'noci_it', 'Bread with honey and walnuts'],
  ['c5000001-0000-0000-0000-000000000012', 'mandorle_it', 'noci_it', 'Raisins and Walnuts'],
  ['f4000001-0000-0000-0000-000000000006', 'mandorle_it', 'noci_it', 'Yogurt with pear and walnuts'],
  ['f5000001-0000-0000-0000-000000000002', 'mandorle_it', 'noci_it', 'Yogurt and Walnuts'],
  ['f5000001-0000-0000-0000-000000000006', 'mandorle_it', 'noci_it', 'Banana and Walnuts'],
  ['f6000001-0000-0000-0000-000000000001', 'mandorle_it', 'noci_it', 'Yogurt with dark chocolate and walnuts'],
  ['f6000001-0000-0000-0000-000000000004', 'mandorle_it', 'noci_it', 'Baked apples with walnuts'],
  // (Mixed nuts (almonds and walnuts): split, non uno scambio pieno - gestito sotto)

  // 7 ceci/lenticchie: Fagioli rossi (174285) o, in un caso, Ceci (175206) -> il legume giusto
  ['1c7fce71-8b53-4e58-83aa-3ac4d12e7317', '174285', 'lenticchie_cotte_it', 'Quick stewed lentils'],
  ['5a7b2d90-c4b0-4c1e-85e1-8676c9412e37', '174285', '175206', 'Bean and vegetable salad'],
  ['7a7fdbe0-9e8e-4d6d-88de-e27a69d5b686', '174285', '175206', 'Chickpeas with spinach'],
  ['c1000001-0000-0000-0000-000000000033', '175206', 'lenticchie_cotte_it', 'American lentil soup'], // qui l'ingrediente sbagliato erano i CECI, non i fagioli
  ['e1b28176-fef2-4bb0-84dc-34ac0d3ff8bc', '174285', '175206', 'Spinach with chickpeas'],
  ['e4a824ac-f7b4-4eb1-86e3-3d2b21694260', '174285', '175206', 'Chickpea and tuna salad'],
  ['ecddb9b8-6aaf-44de-aebc-fee009e7a509', '174285', 'lenticchie_cotte_it', 'Lentils with spinach'],

  // 2 dei 3 "...and Honey": Marmellata (marmellata_it) -> Miele (miele_it)
  ['b5a00001-0000-0000-0000-000000000004', 'marmellata_it', 'miele_it', 'Yogurt with Peaches and Honey'],
  ['f6000001-0000-0000-0000-000000000010', 'marmellata_it', 'miele_it', 'Kiwi with Honey and Almonds'],
];

// ---------- 2. lo split (meta' mandorle, meta' noci) ----------
const SPLIT = {
  dish: 'b5a00001-0000-0000-0000-000000000012', nome: 'Mixed nuts (almonds and walnuts)',
  foodVecchio: 'mandorle_it', grammiVecchiOriginali: 30, grammiMandorleNuovi: 15,
  foodNuovo: 'noci_it', grammiNoci: 15,
};

// ---------- 3. aggiunte (il 3o "Honey" non ha marmellata da scambiare: il
// miele manca del tutto pur essendo gia' nominato nei passaggi) ----------
const AGGIUNTE = [
  ['b1a00001-0000-0000-0000-000000000013', '169094', 25, 'Whole wheat pasta with tuna and olives', 'olive nere'],
  ['fe1eb556-ecb4-429f-9c9a-0f34a38347e5', '173420', 30, 'Griddled zucchini with feta', 'feta'],
  ['c0000004-0000-0000-0000-000000000004', 'miele_it', 10, 'Yogurt with Honey and Almonds', 'miele'],
];

// ---------- 4. il nome inglese che non coincideva con l'italiano ----------
const RINOMINA = {
  dish: '5a7b2d90-c4b0-4c1e-85e1-8676c9412e37',
  name_en_vecchio: 'Bean and vegetable salad',
  name_en_nuovo: 'Chickpea and vegetable salad',
};

// ---------- 5. passaggi che nominano l'ingrediente vecchio ----------
// IT: frase intera (l'articolo cambia genere/numero fra "fagioli" e
// "lenticchie" - un cambio di sola parola darebbe "la lenticchie").
const TESTO_IT = [
  ['1c7fce71-8b53-4e58-83aa-3ac4d12e7317', 'Aggiungi i fagioli e i pomodori.', 'Aggiungi le lenticchie e i pomodori.'],
  ['7a7fdbe0-9e8e-4d6d-88de-e27a69d5b686', 'Aggiungi i fagioli.', 'Aggiungi i ceci.'],
  ['ecddb9b8-6aaf-44de-aebc-fee009e7a509', 'Aggiungi i fagioli e gli spinaci.', 'Aggiungi le lenticchie e gli spinaci.'],
  ['5a7b2d90-c4b0-4c1e-85e1-8676c9412e37', 'Sgocciola i fagioli.', 'Sgocciola i ceci.'],
  // "Chickpeas with spinach"(e1b28176), "Chickpea and tuna salad"(e4a824ac) e
  // "American lentil soup" in italiano dicono solo "legumi" (generico, mai
  // sbagliato) o non nominano il legume affatto: niente da correggere qui.
];
// EN: qui basta la singola parola, l'inglese non ha l'accordo di genere.
const TESTO_EN_PAROLA = [
  ['1c7fce71-8b53-4e58-83aa-3ac4d12e7317', 'beans', 'lentils'],
  ['7a7fdbe0-9e8e-4d6d-88de-e27a69d5b686', 'beans', 'chickpeas'],
  ['ecddb9b8-6aaf-44de-aebc-fee009e7a509', 'beans', 'lentils'],
  ['5a7b2d90-c4b0-4c1e-85e1-8676c9412e37', 'beans', 'chickpeas'],
  ['e1b28176-fef2-4bb0-84dc-34ac0d3ff8bc', 'beans', 'chickpeas'],
  ['e4a824ac-f7b4-4eb1-86e3-3d2b21694260', 'beans', 'chickpeas'],
  // "American lentil soup": zero menzioni di "beans" nel testo attuale
  // (un solo passaggio generico), niente da correggere.
];

// Le due aggiunte (olive, feta) sono GIA' nominate correttamente nei
// passaggi esistenti di "Griddled zucchini with feta" ("Sbriciola la
// feta...") - solo "Whole wheat pasta with tuna and olives" non nomina le
// olive da nessuna parte: estendo l'ultimo passaggio (stesso stile/unita'
// "Xg ingrediente" degli altri passaggi di questo piatto) invece di
// aggiungerne uno nuovo, per restare a un'azione ("condire e servire").
const TESTO_FRASE = [
  ['b1a00001-0000-0000-0000-000000000013', 'steps',
    'Condisci la pasta calda con il tonno sgranato e 15 g di olio di oliva, mescolando bene, e servi.',
    'Condisci la pasta calda con il tonno sgranato, 25 g di olive nere denocciolate e 15 g di olio di oliva, mescolando bene, e servi.'],
  ['b1a00001-0000-0000-0000-000000000013', 'steps_en',
    'Dress the hot pasta with the flaked tuna and 15g olive oil, mixing well, and serve.',
    'Dress the hot pasta with the flaked tuna, 25g pitted black olives and 15g olive oil, mixing well, and serve.'],
];

const TUTTI_GLI_ID = [...new Set([
  ...SOSTITUZIONI.map(s => s[0]), SPLIT.dish, ...AGGIUNTE.map(a => a[0]),
])];

function sostituisciParola(testo, da, a) {
  const rx = new RegExp(`\\b${da}\\b`, 'g');
  return testo.replace(rx, a);
}

async function calcolaVoto(c, dishId) {
  const { rows: ing } = await c.query(`
    select i.food_id, i.grams, f.kcal_100g, f.sat_fat_100g, f.fibre_100g, f.salt_100g
    from dish_ingredients i join foods f on f.id = i.food_id where i.dish_id = $1
  `, [dishId]);
  const { rows: catRows } = await c.query(`select food_id from categorie_alimenti where categoria = 'carne_processata'`);
  const processata = new Set(catRows.map(r => String(r.food_id)));
  const { rows: dishRows } = await c.query(`select salsa_industriale from dishes where id = $1`, [dishId]);
  const salsa = dishRows[0]?.salsa_industriale || false;

  const v = { kcal: 0, satFat: 0, fibre: 0, salt: 0, grammiProcessata: 0 };
  for (const r of ing) {
    const g = Number(r.grams), k = g / 100;
    v.kcal += Number(r.kcal_100g || 0) * k;
    v.satFat += Number(r.sat_fat_100g || 0) * k;
    v.fibre += Number(r.fibre_100g || 0) * k;
    v.salt += Number(r.salt_100g || 0) * k;
    if (processata.has(String(r.food_id))) v.grammiProcessata += g;
  }
  return votoCalcolato(v, salsa);
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  console.log(SOLO_PROVA ? '=== PROVA (nessuna scrittura) ===\n' : '=== SCRITTURA ATTIVA ===\n');

  // --- voto vecchio, prima di toccare niente ---
  const { rows: vecchi } = await c.query(`select id, name_en, health_score from dishes where id = ANY($1::uuid[])`, [TUTTI_GLI_ID]);
  const votoVecchioDi = new Map(vecchi.map(r => [r.id, r.health_score == null ? null : Number(r.health_score)]));
  const nomeDi = new Map(vecchi.map(r => [r.id, r.name_en]));

  try {
    await c.query('begin');

    // 1. sostituzioni semplici
    for (const [dish, da, a, nome] of SOSTITUZIONI) {
      const r = await c.query(
        `update dish_ingredients set food_id = $1 where dish_id = $2 and food_id = $3`,
        [a, dish, da]
      );
      if (r.rowCount !== 1) throw new Error(`sostituzione "${nome}": aspettata 1 riga aggiornata (${da} -> ${a}), trovate ${r.rowCount}`);
      console.log(`  ok  sostituito ${da} -> ${a}  (${nome})`);
    }

    // 2. lo split
    {
      const r1 = await c.query(
        `update dish_ingredients set grams = $1 where dish_id = $2 and food_id = $3`,
        [SPLIT.grammiMandorleNuovi, SPLIT.dish, SPLIT.foodVecchio]
      );
      if (r1.rowCount !== 1) throw new Error(`split "${SPLIT.nome}": riga mandorle non trovata`);
      const r2 = await c.query(
        `insert into dish_ingredients (dish_id, food_id, grams) values ($1, $2, $3)`,
        [SPLIT.dish, SPLIT.foodNuovo, SPLIT.grammiNoci]
      );
      console.log(`  ok  split ${SPLIT.nome}: ${SPLIT.foodVecchio} ${SPLIT.grammiVecchiOriginali}g -> ${SPLIT.grammiMandorleNuovi}g + ${SPLIT.foodNuovo} ${SPLIT.grammiNoci}g`);
    }

    // 3. aggiunte
    for (const [dish, food, grammi, nome, label] of AGGIUNTE) {
      const esiste = await c.query(`select 1 from dish_ingredients where dish_id = $1 and food_id = $2`, [dish, food]);
      if (esiste.rowCount) throw new Error(`aggiunta "${nome}": ${food} e' GIA' presente, non e' un'aggiunta pulita`);
      await c.query(`insert into dish_ingredients (dish_id, food_id, grams) values ($1, $2, $3)`, [dish, food, grammi]);
      console.log(`  ok  aggiunto ${label} (${food}) ${grammi}g a "${nome}"`);
    }

    // 4. rinomina
    {
      const r = await c.query(
        `update dishes set name_en = $1 where id = $2 and name_en = $3`,
        [RINOMINA.name_en_nuovo, RINOMINA.dish, RINOMINA.name_en_vecchio]
      );
      if (r.rowCount !== 1) throw new Error('rinomina: name_en vecchio non corrisponde, controllo saltato per sicurezza');
      console.log(`  ok  rinominato "${RINOMINA.name_en_vecchio}" -> "${RINOMINA.name_en_nuovo}"`);
    }

    // 5. testo IT (frase intera, per l'accordo di genere/numero)
    for (const [dish, da, a] of TESTO_IT) {
      const { rows } = await c.query(`select steps from dishes where id = $1`, [dish]);
      const steps = rows[0].steps;
      const idx = steps.indexOf(da);
      if (idx === -1) throw new Error(`testo IT: frase "${da}" non trovata nel piatto ${dish}`);
      steps[idx] = a;
      await c.query(`update dishes set steps = $1 where id = $2`, [JSON.stringify(steps), dish]);
      console.log(`  ok  passaggio IT aggiornato (${dish.slice(0, 8)}): "${da}" -> "${a}"`);
    }

    // 6. testo EN (parola, globale su tutti i passaggi del piatto)
    for (const [dish, da, a] of TESTO_EN_PAROLA) {
      const { rows } = await c.query(`select steps_en from dishes where id = $1`, [dish]);
      const steps = rows[0].steps_en;
      let tocchi = 0;
      const nuovi = steps.map(s => {
        const prima = s;
        const dopo = sostituisciParola(s, da, a);
        if (dopo !== prima) tocchi++;
        return dopo;
      });
      if (!tocchi) throw new Error(`testo EN: parola "${da}" non trovata nel piatto ${dish}`);
      await c.query(`update dishes set steps_en = $1 where id = $2`, [JSON.stringify(nuovi), dish]);
      console.log(`  ok  ${tocchi} passaggi EN aggiornati (${dish.slice(0, 8)}): "${da}" -> "${a}"`);
    }

    // 7. le due frasi estese per nominare l'ingrediente aggiunto
    for (const [dish, campo, da, a] of TESTO_FRASE) {
      const { rows } = await c.query(`select ${campo} from dishes where id = $1`, [dish]);
      const steps = rows[0][campo];
      const idx = steps.indexOf(da);
      if (idx === -1) throw new Error(`${campo}: frase non trovata nel piatto ${dish}`);
      steps[idx] = a;
      await c.query(`update dishes set ${campo} = $1 where id = $2`, [JSON.stringify(steps), dish]);
      console.log(`  ok  ${campo} estesa (${dish.slice(0, 8)})`);
    }

    // 8. voto nuovo - calcolato QUI, dentro la stessa transazione, mentre
    // la connessione vede ancora le proprie scritture non confermate:
    // calcolarlo dopo un rollback leggerebbe i dati vecchi e il confronto
    // sarebbe falso anche in modalita' --prova.
    console.log('\n=== voto salute: vecchio -> nuovo ===');
    const risultati = [];
    for (const id of TUTTI_GLI_ID) {
      const calc = await calcolaVoto(c, id);
      const vecchio = votoVecchioDi.get(id);
      risultati.push({ id, nome: nomeDi.get(id), vecchio, nuovo: calc ? calc.voto : null });
      if (!SOLO_PROVA && calc) {
        await c.query(`update dishes set health_score = $1 where id = $2`, [calc.voto, id]);
      }
    }

    if (SOLO_PROVA) { await c.query('rollback'); console.log('\n(rollback: --prova, nessuna scrittura reale, voto nuovo qui sotto e\' comunque calcolato sui dati post-modifica)'); }
    else { await c.query('commit'); console.log('\ncommit.'); }

    console.log(`\n${'piatto'.padEnd(42)} ${'vecchio'.padStart(8)} ${'nuovo'.padStart(8)}  sotto 6?`);
    for (const r of risultati) {
      const sotto6 = r.nuovo != null && r.nuovo < 6 ? '  <-- SEGNALATO' : '';
      console.log(`${String(r.nome).slice(0, 42).padEnd(42)} ${String(r.vecchio).padStart(8)} ${String(r.nuovo).padStart(8)}${sotto6}`);
    }
    require('fs').writeFileSync('voto-prima-dopo-26.json', JSON.stringify(risultati, null, 2));
  } catch (e) {
    await c.query('rollback').catch(() => {});
    console.error('\nERRORE, rollback completo:', e.message);
    await c.end();
    process.exit(1);
  }

  await c.end();
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
