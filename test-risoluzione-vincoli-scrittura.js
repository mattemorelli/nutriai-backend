const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {risolviSubject}=require('./genera');const helper=require('./vincoli-verificabili');
const fixture=require('./test/fixtures/amido-canonico.json').tabelle;
const foodIdPerCategoria=new Map();for(const c of fixture.categorie_alimenti){if(!foodIdPerCategoria.has(c.categoria))foodIdPerCategoria.set(c.categoria,[]);foodIdPerCategoria.get(c.categoria).push(c.food_id);}
const source=fs.readFileSync(require.resolve('./server'),'utf8');const a=source.indexOf('async function risolviERighe'),b=source.indexOf('async function ultimoConsenso',a);
const ctx={...helper,risolviSubject,caricaCatalogoPerRisoluzione:async()=>({foods:fixture.foods,mappaAlias:new Map(),foodIdPerCategoria})};vm.createContext(ctx);vm.runInContext(source.slice(a,b),ctx);
for(const kind of ['allergia','intolleranza','non_gradito'])test('scrittura esclusione assoluta sconosciuta bloccata: '+kind,async()=>{
 await assert.rejects(ctx.risolviERighe([{kind,subject:'sconosciuto_regressione',severity:'assoluto'}],'utente',{}),e=>e.code==='vincoli_non_verificabili');
});
test('preferenza facoltativa sconosciuta mantenuta come tale',async()=>{const rs=await ctx.risolviERighe([{kind:'non_gradito',subject:'sconosciuto_regressione',severity:'preferibile'}],'utente',{});assert.equal(rs.length,1);assert.equal(rs[0].food_id,null);});
test('riferimento alimentare reale risolto normalmente',async()=>{const f=fixture.foods.find(f=>f.name_it);const rs=await ctx.risolviERighe([{kind:'non_gradito',subject:f.name_it,severity:'assoluto'}],'utente',{});assert.ok(rs.some(r=>r.food_id===f.id));});

test('alias di categoria svuotata rifiutato prima della scrittura',async()=>{
 const vecchio=ctx.caricaCatalogoPerRisoluzione;
 // Il formato degli alias e' lo stesso della tabella: alias -> codice.
 ctx.caricaCatalogoPerRisoluzione=async()=>({foods:fixture.foods,mappaAlias:new Map([['zz gruppo vuoto','gruppo_vuoto']]),foodIdPerCategoria:new Map()});
 try{await assert.rejects(ctx.risolviERighe([{kind:'non_gradito',subject:'zz gruppo vuoto',severity:'assoluto'}],'utente',{}),e=>e.code==='vincoli_non_verificabili');}finally{ctx.caricaCatalogoPerRisoluzione=vecchio;}
});
