require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva } = require('./genera');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';

// Batch B: mappare dove fallisce davvero (dieta x paese), e prendere altre
// settimane riuscite per l'analisi di coerenza.
const CONFIG = [
  { diet: 'vegano',        paesi: ['italia'] },
  { diet: 'vegetariano',   paesi: ['italia'] },
  { diet: 'vegetariano',   paesi: ['spagna'] },
  { diet: 'vegano',        paesi: ['francia'] },
  { diet: 'onnivoro',      paesi: ['germania'] },
  { diet: 'onnivoro',      paesi: ['regno_unito'] },
  { diet: 'pescetariano',  paesi: ['portogallo'] },
  { diet: 'pescetariano',  paesi: ['australia'] },
  { diet: 'vegetariano',   paesi: ['grecia'] },
  { diet: 'vegano',        paesi: ['portogallo'] },
  { diet: 'onnivoro',      paesi: ['messico'] },
  { diet: 'onnivoro',      paesi: ['argentina'] },
  { diet: 'pescetariano',  paesi: ['messico'] },
  { diet: 'pescetariano',  paesi: ['francia'] },
  { diet: 'onnivoro',      paesi: ['stati_uniti'] },
];

(async () => {
  const risultati = [];
  for (let i = 0; i < CONFIG.length; i++) {
    const cfg = CONFIG[i];
    const cook_days = cfg.cook_days || [1,2,3,4,5,6,7];
    await supabase.from('users').update({
      diet: cfg.diet, paesi: cfg.paesi, cook_days,
      lunch_away: false, evening_minutes: 45, household_size: 2,
    }).eq('id', USER_ID);

    try {
      const r = await generaESalva(supabase, USER_ID);
      console.log(cfg.diet, cfg.paesi.join('+'), '-> OK', r.plan_id, r.giorni_conformi);
      risultati.push({ ...cfg, cook_days, plan_id: r.plan_id });
    } catch (e) {
      console.error(cfg.diet, cfg.paesi.join('+'), 'ERRORE:', e.message);
      risultati.push({ ...cfg, cook_days, errore: e.message });
    }
  }
  const precedenti = JSON.parse(require('fs').readFileSync('/tmp/piani-20.json', 'utf8'));
  require('fs').writeFileSync('/tmp/piani-20b.json', JSON.stringify(precedenti.concat(risultati), null, 2));
  console.log('\nSalvato /tmp/piani-20b.json, totale voci:', precedenti.length + risultati.length);
})();
