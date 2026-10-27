const assert=require('node:assert/strict');
const {bilanciaFruttaSecca,riepilogoFruttaSecca,riferimentoFruttaSecca}=require('./quantita-frutta-secca');
const {miglioraIngredienti}=require('./migliora-ingredienti');
const {riepilogoIngredienti}=require('./ingredienti-piano');
let passati=0;function test(nome,fn){fn();passati++;console.log('OK '+nome);}
const limiti={fibraMinGiorno:25,saleMaxGiorno:5,satMaxGiorno:12};
const totale=(s,k)=>s.reduce((n,x)=>n+x.p.piatto[k]*x.f,0),vicino=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function stato(){return [
 {p:{piatto:{grams:200,kcal:500,protein:25,fat:20,satFat:2,salt:1,fibre:15,grammiFruttaSecca:60}},f:1,lim:[.5,1.5]},
 {p:{piatto:{grams:300,kcal:500,protein:25,fat:10,satFat:2,salt:1,fibre:15,grammiFruttaSecca:0}},f:1,lim:[.5,1.5]},
];}
test('ridistribuisce calorie, senza tagliare un ingrediente della ricetta',()=>{
 const s=stato(),prima=s.map(x=>JSON.stringify(x.p));bilanciaFruttaSecca(s,50,limiti,2000);
 vicino(totale(s,'kcal'),1000);assert.ok(totale(s,'grammiFruttaSecca')<40);vicino(totale(s,'protein'),50);assert.deepEqual(s.map(x=>JSON.stringify(x.p)),prima);
 assert.ok(s.every(x=>x.f>=x.lim[0]&&x.f<=x.lim[1]));
});
for(const [campo,a,b]of[['protein',45,5],['fibre',20,5],['salt',1,4],['satFat',1,11],['fat',10,35]])test('conserva il vincolo '+campo,()=>{
 const s=stato();s[0].p.piatto[campo]=a;s[1].p.piatto[campo]=b;
 const prima=totale(s,campo);bilanciaFruttaSecca(s,50,limiti,2000);vicino(totale(s,campo),prima);
});
test('dati mancanti: nessun valore fittizio o fattore non finito',()=>{
 const s=stato();s[0].p.piatto.grammiFruttaSecca=null;const prima=JSON.stringify(s);bilanciaFruttaSecca(s,50,limiti,2000);assert.equal(JSON.stringify(s),prima);
 assert.equal(riepilogoFruttaSecca(null,2000),null);assert.equal(riepilogoFruttaSecca(40,null),null);
});
test('riferimento tecnico distinto da limite clinico',()=>{
 const r=riepilogoFruttaSecca(116,3200);assert.equal(r.esito,'sopra_riferimento');assert.equal(r.tipo_riferimento,'tecnico_non_clinico');assert.equal(riferimentoFruttaSecca(2000),40);
});
test('impossibile nelle porzioni: conserva i minimi, resta un residuo dichiarabile',()=>{
 const s=stato();s.forEach(x=>x.lim=[1,1]);bilanciaFruttaSecca(s,50,limiti,2000);assert.equal(totale(s,'grammiFruttaSecca'),60);
 assert.equal(riepilogoFruttaSecca(60,2000).esito,'sopra_riferimento');
});
function piatto(id,noci,extra={}){return{id,name:id,principale:id,meal_slot:'spuntino',kcal:500,protein:25,grammiFruttaSecca:noci,ruoli_coperti:[],...extra};}
const row=(p,extra={})=>({meal:'spuntino',slot:'spuntino',piatto:p,...extra});
const valuta=ps=>({kcal:ps.reduce((s,r)=>s+r.piatto.kcal,0),kcalOk:true,proteine:ps.reduce((s,r)=>s+r.piatto.protein,0),
 fruttaSecca:ps.reduce((s,r)=>s+r.piatto.grammiFruttaSecca,0),grassi:20,sale:1,saleMax:5,saturi:2,satMax:12,fibra:30,fibraMin:25});
function ottimizza(week,pool,extra={}){return miglioraIngredienti({settimana:week,contesto:()=>pool,valuta,targetProteine:50,riferimento:40,kcalTarget:1000,...extra});}
test('sostituisce una ricetta intera senza cambiare il numero di spuntini',()=>{
 const week=[{giorno:1,pasti:[row(piatto('noci',60)),row(piatto('altro',0))]}],prima=JSON.stringify(week);
 const r=ottimizza(week,[piatto('yogurt',0)]);assert.equal(r.settimana[0].pasti.length,2);assert.equal(valuta(r.settimana[0].pasti).fruttaSecca,0);assert.equal(JSON.stringify(week),prima);
});
test('piatti bloccati e avanzi restano identici',()=>{
 const a=piatto('noci',60),week=[{giorno:1,pasti:[row(a,{bloccato:true}),row(piatto('x',0))]}];
 assert.equal(ottimizza(week,[piatto('y',0)]).settimana[0].pasti[0].piatto.id,'noci');
 week[0].pasti[0].bloccato=false;week.push({giorno:2,pasti:[row(a,{avanzi:true})]});
 assert.equal(ottimizza(week,[piatto('y',0)]).settimana[0].pasti[0].piatto.id,'noci');
});
test('due cambi insieme conservano proteine quando ogni singolo cambio le perde',()=>{
 const a=piatto('a',60,{protein:25}),b=piatto('b',20,{protein:25});
 const c=piatto('c',0,{protein:10}),d=piatto('d',0,{protein:40});
 const week=[{giorno:1,pasti:[row(a),row(b)]}];
 const r=ottimizza(week,[],{contesto:(g,r)=>r.piatto.id==='a'?[c]:[d],
   valuta:ps=>{const v=valuta(ps);if(ps.some(r=>r.piatto.id==='d')&&!ps.some(r=>r.piatto.id==='c'))v.sale=20;return v;}});
 assert.equal(valuta(r.settimana[0].pasti).fruttaSecca,0);assert.equal(valuta(r.settimana[0].pasti).proteine,50);
});
test('non introduce duplicati giornalieri o un quarto uso settimanale',()=>{
 const y=piatto('y',0),week=[{giorno:1,pasti:[row(piatto('n',60)),row(y)]}];
 assert.equal(ottimizza(week,[y]).settimana[0].pasti[0].piatto.id,'n');
 const w=[{giorno:1,pasti:[row(piatto('n',60)),row(piatto('x',0))]},...[2,3,4].map(g=>({giorno:g,pasti:[row(y)]}))];
 assert.equal(ottimizza(w,[y]).settimana[0].pasti[0].piatto.id,'n');
});
test('non introduce due spuntini amidacei o perde un ruolo della giornata',()=>{
 const a=piatto('a',60,{ruoli_coperti:['base_amidacea']}),b=piatto('b',0,{ruoli_coperti:['base_amidacea']}),c=piatto('c',0,{ruoli_coperti:['base_amidacea']});
 const week=[{giorno:1,pasti:[row(a),row(piatto('x',0))]}];
 assert.equal(ottimizza(week,[piatto('senza-amido',0)],{contesto:(g,r)=>r.piatto.id==='a'?[piatto('senza-amido',0)]:[]}).settimana[0].pasti[0].piatto.id,'a');
 const w=[{giorno:1,pasti:[row(piatto('n',60)),row(b)]}];assert.equal(ottimizza(w,[c]).settimana[0].pasti[0].piatto.id,'n');
});
for(const [nome,modifica]of[
 ['proteine',v=>v.proteine=1],['fibra',v=>v.fibra=1],['sale',v=>v.sale=6],['saturi',v=>v.saturi=13],['grassi',v=>v.grassi=50],['energia',v=>v.kcal=800],
])test('rifiuta alternativa che peggiora '+nome,()=>{
 const week=[{giorno:1,pasti:[row(piatto('n',60)),row(piatto('x',0))]}];
 const r=ottimizza(week,[piatto('y',0)],{valuta:ps=>{const v=valuta(ps);if(ps.some(r=>r.piatto.id==='y'))modifica(v);return v;}});
 assert.equal(r.settimana[0].pasti[0].piatto.id,'n');
});
test('riepilogo: somma ricette, esclude saltati e usa il target del piano',()=>{
 const p={grams:100,grammiFruttaSecca:30,ingredienti:[{food_id:'solo-fixture',nome:'fixture',grams:100,kcal_100g:200,fat_100g:20}]};
 const rows=[{day_of_week:1,dish_id:'a',portion_g:100},{day_of_week:1,dish_id:'a',portion_g:50},{day_of_week:1,dish_id:'a',portion_g:100,stato:'saltato'}];
 const [g]=riepilogoIngredienti(rows,new Map([['a',p]]),2000);assert.equal(g.frutta_secca.grammi,45);assert.equal(g.frutta_secca.riferimento_g,40);assert.equal(g.frutta_secca.esito,'sopra_riferimento');
 assert.equal(riepilogoIngredienti(rows,new Map([['a',p]]))[0].frutta_secca,null);
});
test('riepilogo nutrizionale incompleto: conserva le ricette',()=>{
 const week=[{giorno:1,pasti:[row(piatto('n',60)),row(piatto('x',0))]}];
 const r=ottimizza(week,[piatto('y',0)],{valuta:ps=>({...valuta(ps),grassi:null})});
 assert.equal(r.settimana[0].pasti[0].piatto.id,'n');
});
test('300 giornate sintetiche: nutrienti e calorie preservati nelle porzioni',()=>{
 let seed=2026;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<300;i++){
  const s=Array.from({length:3+Math.floor(rand()*5)},()=>({p:{piatto:{grams:200,kcal:200+rand()*600,protein:rand()*40,fat:rand()*30,satFat:rand()*5,salt:rand()*2,fibre:rand()*15,grammiFruttaSecca:rand()*50}},f:1,lim:[.5,1.5]}));
  const prima=Object.fromEntries(['kcal','protein','fat','satFat','salt','fibre','grammiFruttaSecca'].map(k=>[k,totale(s,k)]));
  bilanciaFruttaSecca(s,80,limiti,2000);vicino(totale(s,'kcal'),prima.kcal);assert.ok(totale(s,'grammiFruttaSecca')<=prima.grammiFruttaSecca+1e-6);
  assert.ok(totale(s,'protein')>=Math.min(prima.protein,80)-1e-6);assert.ok(totale(s,'fibre')>=Math.min(prima.fibre,25)-1e-6);
  assert.ok(totale(s,'salt')<=Math.max(prima.salt,5)+1e-6);assert.ok(totale(s,'satFat')<=Math.max(prima.satFat,12)+1e-6);
  assert.ok(totale(s,'fat')<=Math.max(prima.fat,prima.kcal*.35/9)+1e-6);assert.ok(s.every(x=>x.f>=x.lim[0]&&x.f<=x.lim[1]));
 }
});
console.log(`${passati} controlli quantita giornaliere superati`);
