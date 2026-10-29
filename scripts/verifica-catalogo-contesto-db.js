// UPDATE ... WHERE false attiva soltanto il trigger di istruzione: ZERO
// ricette/alimenti modificati. Anche il contatore privato viene annullato.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const {Client}=require('pg'),{createClient}=require('@supabase/supabase-js');
const {generaESalva}=require('../genera'),{calcolaESalvaTarget}=require('../fabbisogno'),{caricaContestoGenerazione}=require('../salvataggio-generazione');
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const pubblico=createClient(process.env.SUPABASE_URL,'sb_publishable_frEE9b_o3ueXffQVVwOMvg_Nl6qRoLy',{auth:{persistSession:false,autoRefreshToken:false}});
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
const verifiche=[];let uid,inCorso;
const check=(nome,condizione)=>{assert.ok(condizione,nome);verifiche.push(nome);console.log('OK '+nome);};
const catalogo=async()=>(await db.query('select catalogo_id::text,versione::text from quadrio_internal.catalogo_versione where id=1')).rows[0];
const count=async()=>Number((await db.query('select count(*) n from plans where user_id=$1',[uid])).rows[0].n);
async function righe(id){const r=await admin.from('plan_items').select('*').eq('plan_id',id).order('id');assert.ifError(r.error);return r.data;}
(async()=>{await db.connect();const catalogoIniziale=await catalogo();try{
 const r=await admin.auth.admin.createUser({email:'catalogo-contesto-test-'+crypto.randomUUID()+'@nutriai-test.invalid',password:crypto.randomBytes(24).toString('hex'),email_confirm:true});assert.ifError(r.error);uid=r.data.user.id;
 await db.query("update users set sex='M',birth_year=$2,height_cm=175,goal='mantenimento',occupation_level='sedentario',diet='onnivoro',paesi=ARRAY['italia'],evening_minutes=35,household_size=1,cook_days=ARRAY[1,2,3,4,5,6,7] where id=$1",[uid,new Date().getFullYear()-30]);
 await db.query("insert into body_measurements(user_id,measured_on,weight_kg,source) values($1,current_date,78,'utente')",[uid]);
 await calcolaESalvaTarget(admin,uid);
 const preview=await generaESalva(admin,uid,2026,{salva:false,dettagli:true,tempoMassimoMs:-1,numeroSpuntini:0,mantieniBloccati:false});assert.ok(preview.righe?.length&&!preview.errore);
 const target=(await db.query('select id from energy_targets where user_id=$1 order by computed_at desc,id desc limit 1',[uid])).rows[0];
 const piano={week_start:new Date().toISOString().slice(0,10),giorno_gratis:1,generated_at:new Date().toISOString(),energy_target_id:target.id,corpus_version:'test-catalogo-contesto',seed:2026,gradino_raggiunto:String(preview.gradino),concessioni:preview.concessioni,dieta:'onnivoro',paesi:['italia']};
 const args=async()=>({p_user_id:uid,p_contesto:await caricaContestoGenerazione(admin,uid),p_piano:piano,p_righe:preview.righe});
 const ctx=await caricaContestoGenerazione(admin,uid);check('contesto unisce versione personale e catalogo corrente',ctx.catalogo_id===catalogoIniziale.catalogo_id&&ctx.catalogo_versione===catalogoIniziale.versione&&typeof ctx.versione==='string');
 const prima=await count();
 for(const [tabella,campo]of [['dishes','health_score'],['dish_ingredients','grams'],['foods','name'],['categorie_alimenti','categoria'],['tag_nutrizionali','tag'],['alias_categoria','alias']]){
  const a=await args(),stabile=await catalogo();await db.query('BEGIN');
  try{
   const update=await db.query('update public.'+tabella+' set '+campo+'='+campo+' where false');assert.equal(update.rowCount,0);
   const modificato=await catalogo();check(tabella+': trigger attivo senza modificare righe reali',BigInt(modificato.versione)===BigInt(stabile.versione)+1n);
   try{await db.query('select public.quadrio_salva_generazione_v2($1,$2::jsonb,$3::jsonb,$4::jsonb)',[uid,JSON.stringify(a.p_contesto),JSON.stringify(piano),JSON.stringify(preview.righe)]);assert.fail('conflitto catalogo atteso');}catch(e){check(tabella+': salvataggio con vecchio catalogo rifiutato',e.code==='PT410');}
  }finally{await db.query('ROLLBACK');}
  assert.deepEqual(await catalogo(),stabile);assert.equal(await count(),prima);
 }
 check('sei prove annullate senza toccare catalogo o piani',true);
 const salvata=await admin.rpc('quadrio_salva_generazione_v2',await args());assert.ifError(salvata.error);let id=salvata.data.id;
 check('catalogo stabile salva normalmente la settimana completa',salvata.data.righe===preview.righe.length&&(await righe(id)).length===preview.righe.length&&await count()===prima+1);
 let attese=await righe(id),c=await caricaContestoGenerazione(admin,uid);await db.query('BEGIN');try{
  const z=await db.query('update public.foods set name=name where false');assert.equal(z.rowCount,0);
  try{await db.query('select public.quadrio_modifica_piano_v3($1,$2,$3::jsonb,$4::jsonb,$5::jsonb)',[uid,id,JSON.stringify(attese),JSON.stringify([{id:attese[0].id,patch:{bloccato:true}}]),JSON.stringify(c)]);assert.fail('conflitto atteso');}catch(e){check('modifica o Mantieni rifiutata con catalogo superato',e.code==='PT410');}
 }finally{await db.query('ROLLBACK');}assert.deepEqual(await righe(id),attese);check('conflitto catalogo non lascia il piatto mantenuto per errore',true);
 const modifica=await admin.rpc('quadrio_modifica_piano_v3',{p_user_id:uid,p_plan_id:id,p_attese:attese,p_modifiche:[{id:attese[0].id,patch:{bloccato:true}}],p_contesto:await caricaContestoGenerazione(admin,uid)});assert.ifError(modifica.error);check('modifica normale con catalogo stabile confermata',(await righe(id)).find(r=>r.id===attese[0].id).bloccato===true);
 for(const [nome,cambia,codice]of [['catalogo mancante',a=>delete a.p_contesto.catalogo_id,'22023'],['catalogo di altra origine',a=>a.p_contesto.catalogo_id=crypto.randomUUID(),'PT410'],['versione diversa',a=>a.p_contesto.catalogo_versione=(BigInt(a.p_contesto.catalogo_versione)+1n).toString(),'PT410']]){
  const a=await args(),n=await count();cambia(a);const r=await admin.rpc('quadrio_salva_generazione_v2',a);check(nome+' rifiutato senza nuova settimana',r.error?.code===codice&&await count()===n);
 }
 const anon=await pubblico.rpc('quadrio_contesto_catalogo_v1');check('versione catalogo riservata al backend',anon.error?.code==='42501');
 const anonPersonale=await pubblico.rpc('quadrio_contesto_generazione_v2',{p_user_id:uid});check('contesto personale esteso non leggibile con chiave pubblica',anonPersonale.error?.code==='42501');
 const acl=(await db.query("select p.proname,p.prosecdef,has_function_privilege('anon',p.oid,'execute') as anon,has_function_privilege('authenticated',p.oid,'execute') as auth,has_function_privilege('service_role',p.oid,'execute') as service from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('quadrio_contesto_catalogo_v1','quadrio_contesto_generazione_v2','quadrio_salva_generazione_v2','quadrio_modifica_piano_v3')")).rows;check('quattro nuove funzioni invoker e riservate al server',acl.length===4&&acl.every(r=>!r.prosecdef&&!r.anon&&!r.auth&&r.service));
 const permessi=(await db.query("select t,has_table_privilege('anon',t,'INSERT,UPDATE,DELETE,TRUNCATE') as anon,has_table_privilege('authenticated',t,'INSERT,UPDATE,DELETE,TRUNCATE') as auth from unnest(array['public.dishes','public.dish_ingredients','public.foods','public.categorie_alimenti','public.tag_nutrizionali','public.alias_categoria']) t")).rows;
 check('nessun client puo scrivere nelle sei fonti del catalogo',permessi.every(r=>!r.anon&&!r.auth));
 // Lock reale con annullamento: nessuna pubblicazione fittizia del catalogo
 // deve invalidare le generazioni di altri utenti durante questa prova.
 const a=await args(),nPrima=await count();await db.query('BEGIN');try{
  await db.query('update public.dishes set health_score=health_score where false');const pid=(await db.query('select pg_backend_pid() pid')).rows[0].pid;
  inCorso=Promise.resolve(admin.rpc('quadrio_salva_generazione_v2',a));let bloccata=false;const fine=Date.now()+5000;
  while(Date.now()<fine){await db.query('select pg_stat_clear_snapshot()');const n=Number((await db.query('select count(*) n from pg_stat_activity where $1=any(pg_blocking_pids(pid)) and position($2 in query)>0',[pid,'quadrio_salva_generazione_v2'])).rows[0].n);if(n){bloccata=true;break;}await new Promise(r=>setTimeout(r,100));}
  check('il commit aspetta il lock di un aggiornamento del catalogo',bloccata);await db.query('ROLLBACK');const r=await inCorso;assert.ifError(r.error);check('catalogo annullato: attesa risolta senza conflitto falso',r.data.righe===preview.righe.length&&await count()===nPrima+1);inCorso=null;
 }catch(e){await db.query('ROLLBACK');if(inCorso)await inCorso;inCorso=null;throw e;}
 assert.deepEqual(await catalogo(),catalogoIniziale);check('versione e identita del catalogo identiche a prima delle prove',true);
 }finally{await db.query('ROLLBACK').catch(()=>{});if(inCorso)await inCorso;if(uid){await db.query('BEGIN');try{for(const t of ['plans','energy_targets','body_measurements','users'])await db.query('delete from '+t+' where '+(t==='users'?'id':'user_id')+'=$1',[uid]);await db.query('COMMIT');}catch(e){await db.query('ROLLBACK');throw e;}const r=await admin.auth.admin.deleteUser(uid);assert.ifError(r.error);check('account e metadati di prova rimossi',Number((await db.query('select (select count(*) from users where id=$1)+(select count(*) from auth.users where id=$1)+(select count(*) from quadrio_internal.generazione_versioni where user_id=$1) n',[uid])).rows[0].n)===0);}await db.end();}
 console.log(verifiche.length+' controlli reali su catalogo e commit superati.');const out=process.argv.find(a=>a.startsWith('--output='));if(out)fs.writeFileSync(out.slice(9),JSON.stringify({verificato_il:new Date().toISOString(),verifiche,righe_catalogo_modificate:0,dati_di_prova_rimossi:true},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
