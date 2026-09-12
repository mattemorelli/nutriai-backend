require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

// Parola nel nome (IT o EN) -> categoria attesa negli ingredienti.
// \b su ENTRAMBI i lati di ogni parola, mai solo su un lato: senza il confine
// sinistro "pollo\b" acchiappa anche "repollo" (cavolo, in spagnolo).
const PAROLA_CATEGORIA = [
  [/\bchicken\b|\bpollo\b/i, 'carne_bianca'],
  [/\bturkey\b|\btacchino\b/i, 'carne_bianca'],
  [/\bbeef\b|\bmanzo\b/i, 'carne_rossa'],
  [/\blamb\b|\bagnello\b/i, 'carne_rossa'],
  [/\bpork\b|\bmaiale\b/i, 'carne_rossa'],
  [/\bsalmon\b|\bsalmone\b/i, 'pesce'],
  [/\btuna\b|\btonno\b/i, 'pesce'],
  [/\bcod\b|\bmerluzzo\b/i, 'pesce'],
  [/\begg[s]?\b|\buov[ao]\b/i, 'uova'],
  [/\bshrimp\b|\bprawn\b|\bgamber[io]?\b/i, 'crostacei'],
];

(async () => {
  let piatti = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from('dishes')
      .select('id, name, name_en, meal_slot, paese').order('id').range(offset, offset + 999);
    if (error) throw new Error(error.message);
    piatti = piatti.concat(data);
    if (data.length < 1000) break;
  }

  const { data: categorieAlimenti } = await supabase.from('categorie_alimenti').select('food_id, categoria');
  const categoriaDiFood = {};
  for (const c of categorieAlimenti) {
    if (!categoriaDiFood[c.food_id]) categoriaDiFood[c.food_id] = new Set();
    categoriaDiFood[c.food_id].add(c.categoria);
  }

  let ingredienti = [];
  const ids = piatti.map(p => p.id);
  for (let i = 0; i < ids.length; i += 200) {
    const blocco = ids.slice(i, i + 200);
    const { data, error } = await supabase.from('dish_ingredients').select('dish_id, food_id').in('dish_id', blocco);
    if (error) throw new Error(error.message);
    ingredienti = ingredienti.concat(data);
  }
  const categorieDelPiatto = {};
  for (const i of ingredienti) {
    if (!categorieDelPiatto[i.dish_id]) categorieDelPiatto[i.dish_id] = new Set();
    for (const cat of (categoriaDiFood[i.food_id] || [])) categorieDelPiatto[i.dish_id].add(cat);
  }

  const casi = [];
  for (const p of piatti) {
    const nome = `${p.name || ''} ${p.name_en || ''}`;
    for (const [regex, categoriaAttesa] of PAROLA_CATEGORIA) {
      if (regex.test(nome)) {
        const cats = categorieDelPiatto[p.id] || new Set();
        if (!cats.has(categoriaAttesa)) {
          casi.push({ nome: p.name_en || p.name, meal_slot: p.meal_slot, paese: p.paese, atteso: categoriaAttesa, categorie_trovate: [...cats] });
        }
      }
    }
  }

  console.log('Piatti il cui nome promette un ingrediente che non compare nella ricetta:', casi.length);
  console.log(JSON.stringify(casi, null, 2));
  require('fs').writeFileSync('/tmp/nome-vs-ingredienti.json', JSON.stringify(casi, null, 2));
})();
