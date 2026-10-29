// Solo account e dati generati qui; il catalogo e i piani reali restano intatti.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const {Client}=require('pg'),{createClient}=require('@supabase/supabase-js');
const {calibra}=require('../calibra');
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const pubblico=createClient(process.env.SUPABASE_URL,'sb_publishable_frEE9b_o3ueXffQVVwOMvg_Nl6qRoLy',{auth:{persistSession:false,autoRefreshToken:false}});
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
const creati=[],verifiche=[];let uid,ultimoArgs;
const check=(nome,condizione)=>{assert.ok(condizione,nome);verifiche.push(nome);console.log('OK '+nome);};
const ctx=async()=>{const r=await admin.rpc('quadrio_contesto_generazione_v1',{p_user_id:uid});assert.ifError(r.error);return r.data;};
const targets=async()=>(await db.query('select * from energy_targets where user_id=$1 order by computed_at,id',[uid])).rows;
const giorno=n=>require('../date-locali').dataLocale(new Date(Date.now()-n*86400000));
const salva=async(args)=>{const r=await admin.rpc('quadrio_salva_calibrazione_v1',args);return r;};
const proxy=cambia=>({from:(...a)=>admin.from(...a),rpc:async(n,a)=>{if(n==='quadrio_salva_calibrazione_v1'){ultimoArgs=a;await cambia(a);}return admin.rpc(n,a);}});
(async()=>{await db.connect();try{
 for(let i=0;i<2;i++){const r=await admin.auth.admin.createUser({email:'calibrazione-test-'+crypto.randomUUID()+'@nutriai-test.invalid',password:crypto.randomBytes(24).toString('hex'),email_confirm:true});assert.ifError(r.error);creati.push(r.data.user.id);}uid=creati[0];
 await db.query("update users set goal='mantenimento' where id=$1",[uid]);
 const target=(await db.query("insert into energy_targets(user_id,computed_at,kcal,protein_g_min,fibre_g_min,sat_fat_g_max,free_sugar_g_max,salt_g_max,method,confidence,tdee_predetto) values($1,now()-interval '1 day',2200,85,25,24.4,55,5,'stima_iniziale','bassa',2200) returning *",[uid])).rows[0];
 const piano=(await db.query('insert into plans(user_id,week_start,energy_target_id,corpus_version) values($1,current_date,$2,$3) returning id',[uid,target.id,'test-calibrazione'])).rows[0].id;
 for(let i=0;i<6;i++)await db.query("insert into body_measurements(user_id,measured_on,weight_kg,source) values($1,$2,78,'utente')",[uid,giorno(i)]);
 for(let i=0;i<10;i++)await db.query("insert into intake_estimates(user_id,day,kcal_est,uncertainty_pct,basis) values($1,$2,2200,10,'registrazione_utente')",[uid,giorno(i)]);
 const risultato=await calibra(proxy(async()=>{}),uid);check('calibrazione reale legge kcal_est e salva 2200 kcal',risultato.calibrato&&risultato.kcal===2200&&risultato.giorni===10);
 let tt=await targets();const ultimo=tt.at(-1);check('un nuovo target completo confermato',tt.length===2&&ultimo.method==='calibrato'&&ultimo.giorni_dati===10&&ultimo.confidence==='media');
 check('limiti nutrizionali precedenti preservati', ['protein_g_min','fibre_g_min','sat_fat_g_max','free_sugar_g_max','salt_g_max'].every(k=>ultimo[k]===target[k]));
 check('piano precedente mantiene il proprio target storico',(await db.query('select energy_target_id from plans where id=$1 and user_id=$2',[piano,uid])).rows[0].energy_target_id===target.id);
 async function conflitto(nome,cambia,ripristina){const prima=await targets();await assert.rejects(calibra(proxy(cambia),uid),e=>e.status===409&&e.code==='contesto_calibrazione_modificato');assert.deepEqual(await targets(),prima);check(nome+': nessun target basato su dati superati',true);if(ripristina)await ripristina();}
 await conflitto('nuova pesata durante il calcolo',()=>db.query('update body_measurements set weight_kg=79 where user_id=$1 and measured_on=current_date',[uid]),()=>db.query('update body_measurements set weight_kg=78 where user_id=$1 and measured_on=current_date',[uid]));
 await conflitto('consumo cambiato durante il calcolo',()=>db.query('update intake_estimates set kcal_est=2300 where user_id=$1 and day=current_date',[uid]),()=>db.query('update intake_estimates set kcal_est=2200 where user_id=$1 and day=current_date',[uid]));
 await conflitto('obiettivo cambiato durante il calcolo',()=>db.query("update users set goal='massa' where id=$1",[uid]),()=>db.query("update users set goal='mantenimento' where id=$1",[uid]));
 const prima=await targets(),c=await ctx();
 const args={...ultimoArgs,p_contesto:c,p_target_id:ultimo.id};
 const altroContesto=await ctx();await db.query("update users set goal='massa' where id=$1",[creati[1]]);check('altro account non invalida la calibrazione',JSON.stringify(await ctx())===JSON.stringify(altroContesto));
 const anon=await pubblico.rpc('quadrio_salva_calibrazione_v1',args);check('funzione non eseguibile con chiave pubblica',anon.error?.code==='42501');
 const acl=(await db.query("select p.prosecdef,has_function_privilege('authenticated',p.oid,'execute') as auth,has_function_privilege('service_role',p.oid,'execute') as service from pg_proc p where p.oid='public.quadrio_salva_calibrazione_v1(uuid,jsonb,uuid,jsonb)'::regprocedure")).rows[0];check('funzione invoker riservata al server',!acl.prosecdef&&!acl.auth&&acl.service);
 const rubato=await salva({...args,p_user_id:creati[1]});check('target non utilizzabile per un altro proprietario',!!rubato.error);
 for(const [nome,cambia]of [
  ['target superato',a=>a.p_target_id=target.id],['campo proprietario imposto',a=>a.p_target.user_id=creati[1]],['calorie negative',a=>a.p_target.kcal=-1],['consumi insufficienti',a=>a.p_target.giorni_dati=9],['giorni frazionari',a=>a.p_target.giorni_dati=10.5],['fiducia mancante',a=>delete a.p_target.confidence],['timestamp non valido',a=>a.p_target.computed_at='non-data'],
 ]){const a=structuredClone(args);a.p_contesto=await ctx();cambia(a);const r=await salva(a);check(nome+' rifiutato',!!r.error);assert.deepEqual(await targets(),prima);}
 check('errori di validazione non lasciano target parziali',true);
 // Un timeout reale sul lock dell'utente deve annullare la scrittura.
 const lock=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});await lock.connect();try{
  const primaCtx=await ctx();await lock.query('BEGIN');await lock.query('select id from users where id=$1 for update',[uid]);
  await db.query('BEGIN');await db.query("set local statement_timeout='100ms'");
  try{await db.query('select public.quadrio_salva_calibrazione_v1($1,$2::jsonb,$3,$4::jsonb)',[uid,JSON.stringify(primaCtx),ultimo.id,JSON.stringify(args.p_target)]);assert.fail('timeout atteso');}catch(e){check('timeout interrompe il salvataggio',e.code==='57014');}finally{await db.query('ROLLBACK');}
  check('timeout non cambia target o versione',JSON.stringify(await ctx())===JSON.stringify(primaCtx)&&JSON.stringify(await targets())===JSON.stringify(prima));
 }finally{await lock.query('ROLLBACK');await lock.end();}
 // Due calcoli reali condividono una barriera soltanto prima del commit;
 // nessuna attesa artificiale tiene aperta una transazione database.
 let arrivi=0,libera;const pronti=new Promise(r=>libera=r);const concorrente=proxy(async()=>{arrivi++;if(arrivi===2)libera();await pronti;});
 const rr=await Promise.allSettled([calibra(concorrente,uid),calibra(concorrente,uid)]);
 check('due calibrazioni concorrenti: un solo successo',rr.filter(r=>r.status==='fulfilled'&&r.value.calibrato).length===1&&rr.filter(r=>r.status==='rejected'&&r.reason.code==='contesto_calibrazione_modificato').length===1);
 check('due calibrazioni concorrenti: un solo target nuovo',(await targets()).length===prima.length+1);
 // Il nuovo dato sorgente invalida anche una generazione o modifica in corso.
 const primaFonte=await ctx();await db.query('update intake_estimates set kcal_est=kcal_est+1 where user_id=$1 and day=current_date',[uid]);check('consumi fanno avanzare il contesto personale',(await ctx()).versione!==primaFonte.versione);
 const primaPeso=await ctx();await db.query('update body_measurements set weight_kg=weight_kg+0.1 where user_id=$1 and measured_on=current_date',[uid]);check('pesi fanno avanzare il contesto personale',(await ctx()).versione!==primaPeso.versione);
 }finally{
 await db.query('ROLLBACK').catch(()=>{});for(const id of creati){await db.query('BEGIN');try{for(const t of ['plans','energy_targets','body_measurements','intake_estimates','users'])await db.query('delete from '+t+' where '+(t==='users'?'id':'user_id')+'=$1',[id]);await db.query('COMMIT');}catch(e){await db.query('ROLLBACK');throw e;}const r=await admin.auth.admin.deleteUser(id);assert.ifError(r.error);check('account dati e metadati di prova rimossi',Number((await db.query('select (select count(*) from users where id=$1)+(select count(*) from auth.users where id=$1)+(select count(*) from quadrio_internal.generazione_versioni where user_id=$1) as n',[id])).rows[0].n)===0);}await db.end();
 }
 console.log(verifiche.length+' controlli reali di calibrazione superati.');const out=process.argv.find(a=>a.startsWith('--output='));if(out)fs.writeFileSync(out.slice(9),JSON.stringify({verificato_il:new Date().toISOString(),verifiche,dati_di_prova_rimossi:true},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
