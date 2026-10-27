const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { preservaRuoliDelPasto } = require('./modelli-pasto');

function contesto() {
  const originale = { id: 'unico', name: 'Piatto unico', meal_slot: 'primo', health_score: 6.5,
    ruoli_coperti: ['proteina_principale', 'base_amidacea', 'verdura'], paese: 'italia', prep_min: 20 };
  const incompleto = { id: 'pasta', name: 'Pasta', meal_slot: 'primo', health_score: 8,
    ruoli_coperti: ['base_amidacea'], paese: 'italia', prep_min: 20, kcal: 400, grams: 300 };
  const completo = { ...originale, id: 'altro-unico', health_score: 8, kcal: 500, grams: 350 };
  const piatti = [originale, incompleto, completo];
  const dataset = { plans: [{ id: 'piano', user_id: 'utente' }],
    plan_items: [{ id: 'riga', plan_id: 'piano', day_of_week: 1, meal: 'pranzo', slot: 'primo', dish_id: 'unico', kcal: 500 }],
    users: [{ id: 'utente', diet: 'onnivoro', evening_minutes: 35, paesi: ['italia'] }],
    user_cuisine_preferences: [], dish_ingredients: [], dishes: piatti };
  let scritture = 0;
  const supabase = { from(tabella) {
    assert.ok(Object.hasOwn(dataset, tabella));
    const filtri = [];
    const dati = () => dataset[tabella].filter(r => filtri.every(f => f(r)));
    const q = { select: () => q, eq: (k, v) => { filtri.push(r => r[k] === v); return q; },
      neq: (k, v) => { filtri.push(r => r[k] !== v); return q; },
      single: async () => ({ data: dati()[0], error: null }), maybeSingle: async () => ({ data: dati()[0], error: null }),
      then: (resolve, reject) => Promise.resolve({ data: dati(), error: null }).then(resolve, reject),
      update: () => { scritture++; return q; } };
    return q;
  } };
  const deps = { caricaPiatti: async () => [incompleto, completo],
    caricaPiattiPerId: async (_, ids) => piatti.filter(p => ids.includes(p.id)),
    FAMIGLIE_PER_CUCINA: { europea: ['mediterranea'] }, GENERICI: [],
    caricaVincoli: async () => ({ ammesso: () => true, gradito: () => true, categorieVietate: new Set(), foodIdVietati: new Set() }),
    caricaEsiti: async () => ({ rifiutato: () => false }), accompagnaBene: () => true,
    sostitutoSenzaGlutineNonRichiesto: () => false };
  const m = { exports: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('./sostituisci'), 'utf8'), {
    module: m, console, require: name => {
      if (name === './genera') return deps;
      assert.equal(name, './modelli-pasto'); return { preservaRuoliDelPasto };
    },
  });
  return { api: m.exports, supabase, scritture: () => scritture };
}

test('le proposte preservano il piatto unico anche se l originale e sotto la soglia del pool', async () => {
  const c = contesto(); const r = await c.api.trovaProposte(c.supabase, 'utente', 'riga');
  assert.deepEqual(Array.from(r.proposte, p => p.dish_id), ['altro-unico']);
});

test('il client non puo aggirare le proposte e togliere proteine o verdure prima della scrittura', async () => {
  const c = contesto();
  await assert.rejects(c.api.applicaSostituzione(c.supabase, 'utente', 'riga', 'pasta', 300), /componente del pasto/);
  assert.equal(c.scritture(), 0);
});
