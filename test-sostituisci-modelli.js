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

test('le proposte preservano il piatto unico anche se l originale e sotto la soglia del pool', async () => {
  const c = contesto(); const r = await c.api.trovaProposte(c.supabase, 'utente', 'riga');
  assert.deepEqual(Array.from(r.proposte, p => p.dish_id), ['altro-unico']);
});

test('il client non puo aggirare le proposte e togliere proteine o verdure prima della scrittura', async () => {
  const c = contesto();
  await assert.rejects(c.api.applicaSostituzione(c.supabase, 'utente', 'riga', 'pasta', 300), /componente del pasto/);
  assert.equal(c.scritture(), 0);
});

for(const tabella of ['plan_items','users','plans','energy_targets','user_cuisine_preferences'])test(`Swap: errore ${tabella} interrompe le proposte`,async()=>{
 const c=contesto({erroreTabella:tabella});await assert.rejects(c.api.trovaProposte(c.supabase,'utente','riga'));assert.equal(c.scritture(),0);
});
for(const porzione of [-1,0,NaN,Infinity,10000,'300'])test(`Swap: porzione ${porzione} rifiutata prima di scrivere`,async()=>{
 const c=contesto();await assert.rejects(c.api.applicaSostituzione(c.supabase,'utente','riga','altro-unico',porzione),/Porzione/);assert.equal(c.scritture(),0);
});
test('Swap non supera il tempo scelto nemmeno all ultimo giro',async()=>{
 const c=contesto({modifica:(d,ps)=>{d.users[0].evening_minutes=10;d.plan_items[0].meal='cena';ps[2].prep_min=25;}});
 const r=await c.api.trovaProposte(c.supabase,'utente','riga');assert.equal(r.proposte.length,0);
 await assert.rejects(c.api.applicaSostituzione(c.supabase,'utente','riga','altro-unico',350),/tempo/);assert.equal(c.scritture(),0);
});
test('Swap a pranzo da portare: nessuna proposta non trasportabile',async()=>{
 const c=contesto({modifica:d=>{d.users[0].lunch_away=true;}});const r=await c.api.trovaProposte(c.supabase,'utente','riga');assert.equal(r.proposte.length,0);
});
test('Swap non propone porzioni fuori dai tetti per pareggiare calorie',async()=>{
 const c=contesto({modifica:(d,ps)=>{ps[2].kcal=50;}});const r=await c.api.trovaProposte(c.supabase,'utente','riga');assert.equal(r.proposte.length,0);
});
test('Swap senza ingredienti non salva una riga a zero calorie',async()=>{
 const c=contesto();await assert.rejects(c.api.applicaSostituzione(c.supabase,'utente','riga','altro-unico',350),/Ingredienti/);assert.equal(c.scritture(),0);
});

for(const [nome,campo,valore]of [['proteine','protein',1],['fibra','fibre',0],['sale','salt',10],['saturi','satFat',40]])test(`Swap: proposte che peggiorano ${nome} escluse`,async()=>{
 const c=contesto({modifica:(d,ps)=>{ps[2][campo]=valore;}});const r=await c.api.trovaProposte(c.supabase,'utente','riga');assert.equal(r.proposte.length,0);
});
test('Swap valido ricalcola i nutrienti e salva una sola riga',async()=>{
 const c=contesto({modifica:d=>{d.dish_ingredients.push({dish_id:'altro-unico',grams:350,foods:{kcal_100g:500/3.5,protein_100g:40/3.5,fibre_100g:6/3.5,sat_fat_100g:2/3.5,salt_100g:1/3.5}});}});
 const r=await c.api.applicaSostituzione(c.supabase,'utente','riga','altro-unico',350);assert.ok(r.ok);assert.equal(c.scritture(),1);
});
test('Swap: conferma manuale che peggiora le proteine viene fermata',async()=>{
 const c=contesto({modifica:d=>{d.dish_ingredients.push({dish_id:'altro-unico',grams:350,foods:{kcal_100g:500/3.5,protein_100g:1,fibre_100g:6/3.5,sat_fat_100g:2/3.5,salt_100g:1/3.5}});}});
 await assert.rejects(c.api.applicaSostituzione(c.supabase,'utente','riga','altro-unico',350),/bilanciamento/);assert.equal(c.scritture(),0);
});

test('Swap controlla il tempo complessivo del pasto, non soltanto la singola ricetta',async()=>{
 const c=contesto({modifica:(d,p)=>{p[2].prep_min=30;p.push({id:'verdure',meal_slot:'contorno',prep_min:15,ruoli_coperti:['verdura']});d.plan_items.push({...d.plan_items[0],id:'contorno',slot:'contorno',dish_id:'verdure',kcal:100,protein_g:0});}});
 const r=await c.api.trovaProposte(c.supabase,'utente','riga');assert.equal(r.proposte.length,0);
});

for(const [nome,campo,valore]of [['frutta secca','grammiFruttaSecca',80],['grassi','fat',45]])test(`Swap: ${nome} protetti nelle proposte e nella conferma diretta`,async()=>{
 const c=contesto({modifica:(d,ps)=>{ps[2][campo]=valore;}});
 const r=await c.api.trovaProposte(c.supabase,'utente','riga');assert.equal(r.proposte.length,0);
 await assert.rejects(c.api.applicaSostituzione(c.supabase,'utente','riga','altro-unico',350),e=>e.code==='quantita_giornaliere');assert.equal(c.scritture(),0);
});
test('Swap: controllo frutta secca sulla porzione scelta e non sul peso base',async()=>{
 const c=contesto({modifica:(d,ps)=>{ps[2].grammiFruttaSecca=25;}});
 await assert.rejects(c.api.applicaSostituzione(c.supabase,'utente','riga','altro-unico',700),e=>e.code==='quantita_giornaliere');assert.equal(c.scritture(),0);
});
test('Swap: metadati incompleti non autorizzano un cambiamento non verificato',async()=>{
 const c=contesto({modifica:(d,ps)=>{ps[2].fat=null;}});const r=await c.api.trovaProposte(c.supabase,'utente','riga');assert.equal(r.proposte.length,0);
 await assert.rejects(c.api.applicaSostituzione(c.supabase,'utente','riga','altro-unico',350),e=>e.code==='quantita_giornaliere');assert.equal(c.scritture(),0);
});
