// Solo account creato da questa esecuzione. Nessun piano o utente reale modificato.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {createClient}=require('@supabase/supabase-js'),{Client}=require('pg');
const {preparaTarget,salvaAggiornamentoFabbisogno}=require('../fabbisogno');
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const pub=createClient(process.env.SUPABASE_URL,'sb_publishable_frEE9b_o3ueXffQVVwOMvg_Nl6qRoLy',{auth:{persistSession:false,autoRefreshToken:false}});
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});let uid,n=0;
function check(nome,ok){assert.ok(ok,nome);n++;console.log('OK '+nome);}
async function stato(){return JSON.stringify((await db.query(`select jsonb_build_object('users',(select to_jsonb(u) from users u where id=$1),'misure',(select coalesce(jsonb_agg(to_jsonb(m) order by id),'[]') from body_measurements m where user_id=$1),'target',(select coalesce(jsonb_agg(to_jsonb(e) order by id),'[]') from energy_targets e where user_id=$1)) as v`,[uid])).rows[0].v);}
const args=(p,profilo={},misura=null)=>({p_user_id:uid,p_attese:p.attese,p_profilo:profilo,p_misura:misura,p_target:p.target});
(async()=>{await db.connect();
 try{
  const creato=await admin.auth.admin.createUser({email:'target-test-'+crypto.randomUUID()+'@nutriai-test.invalid',password:crypto.randomBytes(24).toString('hex'),email_confirm:true});if(creato.error)throw creato.error;uid=creato.data.user.id;
  await db.query("update users set sex='M',birth_year=$2,height_cm=175,goal='mantenimento',occupation_level='sedentario' where id=$1",[uid,new Date().getFullYear()-30]);
  const oggi=new Date().toISOString().slice(0,10);await db.query("insert into body_measurements(user_id,measured_on,weight_kg,source) values($1,$2,78,'utente')",[uid,oggi]);
  const p=await preparaTarget(admin,uid,{misura:{weight_kg:85,body_fat_pct:null},conSnapshot:true});
  const misura={measured_on:oggi,weight_kg:85,body_fat_pct:null,source:'utente'};
  await salvaAggiornamentoFabbisogno(admin,uid,p,{misura});
  const saved=(await db.query('select weight_kg,(select kcal from energy_targets where user_id=$1 order by computed_at desc,id desc limit 1) as kcal from body_measurements where user_id=$1',[uid])).rows[0];
  check('peso e target salvati insieme',Number(saved.weight_kg)===85&&Number(saved.kcal)===p.target.kcal);
  let prima=await stato();const stale=await admin.rpc('quadrio_salva_fabbisogno_v1',args(p,{},misura));
  check('snapshot obsoleto rifiutato',stale.error?.code==='PT409');check('conflitto senza scritture',await stato()===prima);
  const preparato=await preparaTarget(admin,uid,{profilo:{goal:'massa'},misura:{weight_kg:90},conSnapshot:true});
  const rotto=structuredClone(preparato);rotto.target.computed_at=null;
  const rollback=await admin.rpc('quadrio_salva_fabbisogno_v1',args(rotto,{goal:'massa'},{...misura,weight_kg:90}));
  check('errore target simulato dopo le scritture',rollback.error?.code==='23502');check('rollback integrale di profilo misura e target',await stato()===prima);
  const proibito=await admin.rpc('quadrio_salva_fabbisogno_v1',args(preparato,{is_pro:true}));check('campi privilegiati rifiutati',proibito.error?.code==='22023');check('nessuna scrittura su campo vietato',await stato()===prima);
  const pubblico=await pub.rpc('quadrio_salva_fabbisogno_v1',args(preparato));check('funzione non eseguibile tramite chiave pubblica',!!pubblico.error);
  const acl=(await db.query("select has_function_privilege('anon','public.quadrio_salva_fabbisogno_v1(uuid,jsonb,jsonb,jsonb,jsonb)','EXECUTE') as anon,has_function_privilege('authenticated','public.quadrio_salva_fabbisogno_v1(uuid,jsonb,jsonb,jsonb,jsonb)','EXECUTE') as auth,has_function_privilege('service_role','public.quadrio_salva_fabbisogno_v1(uuid,jsonb,jsonb,jsonb,jsonb)','EXECUTE') as service")).rows[0];
  check('permessi limitati al backend',!acl.anon&&!acl.auth&&acl.service);
  const px=await preparaTarget(admin,uid,{misura:{weight_kg:90},conSnapshot:true}),py=await preparaTarget(admin,uid,{misura:{weight_kg:95},conSnapshot:true});
  const count=Number((await db.query('select count(*) n from energy_targets where user_id=$1',[uid])).rows[0].n);
  const rr=await Promise.all([admin.rpc('quadrio_salva_fabbisogno_v1',args(px,{}, {...misura,weight_kg:90})),admin.rpc('quadrio_salva_fabbisogno_v1',args(py,{}, {...misura,weight_kg:95}))]);
  check('due pesate concorrenti: un solo successo',rr.filter(r=>!r.error).length===1&&rr.filter(r=>r.error?.code==='PT409').length===1);
  check('due pesate concorrenti: un solo nuovo target',Number((await db.query('select count(*) n from energy_targets where user_id=$1',[uid])).rows[0].n)===count+1);
  const ultimo=await preparaTarget(admin,uid),reale=Number((await db.query('select kcal from energy_targets where user_id=$1 order by computed_at desc,id desc limit 1',[uid])).rows[0].kcal);check('target coerente con la pesata vincente',ultimo.kcal===reale);
  const pa=await preparaTarget(admin,uid,{profilo:{goal:'massa'},conSnapshot:true}),pb=await preparaTarget(admin,uid,{misura:{weight_kg:100},conSnapshot:true});
  const misti=await Promise.all([admin.rpc('quadrio_salva_fabbisogno_v1',args(pa,{goal:'massa'})),admin.rpc('quadrio_salva_fabbisogno_v1',args(pb,{}, {...misura,weight_kg:100}))]);
  check('peso e obiettivo concorrenti: un successo e un conflitto',misti.filter(r=>!r.error).length===1&&misti.filter(r=>r.error?.code==='PT409').length===1);
  const atteso=await preparaTarget(admin,uid);check('profilo e peso finali corrispondono al target',atteso.kcal===Number((await db.query('select kcal from energy_targets where user_id=$1 order by computed_at desc,id desc limit 1',[uid])).rows[0].kcal));
  const ps=await preparaTarget(admin,uid,{misura:{weight_kg:101},conSnapshot:true});await db.query("insert into training_sessions(user_id,activity,minutes_per_week,intensity) values($1,'pesi',180,'moderata')",[uid]);prima=await stato();
  const cambiato=await admin.rpc('quadrio_salva_fabbisogno_v1',args(ps,{}, {...misura,weight_kg:101}));check('allenamenti cambiati durante il calcolo rilevati',cambiato.error?.code==='PT409');check('dati preservati dopo modifica allenamenti',await stato()===prima);
  await db.query('update users set occupation_level=null where id=$1',[uid]);await db.query("insert into activity_periods(user_id,pal,valid_from) values($1,1.4,$2)",[uid,oggi]);
  const legacy=await preparaTarget(admin,uid,{misura:{weight_kg:99},conSnapshot:true});await salvaAggiornamentoFabbisogno(admin,uid,legacy,{misura:{...misura,weight_kg:99}});check('profilo legacy con PAL supportato dalla transazione',true);
  console.log(`${n} controlli reali su atomicita, concorrenza e permessi superati.`);
 }finally{
  if(uid){await db.query('BEGIN');try{for(const t of ['energy_targets','body_measurements','training_sessions','activity_periods','users'])await db.query('delete from '+t+' where '+(t==='users'?'id':'user_id')+'=$1',[uid]);await db.query('COMMIT');}catch(e){await db.query('ROLLBACK');throw e;}
   const r=await admin.auth.admin.deleteUser(uid);if(r.error)throw r.error;
   check('account e dati di prova rimossi',Number((await db.query('select (select count(*) from users where id=$1)+(select count(*) from auth.users where id=$1) n',[uid])).rows[0].n)===0);
  }await db.end();
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
