// Una ricetta salvata appartiene alla portata, non al solo dish_id: due
// revisioni dello stesso piatto possono convivere nella stessa settimana.
function chiaveRicetta(riga) {
  return riga.recipe_snapshot_id ? `salvata:${riga.recipe_snapshot_id}:${riga.dish_id}` : riga.dish_id;
}
function validaRicetta(record, riga) {
  const r = record?.ricetta;
  if (!record || record.id !== riga.recipe_snapshot_id || record.dish_id !== riga.dish_id
    || !r || r.piatto?.id !== riga.dish_id || !Array.isArray(r.ingredienti) || !r.ingredienti.length
    || r.ingredienti.some(i => !i || typeof i!=='object' || Array.isArray(i) || i.dish_id !== riga.dish_id || typeof i.food_id!=='string' || !i.food_id || !i.foods || typeof i.foods!=='object' || Array.isArray(i.foods)
      || (i.foods.id && i.foods.id !== i.food_id) || !Number.isFinite(Number(i.grams)) || Number(i.grams) <= 0)
    || new Set(r.ingredienti.map(i=>i.food_id)).size!==r.ingredienti.length
    || !Array.isArray(r.categorie) || !Array.isArray(r.tag)
    || r.categorie.some(c=>!c||typeof c.categoria!=='string'||!c.categoria||!r.ingredienti.some(i=>i.food_id===c.food_id))
    || r.tag.some(t=>!t||typeof t.tag!=='string'||!t.tag||!r.ingredienti.some(i=>i.food_id===t.food_id))
    || !Array.isArray(r.passi) || (r.info !== null && (typeof r.info !== 'object' || Array.isArray(r.info)))) {
    throw new Error('Ricetta salvata non verificabile');
  }
  return r;
}
async function caricaRicetteSalvate(supabase, righe) {
  const ids = [...new Set(righe.map(r => r.recipe_snapshot_id).filter(Boolean))].sort();
  const record = new Map(), ricette = new Map();
  // Il massimo e' esplicito e inferiore al tetto di PostgREST. Nessun
  // accesso al catalogo se tutte le portate hanno gia' una copia stabile.
  for (let da = 0; da < ids.length; da += 100) {
    const {data, error} = await supabase.from('recipe_snapshots').select('id,dish_id,ricetta')
      .in('id',ids.slice(da,da+100)).order('id').range(0,99);
    if (error) throw new Error('lettura ricette salvate: ' + error.message);
    for (const r of data || []) {
      if (record.has(r.id)) throw new Error('Ricetta salvata duplicata');
      record.set(r.id,r);
    }
  }
  for (const riga of righe) if (riga.recipe_snapshot_id) {
    ricette.set(chiaveRicetta(riga),validaRicetta(record.get(riga.recipe_snapshot_id),riga));
  }
  return ricette;
}
function calcolaIngredienti(ingredienti) {
  const tot = {kcal:0,protein:0,carb:0,sugar:0,fat:0,satFat:0,fibre:0,salt:0,grams:0,ingredienti:[],grammiFruttaSecca:0};
  const campi = {kcal:'kcal_100g',protein:'protein_100g',carb:'carb_100g',sugar:'sugar_100g',fat:'fat_100g',satFat:'sat_fat_100g',fibre:'fibre_100g',salt:'salt_100g'};
  for (const riga of ingredienti) {
    const f = riga.foods || {}, grammi = Number(riga.grams), fattore = grammi/100;
    for (const [dest, fonte] of Object.entries(campi)) tot[dest] += (f[fonte] || 0)*fattore;
    tot.grams += grammi;
    if (f.categoria_impatto === 'frutta_secca') tot.grammiFruttaSecca += grammi;
    tot.ingredienti.push({food_id:riga.food_id,nome:f.name,nome_it:f.name_it,stato:f.stato,grams:grammi,kcal_100g:f.kcal_100g,fat_100g:f.fat_100g});
  }
  return tot;
}
module.exports = {chiaveRicetta,validaRicetta,caricaRicetteSalvate,calcolaIngredienti};
