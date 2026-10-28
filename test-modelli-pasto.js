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
function esegui({ week, pool, minuti = 35, target = 100, kcal = 1600, quote, meal = 'pranzo', valutaFinale }) {
  const valuta = pasti => {
    const v = { kcal: 0, proteine: 0, sale: 0, saturi: 0, fibra: 0 };
    for (const { p, f } of adattaGiornata(pasti, kcal, target)) {
      for (const [k, campo] of [['kcal', 'kcal'], ['proteine', 'protein'], ['sale', 'salt'], ['saturi', 'satFat'], ['fibra', 'fibre']]) v[k] += (p.piatto[campo] || 0) * f;
    }
    return { ...v, kcalOk: Math.abs(v.kcal - kcal) <= kcal * .1, saleMax: 5, satMax: v.kcal * .1 / 9, fibraMin: Math.max(25, v.kcal * .014) };
  };
  const result = miglioraModelliPasto({ settimana: week, targetProteine: target, quote: quote || {
    pesce: { min: 1, max: 3 }, legumi: { min: 0, max: 3 }, carne_bianca: { min: 0, max: 3 },
  }, accompagnaBene, valuta, valutaFinale, contesto: (g, m) => ({ kcal, minuti, piatti: m === meal ? pool : [],
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


test('preferenza grassi sceglie una struttura meno grassa conservando le proteine',()=>{
  const vecchio=dish('vecchio','primo',1000,70,[P,A,V],{fat:50});
  const leggero=dish('leggero','primo',1000,70,[P,A,V],{fat:30});
  const povero=dish('povero-proteine','primo',1000,60,[P,A,V],{fat:20});
  const valuta=ps=>({kcal:1000,kcalOk:true,proteine:ps[0].piatto.protein,grassi:ps[0].piatto.fat,
    sale:1,saturi:5,fibra:30,saleMax:5,satMax:12,fibraMin:25});
  const week=[{giorno:1,pasti:[row('pranzo',vecchio)]}];
  const config={settimana:week,targetProteine:80,quote:{},accompagnaBene:()=>true,valuta,
    contesto:()=>({kcal:1000,minuti:35,piatti:[povero,leggero],baseAmmessa:()=>true,abbinamentoBaseOk:()=>true})};
  assert.equal(miglioraModelliPasto(config).settimana[0].pasti[0].piatto.id,'vecchio');
  const r=miglioraModelliPasto({...config,preferisciGrassi:true});
  assert.equal(r.settimana[0].pasti[0].piatto.id,'leggero');
  assert.equal(r.settimana[0].pasti[0].piatto.protein,70);
});

function fixtureQuantita({ripetizione=true,modifica,quote={}}={}) {
  const vecchio=dish('troppa-frutta-secca','primo',1000,60,[P,A,V],{fat:30,grammiFruttaSecca:70,gruppo:'legumi'});
  const alternativo=dish('secondo-gia-usato','secondo',1000,90,[P,A,V],{fat:25,grammiFruttaSecca:20,gruppo:'pesce'});
  const week=[{giorno:1,pasti:[row('pranzo',vecchio)]},{giorno:2,pasti:[row('cena',alternativo)]}];
  modifica?.(week,vecchio,alternativo);
  const valuta=ps=>{const somma=k=>ps.reduce((s,r)=>s+(r.piatto[k]||0),0);return {kcal:somma('kcal'),kcalOk:true,proteine:somma('protein'),grassi:somma('fat'),fruttaSecca:somma('grammiFruttaSecca'),sale:1,saturi:2,fibra:30,saleMax:5,satMax:12,fibraMin:25};};
  return {week,alternativo,config:{settimana:week,targetProteine:80,preferisciGrassi:true,riferimentoFruttaSecca:40,ripetizioneQuantita:ripetizione,quote,accompagnaBene:()=>true,valuta,
    contesto:()=>({kcal:1000,minuti:35,piatti:[alternativo],baseAmmessa:()=>true,abbinamentoBaseOk:()=>true})}};
}
test('recupero quantita riusa un secondo soltanto quando la ripetizione e gia consentita',()=>{
 for(const ripetizione of [false,true]){const {config,week}=fixtureQuantita({ripetizione}),copia=structuredClone(week),r=miglioraModelliPasto(config);
 assert.equal(r.settimana[0].pasti[0].piatto.id,ripetizione?'secondo-gia-usato':'troppa-frutta-secca');assert.deepEqual(week,copia);}
});
test('recupero quantita non crea un terzo uso dello stesso secondo',()=>{
 const {config}=fixtureQuantita({modifica:(w,v,p)=>w.push({giorno:3,pasti:[row('cena',p)]})});
 assert.equal(miglioraModelliPasto(config).modelli.length,0);
});
test('recupero quantita non aggiunge una seconda ripetizione gia consumata altrove',()=>{
 const {config}=fixtureQuantita({modifica:w=>{const p=dish('altra-ripetizione','secondo',1000,90,[P,A,V],{fat:25,grammiFruttaSecca:0});for(const giorno of [3,4])w.push({giorno,pasti:[row('cena',p)]});}});
 assert.equal(miglioraModelliPasto(config).modelli.length,0);
});
test('recupero quantita non riusa un piatto che ha avanzi collegati',()=>{
 const {config}=fixtureQuantita({modifica:(w,v,p)=>w.push({giorno:3,pasti:[row('cena',p,{avanzi:true})]})});
 assert.equal(miglioraModelliPasto(config).modelli.length,0);
});
test('recupero quantita lascia invariati giorni gia entro riferimento e piatti bloccati',()=>{
 for(const tipo of ['nel-riferimento','bloccato']){const{config}=fixtureQuantita({modifica:(w,v)=>{if(tipo==='nel-riferimento')v.grammiFruttaSecca=20;else w[0].pasti[0].bloccato=true;}});assert.equal(miglioraModelliPasto(config).modelli.length,0);}
});
for(const [nome,extra]of [['proteine',{protein:50}],['grassi',{fat:50}],['quantita',{grammiFruttaSecca:80}],['energia',{kcal:900}]])test('recupero quantita conserva '+nome,()=>{
 const{config}=fixtureQuantita({modifica:(w,v,p)=>Object.assign(p,extra)});assert.equal(miglioraModelliPasto(config).modelli.length,0);
});
test('recupero quantita conserva frequenze minime e massime dei gruppi',()=>{
 for(const quote of [{legumi:{min:1,max:5}},{pesce:{min:0,max:1}}]){const{config}=fixtureQuantita({quote});assert.equal(miglioraModelliPasto(config).modelli.length,0);}
});
test('recupero quantita ammette al massimo il margine calorico previsto',()=>{
 const{config}=fixtureQuantita({modifica:(w,v,p)=>p.kcal=950});assert.equal(miglioraModelliPasto(config).settimana[0].pasti[0].piatto.id,'secondo-gia-usato');
});

test('concessioni delle ripetizioni derivano dai secondi finali, escludendo avanzi',()=>{
 const {ripetizioniSecondi}=require('./modelli-pasto'),p=dish('x','secondo',500,30,[P]);
 const w=[{giorno:2,pasti:[row('pranzo',p)]},{giorno:1,pasti:[row('cena',p)]},{giorno:3,pasti:[row('cena',p,{avanzi:true})]}];
 assert.deepEqual(ripetizioniSecondi(w).map(r=>[r.giorno,r.meal,r.piatto.id]),[[2,'pranzo','x']]);
});

test('ripetizioni legacy non autorizzano un nuovo terzo uso di un altro secondo',()=>{
 const {config}=fixtureQuantita({modifica:(w,v,p)=>{
   v.meal_slot='secondo';w[0].pasti[0].slot='secondo';
   w.push({giorno:3,pasti:[row('cena',p)]});
   for(const giorno of [4,5])w.push({giorno,pasti:[row('cena',v,{bloccato:true})]});
 }});
 assert.equal(miglioraModelliPasto(config).settimana[0].pasti[0].piatto.id,'troppa-frutta-secca');
});

// L'ottimizzatore puo' valutare prima le porzioni senza tutte le rifiniture:
// la proposta deve proteggere anche le proteine effettivamente salvate.
for(const proteineFinali of [10,120])test('proteine finali della proposta ricontrollate: '+proteineFinali,()=>{
 const {week,unico}=fixture();
 const valutaFinale=pasti=>({kcal:1600,kcalOk:true,proteine:pasti.some(r=>r.piatto.id==='unico')?proteineFinali:60,
   grassi:40,sale:1,saturi:2,fibra:30,fruttaSecca:0,saleMax:5,satMax:18,fibraMin:25});
 const r=esegui({week,pool:[unico],valutaFinale});
 assert.equal(r.modelli.length,proteineFinali<60?0:1);
 if(proteineFinali<60)assert.deepEqual(r.settimana,week);
});
test('valutazione finale incompleta non autorizza un cambio di modello',()=>{
 const {week,unico}=fixture();const r=esegui({week,pool:[unico],valutaFinale:()=>null});assert.deepEqual(r.settimana,week);assert.equal(r.modelli.length,0);
});
