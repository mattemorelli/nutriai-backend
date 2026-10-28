// Confronto sullo stesso catalogo, profilo e seed. Nessuna scrittura.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const {generaESalva,caricaPiatti}=require('../genera');
const {client,verificaNutrientiGiornata}=require('./verifica-matrice-vincoli-estesa');
const reale=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY),ID='00000000-0000-4000-8000-000000000001';
(async()=>{
 const perId=new Map((await caricaPiatti(reale,['mediterranea'],6)).map(d=>[d.id,d]));let giorni=0,migliorati=0;
 function tot(rs){const v={kcal:0,protein:0,fibre:0,salt:0,satFat:0,fat:0,grammiFruttaSecca:0},m={...v};for(const r of rs){const d=perId.get(r.dish_id);for(const k of Object.keys(v)){assert.ok(Number.isFinite(d[k]));v[k]+=d[k]*r.portion_g/d.grams;m[k]+=d[k]/d.grams*.5;}}return{v,m};}
 for(const dieta of ['onnivoro','pescetariano','vegetariano','vegano'])for(const snack of [0,3]){
  const caso={dieta,minuti:20,snack,fuori:true},c=client(caso,reale),opz={salva:false,dettagli:true,tempoMassimoMs:-1,numeroSpuntini:snack};
  const prima=await generaESalva(c,ID,2026,{...opz,miglioraNutrienti:false,recuperaTempo:false}),dopo=await generaESalva(c,ID,2026,opz);
  assert.ok(prima.righe?.length&&dopo.righe?.length,'Settimana di confronto mancante');
  for(let g=1;g<=7;g++){
   const a=prima.righe.filter(r=>r.day_of_week===g),b=dopo.righe.filter(r=>r.day_of_week===g),{v:x,m:mx}=tot(a),{v:y,m:my}=tot(b),m=k=>mx[k]+my[k]+1e-5;
   assert.equal(b.filter(r=>r.meal==='spuntino').length,snack);
   verificaNutrientiGiornata(b,dopo.concessioni,perId,g,85);
   assert.ok(y.protein+m('protein')>=Math.min(85,x.protein),'Proteine peggiorate');
   assert.ok(y.fibre+m('fibre')>=Math.min(x.fibre,Math.max(25,y.kcal*.014)),'Fibra peggiorata');
   assert.ok(y.salt<=Math.max(5,x.salt)+m('salt'),'Sale peggiorato');
   assert.ok((y.satFat-m('satFat'))*9/(y.kcal+m('kcal'))<=Math.max(.1,(x.satFat+m('satFat'))*9/(x.kcal-m('kcal'))),'Saturi peggiorati');
   assert.ok((y.fat-m('fat'))*9/(y.kcal+m('kcal'))<=Math.max(.35,(x.fat+m('fat'))*9/(x.kcal-m('kcal'))),'Quota grassi peggiorata');
   assert.ok(y.grammiFruttaSecca<=Math.max(40,x.grammiFruttaSecca)+m('grammiFruttaSecca')+.1,'Quantita frutta secca peggiorata');
   for(const meal of ['pranzo','cena']){
    const minuti=rs=>rs.filter(r=>r.meal===meal).reduce((s,r)=>{const d=perId.get(r.dish_id);return s+(d.prep_min??(d.meal_slot==='contorno'?20:30));},0);
    assert.ok(minuti(b)<=Math.max(g>5?75:meal==='pranzo'?25:20,minuti(a)),'Tempo complessivo peggiorato');
   }
   if(y.protein>x.protein+.5||y.fibre>x.fibre+.5||y.salt<x.salt-.1)migliorati++;
   giorni++;
  }
 }
 console.log(`${giorni}/56 giornate confrontate: nutrienti e tempi protetti; ${migliorati} miglioramenti rilevati. Nessuna scrittura.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
