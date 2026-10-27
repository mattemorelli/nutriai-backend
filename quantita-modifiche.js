const { riferimentoFruttaSecca } = require('./quantita-frutta-secca');
const { RIFERIMENTO_GRASSI } = require('./bilancia-grassi');

// Conserva il bilanciamento giornaliero usando porzioni e ingredienti
// effettivi, non il peso della ricetta non scalata. Riferimenti tecnici:
// una giornata gia' oltre puo' migliorare o restare uguale, senza peggiorare.
function preservaQuantitaGiornaliere(prima, dopo, perId, target, giorni) {
  const kcalTarget=Number(target?.kcal), EPS=1e-6;
  if (!(kcalTarget>0) || !Array.isArray(giorni) || !giorni.length) return false;
  function somma(righe,giorno) {
    const tot={kcal:0,grassi:0,fruttaSecca:0};
    for(const r of righe) {
      if(r.day_of_week!==giorno || r.stato==='saltato')continue;
      const p=perId.get(r.dish_id),grammi=Number(r.portion_g);
      if(!p || !(Number.isFinite(grammi)&&grammi>0&&Number.isFinite(p.grams)&&p.grams>0)
        || p.grassiCompleti===false || ['kcal','fat','grammiFruttaSecca'].some(k=>!Number.isFinite(p[k])||p[k]<0)) return null;
      const f=grammi/p.grams;tot.kcal+=p.kcal*f;tot.grassi+=p.fat*f;tot.fruttaSecca+=p.grammiFruttaSecca*f;
    }
    return tot.kcal>0 ? tot : null;
  }
  for(const giorno of new Set(giorni)) {
    if(!Number.isInteger(giorno)||giorno<1||giorno>7)return false;
    const a=somma(prima,giorno),b=somma(dopo,giorno);
    if(!a||!b)return false;
    if(b.fruttaSecca>Math.max(a.fruttaSecca,riferimentoFruttaSecca(kcalTarget))+EPS)return false;
    const quota=Math.max(a.grassi/a.kcal,RIFERIMENTO_GRASSI.maxPercento/100/9);
    if(b.grassi>b.kcal*quota+EPS)return false;
  }
  return true;
}
module.exports={preservaQuantitaGiornaliere};
