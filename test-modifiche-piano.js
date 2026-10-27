const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { preservaRuoliDelPasto } = require('./modelli-pasto');

function contesto(opzioni = {}) {
  const originale = { id: 'unico', name: 'Piatto unico', fat:10, grammiFruttaSecca:0, meal_slot: 'primo', health_score: 6.5, protein: 40, fibre: 6, satFat: 2, salt: 1,
    ruoli_coperti: ['proteina_principale', 'base_amidacea', 'verdura'], paese: 'italia', prep_min: 20, grams: 350, kcal: 500 };
  const incompleto = { id: 'pasta', name: 'Pasta', meal_slot: 'primo', health_score: 8,
    ruoli_coperti: ['base_amidacea'], paese: 'italia', prep_min: 20, kcal: 400, grams: 300 };
  const completo = { ...originale, id: 'altro-unico', health_score: 8, kcal: 500, grams: 350 };
  const piatti = [originale, incompleto, completo];
  const dataset = { plans: [{ id: 'piano', user_id: 'utente' }],
    plan_items: [{ id: 'riga', plan_id: 'piano', day_of_week: 1, meal: 'pranzo', slot: 'primo', dish_id: 'unico', portion_g:350, kcal: 500, protein_g: 40, fibre_g: 6, sat_fat_g: 2, salt_g: 1 }],
    energy_targets: [{ kcal: 2400, protein_g_min: 95, user_id: 'utente' }],
    users: [{ id: 'utente', diet: 'onnivoro', evening_minutes: 35, paesi: ['italia'] }],
    user_cuisine_preferences: [], dish_ingredients: [], dishes: piatti };
  opzioni.modifica?.(dataset, piatti);
  let scritture = 0;
  const supabase = { rpc: async (nome, args) => {if(opzioni.erroreRpc)return {data:null,error:opzioni.erroreRpc};assert.equal(nome,'quadrio_modifica_piano_v1');scritture++;for(const m of args.p_modifiche)Object.assign(dataset.plan_items.find(r=>r.id===m.id),m.patch);return {data:{ok:true},error:null};}, from(tabella) {
    assert.ok(Object.hasOwn(dataset, tabella));
    const filtri = [];
    const dati = () => dataset[tabella].filter(r => filtri.every(f => f(r)));
    const errore = tabella === opzioni.erroreTabella ? { message: 'rete interrotta' } : null;
    const q = { range: () => q, order: () => q, limit: () => q, select: () => q, eq: (k, v) => { filtri.push(r => r[k] === v); return q; },
      neq: (k, v) => { filtri.push(r => r[k] !== v); return q; },
      single: async () => ({ data: errore ? null : dati()[0], error: errore }), maybeSingle: async () => ({ data: errore ? null : dati()[0], error: errore }),
      then: (resolve, reject) => Promise.resolve({ data: errore ? null : dati(), error: errore }).then(resolve, reject),
      update: () => { scritture++; return q; } };
    return q;
  } };
  const deps = { QUOTE: {}, limitiDi: () => [0.5, 2], caricaPiatti: async () => [incompleto, completo],
    caricaPiattiPerId: async (_, ids) => piatti.filter(p => ids.includes(p.id)),
    FAMIGLIE_PER_CUCINA: { europea: ['mediterranea'] }, GENERICI: [],
    caricaVincoli: async () => ({ ammesso: opzioni.ammesso || (() => true), gradito: () => true, categorieVietate: new Set(), foodIdVietati: new Set() }),
    caricaEsiti: async () => ({ rifiutato: () => false }), accompagnaBene: () => true,
    sostitutoSenzaGlutineNonRichiesto: () => false };
  const m = { exports: {} };
  vm.runInNewContext(fs.readFileSync(require.resolve('./sostituisci'), 'utf8'), {
    module: m, console, require: name => {
      if (name === './genera') return deps;
      if (name === './modifiche-piano') return require('./modifiche-piano');
      if (name === './vincoli-swap') return require('./vincoli-swap');
      assert.equal(name, './modelli-pasto'); return { preservaRuoliDelPasto };
    },
  });
  return { api: m.exports, supabase, dataset, piatti, scritture: () => scritture };
}


const {leggiRighePiano,riepilogoNutrizionale,settimanaPreservata}=require('./modifiche-piano');
function conDueGiorni(opzioni={}){
 return contesto({...opzioni,modifica:(d,p)=>{
  Object.assign(d.plan_items[0],{portion_g:350,stato:'previsto',avanzi:false,bloccato:false});
  d.plan_items.push({...d.plan_items[0],id:'seconda',day_of_week:2,dish_id:'altro-unico'});
  opzioni.modifica?.(d,p);
 }});
}
test('spostamento valido: una sola operazione atomica per entrambe le righe',async()=>{
 const c=conDueGiorni();const r=await c.api.spostaGiorno(c.supabase,'utente','riga',2);assert.ok(r.scambiato);assert.equal(c.scritture(),1);
 assert.equal(c.dataset.plan_items[0].day_of_week,2);assert.equal(c.dataset.plan_items[1].day_of_week,1);
});
for(const giorno of [-1,0,8,1.5,'2',null])test(`spostamento giorno non valido ${giorno}: nessuna scrittura`,async()=>{
 const c=conDueGiorni();await assert.rejects(c.api.spostaGiorno(c.supabase,'utente','riga',giorno),e=>e.status===400);assert.equal(c.scritture(),0);
});
for(const [nome,modifica]of [
 ['piatto bloccato',d=>{d.plan_items[0].bloccato=true;}],
 ['unica controparte bloccata',d=>{d.plan_items[1].bloccato=true;}],
 ['piatto saltato',d=>{d.plan_items[0].stato='saltato';}],
 ['piatto avanzo',d=>{d.plan_items[0].avanzi=true;}],
 ['nessuna controparte',d=>{d.plan_items.pop();}],
 ['composizione persa',d=>{d.plan_items[1].dish_id='pasta';}],
 ['calorie peggiorate',d=>{d.plan_items[1].kcal=100;}],
 ['proteine peggiorate',d=>{d.plan_items[1].protein_g=1;}],
 ['trasporto mancante',d=>{d.users[0].lunch_away=true;}],
 ['avanzi dipendenti',d=>{d.plan_items.push({...d.plan_items[0],id:'avanzo',day_of_week:3,avanzi:true});}],
])test(`spostamento rifiuta ${nome} senza cambiare righe`,async()=>{
 const c=conDueGiorni({modifica});const prima=JSON.stringify(c.dataset.plan_items);await assert.rejects(c.api.spostaGiorno(c.supabase,'utente','riga',2));assert.equal(c.scritture(),0);assert.equal(JSON.stringify(c.dataset.plan_items),prima);
});
test('spostamento da weekend a feriale rivalida il tempo',async()=>{
 const c=conDueGiorni({modifica:(d,p)=>{d.plan_items[0].day_of_week=6;d.plan_items.forEach(r=>r.meal='cena');d.users[0].evening_minutes=20;p[0].prep_min=50;}});
 await assert.rejects(c.api.spostaGiorno(c.supabase,'utente','riga',2),e=>e.code==='spostamento_non_compatibile');assert.equal(c.scritture(),0);
});
test('conflitto concorrente: errore 409 e nessuna modifica parziale',async()=>{
 const c=conDueGiorni({erroreRpc:{code:'40001',message:'conflitto'}});const prima=JSON.stringify(c.dataset.plan_items);
 await assert.rejects(c.api.spostaGiorno(c.supabase,'utente','riga',2),e=>e.status===409&&e.code==='piano_modificato');assert.equal(c.scritture(),0);assert.equal(JSON.stringify(c.dataset.plan_items),prima);
});
test('salto e ripristino conservano stato sostituito e data precedente',async()=>{
 const data='2026-10-26T10:00:00+00:00';const c=conDueGiorni({modifica:d=>{Object.assign(d.plan_items[0],{stato:'sostituito',modificato_il:data});}});
 await c.api.saltaPasto(c.supabase,'utente','riga');assert.equal(c.dataset.plan_items[0].stato,'saltato');
 await c.api.saltaPasto(c.supabase,'utente','riga');assert.equal(c.scritture(),1,'salto idempotente');
 const r=await c.api.saltaPasto(c.supabase,'utente','riga',true);assert.equal(r.stato,'sostituito');assert.equal(c.dataset.plan_items[0].modificato_il,data);assert.equal(c.dataset.plan_items[0].ripristino_salto,null);
});
test('ripristino di vecchio salto mantiene la provenienza della sostituzione',async()=>{
 const c=conDueGiorni({modifica:d=>{Object.assign(d.plan_items[0],{stato:'saltato',sostituito_da_dish_id:'vecchio'});}});await c.api.saltaPasto(c.supabase,'utente','riga',true);assert.equal(c.dataset.plan_items[0].stato,'sostituito');
});
test('ripristino vietato dopo una nuova allergia',async()=>{
 const c=conDueGiorni({modifica:d=>{d.plan_items[0].stato='saltato';},ammesso:()=>false});await assert.rejects(c.api.saltaPasto(c.supabase,'utente','riga',true),e=>e.code==='piatto_non_ammesso');assert.equal(c.scritture(),0);
});
test('saltare la preparazione di un avanzo attivo viene fermato',async()=>{
 const c=conDueGiorni({modifica:d=>{d.plan_items[1].dish_id='unico';d.plan_items[1].avanzi=true;}});
 await assert.rejects(c.api.saltaPasto(c.supabase,'utente','riga'),e=>e.code==='avanzi_collegati');assert.equal(c.scritture(),0);
 await c.api.saltaPasto(c.supabase,'utente','seconda');await c.api.saltaPasto(c.supabase,'utente','riga');assert.equal(c.scritture(),2);
});
test('riepilogo distingue previsto da incluso, senza attribuire consumo reale',()=>{
 const c=conDueGiorni();let r=riepilogoNutrizionale(c.dataset.plan_items,{kcal:500,protein_g_min:40});assert.equal(r[0].incluso.kcal,500);
 c.dataset.plan_items[0].stato='saltato';r=riepilogoNutrizionale(c.dataset.plan_items,{kcal:500,protein_g_min:40});assert.equal(r[0].incluso.kcal,0);assert.equal(r[0].previsto.kcal,500);assert.equal(r[0].piatti_saltati,1);assert.ok(r[0].avvisi.includes('energia_fuori_target'));
});
test('frequenze: Swap non puo togliere un minimo gia raggiunto',()=>{
 const perId=new Map([['a',{ruoli_coperti:['proteina_principale'],gruppo:'legumi'}],['b',{ruoli_coperti:['proteina_principale'],gruppo:'pesce'}]]);
 const prima=[{dish_id:'a',day_of_week:1,meal:'pranzo'},{dish_id:'a',day_of_week:2,meal:'cena'}];const dopo=[prima[0],{...prima[1],dish_id:'b'}];
 assert.equal(settimanaPreservata(prima,dopo,perId,{legumi:{min:2,max:4},pesce:{min:0,max:2}}),false);
});
test('lettura completa del piano: paginazione stabile oltre mille righe',async()=>{
 const righe=Array.from({length:1003},(_,i)=>({id:String(i).padStart(5,'0')}));let chiamate=0;
 const client={from:()=>{const q={select:()=>q,eq:()=>q,order:k=>{assert.equal(k,'id');return q;},range:async(a,b)=>{chiamate++;return {data:righe.slice(a,b+1),error:null};}};return q;}};
 assert.equal((await leggiRighePiano(client,'piano')).length,1003);assert.equal(chiamate,3);
});

test('ripristino di avanzi senza preparazione attiva rifiutato',async()=>{
 const c=conDueGiorni({modifica:d=>{d.plan_items.forEach(r=>{r.stato='saltato';r.dish_id='unico';});d.plan_items[1].avanzi=true;}});
 await assert.rejects(c.api.saltaPasto(c.supabase,'utente','seconda',true),e=>e.code==='avanzi_collegati');assert.equal(c.scritture(),0);
});

test('spostamento non allunga oltre il budget la somma dei tempi del pasto',async()=>{
 const c=conDueGiorni({modifica:(d,p)=>{p[2].prep_min=30;p.push({id:'verdure',meal_slot:'contorno',prep_min:15,ruoli_coperti:['verdura']});d.plan_items.push({...d.plan_items[0],id:'contorno',slot:'contorno',dish_id:'verdure',kcal:100,protein_g:0});}});
 await assert.rejects(c.api.spostaGiorno(c.supabase,'utente','riga',2),e=>e.code==='spostamento_non_compatibile');assert.equal(c.scritture(),0);
});

for(const cambiato of [false,true])test(`ripristino tempo complessivo, altro piatto cambiato=${cambiato}`,async()=>{
 const c=conDueGiorni({modifica:(d,p)=>{p.push({id:'verdure',meal_slot:'contorno',prep_min:20,ruoli_coperti:['verdura']});d.plan_items.push({...d.plan_items[0],id:'contorno',slot:'contorno',dish_id:'verdure'});}});
 await c.api.saltaPasto(c.supabase,'utente','riga');
 if(cambiato){c.piatti.find(p=>p.id==='verdure').prep_min=35;await assert.rejects(c.api.saltaPasto(c.supabase,'utente','riga',true),e=>e.code==='ripristino_non_compatibile');}
 else{const r=await c.api.saltaPasto(c.supabase,'utente','riga',true);assert.equal(r.stato,'previsto');}
});

for(const [nome,campo,alto]of [['frutta secca','grammiFruttaSecca',80],['grassi','fat',40]])test(`spostamento conserva ${nome} anche nell'altra giornata`,async()=>{
 const c=conDueGiorni({modifica:(d,ps)=>{ps[0][campo]=alto;ps[2][campo]=0;}});const prima=JSON.stringify(c.dataset.plan_items);
 await assert.rejects(c.api.spostaGiorno(c.supabase,'utente','riga',2),e=>e.code==='spostamento_non_compatibile');assert.equal(c.scritture(),0);assert.equal(JSON.stringify(c.dataset.plan_items),prima);
});
