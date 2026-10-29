// Due account sintetici. Le sole scritture di prova sono sui loro dati.
require('dotenv').config({quiet:true});
const {Client}=require('pg'),{createClient}=require('@supabase/supabase-js'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000}),opzioni={auth:{persistSession:false,autoRefreshToken:false}},PUB='sb_publishable_frEE9b_o3ueXffQVVwOMvg_Nl6qRoLy';
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY,opzioni),anon=createClient(process.env.SUPABASE_URL,PUB,opzioni),account=[],prove=[];let arg;
const tabelle=['users','training_sessions','pantry_items','consensi','dispositivi','scorte_settimana'],proprietario=t=>t==='users'?'id':'user_id';
const check=(nome,ok)=>{assert.ok(ok,nome);prove.push(nome);console.log('OK '+nome);};
async function crea(){const email='proprieta-rls-'+crypto.randomUUID()+'@nutriai-test.invalid',password=crypto.randomBytes(24).toString('hex');const r=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.ifError(r.error);const a={id:r.data.user.id,client:createClient(process.env.SUPABASE_URL,PUB,opzioni)};account.push(a);const login=await a.client.auth.signInWithPassword({email,password});assert.ifError(login.error);return a;}
const politiche=async()=>(await db.query("select tablename,policyname,roles::text,cmd,qual,with_check from pg_policies where schemaname='public' and tablename=any($1) order by tablename,policyname",[tabelle])).rows;
(async()=>{await db.connect();try{await crea();await crea();
 const food=(await db.query('select id from foods order by id limit 1')).rows[0].id;
 for(const a of account){const piano=(await db.query("insert into plans(user_id,week_start,corpus_version)values($1,current_date,'test-rls-proprieta')returning id",[a.id])).rows[0].id;
  await db.query("insert into training_sessions(user_id,activity,minutes_per_week,intensity)values($1,'camminata',60,'moderata')",[a.id]);await db.query('insert into pantry_items(user_id,food_id)values($1,$2)',[a.id,food]);await db.query('insert into scorte_settimana(user_id,plan_id,food_id)values($1,$2,$3)',[a.id,piano,food]);await db.query("insert into consensi(user_id,tipo,versione_testo,lingua,stato)values($1,'dati_sanitari','test-rls','it','accettato')",[a.id]);await db.query('insert into dispositivi(impronta,user_id)values($1,$2)',[crypto.randomBytes(32).toString('hex'),a.id]);}
 arg=process.argv.find(a=>a.startsWith('--migrazione='));
 const prima=await politiche();assert.equal(prima.length,7);
 const permessi=async()=>(await db.query("select t,has_table_privilege('authenticated','public.'||t,'SELECT,UPDATE')p,has_any_column_privilege('authenticated','public.'||t,'SELECT,UPDATE')c from unnest($1::text[])t",[tabelle])).rows;
 const aclPrima=await permessi();await db.query('BEGIN');try{
  await db.query("set local lock_timeout='3s';set local statement_timeout='15s'");if(arg)await db.query(fs.readFileSync(arg.slice(13),'utf8'));
  const dopo=await politiche();assert.deepEqual(dopo.map(({qual,with_check,...r})=>r),prima.map(({qual,with_check,...r})=>r));check('regole conservano ruoli comandi e proprietari',true);
  await db.query('SAVEPOINT prova');
  // Queste tabelle sono riservate al backend. I soli permessi di prova
  // restano NON COMMITTATI e vengono annullati prima della conferma della
  // migrazione: nessun'altra connessione li vede. Si interrogano solo i
  // due account sintetici per verificare anche lo strato RLS sottostante.
  await db.query('GRANT SELECT ON '+tabelle.map(t=>'public.'+t).join(',')+' TO authenticated');
  await db.query('GRANT UPDATE(id,height_cm) ON public.users TO authenticated');
  for(const a of account){await db.query('SET LOCAL ROLE authenticated');await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:a.id,role:'authenticated'})]);
   for(const t of tabelle){const r=(await db.query('select '+proprietario(t)+' proprietario from public.'+t+' where '+proprietario(t)+'=any($1::uuid[])',[account.map(a=>a.id)])).rows;assert.equal(r.length,1);assert.equal(r[0].proprietario,a.id);}
   const proprio=await db.query('update users set height_cm=176 where id=$1 returning id',[a.id]);assert.equal(proprio.rowCount,1);
   const altro=account.find(b=>b.id!==a.id);await db.query('SAVEPOINT trasferimento');try{await db.query('update public.users set id=$1 where id=$2',[altro.id,a.id]);assert.fail('Trasferimento accettato');}catch(e){assert.equal(e.code,'42501');await db.query('ROLLBACK TO SAVEPOINT trasferimento');}await db.query('RELEASE SAVEPOINT trasferimento');await db.query('RESET ROLE');
  }
  await db.query('ROLLBACK TO SAVEPOINT prova');await db.query('RELEASE SAVEPOINT prova');assert.deepEqual(await permessi(),aclPrima);check('prove RLS isolate e permessi temporanei completamente annullati',true);
  if(arg)await db.query('COMMIT');else await db.query('ROLLBACK');
 }catch(e){await db.query('ROLLBACK');throw e;}

 for(const a of account){const altro=account.find(b=>b.id!==a.id);for(const t of tabelle){const campo=proprietario(t),r=await a.client.from(t).select(campo).in(campo,account.map(a=>a.id));check(t+': accesso client diretto ancora riservato',r.error?.code==='42501');const esterno=await a.client.from(t).select(campo).eq(campo,altro.id);check(t+': filtro su altro account non espone dati',esterno.error?.code==='42501');}
  const aggiornato=await a.client.from('users').update({height_cm:176}).eq('id',a.id);check('modifiche al profilo passano ancora soltanto dal backend',aggiornato.error?.code==='42501');
  const sessione=await a.client.auth.getSession(),risposta=await fetch('https://nutriai-backend-e8q1.onrender.com/profilo',{headers:{Authorization:'Bearer '+sessione.data.session.access_token},signal:AbortSignal.timeout(20000)});await risposta.text();check('profilo proprio ancora disponibile attraverso app e JWT reale',risposta.status===200);
 }

 for(const t of tabelle){const campo=proprietario(t),r=await anon.from(t).select(campo).in(campo,account.map(a=>a.id));check(t+': anonimo non vede dati personali',r.error?.code==='42501'||(!r.error&&r.data.length===0));}
 const finali=await politiche();check('sette controlli di identita valutati una volta per istruzione',finali.length===7&&finali.every(r=>/SELECT\s+auth\.uid\(\)/i.test(r.qual)&&(!r.with_check||/SELECT\s+auth\.uid\(\)/i.test(r.with_check))));
 }finally{await db.query('ROLLBACK').catch(()=>{});for(const a of account){const uscita=await a.client.auth.signOut({scope:'global'});assert.ifError(uscita.error);for(const t of ['scorte_settimana','pantry_items','dispositivi','consensi','training_sessions','plans'])await db.query('delete from '+t+' where user_id=$1',[a.id]);await db.query('delete from users where id=$1',[a.id]);const r=await admin.auth.admin.deleteUser(a.id);assert.ifError(r.error);check('account sessioni e metadati sintetici rimossi',Number((await db.query('select (select count(*)from auth.users where id=$1)+(select count(*)from users where id=$1)+(select count(*)from quadrio_internal.generazione_versioni where user_id=$1)n',[a.id])).rows[0].n)===0);}await db.end();}
 const output=process.argv.find(a=>a.startsWith('--output='));if(output)fs.writeFileSync(output.slice(9),JSON.stringify({verificato_il:new Date().toISOString(),verifiche:prove,superate:prove.length,migrazione_verificata_prima_del_commit:!!arg,dati_di_prova_rimossi:true},null,2));console.log(prove.length+' verifiche RLS superate.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
