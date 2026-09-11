require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

// Confine di parola su ENTRAMBI i lati per ogni singolo termine - mai un
// termine senza \b su tutti e due i lati, o si prende parole come
// "girasole" (contiene "sole") o "cucumber" per un match parziale.
const PAROLE = [
  'pesce', 'fish', 'salmon', 'salmone', 'tuna', 'tonno', 'merluzzo', 'nasello',
  'sgombro', 'mackerel', 'branzino', 'orata', 'seabass', 'seabream', 'trota',
  'trout', 'sogliola', 'sole', 'halibut', 'baccala', 'bacalhau', 'stoccafisso',
  'cod', 'sardina', 'sardine', 'alici', 'acciughe', 'anchovy', 'aringa',
  'herring', 'anguilla', 'eel', 'spigola', 'rombo', 'turbot', 'passera',
  'flounder', 'luccio', 'pike', 'triglia', 'mullet', 'pangasio', 'tilapia',
  'persico', 'perch', 'salmerino', 'char', 'ricciola', 'amberjack', 'pescespada',
  'swordfish',
];
const REGEX_PESCE = new RegExp('\\b(' + PAROLE.join('|') + ')\\b', 'i');
// Gli accenti (baccalà) rompono \b in modalita' non-unicode: si normalizza
// prima di testare, non si prova a incastrare l'accento dentro il pattern.
const senzaAccenti = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

(async () => {
  const { data: foods } = await supabase.from('foods').select('id, name, name_it');
  const candidati = foods.filter(f => REGEX_PESCE.test(senzaAccenti(f.name)) || REGEX_PESCE.test(senzaAccenti(f.name_it)));
  console.log('foods che sembrano pesce per nome:', candidati.length);
  for (const f of candidati) console.log(' ', f.id, '|', f.name_it, '|', f.name);

  const { data: cat } = await supabase.from('categorie_alimenti').select('food_id, categoria');
  const perFood = {};
  for (const c of cat) { if (!perFood[c.food_id]) perFood[c.food_id] = new Set(); perFood[c.food_id].add(c.categoria); }

  const mancanti = candidati.filter(f => !(perFood[f.id] && perFood[f.id].has('pesce')));
  console.log('\ncandidati NON taggati pesce:', mancanti.length);
  for (const f of mancanti) console.log(' ', f.id, '|', f.name_it, '|', f.name, '| categorie attuali:', [...(perFood[f.id]||[])]);

  // quali food_id sono davvero USATI in qualche piatto, tra quelli mancanti?
  const idsMancanti = mancanti.map(f => f.id);
  if (idsMancanti.length) {
    const { data: usati } = await supabase.from('dish_ingredients').select('food_id, dish_id').in('food_id', idsMancanti);
    const perFoodUsato = {};
    for (const u of usati || []) { perFoodUsato[u.food_id] = (perFoodUsato[u.food_id]||0) + 1; }
    console.log('\nquanti piatti usano ciascun ingrediente mancante:');
    for (const f of mancanti) console.log(' ', f.name_it, '->', perFoodUsato[f.id] || 0, 'piatti');
  }

  require('fs').writeFileSync('/tmp/pesce-mancanti.json', JSON.stringify(mancanti, null, 2));
})();
