// 32 profili sintetici, catalogo reale paginato dal generatore, nessuna
// scrittura. Incrocia diete, 0/3 spuntini, cene 15/20 min, pranzo da portare,
// glutine escluso e cene con avanzi. Un'impossibilita' esplicita viene
// distinta da una settimana riuscita: non vale come piano conforme.
// --min-riuscite N impone anche una soglia di disponibilita' (0..32).
// Senza opzione si verifica soltanto la sicurezza delle risposte.
// I tempi qui sono per singola ricetta: non certificano la somma del pasto.
require('dotenv').config({quiet:true});
const assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const {generaESalva,caricaPiatti,caricaVincoli,limitiDi}=require('../genera');
const CASI_ATTESI=32;
const ID='00000000-0000-4000-8000-000000000001',CATALOGO=new Set(['dishes','dish_ingredients','foods','categorie_alimenti','tag_nutrizionali','alias_categoria']);
function leggiMinRiuscite(args){
 let minimo=0,presente=false;
 for(let i=0;i<args.length;i++){
  const arg=args[i];let valore;
  if(arg==='--min-riuscite')valore=args[++i];
  else if(arg.startsWith('--min-riuscite='))valore=arg.slice('--min-riuscite='.length);
  else throw new Error('Opzione sconosciuta: '+arg);
  if(presente)throw new Error('--min-riuscite puo essere specificato una sola volta');
  if(typeof valore!=='string'||!/^\d+$/.test(valore)||Number(valore)>CASI_ATTESI)
   throw new Error('--min-riuscite richiede un intero tra 0 e '+CASI_ATTESI);
  minimo=Number(valore);presente=true;
 }
 return minimo;
}
// plan_items arrotonda kcal all'intero, sale al centesimo e gli altri
// nutrienti al decimo. Anche portion_g e' arrotondata all'intero: quando
// si ricalcola dagli ingredienti va considerato quel mezzo grammo.
function verificaNutrientiGiornata(righe,concessioni,perId,giorno,proteineTarget){
 const campi=[['kcal','kcal',.5],['protein_g','protein',.05],['fibre_g','fibre',.05],['sat_fat_g','satFat',.05],['salt_g','salt',.005]];
 const tot=Object.fromEntries(campi.map(([k])=>[k,0])),n=righe.length,EPS=1e-6;
 assert.ok(Array.isArray(concessioni),'Concessioni assenti');
 for(const r of righe){
  const d=perId.get(r.dish_id);assert.ok(d&&Number.isFinite(d.grams)&&d.grams>0,'Ingredienti non verificabili');
  for(const [campo,origine,arrotondamento]of campi){
   assert.ok(Number.isFinite(r[campo])&&r[campo]>=0,'Nutriente non valido: '+campo);
   assert.ok(Number.isFinite(d[origine])&&d[origine]>=0,'Nutriente catalogo non valido: '+origine);
   const ricalcolato=d[origine]*r.portion_g/d.grams,margine=arrotondamento+d[origine]/d.grams*.5;
   assert.ok(Math.abs(r[campo]-ricalcolato)<=margine+EPS,'Nutriente incoerente con porzione e ingredienti: '+campo);
   tot[campo]+=r[campo];
  }
 }
 const ha=vincolo=>concessioni.some(c=>c.giorno===giorno&&c.vincolo===vincolo);
 const kcalMin=tot.kcal-n*.5,kcalMax=tot.kcal+n*.5,proteineMin=proteineTarget*.9;
 if(tot.protein_g+n*.05<proteineMin-EPS)assert.ok(ha('proteine_minime'),'Deficit proteico non dichiarato');
 if(tot.fibre_g+n*.05<Math.max(25,kcalMin*.014)-EPS)assert.ok(ha('fibra_minima'),'Deficit di fibra non dichiarato');
 if(tot.salt_g-n*.005>5+EPS||tot.sat_fat_g-n*.05>kcalMax*.1/9+EPS)assert.ok(ha('tetto_sale_saturi'),'Sale/saturi oltre il limite non dichiarati');
 if(ha('proteine_minime'))assert.ok(tot.protein_g-n*.05<proteineMin+EPS,'Concessione proteica obsoleta');
 if(ha('fibra_minima'))assert.ok(tot.fibre_g-n*.05<Math.max(25,kcalMax*.014)+EPS,'Concessione fibra obsoleta');
 if(ha('tetto_sale_saturi'))assert.ok(tot.salt_g+n*.005>=5-EPS||tot.sat_fat_g+n*.05>=kcalMin*.1/9-EPS,'Concessione sale/saturi obsoleta');
 return tot;
}
function query(data){const q={select:()=>q,eq:()=>q,order:()=>q,limit:()=>q,range:()=>q,maybeSingle:async()=>({data,error:null}),then:(resolve,reject)=>Promise.resolve({data,error:null}).then(resolve,reject),insert:()=>{throw Error('Scrittura proibita');},update:()=>{throw Error('Scrittura proibita');},delete:()=>{throw Error('Scrittura proibita');}};return q;}
function client(caso,reale){const dati={
 users:{diet:caso.dieta,evening_minutes:caso.minuti,paesi:['italia'],household_size:1,cook_days:caso.fuori?[1,3,5]:[1,2,3,4,5,6,7],lunch_away:caso.fuori,pasti_casa:Object.fromEntries([1,2,3,4,5,6,7].map(g=>[g,{pranzo:!caso.fuori,cena:true}]))},
 energy_targets:{id:'target-sintetico',kcal:2000,protein_g_min:85},user_cuisine_preferences:[],meal_outcomes:[],plans:[],plan_items:[],
 user_constraints:caso.fuori?[{kind:'allergia',subject:'glutine',severity:'assoluto',categoria:'glutine',food_id:null}]:[],
 };return{rpc:(...args)=>reale.rpc(...args),from(t){if(Object.hasOwn(dati,t))return query(dati[t]);assert.ok(CATALOGO.has(t),'Tabella inattesa '+t);return reale.from(t);}};}
async function verificaMatrice(args=process.argv.slice(2)){
 const minRiuscite=leggiMinRiuscite(args);
 const reale=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY);
 const perId=new Map((await caricaPiatti(reale,['mediterranea'],6)).map(p=>[p.id,p]));let riusciti=0,impossibili=0,falliti=0,violazioni=0,porzioni=0;const risultati=[];
 for(const dieta of ['onnivoro','pescetariano','vegetariano','vegano'])for(const minuti of [15,20])for(const snack of [0,3])for(const fuori of [false,true]){
  const caso={dieta,minuti,snack,fuori},label=JSON.stringify(caso);
  try{
   const c=client(caso,reale),p=await generaESalva(c,ID,2026,{salva:false,dettagli:true,tempoMassimoMs:-1,numeroSpuntini:snack});
   if(p.errore){assert.equal(p.errore,'piano_impossibile');assert.ok(p.vincolo_bloccante);assert.ok(!p.plan_id&&!p.righe);impossibili++;risultati.push({...caso,esito:'non_completato',vincolo_bloccante:p.vincolo_bloccante,dettaglio:p.dettaglio??null,diagnostica:p.diagnostica??null});console.log('NON COMPLETATO '+label+' / '+p.vincolo_bloccante);continue;}
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
    verificaNutrientiGiornata(rs,p.concessioni,perId,giorno,85);
   }
   riusciti++;risultati.push({...caso,esito:'riuscito'});console.log('OK '+label);
  }catch(e){falliti++;const violazione=e.code==='ERR_ASSERTION';if(violazione)violazioni++;risultati.push({...caso,esito:violazione?'violazione':'errore',errore:e.message});console.error('FALLITO '+label+': '+e.message);}
 }
 console.log(`Matrice estesa: ${riusciti} settimane riuscite, ${impossibili} non completate con risposta esplicita, ${falliti} errori; ${porzioni} porzioni controllate.`);
 const riepilogo={controllo_tempi:'singola_ricetta',somma_tempi_verificata:false,casi_attesi:CASI_ATTESI,casi_eseguiti:risultati.length,riusciti,non_completati:impossibili,violazioni_rilevate:violazioni,errori:falliti-violazioni,porzioni_controllate:porzioni,min_riuscite:minRiuscite,soglia_raggiunta:riusciti>=minRiuscite,casi:risultati};
 console.log('MATRICE_JSON '+JSON.stringify(riepilogo));
 if(riusciti<minRiuscite)console.error(`Soglia di disponibilita' non raggiunta: ${riusciti}/${minRiuscite} settimane riuscite richieste.`);
 if(falliti||riusciti<minRiuscite)process.exitCode=1;
 return riepilogo;
}
if(require.main===module)verificaMatrice().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={client,leggiMinRiuscite,verificaNutrientiGiornata,verificaMatrice};
