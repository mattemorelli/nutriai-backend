// Verifica: dopo aver fatto funzionare il filtro famiglia in caricaPiatti e
// aver eliminato la mappa cucina->famiglia duplicata in sostituisci.js
// (ora legge FAMIGLIE_PER_CUCINA da genera.js), controllare che
// sostituisci.js restituisca 3 proposte del paese giusto su dieci casi reali.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva } = require('./genera');
const { trovaProposte } = require('./sostituisci');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const { assertUtenteDiTest } = require('./test-users');
assertUtenteDiTest(USER_ID);

const CASI = [
  { nome: 'onnivoro+italia',        diet: 'onnivoro',    paesi: ['italia'],       cucina: 'europea' },
  { nome: 'vegetariano+francia',    diet: 'vegetariano', paesi: ['francia'],      cucina: 'europea' },
  { nome: 'vegano+regno_unito',     diet: 'vegano',       paesi: ['regno_unito'], cucina: 'europea' },
  { nome: 'pescetariano+germania+regno_unito', diet: 'pescetariano', paesi: ['germania', 'regno_unito'], cucina: 'europea' },
  { nome: 'onnivoro+giappone',      diet: 'onnivoro',    paesi: ['giappone'],     cucina: 'asiatica' },
  { nome: 'vegetariano+messico',    diet: 'vegetariano', paesi: ['messico'],      cucina: 'sud_americana' },
  { nome: 'onnivoro+stati_uniti',   diet: 'onnivoro',    paesi: ['stati_uniti'],  cucina: 'usa' },
  { nome: 'pescetariano+spagna',    diet: 'pescetariano', paesi: ['spagna'],      cucina: 'europea' },
  { nome: 'vegano+argentina',       diet: 'vegano',       paesi: ['argentina'],   cucina: 'sud_americana' },
  { nome: 'onnivoro+australia',     diet: 'onnivoro',    paesi: ['australia'],    cucina: 'australiana' },
];

const GENERICO_DI = {
  italia: 'mediterraneo_generico', francia: 'mediterraneo_generico', spagna: 'mediterraneo_generico',
  germania: 'centro_nord_generico', regno_unito: 'centro_nord_generico',
  giappone: 'asia_generico', messico: 'latino_generico', argentina: 'latino_generico',
  stati_uniti: null, australia: 'mediterraneo_generico',
};

(async () => {
  let okCount = 0;
  for (const caso of CASI) {
    await supabase.from('users').update({
      diet: caso.diet, paesi: caso.paesi, cook_days: [1, 2, 3, 4, 5, 6, 7],
      lunch_away: false, evening_minutes: 45, household_size: 2,
    }).eq('id', USER_ID);
    await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
    await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: caso.cucina, rank: 1 }]);

    let planId = null;
    try {
      const r = await generaESalva(supabase, USER_ID, 555);
      planId = r.plan_id;

      const { data: items } = await supabase
        .from('plan_items').select('id, day_of_week, slot, dish_id')
        .eq('plan_id', planId).eq('slot', 'secondo').order('day_of_week').limit(1);
      if (!items || !items.length) { console.log(`${caso.nome}: nessuna riga 'secondo' da sostituire`); continue; }

      const proposta = await trovaProposte(supabase, USER_ID, items[0].id);
      const dishIds = proposta.proposte.map(p => p.dish_id);
      const { data: dettagli } = dishIds.length
        ? await supabase.from('dishes').select('id, name, paese, profilo, famiglia').in('id', dishIds)
        : { data: [] };
      const dettaglioPer = Object.fromEntries((dettagli || []).map(d => [d.id, d]));

      const famigliaAttesa = { europea: 'mediterranea', australiana: 'mediterranea', asiatica: 'asiatica', sud_americana: 'latina', usa: 'americana' }[caso.cucina];
      const righe = proposta.proposte.map(p => {
        const d = dettaglioPer[p.dish_id] || {};
        const famigliaOk = d.famiglia === famigliaAttesa;
        return `${p.nome} [paese=${d.paese}, famiglia=${d.famiglia}]${famigliaOk ? '' : '  <-- FAMIGLIA SBAGLIATA'}`;
      });

      const tutteOk = proposta.originale !== null && proposta.proposte.length === 3 &&
        proposta.proposte.every(p => (dettaglioPer[p.dish_id] || {}).famiglia === famigliaAttesa);
      if (tutteOk) okCount++;

      console.log(`\n${caso.nome}: originale="${proposta.originale}", ${proposta.proposte.length} proposte ${tutteOk ? 'OK' : 'PROBLEMA'}`);
      for (const riga of righe) console.log('   -', riga);
    } catch (e) {
      console.log(`${caso.nome}: ERRORE - ${e.message}`);
    } finally {
      if (planId) await supabase.from('plans').delete().eq('id', planId);
    }
  }
  console.log(`\n=== ${okCount}/${CASI.length} casi corretti (3 proposte, famiglia giusta) ===`);
})();
