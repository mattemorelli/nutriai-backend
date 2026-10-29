// Errori di lettura e assenza legittima di allenamenti sono casi diversi.
// Client in memoria: nessuna connessione o scrittura sul database reale.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { calcolaESalvaTarget, preparaTarget } = require('./fabbisogno');

function clientFinto({ erroreTabella, legacy = false, sessioni = [], profilo = {}, misura = {}, pal = 1.5 } = {}) {
  const scritture = [];
  const righe = {
    users: { sex: 'M', birth_year: new Date().getFullYear() - 30, height_cm: 175,
      goal: 'mantenimento', occupation_level: legacy ? null : 'sedentario', ...profilo },
    body_measurements: { weight_kg: 78, body_fat_pct: null, ...misura },
    training_sessions: sessioni,
    activity_periods: { pal },
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

for (const [nome, opzioni] of [
 ['sport sconosciuto', {sessioni:[{activity:'sconosciuto',intensity:'moderata',minutes_per_week:120}]}],
 ['intensita sconosciuta', {sessioni:[{activity:'pesi',intensity:'assurda',minutes_per_week:120}]}],
 ['durata frazionaria', {sessioni:[{activity:'pesi',intensity:'moderata',minutes_per_week:90.5}]}],
 ['durata negativa', {sessioni:[{activity:'pesi',intensity:'moderata',minutes_per_week:-5}]}],
 ['durata eccessiva', {sessioni:[{activity:'pesi',intensity:'moderata',minutes_per_week:1201}]}],
 ['durata vuota', {sessioni:[{activity:'pesi',intensity:'moderata',minutes_per_week:''}]}],
 ['lavoro sconosciuto', {profilo:{occupation_level:'altro'}}],
 ['sesso assente', {profilo:{sex:null}}],
 ['eta non supportata', {profilo:{birth_year:new Date().getFullYear()-17}}],
 ['massa grassa ignorata prima', {misura:{body_fat_pct:65}}],
 ['massa grassa zero', {misura:{body_fat_pct:0}}],
 ['massa grassa non numerica', {misura:{body_fat_pct:'abc'}}],
 ['PAL invalido', {legacy:true,pal:0}],
 ['dimagrimento sottopeso', {profilo:{goal:'dimagrimento',height_cm:190},misura:{weight_kg:50}}],
]) test(`${nome}: nessun target viene salvato`,async()=>{
 const c=clientFinto(opzioni);await assert.rejects(calcolaESalvaTarget(c,'test'));assert.equal(c.scritture.length,0);
});
test('durate numeriche da database: si sommano come numeri, non come stringhe',async()=>{
 const c=clientFinto({sessioni:[40,40].map(n=>({activity:'pesi',intensity:'moderata',minutes_per_week:String(n)}))});
 const r=await calcolaESalvaTarget(c,'test');assert.equal(r.protein_g_min,109);
});
test('anteprima cambio peso: nuovo target senza scrivere',async()=>{
 const c=clientFinto();const r=await preparaTarget(c,'test',{misura:{weight_kg:85}});
 assert.ok(r.kcal>2593);assert.equal(c.scritture.length,0);
});
test('anteprima sola altezza: verifica il dimagrimento gia salvato',async()=>{
 const c=clientFinto({profilo:{goal:'dimagrimento'},misura:{weight_kg:60}});
 await assert.rejects(preparaTarget(c,'test',{profilo:{height_cm:190}}),/obiettivo_non_adatto/);assert.equal(c.scritture.length,0);
});
test('massa grassa supportata usa il metodo dichiarato',async()=>{
 const c=clientFinto({misura:{body_fat_pct:20}});const r=await calcolaESalvaTarget(c,'test');assert.match(r.notes,/katch_mcardle/);assert.equal(r.confidence,'media');
});
