const assert=require('node:assert/strict');
const fixture=require('./test/fixtures/nutrienti-matrice.json');
const {verificaNutrientiGiornata}=require('./scripts/verifica-matrice-vincoli-estesa');
const perId=new Map(fixture.piatti.map(p=>[p.id,p]));
let n=0;
function test(nome,fn){fn();n++;console.log('OK '+nome);}
function verifica(d,righe=d.righe,concessioni=d.concessioni,piatti=perId){return verificaNutrientiGiornata(righe,concessioni,piatti,d.giorno,fixture.provenienza.proteine_target);}
const giornate=Object.fromEntries(fixture.giornate.map(d=>[d.nome,d]));
for(const d of fixture.giornate)test('giornata reale '+d.nome,()=>verifica(d));
const valida=giornate.valida,campi=['kcal','protein_g','fibre_g','sat_fat_g','salt_g'];
for(const campo of campi)for(const [nome,valore]of [['assente',undefined],['null',null],['NaN',NaN],['infinito',Infinity],['negativo',-1],['stringa','1']])test('riga '+campo+' '+nome,()=>{
 const righe=structuredClone(valida.righe);righe[0][campo]=valore;
 assert.throws(()=>verifica(valida,righe),/Nutriente non valido/);
});
for(const campo of campi)test('valore '+campo+' incoerente con ingredienti e porzione',()=>{
 const righe=structuredClone(valida.righe);righe[0][campo]+=100;
 assert.throws(()=>verifica(valida,righe),/incoerente con porzione e ingredienti/);
});
for(const campo of ['grams','kcal','protein','fibre','satFat','salt'])for(const [nome,valore]of [['assente',undefined],['infinito',Infinity],['negativo',-1]])test('catalogo '+campo+' '+nome,()=>{
 const piatti=new Map(perId),id=valida.righe[0].dish_id;piatti.set(id,{...piatti.get(id),[campo]:valore});
 assert.throws(()=>verifica(valida,valida.righe,valida.concessioni,piatti));
});
test('ricetta non risolta ferma il controllo',()=>{
 const piatti=new Map(perId);piatti.delete(valida.righe[0].dish_id);
 assert.throws(()=>verifica(valida,valida.righe,valida.concessioni,piatti),/Ingredienti non verificabili/);
});
test('porzione indeterminata ferma il ricalcolo',()=>{
 const righe=structuredClone(valida.righe);delete righe[0].portion_g;
 assert.throws(()=>verifica(valida,righe),/incoerente con porzione e ingredienti/);
});
test('concessioni assenti fermano il controllo',()=>assert.throws(()=>verifica(valida,valida.righe,null),/Concessioni assenti/));
for(const [nome,vincolo]of [['proteine','proteine_minime'],['fibra','fibra_minima'],['sale_saturi','tetto_sale_saturi']]){
 test('concessione '+nome+' mancante viene rilevata',()=>{
  const d=giornate[nome],senza=d.concessioni.filter(c=>c.vincolo!==vincolo);
  assert.throws(()=>verifica(d,d.righe,senza),/non dichiarat/);
 });
 test('concessione '+nome+' ormai obsoleta viene rilevata',()=>{
  assert.throws(()=>verifica(valida,valida.righe,[...valida.concessioni,{giorno:valida.giorno,vincolo}]),/obsoleta/);
 });
}
console.log(`${n} controlli nutrienti della matrice superati con quattro giornate reali congelate, senza connessioni.`);
