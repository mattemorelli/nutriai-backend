// Solo SQL e funzioni pure: nessuna scrittura nel catalogo o nei dati utente.
require('dotenv').config({quiet:true});
const {Client}=require('pg');
const fs=require('node:fs');
const {mappaDaAlimenti,classificaPiatti}=require('../classifica-ruoli-piatti');
const stessi=(a,b)=>JSON.stringify([...(a||[])].sort())===JSON.stringify([...(b||[])].sort());
async function verifica(){
 const db=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
 try{
  await db.connect();
  await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const foods=(await db.query('select id,name,name_it from foods order by id')).rows;
  const piatti=(await db.query('select id,name,name_en,meal_slot,ha_amido,ha_proteina,ruolo_primario,ruoli_coperti from dishes where mercati @> ARRAY[\'it\']::text[] order by id')).rows;
  const ingredienti=(await db.query('select di.dish_id,di.food_id,di.grams,f.protein_100g from dish_ingredients di left join foods f on f.id=di.food_id join dishes d on d.id=di.dish_id where d.mercati @> ARRAY[\'it\']::text[] order by di.dish_id,di.food_id')).rows;
  const ingredientiPer={};
  for(const i of ingredienti){
   const grams=Number(i.grams),proteina=Number(i.protein_100g);
   if(i.grams==null||!Number.isFinite(grams)||grams<=0||i.protein_100g==null||!Number.isFinite(proteina)||proteina<0)throw Error('Ingrediente incompleto: '+i.dish_id);
   (ingredientiPer[i.dish_id]||=[]).push({food_id:i.food_id,grams,proteina:proteina*grams/100});
  }
  const {aggiornamenti,dubbi}=classificaPiatti(piatti,ingredientiPer,mappaDaAlimenti(foods));
  const perId=new Map(piatti.map(p=>[p.id,p]));
  const differenze=aggiornamenti.filter(p=>{const vecchio=perId.get(p.id);return p.ruolo_primario!==vecchio.ruolo_primario||!stessi(p.ruoli_coperti,vecchio.ruoli_coperti);}).map(p=>({id:p.id,nome:perId.get(p.id).name,attuale:{ruolo_primario:perId.get(p.id).ruolo_primario,ruoli_coperti:perId.get(p.id).ruoli_coperti},proposta:p}));
  const riepilogo={piatti:piatti.length,classificabili:aggiornamenti.length,differenze:differenze.length,casi_dubbi:dubbi.length};
  const rapporto={verificato_il:new Date().toISOString(),riepilogo,differenze,dubbi};
  const output=process.argv.find(a=>a.startsWith('--output='));if(output)fs.writeFileSync(output.slice(9),JSON.stringify(rapporto,null,2));
  console.log(JSON.stringify(riepilogo));
  await db.query('COMMIT');
  if(differenze.length)throw Error('Ruoli canonici da riallineare: '+differenze.length);
  if(dubbi.length)console.log('APERTO G4: '+dubbi.length+' casi dubbi da revisionare; nessuna classificazione forzata.');
  if(process.argv.includes('--lancio')&&dubbi.length)throw Error('Casi dubbi aperti prima del lancio');
 }finally{await db.end();}
}
verifica().catch(e=>{console.error(e.message);process.exitCode=1;});
