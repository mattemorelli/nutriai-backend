// Piani sintetici con recupero difficile, cene rapide e piatti bloccati.
// Sola lettura del catalogo reale; nessun piano o utente scritto.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const { generaESalva, caricaPiatti, caricaVincoli, limitiDi, QUOTE, accompagnaBene, sostitutoSenzaGlutineNonRichiesto } = require(process.argv[2] || path.join(__dirname, '../genera.js'));
const reale = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const ID = '00000000-0000-4000-8000-000000000001';
const DIETE = ['onnivoro', 'pescetariano', 'vegetariano', 'vegano'];

function query(data) {
  const risultato = { data, error: null };
  const q = { select: () => q, eq: () => q, order: () => q, limit: () => q,
    maybeSingle: () => Promise.resolve(risultato),
    then: (resolve, reject) => Promise.resolve(risultato).then(resolve, reject),
  };
  return q;
}
function cliente(dieta, minuti, kcal, proteine, bloccati = [], extraUser = {}) {
  const dati = {
    users: { diet: dieta, cook_days: [1, 2, 3, 4, 5, 6, 7], lunch_away: false,
      pasti_casa: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(g => [g, { pranzo: true, cena: true }])),
      evening_minutes: minuti, household_size: 1, paesi: ['italia'], ...extraUser },
    energy_targets: { id: 'target-sintetico', kcal, protein_g_min: proteine },
    user_cuisine_preferences: [], user_constraints: [], meal_outcomes: [],
    plans: bloccati.length ? { id: 'precedente-sintetico' } : null,
    plan_items: bloccati,
  };
  const CATALOGO = new Set(['dishes', 'dish_ingredients', 'foods', 'categorie_alimenti', 'tag_nutrizionali', 'alias_categoria']);
  return { from(tabella) {
    if (Object.hasOwn(dati, tabella)) return query(dati[tabella]);
    assert.ok(CATALOGO.has(tabella), 'Accesso inatteso: ' + tabella);
    return reale.from(tabella);
  } };
}


function nutrienti(righe) {
 const giorni=new Map();
 for(const r of righe){const g=giorni.get(r.day_of_week)||{kcal:0,protein:0,n:0};g.kcal+=r.kcal;g.protein+=r.protein_g;g.n++;giorni.set(r.day_of_week,g);}
 return giorni;
}
(async()=>{
 const catalogo=await caricaPiatti(reale,['mediterranea'],6);const perId=new Map(catalogo.map(p=>[p.id,p]));
 const opts={salva:false,dettagli:true,tempoMassimoMs:-1};let modelli=0,casi=0;
 async function verifica(p,dieta,bloccati=[],extraUser={}){
  assert.ok(!p.errore&&p.righe?.length,p.errore+': '+p.vincolo_bloccante);
  assert.ok(p.giorni_conformi>=0&&p.giorni_conformi<=7,'Conteggio dei giorni conforme non valido');
  const vincoli=await caricaVincoli(cliente(dieta,35,2400,100,bloccati,extraUser),ID,dieta);
  for(const r of p.righe){
   const d=perId.get(r.dish_id);assert.ok(d);
   assert.equal(r.slot,d.meal_slot,'Slot salvato diverso dal tipo reale della portata');
   assert.ok(vincoli.ammesso(d),'Dieta violata');
   const max=limitiDi({slot:r.slot,piatto:d},2400)[1]*d.grams;
   assert.ok(r.portion_g>0&&r.portion_g<=Math.round(max),'Porzione non valida');
   if(extraUser.lunch_away&&r.meal==='pranzo')assert.ok(d.trasportabile,'Piatto non trasportabile');
  }
  for(const b of bloccati)assert.ok(p.righe.some(r=>r.day_of_week===b.day_of_week&&r.meal===b.meal&&r.slot===b.slot&&r.dish_id===b.dish_id&&r.bloccato),'Piatto bloccato perso');
  for(const [giorno,g]of nutrienti(p.righe))assert.ok(Math.abs(g.kcal-2400)<=240+g.n*.5,'Calorie fuori target');
  for(const m of p.modelli_pasti||[]){
   const ps=p.righe.filter(r=>r.day_of_week===m.giorno&&r.meal===m.meal).map(r=>perId.get(r.dish_id));
   assert.ok(ps.every(d=>Array.isArray(d.ruoli_coperti)&&d.ruoli_coperti.length),'Ricetta con composizione non definita nel nuovo modello');
   const totale=ps.reduce((s,d)=>s+(d.prep_min??(d.meal_slot==='contorno'?20:30)),0);
   assert.ok(totale<=(m.giorno<=5?35:75),'Somma dei tempi fuori limite');
   if(m.modello==='piatto_unico')assert.ok(ps.length===1&&['proteina_principale','base_amidacea','verdura'].every(r=>ps[0].ruoli_coperti.includes(r)),'Piatto unico incompleto');
   if(m.modello==='completo')assert.ok(ps.some(p=>p.meal_slot==='primo')&&ps.some(p=>p.meal_slot==='secondo'));
  }
  casi++;
 }
 for(const dieta of DIETE){
  const prima=await generaESalva(cliente(dieta,35,2400,100),ID,2026,{...opts,modelliPasto:false});
  const dopo=await generaESalva(cliente(dieta,35,2400,100),ID,2026,opts);
  await verifica(dopo,dieta);assert.ok(!prima.errore,'Piano di confronto non disponibile');
  const a=nutrienti(prima.righe),b=nutrienti(dopo.righe);
  for(const [giorno,g]of b)assert.ok(g.protein+(g.n+a.get(giorno).n)*.05+.01>=Math.min(100,a.get(giorno).protein),'Proteine peggiorate');
  const frequenze=p=>{
   const chiavi=new Set(),usi={};
   for(const r of p.righe){const d=perId.get(r.dish_id);if(!['pranzo','cena'].includes(r.meal)||!d.gruppo||!(d.ruoli_coperti||[]).includes('proteina_principale'))continue;
    const k=`${r.day_of_week}:${r.meal}:${d.gruppo}`;if(!chiavi.has(k)){chiavi.add(k);usi[d.gruppo]=(usi[d.gruppo]||0)+1;}}
   return usi;
  };
  const fPrima=frequenze(prima),fDopo=frequenze(dopo);
  assert.deepEqual(dopo.uso_gruppi,fDopo,'Riepilogo dei gruppi diverso dalle portate salvate');
  for(const [gruppo,q]of Object.entries(QUOTE)){
   assert.ok((fDopo[gruppo]||0)<=Math.max(q.max,fPrima[gruppo]||0),'Frequenza massima peggiorata');
   assert.ok((fDopo[gruppo]||0)>=Math.min(q.min,fPrima[gruppo]||0),'Frequenza minima persa');
  }
  modelli+=(dopo.modelli_pasti||[]).length;
  const modello=(dopo.modelli_pasti||[])[0];
  const mealSpeciale=dopo.righe.find(r=>r.meal==='pranzo'&&r.slot==='secondo')||dopo.righe.find(r=>r.meal==='cena'&&r.slot==='primo')
    ||(modello&&{day_of_week:modello.giorno,meal:modello.meal});
  assert.ok(mealSpeciale,'Nessun nuovo modello esercitato per '+dieta);
  const bloccati=dopo.righe.filter(r=>r.day_of_week===mealSpeciale.day_of_week&&r.meal===mealSpeciale.meal).map(r=>({day_of_week:r.day_of_week,meal:r.meal,slot:r.slot,dish_id:r.dish_id,bloccato:true}));
  const rigenerato=await generaESalva(cliente(dieta,35,2400,100,bloccati),ID,2026,opts);
  await verifica(rigenerato,dieta,bloccati);
  console.log('OK modelli e rigenerazione con pasto bloccato: '+dieta);
 }
 assert.ok(modelli>0,'Nessun modello verificato');
 const extraUser={lunch_away:true,pasti_casa:Object.fromEntries([1,2,3,4,5,6,7].map(g=>[g,{pranzo:false,cena:true}]))};
 const fuori=await generaESalva(cliente('onnivoro',35,2400,100,[],extraUser),ID,2026,opts);
 await verifica(fuori,'onnivoro',[],extraUser);
 // Primo a cena, secondo a pranzo e solo pane bloccato sono tutti input
 // realmente possibili dopo aver generato uno dei nuovi modelli.
 const vincoliPin=await caricaVincoli(cliente('onnivoro',35,2400,100),ID,'onnivoro');
 const catalogoPin=catalogo.filter(p=>vincoliPin.ammesso(p)&&!sostitutoSenzaGlutineNonRichiesto(p,false));
 const principaleCena=catalogoPin.find(p=>p.meal_slot==='primo'&&p.paese==='italia'&&p.prep_min<=35&&p.ruoli_coperti.includes('proteina_principale'));
 const principalePranzo=catalogoPin.find(p=>p.meal_slot==='secondo'&&p.paese==='italia'&&p.prep_min<=35);
 const pane=catalogoPin.find(p=>p.meal_slot==='contorno'&&p.tipoAmido==='pane');
 assert.ok(principaleCena&&principalePranzo&&pane,'Catalogo senza le portate di prova');
 const pins=[{day_of_week:1,meal:'pranzo',slot:'secondo',dish_id:principalePranzo.id,bloccato:true},{day_of_week:2,meal:'cena',slot:'primo',dish_id:principaleCena.id,bloccato:true},{day_of_week:3,meal:'pranzo',slot:'contorno',dish_id:pane.id,bloccato:true}];
 const pinned=await generaESalva(cliente('onnivoro',35,2400,100,pins),ID,2026,opts);
 await verifica(pinned,'onnivoro',pins);
 const primoSemplice=catalogoPin.find(p=>p.meal_slot==='primo'&&p.paese==='italia'&&p.prep_min<=35&&Array.isArray(p.ruoli_coperti)&&p.ruoli_coperti.includes('base_amidacea')&&!p.ruoli_coperti.includes('proteina_principale'));
 assert.ok(primoSemplice,'Nessun primo semplice per la prova di cena completa');
 const pinPrimo=[{day_of_week:1,meal:'cena',slot:'primo',dish_id:primoSemplice.id,bloccato:true}];
 const cenaCompleta=await generaESalva(cliente('onnivoro',35,2400,100,pinPrimo),ID,2026,opts);
 await verifica(cenaCompleta,'onnivoro',pinPrimo);
 assert.ok(cenaCompleta.righe.some(r=>r.day_of_week===1&&r.meal==='cena'&&r.slot==='secondo'),'Primo non proteico lasciato senza secondo');
 const secondoCompleto=catalogoPin.find(p=>p.meal_slot==='secondo'&&p.paese==='italia'
   &&(p.profilo===primoSemplice.profilo||p.profilo==='neutro'||primoSemplice.profilo==='neutro')
   &&!p.amidoReale&&p.prep_min<=35&&(p.prep_min||30)+(primoSemplice.prep_min||30)<=75&&accompagnaBene(primoSemplice,p));
 assert.ok(secondoCompleto,'Nessun secondo abbinabile al primo per il pasto bloccato');
 const pinCompleto=[{day_of_week:7,meal:'pranzo',slot:'primo',dish_id:primoSemplice.id,bloccato:true},{day_of_week:7,meal:'pranzo',slot:'secondo',dish_id:secondoCompleto.id,bloccato:true}];
 const pranzoCompleto=await generaESalva(cliente('onnivoro',35,2400,100,pinCompleto),ID,2026,opts);
 await verifica(pranzoCompleto,'onnivoro',pinCompleto);
 console.log(`Modelli pasto: ${casi}/${casi} casi, ${modelli} scelte nei quattro profili. Nessuna scrittura.`);
})().catch(e=>{console.error('ERRORE:',e.stack||e.message);process.exitCode=1;});
