const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {generaESalva}=require('./genera');
function barriera(){const chiamate=new Map();let automatica=false;function entra(nome,risultato,errore){return new Promise((ok,no)=>{const libera=()=>errore?no(errore):ok(risultato);chiamate.set(nome,libera);if(automatica)libera();});}return{chiamate,entra,libera(){automatica=true;for(const fn of chiamate.values())fn();}};}
test('generazione: cinque letture indipendenti avviate prima della prima risposta; errore profilo conservato',async()=>{
 const b=barriera(),client={from(t){const risultato=t==='users'?{data:null,error:{message:'rete interrotta'}}:{data:t==='plans'||t==='energy_targets'?null:[],error:null};const q={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,maybeSingle:()=>q,then:(ok,no)=>b.entra(t,risultato).then(ok,no),insert:()=>assert.fail('Scrittura vietata')};return q;}};
 const esito=generaESalva(client,'u',2026,{salva:false});let errore;
 try{await new Promise(setImmediate);assert.deepEqual([...b.chiamate.keys()].sort(),['energy_targets','meal_outcomes','plans','user_cuisine_preferences','users']);}catch(e){errore=e;}finally{b.libera();await assert.rejects(esito,/lettura users: rete interrotta/);}if(errore)throw errore;
});
test('Swap: catalogo vincoli ed esiti letti insieme e primo errore propagato',async()=>{
 const b=barriera(),sentinella=new Error('catalogo non leggibile');
 const stub={FAMIGLIE_PER_CUCINA:{europea:['mediterranea']},GENERICI:[],QUOTE:{},caricaPiatti:()=>b.entra('piatti',null,sentinella),caricaVincoli:()=>b.entra('vincoli',{ammesso:()=>true,gradito:()=>true,categorieVietate:new Set()}),caricaEsiti:()=>b.entra('esiti',{rifiutato:()=>false})};
 const data={plan_items:[{id:'r',plan_id:'p',day_of_week:1,meal:'pranzo',slot:'primo',dish_id:'d',stato:'previsto'}],plans:[{id:'p',user_id:'u',energy_target_id:'t'}],users:[{id:'u',diet:'onnivoro',evening_minutes:35}],energy_targets:[{id:'t',user_id:'u',kcal:2000,protein_g_min:85}],user_cuisine_preferences:[]};
 const client={from(t){const filtri=[];const risultato=one=>({data:one?data[t].find(r=>filtri.every(f=>f(r)))||null:data[t].filter(r=>filtri.every(f=>f(r))),error:null});const q={select:()=>q,eq:(k,v)=>{filtri.push(r=>r[k]===v);return q;},order:()=>q,range:()=>q,limit:()=>q,single:async()=>risultato(true),maybeSingle:async()=>risultato(true),then:(ok,no)=>Promise.resolve(risultato(false)).then(ok,no)};return q;}};
 const modulo={exports:{}};vm.runInNewContext(fs.readFileSync(require.resolve('./sostituisci'),'utf8'),{module:modulo,console,require:n=>n==='./genera'?stub:require(n)});
 const esito=modulo.exports.trovaProposte(client,'u','r');let errore;
 try{await new Promise(setImmediate);assert.deepEqual([...b.chiamate.keys()].sort(),['esiti','piatti','vincoli']);}catch(e){errore=e;}finally{b.libera();await assert.rejects(esito,e=>e===sentinella);}if(errore)throw errore;
});
