require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { caricaPiatti, generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';

(async () => {
  await supabase.from('users').update({
    diet: 'onnivoro', paesi: ['australia'], cook_days: [1,2,3,4,5,6,7],
    lunch_away: false, evening_minutes: 45, household_size: 2,
  }).eq('id', USER_ID);
  await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
  await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: 'australiana', rank: 1 }]);

  console.log('=== Solo caricaPiatti, 10 chiamate di fila, stesso processo ===');
  for (let i = 1; i <= 10; i++) {
    const piatti = await caricaPiatti(supabase, ['mediterranea']);
    const perSlot = {};
    for (const p of piatti) perSlot[p.meal_slot] = (perSlot[p.meal_slot] || 0) + 1;
    console.log(`giro ${i}: totale=${piatti.length}`, perSlot);
  }

  console.log('\n=== generaESalva completo, 10 volte di fila, stesso processo, stessa config ===');
  for (let i = 1; i <= 10; i++) {
    try {
      const r = await generaESalva(supabase, USER_ID);
      console.log(`giro ${i}: OK`, r.plan_id, r.giorni_conformi);
    } catch (e) {
      console.log(`giro ${i}: FALLITO ->`, e.message);
    }
  }
})();
