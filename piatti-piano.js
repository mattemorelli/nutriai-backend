const {caricaRicetteSalvate,chiaveRicetta}=require('./ricette-salvate');
const piattoDellaRiga=(perId,riga)=>perId.get(chiaveRicetta(riga));
// Una sostituzione esplicita sceglie la ricetta attuale, anche quando il
// nome del piatto e' rimasto uguale. Giorni, salti e Keep mantengono la copia.
const conPiatto=(riga,dishId,patch={})=>({...riga,...patch,dish_id:dishId,recipe_snapshot_id:null});
function creaCaricatorePiattiPiano({caricaPiattiPerId,arricchisciPiattiDaCache}) {
return async function caricaPiattiPiano(supabase,righe,extraIds=[]) {
  const salvate=await caricaRicetteSalvate(supabase,righe);
  const ids=[...new Set([...righe.filter(r=>!r.recipe_snapshot_id).map(r=>r.dish_id),...extraIds])];
  const perId=new Map((ids.length?await caricaPiattiPerId(supabase,ids):[]).map(p=>[p.id,p]));
  for(const [key,r]of salvate){
    const categorieDi={},tagDi={};
    for(const c of r.categorie||[])(categorieDi[c.food_id]||=new Set()).add(c.categoria);
    for(const t of r.tag||[])(tagDi[t.food_id]||=new Set()).add(t.tag);
    const ingredienti=r.ingredienti.map(i=>({...i,grams:Number(i.grams)}));
    const p=arricchisciPiattiDaCache([r.piatto],{ingredientiPerDish:{[r.piatto.id]:ingredienti},categorieDi,tagDi})[0];
    if(!p)throw new Error('Ricetta salvata non verificabile');
    perId.set(key,{...p,categorieSalvate: Object.values(categorieDi).reduce((s,c)=>new Set([...s,...c]),new Set())});
  }
  return perId;
}
}
module.exports={creaCaricatorePiattiPiano,piattoDellaRiga,conPiatto};
