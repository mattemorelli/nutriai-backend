// Prove dei permessi con due account temporanei e JWT reali. Solo i loro
// dati personali vengono creati/modificati/rimossi; il catalogo e' letto.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const {createClient}=require('@supabase/supabase-js'),{Client}=require('pg');
const PUB='sb_publishable_frEE9b_o3ueXffQVVwOMvg_Nl6qRoLy';
const opzioni={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY,opzioni),anon=createClient(process.env.SUPABASE_URL,PUB,opzioni);
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000}),creati=[],clienti=[],verifiche=[];
const check=(nome,ok)=>{assert.ok(ok,nome);verifiche.push(nome);console.log('OK '+nome);};
async function account(){const email='permessi-test-'+crypto.randomUUID()+'@nutriai-test.invalid',password=crypto.randomBytes(24).toString('hex');const u=await admin.auth.admin.createUser({email,password,email_confirm:true});if(u.error)throw u.error;creati.push(u.data.user.id);
 const client=createClient(process.env.SUPABASE_URL,PUB,opzioni);clienti.push(client);const login=await client.auth.signInWithPassword({email,password});if(login.error)throw login.error;return{id:u.data.user.id,client};}
(async()=>{await db.connect();try{
 const a=await account(),b=await account();
 await db.query("insert into user_cuisine_preferences(user_id,cucina,rank) values($1,'europea',1),($2,'europea',1)",[a.id,b.id]);
 const leggi=c=>c.from('user_cuisine_preferences').select('user_id,cucina,rank');
 const aa=await leggi(a.client),bb=await leggi(b.client);check('primo account legge soltanto le proprie preferenze',!aa.error&&aa.data.length===1&&aa.data[0].user_id===a.id);check('secondo account legge soltanto le proprie preferenze',!bb.error&&bb.data.length===1&&bb.data[0].user_id===b.id);
 const esterno=await leggi(anon);check('preferenze personali non leggibili senza autenticazione',!!esterno.error);
 const inserisciAnon=await anon.from('user_cuisine_preferences').insert({user_id:a.id,cucina:'usa',rank:2});check('preferenze non scrivibili senza autenticazione',!!inserisciAnon.error);
 const nascosto=await leggi(a.client).eq('user_id',b.id);check('filtro su un altro account non espone righe',!nascosto.error&&nascosto.data.length===0);
 const cambio=await a.client.from('user_cuisine_preferences').update({rank:9}).eq('user_id',b.id).select('user_id');check('modifica di preferenze altrui non seleziona righe',!cambio.error&&cambio.data.length===0);
 const cancella=await a.client.from('user_cuisine_preferences').delete().eq('user_id',b.id).select('user_id');check('cancellazione di preferenze altrui non seleziona righe',!cancella.error&&cancella.data.length===0);
 const imposta=await a.client.from('user_cuisine_preferences').insert({user_id:b.id,cucina:'usa',rank:2});check('inserimento a nome di un altro account rifiutato',imposta.error?.code==='42501');
 const cedi=await a.client.from('user_cuisine_preferences').update({user_id:b.id,cucina:'usa'}).eq('user_id',a.id);check('trasferimento di proprieta rifiutato',cedi.error?.code==='42501');
 const ruba=await a.client.from('user_cuisine_preferences').update({user_id:a.id,cucina:'usa'}).eq('user_id',b.id).select('user_id');check('una preferenza altrui non puo essere trasferita a se stessi',!ruba.error&&ruba.data.length===0);
 const intatto=(await db.query('select cucina,rank from user_cuisine_preferences where user_id=$1',[b.id])).rows;check('preferenze del secondo account conservate',intatto.length===1&&intatto[0].cucina==='europea'&&intatto[0].rank===1);
 const proprio=await a.client.from('user_cuisine_preferences').update({rank:2}).eq('user_id',a.id).select('user_id,rank');check('proprietario puo aggiornare la propria preferenza',!proprio.error&&proprio.data.length===1&&proprio.data[0].rank===2);
 const tolta=await a.client.from('user_cuisine_preferences').delete().eq('user_id',a.id).select('user_id');check('proprietario puo rimuovere la propria preferenza',!tolta.error&&tolta.data.length===1);
 const nuova=await a.client.from('user_cuisine_preferences').insert({user_id:a.id,cucina:'usa',rank:1}).select('user_id');check('proprietario puo aggiungere una propria preferenza',!nuova.error&&nuova.data.length===1&&nuova.data[0].user_id===a.id);
 for(const table of ['dishes','foods','dish_ingredients','ricetta_passi','ricetta_info','azioni_cook','seasonality']){
  const r=await anon.from(table).select('*').limit(1);check(table+': catalogo ancora leggibile pubblicamente',!r.error&&Array.isArray(r.data));
  const p=(await db.query("select c.relrowsecurity,has_table_privilege('anon',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE') as anon,has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE') as auth,has_table_privilege('service_role',c.oid,'UPDATE') as service from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=$1",[table])).rows[0];check(table+': RLS attiva e scritture riservate al backend',p.relrowsecurity&&!p.anon&&!p.auth&&p.service);
 }
 const p=(await db.query("select c.relrowsecurity,has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE') as anon,has_table_privilege('authenticated',c.oid,'TRUNCATE') as trunc from pg_class c where c.oid='public.user_cuisine_preferences'::regclass")).rows[0];check('preferenze sotto RLS senza accesso anonimo o cancellazione globale',p.relrowsecurity&&!p.anon&&!p.trunc);
 }finally{
  for(const client of clienti){const r=await client.auth.signOut({scope:'global'});if(r.error)throw r.error;}
  for(const id of creati){await db.query('delete from user_cuisine_preferences where user_id=$1',[id]);await db.query('delete from users where id=$1',[id]);const r=await admin.auth.admin.deleteUser(id);if(r.error)throw r.error;check('sessione account e metadati di prova rimossi',Number((await db.query('select (select count(*) from auth.users where id=$1)+(select count(*) from users where id=$1)+(select count(*) from quadrio_internal.generazione_versioni where user_id=$1) as n',[id])).rows[0].n)===0);}
  await db.end();
 }
 console.log(`${verifiche.length} verifiche reali dei permessi superate.`);const out=process.argv.find(a=>a.startsWith('--output='));if(out)fs.writeFileSync(out.slice(9),JSON.stringify({verificato_il:new Date().toISOString(),verifiche,dati_di_prova_rimossi:true},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
