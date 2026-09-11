require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';

async function leggiPiano(planId) {
  const { data } = await supabase
    .from('plan_items')
    .select('day_of_week, meal, slot, dish_id, portion_g')
    .eq('plan_id', planId)
    .order('day_of_week').order('meal').order('slot');
  return JSON.stringify(data);
}

(async () => {
  await supabase.from('users').update({
    diet: 'onnivoro', paesi: ['australia'], cook_days: [1,2,3,4,5,6,7],
    lunch_away: false, evening_minutes: 45, household_size: 2,
  }).eq('id', USER_ID);
  await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
  await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: 'australiana', rank: 1 }]);

  console.log('=== Senza seed esplicito: deve funzionare comunque e restituire un seed ===');
  const r0 = await generaESalva(supabase, USER_ID);
  console.log('OK, seed generato automaticamente:', r0.seed, 'plan_id:', r0.plan_id);

  console.log('\n=== Stesso seed passato due volte: i due piani devono essere identici ===');
  const SEED_FISSO = 123456789;
  const rA = await generaESalva(supabase, USER_ID, SEED_FISSO);
  const rB = await generaESalva(supabase, USER_ID, SEED_FISSO);
  console.log('run A: seed=', rA.seed, 'giorni_conformi=', rA.giorni_conformi, 'plan_id=', rA.plan_id);
  console.log('run B: seed=', rB.seed, 'giorni_conformi=', rB.giorni_conformi, 'plan_id=', rB.plan_id);

  const pianoA = await leggiPiano(rA.plan_id);
  const pianoB = await leggiPiano(rB.plan_id);
  console.log('piani identici (stessi pasti/piatti/porzioni)?', pianoA === pianoB);

  console.log('\n=== Seed diverso: deve (quasi sempre) dare un piano diverso ===');
  const rC = await generaESalva(supabase, USER_ID, SEED_FISSO + 1);
  const pianoC = await leggiPiano(rC.plan_id);
  console.log('piano con seed diverso uguale al piano A?', pianoC === pianoA, '(atteso: false)');
})();
