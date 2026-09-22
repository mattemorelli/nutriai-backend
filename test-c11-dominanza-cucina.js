require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const { assertUtenteDiTest } = require('./test-users');
assertUtenteDiTest(USER_ID);
const N = 20;

(async () => {
  // Preferenze ordinate: europea (rank1) > sud_americana (rank2) > usa (rank3).
  // Tre paesi, uno per famiglia, cosi' ogni piatto e' attribuibile senza ambiguita'.
  await supabase.from('users').update({
    diet: 'onnivoro', paesi: ['italia', 'messico', 'stati_uniti'], cook_days: [1,2,3,4,5,6,7],
    lunch_away: false, evening_minutes: 45, household_size: 2,
  }).eq('id', USER_ID);
  await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
  await supabase.from('user_cuisine_preferences').insert([
    { user_id: USER_ID, cucina: 'europea', rank: 1 },
    { user_id: USER_ID, cucina: 'sud_americana', rank: 2 },
    { user_id: USER_ID, cucina: 'usa', rank: 3 },
  ]);

  const perFamiglia = {};
  let totale = 0;
  const perFamigliaProfiloSettimana = {}; // quale famiglia domina l'intera settimana (profiloSettimana)

  for (let i = 0; i < N; i++) {
    const r = await generaESalva(supabase, USER_ID, 7000000 + i);
    const { data } = await supabase
      .from('plan_items')
      .select('dish_id, slot, dishes(famiglia, meal_slot)')
      .eq('plan_id', r.plan_id)
      .eq('slot', 'secondo');
    for (const riga of data) {
      const fam = riga.dishes?.famiglia || 'sconosciuta';
      perFamiglia[fam] = (perFamiglia[fam] || 0) + 1;
      totale++;
    }
    await supabase.from('plans').delete().eq('id', r.plan_id);
  }

  console.log(`Secondi totali su ${N} settimane: ${totale}`);
  console.log('Per famiglia:', perFamiglia);
  for (const [fam, n] of Object.entries(perFamiglia)) {
    console.log(`  ${fam}: ${n} (${((n / totale) * 100).toFixed(1)}%)`);
  }
})();
