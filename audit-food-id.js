require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const CATEGORIE_SENSIBILI = {
  pesce: /\bpesc\w*\b|\btonno\b|\bsalmone\b|\bmerluzzo\b|\bbaccal[aà]\b|\bacciug\w*\b|\bsgombro\b|\brombo\b|\bnasello\b|\borata\b|\bbranzino\b|\bsogliola\b|\btrota\b|\bfish\b|\bcod\b|\bsalmon\b|\btuna\b|\bhaddock\b|\bmackerel\b|\bsardin\w*\b|\banchov\w*\b|\btrout\b|\bhake\b|\bsole\b|\bsea\s*bass\b|\bplaice\b/i,
  crostacei: /\bgamber\w*\b|\bscamp\w*\b|\baragost\w*\b|\bgranchi\w*\b|\bshrimp\b|\bprawn\b|\bcrab\b|\blobster\b|\bcrayfish\b/i,
  latticini: /\blatte\b|\byogurt\b|\bformaggio\b|\bmozzarella\b|\bparmigian\w*\b|\bricotta\b|\bpanna\b|\bburro\b|\bmilk\b|\bcheese\b|\bcream\b|\bbutter\b|\bfeta\b|\bchedd\w*\b/i,
  uova: /\buov[ao]\b|\begg\b|\begg[s]?\b/i,
  glutine: /\bfarina\b|\bpane\b|\bpasta\b|\bgrano\b|\bfrumento\b|\borzo\b|\bsegal\w*\b|\bwheat\b|\bbread\b|\bflour\b|\bbarley\b|\brye\b|\bcouscous\b|\bseitan\b/i,
  frutta_a_guscio: /\bmandorl\w*\b|\bnoc\w*\b|\bnocciol\w*\b|\bpistacchi\w*\b|\bpinoli\b|\bcastagn\w*\b|\balmond\b|\bwalnut\b|\bhazelnut\b|\bpistachio\b|\bpine\s*nut\b|\bcashew\b|\bpecan\b/i,
  soia: /\bsoia\b|\bsoy\w*\b|\btofu\b|\bedamame\b|\btempeh\b|\bmiso\b/i,
  arachidi: /\barachid\w*\b|\bpeanut\b/i,
};

function senzaAccenti(s) {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

(async () => {
  console.log('=== 1) food_id usati in dish_ingredients senza corrispondenza in foods ===');

  let usati = [];
  {
    let da = 0;
    while (true) {
      const { data, error } = await supabase.from('dish_ingredients').select('dish_id, food_id').range(da, da + 999);
      if (error) throw error;
      if (!data.length) break;
      usati = usati.concat(data);
      da += 1000;
      if (data.length < 1000) break;
    }
  }
  console.log('righe totali in dish_ingredients:', usati.length);

  const idUsati = new Set(usati.map(r => r.food_id));
  console.log('food_id distinti usati nei piatti:', idUsati.size);

  let foods = [];
  {
    let da = 0;
    while (true) {
      const { data, error } = await supabase.from('foods').select('id, name, name_it').range(da, da + 999);
      if (error) throw error;
      if (!data.length) break;
      foods = foods.concat(data);
      da += 1000;
      if (data.length < 1000) break;
    }
  }
  console.log('righe totali in foods:', foods.length);
  const foodById = new Map(foods.map(f => [f.id, f]));

  const orfani = [...idUsati].filter(id => !foodById.has(id));
  console.log('food_id usati nei piatti SENZA riga in foods:', orfani.length);
  if (orfani.length) {
    console.log('  esempi (max 20):', orfani.slice(0, 20));
    const numerici = orfani.filter(id => /^\d+$/.test(id));
    const slug = orfani.filter(id => !/^\d+$/.test(id));
    console.log(`  di cui numerici (stile USDA): ${numerici.length}, di cui slug/testo: ${slug.length}`);
  }

  console.log('\n=== 2) foods di categoria sensibile senza nessuna riga in categorie_alimenti ===');

  let categorie = [];
  {
    let da = 0;
    while (true) {
      const { data, error } = await supabase.from('categorie_alimenti').select('food_id, categoria').range(da, da + 999);
      if (error) throw error;
      if (!data.length) break;
      categorie = categorie.concat(data);
      da += 1000;
      if (data.length < 1000) break;
    }
  }
  const categorizzati = new Set(categorie.map(c => `${c.food_id}::${c.categoria}`));
  const foodIdConAlmenoUnaCategoria = new Set(categorie.map(c => c.food_id));

  const buchi = {};
  const dettagliBuchi = {};
  for (const cat of Object.keys(CATEGORIE_SENSIBILI)) { buchi[cat] = 0; dettagliBuchi[cat] = []; }

  for (const f of foods) {
    const nome = senzaAccenti(`${f.name_it || ''} ${f.name || ''}`);
    for (const [cat, regex] of Object.entries(CATEGORIE_SENSIBILI)) {
      if (regex.test(nome) && !categorizzati.has(`${f.id}::${cat}`)) {
        buchi[cat]++;
        if (dettagliBuchi[cat].length < 10) dettagliBuchi[cat].push({ id: f.id, name_it: f.name_it, name: f.name });
      }
    }
  }
  let totaleBuchi = 0;
  for (const cat of Object.keys(CATEGORIE_SENSIBILI)) {
    console.log(`  ${cat}: ${buchi[cat]} alimenti che sembrano appartenere alla categoria ma non hanno la riga in categorie_alimenti`);
    if (buchi[cat]) console.log('    esempi:', dettagliBuchi[cat]);
    totaleBuchi += buchi[cat];
  }
  console.log('totale righe mancanti stimate (somma per categoria, un food puo contare in piu categorie):', totaleBuchi);

  console.log('\n=== 3) piatti con almeno un ingrediente non risolvibile (food_id orfano) ===');
  const orfaniSet = new Set(orfani);
  const dishIdConOrfano = new Set(usati.filter(r => orfaniSet.has(r.food_id)).map(r => r.dish_id));
  console.log('piatti (dish_id distinti) con almeno un ingrediente il cui food_id non esiste in foods:', dishIdConOrfano.size);

  if (dishIdConOrfano.size) {
    const { data: piattiEsempio } = await supabase.from('dishes').select('id, name, paese, meal_slot').in('id', [...dishIdConOrfano].slice(0, 15));
    console.log('  esempi (max 15):', piattiEsempio);
  }

  console.log('\n=== Confronto formati: quanti food_id sono numerici (USDA) vs slug italiani, fra quelli usati ===');
  const numericiUsati = [...idUsati].filter(id => /^\d+$/.test(id));
  const slugUsati = [...idUsati].filter(id => !/^\d+$/.test(id));
  console.log(`numerici: ${numericiUsati.length}, slug/testo: ${slugUsati.length}, totale distinti: ${idUsati.size}`);
})();
