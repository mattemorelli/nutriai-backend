// Il tetto tecnico gia' usato per una ricetta diventa anche un obiettivo
// sulla somma giornaliera. NON e' un massimo clinico: la politica di lancio
// va revisionata per la popolazione supportata. Non equivale alla porzione
// standard CREA di 30 g, ne' ne prescrive una frequenza quotidiana.
const RIFERIMENTO_FRUTTA_SECCA_G = 40;
function fattoreTetto(kcal) {
  if (!kcal) return 1;
  return Math.max(.7, Math.min(1.8, Math.pow(kcal / 2000, .7)));
}
const riferimentoFruttaSecca = kcal => RIFERIMENTO_FRUTTA_SECCA_G * fattoreTetto(kcal);
function riepilogoFruttaSecca(grammi, kcal) {
  if (!Number.isFinite(grammi) || grammi < 0 || !Number.isFinite(kcal) || kcal <= 0) return null;
  const riferimento = riferimentoFruttaSecca(kcal);
  return { grammi:Math.round(grammi*10)/10, riferimento_g:Math.round(riferimento*10)/10,
    tipo_riferimento:'tecnico_non_clinico', copertura:'ingredienti_classificati_nel_catalogo',
    esito:grammi > riferimento + .5 ? 'sopra_riferimento' : 'nel_riferimento' };
}
// Redistribuisce calorie fra ricette intere. Conserva proteine fino al
// target, fibra fino al pavimento, sale/saturi e il bilanciamento dei grassi.
function bilanciaFruttaSecca(stato, targetProteine, limiti, kcalTarget) {
  const campi = ['kcal','protein','fat','satFat','salt','fibre','grammiFruttaSecca'];
  if (stato.length < 2 || stato.some(x => x.p.piatto.grassiCompleti === false
    || campi.some(k => !Number.isFinite(x.p.piatto[k]) || x.p.piatto[k] < 0))) return stato;
  const totale = k => stato.reduce((s,x) => s + x.p.piatto[k]*x.f, 0), EPS=1e-8;
  const energia = totale('kcal');
  if (!(energia > 0)) return stato;
  // Copre anche l'arrotondamento al grammo della porzione salvata.
  const margine = stato.reduce((s,x) => s + (x.p.piatto.grams > 0 ? .5*x.p.piatto.grammiFruttaSecca/x.p.piatto.grams : 0),0);
  const obiettivo = Math.max(0,riferimentoFruttaSecca(kcalTarget)-margine);
  const minimi = { protein:Math.min(totale('protein'),targetProteine || totale('protein')),
    fibre:Math.min(totale('fibre'),limiti.fibraMinGiorno) };
  const massimi = { salt:Math.max(totale('salt'),limiti.saleMaxGiorno),
    satFat:Math.max(totale('satFat'),limiti.satMaxGiorno), fat:Math.max(totale('fat'),energia*.35/9) };
  const righe = stato.filter(x=>x.p.piatto.kcal>0).map(x=>({x,kcal:x.p.piatto.kcal,
    densita:Object.fromEntries(campi.filter(k=>k!=='kcal').map(k=>[k,x.p.piatto[k]/x.p.piatto.kcal]))}));
  for (let iterazione=0; iterazione<2*stato.length*stato.length; iterazione++) {
    const tot=Object.fromEntries(campi.map(k=>[k,totale(k)]));
    if (tot.grammiFruttaSecca <= obiettivo + EPS) break;
    let migliore=null;
    for (const cede of righe) for (const riceve of righe) {
      const riduzione=cede.densita.grammiFruttaSecca-riceve.densita.grammiFruttaSecca;
      if (riceve===cede || riduzione<=EPS) continue;
      let kcal=Math.min((riceve.x.lim[1]-riceve.x.f)*riceve.kcal,
        (cede.x.f-cede.x.lim[0])*cede.kcal,(tot.grammiFruttaSecca-obiettivo)/riduzione);
      for (const [campo,pavimento] of Object.entries(minimi)) {
        const delta=riceve.densita[campo]-cede.densita[campo];
        if (delta<0) kcal=Math.min(kcal,Math.max(0,tot[campo]-pavimento-EPS)/-delta);
      }
      for (const [campo,tetto] of Object.entries(massimi)) {
        const delta=riceve.densita[campo]-cede.densita[campo];
        if (delta>0) kcal=Math.min(kcal,Math.max(0,tetto-tot[campo]-EPS)/delta);
      }
      const miglioramento=kcal*riduzione;
      if (kcal>EPS && miglioramento>EPS && (!migliore || miglioramento>migliore.miglioramento+EPS)) migliore={riceve,cede,kcal,miglioramento};
    }
    if (!migliore) break;
    const {riceve,cede,kcal}=migliore;
    riceve.x.f=Math.min(riceve.x.lim[1],riceve.x.f+kcal/riceve.kcal);
    cede.x.f=Math.max(cede.x.lim[0],cede.x.f-kcal/cede.kcal);
  }
  return stato;
}
module.exports={fattoreTetto,RIFERIMENTO_FRUTTA_SECCA_G,riferimentoFruttaSecca,riepilogoFruttaSecca,bilanciaFruttaSecca};
