require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const { assertUtenteDiTest } = require('./test-users');
assertUtenteDiTest(USER_ID);
const N = 300;

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
  const riepilogoFinale = [];
  const tuttiITempi = [];

  for (const cfg of CONFIG) {
    await supabase.from('users').update({
      diet: cfg.diet, paesi: cfg.paesi, cook_days: [1,2,3,4,5,6,7],
      lunch_away: false, evening_minutes: 45, household_size: 2,
    }).eq('id', USER_ID);
    await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
    await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: cfg.cucina, rank: 1 }]);

    let ok = 0, fail = 0;
    const cause = {};
    const gradini = {};
    const tempi = [];

    for (let i = 0; i < N; i++) {
      const seed = 9000000 + i;
      const t0 = Date.now();
      try {
        const r = await generaESalva(supabase, USER_ID, seed);
        const dt = Date.now() - t0;
        tempi.push(dt);
        tuttiITempi.push(dt);
        ok++;
        gradini[r.gradino] = (gradini[r.gradino] || 0) + 1;
        await supabase.from('plans').delete().eq('id', r.plan_id);
      } catch (e) {
        const dt = Date.now() - t0;
        tempi.push(dt);
        tuttiITempi.push(dt);
        fail++;
        const chiave = e.message.slice(0, 80);
        cause[chiave] = (cause[chiave] || 0) + 1;
      }
    }
    const percentuale = ((fail / N) * 100).toFixed(1);
    const media = tempi.reduce((a, b) => a + b, 0) / tempi.length;
    console.log(`${cfg.nome}: ${fail}/${N} falliti (${percentuale}%), gradini=${JSON.stringify(gradini)}, tempo medio=${media.toFixed(0)}ms, max=${Math.max(...tempi)}ms`);
    if (Object.keys(cause).length) console.log('  cause fallimento:', cause);
    riepilogoFinale.push({ nome: cfg.nome, ok, fail, percentuale, gradini, tempoMedio: media, tempoMax: Math.max(...tempi) });
  }

  const mediaGlobale = tuttiITempi.reduce((a, b) => a + b, 0) / tuttiITempi.length;
  const maxGlobale = Math.max(...tuttiITempi);
  console.log('\n=== Riepilogo finale (N=' + N + ' per configurazione, ' + CONFIG.length + ' configurazioni) ===');
  for (const r of riepilogoFinale) console.log(`  ${r.nome}: ${r.percentuale}% fallimento, gradini=${JSON.stringify(r.gradini)}`);
  console.log(`\nTempo medio globale: ${mediaGlobale.toFixed(0)}ms, peggiore: ${maxGlobale}ms, su ${tuttiITempi.length} generazioni totali`);

  require('fs').writeFileSync(
    '/private/tmp/claude-501/-Users-matte-Progetti-nutriai-backend/ccb3e334-56d9-45e1-8546-79eb96660e29/scratchpad/passoC-risultati.json',
    JSON.stringify({ riepilogoFinale, mediaGlobale, maxGlobale }, null, 2)
  );
})();
