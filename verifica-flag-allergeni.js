// Controlla che i flag di comodo sui piatti (contiene_glutine, contiene_lattosio,
// contiene_frutta_secca) coincidano con quello che risulta davvero dagli
// ingredienti via categorie_alimenti - la STESSA fonte che il generatore usa
// per escludere i piatti da chi ha quel vincolo (vedi caricaVincoli in
// genera.js). I due sistemi sono indipendenti: un flag sbagliato non fa
// sbagliare il generatore (che legge categorie_alimenti), ma fa mostrare
// nell'app un'etichetta sbagliata - per un celiaco o un allergico e' un
// problema di fiducia, anche se non di sicurezza nel piano.
//
// Trovato e corretto una prima volta il 2026-10-09 (vedi nutriai/audit/
// lotto-01.md): 243 piatti su contiene_glutine, 160 su contiene_lattosio,
// 84 su contiene_frutta_secca. Questo script e' il controllo permanente
// perche' non succeda piu' in silenzio: SOLA LETTURA, non corregge nulla,
// elenca le discrepanze e fallisce (exit code 1) se ne trova anche una sola.
//
// Uso: node verifica-flag-allergeni.js
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

// flag su dishes -> categoria in categorie_alimenti da cui si deriva
const MAPPA_FLAG = {
  contiene_glutine: 'glutine',
  contiene_lattosio: 'lattosio',
  contiene_frutta_secca: 'frutta_guscio',
};

async function paginato(tabella, select) {
  const ordine = {
    dishes: ['id'], dish_ingredients: ['dish_id', 'food_id'],
    categorie_alimenti: ['food_id', 'categoria'],
  }[tabella];
  if (!ordine) throw new Error('Ordinamento non definito per ' + tabella);
  let tutti = [];
  let offset = 0;
  while (true) {
    let query = supabase.from(tabella).select(select);
    for (const colonna of ordine) query = query.order(colonna);
    const { data, error } = await query.range(offset, offset + 999);
    if (error) throw new Error(`lettura ${tabella}: ${error.message}`);
    tutti.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return tutti;
}

(async () => {
  const categorieServono = [...new Set(Object.values(MAPPA_FLAG))];
  const righeCategorie = (await paginato('categorie_alimenti', 'food_id, categoria'))
    .filter(r => categorieServono.includes(r.categoria));

  const foodIdPerCategoria = {};
  for (const cat of categorieServono) foodIdPerCategoria[cat] = new Set();
  for (const r of righeCategorie) foodIdPerCategoria[r.categoria].add(r.food_id);

  const ingredienti = await paginato('dish_ingredients', 'dish_id, food_id');
  const dishes = await paginato('dishes', 'id, name, mercati, ' + Object.keys(MAPPA_FLAG).join(', '));

  const foodsPerDish = new Map();
  for (const r of ingredienti) {
    if (!foodsPerDish.has(r.dish_id)) foodsPerDish.set(r.dish_id, []);
    foodsPerDish.get(r.dish_id).push(r.food_id);
  }

  const discrepanze = [];
  for (const d of dishes) {
    const foods = foodsPerDish.get(d.id) || [];
    for (const [flag, categoria] of Object.entries(MAPPA_FLAG)) {
      const corretto = foods.some(f => foodIdPerCategoria[categoria].has(f));
      const attuale = Boolean(d[flag]);
      if (attuale !== corretto) {
        discrepanze.push({
          dish_id: d.id, nome: d.name, flag, attuale, corretto,
          mercatoIT: (d.mercati || []).includes('it'),
        });
      }
    }
  }

  console.log(`Piatti controllati: ${dishes.length} | ingredienti controllati: ${ingredienti.length}`);
  console.log(`Discrepanze trovate: ${discrepanze.length}`);

  if (discrepanze.length) {
    const perFlag = {};
    for (const d of discrepanze) (perFlag[d.flag] ||= []).push(d);
    for (const [flag, lista] of Object.entries(perFlag)) {
      const inIT = lista.filter(x => x.mercatoIT).length;
      console.log(`\n--- ${flag}: ${lista.length} piatti (${inIT} nel mercato IT) ---`);
      for (const d of lista) {
        console.log(`  ${d.mercatoIT ? '[IT] ' : '     '}${d.nome} (${d.dish_id.slice(0, 8)}): salvato=${d.attuale}, corretto=${d.corretto}`);
      }
    }
    console.log(`\n${discrepanze.length} DISCREPANZE: i flag non coincidono con gli ingredienti reali.`);
    process.exitCode = 1;
  } else {
    console.log('\nNessuna discrepanza. Tutti i flag coincidono con gli ingredienti reali.');
  }
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
