// f3-audit-categorie.js — SOLA LETTURA, non scrive niente.
// Tre cose, nell'ordine chiesto:
// 1) TUTTI gli alimenti usati come ancora proteica (metrica F1, stessa di
//    f3-gruppo-proteico.js) in almeno un PIATTO (non solo i secondi) che non
//    hanno nessuna riga in categorie_alimenti.
// 2) I 10 secondi "senza gruppo in entrambi i modi": ancora senza categoria
//    (rientra nel punto 1) o nessuna ancora proteica del tutto (piatto raro).
// 3) Campione casuale di 15 secondi classificati 'pesce' col metodo nuovo,
//    per controllare che l'ancora sia davvero il pesce e non un ingrediente
//    marginale.
require('dotenv').config();
const { Client } = require('pg');

const GRUPPO_DA_CATEGORIA = [
  ['pesce',        ['pesce', 'crostacei', 'molluschi']],
  ['carne_rossa',  ['carne_rossa', 'maiale']],
  ['carne_bianca', ['carne_bianca']],
  ['uova',         ['uova']],
  ['legumi',       ['legumi', 'soia']],
  ['formaggio',    ['latticini']],
];

function ancoraProteica(ingredienti) {
  const conProteina = ingredienti
    .map(i => ({ ...i, proteina: (i.protein_100g || 0) * i.grams / 100 }))
    .filter(i => i.proteina > 0)
    .sort((a, b) => b.proteina - a.proteina);
  if (!conProteina.length) return null;
  const totale = conProteina.reduce((s, i) => s + i.proteina, 0);
  const primo = conProteina[0];
  if (primo.proteina >= 10 || (totale > 0 && primo.proteina / totale >= 0.25)) return primo;
  return null;
}

function gruppoCategoria(ingredienti, categorieDi) {
  const ancora = ancoraProteica(ingredienti);
  if (!ancora) return { gruppo: null, ancora: null };
  const cat = categorieDi[ancora.food_id];
  if (!cat) return { gruppo: null, ancora };
  for (const [gruppo, categorie] of GRUPPO_DA_CATEGORIA) {
    if (categorie.some(x => cat.has(x))) return { gruppo, ancora };
  }
  return { gruppo: null, ancora };
}

// Suggerimento di categoria dal nome, SOLO per proporre un valore da
// verificare a mano - non per deciderlo automaticamente.
function suggerisciCategoria(nome) {
  const n = (nome || '').toLowerCase();
  const prove = [
    ['pesce', /fish|salmon|salmone|cod|merluzzo|tuna|tonno|trout|trota|sgombro|sardin|acciugh|aringa|branzino|orata|barramundi|halibut|nasello|rombo|sogliola|anguilla|baccal|mahi|platessa|passera|hake|haddock|eglefino|carp|carpa|eel|tilapia|bass|snapper|dentice|cernia|surimi/i],
    ['crostacei', /shrimp|gamber|prawn|astice|lobster|granchio|crab|scampi|crayfish/i],
    ['molluschi', /squid|calamar|seppia|cuttlefish|polpo|octopus|vongol|clam|cozze|mussel|capesant|scallop|lumach|snail/i],
    ['carne_rossa', /beef|manzo|brisket|agnello|lamb|canguro|kangaroo|vitell|veal|bison|bisonte|cervo|venison|cinghiale|boar/i],
    ['maiale', /maiale|pork|lonza|speck|bresaola|prosciutto|pancetta|salame|salami|wurstel|w[uü]rstel|guanciale|mortadella|sausage|salsiccia/i],
    ['carne_bianca', /chicken|pollo|turkey|tacchino|coniglio|rabbit|anatra|duck|quaglia|quail|oca\b|goose|fagiano|pheasant|piccione|pigeon/i],
    ['uova', /\begg|uovo|uova/i],
    ['legumi', /fagiol|bean|lentil|lenticch|ceci|chickpea|lupini|piselli|peas|fava|fave/i],
    ['soia', /soy|soia|tofu|tempeh|edamame/i],
    ['latticini', /cheese|formagg|mozzarella|ricotta|pecorino|gorgonzola|taleggio|provola|emmental|caprino|stracchino|cheddar|feta|parmig|latte|milk|panna|cream|yogurt/i],
  ];
  for (const [cat, rx] of prove) if (rx.test(n)) return cat;
  return '?';
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  try {
    const { rows: cats } = await c.query('select food_id, categoria from categorie_alimenti');
    const categorieDi = {};
    for (const r of cats) (categorieDi[r.food_id] ||= new Set()).add(r.categoria);

    // TUTTI i piatti, non solo i secondi - un solo giro, ordinato su d.id
    // (chiave primaria, unica).
    const { rows } = await c.query(`
      select d.id, coalesce(d.name, d.name_en) as nome_piatto, d.meal_slot,
             i.food_id, i.grams, f.name as nome_ing, f.name_it as nome_ing_it, f.protein_100g
        from dishes d
        join dish_ingredients i on i.dish_id = d.id
        join foods f on f.id = i.food_id
       order by d.id
    `);

    const piatti = new Map();
    for (const r of rows) {
      if (!piatti.has(r.id)) {
        piatti.set(r.id, { id: r.id, nome: r.nome_piatto, slot: r.meal_slot, ingredienti: [] });
      }
      piatti.get(r.id).ingredienti.push({
        food_id: r.food_id,
        nome: r.nome_ing_it || r.nome_ing || '',
        grams: Number(r.grams),
        protein_100g: Number(r.protein_100g || 0),
      });
    }
    const tutti = [...piatti.values()];
    console.log(`Piatti totali (tutti gli slot): ${tutti.length}\n`);

    // === PUNTO 1 ===
    // Per ogni piatto, ancora proteica; se l'ancora non ha categoria,
    // registriamo il food_id con in quanti piatti fa da ancora.
    const senzaCategoria = {}; // food_id -> { nome, protein_100g, dishNames: Set }
    for (const p of tutti) {
      const ancora = ancoraProteica(p.ingredienti);
      if (!ancora) continue;
      if (categorieDi[ancora.food_id]) continue;
      const e = (senzaCategoria[ancora.food_id] ||= { nome: ancora.nome, protein_100g: ancora.protein_100g, dishNames: new Set() });
      e.dishNames.add(p.nome);
    }
    const listaSenzaCategoria = Object.entries(senzaCategoria)
      .map(([food_id, e]) => ({ food_id, nome: e.nome, protein_100g: e.protein_100g, nPiatti: e.dishNames.size, esempi: [...e.dishNames].slice(0, 3) }))
      .sort((a, b) => b.nPiatti - a.nPiatti);

    console.log('=== PUNTO 1: alimenti ancora proteica in almeno un piatto, SENZA categoria ===');
    console.log(`Totale: ${listaSenzaCategoria.length} alimenti\n`);
    for (const r of listaSenzaCategoria) {
      console.log(`  ${r.food_id.padEnd(26)} ${r.nome.slice(0, 40).padEnd(42)} prot=${r.protein_100g.toFixed(1).padStart(5)}g/100g  in ${String(r.nPiatti).padStart(3)} piatti  categoria suggerita: ${suggerisciCategoria(r.nome)}`);
      console.log(`      esempi: ${r.esempi.join(' | ')}`);
    }

    // === PUNTO 2 ===
    // I secondi "senza gruppo in entrambi i modi" dal giro precedente:
    // per ciascuno, ancora presente-ma-senza-categoria (punto 1) o nessuna
    // ancora affatto.
    const GRUPPI_REGEX = [
      ['pesce',        /fish|salmon|salmone|cod,|merluzzo|tuna|tonno|trout|trota|sgombro|sardin|acciugh|aringa|branzino|orata|barramundi|halibut|nasello|rombo|sogliola|anguilla|baccal|mahi|astice|granchio|crab|shrimp|gamber|vongol|cozze|seppia|polpo/i],
      ['carne_rossa',  /beef|manzo|brisket|agnello|lamb|canguro|kangaroo|vitell|veal|maiale|pork|lonza|speck|bresaola/i],
      ['carne_bianca', /chicken|pollo|turkey|tacchino|coniglio|rabbit/i],
      ['uova',         /\begg|uovo/i],
      ['formaggio',    /cheese|formagg|mozzarella|ricotta|pecorino|gorgonzola|taleggio|provola|emmental|caprino|stracchino|cheddar|feta|parmig/i],
      ['legumi',       /fagiol|beans,|lentil|lenticch|ceci|chickpea|lupini|tofu|tempeh|edamame/i],
    ];
    function gruppoRegex(ingredienti) {
      const testo = ingredienti.filter(i => i.grams >= 40).map(i => i.nome).join(' | ');
      for (const [gruppo, rx] of GRUPPI_REGEX) if (rx.test(testo)) return gruppo;
      return null;
    }

    const secondi = tutti.filter(p => p.slot === 'secondo');
    const senzaGruppoEntrambi = [];
    for (const p of secondi) {
      const vecchio = gruppoRegex(p.ingredienti);
      const { gruppo: nuovo, ancora } = gruppoCategoria(p.ingredienti, categorieDi);
      if (!vecchio && !nuovo) senzaGruppoEntrambi.push({ nome: p.nome, ancora });
    }

    console.log(`\n=== PUNTO 2: i ${senzaGruppoEntrambi.length} secondi senza gruppo in entrambi i modi ===`);
    for (const r of senzaGruppoEntrambi) {
      if (r.ancora) {
        console.log(`  ${r.nome.slice(0, 50).padEnd(52)} ANCORA SENZA CATEGORIA: ${r.ancora.nome} (${((r.ancora.protein_100g * r.ancora.grams) / 100).toFixed(1)}g prot, ${r.ancora.grams}g peso) - food_id ${r.ancora.food_id}`);
      } else {
        console.log(`  ${r.nome.slice(0, 50).padEnd(52)} NESSUNA ANCORA PROTEICA (piatto senza un ingrediente dominante)`);
      }
    }

    // === PUNTO 3 ===
    // Campione casuale di 15 secondi 'pesce' col metodo nuovo.
    const pesceSecondi = [];
    for (const p of secondi) {
      const { gruppo, ancora } = gruppoCategoria(p.ingredienti, categorieDi);
      if (gruppo === 'pesce') pesceSecondi.push({ nome: p.nome, ancora });
    }
    // Selezione pseudo-casuale ma deterministica (seed fisso), non serve
    // crypto-random per un controllo a campione.
    function mescola(arr, seed) {
      let s = seed;
      const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    const campione = mescola(pesceSecondi, 42).slice(0, 15);
    console.log(`\n=== PUNTO 3: campione casuale di 15 secondi 'pesce' (su ${pesceSecondi.length} totali) ===`);
    for (const r of campione) {
      console.log(`  ${r.nome.slice(0, 50).padEnd(52)} ancora: ${r.ancora.nome} (${((r.ancora.protein_100g * r.ancora.grams) / 100).toFixed(1)}g prot su ${r.ancora.grams}g peso)`);
    }
  } finally {
    await c.end();
  }
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
