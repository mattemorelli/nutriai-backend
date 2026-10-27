// 32 profili sintetici, catalogo reale paginato dal generatore, nessuna
// scrittura. Incrocia diete, 0/3 spuntini, cene 15/20 min, pranzo da portare,
// glutine escluso e cene con avanzi. Un'impossibilita' esplicita viene
// distinta da una settimana riuscita: non vale come piano conforme.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const {generaESalva,caricaPiatti,caricaVincoli,limitiDi}=require('../genera');
const reale=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY);
const ID='00000000-0000-4000-8000-000000000001',CATALOGO=new Set(['dishes','dish_ingredients','foods','categorie_alimenti','tag_nutrizionali','alias_categoria']);
function query(data){const q={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,range:()=>q,maybeSingle:async()=>({data,error:null}),then:(resolve,reject)=>Promise.resolve({data,error:null}).then(resolve,reject),insert:()=>{throw Error('Scrittura proibita');},update:()=>{throw Error('Scrittura proibita');},delete:()=>{throw Error('Scrittura proibita');}};return q;}
function client(caso){const dati={
 users:{diet:caso.dieta,evening_minutes:caso.minuti,paesi:['italia'],household_size:1,cook_days:caso.fuori?[1,3,5]:[1,2,3,4,5,6,7],lunch_away:caso.fuori,pasti_casa:Object.fromEntries([1,2,3,4,5,6,7].map(g=>[g,{pranzo:!caso.fuori,cena:true}]))},
 energy_targets:{id:'target-sintetico',kcal:2000,protein_g_min:85},user_cuisine_preferences:[],meal_outcomes:[],plans:[],plan_items:[],
 user_constraints:caso.fuori?[{kind:'allergia',subject:'glutine',severity:'assoluto',categoria:'glutine',food_id:null}]:[],
 };return{from(t){if(Object.hasOwn(dati,t))return query(dati[t]);assert.ok(CATALOGO.has(t),'Tabella inattesa '+t);return reale.from(t);}};}
(async()=>{
 const perId=new Map((await caricaPiatti(reale,['mediterranea'],6)).map(p=>[p.id,p]));let riusciti=0,impossibili=0,falliti=0,porzioni=0;
 for(const dieta of ['onnivoro','pescetariano','vegetariano','vegano'])for(const minuti of [15,20])for(const snack of [0,3])for(const fuori of [false,true]){
  const caso={dieta,minuti,snack,fuori},label=JSON.stringify(caso);
  try{
   const c=client(caso),p=await generaESalva(c,ID,2026,{salva:false,dettagli:true,tempoMassimoMs:-1,numeroSpuntini:snack});
   if(p.errore){assert.equal(p.errore,'piano_impossibile');assert.ok(p.vincolo_bloccante);assert.ok(!p.plan_id&&!p.righe);impossibili++;console.log('NON COMPLETATO '+label+' / '+p.vincolo_bloccante);continue;}
   assert.equal(p.plan_id,null);assert.ok(p.righe?.length);const vincoli=await caricaVincoli(c,ID,dieta);
   for(let giorno=1;giorno<=7;giorno++){
    const rs=p.righe.filter(r=>r.day_of_week===giorno);assert.ok(rs.length);assert.equal(rs.filter(r=>r.meal==='spuntino').length,snack,'Numero spuntini');
    let kcal=0,proteine=0;
    for(const r of rs){const d=perId.get(r.dish_id);assert.ok(d,'Piatto reale assente');assert.ok(vincoli.ammesso(d),'Dieta/allergia');
     const limiti=[limitiDi({slot:r.slot,piatto:d},2000),limitiDi({slot:r.slot,piatto:d,cercaProteine:true},2000)];
     const min=Math.round(Math.min(...limiti.map(l=>l[0]))*d.grams),max=Math.round(Math.max(...limiti.map(l=>l[1]))*d.grams);
     assert.ok(Number.isFinite(r.portion_g)&&r.portion_g>0&&r.portion_g>=min&&r.portion_g<=max,'Porzione fuori intervallo');
     if(!r.avanzi){const limite=r.meal==='colazione'?15:r.meal==='spuntino'?10:giorno>5?75:r.meal==='pranzo'?Math.max(minuti,25):minuti;
      const tempo=d.prep_min||(r.meal==='colazione'?10:r.meal==='spuntino'?5:r.slot==='contorno'?20:30);assert.ok(tempo<=limite,'Tempo');
      if(giorno<=5&&['pranzo','cena'].includes(r.meal))assert.equal(d.tecnica||'semplice','semplice','Tecnica feriale');
     }else assert.ok(p.righe.some(q=>q.dish_id===r.dish_id&&!q.avanzi&&q.day_of_week<giorno),'Avanzo senza preparazione');
     if(fuori&&r.meal==='pranzo')assert.equal(d.trasportabile,true,'Pranzo non trasportabile');
     kcal+=r.kcal;proteine+=r.protein_g;porzioni++;
    }
    assert.ok(Math.abs(kcal-2000)<=200+rs.length*.5,'Calorie');
    if(proteine+rs.length*.05+.051<85*.9)assert.ok(p.concessioni.some(x=>x.giorno===giorno&&x.vincolo==='proteine_minime'),'Deficit non dichiarato');
   }
   riusciti++;console.log('OK '+label);
  }catch(e){falliti++;console.error('FALLITO '+label+': '+e.message);}
 }
 console.log(`Matrice estesa: ${riusciti} settimane riuscite, ${impossibili} non completate con risposta esplicita, ${falliti} errori; ${porzioni} porzioni controllate.`);
 if(falliti)process.exitCode=1;
})().catch(e=>{console.error(e.message);process.exitCode=1;});
