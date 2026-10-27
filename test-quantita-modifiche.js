const assert=require('assert/strict');const{preservaQuantitaGiornaliere:ok}=require('./quantita-modifiche');
let n=0;function test(nome,f){f();n++;console.log('OK '+nome);}
const p=(noci,fat=10,kcal=500)=>({grams:100,kcal,fat,grammiFruttaSecca:noci});
const row=(dish_id,extra={})=>({dish_id,day_of_week:1,portion_g:100,...extra});
const t={kcal:2000};
test('somma frutta secca in tutte le ricette della giornata',()=>{
 const m=new Map([['a',p(20)],['b',p(30)]]),prima=[row('a'),row('a')],dopo=[row('a'),row('b')];assert.equal(ok(prima,dopo,m,t,[1]),false);
});
test('quantita scalata sulla porzione effettiva',()=>{
 const m=new Map([['a',p(25)]]);assert.equal(ok([row('a')],[row('a',{portion_g:200})],m,t,[1]),false);
});
test('giornata legacy oltre riferimento puo migliorare senza peggiorare',()=>{
 const m=new Map([['a',p(70)],['b',p(60)],['c',p(80)]]);assert.equal(ok([row('a')],[row('b')],m,t,[1]),true);assert.equal(ok([row('a')],[row('c')],m,t,[1]),false);
});
test('nessun accumulo delle tolleranze dopo modifiche ripetute',()=>{
 const m=new Map([['a',p(70)],['b',p(70.0001)]]);assert.equal(ok([row('a')],[row('a')],m,t,[1]),true);assert.equal(ok([row('a')],[row('b')],m,t,[1]),false);
});
test('saltati esclusi, avanzi inclusi',()=>{
 const m=new Map([['a',p(20)],['b',p(30)]]),prima=[row('a'),row('b',{stato:'saltato',portion_g:null})];
 assert.equal(ok(prima,prima,m,t,[1]),true);assert.equal(ok(prima,[row('a'),row('b',{avanzi:true})],m,t,[1]),false);
});
test('riferimento dipende dal target del piano',()=>{
 const m=new Map([['a',p(20)],['b',p(45)]]);assert.equal(ok([row('a')],[row('b')],m,{kcal:3200},[1]),true);assert.equal(ok([row('a')],[row('b')],m,{kcal:1600},[1]),false);
});
test('controlla percentuale dei grassi e non soltanto grammi',()=>{
 const m=new Map([['a',p(0,30,1000)],['b',p(0,25,500)]]);assert.equal(ok([row('a')],[row('b')],m,t,[1]),false);
});
test('grassi nel riferimento e superamento legacy non aggravato',()=>{
 const m=new Map([['a',p(0,20,1000)],['b',p(0,35,1000)],['c',p(0,50,1000)],['d',p(0,49,1000)],['e',p(0,51,1000)]]);
 assert.equal(ok([row('a')],[row('b')],m,t,[1]),true);assert.equal(ok([row('c')],[row('d')],m,t,[1]),true);assert.equal(ok([row('c')],[row('e')],m,t,[1]),false);
});
test('verifica entrambe le giornate di uno scambio',()=>{
 const m=new Map([['a',p(70)],['b',p(20)]]),prima=[row('a'),row('b',{day_of_week:2})],dopo=[row('b'),row('a',{day_of_week:2})];assert.equal(ok(prima,dopo,m,t,[1,2]),false);
});
for(const campo of ['fat','grammiFruttaSecca','grams'])test('dato assente '+campo+' ferma la verifica',()=>{
 const a=p(20);a[campo]=null;const m=new Map([['a',a]]);assert.equal(ok([row('a')],[row('a')],m,t,[1]),false);
});
test('nessun dato o target invalido non diventa zero',()=>{
 const m=new Map([['a',p(20)]]);assert.equal(ok([row('a')],[row('a')],m,null,[1]),false);assert.equal(ok([row('a')],[row('a')],m,t,[8]),false);assert.equal(ok([],[],m,t,[1]),false);
});
test('input invariati',()=>{
 const m=new Map([['a',p(20)]]),r=[row('a')],prima=JSON.stringify([r,[...m]]);assert.ok(ok(r,r,m,t,[1]));assert.equal(JSON.stringify([r,[...m]]),prima);
});
console.log(`${n} controlli quantita nelle modifiche superati`);
