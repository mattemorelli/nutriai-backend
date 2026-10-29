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
    training_sessions: opzioni.sessioni || [], energy_targets: [], user_cuisine_preferences: [], user_constraints: [],
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
  supabase.rpc=async(nome,args)=>{
    if(nome==='quadrio_contesto_generazione_v2')return {data:{versione:'1',catalogo_id:'00000000-0000-4000-8000-000000000099',catalogo_versione:'1'},error:null};
    assert.ok(['quadrio_salva_fabbisogno_v1','quadrio_salva_onboarding_v1'].includes(nome));assert.equal(args.p_user_id,'utente');
    assert.equal(args.p_target.user_id,'utente');
    if(nome==='quadrio_salva_fabbisogno_v1')assert.ok(args.p_attese.profilo&&args.p_attese.sport);
    else assert.equal(args.p_contesto.versione,'1');
    if(opzioni.erroreRpc)return {error:{code:opzioni.erroreRpc,message:'errore transazione'}};
    const nuove=structuredClone(dati);
    Object.assign(nuove.users[0],args.p_profilo);
    if(args.p_misura)nuove.body_measurements=[{user_id:'utente',...args.p_misura}];
    if(nome==='quadrio_salva_onboarding_v1'){nuove.training_sessions=args.p_sport.map(t=>({user_id:'utente',...t}));nuove.user_cuisine_preferences=args.p_preferenze.map((c,i)=>({user_id:'utente',cucina:c,rank:i+1}));nuove.user_constraints.push(...args.p_vincoli);}
    nuove.energy_targets.push(args.p_target);
    for(const k of Object.keys(dati))dati[k]=nuove[k];
    scritture.push({tabella:'rpc',mutazione:'transazione'});return {data:{ok:true,target_id:'target-nuovo'},error:null};
  };
  let handler;
  const da=sorgente.indexOf(`app.post('${percorso}'`), a=sorgente.indexOf('\n});',da)+5;
  assert.ok(da>=0&&a>da);
  vm.runInNewContext(sorgente.slice(da,a),{
    app:{post:(_,auth,fn)=>{handler=fn;}},richiedeAuth:()=>{},supabase,console,
    ...fabbisogno,...validazione,...validazioneTarget,...require('./onboarding'),...require('./validazione-scelte'),
    GOAL_VALIDI:['dimagrimento','mantenimento','massa'],DIET_VALIDI:['onnivoro','vegetariano','vegano','pescetariano'],
    KIND_VALIDI:['allergia','intolleranza','non_gradito'],eSanitario:k=>['allergia','intolleranza'].includes(k),consensoAttivo:async()=>true,
    risolviERighe:opzioni.risolviERighe||(()=>Promise.resolve([])),
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

for(const route of ['/peso','/profilo'])for(const code of ['PT409','40001','XX000'])test(`${route}: errore atomico ${code} non lascia dati parziali`,async()=>{
 const c=contesto(route,{erroreRpc:code}),prima=structuredClone(c.dati);
 const r=await c.chiama(route==='/peso'?{weight_kg:85}:{goal:'massa',diet:'vegano'});
 assert.equal(r.statusCode,code==='XX000'?500:409);assert.deepEqual(c.dati,prima);assert.equal(c.scritture.length,0);
});

test('onboarding: esclusione irrisolta rifiutata prima di modificare profilo o peso',async()=>{
 const c=contesto('/onboarding',{risolviERighe:async()=>{throw require('./vincoli-verificabili').erroreVincoliNonVerificabili();}}),prima=structuredClone(c.dati);
 const r=await c.chiama({...onboarding,constraints:[{kind:'allergia',subject:'voce non riconosciuta',severity:'assoluto'}]});
 assert.equal(r.statusCode,422);assert.equal(r.body.errore,'vincoli_non_verificabili');assert.equal(c.scritture.length,0);assert.deepEqual(c.dati,prima);
});
for(const constraints of [null,'glutine',[null],[{kind:'allergia'}],Array.from({length:41},()=>({kind:'allergia',subject:'glutine'}))])test('onboarding: vincoli malformati o troppi non vengono ignorati',async()=>{
 const c=contesto('/onboarding'),r=await c.chiama({...onboarding,constraints});assert.equal(r.statusCode,400);assert.equal(c.scritture.length,0);
});

for(const [code,status] of [['PT409',409],['PT403',403],['57014',503],['XX000',500]])test('onboarding: transazione '+code+' non lascia un profilo parziale',async()=>{
 const c=contesto('/onboarding',{erroreRpc:code}),prima=structuredClone(c.dati);const r=await c.chiama(onboarding);
 assert.equal(r.statusCode,status);assert.deepEqual(c.dati,prima);assert.equal(c.scritture.length,0);assert.equal(c.generazioni(),0);
});
test('onboarding: preferenze duplicate rifiutate prima delle scritture',async()=>{const c=contesto('/onboarding'),r=await c.chiama({...onboarding,cuisines:['europea','europea']});assert.equal(r.statusCode,400);assert.equal(c.scritture.length,0);});

for(const route of ['/onboarding','/profilo'])for(const bad of [{diet:'vegan'},{diet:null},{evening_minutes:0},{evening_minutes:'abc'},{evening_minutes:15.5},{household_size:1.5},{household_size:true},{lunch_away:'false'},{paesi:'italia'}])test(route+': scelta dichiarata invalida '+JSON.stringify(bad)+' non viene sostituita da un default',async()=>{
 const c=contesto(route),prima=structuredClone(c.dati),r=await c.chiama(route==='/onboarding'?{...onboarding,...bad}:bad);assert.equal(r.statusCode,400);assert.equal(r.body.errore,'scelte_non_valide');assert.deepEqual(c.dati,prima);assert.equal(c.scritture.length,0);
});
test('profilo: lunch_away cambia davvero il dato e annulla la vecchia griglia',async()=>{const c=contesto('/profilo',{profilo:{lunch_away:true,pasti_casa:{1:{pranzo:false,cena:true}}}}),r=await c.chiama({lunch_away:false});assert.equal(r.statusCode,200);assert.equal(c.dati.users[0].lunch_away,false);assert.equal(c.dati.users[0].pasti_casa,null);});
