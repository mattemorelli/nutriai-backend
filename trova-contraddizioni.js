require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const C = require('./classificazione-alimenti');

(async () => {
  let foods = [];
  {
    let da = 0;
    while (true) {
      const { data, error } = await supabase.from('foods').select('id, name, name_it').order('id').range(da, da + 999);
      if (error) throw error;
      if (!data.length) break;
      foods = foods.concat(data);
      da += 1000;
      if (data.length < 1000) break;
    }
  }
  const nomeDi = Object.fromEntries(foods.map(f => [f.id, f.name_it || f.name]));

  let esistenti = [];
  {
    let da = 0;
    while (true) {
      const { data, error } = await supabase.from('categorie_alimenti').select('food_id, categoria').order('food_id').order('categoria').range(da, da + 999);
      if (error) throw error;
      if (!data.length) break;
      esistenti = esistenti.concat(data);
      da += 1000;
      if (data.length < 1000) break;
    }
  }

  console.log(`Righe totali in categorie_alimenti: ${esistenti.length}`);
  console.log('Contraddizioni: righe presenti in DB che la classificazione di questa fase NON considera ne certe ne prudenti.\n');

  let contraddizioni = 0;
  for (const r of esistenti) {
    const cls = C[r.food_id];
    if (!cls) continue; // alimento non nella nostra lista (non dovrebbe succedere)
    const ammesse = new Set([...(cls.certe || []), ...(cls.prudenti || [])]);
    if (!ammesse.has(r.categoria)) {
      contraddizioni++;
      console.log(`  ${r.food_id.padEnd(28)} ${(nomeDi[r.food_id] || '?').padEnd(35)} ha '${r.categoria}' in DB, ma la classificazione dice: [${[...ammesse].join(', ') || 'nessuna'}]`);
    }
  }
  console.log(`\nTotale contraddizioni trovate: ${contraddizioni}`);
})();
