const assert=require('node:assert/strict');
const {miglioraIngredienti}=require('./migliora-ingredienti');
let n=0;function test(nome,fn){fn();n++;console.log('OK '+nome);}
const dish=(id,x={})=>({id,name:id,principale:id,meal_slot:'spuntino',kcal:500,protein:30,fibre:15,salt:1,satFat:2,fat:15,grammiFruttaSecca:0,ruoli_coperti:[],...x});
const row=(p,x={})=>({meal:'spuntino',slot:'spuntino',piatto:p,...x});
const valuta=ps=>{const tot=k=>ps.reduce((s,r)=>s+r.piatto[k],0),kcal=tot('kcal');return{kcal,kcalOk:Math.abs(kcal-1000)<=100,proteine:tot('protein'),fibra:tot('fibre'),sale:tot('salt'),saturi:tot('satFat'),grassi:tot('fat'),fruttaSecca:tot('grammiFruttaSecca'),saleMax:5,satMax:kcal*.1/9,fibraMin:Math.max(25,kcal*.014)};};
function run(week,pool,extra={}){return miglioraIngredienti({settimana:week,contesto:()=>pool,valuta,targetProteine:80,riferimento:40,kcalTarget:1000,miglioraNutrienti:true,...extra});}
const week=(a,b)=>[{giorno:1,pasti:[row(a),row(b)]}];
const valore=r=>valuta(r.settimana[0].pasti);
test('recupera proteine anche senza alcun eccesso di frutta secca',()=>{
 const w=week(dish('a'),dish('b')),prima=JSON.stringify(w),r=run(w,[dish('c',{protein:50}),dish('d',{protein:50})]);
 assert.ok(valore(r).proteine>=80);assert.equal(valore(r).kcal,1000);assert.equal(r.settimana[0].pasti.length,2);assert.equal(JSON.stringify(w),prima);
});
for(const [nome,originale,alternativa,campo,limite]of [
 ['fibra',{protein:45,fibre:6},{protein:45,fibre:25},'fibra',25],
 ['sale',{protein:45,salt:3},{protein:45,salt:.5},'sale',5],
 ['saturi',{protein:45,satFat:8},{protein:45,satFat:2},'saturi',1000*.1/9],
 ['grassi',{protein:45,fat:30},{protein:45,fat:10},'grassi',1000*.35/9],
])test('migliora '+nome+' con proteine conservate',()=>{
 const r=run(week(dish('a',originale),dish('b',originale)),[dish('c',alternativa),dish('d',alternativa)]),v=valore(r);
 assert.ok(v.proteine>=80);assert.ok(campo==='fibra'?v[campo]>=limite:v[campo]<=limite);
});
test('due alternative si compensano quando ogni cambio singolo perde un nutriente',()=>{
 const a=dish('a',{protein:30,fibre:10}),b=dish('b',{protein:30,fibre:10}),c=dish('c',{protein:50,fibre:2}),d=dish('d',{protein:10,fibre:25});
 const r=run(week(a,b),[],{targetProteine:60,contesto:(g,r)=>r.piatto.id==='a'?[c]:[d]});
 assert.equal(valore(r).proteine,60);assert.equal(valore(r).fibra,27);assert.equal(r.sostituzioni,2);
});
for(const [nome,modifica]of [['proteine',{protein:1,fibre:40}],['fibra',{protein:60,fibre:1}],['sale',{protein:60,salt:6}],['saturi',{protein:60,satFat:12}],['grassi',{protein:60,fat:50}],['noci',{protein:60,grammiFruttaSecca:50}],['energia',{protein:60,kcal:300}]])test('rifiuta il recupero che peggiora '+nome,()=>{
 const w=week(dish('a',{fibre:13}),dish('b',{fibre:13})),r=run(w,[dish('c',modifica)]);
 assert.equal(r.sostituzioni,0);assert.deepEqual(r.settimana,w);
});
test('non aumenta un eccesso di frutta secca gia presente',()=>{
 const w=week(dish('a',{grammiFruttaSecca:50}),dish('b'));
 assert.equal(run(w,[dish('c',{protein:60,grammiFruttaSecca:60})]).sostituzioni,0);
});
test('un obiettivo gia raggiunto non produce cambi gratuiti',()=>{
 const w=week(dish('a',{protein:45}),dish('b',{protein:45}));assert.equal(run(w,[dish('c',{protein:60})]).sostituzioni,0);
});
test('piatti bloccati preservati; nessuno slot o spuntino viene aggiunto',()=>{
 const w=week(dish('a'),dish('b'));w[0].pasti.forEach(r=>r.bloccato=true);
 const r=run(w,[dish('c',{protein:80})]);assert.deepEqual(r.settimana,w);assert.equal(r.sostituzioni,0);
});
test('conserva gli avanzi e anche le loro fonti',()=>{
 const a=dish('a'),b=dish('b'),w=week(a,b);w.push({giorno:2,pasti:[row(a,{avanzi:true}),row(b,{avanzi:true})]});
 assert.equal(run(w,[dish('c',{protein:80})]).sostituzioni,0);
});
test('non crea un quarto uso dello stesso spuntino',()=>{
 const c=dish('c',{protein:60}),w=week(dish('a'),dish('b'));
 for(let g=2;g<=4;g++)w.push({giorno:g,pasti:[row(c,{bloccato:true})]});
 assert.equal(run(w,[c]).sostituzioni,0);
});
test('conserva i ruoli gia coperti dalla giornata',()=>{
 const w=week(dish('a',{ruoli_coperti:['verdura']}),dish('b',{ruoli_coperti:['base_amidacea']}));
 assert.equal(run(w,[dish('c',{protein:60})]).sostituzioni,0);
});
for(const k of ['protein','fibre','fat','salt','satFat','grammiFruttaSecca'])test('candidato con '+k+' indeterminato non viene usato',()=>{
 const w=week(dish('a'),dish('b'));assert.equal(run(w,[dish('c',{protein:60,[k]:null})]).sostituzioni,0);
});
test('valutazioni mancanti o incompiute mantengono la settimana',()=>{
 const w=week(dish('a'),dish('b'));for(const modifica of [{grassi:null},{fibraMin:0},{saleMax:0}])assert.equal(run(w,[dish('c',{protein:80})],{valuta:ps=>({...valuta(ps),...modifica})}).sostituzioni,0);
});
test('il budget delle prove e limitato per giornata',()=>{
 const w=week(dish('a'),dish('b')),pool=Array.from({length:100},(_,i)=>dish('c'+i,{protein:30+i*.01}));
 const r=run(w,pool);assert.ok(r.valutazioni<=400);assert.ok(r.valutazioni>0);
});
test('il percorso precedente resta disponibile senza la nuova opzione',()=>{
 const w=week(dish('a'),dish('b'));assert.equal(run(w,[dish('c',{protein:80})],{miglioraNutrienti:false}).sostituzioni,0);
});
console.log(`${n} verifiche del miglioramento nutrizionale superate`);
