// f3-gruppo-proteico.js — SOLA LETTURA, non scrive niente.
//
// Il gruppo proteico di un piatto (pesce / carne_rossa / carne_bianca / uova /
// formaggio / legumi) oggi si indovina con sei espressioni regolari applicate
// ai NOMI degli ingredienti sopra i 40 g (genera.js, GRUPPI + gruppoDa). E'
// fragile per costruzione: foods.name mescola inglese USDA e slug italiani, e
// 48 secondi non vengono riconosciuti da nessuna regex. Un secondo senza
// gruppo non viene mai scelto nei giorni in cui il piano proteico chiede un
// gruppo preciso, quindi sparisce dal generatore senza che niente lo segnali —
// ed e' anche il motivo per cui il bilanciamento pesce/carne sulla settimana
// (QUOTE) non puo' funzionare davvero.
//
// L'alternativa: il gruppo si LEGGE da categorie_alimenti, sull'ingrediente
// che porta la proteina. Non viola la regola 9 del CLAUDE.md ("la categoria
// non deve mai determinare il ruolo"): qui il ruolo resta deciso dai grammi di
// proteina, e la categoria dice soltanto *che cosa e'* l'ingrediente che il
// ruolo ha gia' scelto. E' anche cio' che protegge dai casi che la regola cita
// (il curry rosso e' taggato 'pesce' perche' contiene salsa di pesce, ma con
// 8 g e quasi zero proteine non sara' mai l'ancora del piatto).
//
// Questo script confronta i due metodi piatto per piatto e stampa dove
// cambiano idea. Si guarda l'output PRIMA di cambiare genera.js.

require('dotenv').config();
const { Client } = require('pg');

// --- il metodo di oggi, copiato da genera.js senza modifiche ---
const GRUPPI = [
  ['pesce',        /fish|salmon|salmone|cod,|merluzzo|tuna|tonno|trout|trota|sgombro|sardin|acciugh|aringa|branzino|orata|barramundi|halibut|nasello|rombo|sogliola|anguilla|baccal|mahi|astice|granchio|crab|shrimp|gamber|vongol|cozze|seppia|polpo/i],
  ['carne_rossa',  /beef|manzo|brisket|agnello|lamb|canguro|kangaroo|vitell|veal|maiale|pork|lonza|speck|bresaola/i],
  ['carne_bianca', /chicken|pollo|turkey|tacchino|coniglio|rabbit/i],
  ['uova',         /\begg|uovo/i],
  ['formaggio',    /cheese|formagg|mozzarella|ricotta|pecorino|gorgonzola|taleggio|provola|emmental|caprino|stracchino|cheddar|feta|parmig/i],
  ['legumi',       /fagiol|beans,|lentil|lenticch|ceci|chickpea|lupini|tofu|tempeh|edamame/i],
];

function gruppoRegex(ingredienti) {
  const testo = ingredienti.filter(i => i.grams >= 40).map(i => i.nome).join(' | ');
  for (const [gruppo, rx] of GRUPPI) if (rx.test(testo)) return gruppo;
  return null;
}

// --- il metodo proposto ---
// Da categoria a gruppo proteico. L'ordine e' la precedenza quando l'ancora
// porta piu' categorie: si nomina il piatto per la proteina piu' "impegnativa"
// (il pesce prima del latticino, la carne prima del legume), che e' l'ordine
// in cui QUOTE ragiona.
const GRUPPO_DA_CATEGORIA = [
  ['pesce',        ['pesce', 'crostacei', 'molluschi']],
  ['carne_rossa',  ['carne_rossa', 'maiale']],
  ['carne_bianca', ['carne_bianca']],
  ['uova',         ['uova']],
  ['legumi',       ['legumi', 'soia']],
  ['formaggio',    ['latticini']],
];

// L'ancora proteica, con la metrica di F1 dichiarata nel CLAUDE.md (regola 9):
// grammi di proteina reale, soglia >= 10 g oppure >= 25% della proteina del
// piatto. Il peso dell'alimento e' la misura sbagliata per la proteina: un
// contorno di verdure puo' pesare piu' del pollo.
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

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  try {
    // Quali categorie esistono davvero: CATEGORIE_DIETA in genera.js cita
    // anche 'molluschi', e se quella categoria non esiste il filtro vegano e
    // vegetariano la sta cercando a vuoto.
    const { rows: catEsistenti } = await c.query(
      'select categoria, count(*)::int as n from categorie_alimenti group by categoria order by n desc'
    );
    console.log('=== categorie esistenti in categorie_alimenti ===');
    catEsistenti.forEach(r => console.log(`  ${r.categoria.padEnd(18)} ${r.n}`));
    const nomi = new Set(catEsistenti.map(r => r.categoria));
    const citate = [...new Set(GRUPPO_DA_CATEGORIA.flatMap(([, v]) => v)
      .concat(['crostacei', 'molluschi', 'latticini', 'carne_rossa', 'carne_bianca', 'pesce', 'uova']))];
    const mancanti = citate.filter(x => !nomi.has(x));
    if (mancanti.length) console.log(`  ATTENZIONE: citate nel codice ma inesistenti: ${mancanti.join(', ')}`);
    console.log('');

    const { rows: cats } = await c.query('select food_id, categoria from categorie_alimenti');
    const categorieDi = {};
    for (const r of cats) (categorieDi[r.food_id] ||= new Set()).add(r.categoria);

    // Un solo giro, niente paginazione: la query torna tutto.
    const { rows } = await c.query(`
      select d.id, d.name_it_o_name as nome_piatto, d.meal_slot, d.health_score,
             i.food_id, i.grams, f.name as nome, f.protein_100g
        from (select id, coalesce(name, name_en) as name_it_o_name, meal_slot, health_score from dishes) d
        join dish_ingredients i on i.dish_id = d.id
        join foods f on f.id = i.food_id
       order by d.id
    `);

    const piatti = new Map();
    for (const r of rows) {
      if (!piatti.has(r.id)) {
        piatti.set(r.id, { id: r.id, nome: r.nome_piatto, slot: r.meal_slot, salute: r.health_score, ingredienti: [] });
      }
      piatti.get(r.id).ingredienti.push({
        food_id: r.food_id,
        nome: r.nome || '',
        grams: Number(r.grams),
        protein_100g: Number(r.protein_100g || 0),
      });
    }

    const tutti = [...piatti.values()];
    const secondi = tutti.filter(p => p.slot === 'secondo');
    console.log(`piatti totali: ${tutti.length} · secondi: ${secondi.length}\n`);

    const esiti = { soloRegex: [], soloCategoria: [], nessuno: [], diversi: [], uguali: 0 };

    for (const p of secondi) {
      const vecchio = gruppoRegex(p.ingredienti);
      const { gruppo: nuovo, ancora } = gruppoCategoria(p.ingredienti, categorieDi);
      const riga = { ...p, vecchio, nuovo, ancora: ancora ? `${ancora.nome} (${Math.round((ancora.protein_100g * ancora.grams) / 100)} g prot)` : '—' };

      if (vecchio && nuovo && vecchio === nuovo) esiti.uguali++;
      else if (vecchio && nuovo) esiti.diversi.push(riga);
      else if (vecchio && !nuovo) esiti.soloRegex.push(riga);
      else if (!vecchio && nuovo) esiti.soloCategoria.push(riga);
      else esiti.nessuno.push(riga);
    }

    console.log('=== secondi: confronto fra i due metodi ===');
    console.log(`  d'accordo:                         ${esiti.uguali}`);
    console.log(`  RECUPERATI dalla categoria:        ${esiti.soloCategoria.length}   (oggi senza gruppo, quindi mai scelti nei giorni a gruppo richiesto)`);
    console.log(`  PERSI passando alla categoria:     ${esiti.soloRegex.length}   (li vede solo la regex: da guardare uno per uno)`);
    console.log(`  in DISACCORDO:                     ${esiti.diversi.length}   (da guardare uno per uno)`);
    console.log(`  senza gruppo in entrambi i modi:   ${esiti.nessuno.length}\n`);

    const mostra = (titolo, righe, dettaglio) => {
      if (!righe.length) return;
      console.log(`=== ${titolo} ===`);
      righe.slice(0, 40).forEach(r => console.log(`  ${String(r.nome).slice(0, 44).padEnd(46)} ${dettaglio(r)}`));
      if (righe.length > 40) console.log(`  … (+${righe.length - 40})`);
      console.log('');
    };

    mostra('in disaccordo', esiti.diversi, r => `regex: ${r.vecchio}  →  categoria: ${r.nuovo}   [ancora: ${r.ancora}]`);
    mostra('persi (li vede solo la regex)', esiti.soloRegex, r => `regex: ${r.vecchio}   [ancora: ${r.ancora}]`);
    mostra('recuperati dalla categoria', esiti.soloCategoria, r => `→ ${r.nuovo}   [ancora: ${r.ancora}]`);
    mostra('senza gruppo in entrambi i modi', esiti.nessuno, r => `[ancora: ${r.ancora}]`);

    // Il punto 8 vive qui: se i gruppi sono squilibrati nel catalogo, nessuna
    // quota settimanale potra' pareggiarli.
    console.log('=== quanti secondi per gruppo, col metodo nuovo ===');
    const perGruppo = {};
    for (const p of secondi) {
      const g = gruppoCategoria(p.ingredienti, categorieDi).gruppo || 'SENZA GRUPPO';
      perGruppo[g] = (perGruppo[g] || 0) + 1;
    }
    Object.entries(perGruppo).sort((a, b) => b[1] - a[1])
      .forEach(([g, n]) => console.log(`  ${g.padEnd(16)} ${n}`));
  } finally {
    await c.end();
  }
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
