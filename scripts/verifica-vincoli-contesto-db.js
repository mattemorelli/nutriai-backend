// Solo account creati qui. Nessuna riga del catalogo viene modificata.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const {Client}=require('pg'),{createClient}=require('@supabase/supabase-js');
const {salvaVincoli}=require('../salvataggio-vincoli'),{salvaDatiOnboarding}=require('../onboarding');
const {caricaContestoGenerazione}=require('../salvataggio-generazione'),{dataLocale}=require('../date-locali');
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const pubblico=createClient(process.env.SUPABASE_URL,'sb_publishable_frEE9b_o3ueXffQVVwOMvg_Nl6qRoLy',{auth:{persistSession:false,autoRefreshToken:false}});
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000}),creati=[],verifiche=[];let uid;
const check=(nome,condizione)=>{assert.ok(condizione,nome);verifiche.push(nome);console.log('OK '+nome);};
const ctx=()=>caricaContestoGenerazione(admin,uid);
async function stato(){const r={};for(const t of ['users','user_constraints','body_measurements','energy_targets','training_sessions','user_cuisine_preferences','consensi'])r[t]=(await db.query('select to_jsonb(t) v from '+t+' t where '+(t==='users'?'id':'user_id')+'=$1 order by to_jsonb(t)::text',[uid])).rows.map(r=>r.v);r.contesto=await ctx();return r;}
const vincolo=(id)=>({user_id:uid,kind:'non_gradito',subject:'ingrediente reale di prova',severity:'assoluto',declared_at:new Date().toISOString(),food_id:id,categoria:null});
const raw=(c,rs)=>admin.rpc('quadrio_aggiungi_vincoli_v1',{p_user_id:uid,p_contesto:c,p_righe:rs});
(async()=>{await db.connect();const catalogoPrima=(await db.query('select to_jsonb(c) v from quadrio_internal.catalogo_versione c')).rows[0].v;try{
 for(let i=0;i<2;i++){const r=await admin.auth.admin.createUser({email:'vincoli-contesto-test-'+crypto.randomUUID()+'@nutriai-test.invalid',password:crypto.randomBytes(24).toString('hex'),email_confirm:true});assert.ifError(r.error);creati.push(r.data.user.id);}uid=creati[0];
 const foods=(await db.query('select id from public.foods order by id limit 2')).rows;assert.equal(foods.length,2);
 const prima=await stato(),righe=[vincolo(foods[0].id),vincolo(foods[1].id)];
 const aggiunte=await salvaVincoli(admin,uid,await ctx(),righe);check('due alimenti risolti salvati con una sola operazione',aggiunte.length===2&&(await stato()).user_constraints.length===2&&aggiunte.every(r=>typeof r.id==='string'));
 check('aggiunta aggiorna la versione delle scelte',(await ctx()).versione!==prima.contesto.versione);
 const facoltativo={...vincolo(null),severity:'preferibile',subject:'preferenza facoltativa non risolta'};
 await salvaVincoli(admin,uid,await ctx(),[facoltativo]);check('preferenza facoltativa irrisolta ancora consentita',(await stato()).user_constraints.length===3);
 for(const [nome,modifica]of [['esclusione obbligatoria senza riferimento',r=>r.food_id=null],['categoria inesistente',r=>{r.food_id=null;r.categoria='zz_categoria_inesistente';}],['riferimento ambiguo',r=>r.categoria='glutine'],['altro proprietario',r=>r.user_id=creati[1]],['campo id imposto',r=>r.id=crypto.randomUUID()],['categoria con tipo errato',r=>{r.food_id=null;r.categoria=123;}],['kind non valido',r=>r.kind='altro']]){
  const prima=await stato(),r=vincolo(foods[0].id);modifica(r);const esito=await raw(await ctx(),[r]);check(nome+' rifiutato',!!esito.error);assert.deepEqual(await stato(),prima);
 }
 check('sette input errati non modificano esclusioni o versione',true);
 let primaErrore=await stato();const tardive=[vincolo(foods[0].id),{...vincolo(foods[1].id),declared_at:'non-data'}];
 const tardivo=await raw(await ctx(),tardive);check('errore tardivo di una riga rilevato',!!tardivo.error);assert.deepEqual(await stato(),primaErrore);check('errore tardivo annulla tutte le righe e il contatore',true);
 const vecchio=await ctx();await db.query("update users set diet='vegano' where id=$1",[uid]);primaErrore=await stato();
 await assert.rejects(salvaVincoli(admin,uid,vecchio,[vincolo(foods[0].id)]),e=>e.code==='contesto_vincoli_modificato'&&e.status===409);assert.deepEqual(await stato(),primaErrore);check('profilo cambiato tra risoluzione e commit non produce una nuova esclusione',true);
 // Il trigger di istruzione si attiva senza cambiare neanche una riga.
 const c=await ctx(),primaCatalogo=await stato();await db.query('BEGIN');try{
  const z=await db.query('update public.alias_categoria set alias=alias where false');assert.equal(z.rowCount,0);
  try{await db.query('select public.quadrio_aggiungi_vincoli_v1($1,$2::jsonb,$3::jsonb)',[uid,JSON.stringify(c),JSON.stringify([vincolo(foods[0].id)])]);assert.fail('conflitto atteso');}catch(e){check('catalogo cambiato dopo la risoluzione impedisce il salvataggio',e.code==='PT410');}
 }finally{await db.query('ROLLBACK');}assert.deepEqual(await stato(),primaCatalogo);check('prova del catalogo annullata senza righe o versioni residue',true);
 const sanitario={...vincolo(null),kind:'allergia',subject:'glutine',categoria:'glutine'};
 let e=await raw(await ctx(),[sanitario]);check('consenso richiesto anche nel commit delle esclusioni',e.error?.code==='PT403');
 await db.query("insert into consensi(user_id,tipo,versione_testo,lingua,stato) values($1,'dati_sanitari','test-isolato','it','accettato')",[uid]);
 await salvaVincoli(admin,uid,await ctx(),[sanitario]);check('esclusione sanitaria salvata con consenso attivo',(await stato()).user_constraints.some(r=>r.kind==='allergia'));
 const primaRevoca=await ctx();await db.query("insert into consensi(user_id,tipo,versione_testo,lingua,stato) values($1,'dati_sanitari','test-isolato','it','revocato')",[uid]);const dopoRevoca=await stato();
 e=await raw(primaRevoca,[sanitario]);check('revoca durante il salvataggio rilevata',e.error?.code==='PT409');e=await raw(await ctx(),[sanitario]);check('revoca gia acquisita impedisce una nuova esclusione sanitaria',e.error?.code==='PT403');assert.deepEqual(await stato(),dopoRevoca);
 // Anche l'onboarding conserva il contesto acquisito prima di risolvere
 // gli alimenti, anziche rileggerlo dopo e accettare una risoluzione vecchia.
 const dati={contesto:await ctx(),profilo:{sex:'M',birth_year:new Date().getFullYear()-30,height_cm:175,goal:'mantenimento',occupation_level:'sedentario',city:null,region_zone:null,pasti_casa:null,cook_days:[1,2,3,4,5,6,7],lunch_away:false,household_size:1,evening_minutes:35,diet:'onnivoro',paesi:['italia']},misura:{measured_on:dataLocale(),weight_kg:78,body_fat_pct:null,source:'utente'},sessioni:[],vincoli:[vincolo(foods[0].id)],preferenze:['europea']};
 const primaIngresso=await stato(),ponte={from:(...a)=>admin.from(...a),rpc:async(n,a)=>{assert.equal(n,'quadrio_salva_onboarding_v2');try{const r=await db.query('select public.quadrio_salva_onboarding_v2($1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6::jsonb,$7::jsonb,$8::jsonb) v',[a.p_user_id,...['p_contesto','p_profilo','p_misura','p_sport','p_vincoli','p_preferenze','p_target'].map(k=>JSON.stringify(a[k]))]);return{data:r.rows[0].v,error:null};}catch(e){return{error:{code:e.code,message:e.message}};}}};
 await db.query('BEGIN');try{const z=await db.query('update public.foods set name=name where false');assert.equal(z.rowCount,0);await assert.rejects(salvaDatiOnboarding(ponte,uid,dati),e=>e.status===409&&e.code==='catalogo_modificato');check('onboarding rifiuta una risoluzione superata del catalogo',true);}finally{await db.query('ROLLBACK');}assert.deepEqual(await stato(),primaIngresso);check('onboarding rifiutato non cambia profilo peso allenamenti esclusioni o target',true);
 const anon=await pubblico.rpc('quadrio_aggiungi_vincoli_v1',{p_user_id:uid,p_contesto:await ctx(),p_righe:[vincolo(foods[0].id)]});check('salvataggio non eseguibile con chiave pubblica',anon.error?.code==='42501');
 const acl=(await db.query("select p.proname,p.prosecdef,has_function_privilege('anon',p.oid,'execute') as anon,has_function_privilege('authenticated',p.oid,'execute') as auth,has_function_privilege('service_role',p.oid,'execute') as service from pg_proc p join pg_namespace n on n.oid=p.pronamespace where (n.nspname,p.proname) in (('public','quadrio_aggiungi_vincoli_v1'),('public','quadrio_salva_onboarding_v2'),('quadrio_internal','blocca_catalogo_attuale'),('quadrio_internal','verifica_vincoli_salvataggio'))")).rows;check('quattro funzioni invoker riservate al server',acl.length===4&&acl.every(r=>!r.prosecdef&&!r.anon&&!r.auth&&r.service));
 assert.deepEqual((await db.query('select to_jsonb(c) v from quadrio_internal.catalogo_versione c')).rows[0].v,catalogoPrima);check('nessuna modifica persistente al catalogo o alla sua versione',true);
 }finally{await db.query('ROLLBACK').catch(()=>{});for(const id of creati){await db.query('BEGIN');try{for(const t of ['plans','energy_targets','body_measurements','training_sessions','user_cuisine_preferences','user_constraints','consensi','users'])await db.query('delete from '+t+' where '+(t==='users'?'id':'user_id')+'=$1',[id]);await db.query('COMMIT');}catch(e){await db.query('ROLLBACK');throw e;}const r=await admin.auth.admin.deleteUser(id);assert.ifError(r.error);check('account e metadati di prova rimossi',Number((await db.query('select (select count(*) from users where id=$1)+(select count(*) from auth.users where id=$1)+(select count(*) from quadrio_internal.generazione_versioni where user_id=$1) n',[id])).rows[0].n)===0);}await db.end();}
 console.log(verifiche.length+' controlli reali sulle esclusioni superati.');const out=process.argv.find(a=>a.startsWith('--output='));if(out)fs.writeFileSync(out.slice(9),JSON.stringify({verificato_il:new Date().toISOString(),verifiche,righe_catalogo_modificate:0,dati_di_prova_rimossi:true},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
