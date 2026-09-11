require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';

(async () => {
  await supabase.from('users').update({
    diet: 'onnivoro', paesi: ['italia'], cook_days: [1,2,3,4,5,6,7],
    lunch_away: false, evening_minutes: 45, household_size: 2,
  }).eq('id', USER_ID);
  await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
  await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: 'europea', rank: 1 }]);

  await supabase.from('user_constraints').delete().eq('user_id', USER_ID);
  await supabase.from('user_constraints').insert([
    { user_id: USER_ID, kind: 'non_gradito', subject: 'broccoli', severity: 'assoluto' },
  ]);

  const { data: vietati } = await supabase.from('foods').select('id').or('name.ilike.%broccoli%,name_it.ilike.%broccoli%');
  const idVietati = new Set(vietati.map(v => v.id));
  console.log('food_id vietati per "broccoli":', [...idVietati]);

  const r = await generaESalva(supabase, USER_ID, 12345);
  console.log('piano generato:', r.plan_id);

  const { data: righe } = await supabase.from('plan_items').select('dish_id').eq('plan_id', r.plan_id);
  const dishIds = [...new Set(righe.map(x => x.dish_id))];
  let ing = [];
  for (let i = 0; i < dishIds.length; i += 200) {
    const { data } = await supabase.from('dish_ingredients').select('dish_id, food_id').in('dish_id', dishIds.slice(i, i + 200));
    ing = ing.concat(data || []);
  }
  const { data: piattiInfo } = await supabase.from('dishes').select('id, name').in('id', dishIds);
  const nomeDi = Object.fromEntries(piattiInfo.map(p => [p.id, p.name]));

  let violazioni = 0;
  for (const i of ing) {
    if (idVietati.has(i.food_id)) {
      violazioni++;
      console.log(`  VIOLAZIONE: "${nomeDi[i.dish_id]}" contiene ${i.food_id}`);
    }
  }
  console.log(`piatti nel piano: ${dishIds.length}, violazioni: ${violazioni}`);

  await supabase.from('user_constraints').delete().eq('user_id', USER_ID);
})();
