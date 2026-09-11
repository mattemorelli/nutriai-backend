require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';

(async () => {
  await supabase.from('user_constraints').delete().eq('user_id', USER_ID);
  await supabase.from('users').update({
    diet: 'vegetariano', paesi: ['italia'], cook_days: [1,2,3,4,5,6,7],
    lunch_away: false, evening_minutes: 45, household_size: 2,
  }).eq('id', USER_ID);
  await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
  await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: 'europea', rank: 1 }]);

  const vietatiCodici = ['carne_rossa', 'carne_bianca', 'pesce', 'crostacei'];
  let vietati = new Set();
  for (const cod of vietatiCodici) {
    const { data } = await supabase.from('categorie_alimenti').select('food_id').eq('categoria', cod);
    for (const r of data) vietati.add(r.food_id);
  }
  console.log('alimenti vietati per dieta vegetariana:', vietati.size);

  const risultato = await generaESalva(supabase, USER_ID);
  console.log('piano generato:', risultato.plan_id, 'seed:', risultato.seed);

  const { data: righe } = await supabase.from('plan_items').select('dish_id').eq('plan_id', risultato.plan_id);
  const dishIds = [...new Set(righe.map(r => r.dish_id))];
  const { data: piattiInfo } = await supabase.from('dishes').select('id, name').in('id', dishIds);
  const nomeDi = Object.fromEntries(piattiInfo.map(p => [p.id, p.name]));

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
  console.log(`piatti distinti: ${dishIds.length}, righe ingrediente controllate: ${ing.length}, violazioni: ${violazioni}`);
})();
