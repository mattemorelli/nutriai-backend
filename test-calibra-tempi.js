require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const N = 5;

const CONFIG = [
  { nome: 'onnivoro+Australia',  diet: 'onnivoro',    paesi: ['australia'], cucina: 'australiana' },
  { nome: 'onnivoro+Messico',    diet: 'onnivoro',    paesi: ['messico'],   cucina: 'sud_americana' },
  { nome: 'onnivoro+Argentina',  diet: 'onnivoro',    paesi: ['argentina'], cucina: 'sud_americana' },
  { nome: 'vegetariano+Francia', diet: 'vegetariano', paesi: ['francia'],   cucina: 'europea' },
  { nome: 'vegetariano+Germania', diet: 'vegetariano', paesi: ['germania'], cucina: 'europea' },
  { nome: 'vegano+RegnoUnito',   diet: 'vegano',       paesi: ['regno_unito'], cucina: 'europea' },
  { nome: 'pescetariano+Germania+RegnoUnito', diet: 'pescetariano', paesi: ['germania', 'regno_unito'], cucina: 'europea' },
  { nome: 'vegetariano+Portogallo+Germania', diet: 'vegetariano', paesi: ['portogallo', 'germania'], cucina: 'europea' },
  { nome: 'vegano+RegnoUnito+StatiUniti', diet: 'vegano', paesi: ['regno_unito', 'stati_uniti'], cucina: 'europea' },
];

(async () => {
  for (const cfg of CONFIG) {
    await supabase.from('users').update({
      diet: cfg.diet, paesi: cfg.paesi, cook_days: [1,2,3,4,5,6,7],
      lunch_away: false, evening_minutes: 45, household_size: 2,
    }).eq('id', USER_ID);
    await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
    await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: cfg.cucina, rank: 1 }]);

    const tempi = [];
    for (let i = 0; i < N; i++) {
      const t0 = Date.now();
      try {
        await generaESalva(supabase, USER_ID, 5000000 + i);
        tempi.push(Date.now() - t0);
      } catch (e) {
        tempi.push(Date.now() - t0);
        console.log(`  ${cfg.nome} seed ${i}: FALLITO - ${e.message.slice(0, 80)}`);
      }
    }
    const media = tempi.reduce((a, b) => a + b, 0) / tempi.length;
    console.log(`${cfg.nome}: media=${media.toFixed(0)}ms, max=${Math.max(...tempi)}ms, tutti=[${tempi.join(',')}]`);
  }
})();
