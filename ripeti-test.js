require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva } = require('./genera');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const CUCINA_DI = { australia: 'australiana', messico: 'sud_americana', argentina: 'sud_americana' };
const PAESI = ['australia', 'messico', 'argentina'];
const RIPETIZIONI = 10;

(async () => {
  for (const paese of PAESI) {
    await supabase.from('users').update({
      diet: 'onnivoro', paesi: [paese], cook_days: [1,2,3,4,5,6,7],
      lunch_away: false, evening_minutes: 45, household_size: 2,
    }).eq('id', USER_ID);
    await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
    await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: CUCINA_DI[paese], rank: 1 }]);

    let ok = 0, fail = 0;
    const cause = [];
    for (let i = 0; i < RIPETIZIONI; i++) {
      try {
        await generaESalva(supabase, USER_ID);
        ok++;
      } catch (e) {
        fail++;
        cause.push(e.message.slice(0, 90));
      }
    }
    console.log(`${paese}: ${ok}/${RIPETIZIONI} riusciti`);
    if (cause.length) console.log('  cause fallimento:', cause);
  }
})();
