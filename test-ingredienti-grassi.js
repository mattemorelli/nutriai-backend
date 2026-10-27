const assert = require('node:assert/strict');
const { bilanciaGrassi, riepilogoGrassi } = require('./bilancia-grassi');
const { riepilogoIngredienti } = require('./ingredienti-piano');
let passati=0;
function test(nome,fn){fn();passati++;console.log('OK '+nome);}
const limiti={fibraMinGiorno:25,saleMaxGiorno:5,satMaxGiorno:12};
function stato(){return [
 {p:{piatto:{kcal:500,protein:25,fat:40,satFat:6,salt:1,fibre:15}},f:1,lim:[.5,1.5]},
 {p:{piatto:{kcal:500,protein:25,fat:5,satFat:1,salt:1,fibre:15}},f:1,lim:[.5,1.5]},
];}
const totale=(s,k)=>s.reduce((t,x)=>t+x.p.piatto[k]*x.f,0);
const vicino=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('riduce i grassi a calorie costanti e conserva le ricette',()=>{
 const s=stato(),ricette=s.map(x=>JSON.stringify(x.p));bilanciaGrassi(s,50,limiti);
 vicino(totale(s,'kcal'),1000);vicino(totale(s,'fat'),1000*.35/9);vicino(totale(s,'protein'),50);
 assert.deepEqual(s.map(x=>JSON.stringify(x.p)),ricette);assert.ok(s.every(x=>x.f>=x.lim[0]&&x.f<=x.lim[1]));
});
test('conserva le proteine gia raggiunte sotto target',()=>{
 const s=stato();s[1].p.piatto.protein=5;bilanciaGrassi(s,70,limiti);vicino(totale(s,'protein'),30);vicino(s[0].f,1);
});
test('conserva il target proteico quando lo aveva superato',()=>{
 const s=stato();s[1].p.piatto.protein=5;bilanciaGrassi(s,27,limiti);assert.ok(totale(s,'protein')>=27-1e-6);assert.ok(totale(s,'fat')<45);
});
for(const [campo,prima,seconda]of [['salt',1,4],['satFat',1,11],['fibre',20,5]])test('preserva '+campo,()=>{
 const s=stato();s[0].p.piatto[campo]=prima;s[1].p.piatto[campo]=seconda;
 const iniziale=totale(s,campo);bilanciaGrassi(s,50,limiti);vicino(totale(s,campo),iniziale);
});
test('non forza una soluzione quando le porzioni sono gia al limite',()=>{
 const s=stato();s.forEach(x=>x.lim=[1,1]);const prima=JSON.stringify(s);bilanciaGrassi(s,50,limiti);assert.equal(JSON.stringify(s),prima);
});
test('dati nutrizionali mancanti non diventano zero',()=>{
 const s=stato();s[1].p.piatto.fat=null;const prima=JSON.stringify(s);bilanciaGrassi(s,50,limiti);assert.equal(JSON.stringify(s),prima);
});
test('sotto il riferimento lascia le porzioni invariate',()=>{
 const s=stato();s[0].p.piatto.fat=20;const prima=JSON.stringify(s);bilanciaGrassi(s,50,limiti);assert.equal(JSON.stringify(s),prima);
});
test('riferimento generale esplicito e valori null non calcolabili',()=>{
 assert.equal(riepilogoGrassi(1000,40).tipo_riferimento,'generale_non_clinico');assert.equal(riepilogoGrassi(1000,40).posizione,'sopra_riferimento');
 assert.equal(riepilogoGrassi(1000,20).posizione,'sotto_riferimento');assert.equal(riepilogoGrassi(0,0),null);assert.equal(riepilogoGrassi(1000,null),null);
});
// ID puramente sintetici, confinati al test: nessuna scrittura al catalogo.
const i=(id,grams,stato='crudo')=>({food_id:id,nome:id,nome_it:'IT '+id,stato,grams,kcal_100g:200,fat_100g:10});
const piatti=new Map([['a',{grams:100,ingredienti:[i('x',30),i('y',70)]}],['b',{grams:50,ingredienti:[i('x',50)]}]]);
const r=(dish_id,portion_g,extra={})=>({day_of_week:1,dish_id,portion_g,...extra});
test('somma lo stesso alimento fra ricette usando la porzione salvata',()=>{
 const [g]=riepilogoIngredienti([r('a',150),r('b',100)],piatti);
 assert.equal(g.completo,true);assert.equal(g.ingredienti.find(x=>x.food_id==='x').grammi,145);assert.equal(g.ingredienti.find(x=>x.food_id==='y').grammi,105);
 assert.equal(g.grassi.grammi,25);assert.equal(g.ingredienti[0].nome,'IT x');
});
test('conta gli avanzi nel giorno previsto ed esclude i saltati',()=>{
 const [g]=riepilogoIngredienti([r('a',100,{avanzi:true}),r('b',100,{stato:'saltato'})],piatti);
 assert.equal(g.ingredienti.reduce((s,x)=>s+x.grammi,0),100);
});
test('tutti saltati: elenco vuoto senza percentuali inventate',()=>{
 const [g]=riepilogoIngredienti([r('a',100,{stato:'saltato'})],piatti);assert.deepEqual(g.ingredienti,[]);assert.equal(g.grassi,null);assert.equal(g.completo,true);
});
test('mantiene distinti ID e stati senza convertire secco/cotto',()=>{
 const ps=new Map([['a',{grams:100,ingredienti:[i('x',30,'cotto'),i('x',30,'crudo'),i('z',40,'cotto')]}]]);
 const [g]=riepilogoIngredienti([r('a',100)],ps);assert.equal(g.ingredienti.length,3);
});
test('arrotonda dopo aver sommato le occorrenze',()=>{
 const [g]=riepilogoIngredienti([r('a',1),r('a',1),r('a',1)],piatti);assert.equal(g.ingredienti.find(x=>x.food_id==='x').grammi,.9);
});
for(const [nome,ps,rs]of [
 ['ricetta assente',new Map(),[r('a',100)]],
 ['porzione assente',piatti,[r('a',null)]],
 ['ingredienti assenti',new Map([['a',{grams:100}]]),[r('a',100)]],
 ['peso totale incoerente',new Map([['a',{grams:150,ingredienti:[i('x',100)]}]]),[r('a',100)]],
])test(nome+': riepilogo dichiarato incompleto',()=>{const[g]=riepilogoIngredienti(rs,ps);assert.equal(g.completo,false);assert.equal(g.righe_non_calcolabili,1);assert.equal(g.grassi,null);});
test('nutriente assente: quantita presente ma grassi non calcolabili',()=>{
 const ps=new Map([['a',{grams:100,ingredienti:[{...i('x',100),fat_100g:null}]}]]);
 const[g]=riepilogoIngredienti([r('a',100)],ps);assert.equal(g.completo,true);assert.equal(g.nutrienti_completi,false);assert.equal(g.grassi,null);assert.equal(g.ingredienti[0].grammi,100);
});
test('giorni ordinati e input invariato',()=>{
 const rs=[r('a',50,{day_of_week:7}),r('a',100,{day_of_week:1})],prima=JSON.stringify([rs,[...piatti]]);
 assert.deepEqual(riepilogoIngredienti(rs,piatti).map(g=>g.giorno),[1,7]);assert.equal(JSON.stringify([rs,[...piatti]]),prima);
});
test('300 giornate: calorie, limiti e nutrienti preservati',()=>{
 let seed=2026;const casuale=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let n=0;n<300;n++){
  const s=Array.from({length:3+Math.floor(casuale()*6)},()=>({p:{piatto:{kcal:200+casuale()*500,protein:casuale()*40,fat:casuale()*45,satFat:casuale()*8,salt:casuale()*2,fibre:casuale()*15}},f:1,lim:[.5,1.7]}));
  const target=50+casuale()*100,prima=Object.fromEntries(['kcal','protein','fat','salt','satFat','fibre'].map(k=>[k,totale(s,k)]));
  bilanciaGrassi(s,target,limiti);vicino(totale(s,'kcal'),prima.kcal);
  assert.ok(s.every(x=>Number.isFinite(x.f)&&x.f>=x.lim[0]&&x.f<=x.lim[1]));
  assert.ok(totale(s,'fat')<=prima.fat+1e-6);assert.ok(totale(s,'protein')>=Math.min(prima.protein,target)-1e-6);
  assert.ok(totale(s,'fibre')>=Math.min(prima.fibre,limiti.fibraMinGiorno)-1e-6);
  assert.ok(totale(s,'salt')<=Math.max(prima.salt,limiti.saleMaxGiorno)+1e-6);assert.ok(totale(s,'satFat')<=Math.max(prima.satFat,limiti.satMaxGiorno)+1e-6);
 }
});
console.log(`${passati} controlli ingredienti/grassi superati`);
