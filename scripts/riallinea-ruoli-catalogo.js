// Lotto pubblico verificato: modifica soltanto i due campi dei ruoli di 23
// ricette. Default sola lettura; --prova-rollback verifica la transazione.
require('dotenv').config({quiet:true});
const {Client}=require('pg');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {mappaDaAlimenti,classificaPiatti}=require('../classifica-ruoli-piatti');
const lotto=require('../test/fixtures/ruoli-catalogo.json');
const stessi=(a,b)=>JSON.stringify([...(a||[])].sort())===JSON.stringify([...(b||[])].sort());
const stessiRuoli=(a,b)=>a.ruolo_primario===b.ruolo_primario&&stessi(a.ruoli_coperti,b.ruoli_coperti);
async function main(){
 const args=process.argv.slice(2),apply=args.includes('--apply'),prova=args.includes('--prova-rollback');
 assert.ok(!apply||!prova,'Scegliere una sola modalita');
 for(const a of args)assert.ok(['--apply','--prova-rollback'].includes(a)||a.startsWith('--backup=')||a.startsWith('--output='),'Opzione sconosciuta');
 const opzione=k=>args.find(a=>a.startsWith(k+'='))?.slice(k.length+1);
 const backup=opzione('--backup'),output=opzione('--output');
 if(apply||prova)assert.ok(backup,'Indicare --backup prima di qualsiasi aggiornamento');
 const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});let aperta=false;
 try{
  await db.connect();
  await db.query(apply||prova?'BEGIN':'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');aperta=true;
  // Le fonti dei ruoli restano ferme fino al commit; nessun dato personale
  // viene letto o scritto. I lock sono acquisiti prima di rileggere il lotto.
  if(apply||prova)await db.query('LOCK TABLE dishes IN SHARE ROW EXCLUSIVE MODE; LOCK TABLE foods,dish_ingredients IN SHARE MODE');
  const ids=lotto.dishes.map(p=>p.id);
  const piatti=(await db.query("select id,name,name_en,meal_slot,ha_amido,ha_proteina,ruolo_primario,ruoli_coperti from dishes where id=ANY($1::uuid[]) and mercati @> ARRAY['it']::text[] order by id",[ids])).rows;
  assert.equal(piatti.length,ids.length,'Lotto non piu presente nel mercato italiano');
  const righe=(await db.query('select di.dish_id,di.food_id,di.grams,f.name,f.name_it,f.protein_100g from dish_ingredients di join foods f on f.id=di.food_id where di.dish_id=ANY($1::uuid[]) order by di.dish_id,di.food_id',[ids])).rows;
  for(const r of righe)assert.ok(r.grams!=null&&Number.isFinite(Number(r.grams))&&Number(r.grams)>0&&r.protein_100g!=null&&Number.isFinite(Number(r.protein_100g))&&Number(r.protein_100g)>=0,'Ingrediente incompleto prima del ricalcolo');
  const foodAttesi=new Map(lotto.foods.map(f=>[f.id,f]));
  const composizione=rs=>rs.map(i=>({dish_id:i.dish_id,food_id:i.food_id,grams:Number(i.grams),protein_100g:Number(i.protein_100g)})).sort((a,b)=>(a.dish_id+'/'+a.food_id).localeCompare(b.dish_id+'/'+b.food_id));
  assert.deepEqual(composizione(righe),composizione(lotto.dish_ingredients),'Ingredienti o nutrienti modificati dopo la verifica');
  const foods=new Map(),per={};
  for(const r of righe){
   const atteso=foodAttesi.get(r.food_id);assert.ok(atteso);
   assert.equal(r.name,atteso.name,'Nome alimento cambiato');assert.equal(r.name_it,atteso.name_it,'Nome italiano cambiato');
   foods.set(r.food_id,{id:r.food_id,name:r.name,name_it:r.name_it});
   (per[r.dish_id]||=[]).push({food_id:r.food_id,grams:Number(r.grams),proteina:Number(r.protein_100g)*Number(r.grams)/100});
  }
  const {aggiornamenti,dubbi}=classificaPiatti(piatti,per,mappaDaAlimenti([...foods.values()]));
  assert.equal(dubbi.length,0,'Il classificatore segnala nuovi dubbi');assert.equal(aggiornamenti.length,ids.length);
  const attesi=new Map(lotto.attesi.map(p=>[p.id,p])),prima=new Map(lotto.dishes.map(p=>[p.id,p]));
  for(const p of aggiornamenti)assert.ok(stessiRuoli(p,attesi.get(p.id)),'Proposta cambiata rispetto al lotto verificato');
  for(const p of piatti)assert.ok(stessiRuoli(p,prima.get(p.id))||stessiRuoli(p,attesi.get(p.id)),'Ruoli modificati da un altro lavoro: '+p.id);
  const daCambiare=piatti.filter(p=>!stessiRuoli(p,attesi.get(p.id)));
  const rapporto={verificato_il:new Date().toISOString(),modalita:apply?'apply':prova?'prova_rollback':'sola_lettura',ricette:ids.length,da_cambiare:daCambiare.length,dati_utente_modificati:false,ingredienti_modificati:false,nutrienti_modificati:false,soglie_modificate:false};
  if(backup)fs.writeFileSync(backup,JSON.stringify({...rapporto,precedenti:piatti,successivi:lotto.attesi,ingredienti:righe},null,2),{flag:'wx'});
  if(apply||prova){
   for(const p of daCambiare){const nuovo=attesi.get(p.id);const r=await db.query('update dishes set ruolo_primario=$1,ruoli_coperti=$2 where id=$3',[nuovo.ruolo_primario,nuovo.ruoli_coperti,p.id]);assert.equal(r.rowCount,1);}
   const dopo=(await db.query('select id,ruolo_primario,ruoli_coperti from dishes where id=ANY($1::uuid[]) order by id',[ids])).rows;
   assert.ok(dopo.every(p=>stessiRuoli(p,attesi.get(p.id))));
  }
  await db.query(prova?'ROLLBACK':'COMMIT');aperta=false;
  if(prova){const dopo=(await db.query('select id,ruolo_primario,ruoli_coperti from dishes where id=ANY($1::uuid[]) order by id',[ids])).rows;assert.ok(dopo.every(p=>stessiRuoli(p,piatti.find(q=>q.id===p.id))));rapporto.rollback_verificato=true;}
  rapporto.applicati=apply?daCambiare.length:0;
  if(output)fs.writeFileSync(output,JSON.stringify(rapporto,null,2));console.log(JSON.stringify(rapporto));
 }finally{if(aperta)await db.query('ROLLBACK');await db.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
