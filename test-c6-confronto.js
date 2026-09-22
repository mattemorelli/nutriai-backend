require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const MODULO = process.argv[2] === 'prima' ? './genera-uniforme-temp' : './genera';
const { generaESalva } = require(MODULO);

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const { assertUtenteDiTest } = require('./test-users');
assertUtenteDiTest(USER_ID);
const N = 50;

(async () => {
  await supabase.from('users').update({
    diet: 'onnivoro', paesi: ['italia'], cook_days: [1,2,3,4,5,6,7],
    lunch_away: false, evening_minutes: 45, household_size: 2,
  }).eq('id', USER_ID);
  await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
  await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: 'europea', rank: 1 }]);

  const firme = new Set();
  let sommaSalute = 0, contaPiatti = 0;
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const seed = 2000000 + i;
    const r = await generaESalva(supabase, USER_ID, seed);
    const { data } = await supabase
      .from('plan_items')
      .select('day_of_week, meal, slot, dish_id, dishes(health_score)')
      .eq('plan_id', r.plan_id)
      .order('day_of_week').order('meal').order('slot');
    const firma = data.map(x => `${x.day_of_week}-${x.meal}-${x.slot}-${x.dish_id}`).join('|');
    firme.add(firma);
    for (const riga of data) {
      if (riga.dishes && riga.dishes.health_score != null) { sommaSalute += riga.dishes.health_score; contaPiatti++; }
    }
    await supabase.from('plans').delete().eq('id', r.plan_id);
  }
  console.log(`[${MODULO}] ${N} generazioni, ${Date.now() - t0}ms totali`);
  console.log(`[${MODULO}] Settimane distinte: ${firme.size}/${N}`);
  console.log(`[${MODULO}] Voto salute medio: ${(sommaSalute / contaPiatti).toFixed(3)} (su ${contaPiatti} piatti)`);
})();
