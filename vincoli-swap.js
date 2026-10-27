// Stesse assunzioni di tempo del generatore. Le proposte possono rilassare
// paese o varieta', mai il tempo dichiarato o la porzione massima.
function limiteTempo(item, profilo, esiti = {}) {
  const sera = Number(profilo.evening_minutes) || 45;
  const corretti = esiti.skipTotali >= 4 && esiti.skipPerTempo / esiti.skipTotali > 0.5 ? Math.max(15, sera - 10) : sera;
  if (item.meal === 'colazione') return 15;
  if (item.meal === 'spuntino') return 10;
  if (item.day_of_week > 5) return Math.max(corretti, 75);
  return item.meal === 'pranzo' ? Math.max(corretti, 25) : corretti;
}
function tempoDi(p) {
  return Number(p.prep_min) || (p.meal_slot === 'spuntino' ? 5 : p.meal_slot === 'colazione' ? 10 : p.meal_slot === 'contorno' ? 20 : 30);
}
function ammessoNelContesto(p, item, profilo, esiti = {}) {
  if (tempoDi(p) > limiteTempo(item, profilo, esiti)) return false;
  if (item.day_of_week <= 5 && (p.tecnica || 'semplice') !== 'semplice') return false;
  const fuori = profilo.pasti_casa ? profilo.pasti_casa[String(item.day_of_week)]?.pranzo === false : profilo.lunch_away;
  return item.meal !== 'pranzo' || !fuori || p.trasportabile === true;
}
function porzioneProposta(p, item, kcalTarget, limitiDi) {
  if (!(p.grams > 0 && p.kcal > 0 && item.kcal > 0)) return null;
  const [min, max] = limitiDi({ piatto: p, slot: item.slot }, kcalTarget);
  const voluta = Math.round(item.kcal / p.kcal * p.grams);
  // Tolleranza esclusivamente per l'arrotondamento al grammo.
  if (voluta < Math.round(min * p.grams) || voluta > Math.round(max * p.grams)) return null;
  return voluta;
}
function validaPorzione(p, item, portionG, kcalTarget, limitiDi) {
  if (typeof portionG !== 'number' || !Number.isFinite(portionG) || portionG <= 0) throw new Error('Porzione non valida');
  const [min, max] = limitiDi({ piatto: p, slot: item.slot }, kcalTarget);
  if (!(p.grams > 0) || portionG < Math.round(min * p.grams) || portionG > Math.round(max * p.grams)) {
    throw new Error('Porzione fuori dai limiti del generatore');
  }
}
function giornataPreservata(item, righe, target, nutrienti) {
  const campi = ['kcal', 'protein_g', 'fibre_g', 'sat_fat_g', 'salt_g'];
  const giorno = righe.filter(r => r.day_of_week === item.day_of_week);
  if (!giorno.length || !giorno.some(r=>r.id===item.id)) return false;
  if ([...giorno, nutrienti].some(r=>campi.some(k=>r[k] == null || !Number.isFinite(Number(r[k])) || Number(r[k])<0))) return false;
  const prima = Object.fromEntries(campi.map(k=>[k,giorno.reduce((s,r)=>s+Number(r[k]),0)]));
  const dopo = Object.fromEntries(campi.map(k=>[k,prima[k]-Number(item[k])+Number(nutrienti[k])]));
  // Tolleranze di salvataggio: kcal intere e nutrienti al decimo.
  if (Math.abs(dopo.kcal-target.kcal)>Math.max(40,Math.abs(prima.kcal-target.kcal))+1) return false;
  if (dopo.protein_g+0.1<Math.min(prima.protein_g,target.protein_g_min)) return false;
  if (dopo.fibre_g+0.1<Math.min(prima.fibre_g,25)) return false;
  if (dopo.salt_g>Math.max(prima.salt_g,5)+0.1) return false;
  if (dopo.sat_fat_g>Math.max(prima.sat_fat_g,target.kcal*0.10/9)+0.1) return false;
  return true;
}
function nutrientiPorzione(p, grammi) {
  const f=grammi/p.grams, arr=n=>Math.round(n*10)/10;
  return { kcal:Math.round(p.kcal*f), protein_g:arr(p.protein*f), fibre_g:arr(p.fibre*f), sat_fat_g:arr(p.satFat*f), salt_g:arr(p.salt*f) };
}
module.exports = { limiteTempo, tempoDi, ammessoNelContesto, porzioneProposta, validaPorzione, giornataPreservata, nutrientiPorzione };
