const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function contesto(opzioni={}){
 const dati={plans:[{id:'piano',user_id:'utente',week_start:'2026-10-26'}],users:[{id:'utente',household_size:2}],
  plan_items:[{id:'a',plan_id:'piano',dish_id:'piatto',day_of_week:1,portion_g:100,avanzi:false,stato:'previsto'},
    {id:'b',plan_id:'piano',dish_id:'piatto',day_of_week:2,portion_g:200,avanzi:true,stato:'previsto'}],
  dish_ingredients:[{dish_id:'piatto',food_id:'169736',grams:100,foods:{name:'Pasta',unita:'peso',reparto:'Pantry'}}],
  dishes:[{id:'piatto',name:'Pasta'}],pantry_items:[],scorte_settimana:[],impatto_categorie:[]};
 opzioni.modifica?.(dati);
 const supabase={from(tabella){assert.ok(Object.hasOwn(dati,tabella),tabella);const filtri=[];let inizio=0,fine=Infinity;
  const esito=()=>({data:opzioni.errore===tabella?null:dati[tabella].filter(r=>filtri.every(f=>f(r))).slice(inizio,fine),error:opzioni.errore===tabella?{message:'rete interrotta'}:null});
  const q={select:()=>q,order:()=>q,limit:n=>{fine=n;return q;},range:(a,b)=>{inizio=a;fine=b+1;return q;},eq:(k,v)=>{filtri.push(r=>r[k]===v);return q;},in:(k,vs)=>{filtri.push(r=>vs.includes(r[k]));return q;},
   single:async()=>{const r=esito();return {...r,data:r.data?.[0]};},maybeSingle:async()=>{const r=esito();return {...r,data:r.data?.[0]};},then:(a,b)=>Promise.resolve(esito()).then(a,b)};return q;}};
 const m={exports:{}};vm.runInNewContext(fs.readFileSync(require.resolve('./spesa'),'utf8'),{module:m,console,require:n=>{
  if(n==='./modifiche-piano'||n==='./ricette-salvate')return require(n);
  if(n==='./voto')return {lettera:()=>'',puntiCarbonio:()=>0};
  if(n==='./stagionalita')return {vociInStagione:()=>[]};
  if(n==='./sostituisci')return {trovaProposte:async()=>({proposte:[]})};throw Error(n);
 }});
 return {supabase,dati,lista:giorno=>m.exports.listaSpesa(supabase,'utente','piano',giorno)};
}
const grammi=r=>r.reparti.flatMap(r=>r.voci).reduce((s,v)=>s+v.grammi,0);
test('spesa: include le porzioni degli avanzi, scalate anche per la famiglia',async()=>{const c=contesto();assert.equal(grammi(await c.lista()),600);});
test('spesa: saltare e ripristinare una porzione modifica le quantita corrette',async()=>{
 const c=contesto();c.dati.plan_items[1].stato='saltato';assert.equal(grammi(await c.lista()),200);c.dati.plan_items[1].stato='previsto';assert.equal(grammi(await c.lista()),600);
});
test('spesa: anteprima di un giorno include anche il suo avanzo',async()=>{const c=contesto();assert.equal(grammi(await c.lista(2)),400);});
test('spesa: scambio di giorni conserva il totale settimanale e aggiorna il giorno',async()=>{
 const c=contesto();c.dati.plan_items[0].day_of_week=2;c.dati.plan_items[1].day_of_week=1;assert.equal(grammi(await c.lista()),600);assert.equal(grammi(await c.lista(2)),200);
});
for(const errore of ['plans','plan_items','users','dishes','dish_ingredients','pantry_items','scorte_settimana','impatto_categorie'])test(`spesa: errore ${errore} non diventa una lista apparentemente valida`,async()=>{const c=contesto({errore});await assert.rejects(c.lista());});
test('spesa: ingredienti assenti interrompono il calcolo',async()=>{const c=contesto({modifica:d=>{d.dish_ingredients=[];}});await assert.rejects(c.lista(),/non verificabili/);});
for(const tabella of ['pantry_items','scorte_settimana'])test('spesa: posseduto oltre mille righe in '+tabella+' non torna da comprare',async()=>{
 // Righe esclusivamente in memoria: non vengono scritti alimenti o scorte.
 const c=contesto({modifica:d=>{d[tabella]=Array.from({length:1000},(_,i)=>({user_id:'utente',plan_id:'piano',food_id:'fixture-memoria-'+i}));d[tabella].push({user_id:'utente',plan_id:'piano',food_id:'169736'});}});
 assert.equal(grammi(await c.lista()),0);
});
