// Prova il comando reale con dipendenze sostituite prima di caricarlo:
// nessuna chiave, nessuna connessione e nessuna ricetta inventata.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const sorgente=fs.readFileSync(path.join(__dirname,'scripts/verifica-matrice-vincoli-estesa.js'),'utf8');
let verifiche=0;
function ambiente(risposta=()=>({errore:'piano_impossibile',vincolo_bloccante:'non_identificato',diagnostica:[{gradino:'0'}]})){
 const statistiche={client:0,generazioni:0,log:[],errori:[]},module={exports:{}},processo={argv:['node','matrice'],env:{}};
 const genera={
  caricaPiatti:async()=>[],
  async generaESalva(c,id,seed,opzioni){
   statistiche.generazioni++;
   assert.equal(opzioni.salva,false);
   assert.equal(opzioni.tempoMassimoMs,-1);
   assert.equal(seed,2026);
   const {data:utente}=await c.from('users').select('*').maybeSingle();
   assert.ok(['onnivoro','pescetariano','vegetariano','vegano'].includes(utente.diet));
   assert.throws(()=>c.from('users').insert({}),/Scrittura proibita/);
   return risposta(statistiche.generazioni);
  },
  caricaVincoli(){throw new Error('Una risposta fallita non deve essere validata come piano');},
  limitiDi(){throw new Error('Nessuna porzione in una risposta fallita');},
 };
 const richiedi=nome=>{
  if(nome==='dotenv')return {config(){}};
  if(nome==='node:assert/strict')return assert;
  if(nome==='../genera')return genera;
  if(nome==='@supabase/supabase-js')return {createClient(){statistiche.client++;return {from(){throw new Error('Rete proibita nella verifica del contratto');}};}};
  throw new Error('Dipendenza inattesa: '+nome);
 };
 vm.runInNewContext(sorgente,{require:richiedi,module,process:processo,console:{log:s=>statistiche.log.push(s),error:s=>statistiche.errori.push(s)}},{filename:'verifica-matrice-vincoli-estesa.js'});
 return {...module.exports,processo,statistiche};
}
function prova(nome,fn){return Promise.resolve().then(fn).then(()=>{verifiche++;console.log('OK '+nome);});}
(async()=>{
 const {leggiMinRiuscite}=ambiente();
 for(const [argomenti,atteso]of [[[],0],[['--min-riuscite','14'],14],[['--min-riuscite=32'],32],[['--min-riuscite','0'],0]])
  await prova('parser '+JSON.stringify(argomenti),()=>assert.equal(leggiMinRiuscite(argomenti),atteso));
 for(const argomenti of [['--min-riuscite'],['--min-riuscite='],['--min-riuscite','-1'],['--min-riuscite','33'],['--min-riuscite','1.5'],['--min-riuscite','1e1'],['--min-riuscite','NaN'],['--min-riuscite','Infinity'],['--min-riuscite','14x'],['--min-riuscite','14','--min-riuscite','14'],['--ignota']])
  await prova('rifiuta input '+JSON.stringify(argomenti),()=>assert.throws(()=>leggiMinRiuscite(argomenti)));
 await prova('input errato fermato prima di inizializzare il client',async()=>{
  const a=ambiente();await assert.rejects(a.verificaMatrice(['--min-riuscite','33']),/intero tra 0 e 32/);assert.equal(a.statistiche.client,0);assert.equal(a.statistiche.generazioni,0);
 });
 await prova('32 fallimenti espliciti restano distinti da 32 piani riusciti',async()=>{
  const a=ambiente(),r=await a.verificaMatrice([]);
  assert.equal(a.statistiche.generazioni,32);assert.equal(r.casi_eseguiti,32);assert.equal(r.riusciti,0);assert.equal(r.non_completati,32);assert.equal(r.violazioni_rilevate,0);assert.equal(r.errori,0);assert.equal(a.processo.exitCode,undefined);
  assert.equal(r.casi[0].vincolo_bloccante,'non_identificato');assert.equal(r.casi[0].diagnostica[0].gradino,'0');assert.equal(r.casi.every(c=>c.esito==='non_completato'),true);
 });
 await prova('soglia di disponibilita blocca il falso verde con 32 fallimenti',async()=>{
  const a=ambiente(),r=await a.verificaMatrice(['--min-riuscite','14']);assert.equal(r.soglia_raggiunta,false);assert.equal(r.min_riuscite,14);assert.equal(a.processo.exitCode,1);assert.match(a.statistiche.errori.at(-1),/0\/14/);
  const json=a.statistiche.log.find(s=>s.startsWith('MATRICE_JSON '));assert.deepEqual(JSON.parse(json.slice('MATRICE_JSON '.length)),JSON.parse(JSON.stringify(r)));
 });
 await prova('contratto di errore malformato non viene contato come non completato sicuro',async()=>{
  const a=ambiente(()=>({errore:'piano_impossibile',vincolo_bloccante:'non_identificato',righe:[]})),r=await a.verificaMatrice([]);
  assert.equal(r.non_completati,0);assert.equal(r.violazioni_rilevate,32);assert.equal(r.errori,0);assert.equal(r.casi.every(c=>c.esito==='violazione'),true);assert.equal(a.processo.exitCode,1);
 });
 await prova('eccezioni distinte da violazioni dei piani e dai fallimenti espliciti',async()=>{
  const a=ambiente(()=>{throw new Error('Catalogo non disponibile');}),r=await a.verificaMatrice([]);
  assert.equal(r.non_completati,0);assert.equal(r.violazioni_rilevate,0);assert.equal(r.errori,32);assert.equal(r.casi.every(c=>c.esito==='errore'),true);assert.equal(a.processo.exitCode,1);
 });
 console.log(`${verifiche} verifiche del contratto della matrice superate senza rete.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
