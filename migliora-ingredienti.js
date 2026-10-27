// Ricerca finale limitata a colazione e spuntini: conserva numero e slot,
// piatti bloccati, avanzi, filtri del chiamante e nutrienti della giornata.
// Prova singole sostituzioni e coppie: una coppia puo' mantenere proteine/
// fibra quando nessuna modifica singola le mantiene. Nessuna ricetta mutata.
function miglioraIngredienti({settimana,contesto,valuta,targetProteine,riferimento,kcalTarget}) {
  const nuova=settimana.map(g=>({...g,pasti:g.pasti.slice()})), EPS=1e-7;
  const conta=(week,fn)=>week.flatMap(g=>g.pasti).filter(fn).reduce((m,r)=>m.set(r.piatto.id,(m.get(r.piatto.id)||0)+1),new Map());
  const valoreCompleto=v=>v&&['kcal','proteine','grassi','sale','saleMax','saturi','satMax','fibra','fibraMin','fruttaSecca'].every(k=>Number.isFinite(v[k])&&v[k]>=0)&&v.kcal>0&&v.satMax>0;
  const snackPrima=conta(settimana,r=>r.meal==='spuntino');
  const salsePrima=new Set(settimana.flatMap(g=>g.pasti.filter(r=>r.piatto.salsa_industriale).map(r=>r.piatto.id))).size;
  const principaliColazioni=week=>new Set(week.flatMap(g=>g.pasti.filter(r=>r.meal==='colazione').map(r=>r.piatto.principale||r.piatto.id))).size;
  const rotazioneMax=Math.max(3,principaliColazioni(settimana));
  const avanzi=new Set(settimana.flatMap(g=>g.pasti.filter(r=>r.avanzi).map(r=>r.piatto.id)));
  let valutazioni=0,sostituzioni=0;
  if (!(targetProteine>0) || !Number.isFinite(riferimento)) return {settimana:nuova,valutazioni,sostituzioni};
  for (const g of nuova) {
    const iniziale=valuta(g.pasti);
    if (!valoreCompleto(iniziale)) continue;
    const floorP=Math.min(iniziale.proteine,targetProteine), floorFibra=Math.min(iniziale.fibra,iniziale.fibraMin);
    const maxSale=Math.max(iniziale.sale,iniziale.saleMax),maxSaturi=Math.max(1,iniziale.saturi/iniziale.satMax);
    const maxGrassi=Math.max(iniziale.grassi/iniziale.kcal,.35/9);
    const valide=ps=>{
      const week=nuova.map(d=>d===g?{...g,pasti:ps}:d);
      if (principaliColazioni(week)>rotazioneMax) return false;
      const snack=ps.filter(r=>r.meal==='spuntino');
      if (new Set(snack.map(r=>r.piatto.id)).size<snack.length) return false;
      if (snack.filter(r=>(r.piatto.ruoli_coperti||[]).includes('base_amidacea')).length>Math.max(1,g.pasti.filter(r=>r.meal==='spuntino'&&(r.piatto.ruoli_coperti||[]).includes('base_amidacea')).length)) return false;
      const usi=conta(week,r=>r.meal==='spuntino');
      if ([...usi].some(([id,n])=>n>Math.max(3,snackPrima.get(id)||0))) return false;
      if (new Set(week.flatMap(d=>d.pasti.filter(r=>r.piatto.salsa_industriale).map(r=>r.piatto.id))).size>Math.max(1,salsePrima)) return false;
      const contaPrincipali=righe=>righe.map(r=>r.piatto.principale).filter(Boolean)
        .reduce((m,p)=>m.set(p,(m.get(p)||0)+1),new Map());
      const prima=contaPrincipali(g.pasti),dopo=contaPrincipali(ps);
      if ([...dopo].some(([p,n])=>n>Math.max(1,prima.get(p)||0))) return false;
      const ruoli=righe=>new Set(righe.flatMap(r=>r.piatto.ruoli_coperti||[]));
      const primaRuoli=ruoli(g.pasti),dopoRuoli=ruoli(ps);
      return ['proteina_principale','base_amidacea','verdura'].every(r=>!primaRuoli.has(r)||dopoRuoli.has(r));
    };
    for(let giro=0;giro<3;giro++) {
      const base=valuta(g.pasti);
      if (base.fruttaSecca<=riferimento+.5) break;
      const slots=g.pasti.map((r,i)=>({r,i})).filter(({r})=>['colazione','spuntino'].includes(r.meal)
        && !r.bloccato && !r.avanzi && !avanzi.has(r.piatto.id));
      const liste=slots.map(({r,i})=>({i,candidati:contesto(g,r).filter(p=>p.id!==r.piatto.id&&Number.isFinite(p.grammiFruttaSecca))
        .sort((a,b)=>a.grammiFruttaSecca/(a.kcal||1)-b.grammiFruttaSecca/(b.kcal||1)
          || (b.protein||0)/(b.kcal||1)-(a.protein||0)/(a.kcal||1) || String(a.id).localeCompare(String(b.id))).slice(0,24)}));
      let migliore=null;
      function prova(cambi) {
        const ps=g.pasti.map((r,i)=>cambi.has(i)?{...r,piatto:cambi.get(i)}:r);
        if (!valide(ps)) return;
        valutazioni++;
        const v=valuta(ps);
        // Le sole porzioni conservano l'energia esatta; cambiando ricetta
        // ammette uno scarto massimo del 5% dal target, o quello precedente
        // se gia' maggiore. Rimane obbligatoria la tolleranza generale kcalOk.
        if (!valoreCompleto(v) || !v.kcalOk
          || Math.abs(v.kcal-kcalTarget)>Math.max(40,kcalTarget*.05,Math.abs(iniziale.kcal-kcalTarget))+EPS
          || v.proteine+EPS<floorP || v.fibra+EPS<floorFibra || v.sale>maxSale+EPS
          || v.saturi/v.satMax>maxSaturi+EPS || v.grassi/v.kcal>maxGrassi+EPS
          || v.fruttaSecca>=base.fruttaSecca-.1) return;
        const scarto=Math.max(0,v.fruttaSecca-riferimento);
        // Smette di preferire meno noci una volta raggiunto il riferimento.
        const punteggio=[-scarto,-Math.abs(v.kcal-kcalTarget),Math.min(targetProteine,v.proteine),-cambi.size];
        const meglio=!migliore||punteggio.some((n,i)=>punteggio.slice(0,i).every((x,j)=>Math.abs(x-migliore.punteggio[j])<EPS)&&n>migliore.punteggio[i]+EPS);
        if(meglio)migliore={ps,punteggio,n:cambi.size};
      }
      for(const l of liste)for(const p of l.candidati)prova(new Map([[l.i,p]]));
      if (!migliore || migliore.punteggio[0]<-.5) for(let i=0;i<liste.length;i++)for(let j=i+1;j<liste.length;j++)
        for(const a of liste[i].candidati.slice(0,16))for(const b of liste[j].candidati.slice(0,16))prova(new Map([[liste[i].i,a],[liste[j].i,b]]));
      if (!migliore) break;
      g.pasti=migliore.ps;sostituzioni+=migliore.n;
    }
  }
  return {settimana:nuova,valutazioni,sostituzioni};
}
module.exports={miglioraIngredienti};
