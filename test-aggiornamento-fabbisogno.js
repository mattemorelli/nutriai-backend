// Esegue gli handler veri con database in memoria: nessun server o dato reale.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const fabbisogno = require('./fabbisogno');
const validazione = require('./validazione-profilo');
const validazioneTarget = require('./validazione-fabbisogno');
const sorgente = fs.readFileSync(require.resolve('./server'), 'utf8');
function contesto(percorso, opzioni = {}) {
  const dati = {
    users: [{ id: 'utente', sex: 'M', birth_year: new Date().getFullYear()-30, height_cm: 175,
      goal: 'mantenimento', occupation_level: 'sedentario', ...opzioni.profilo }],
    body_measurements: [{ user_id: 'utente', weight_kg: 78, body_fat_pct: null, ...opzioni.misura }],
    training_sessions: opzioni.sessioni || [], energy_targets: [], user_cuisine_preferences: [],
  };
  const scritture=[]; let generazioni=0;
  const supabase={from(tabella){
    assert.ok(Object.hasOwn(dati,tabella),'Tabella inattesa '+tabella);
    let mutazione=null, valore=null; const filtri=[];
    const q={select:()=>q,order:()=>q,limit:()=>q,
      eq:(k,v)=>{filtri.push(r=>r[k]===v);return q;},
      update:v=>{mutazione='update';valore=v;return q;},
      delete:()=>{mutazione='delete';return q;},
      insert:v=>{mutazione='insert';valore=v;return q;},
      upsert:v=>{mutazione='upsert';valore=v;return q;},
      single:()=>esegui(true),maybeSingle:()=>esegui(true),
      then:(ok,no)=>esegui(false).then(ok,no)};
    async function esegui(singola){
      if(opzioni.erroreTabella===tabella)return {data:null,error:{message:'rete interrotta'}};
      const righe=dati[tabella].filter(r=>filtri.every(f=>f(r)));
      if(mutazione){
        scritture.push({tabella,mutazione,valore});
        if(mutazione==='delete')dati[tabella]=dati[tabella].filter(r=>!righe.includes(r));
        if(mutazione==='insert')dati[tabella].push(...(Array.isArray(valore)?valore:[valore]));
        if(mutazione==='upsert')dati[tabella]=[valore];
        if(mutazione==='update')righe.forEach(r=>Object.assign(r,valore));
      }
      return {data:singola?righe[0]||null:righe,error:null};
    }
    return q;
  }};
  let handler;
  const da=sorgente.indexOf(`app.post('${percorso}'`), a=sorgente.indexOf('\n});',da)+5;
  assert.ok(da>=0&&a>da);
  vm.runInNewContext(sorgente.slice(da,a),{
    app:{post:(_,auth,fn)=>{handler=fn;}},richiedeAuth:()=>{},supabase,console,
    ...fabbisogno,...validazione,...validazioneTarget,
    GOAL_VALIDI:['dimagrimento','mantenimento','massa'],DIET_VALIDI:['onnivoro','vegetariano','vegano','pescetariano'],
    oggiLocale:()=>new Date().toISOString().slice(0,10),
    generaESalva:async()=>{generazioni++;return {plan_id:'sintetico'};},
  });
  return {dati,scritture,generazioni:()=>generazioni,async chiama(body){
    const risposta={statusCode:200,status(n){this.statusCode=n;return this;},json(d){this.body=d;return this;}};
    await handler({body,utente:{id:'utente'}},risposta);return risposta;
  }};
}
const onboarding={sex:'M',birth_year:new Date().getFullYear()-30,height_cm:175,weight_kg:78,goal:'mantenimento',occupation_level:'sedentario',cuisines:['europea'],training_sessions:[]};
test('onboarding: sport sconosciuto rifiutato prima di ogni scrittura',async()=>{
 const c=contesto('/onboarding');const r=await c.chiama({...onboarding,training_sessions:[{activity:'xxx',intensity:'moderata',minutes_per_week:60}]});
 assert.equal(r.statusCode,400);assert.equal(c.scritture.length,0);
});
test('onboarding: massa grassa fuori dal metodo rifiutata prima di scrivere',async()=>{
 const c=contesto('/onboarding');const r=await c.chiama({...onboarding,body_fat_pct:65});assert.equal(r.statusCode,400);assert.equal(c.scritture.length,0);
});
test('onboarding ripetuto senza sport cancella i vecchi allenamenti',async()=>{
 const c=contesto('/onboarding',{sessioni:[{user_id:'utente',activity:'pesi',intensity:'moderata',minutes_per_week:180}]});
 const r=await c.chiama(onboarding);assert.equal(r.statusCode,200);assert.equal(c.dati.training_sessions.length,0);assert.equal(r.body.kcal,2593);assert.equal(c.generazioni(),1);
});
test('errore nel salvataggio degli allenamenti ferma target e generazione',async()=>{
 const c=contesto('/onboarding',{erroreTabella:'training_sessions'});const r=await c.chiama(onboarding);
 assert.equal(r.statusCode,500);assert.equal(c.dati.energy_targets.length,0);assert.equal(c.generazioni(),0);
});
test('peso: rivalida il dimagrimento prima di scrivere la misura',async()=>{
 const c=contesto('/peso',{profilo:{goal:'dimagrimento',height_cm:190}});const r=await c.chiama({weight_kg:50});
 assert.equal(r.statusCode,400);assert.equal(r.body.motivo,'bmi_basso');assert.equal(c.scritture.length,0);
});
test('peso: aggiorna il fabbisogno per le generazioni successive',async()=>{
 const c=contesto('/peso');const r=await c.chiama({weight_kg:85});assert.equal(r.statusCode,200);
 assert.equal(c.dati.body_measurements[0].weight_kg,85);assert.ok(r.body.target.kcal>2593);assert.equal(c.dati.energy_targets.length,1);
});
test('profilo: sola altezza controllata contro il goal gia salvato',async()=>{
 const c=contesto('/profilo',{profilo:{goal:'dimagrimento'},misura:{weight_kg:60}});const r=await c.chiama({height_cm:210});
 assert.equal(r.statusCode,400);assert.equal(c.scritture.length,0);
});
test('profilo: cambio obiettivo ricalcola il target',async()=>{
 const c=contesto('/profilo');const r=await c.chiama({goal:'massa'});assert.equal(r.statusCode,200);assert.ok(r.body.target.kcal>2593);assert.equal(c.dati.users[0].goal,'massa');
});
for(const tabella of ['users','body_measurements','training_sessions'])for(const route of ['/peso','/profilo'])test(`${route}: errore ${tabella} non salva aggiornamenti`,async()=>{
 const c=contesto(route,{erroreTabella:tabella});const r=await c.chiama(route==='/peso'?{weight_kg:85}:{goal:'massa'});
 assert.equal(r.statusCode,500);assert.equal(c.scritture.length,0);
});
