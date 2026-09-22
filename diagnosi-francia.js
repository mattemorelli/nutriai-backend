require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { caricaPiatti, generaESalva } = require('./genera');

const LIMITE_FERIALE = 45;
const PAESE = 'francia';
const GENERICO = 'mediterraneo_generico';
const FAMIGLIA = ['mediterranea'];
const CATEGORIE_DIETA = { vegetariano: ['carne_rossa', 'carne_bianca', 'pesce', 'crostacei'] };

async function insiemeVietato(dieta) {
  const vietati = new Set();
  for (const codice of (CATEGORIE_DIETA[dieta] || [])) {
    const { data } = await supabase.from('categorie_alimenti').select('food_id').eq('categoria', codice);
    for (const r of data) vietati.add(r.food_id);
  }
  return vietati;
}

async function ammessoPerTutti(piatti, vietati) {
  const ids = piatti.map(p => p.id);
  let ing = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase.from('dish_ingredients').select('dish_id, food_id').in('dish_id', ids.slice(i, i + 200));
    ing = ing.concat(data || []);
  }
  const ingredientiPer = {};
  for (const i of ing) { if (!ingredientiPer[i.dish_id]) ingredientiPer[i.dish_id] = []; ingredientiPer[i.dish_id].push(i.food_id); }
  const ammesso = {};
  for (const p of piatti) {
    const lista = ingredientiPer[p.id] || [];
    ammesso[p.id] = !lista.some(fid => vietati.has(fid));
  }
  return { ammesso, ingredientiPer };
}

(async () => {
  const piatti = await caricaPiatti(supabase, FAMIGLIA);
  const vietatiVeg = await insiemeVietato('vegetariano');
  const { ammesso, ingredientiPer } = await ammessoPerTutti(piatti, vietatiVeg);

  const paesiRilevanti = new Set([PAESE, GENERICO]);

  for (const dietaLabel of ['onnivoro (nessuna esclusione)', 'vegetariano']) {
    const vietati = dietaLabel.startsWith('vegetariano') ? vietatiVeg : new Set();
    const secondiUtilizzabili = piatti.filter(p =>
      p.meal_slot === 'secondo' && p.profilo !== 'neutro' &&
      (p.prep_min || 30) <= LIMITE_FERIALE && (p.tecnica || 'semplice') === 'semplice' &&
      paesiRilevanti.has(p.paese) &&
      (dietaLabel.startsWith('vegetariano') ? ammesso[p.id] : true)
    );
    const conIngredienti = secondiUtilizzabili.filter(p => (ingredientiPer[p.id] || []).length > 0);
    const senzaIngredienti = secondiUtilizzabili.filter(p => !(ingredientiPer[p.id] || []).length);

    console.log(`\n=== Francia, dieta: ${dietaLabel} ===`);
    console.log('secondi ammessi per la dieta (francia+generico):', secondiUtilizzabili.length);
    console.log('  di cui CON ingredienti registrati:', conIngredienti.length);
    console.log('  di cui SENZA ingredienti (i 15 rotti):', senzaIngredienti.length);

    const perProfilo = {};
    for (const p of secondiUtilizzabili) perProfilo[p.profilo] = (perProfilo[p.profilo] || 0) + 1;
    console.log('  per profilo:', perProfilo);
  }

  // --- test: e se togliessi i piatti senza ingredienti dalla selezione? ---
  console.log('\n=== Test: generazione vegetariano+Francia CON i piatti rotti esclusi a monte ===');
  const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
  const { assertUtenteDiTest } = require('./test-users');
  assertUtenteDiTest(USER_ID);
  await supabase.from('users').update({
    diet: 'vegetariano', paesi: [PAESE], cook_days: [1,2,3,4,5,6,7],
    lunch_away: false, evening_minutes: 45, household_size: 2,
  }).eq('id', USER_ID);
  await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
  await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: 'europea', rank: 1 }]);

  // Piatti francesi senza ingredienti: li rendo temporaneamente "invisibili"
  // cambiando il loro meal_slot a un valore innocuo, SOLO per la durata del
  // test, poi lo rimetto a posto. Piu' sicuro che toccare le righe vere.
  const idsRotti = piatti.filter(p => p.paese === 'francia' && !(ingredientiPer[p.id] || []).length).map(p => p.id);
  console.log('piatti rotti da nascondere per il test:', idsRotti.length);

  await supabase.from('dishes').update({ meal_slot: 'ESCLUSO_TEST_TEMP' }).in('id', idsRotti);
  try {
    const r = await generaESalva(supabase, USER_ID);
    console.log('RISULTATO CON I ROTTI ESCLUSI: SUCCESSO ->', r.plan_id);
  } catch (e) {
    console.log('RISULTATO CON I ROTTI ESCLUSI: FALLITO ->', e.message);
  } finally {
    // ripristino SEMPRE, comunque vada il test
    for (const p of piatti.filter(x => idsRotti.includes(x.id))) {
      await supabase.from('dishes').update({ meal_slot: p.meal_slot }).eq('id', p.id);
    }
    console.log('meal_slot originali ripristinati per', idsRotti.length, 'piatti');
  }
})();
