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

const pastiBilanciabili = () => [
  pasto('primo', 300, 600, { protein: 12, salt: 0, satFat: 0, fibre: 0 }),
  pasto('secondo', 150, 400, { protein: 60, salt: 0, satFat: 0, fibre: 0 }),
];
const somma = (adattati, campo) => adattati.reduce((s, x) => s + (x.p.piatto[campo] || 0) * x.f, 0);

test('raggiunge le proteine con le porzioni, mantenendo calorie e ricette', () => {
  const pasti = pastiBilanciabili(), copia = structuredClone(pasti);
  const prima = adattaGiornata(pasti, 1000);
  const dopo = adattaGiornata(pasti, 1000, 90);
  assert.equal(somma(prima, 'protein'), 72);
  assert.ok(Math.abs(somma(dopo, 'protein') - 90) < 1e-7);
  assert.ok(Math.abs(somma(dopo, 'kcal') - somma(prima, 'kcal')) < 1e-7);
  assert.ok(dopo[0].f < prima[0].f && dopo[1].f > prima[1].f);
  assert.deepEqual(pasti, copia);
});

test('un target proteico assente, nullo o gia raggiunto non cambia le porzioni', () => {
  const pasti = pastiBilanciabili(), prima = adattaGiornata(pasti, 1000);
  for (const target of [undefined, null, 0, 50, 72]) {
    assert.deepEqual(adattaGiornata(pasti, 1000, target), prima);
  }
});

test('il recupero proteico si ferma al tetto del sale e dei saturi', () => {
  for (const [campo, valore, tetto] of [['salt', 4, 5], ['satFat', 10, 1000 * .1 / 9]]) {
    const pasti = pastiBilanciabili(); pasti[1].piatto[campo] = valore;
    const dopo = adattaGiornata(pasti, 1000, 90);
    assert.ok(somma(dopo, 'protein') > 72 && somma(dopo, 'protein') < 90);
    assert.ok(Math.abs(somma(dopo, campo) - tetto) < 1e-7);
    assert.ok(Math.abs(somma(dopo, 'kcal') - 1000) < 1e-7);
  }
});

test('non peggiora sale o saturi quando sono gia oltre il tetto', () => {
  for (const [campo, valore] of [['salt', 6], ['satFat', 15]]) {
    const pasti = pastiBilanciabili(); pasti[1].piatto[campo] = valore;
    assert.deepEqual(adattaGiornata(pasti, 1000, 90), adattaGiornata(pasti, 1000));
  }
});

test('conserva il pavimento di fibra o non peggiora un deficit gia presente', () => {
  for (const fibra of [30, 20]) {
    const pasti = pastiBilanciabili(); pasti[0].piatto.fibre = fibra;
    const dopo = adattaGiornata(pasti, 1000, 90);
    assert.ok(somma(dopo, 'fibre') >= Math.min(25, fibra) - 1e-7);
    if (fibra === 30) assert.ok(somma(dopo, 'protein') > 72);
    else assert.deepEqual(dopo, adattaGiornata(pasti, 1000));
  }
});

test('anche differenze minime di sale e fibra rispettano un vincolo gia saturo', () => {
  for (const [campo, valori] of [['salt', [3, 2.00000004]], ['fibre', [15, 9.99999996]]]) {
    const pasti = pastiBilanciabili(); pasti.forEach((p, i) => { p.piatto[campo] = valori[i]; });
    const prima = adattaGiornata(pasti, 1000), dopo = adattaGiornata(pasti, 1000, 90);
    const differenza = somma(dopo, campo) - somma(prima, campo);
    assert.ok(campo === 'salt' ? differenza <= 1e-12 : differenza >= -1e-12);
  }
});

test('un target proteico impossibile conserva i limiti e un risultato finito', () => {
  const pasti = pastiBilanciabili(), dopo = adattaGiornata(pasti, 1000, 200);
  assert.ok(somma(dopo, 'protein') < 200);
  assert.ok(Math.abs(somma(dopo, 'kcal') - 1000) < 1e-7);
  for (const { p, f } of dopo) {
    const [min, max] = limitiDi(p, 1000);
    assert.ok(Number.isFinite(f) && f >= min - 1e-7 && f <= max + 1e-7);
  }
});

test('il salvataggio usa i fattori bilanciati con lo stesso target proteico', () => {
  const pasti = pastiBilanciabili(); pasti[1].bloccato = true; pasti[1].avanzi = true;
  const adattati = adattaGiornata(pasti, 1000, 90);
  const righe = righePiano([{ giorno: 1, pasti }], 1000, 90);
  assert.ok(Math.abs(righe.reduce((s, r) => s + r.protein_g, 0) - 90) <= .1);
  for (const [i, { p, f }] of adattati.entries()) {
    assert.equal(righe[i].portion_g, Math.round(p.piatto.grams * f));
    assert.equal(righe[i].protein_g, Number((p.piatto.protein * f).toFixed(1)));
    assert.equal(righe[i].dish_id, p.piatto.id);
    assert.equal(righe[i].bloccato, Boolean(p.bloccato));
    assert.equal(righe[i].avanzi, Boolean(p.avanzi));
  }
});

test('300 giornate sintetiche: piu proteine senza cambiare calorie o violare i limiti', () => {
  let seed = 2026;
  const rng = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  for (let n = 0; n < 300; n++) {
    const target = 1400 + rng() * 2000;
    const pasti = ['colazione', 'primo', 'secondo', 'contorno', 'spuntino'].map(slot =>
      pasto(slot, 100 + rng() * 500, 150 + rng() * 600, {
        protein: rng() * 50, salt: rng() * 2, satFat: rng() * 8, fibre: rng() * 12,
      }));
    const prima = adattaGiornata(pasti, target);
    const dopo = adattaGiornata(pasti, target, 150);
    const kcal = somma(prima, 'kcal');
    assert.ok(Math.abs(somma(dopo, 'kcal') - kcal) < 1e-6);
    assert.ok(somma(dopo, 'protein') >= somma(prima, 'protein') - 1e-6);
    assert.ok(somma(dopo, 'salt') <= Math.max(5, somma(prima, 'salt')) + 1e-6);
    assert.ok(somma(dopo, 'satFat') <= Math.max(kcal * .1 / 9, somma(prima, 'satFat')) + 1e-6);
    assert.ok(somma(dopo, 'fibre') >= Math.min(Math.max(25, kcal * .014), somma(prima, 'fibre')) - 1e-6);
    for (const { p, f } of dopo) {
      const [min, max] = limitiDi(p, target);
      assert.ok(Number.isFinite(f) && f >= min - 1e-6 && f <= max + 1e-6);
    }
  }
});
