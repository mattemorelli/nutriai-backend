require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

(async () => {
  // Tutti i piatti, paginati (PostgREST tronca a 1000 di default)
  let piatti = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from('dishes')
      .select('id, name, name_en, meal_slot, famiglia, paese, cucina')
      .order('id')
      .range(offset, offset + 999);
    if (error) throw new Error(error.message);
    piatti = piatti.concat(data);
    if (data.length < 1000) break;
  }
  console.log('piatti totali:', piatti.length);

  let ingredienti = [];
  const ids = piatti.map(p => p.id);
  for (let i = 0; i < ids.length; i += 200) {
    const blocco = ids.slice(i, i + 200);
    const { data, error } = await supabase.from('dish_ingredients')
      .select('dish_id, food_id, grams').in('dish_id', blocco);
    if (error) throw new Error(error.message);
    ingredienti = ingredienti.concat(data);
  }
  console.log('righe ingrediente totali:', ingredienti.length);

  const ingredientiPer = {};
  for (const i of ingredienti) {
    if (!ingredientiPer[i.dish_id]) ingredientiPer[i.dish_id] = [];
    ingredientiPer[i.dish_id].push(i);
  }

  // --- 1. Set di ingredienti identico (stessi food_id, stessi grammi) tra
  // piatti con nome diverso: segnale forte di copia-incolla tra un batch e
  // l'altro senza aggiornare la ricetta.
  const firma = (lista) => (lista || [])
    .map(x => `${x.food_id}:${x.grams}`).sort().join('|');

  const perFirma = {};
  for (const p of piatti) {
    const f = firma(ingredientiPer[p.id]);
    if (!f) continue; // piatto senza ingredienti, altro problema, gestito sotto
    if (!perFirma[f]) perFirma[f] = [];
    perFirma[f].push(p);
  }
  const duplicati = Object.values(perFirma).filter(gruppo => {
    const nomiDiversi = new Set(gruppo.map(p => p.name));
    return gruppo.length > 1 && nomiDiversi.size > 1;
  });
  console.log('\n=== Gruppi di piatti con ingredienti IDENTICI ma nomi diversi ===');
  console.log('gruppi trovati:', duplicati.length, ' | piatti coinvolti:', duplicati.reduce((s,g)=>s+g.length,0));

  // --- 2. Piatti senza ingredienti affatto ---
  const senzaIngredienti = piatti.filter(p => !ingredientiPer[p.id] || !ingredientiPer[p.id].length);
  console.log('\n=== Piatti senza NESSUN ingrediente registrato ===');
  console.log('count:', senzaIngredienti.length);

  // --- 3. Piatti con un solo ingrediente (sospetto per un secondo/primo) ---
  const unSolo = piatti.filter(p => (ingredientiPer[p.id] || []).length === 1
    && ['primo', 'secondo'].includes(p.meal_slot));
  console.log('\n=== Primi/secondi con un solo ingrediente in tutto ===');
  console.log('count:', unSolo.length);

  require('fs').writeFileSync('/tmp/dup-ingredienti.json', JSON.stringify(duplicati, null, 2));
  require('fs').writeFileSync('/tmp/senza-ingredienti.json', JSON.stringify(senzaIngredienti, null, 2));
  require('fs').writeFileSync('/tmp/un-solo-ingrediente.json', JSON.stringify(unSolo.map(p => ({...p, ingredienti: ingredientiPer[p.id]})), null, 2));
  console.log('\nsalvato tutto in /tmp/*.json');
})();
