const {chiaveRicetta}=require('./ricette-salvate');
const { riepilogoFruttaSecca } = require('./quantita-frutta-secca');
const { riepilogoGrassi } = require('./bilancia-grassi');

// Quantita' previste per una persona nei pasti inclusi. Avanzi contati nel
// giorno in cui si mangiano; saltati esclusi. Nessuna conversione secco/cotto:
// food_id e stato restano distinti. Arrotondamento soltanto dopo la somma.
function riepilogoIngredienti(righe, piattiPerId, kcalTarget) {
  const giorni = new Map();
  for (const r of righe) {
    const giorno = Number(r.day_of_week);
    if (!giorni.has(giorno)) giorni.set(giorno, { ingredienti:new Map(), mancanti:0, nutrientiCompleti:true, kcal:0, grassi:0, fruttaSecca:0, quantitaCompleta:true });
    const g = giorni.get(giorno);
    if (r.stato === 'saltato') continue;
    const p = piattiPerId.get(chiaveRicetta(r)), porzione = Number(r.portion_g);
    if (!p || !Number.isFinite(p.grams) || p.grams <= 0 || !Number.isFinite(porzione) || porzione <= 0
      || !p.ingredienti?.length || p.ingredienti.some(i=>!i.food_id || !Number.isFinite(i.grams) || i.grams < 0)
      || Math.abs(p.ingredienti.reduce((s,i)=>s+i.grams,0)-p.grams)>1e-6) {
      g.mancanti++; g.nutrientiCompleti=false; g.quantitaCompleta=false; continue;
    }
    const fattore = porzione / p.grams;
    if (!Number.isFinite(p.grammiFruttaSecca) || p.grammiFruttaSecca < 0) g.quantitaCompleta=false;
    else g.fruttaSecca += p.grammiFruttaSecca * fattore;
    for (const i of p.ingredienti) {
      const key = JSON.stringify([i.food_id,i.stato || null]);
      if (!g.ingredienti.has(key)) g.ingredienti.set(key, { food_id:i.food_id, nome:i.nome_it || i.nome || i.food_id, stato:i.stato || null, grammi:0 });
      const grammi = i.grams * fattore;
      g.ingredienti.get(key).grammi += grammi;
      if (!Number.isFinite(i.kcal_100g) || i.kcal_100g < 0 || !Number.isFinite(i.fat_100g) || i.fat_100g < 0) g.nutrientiCompleti=false;
      else { g.kcal += i.kcal_100g*grammi/100; g.grassi += i.fat_100g*grammi/100; }
    }
  }
  return [...giorni].sort((a,b)=>a[0]-b[0]).map(([giorno,g])=>({
    giorno, completo:g.mancanti===0, righe_non_calcolabili:g.mancanti,
    ingredienti:[...g.ingredienti.values()].sort((a,b)=>b.grammi-a.grammi || a.food_id.localeCompare(b.food_id))
      .map(i=>({...i,grammi:Math.round(i.grammi*10)/10})),
    frutta_secca:g.quantitaCompleta ? riepilogoFruttaSecca(g.fruttaSecca,kcalTarget) : null,
    nutrienti_completi:g.nutrientiCompleti,
    grassi:g.nutrientiCompleti ? riepilogoGrassi(g.kcal,g.grassi) : null,
  }));
}
module.exports={riepilogoIngredienti};
