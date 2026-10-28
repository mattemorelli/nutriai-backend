const {test}=require('node:test'),assert=require('node:assert/strict');
const {preferenzaFacoltativa,verificaVincoli,riferimentoVerificabile}=require('./vincoli-verificabili');
const fixture=require('./test/fixtures/amido-canonico.json').tabelle;
const id=fixture.foods[0].id,categoria=fixture.categorie_alimenti[0].categoria;
const foods=new Set(fixture.foods.map(f=>f.id)),categorie={};for(const c of fixture.categorie_alimenti)(categorie[c.categoria]??=new Set()).add(c.food_id);
for(const kind of ['allergia','intolleranza','non_gradito',null])for(const severity of ['assoluto',null,'preferibile']){
 const opzionale=kind==='non_gradito'&&severity==='preferibile';
 test(`${kind}/${severity}: riferimento mancante ${opzionale?'facoltativo':'bloccante'}`,()=>{
  const v={kind,severity,subject:'voce locale non risolta'};assert.equal(preferenzaFacoltativa(v),opzionale);
  if(opzionale)assert.doesNotThrow(()=>verificaVincoli([v],foods,categorie));
  else assert.throws(()=>verificaVincoli([v],foods,categorie),e=>e.status===422&&e.code==='vincoli_non_verificabili'&&!e.message.includes(v.subject));
 });
}
for(const v of [{food_id:id},{categoria}])test('riferimento reale verificabile '+JSON.stringify(v),()=>assert.doesNotThrow(()=>verificaVincoli([{kind:'allergia',severity:'assoluto',...v}],foods,categorie)));
for(const v of [{food_id:'riferimento-inesistente'},{categoria:'categoria_inesistente'},{food_id:id,categoria}])test('riferimento non verificabile '+JSON.stringify(v),()=>assert.throws(()=>verificaVincoli([{kind:'allergia',severity:'assoluto',...v}],foods,categorie),e=>e.code==='vincoli_non_verificabili'));
test('categoria svuotata ferma il consumo del vincolo',()=>assert.throws(()=>verificaVincoli([{kind:'allergia',categoria}],foods,{[categoria]:new Set()}),e=>e.status===422));
test('un alimento esistente senza ricette resta un riferimento valido',()=>assert.equal(riferimentoVerificabile({food_id:id},foods,{}),true));
test('un solo vincolo assoluto irrisolto blocca anche con altri validi',()=>assert.throws(()=>verificaVincoli([{kind:'allergia',food_id:id},{kind:'allergia',subject:'altro'}],foods,categorie)));
