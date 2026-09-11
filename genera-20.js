require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva } = require('./genera');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';

// Stessa mappa paese->cucina di PAESI_PER_CUCINA in Onboarding.js: il primo
// giro di generazioni aveva lasciato user_cuisine_preferences fermo su
// "europea" da una sessione precedente, quindi il paese scelto non veniva
// mai davvero caricato. Qui si imposta anche quello, come farebbe l'app vera.
const CUCINA_DI = {
  italia: 'europea', francia: 'europea', spagna: 'europea', grecia: 'europea',
  germania: 'europea', regno_unito: 'europea', portogallo: 'europea',
  stati_uniti: 'usa', messico: 'sud_americana', argentina: 'sud_americana',
  australia: 'australiana',
};

const CONFIG = [
  { diet: 'onnivoro',      paesi: ['italia'] },
  { diet: 'vegetariano',   paesi: ['francia'] },
  { diet: 'vegano',        paesi: ['spagna'] },
  { diet: 'pescetariano',  paesi: ['grecia'] },
  { diet: 'onnivoro',      paesi: ['portogallo'] },
  { diet: 'vegetariano',   paesi: ['germania'] },
  { diet: 'vegano',        paesi: ['regno_unito'] },
  { diet: 'pescetariano',  paesi: ['stati_uniti'] },
  { diet: 'onnivoro',      paesi: ['australia'] },
  { diet: 'vegetariano',   paesi: ['messico'] },
  { diet: 'vegano',        paesi: ['argentina'] },
  { diet: 'pescetariano',  paesi: ['italia', 'francia'], cook_days: [1,2,3,4,5] },
  { diet: 'onnivoro',      paesi: ['spagna', 'grecia'], cook_days: [1,2,3,4,5] },
  { diet: 'vegetariano',   paesi: ['portogallo', 'germania'], cook_days: [1,2,3,4,5] },
  { diet: 'vegano',        paesi: ['regno_unito', 'stati_uniti'], cook_days: [1,3,5,7] },
  { diet: 'pescetariano',  paesi: ['australia', 'messico'], cook_days: [1,3,5,7] },
  { diet: 'onnivoro',      paesi: ['argentina', 'italia'], cook_days: [1,3,5,7] },
  { diet: 'vegetariano',   paesi: ['francia', 'spagna'] },
  { diet: 'vegano',        paesi: ['grecia', 'portogallo'] },
  { diet: 'pescetariano',  paesi: ['germania', 'regno_unito'] },
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

    // Una riga di preferenza per ogni cucina distinta coinvolta dai paesi scelti.
    const cucine = [...new Set(cfg.paesi.map((p) => CUCINA_DI[p]))];
    await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
    await supabase.from('user_cuisine_preferences').insert(
      cucine.map((c, idx) => ({ user_id: USER_ID, cucina: c, rank: idx + 1 }))
    );

    try {
      const r = await generaESalva(supabase, USER_ID);
      console.log(i + 1, cfg.diet, cfg.paesi.join('+'), '-> OK', r.plan_id, r.giorni_conformi);
      risultati.push({ i: i + 1, ...cfg, cook_days, plan_id: r.plan_id });
    } catch (e) {
      console.error(i + 1, cfg.diet, cfg.paesi.join('+'), 'ERRORE:', e.message);
      risultati.push({ i: i + 1, ...cfg, cook_days, errore: e.message });
    }
  }
  require('fs').writeFileSync('/tmp/piani-20.json', JSON.stringify(risultati, null, 2));
  console.log('\nSalvato /tmp/piani-20.json');
})();
