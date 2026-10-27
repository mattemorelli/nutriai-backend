// Contratto della RPC su un account isolato: nessun piano reale e' toccato.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {auth:{persistSession:false,autoRefreshToken:false}});
// Chiave PUBBLICA dell'app; SUPABASE_KEY sul server e' una chiave segreta.
const chiavePubblica=process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_frEE9b_o3ueXffQVVwOMvg_Nl6qRoLy';
const pubblico = createClient(process.env.SUPABASE_URL, chiavePubblica, {auth:{persistSession:false,autoRefreshToken:false}});
const db = new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
let userId, pianoId, secondaConnessione, autenticato=false; let verifiche=0;
const ok = nome=>{verifiche++;console.log('OK '+nome);};
async function snapshot(){const r=await admin.from('plan_items').select('*').eq('plan_id',pianoId).order('id');if(r.error)throw r.error;return r.data;}
async function rpc(attese, modifiche, utente=userId,client=admin){return client.rpc('quadrio_modifica_piano_v1',{p_user_id:utente,p_plan_id:pianoId,p_attese:attese,p_modifiche:modifiche});}
async function main(){
 try{
  await db.connect();
  const email='test-modifiche-'+crypto.randomUUID()+'@nutriai-test.invalid',password=crypto.randomBytes(24).toString('hex');
  const auth=await admin.auth.admin.createUser({email,password,email_confirm:true});
  if(auth.error)throw auth.error;userId=auth.data.user.id;
  const piatti=(await db.query("select id from dishes where mercati @> array['it']::text[] and meal_slot='primo' order by id limit 2")).rows;
  assert.equal(piatti.length,2);
  const target=(await db.query("insert into energy_targets(user_id,kcal,protein_g_min,fibre_g_min,sat_fat_g_max,free_sugar_g_max,salt_g_max,method,confidence) values($1,2000,80,25,22.2,50,5,'stima_iniziale','bassa') returning id",[userId])).rows[0];
  pianoId=(await db.query('insert into plans(user_id,week_start,energy_target_id,corpus_version) values($1,current_date,$2,$3) returning id',[userId,target.id,'test-atomico'])).rows[0].id;
  const altroPiano=(await db.query('insert into plans(user_id,week_start,energy_target_id,corpus_version) values($1,current_date,$2,$3) returning id',[userId,target.id,'test-atomico'])).rows[0].id;
  const ids=[];
  for(let i=0;i<3;i++)ids.push((await db.query("insert into plan_items(plan_id,day_of_week,meal,slot,dish_id,portion_g,kcal,protein_g,fibre_g,sat_fat_g,salt_g) values($1,$2,'pranzo','primo',$3,300,500,30,6,2,0.5) returning id",[i<2?pianoId:altroPiano,i<2?i+1:1,piatti[i%2].id])).rows[0].id);
  const prima=await snapshot();
  const modifiche=[{id:ids[0],patch:{day_of_week:2,stato:'spostato',modificato_il:new Date().toISOString()}},{id:ids[1],patch:{day_of_week:1,stato:'spostato',modificato_il:new Date().toISOString()}}];
  const riuscita=await rpc(prima,modifiche);assert.ifError(riuscita.error);assert.equal(riuscita.data.righe_modificate,2);
  let dopo=await snapshot();assert.equal(dopo.find(r=>r.id===ids[0]).day_of_week,2);assert.equal(dopo.find(r=>r.id===ids[1]).day_of_week,1);ok('scambio di due righe via API atomico');
  const vecchia=await rpc(prima,modifiche);assert.equal(vecchia.error?.code,'PT409',JSON.stringify({errore:vecchia.error,status:vecchia.status}));assert.deepEqual(await snapshot(),dopo);ok('snapshot superata rifiutata senza scrivere');
  for(const [nome,patch,codice]of [
   ['seconda modifica invalida', [{id:ids[0],patch:{day_of_week:3}},{id:ids[1],patch:{day_of_week:9}}],'22023'],
   ['riga di altro piano', [{id:ids[0],patch:{day_of_week:3}},{id:ids[2],patch:{day_of_week:4}}],'42501'],
   ['campo non consentito', [{id:ids[0],patch:{plan_id:altroPiano}}],'22023'],
   ['stessa riga due volte', [{id:ids[0],patch:{day_of_week:3}},{id:ids[0],patch:{day_of_week:4}}],'22023'],
  ]){
   const r=await rpc(dopo,patch);assert.equal(r.error?.code,codice,nome);assert.deepEqual(await snapshot(),dopo);ok(nome+': nessuna scrittura parziale');
  }
  const estraneo=await rpc(dopo,modifiche,crypto.randomUUID());assert.equal(estraneo.error?.code,'42501');ok('proprieta del piano ripetuta nel database');
  const anon=await rpc(dopo,modifiche,userId,pubblico);assert.equal(anon.error?.code,'42501');ok('funzione non eseguibile con chiave pubblica');
  const letturaAnon=await pubblico.from('plans').select('id').eq('id',pianoId);assert.ok(letturaAnon.error);ok('piano non leggibile direttamente con chiave pubblica');
  const accesso=await pubblico.auth.signInWithPassword({email,password});assert.ifError(accesso.error);autenticato=true;
  const utenteRpc=await rpc(dopo,modifiche,userId,pubblico);assert.equal(utenteRpc.error?.code,'42501');
  const letturaPrivata=await pubblico.from('plan_items').select('id').eq('plan_id',pianoId);assert.ok(letturaPrivata.error);ok('utente autenticato passa dal backend per leggere e modificare i piani');
  const permessi=(await db.query("select p.prosecdef, has_function_privilege('authenticated',p.oid,'EXECUTE') as autenticato,has_function_privilege('service_role',p.oid,'EXECUTE') as server from pg_proc p where p.oid='public.quadrio_modifica_piano_v1(uuid,uuid,jsonb,jsonb)'::regprocedure")).rows[0];
  assert.equal(permessi.prosecdef,false);assert.equal(permessi.autenticato,false);assert.equal(permessi.server,true);ok('security invoker e permesso riservato al server');
  const ripristino={stato:'sostituito',modificato_il:'2026-10-26T10:00:00Z'};
  let r=await rpc(dopo,[{id:ids[0],patch:{stato:'saltato',ripristino_salto:ripristino}}]);assert.ifError(r.error);dopo=await snapshot();assert.deepEqual(dopo.find(r=>r.id===ids[0]).ripristino_salto,ripristino);ok('provenienza precedente al salto persistita');
  r=await rpc(dopo,[{id:ids[0],patch:{stato:'sostituito',ripristino_salto:null,modificato_il:ripristino.modificato_il}}]);assert.ifError(r.error);dopo=await snapshot();ok('snapshot resta confrontabile dopo timestamp e ripristino');
  // Due connessioni vere: la seconda aspetta il lock, poi deve fallire
  // sul confronto; non puo' applicare una scelta costruita sul vecchio piano.
  secondaConnessione=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});await secondaConnessione.connect();
  await db.query('BEGIN');await db.query("SET LOCAL statement_timeout='5s'");
  await db.query('select public.quadrio_modifica_piano_v1($1,$2,$3::jsonb,$4::jsonb)',[userId,pianoId,JSON.stringify(dopo),JSON.stringify([{id:ids[0],patch:{day_of_week:3}}])]);
  await secondaConnessione.query("SET statement_timeout='5s'");
  const concorrente=secondaConnessione.query('select public.quadrio_modifica_piano_v1($1,$2,$3::jsonb,$4::jsonb)',[userId,pianoId,JSON.stringify(dopo),JSON.stringify([{id:ids[1],patch:{day_of_week:4}}])]).then(()=>null,e=>e);
  await new Promise(resolve=>setTimeout(resolve,100));await db.query('COMMIT');
  assert.equal((await concorrente)?.code,'PT409');const finale=await snapshot();assert.equal(finale.find(r=>r.id===ids[0]).day_of_week,3);assert.equal(finale.find(r=>r.id===ids[1]).day_of_week,1);ok('concorrenza reale: una modifica riuscita, la vecchia rifiutata');
  console.log(`${verifiche} controlli database superati.`);
 }finally{
  await db.query('ROLLBACK').catch(()=>{});if(secondaConnessione)await secondaConnessione.end();
  if(userId){
   if(autenticato){const uscita=await pubblico.auth.signOut({scope:'global'});assert.ifError(uscita.error);}
   await db.query('BEGIN');
   try{for(const t of ['plans','energy_targets','users'])await db.query('delete from '+t+' where '+(t==='users'?'id':'user_id')+'=$1',[userId]);await db.query('COMMIT');}catch(e){await db.query('ROLLBACK');throw e;}
   const cancellato=await admin.auth.admin.deleteUser(userId);if(cancellato.error)throw cancellato.error;
   const residui=(await db.query('select (select count(*) from plans where user_id=$1)::int+(select count(*) from users where id=$1)::int+(select count(*) from auth.users where id=$1)::int as n',[userId])).rows[0];assert.equal(residui.n,0);console.log('OK account e dati isolati rimossi.');
  }
  await db.end();
 }
}
const attesa=setInterval(()=>{},1000);
main().catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>clearInterval(attesa));
