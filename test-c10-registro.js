require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');
const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';

(async () => {
  await supabase.from('users').update({
    diet: 'vegetariano', paesi: ['germania'], cook_days: [1,2,3,4,5,6,7],
    lunch_away: false, evening_minutes: 45, household_size: 2,
  }).eq('id', USER_ID);
  await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
  await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: 'europea', rank: 1 }]);

  const SEED = 3249335585; // lo stesso seed gia' noto da Fase 2/Passo D come esempio duro
  const r = await generaESalva(supabase, USER_ID, SEED);
  console.log('\n=== RISULTATO ===');
  console.log('seed:', SEED, 'gradino raggiunto:', r.gradino, 'concessioni:', r.concessioni.length);
})();
