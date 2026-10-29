const {erroreCatalogoModificato}=require('./contesto-catalogo');
const {caricaContestoGenerazione:caricaContestoModifiche}=require('./salvataggio-generazione');
const { preservaQuantitaGiornaliere } = require('./quantita-modifiche');
const { contaGruppi, preservaRuoliDelPasto } = require('./modelli-pasto');
const { ammessoNelContesto, giornataPreservata, tempoPastoPreservato } = require('./vincoli-swap');
const CAMPI_NUTRIZIONALI = ['kcal', 'protein_g', 'fibre_g', 'sat_fat_g', 'salt_g'];
const attiva = r => r.stato !== 'saltato';
function errorePiano(code, message, status = 422) {
  return Object.assign(new Error(message), { code, status });
}
async function leggiRighePiano(supabase, planId) {
  const tutte = [];
  for (let da = 0; ; da += 500) {
    const { data, error } = await supabase.from('plan_items').select('*').eq('plan_id', planId)
      .order('id').range(da, da + 499);
    if (error) throw new Error('lettura plan_items: ' + error.message);
    tutte.push(...(data || []));
    if (!data || data.length < 500) return tutte;
  }
}
function origineAvanzo(righe,riga) {
  return righe.filter(r=>!r.avanzi&&r.dish_id===riga.dish_id&&r.day_of_week<riga.day_of_week)
    .sort((a,b)=>b.day_of_week-a.day_of_week)[0]||null;
}
function usaAvanzi(righe,riga) {
  return righe.some(r=>attiva(r)&&r.avanzi&&origineAvanzo(righe,r)?.id===riga.id);
}
function verificaModificabile(item, righe, { salto = false } = {}) {
  if (item.bloccato) throw errorePiano('piatto_bloccato', 'Unlock this dish before changing it.');
  if (!salto && item.stato === 'saltato') throw errorePiano('piatto_saltato', 'Put this dish back in the plan before changing it.');
  if ((!salto && item.avanzi) || usaAvanzi(righe, item)) {
    throw errorePiano('avanzi_collegati', 'This dish is linked to leftovers. Change those meals first.');
  }
}
async function salvaModifiche(supabase, userId, planId, attese, modifiche, contesto) {
  if(!contesto||typeof contesto.versione!=='string'||!/^\d+$/.test(contesto.versione))throw errorePiano('contesto_modifica_mancante','Your choices could not be checked. Refresh the week and try again.',409);
  const { data,error } = await supabase.rpc('quadrio_modifica_piano_v3', {
    p_user_id: userId, p_plan_id: planId, p_attese: attese, p_modifiche: modifiche, p_contesto:contesto,
  });
  if (error) {
    if(error.code==='PT410')throw erroreCatalogoModificato();
    if(error.code==='PT412')throw errorePiano('scelte_modificate','Your profile or choices changed. Refresh the week and try again.',409);
    if(['57014','55P03'].includes(error.code))throw errorePiano('salvataggio_generazione_temporaneo','Saving is taking too long. Try again.',503);
    if (error.code === '40001' || error.code === '40P01' || error.code === 'PT409') throw errorePiano('piano_modificato', 'The plan changed while you were editing. Refresh it and try again.', 409);
    if (error.code === '42501') throw errorePiano('non_autorizzato', 'You cannot edit this plan.', 403);
    throw new Error('salvataggio piano: ' + error.message);
  }
  if(!data?.ok||data.righe_modificate!==modifiche.length)throw new Error('salvataggio piano non confermato');
}
function gruppiDi(righe, perId) {
  return contaGruppi(Array.from({ length: 7 }, (_, i) => ({
    pasti: righe.filter(r=>attiva(r)&&r.day_of_week===i+1).map(r=>({meal:r.meal,piatto:perId.get(r.dish_id)})),
  })));
}
function settimanaPreservata(prima, dopo, perId, quote) {
  if ([...prima, ...dopo].some(r=>!perId.has(r.dish_id))) return false;
  const a = gruppiDi(prima, perId), b = gruppiDi(dopo, perId);
  for (const [g, q] of Object.entries(quote)) {
    if ((b[g]||0)>Math.max(q.max,a[g]||0) || (b[g]||0)<Math.min(q.min,a[g]||0)) return false;
  }
  const salse = rs=>new Set(rs.filter(attiva).filter(r=>perId.get(r.dish_id).salsa_industriale).map(r=>r.dish_id)).size;
  return salse(dopo)<=Math.max(1,salse(prima));
}
function puoScambiare(item, gemella, righe, perId, profilo, esiti, target, quote, accompagnaBene) {
  const a = perId.get(item.dish_id), b = perId.get(gemella.dish_id);
  if (!a || !b || item.meal!==gemella.meal || item.slot!==gemella.slot || a.meal_slot!==item.slot || b.meal_slot!==gemella.slot) return false;
  const dopo = righe.map(r=>r.id===item.id?{...r,day_of_week:gemella.day_of_week}:r.id===gemella.id?{...r,day_of_week:item.day_of_week}:r);
  for (const [vecchia, nuova] of [[item,gemella],[gemella,item]]) {
    const giornoPrima = righe.filter(attiva);
    if (!giornataPreservata(vecchia,giornoPrima,target,nuova)) return false;
    const ricevente = {...nuova,day_of_week:vecchia.day_of_week};
    const piatto = perId.get(nuova.dish_id);
    if (!ammessoNelContesto(piatto,ricevente,profilo,esiti)) return false;
    const altri = righe.filter(r=>attiva(r)&&r.day_of_week===vecchia.day_of_week&&r.meal===vecchia.meal&&r.id!==vecchia.id).map(r=>perId.get(r.dish_id));
    if (altri.some(p=>!p)||!preservaRuoliDelPasto(perId.get(vecchia.dish_id),piatto,altri)||altri.some(p=>!accompagnaBene(piatto,p))) return false;
    if (!tempoPastoPreservato(perId.get(vecchia.dish_id),piatto,altri,ricevente,profilo,esiti)) return false;
    const duplicati = rs=>rs.filter(r=>attiva(r)&&r.day_of_week===vecchia.day_of_week&&perId.get(r.dish_id)?.principale===piatto.principale).length;
    if (piatto.principale && duplicati(dopo)>Math.max(1,duplicati(righe))) return false;
  }
  return settimanaPreservata(righe,dopo,perId,quote)
    && preservaQuantitaGiornaliere(righe,dopo,perId,target,[item.day_of_week,gemella.day_of_week]);
}
function riepilogoNutrizionale(righe, target) {
  const somma=rs=>Object.fromEntries(CAMPI_NUTRIZIONALI.map(k=>[k,Math.round(rs.reduce((s,r)=>s+Number(r[k]||0),0)*10)/10]));
  return Array.from({length:7},(_,i)=>{
    const giorno=righe.filter(r=>r.day_of_week===i+1),incluse=giorno.filter(attiva),tot=somma(incluse),avvisi=[];
    if (target) {
      if (Math.abs(tot.kcal-Number(target.kcal))>Number(target.kcal)*.1) avvisi.push('energia_fuori_target');
      if (tot.protein_g<Number(target.protein_g_min)*.9) avvisi.push('proteine_sotto_minimo');
      if (tot.fibre_g<Number(target.fibre_g_min??25)) avvisi.push('fibra_sotto_minimo');
      if (tot.salt_g>Number(target.salt_g_max??5)) avvisi.push('sale_sopra_limite');
      if (tot.sat_fat_g>Number(target.sat_fat_g_max??Number(target.kcal)*.1/9)) avvisi.push('saturi_sopra_limite');
    }
    return {giorno:i+1,previsto:somma(giorno),incluso:tot,piatti_saltati:giorno.length-incluse.length,avvisi};
  });
}
module.exports={caricaContestoModifiche,preservaQuantitaGiornaliere,origineAvanzo,leggiRighePiano,salvaModifiche,errorePiano,verificaModificabile,puoScambiare,settimanaPreservata,riepilogoNutrizionale};
