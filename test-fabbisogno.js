// Errori di lettura e assenza legittima di allenamenti sono casi diversi.
// Client in memoria: nessuna connessione o scrittura sul database reale.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { calcolaESalvaTarget } = require('./fabbisogno');

function clientFinto({ erroreTabella, legacy = false, sessioni = [] } = {}) {
  const scritture = [];
  const righe = {
    users: { sex: 'M', birth_year: new Date().getFullYear() - 30, height_cm: 175,
      goal: 'mantenimento', occupation_level: legacy ? null : 'sedentario' },
    body_measurements: { weight_kg: 78, body_fat_pct: null },
    training_sessions: sessioni,
    activity_periods: { pal: 1.5 },
  };
  return {
    scritture,
    from(tabella) {
      const risultato = tabella === erroreTabella
        ? { data: null, error: { message: 'rete interrotta' } }
        : { data: righe[tabella], error: null };
      const q = {
        select: () => q, eq: () => q, order: () => q, limit: () => q,
        single: () => Promise.resolve(risultato), maybeSingle: () => Promise.resolve(risultato),
        then: (resolve, reject) => Promise.resolve(risultato).then(resolve, reject),
        insert: async r => {
          assert.equal(tabella, 'energy_targets');
          scritture.push(r);
          return { error: null };
        },
      };
      return q;
    },
  };
}

for (const tabella of ['users', 'body_measurements', 'training_sessions', 'activity_periods']) {
  test(`errore ${tabella}: blocca il calcolo prima di salvare un target`, async () => {
    const c = clientFinto({ erroreTabella: tabella, legacy: tabella === 'activity_periods' });
    await assert.rejects(calcolaESalvaTarget(c, 'test'), new RegExp('lettura ' + tabella));
    assert.equal(c.scritture.length, 0);
  });
}

test('zero allenamenti e lettura riuscita: mantiene il calcolo attuale', async () => {
  const c = clientFinto();
  const r = await calcolaESalvaTarget(c, 'test');
  assert.equal(r.kcal, 2593);
  assert.equal(r.tdee_predetto, 2593);
  assert.equal(c.scritture.length, 1);
  assert.equal(c.scritture[0], r);
});

test('allenamenti presenti: contribuiscono al target', async () => {
  const c = clientFinto({ sessioni: [{ activity: 'pesi', intensity: 'moderata', minutes_per_week: 180 }] });
  const r = await calcolaESalvaTarget(c, 'test');
  assert.ok(r.kcal > 2593);
  assert.equal(r.protein_g_min, 125);
});

test('profilo legacy con PAL letto correttamente: mantiene la formula esistente', async () => {
  const c = clientFinto({ legacy: true });
  const r = await calcolaESalvaTarget(c, 'test');
  assert.equal(r.kcal, 2593);
  assert.match(r.notes, /pal_legacy/);
});
