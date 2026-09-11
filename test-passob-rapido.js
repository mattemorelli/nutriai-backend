require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const CUCINA_DI = {
  italia: 'europea', francia: 'europea', spagna: 'europea', grecia: 'europea',
  germania: 'europea', regno_unito: 'europea', portogallo: 'europea',
  stati_uniti: 'usa', messico: 'sud_americana', argentina: 'sud_americana',
  australia: 'australiana',
};

const CONFIG = [
  { diet: 'onnivoro', paesi: ['italia'] },
  { diet: 'vegetariano', paesi: ['francia'] },
  { diet: 'onnivoro', paesi: ['australia'] },
  { diet: 'pescetariano', paesi: ['grecia'] },
  { diet: 'vegano', paesi: ['spagna'] },
  { diet: 'onnivoro', paesi: ['messico'] },
  { diet: 'onnivoro', paesi: ['argentina'] },
];

(async () => {
  for (const cfg of CONFIG) {
    const cucine = [...new Set(cfg.paesi.map(p => CUCINA_DI[p]))];
    await supabase.from('users').update({
      diet: cfg.diet, paesi: cfg.paesi, cook_days: [1,2,3,4,5,6,7],
      lunch_away: false, evening_minutes: 45, household_size: 2,
    }).eq('id', USER_ID);
    await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
    await supabase.from('user_cuisine_preferences').insert(cucine.map((c, i) => ({ user_id: USER_ID, cucina: c, rank: i + 1 })));

    const t0 = Date.now();
    try {
      const r = await generaESalva(supabase, USER_ID);
      console.log(`${cfg.diet} + ${cfg.paesi.join('+')}: OK in ${Date.now() - t0}ms (giorni_conformi=${r.giorni_conformi})`);
    } catch (e) {
      console.log(`${cfg.diet} + ${cfg.paesi.join('+')}: FALLITO in ${Date.now() - t0}ms - ${e.message.slice(0, 150)}`);
    }
  }
})();
