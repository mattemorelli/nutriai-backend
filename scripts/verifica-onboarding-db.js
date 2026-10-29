// Account creati qui soltanto. Nessun alimento o piano reale modificato.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const {Client}=require('pg'),{createClient}=require('@supabase/supabase-js');
const {salvaDatiOnboarding}=require('../onboarding'),{dataLocale}=require('../date-locali');
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const pubblico=createClient(process.env.SUPABASE_URL,'sb_publishable_frEE9b_o3ueXffQVVwOMvg_Nl6qRoLy',{auth:{persistSession:false,autoRefreshToken:false}});
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
const creati=[],verifiche=[];let uid,args;
const check=(nome,condizione)=>{assert.ok(condizione,nome);verifiche.push(nome);console.log('OK '+nome);};
const contesto=async()=>{const r=await admin.rpc('quadrio_contesto_generazione_v1',{p_user_id:uid});assert.ifError(r.error);return r.data;};
const proxy=f=>({from:(...a)=>admin.from(...a),rpc:async(n,a)=>{if(n==='quadrio_salva_onboarding_v1'){args=a;await f(a);}return admin.rpc(n,a);}});
const dati=()=>({profilo:{sex:'M',birth_year:new Date().getFullYear()-30,height_cm:175,goal:'mantenimento',occupation_level:'sedentario',city:null,region_zone:null,pasti_casa:null,cook_days:[1,2,3,4,5,6,7],lunch_away:false,household_size:1,evening_minutes:35,diet:'onnivoro',paesi:['italia']},misura:{measured_on:dataLocale(),weight_kg:78,body_fat_pct:null,source:'utente'},sessioni:[],vincoli:[],preferenze:['europea']});
async function stato(){const out={};for(const t of ['users','body_measurements','training_sessions','activity_periods','user_constraints','user_cuisine_preferences','energy_targets','plans','consensi'])out[t]=(await db.query('select to_jsonb(t) as r from '+t+' t where '+(t==='users'?'id':'user_id')+'=$1 order by to_jsonb(t)::text',[uid])).rows.map(r=>r.r);out.contesto=await contesto();return out;}
(async()=>{await db.connect();try{
 for(let i=0;i<2;i++){const r=await admin.auth.admin.createUser({email:'onboarding-test-'+crypto.randomUUID()+'@nutriai-test.invalid',password:crypto.randomBytes(24).toString('hex'),email_confirm:true});assert.ifError(r.error);creati.push(r.data.user.id);}uid=creati[0];
 await db.query("insert into user_cuisine_preferences(user_id,cucina,rank) values($1,'usa',1)",[uid]);
 await db.query("insert into user_constraints(user_id,kind,subject,severity) values($1,'non_gradito','preferenza facoltativa preesistente','preferibile')",[uid]);
 const r=await salvaDatiOnboarding(proxy(async()=>{}),uid,dati());let s=await stato();
 check('profilo iniziale e target calcolato su nuovi dati salvati insieme',s.users[0].sex==='M'&&s.users[0].height_cm===175&&r.kcal===2593&&s.energy_targets.length===1&&Number(s.energy_targets[0].kcal)===r.kcal);
 check('peso del giorno salvato una sola volta',s.body_measurements.length===1&&Number(s.body_measurements[0].weight_kg)===78);
 check('cucine rimosse dalla nuova scelta non restano attive',s.user_cuisine_preferences.length===1&&s.user_cuisine_preferences[0].cucina==='europea');
 check('esclusioni preesistenti conservate',s.user_constraints.length===1&&s.user_constraints[0].subject==='preferenza facoltativa preesistente');
 const targetId=s.energy_targets[0].id;
 const piano=(await db.query('insert into plans(user_id,week_start,energy_target_id,corpus_version) values($1,current_date,$2,$3) returning id',[uid,targetId,'test-onboarding'])).rows[0].id;
 for(const [nome,modifica]of [
  ['errore tardivo target',a=>{a.p_target.confidence=null;a.p_profilo.height_cm=180;a.p_misura.weight_kg=85;a.p_sport=[{activity:'pesi',minutes_per_week:180,intensity:'moderata'}];a.p_preferenze=['asiatica'];}],
  ['target di altro proprietario',a=>a.p_target.user_id=creati[1]],['campo privilegio proibito',a=>a.p_profilo.is_pro=true],['preferenze duplicate',a=>a.p_preferenze=['europea','europea']],['allenamento frazionario',a=>a.p_sport=[{activity:'pesi',minutes_per_week:90.5,intensity:'moderata'}]],['vincolo di altro proprietario',a=>a.p_vincoli=[{user_id:creati[1],kind:'non_gradito',subject:'prova',severity:'preferibile'}]],
 ]){
  const prima=await stato(),a=structuredClone(args);a.p_contesto=await contesto();modifica(a);const errore=await admin.rpc('quadrio_salva_onboarding_v1',a);
  check(nome+' rifiutato',!!errore.error);assert.deepEqual(await stato(),prima);check(nome+': profilo peso sport preferenze target e versione intatti',true);
 }
 async function conflitto(nome,cambia,ripristina){let dopo;await assert.rejects(salvaDatiOnboarding(proxy(async()=>{await cambia();dopo=await stato();}),uid,dati()),e=>e.status===409&&e.code==='contesto_onboarding_modificato');assert.deepEqual(await stato(),dopo);check(nome+' concorrente non viene sovrascritto',true);if(ripristina)await ripristina();}
 await conflitto('profilo',()=>db.query('update users set height_cm=176 where id=$1',[uid]),()=>db.query('update users set height_cm=175 where id=$1',[uid]));
 await conflitto('allenamento',()=>db.query("insert into training_sessions(user_id,activity,minutes_per_week,intensity) values($1,'yoga',30,'leggera')",[uid]),()=>db.query('delete from training_sessions where user_id=$1',[uid]));
 await conflitto('PAL',()=>db.query('insert into activity_periods(user_id,pal,valid_from) values($1,1.4,current_date)',[uid]),()=>db.query('delete from activity_periods where user_id=$1',[uid]));
 await conflitto('consenso',()=>db.query("insert into consensi(user_id,tipo,versione_testo,lingua,stato) values($1,'dati_sanitari','test-isolato','it','accettato')",[uid]));
 // Le esclusioni sanitarie vengono ricontrollate nel commit anche se il
 // chiamante le avesse preparate dopo la revoca del consenso.
 await db.query('delete from consensi where user_id=$1',[uid]);
 const sanitario={user_id:uid,kind:'allergia',subject:'glutine',severity:'assoluto',declared_at:new Date().toISOString(),food_id:null,categoria:'glutine'};
 let a=structuredClone(args);a.p_contesto=await contesto();a.p_vincoli=[sanitario];let prima=await stato();
 let esito=await admin.rpc('quadrio_salva_onboarding_v1',a);check('consenso mancante rifiutato nel database',esito.error?.code==='PT403');assert.deepEqual(await stato(),prima);
 const ids=[crypto.randomUUID(),crypto.randomUUID()].sort(),ora=new Date().toISOString();
 await db.query("insert into consensi(id,user_id,tipo,versione_testo,lingua,stato,registrato_at) values($1,$2,'dati_sanitari','test-isolato','it','accettato',$3),($4,$2,'dati_sanitari','test-isolato','it','revocato',$3)",[ids[1],uid,ora,ids[0]]);
 a.p_contesto=await contesto();prima=await stato();esito=await admin.rpc('quadrio_salva_onboarding_v1',a);check('consensi con stessa data: la revoca prevale',esito.error?.code==='PT403');assert.deepEqual(await stato(),prima);
 await db.query("insert into consensi(user_id,tipo,versione_testo,lingua,stato,registrato_at) values($1,'dati_sanitari','test-isolato','it','accettato',$2::timestamptz+interval '1 second')",[uid,ora]);
 const conSanitario=dati();conSanitario.vincoli=[sanitario];await salvaDatiOnboarding(admin,uid,conSanitario);s=await stato();check('consenso attivo permette il salvataggio completo della esclusione',s.user_constraints.some(v=>v.kind==='allergia'&&v.categoria==='glutine'));
 // Il telefono non puo' chiamare direttamente la funzione amministrativa.
 a={...args,p_contesto:await contesto()};const anon=await pubblico.rpc('quadrio_salva_onboarding_v1',a);check('funzione non eseguibile con chiave pubblica',anon.error?.code==='42501');
 const acl=(await db.query("select p.prosecdef,has_function_privilege('authenticated',p.oid,'execute') as auth,has_function_privilege('service_role',p.oid,'execute') as service from pg_proc p where p.oid='public.quadrio_salva_onboarding_v1(uuid,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb)'::regprocedure")).rows[0];check('security invoker riservato al server',!acl.prosecdef&&!acl.auth&&acl.service);
 const primaAltro=await contesto();await db.query("update users set diet='vegano' where id=$1",[creati[1]]);check('altro account non invalida il salvataggio',JSON.stringify(await contesto())===JSON.stringify(primaAltro));
 // Due compilazioni parallele: solo una puo' usare il contesto iniziale.
 let arrivi=0,libera;const pronti=new Promise(r=>libera=r);const parallelo=proxy(async()=>{if(++arrivi===2)libera();await pronti;});const nPrima=(await stato()).energy_targets.length;
 const rr=await Promise.allSettled([salvaDatiOnboarding(parallelo,uid,dati()),salvaDatiOnboarding(parallelo,uid,dati())]);
 check('due compilazioni concorrenti: una riuscita e una da ripetere',rr.filter(r=>r.status==='fulfilled').length===1&&rr.filter(r=>r.status==='rejected'&&r.reason.code==='contesto_onboarding_modificato').length===1);
 s=await stato();check('una sola pesata del giorno e un solo nuovo target',s.body_measurements.length===1&&s.energy_targets.length===nPrima+1);
 check('piano storico e target associato conservati',s.plans.length===1&&s.plans[0].id===piano&&s.plans[0].energy_target_id===targetId);
 }finally{await db.query('ROLLBACK').catch(()=>{});for(const id of creati){await db.query('BEGIN');try{for(const t of ['plans','energy_targets','body_measurements','training_sessions','activity_periods','user_constraints','user_cuisine_preferences','consensi','users'])await db.query('delete from '+t+' where '+(t==='users'?'id':'user_id')+'=$1',[id]);await db.query('COMMIT');}catch(e){await db.query('ROLLBACK');throw e;}const r=await admin.auth.admin.deleteUser(id);assert.ifError(r.error);check('account dati e metadati di prova rimossi',Number((await db.query('select (select count(*) from users where id=$1)+(select count(*) from auth.users where id=$1)+(select count(*) from quadrio_internal.generazione_versioni where user_id=$1) as n',[id])).rows[0].n)===0);}await db.end();}
 console.log(verifiche.length+' controlli reali onboarding superati.');const out=process.argv.find(a=>a.startsWith('--output='));if(out)fs.writeFileSync(out.slice(9),JSON.stringify({verificato_il:new Date().toISOString(),verifiche,dati_di_prova_rimossi:true},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
