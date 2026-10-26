// Regressioni delle porzioni finali: niente rete o scritture sul database.
// Usa gli stessi limiti e lo stesso serializzatore del salvataggio reale.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { adattaGiornata, limitiDi, righePiano } = require('./genera');

function pasto(slot, grams, kcal, extra = {}) {
  return { meal: slot === 'secondo' ? 'cena' : slot === 'primo' ? 'pranzo' : slot, slot,
    piatto: { id: slot, grams, kcal, protein: 20, satFat: 1.2, fibre: 4.1, salt: 0.35, ...extra } };
}
function verificaLimiti(pasti, target) {
  const adattati = adattaGiornata(pasti, target);
  for (const { p, f } of adattati) {
    const [min, max] = limitiDi(p, target);
    assert.ok(Number.isFinite(f) && f >= min - 1e-10 && f <= max + 1e-10,
      `${p.slot}: ${p.piatto.grams * f} g fuori da [${min * p.piatto.grams}, ${max * p.piatto.grams}]`);
  }
  return adattati;
}

test('il tetto vale anche quando le calorie base coincidono col target', () => {
  const p = pasto('secondo', 700, 1000);
  const [r] = verificaLimiti([p], 1000);
  assert.ok(r.f * 700 <= 245 + 1e-9);
});

test('il tetto vale nella tolleranza di 40 kcal e senza spazio per aumentare', () => {
  for (const target of [980, 1020, 1050, 1500]) verificaLimiti([pasto('secondo', 700, 1000)], target);
});

test('le calorie tolte alla portata troppo grande passano alle altre entro i limiti', () => {
  const pasti = [pasto('secondo', 700, 600), pasto('colazione', 100, 400), pasto('spuntino', 100, 300)];
  const adattati = verificaLimiti(pasti, 1200);
  const kcal = adattati.reduce((s, x) => s + x.p.piatto.kcal * x.f, 0);
  assert.ok(Math.abs(kcal - 1200) < 40);
  assert.ok(adattati[0].f < 1);
  assert.ok(adattati.slice(1).some(x => x.f > 1));
});

test('un target irraggiungibile non autorizza porzioni oltre il massimo o sotto il minimo', () => {
  const pasti = [pasto('secondo', 400, 500), pasto('primo', 500, 700)];
  for (const target of [100, 500, 5000, 12000]) verificaLimiti(pasti, target);
});

test('il tetto sulla frutta secca vale anche se la ricetta base lo supera', () => {
  const p = pasto('spuntino', 300, 1200, { grammiFruttaSecca: 100 });
  const [r] = verificaLimiti([p], 1200);
  assert.ok(r.f * 100 <= 28 + 1e-9);
});

test('scalare non cambia ricette, ingredienti o flag dei piatti bloccati', () => {
  const p = { ...pasto('secondo', 700, 1000), bloccato: true, avanzi: true };
  p.piatto.ingredienti = [{ food_id: 'esempio', grams: 700 }];
  const prima = structuredClone(p);
  verificaLimiti([p], 1200);
  assert.deepEqual(p, prima);
  const [r] = righePiano([{ giorno: 3, pasti: [p] }], 1200);
  assert.equal(r.dish_id, p.piatto.id);
  assert.equal(r.bloccato, true);
  assert.equal(r.avanzi, true);
  assert.equal(r.day_of_week, 3);
  assert.equal('plan_id' in r, false);
});

test('i valori finali arrotondati restano coerenti con il fattore di porzione', () => {
  const p = pasto('secondo', 700, 1000);
  const [{ f }] = adattaGiornata([p], 1200);
  const [r] = righePiano([{ giorno: 1, pasti: [p] }], 1200);
  assert.equal(r.portion_g, Math.round(700 * f));
  assert.equal(r.kcal, Math.round(1000 * f));
  assert.equal(r.protein_g, Number((20 * f).toFixed(1)));
  assert.equal(r.salt_g, Number((0.35 * f).toFixed(2)));
});

test('200 combinazioni di ricette e target rispettano sempre entrambi i limiti', () => {
  for (let grams = 100; grams <= 800; grams += 100) {
    for (let kcal = 200; kcal <= 1000; kcal += 200) {
      for (const target of [1200, 1600, 2000, 2800, 3600]) {
        verificaLimiti([pasto('secondo', grams, kcal), pasto('colazione', 120, 600), pasto('primo', 450, 600)], target);
      }
    }
  }
});
