require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const N = 300;

const CONFIG = [
  { nome: 'onnivoro+Australia',    diet: 'onnivoro',    paesi: ['australia'], cucina: 'australiana' },
  { nome: 'onnivoro+Messico',      diet: 'onnivoro',    paesi: ['messico'],   cucina: 'sud_americana' },
  { nome: 'onnivoro+Argentina',    diet: 'onnivoro',    paesi: ['argentina'], cucina: 'sud_americana' },
  { nome: 'vegetariano+Francia',   diet: 'vegetariano', paesi: ['francia'],   cucina: 'europea' },
];

async function impostaConfig(cfg) {
  await supabase.from('users').update({
    diet: cfg.diet, paesi: cfg.paesi, cook_days: [1,2,3,4,5,6,7],
    lunch_away: false, evening_minutes: 45, household_size: 2,
  }).eq('id', USER_ID);
  await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
  await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: cfg.cucina, rank: 1 }]);
}

(async () => {
  const riepilogo = [];
  for (const cfg of CONFIG) {
    await impostaConfig(cfg);
    let ok = 0, fail = 0;
    const cause = {};
    for (let i = 0; i < N; i++) {
      const seed = Math.floor(Math.random() * 4294967296);
      try {
        await generaESalva(supabase, USER_ID, seed);
        ok++;
      } catch (e) {
        fail++;
        const chiave = e.message.slice(0, 80);
        cause[chiave] = (cause[chiave] || 0) + 1;
      }
    }
    const percentuale = ((fail / N) * 100).toFixed(1);
    console.log(`${cfg.nome}: ${fail}/${N} falliti (${percentuale}%)`);
    if (Object.keys(cause).length) console.log('  cause:', cause);
    riepilogo.push({ nome: cfg.nome, ok, fail, percentuale, cause });
  }

  console.log('\n=== Riepilogo finale (tasso di fallimento reale, N=' + N + ' per configurazione) ===');
  for (const r of riepilogo) console.log(`  ${r.nome}: ${r.percentuale}% di fallimento (${r.fail}/${N})`);

  require('fs').writeFileSync(
    '/private/tmp/claude-501/-Users-matte-Progetti-nutriai-backend/ccb3e334-56d9-45e1-8546-79eb96660e29/scratchpad/passo2b-risultati.json',
    JSON.stringify(riepilogo, null, 2)
  );
})();
