// Piani sintetici con recupero difficile, cene rapide e piatti bloccati.
// Sola lettura del catalogo reale; nessun piano o utente scritto.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const { generaESalva, caricaPiatti, caricaVincoli, limitiDi, QUOTE, accompagnaBene, sostitutoSenzaGlutineNonRichiesto } = require(path.join(__dirname, '../genera.js'));
const reale = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const ID = '00000000-0000-4000-8000-000000000001';
const DIETE = ['onnivoro', 'pescetariano', 'vegetariano', 'vegano'];

function query(data) {
  const risultato = { data, error: null };
  const q = { select: () => q, eq: () => q, order: () => q, limit: () => q, range: () => q,
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
  return { rpc:(...args)=>reale.rpc(...args), from(tabella) {
    if (Object.hasOwn(dati, tabella)) return query(dati[tabella]);
    assert.ok(CATALOGO.has(tabella), 'Accesso inatteso: ' + tabella);
    return reale.from(tabella);
  } };
}

(async()=>{
 let casi=0; const opts={salva:false,dettagli:true,tempoMassimoMs:-1};
 const catalogo=await caricaPiatti(reale,['mediterranea'],6);const perId=new Map(catalogo.map(p=>[p.id,p]));
 for(const dieta of DIETE)for(const n of [0,1,2,3]){
  const p=await generaESalva(cliente(dieta,35,2000,80),ID,2026,{...opts,numeroSpuntini:n});
  if(p.errore){assert.equal(p.errore,'piano_impossibile');assert.ok(!p.plan_id&&!p.righe);console.log(`Limite dichiarato: ${dieta}, ${n} spuntini`);}
  else{
   for(let g=1;g<=7;g++){
    const rs=p.righe.filter(r=>r.day_of_week===g);assert.equal(rs.filter(r=>r.meal==='spuntino').length,n,'Numero di spuntini modificato dal recupero');
    assert.ok(Math.abs(rs.reduce((s,r)=>s+r.kcal,0)-2000)<=200+rs.length*.5,'Calorie fuori intervallo');
    const snacks=rs.filter(r=>r.meal==='spuntino');assert.equal(new Set(snacks.map(r=>r.dish_id)).size,n,'Spuntino duplicato nello stesso giorno');
    assert.ok(snacks.filter(r=>(perId.get(r.dish_id).ruoli_coperti||[]).includes('base_amidacea')).length<=1,'Doppio spuntino amidaceo');
   }
   console.log(`OK ${dieta}, esattamente ${n} spuntini al giorno`);
  }
  casi++;
 }
 const snack=catalogo.find(p=>p.meal_slot==='spuntino');assert.ok(snack);
 const pins=[{day_of_week:1,meal:'spuntino',slot:'spuntino',dish_id:snack.id,bloccato:true}];
 const conflitto=await generaESalva(cliente('onnivoro',35,2000,80,pins),ID,2026,{...opts,numeroSpuntini:0});
 assert.equal(conflitto.vincolo_bloccante,'spuntini_bloccati');casi++;
 for(const n of [-1,4,1.5,'2',false]){await assert.rejects(generaESalva(cliente('onnivoro',35,2000,80),ID,2026,{...opts,numeroSpuntini:n}),/numero_spuntini/);casi++;}
 console.log(`${casi} casi scelta spuntini verificati, nessuna scrittura.`);
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
