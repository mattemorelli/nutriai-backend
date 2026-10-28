const assert = require('node:assert/strict');
const { test } = require('node:test');
const { creaPranzoFlessibile } = require('./pranzo-flessibile');
const { limitiDi } = require('./genera');

// Il piatto grande ha piu' kcal nella ricetta intera, ma il suo tetto di
// porzione lo rende meno capiente del secondo piccolo. Il recupero deve
// considerare l'energia raggiungibile, senza gonfiare le porzioni.
test('senza spuntini la precedenza usa l energia raggiungibile entro i limiti reali', () => {
  const grande = { id:'grande', grams:1200, kcal:500, protein:10, meal_slot:'primo' };
  const compatto = { id:'compatto', grams:150, kcal:350, protein:20, meal_slot:'secondo' };
  const capacita = s => s.piatto.kcal * limitiDi({slot:s.slot,piatto:s.piatto},2000)[1];
  const api = creaPranzoFlessibile({ statoGiorni:[{}], candidatiPrimo:()=>[grande], candidatiSecondo:()=>[compatto],
    capacitaEnergetica:capacita });
  const out=api.candidatiPrincipalePranzo(6,'m','it',null,()=>true,25);
  assert.equal(out[0].piatto,compatto);
  assert.ok(grande.kcal>compatto.kcal);
  assert.ok(capacita({slot:'primo',piatto:grande})<capacita({slot:'secondo',piatto:compatto}));
  assert.deepEqual(new Set(out.map(s=>s.piatto.id)),new Set(['grande','compatto']));
  assert.equal(grande.grams,1200);assert.equal(compatto.grams,150);
});

test('senza criterio energetico resta l ordine del recupero con spuntini', () => {
  const primo={id:'primo'},secondo={id:'secondo'};
  const api=creaPranzoFlessibile({statoGiorni:[{}],candidatiPrimo:()=>[primo],candidatiSecondo:()=>[secondo]});
  assert.deepEqual(api.candidatiPrincipalePranzo(6,'m','it',null,()=>true,25).map(s=>s.slot),['primo','secondo']);
});
