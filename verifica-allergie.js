require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const { assertUtenteDiTest } = require('./test-users');
assertUtenteDiTest(USER_ID);

const PROVE = [
  { nome: 'allergia frutta a guscio', categoria: 'frutta_guscio' },
  { nome: 'allergia latticini', categoria: 'latticini' },
  { nome: 'niente glutine', categoria: 'glutine' },
];

async function foodIdVietati(categoria) {
  const { data } = await supabase.from('categorie_alimenti').select('food_id').eq('categoria', categoria);
  return new Set((data || []).map(r => r.food_id));
}

(async () => {
  await supabase.from('users').update({
    diet: 'onnivoro', paesi: ['italia'], cook_days: [1,2,3,4,5,6,7],
    lunch_away: false, evening_minutes: 45, household_size: 2,
  }).eq('id', USER_ID);
  await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
  await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: 'europea', rank: 1 }]);

  for (const prova of PROVE) {
    console.log(`\n=== ${prova.nome} (categoria esclusa: ${prova.categoria}) ===`);

    await supabase.from('user_constraints').delete().eq('user_id', USER_ID);
    const { error: errIns } = await supabase.from('user_constraints').insert([{ user_id: USER_ID, kind: 'allergia', subject: prova.categoria, severity: 'assoluto' }]);
    if (errIns) { console.log('ERRORE inserimento vincolo:', errIns.message); continue; }

    const vietati = await foodIdVietati(prova.categoria);
    console.log(`alimenti vietati per questa categoria: ${vietati.size}`);

    let risultato;
    try {
      risultato = await generaESalva(supabase, USER_ID);
    } catch (e) {
      console.log('GENERAZIONE FALLITA:', e.message);
      continue;
    }
    console.log('piano generato:', risultato.plan_id, 'seed:', risultato.seed);

    const { data: righe } = await supabase
      .from('plan_items')
      .select('day_of_week, meal, slot, dish_id')
      .eq('plan_id', risultato.plan_id);

    const dishIds = [...new Set(righe.map(r => r.dish_id))];
    const { data: piattiInfo } = await supabase.from('dishes').select('id, name').in('id', dishIds);
    const nomeDi = Object.fromEntries((piattiInfo || []).map(p => [p.id, p.name]));

    let ing = [];
    for (let i = 0; i < dishIds.length; i += 200) {
      const { data } = await supabase.from('dish_ingredients').select('dish_id, food_id').in('dish_id', dishIds.slice(i, i + 200));
      ing = ing.concat(data || []);
    }

    let violazioni = 0;
    for (const i of ing) {
      if (vietati.has(i.food_id)) {
        violazioni++;
        console.log(`  VIOLAZIONE: piatto "${nomeDi[i.dish_id]}" (${i.dish_id}) contiene food_id vietato ${i.food_id}`);
      }
    }
    console.log(`piatti distinti nel piano: ${dishIds.length}, righe ingrediente controllate: ${ing.length}, violazioni trovate: ${violazioni}`);
  }

  await supabase.from('user_constraints').delete().eq('user_id', USER_ID);
})();
