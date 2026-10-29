// Regressioni con ricette reali e profilo sintetico: sola lettura del catalogo.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const {generaESalva,caricaPiatti,caricaVincoli,limitiDi}=require('../genera');
const {verificaNutrientiGiornata}=require('./verifica-matrice-vincoli-estesa');
const reale=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY);
const ID='00000000-0000-4000-8000-000000000001';
const CATALOGO=new Set(['dishes','dish_ingredients','foods','categorie_alimenti','tag_nutrizionali','alias_categoria']);
const riga=(day_of_week,meal,slot,dish_id)=>({day_of_week,meal,slot,dish_id,bloccato:true});
const secondo=riga(1,'pranzo','secondo','5f5092c7-e4e5-4cea-865d-6884ad3a6af8');
const pane=riga(1,'pranzo','contorno','950107bb-00a2-4b6b-9983-b01e4f8c779e');
const primo=riga(2,'pranzo','primo','22222222-0001-0001-0001-000000000001');
const verdura=riga(1,'pranzo','contorno','a3900001-0000-0000-0000-000000000001');
const fonte=riga(1,'cena','secondo','660082a3-b74c-4501-a8ac-0a58386fb18f');
function query(data){const q={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,range:()=>q,maybeSingle:async()=>({data:Array.isArray(data)?data[0]||null:data,error:null}),then:(a,b)=>Promise.resolve({data,error:null}).then(a,b),insert(){throw Error('Scrittura proibita');},update(){throw Error('Scrittura proibita');},delete(){throw Error('Scrittura proibita');}};return q;}
function client(pin){const dati={users:{diet:'vegano',paesi:['italia'],household_size:1,evening_minutes:20,cook_days:[1,3,5],lunch_away:true,pasti_casa:Object.fromEntries([1,2,3,4,5,6,7].map(g=>[g,{pranzo:false,cena:true}]))},energy_targets:{id:'target-sintetico',kcal:2000,protein_g_min:85},user_constraints:[{kind:'allergia',subject:'glutine',severity:'assoluto',categoria:'glutine',food_id:null}],user_cuisine_preferences:[],meal_outcomes:[],plans:{id:'piano-sintetico'},plan_items:pin};return{rpc:(...args)=>reale.rpc(...args),from(t){if(Object.hasOwn(dati,t))return query(dati[t]);assert.ok(CATALOGO.has(t),'Tabella inattesa '+t);return reale.from(t);}};}
(async()=>{
 const perId=new Map((await caricaPiatti(reale,['mediterranea'],6)).map(d=>[d.id,d]));
 let n=0;
 for(const [nome,pin]of [['secondo pranzo',[secondo]],['base pranzo',[pane]],['primo pranzo',[primo]],['verdura pranzo',[verdura]],['fonte degli avanzi',[fonte]],['tre scelte insieme',[secondo,pane,fonte]]]){
  for(const r of pin)assert.ok(perId.has(r.dish_id),'Ricetta reale mancante nella regressione '+nome);
  const c=client(pin),p=await generaESalva(c,ID,2026,{salva:false,dettagli:true,tempoMassimoMs:-1,numeroSpuntini:0});
  assert.ok(!p.errore&&p.righe?.length,nome+': '+JSON.stringify(p));assert.equal(p.plan_id,null);
  for(const b of pin)assert.ok(p.righe.some(r=>r.day_of_week===b.day_of_week&&r.meal===b.meal&&r.slot===b.slot&&r.dish_id===b.dish_id&&r.bloccato),'Scelta bloccata persa: '+nome);
  const vincoli=await caricaVincoli(c,ID,'vegano');
  for(let g=1;g<=7;g++){
   const rs=p.righe.filter(r=>r.day_of_week===g);assert.ok(rs.length);assert.ok(rs.every(r=>r.meal!=='spuntino'),'Aggiunto uno spuntino non richiesto');
   const kcal=rs.reduce((s,r)=>s+r.kcal,0);assert.ok(Math.abs(kcal-2000)<=200+rs.length*.5,'Calorie fuori intervallo');
   verificaNutrientiGiornata(rs,p.concessioni,perId,g,85);
   for(const meal of ['pranzo','cena'])assert.ok(rs.filter(r=>r.meal===meal&&perId.get(r.dish_id).amidoReale).length<=1,'Doppio amido');
   for(const r of rs){const d=perId.get(r.dish_id);assert.ok(d&&vincoli.ammesso(d),'Dieta o glutine violati');
    const ll=[limitiDi({slot:r.slot,piatto:d},2000),limitiDi({slot:r.slot,piatto:d,cercaProteine:true},2000)];
    assert.ok(r.portion_g>0&&r.portion_g>=Math.round(Math.min(...ll.map(x=>x[0]))*d.grams)&&r.portion_g<=Math.round(Math.max(...ll.map(x=>x[1]))*d.grams),'Porzione fuori limiti');
    if(r.meal==='pranzo')assert.equal(d.trasportabile,true,'Pranzo non trasportabile');
    if(r.avanzi)assert.ok(p.righe.some(a=>a.day_of_week<g&&a.dish_id===r.dish_id&&!a.avanzi),'Avanzo senza preparazione');
    else{const limite=r.meal==='colazione'?15:g>5?75:r.meal==='pranzo'?25:20;assert.ok((d.prep_min||(r.meal==='colazione'?10:r.slot==='contorno'?20:30))<=limite,'Tempo della ricetta');}
   }
  }
  if(pin.includes(fonte))assert.ok(p.righe.some(r=>r.day_of_week===2&&r.meal==='cena'&&r.dish_id===fonte.dish_id&&r.avanzi),'Fonte bloccata non riutilizzata');
  n++;console.log('OK pin '+nome);
 }
 console.log(`${n}/6 regressioni pin, porzioni, nutrienti e avanzi superate. Nessuna scrittura.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
