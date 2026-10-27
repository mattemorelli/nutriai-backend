const assert = require('node:assert/strict');
const { test } = require('node:test');
const { adattaGiornata, accompagnaBene } = require('./genera');
const { miglioraModelliPasto, contaGruppi, preservaRuoliDelPasto } = require('./modelli-pasto');
const P = 'proteina_principale', A = 'base_amidacea', V = 'verdura';
function dish(id, slot, kcal, protein, roles, extra = {}) {
  return { id, name: id, meal_slot: slot, grams: 200, kcal, protein, fibre: 8, salt: .1, satFat: .5,
    prep_min: 10, health_score: 8, principale: id, ruoli_coperti: roles, amidoReale: roles.includes(A), ...extra };
}
const row = (meal, p, extra = {}) => ({ meal, slot: p.meal_slot, piatto: p, ...extra });
function fixture() {
  const week = [{ giorno: 1, pasti: [
    row('colazione', dish('colazione', 'colazione', 400, 15, [A], { grams: 200 })),
    row('pranzo', dish('pasta', 'primo', 400, 12, [A], { grams: 300 })),
    row('pranzo', dish('verdure-pranzo', 'contorno', 100, 2, [V])),
    row('cena', dish('pesce', 'secondo', 400, 25, [P], { gruppo: 'pesce', grams: 180 })),
    row('cena', dish('verdure-cena', 'contorno', 100, 2, [V])),
    row('cena', dish('pane', 'contorno', 200, 5, [A], { grams: 80, base_amidacea: true })),
  ] }];
  const unico = dish('unico', 'primo', 500, 55, [P, A, V], { grams: 350, gruppo: 'legumi', fibre: 18 });
  return { week, unico };
}
function esegui({ week, pool, minuti = 35, target = 100, kcal = 1600, quote, meal = 'pranzo' }) {
  const valuta = pasti => {
    const v = { kcal: 0, proteine: 0, sale: 0, saturi: 0, fibra: 0 };
    for (const { p, f } of adattaGiornata(pasti, kcal, target)) {
      for (const [k, campo] of [['kcal', 'kcal'], ['proteine', 'protein'], ['sale', 'salt'], ['saturi', 'satFat'], ['fibra', 'fibre']]) v[k] += (p.piatto[campo] || 0) * f;
    }
    return { ...v, kcalOk: Math.abs(v.kcal - kcal) <= kcal * .1, saleMax: 5, satMax: v.kcal * .1 / 9, fibraMin: Math.max(25, v.kcal * .014) };
  };
  const result = miglioraModelliPasto({ settimana: week, targetProteine: target, quote: quote || {
    pesce: { min: 1, max: 3 }, legumi: { min: 0, max: 3 }, carne_bianca: { min: 0, max: 3 },
  }, accompagnaBene, valuta, contesto: (g, m) => ({ kcal, minuti, piatti: m === meal ? pool : [],
    baseAmmessa: () => true, abbinamentoBaseOk: () => true }) });
  return { ...result, valuta };
}

test('sceglie un piatto unico che migliora le proteine senza mutare il piano in ingresso', () => {
  const { week, unico } = fixture(), copia = structuredClone(week);
  const r = esegui({ week, pool: [unico] });
  assert.deepEqual(week, copia);
  assert.deepEqual(r.modelli, [{ giorno: 1, meal: 'pranzo', modello: 'piatto_unico' }]);
  assert.equal(r.settimana[0].pasti.filter(p => p.meal === 'pranzo').length, 1);
  assert.ok(r.valuta(r.settimana[0].pasti).proteine > r.valuta(week[0].pasti).proteine);
  assert.ok(r.valuta(r.settimana[0].pasti).kcalOk);
});

test('un secondo con verdure puo essere proposto anche a pranzo, con slot reale', () => {
  const { week } = fixture();
  const pool = [dish('pollo', 'secondo', 500, 65, [P], { gruppo: 'carne_bianca' }), dish('insalata', 'contorno', 100, 2, [V])];
  const r = esegui({ week, pool });
  assert.equal(r.modelli[0].modello, 'secondo_contorno');
  assert.ok(r.settimana[0].pasti.some(p => p.meal === 'pranzo' && p.slot === 'secondo'));
  assert.equal(r.settimana[0].pasti.filter(p => p.meal === 'colazione').length, 1);
});

test('i minuti valgono sulla somma delle ricette del nuovo pasto', () => {
  const { week } = fixture();
  const pool = [dish('pollo', 'secondo', 500, 65, [P], { prep_min: 25 }), dish('verdura', 'contorno', 100, 2, [V], { prep_min: 20 })];
  const r = esegui({ week, pool, minuti: 35 });
  assert.equal(r.modelli.length, 0);
  assert.deepEqual(r.settimana, week);
});

test('il pasto completo combina primo, secondo e verdure senza perdere l amido della giornata', () => {
  const { week } = fixture();
  week[0].pasti = week[0].pasti.filter(p => p.piatto.id !== 'pane');
  week[0].pasti[0].piatto.ruoli_coperti = [];
  week[0].pasti[0].piatto.amidoReale = false;
  const pool = [dish('riso', 'primo', 400, 8, [A], { grams: 250 }),
    dish('pollo', 'secondo', 300, 55, [P], { grams: 150, gruppo: 'carne_bianca' }),
    dish('insalata', 'contorno', 80, 2, [V], { grams: 180 })];
  const r = esegui({ week, pool });
  assert.equal(r.modelli[0]?.modello, 'completo');
  const slot = r.settimana[0].pasti.filter(p => p.meal === 'pranzo').map(p => p.slot);
  assert.ok(slot.includes('primo') && slot.includes('secondo') && slot.includes('contorno'));
});

test('non sostituisce un pasto con un piatto bloccato', () => {
  const { week, unico } = fixture(); week[0].pasti[1].bloccato = true;
  assert.equal(esegui({ week, pool: [unico] }).modelli.length, 0);
});

test('non modifica la portata da cui dipende un avanzo successivo', () => {
  const { week, unico } = fixture();
  week.push({ giorno: 2, pasti: [row('cena', week[0].pasti[3].piatto, { avanzi: true })] });
  assert.equal(esegui({ week, pool: [unico], meal: 'cena' }).modelli.length, 0);
});

test('non riusa un piatto gia presente altrove nella settimana', () => {
  const { week, unico } = fixture(); week.push({ giorno: 2, pasti: [row('pranzo', unico)] });
  const r = esegui({ week, pool: [unico] });
  assert.equal(r.settimana[0].pasti.filter(p => p.meal === 'pranzo').length, 2);
});

test('una nuova struttura non peggiora i tetti dei gruppi proteici', () => {
  const { week, unico } = fixture(); unico.gruppo = 'pesce';
  const r = esegui({ week, pool: [unico], quote: { pesce: { min: 1, max: 1 } } });
  assert.equal(r.modelli.length, 0);
});

test('una nuova struttura non fa perdere una frequenza minima gia raggiunta', () => {
  const { week, unico } = fixture();
  week[0].pasti[1].piatto.ruoli_coperti.push(P); week[0].pasti[1].piatto.gruppo = 'carne_bianca';
  const r = esegui({ week, pool: [unico], quote: { carne_bianca: { min: 1, max: 3 }, legumi: { min: 0, max: 3 } } });
  assert.equal(r.modelli.length, 0);
});

test('non aggiunge una seconda salsa industriale diversa', () => {
  const { week, unico } = fixture(); week[0].pasti[3].piatto.salsa_industriale = true; unico.salsa_industriale = true;
  assert.equal(esegui({ week, pool: [unico] }).modelli.length, 0);
});

test('scarta le combinazioni che peggiorano il sale o le proteine', () => {
  for (const extra of [{ salt: 20 }, { protein: 1 }]) {
    const { week, unico } = fixture(); Object.assign(unico, extra);
    assert.equal(esegui({ week, pool: [unico] }).modelli.length, 0);
  }
});

test('non usa una ricetta con ruoli mancanti per completare un nuovo pasto', () => {
  const { week } = fixture();
  const ignoto = dish('senza-ruoli', 'primo', 350, 100, [], { ruoli_coperti: null });
  const noto = dish('secondo-completo', 'secondo', 300, 30, [P, A, V], { gruppo: 'legumi' });
  const r = esegui({ week, pool: [ignoto, noto] });
  assert.ok(r.settimana.every(g => g.pasti.every(p => p.piatto.id !== ignoto.id)));
});

test('le frequenze includono pranzo e cena, una volta per gruppo e pasto', () => {
  const p = dish('p', 'secondo', 300, 25, [P], { gruppo: 'pesce' });
  assert.deepEqual(contaGruppi([{ pasti: [row('pranzo', p), row('pranzo', p), row('cena', p), row('spuntino', p)] }]), { pesce: 2 });
});

test('Swap conserva tutti i ruoli di un piatto unico senza accompagnamenti', () => {
  const { unico } = fixture();
  assert.equal(preservaRuoliDelPasto(unico, dish('pasta', 'primo', 400, 10, [A])), false);
  assert.equal(preservaRuoliDelPasto(unico, { ...unico, id: 'altro' }), true);
});

test('Swap puo appoggiarsi a una componente gia presente nel resto del pasto', () => {
  const { unico } = fixture();
  assert.equal(preservaRuoliDelPasto(unico, dish('base', 'primo', 400, 10, [A]),
    [dish('secondo', 'secondo', 300, 30, [P]), dish('verdure', 'contorno', 100, 2, [V])]), true);
});
