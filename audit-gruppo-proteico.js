// audit-gruppo-proteico.js — SOLA LETTURA. Misura il buco fra ancoraProteica
// (categorie_alimenti) e gruppoDaRegex sui secondi del catalogo, e i piatti
// legumi/pesce del pool dell'utente di test. Non scrive niente.
// Uso: node audit-gruppo-proteico.js

require('dotenv').config();
const { Client } = require('pg');
const {
  ancoraProteica, gruppoDaRegex, GRUPPO_DA_CATEGORIA, FAMIGLIE_PER_CUCINA,
} = require('./genera.js');

const ALLERGENI_NOME = {
  pesce: /fish|salmon|salmone|cod\b|merluzzo|tuna|tonno|trout|trota|sgombro|sardin|acciugh|aringa|branzino|orata|barramundi|halibut|nasello|rombo|sogliola|anguilla|baccal|mahi/i,
  crostacei: /shrimp|gamber|astice|granchio|crab|scamp|lobster|prawn/i,
  molluschi: /vongol|cozze|seppia|polpo|octopus|squid|calamar|mussel|clam|oyster|scallop|capasant|ostrich/i,
  uova: /\begg|uovo/i,
  soia: /soy|soia|tofu|tempeh|edamame|miso/i,
  frutta_guscio: /almond|mandorl|walnut|\bnoce|nocciol|hazelnut|pistacchio|pistachio|cashew|anacard|pecan|pinoli|pine nut/i,
  arachidi: /peanut|arachid/i,
  latticini: /cheese|formagg|mozzarella|ricotta|pecorino|gorgonzola|taleggio|provola|emmental|caprino|stracchino|cheddar|feta|parmig|burro|\bbutter\b|panna|\bcream\b|yogurt|\blatte\b|\bmilk\b/i,
  glutine: /farina|\bflour\b|\bpane\b|\bbread\b|\bgrano\b|\bwheat\b|\borzo\b|\bbarley\b|segale|\brye\b|semola|couscous|cous cous|bulgur|seitan/i,
};

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // categorie_alimenti -> food_id -> Set(categoria)
  const { rows: catRighe } = await client.query('SELECT food_id, categoria FROM categorie_alimenti');
  const categorieDi = {};
  for (const r of catRighe) (categorieDi[r.food_id] ||= new Set()).add(r.categoria);

  // tutti i secondi del catalogo (nessun filtro famiglia/paese: e' la domanda 2)
  const { rows: secondi } = await client.query(
    `SELECT id, name FROM dishes WHERE meal_slot = 'secondo' ORDER BY id`
  );

  // ingredienti di tutti i secondi, in blocchi (SQL diretto, no PostgREST)
  const ids = secondi.map((d) => d.id);
  const ingredientiDi = {};
  const BLOCCO = 500;
  for (let i = 0; i < ids.length; i += BLOCCO) {
    const blocco = ids.slice(i, i + BLOCCO);
    const { rows } = await client.query(
      `SELECT di.dish_id, di.food_id, di.grams, f.name AS nome, f.protein_100g
       FROM dish_ingredients di JOIN foods f ON f.id = di.food_id
       WHERE di.dish_id = ANY($1::uuid[])`,
      [blocco]
    );
    for (const r of rows) {
      (ingredientiDi[r.dish_id] ||= []).push({
        food_id: r.food_id, nome: r.nome || '', grams: r.grams, protein_100g: r.protein_100g || 0,
      });
    }
  }

  function classifica(ingredienti) {
    const ancora = ancoraProteica(ingredienti);
    let gruppo = null, fonte = 'nessuno', categoriaAncora = null;
    if (ancora) {
      categoriaAncora = categorieDi[ancora.food_id] || null;
      if (categoriaAncora) {
        for (const [g, categorie] of GRUPPO_DA_CATEGORIA) {
          if (categorie.some((x) => categoriaAncora.has(x))) { gruppo = g; fonte = 'categoria'; break; }
        }
      }
    }
    if (!gruppo) {
      const g = gruppoDaRegex(ingredienti);
      if (g) { gruppo = g; fonte = 'regex'; }
    }
    return { ancora, gruppo, fonte, categoriaAncora };
  }

  // ===== Domanda 2: su tutti i 710 secondi, categoria vs regex =====
  let daCategoria = 0, daRegex = 0, senzaGruppo = 0;
  const daRegexElenco = [];
  const classificazioni = {}; // dish_id -> risultato, riusato per la domanda 1

  for (const d of secondi) {
    const ingredienti = ingredientiDi[d.id] || [];
    const c = classifica(ingredienti);
    classificazioni[d.id] = c;
    if (c.fonte === 'categoria') daCategoria++;
    else if (c.fonte === 'regex') {
      daRegex++;
      daRegexElenco.push({
        dish: d.name,
        food_id: c.ancora ? c.ancora.food_id : null,
        nome_ancora: c.ancora ? c.ancora.nome : '(nessuna ancora)',
        gruppo: c.gruppo,
      });
    } else senzaGruppo++;
  }

  console.log('=== Domanda 2: sorgente del gruppo proteico sui secondi ===\n');
  console.log(`secondi totali:      ${secondi.length}`);
  console.log(`da categoria:        ${daCategoria}`);
  console.log(`da regex (ripiego):  ${daRegex}`);
  console.log(`senza gruppo:        ${senzaGruppo}`);
  console.log('\n--- elenco "da regex": piatto | food_id ancora | nome ancora | gruppo ---');
  for (const r of daRegexElenco) {
    console.log(`  ${r.dish} | ${r.food_id} | ${r.nome_ancora} | ${r.gruppo}`);
  }

  // ===== Domanda 3: ancore da regex che sembrano un allergene per nome
  // ma non hanno la riga corrispondente in categorie_alimenti =====
  console.log('\n=== Domanda 3: ancore (da regex) che sembrano un allergene per nome, senza la riga in categorie_alimenti ===\n');
  const buco = [];
  for (const r of daRegexElenco) {
    if (!r.food_id) continue;
    const categoriePresenti = categorieDi[r.food_id] || new Set();
    for (const [allergene, rx] of Object.entries(ALLERGENI_NOME)) {
      if (rx.test(r.nome_ancora) && !categoriePresenti.has(allergene)) {
        buco.push({ dish: r.dish, food_id: r.food_id, nome_ancora: r.nome_ancora, allergene_atteso: allergene, categorie_presenti: [...categoriePresenti].join(',') || '(nessuna)' });
      }
    }
  }
  console.log(`totale righe (piatto, allergene atteso) senza categoria corrispondente: ${buco.length}\n`);
  for (const b of buco) {
    console.log(`  ${b.dish} | ancora: ${b.nome_ancora} (${b.food_id}) | atteso: ${b.allergene_atteso} | categorie presenti: ${b.categorie_presenti}`);
  }

  const foodIdDistinti = new Set(buco.map((b) => b.food_id));
  console.log(`\nfood_id distinti coinvolti: ${foodIdDistinti.size}`);
  console.log('(nota: "latticini" in categorie e\' tipo=gruppo, l\'allergene equivalente in tabella categorie e\' "lattosio" — controllato comunque per nome come richiesto)');

  // ===== Domanda 1: piatti legumi/pesce nel pool dell'utente di test =====
  console.log('\n\n=== Domanda 1: piatti legumi/pesce nel pool dell\'utente di test (cucina europea rank1, paese italia) ===\n');
  const famiglie = FAMIGLIE_PER_CUCINA['europea'] || [];
  console.log(`famiglie derivate da cucina 'europea': ${famiglie.join(', ')}\n`);

  const { rows: poolDishes } = await client.query(
    `SELECT id, name, famiglia, profilo, health_score
     FROM dishes
     WHERE meal_slot = 'secondo'
       AND health_score >= 6
       AND profilo IS NOT NULL
       AND occasione IN ('quotidiano','lungo')
       AND (profilo = 'neutro' OR famiglia = ANY($1::text[]))
     ORDER BY id`,
    [famiglie]
  );

  console.log('nome piatto | food_id ancora | nome ancora | gruppo | fonte | categoria presente sull\'ancora per quel gruppo?');
  let nLegPesc = 0;
  for (const d of poolDishes) {
    const c = classificazioni[d.id]; // gia' calcolato sopra (tutti i secondi)
    if (!c || (c.gruppo !== 'legumi' && c.gruppo !== 'pesce')) continue;
    nLegPesc++;
    const codiciAttesi = GRUPPO_DA_CATEGORIA.find(([g]) => g === c.gruppo)[1];
    const haRiga = c.categoriaAncora ? codiciAttesi.some((x) => c.categoriaAncora.has(x)) : false;
    console.log(
      `  ${d.name} | ${c.ancora ? c.ancora.food_id : '(nessuna)'} | ${c.ancora ? c.ancora.nome : '-'} | ${c.gruppo} | ${c.fonte} | ${haRiga ? 'si' : 'NO'}`
    );
  }
  console.log(`\ntotale piatti legumi/pesce nel pool: ${nLegPesc}`);

  await client.end();
})();
