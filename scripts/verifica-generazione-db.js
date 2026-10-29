// Account creati da questa esecuzione soltanto. Nessun catalogo o piano reale modificato.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const {createClient}=require('@supabase/supabase-js'),{Client}=require('pg');
const {generaESalva}=require('../genera'),{calcolaESalvaTarget}=require('../fabbisogno');
const {caricaContestoGenerazione}=require('../salvataggio-generazione');
const admin=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const pubblico=createClient(process.env.SUPABASE_URL,'sb_publishable_frEE9b_o3ueXffQVVwOMvg_Nl6qRoLy',{auth:{persistSession:false,autoRefreshToken:false}});
const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
const creati=[],verifiche=[];let uid;
const check=(nome,ok)=>{assert.ok(ok,nome);verifiche.push(nome);console.log('OK '+nome);};
async function crea(){const r=await admin.auth.admin.createUser({email:'generazione-test-'+crypto.randomUUID()+'@nutriai-test.invalid',password:crypto.randomBytes(24).toString('hex'),email_confirm:true});if(r.error)throw r.error;creati.push(r.data.user.id);return r.data.user.id;}
async function stato(){return JSON.stringify((await db.query(`select jsonb_build_object(
 'piani',(select coalesce(jsonb_agg(to_jsonb(p) order by p.id),'[]'::jsonb) from plans p where p.user_id=$1),
 'righe',(select coalesce(jsonb_agg(to_jsonb(i) order by i.id),'[]'::jsonb) from plan_items i join plans p on p.id=i.plan_id where p.user_id=$1),
 'contesto',public.quadrio_contesto_generazione_v2($1)) as v`,[uid])).rows[0].v);}
const conta=async()=>Number((await db.query('select count(*) n from plans where user_id=$1',[uid])).rows[0].n);
(async()=>{await db.connect();
 try{
  uid=await crea();const altro=await crea();
  await db.query("update users set sex='M',birth_year=$2,height_cm=175,goal='mantenimento',occupation_level='sedentario',diet='onnivoro',paesi=ARRAY['italia'],evening_minutes=35,household_size=1,cook_days=ARRAY[1,2,3,4,5,6,7] where id=$1",[uid,new Date().getFullYear()-30]);
  await db.query("insert into body_measurements(user_id,measured_on,weight_kg,source) values($1,current_date,78,'utente')",[uid]);
  await calcolaESalvaTarget(admin,uid);
  const preview=await generaESalva(admin,uid,2026,{salva:false,dettagli:true,tempoMassimoMs:-1,numeroSpuntini:0,mantieniBloccati:false});
  assert.ok(preview.righe?.length&&!preview.errore,'Piano di prova non disponibile');check('anteprima senza scritture nei piani',await conta()===0);
  const target=(await db.query('select id from energy_targets where user_id=$1 order by computed_at desc,id desc limit 1',[uid])).rows[0];
  const meta={week_start:new Date().toISOString().slice(0,10),giorno_gratis:1,generated_at:new Date().toISOString(),energy_target_id:target.id,corpus_version:'test-generazione-atomica',seed:2026,gradino_raggiunto:String(preview.gradino),concessioni:preview.concessioni,dieta:'onnivoro',paesi:['italia']};
  const args=(ctx,rs=preview.righe,pm=meta)=>({p_user_id:uid,p_contesto:ctx,p_piano:pm,p_righe:rs});
  const contesto=()=>caricaContestoGenerazione(admin,uid);
  const ctx=await contesto();await db.query("update users set diet='vegano' where id=$1",[altro]);check('modifiche di un altro account non invalidano il contesto',JSON.stringify(await contesto())===JSON.stringify(ctx));
  const primo=await admin.rpc('quadrio_salva_generazione_v3',args(ctx));assert.ifError(primo.error);const planId=primo.data.id;
  const righeDB=(await db.query('select * from plan_items where plan_id=$1 order by day_of_week,id',[planId])).rows;
  check('piano completo e tutte le portate salvati insieme',primo.data.righe===preview.righe.length&&righeDB.length===preview.righe.length&&new Set(righeDB.map(r=>r.day_of_week)).size===7);
  check('nuova settimana fa avanzare il contesto',(await contesto()).versione!==ctx.versione);
  const statoPrimaAttesa=await stato(),ctxAttesa=await contesto();const blocco=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
  await blocco.connect();try{
   await blocco.query('BEGIN');await blocco.query('select id from users where id=$1 for update',[uid]);
   await db.query('BEGIN');await db.query("set local statement_timeout='100ms'");
   try{await db.query('select public.quadrio_salva_generazione_v3($1,$2::jsonb,$3::jsonb,$4::jsonb)',[uid,JSON.stringify(ctxAttesa),JSON.stringify(meta),JSON.stringify(preview.righe)]);assert.fail('Timeout atteso');}
   catch(e){check('attesa sul salvataggio interrotta dal timeout',e.code==='57014');}
   finally{await db.query('ROLLBACK');}
  }finally{await blocco.query('ROLLBACK');await blocco.end();}
  check('timeout non lascia piani portate o versioni parziali',await stato()===statoPrimaAttesa);
  let prima=await stato();const rotte=structuredClone(preview.righe);rotte.at(-1).dish_id=crypto.randomUUID();
  const tardivo=await admin.rpc('quadrio_salva_generazione_v3',args(await contesto(),rotte));check('errore tardivo di portata simulato dopo la creazione del piano',tardivo.error?.code==='23503');check('errore tardivo annulla piano portate e versione',await stato()===prima);
  const slotErrato=structuredClone(preview.righe);slotErrato[0].slot=slotErrato[0].slot==='colazione'?'primo':'colazione';slotErrato[0].meal=slotErrato[0].slot==='colazione'?'colazione':'pranzo';
  const slot=await admin.rpc('quadrio_salva_generazione_v3',args(await contesto(),slotErrato));check('tipo reale della portata controllato nella transazione',slot.error?.code==='22023'&&await stato()===prima);
  for(const [nome,modifica]of [
   ['porzione nulla',rs=>{rs[0].portion_g=null;}],['nutriente negativo',rs=>{rs[0].protein_g=-1;}],['pasto mancante',rs=>{delete rs[0].meal;}],['flag malformato',rs=>{rs[0].bloccato='false';}],['settimana incompleta',rs=>rs.splice(0,rs.length,...rs.filter(r=>r.day_of_week!==7))],['identificativo riga imposto',rs=>{rs[0].id=crypto.randomUUID();}],
  ]){const rs=structuredClone(preview.righe);modifica(rs);const r=await admin.rpc('quadrio_salva_generazione_v3',args(await contesto(),rs));check(nome+' rifiutato senza modificare dati',r.error?.code==='22023'&&await stato()===prima);}
  const privilegi=await admin.rpc('quadrio_salva_generazione_v3',args(await contesto(),preview.righe,{...meta,user_id:altro}));check('proprietario imposto nel payload rifiutato',privilegi.error?.code==='22023'&&await stato()===prima);
  const unItem=righeDB[0];
  async function conflitto(nome,cambia,ripristina){
   const c=await contesto();await cambia();const dopo=await stato();const r=await admin.rpc('quadrio_salva_generazione_v3',args(c));
   check(nome+' rilevato prima del salvataggio',r.error?.code==='PT409');check(nome+' non lascia un piano parziale',await stato()===dopo);
   if(ripristina)await ripristina();
  }
  await conflitto('dieta cambiata',()=>db.query("update users set diet='vegano' where id=$1",[uid]),()=>db.query("update users set diet='onnivoro' where id=$1",[uid]));
  let vincolo;
  await conflitto('esclusione aggiunta',async()=>{vincolo=(await db.query("insert into user_constraints(user_id,kind,subject,severity,categoria) values($1,'non_gradito','glutine di prova','assoluto','glutine') returning id",[uid])).rows[0].id;},()=>db.query('delete from user_constraints where id=$1 and user_id=$2',[vincolo,uid]));
  await conflitto('preferenza cucina cambiata',()=>db.query("insert into user_cuisine_preferences(user_id,cucina,rank) values($1,'europea',1)",[uid]),()=>db.query("delete from user_cuisine_preferences where user_id=$1 and cucina='europea'",[uid]));
  await conflitto('target aggiornato',()=>db.query('update energy_targets set kcal=kcal+1 where id=$1 and user_id=$2',[target.id,uid]),()=>db.query('update energy_targets set kcal=kcal-1 where id=$1 and user_id=$2',[target.id,uid]));
  await conflitto('scelta bloccata nel frattempo',()=>db.query('update plan_items set bloccato=true where id=$1 and plan_id=$2',[unItem.id,planId]),()=>db.query('update plan_items set bloccato=false where id=$1 and plan_id=$2',[unItem.id,planId]));
  await conflitto('gradimento aggiornato',()=>db.query("insert into meal_outcomes(user_id,plan_item_id,dish_id,status,skip_reason,reported_at) values($1,$2,$3,'saltato','gusto',now())",[uid,unItem.id,unItem.dish_id]),()=>db.query('delete from meal_outcomes where user_id=$1 and plan_item_id=$2',[uid,unItem.id]));
  // Le preferenze possono essere scritte direttamente dal loro proprietario
  // sotto RLS: il trigger privato non deve romperne il percorso.
  await db.query('BEGIN');try{
   await db.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:uid,role:'authenticated'})]);await db.query('SET LOCAL ROLE authenticated');
   await db.query("insert into public.user_cuisine_preferences(user_id,cucina,rank) values($1,'europea',1)",[uid]);await db.query('RESET ROLE');await db.query('COMMIT');check('preferenze del proprietario sotto RLS ancora modificabili',true);
  }catch(e){await db.query('ROLLBACK');throw e;}
  await db.query('delete from user_cuisine_preferences where user_id=$1',[uid]);
  const anon=await pubblico.rpc('quadrio_salva_generazione_v3',args(await contesto()));check('salvataggio non richiamabile con chiave pubblica',!!anon.error);
  const letturaAnon=await pubblico.rpc('quadrio_contesto_generazione_v2',{p_user_id:uid});check('metadati personali non leggibili con chiave pubblica',!!letturaAnon.error);
  const acl=(await db.query("select has_function_privilege('authenticated','public.quadrio_salva_generazione_v3(uuid,jsonb,jsonb,jsonb)','execute') as auth,has_function_privilege('service_role','public.quadrio_salva_generazione_v3(uuid,jsonb,jsonb,jsonb)','execute') as service,has_schema_privilege('authenticated','quadrio_internal','usage') as schema_auth")).rows[0];check('permessi riservati al backend',!acl.auth&&acl.service&&!acl.schema_auth);
  const simultaneo=await contesto(),primaConta=await conta();const rr=await Promise.all([admin.rpc('quadrio_salva_generazione_v3',args(simultaneo)),admin.rpc('quadrio_salva_generazione_v3',args(simultaneo))]);
  check('due salvataggi concorrenti: un solo successo',rr.filter(r=>!r.error).length===1&&rr.filter(r=>r.error?.code==='PT409').length===1);check('due salvataggi concorrenti: una sola settimana aggiunta',await conta()===primaConta+1);
  // Intercetta esattamente il punto fra costruzione reale e commit. Il nuovo
  // vincolo esclude un ingrediente reale del piatto appena scelto.
  let aggiunto;const proxy={from:(...a)=>admin.from(...a),rpc:async(n,a)=>{
   if(n==='quadrio_salva_generazione_v3'){
    const food=(await db.query('select food_id from dish_ingredients where dish_id=$1 order by food_id limit 1',[a.p_righe[0].dish_id])).rows[0];assert.ok(food);
    aggiunto=(await db.query("insert into user_constraints(user_id,kind,subject,severity,food_id) values($1,'non_gradito','ingrediente reale di prova','assoluto',$2) returning id",[uid,food.food_id])).rows[0].id;
   }
   return admin.rpc(n,a);
  }};
  const primaGena=await conta();await assert.rejects(generaESalva(proxy,uid,2026,{numeroSpuntini:0,mantieniBloccati:false,tempoMassimoMs:-1}),e=>e.status===409&&e.code==='contesto_generazione_modificato');
  check('generatore reale rifiuta una esclusione cambiata tra scelta e commit',await conta()===primaGena);
  await db.query('delete from user_constraints where id=$1 and user_id=$2',[aggiunto,uid]);
  const ultima=await generaESalva(admin,uid,2026,{numeroSpuntini:0,mantieniBloccati:false,tempoMassimoMs:-1});check('generazione reale con dati stabili salvata normalmente',typeof ultima.plan_id==='string'&&await conta()===primaGena+1);
 }finally{
  for(const id of creati){await db.query('BEGIN');try{for(const t of ['plans','energy_targets','user_constraints','user_cuisine_preferences','body_measurements','training_sessions','users'])await db.query('delete from '+t+' where '+(t==='users'?'id':'user_id')+'=$1',[id]);await db.query('COMMIT');}catch(e){await db.query('ROLLBACK');throw e;}
   const r=await admin.auth.admin.deleteUser(id);if(r.error)throw r.error;
   check('account e metadati di prova rimossi',Number((await db.query('select (select count(*) from users where id=$1)+(select count(*) from auth.users where id=$1)+(select count(*) from quadrio_internal.generazione_versioni where user_id=$1) as n',[id])).rows[0].n)===0);
  }
  await db.end();
 }
 console.log(`${verifiche.length} controlli reali superati su generazione atomica, contesto, concorrenza e pulizia.`);
 const output=process.argv.find(a=>a.startsWith('--output='));if(output)fs.writeFileSync(output.slice(9),JSON.stringify({verificato_il:new Date().toISOString(),verifiche,dati_di_prova_rimossi:true},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
