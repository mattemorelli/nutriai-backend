// Preferenza di distribuzione, non limite clinico o condizione di successo.
// EFSA: RI adulti 20-35% energia; anche valori maggiori possono essere
// compatibili con salute e peso normale. Fonte e limiti in docs di rilascio:
// https://www.efsa.europa.eu/sites/default/files/2022-04/7259.pdf, sezione 3.1.1.2.
const RIFERIMENTO_GRASSI = Object.freeze({ minPercento:20, maxPercento:35 });
function bilanciaGrassi(stato,targetProteine,limiti){
  const campi=['kcal','protein','fat','salt','satFat','fibre'];
  if(stato.length<2||stato.some(x=>x.p.piatto.grassiCompleti === false || campi.some(k=>!Number.isFinite(x.p.piatto[k])||x.p.piatto[k]<0)))return stato;
  const EPS=1e-8,totale=k=>stato.reduce((s,x)=>s+x.p.piatto[k]*x.f,0);
  const energia=totale('kcal'),riferimento=energia*RIFERIMENTO_GRASSI.maxPercento/100/9;
  if(!(energia>0)||totale('fat')<=riferimento+EPS)return stato;
  const proteineMin=Math.min(totale('protein'),targetProteine||totale('protein'));
  const fibraMin=Math.min(totale('fibre'),limiti.fibraMinGiorno);
  const saleMax=Math.max(totale('salt'),limiti.saleMaxGiorno),saturiMax=Math.max(totale('satFat'),limiti.satMaxGiorno);
  const righe=stato.filter(x=>x.p.piatto.kcal>0).map(x=>({x,kcal:x.p.piatto.kcal,
    densita:Object.fromEntries(campi.filter(k=>k!=='kcal').map(k=>[k,x.p.piatto[k]/x.p.piatto.kcal]))}));
  for(let i=0;i<2*stato.length*stato.length;i++){
    const tot=Object.fromEntries(campi.map(k=>[k,totale(k)]));
    if(tot.fat<=riferimento+EPS)break;
    let migliore=null;
    for(const riceve of righe)for(const cede of righe){
      const riduzione=cede.densita.fat-riceve.densita.fat;
      if(riceve===cede||riduzione<=EPS)continue;
      let kcal=Math.min((riceve.x.lim[1]-riceve.x.f)*riceve.kcal,(cede.x.f-cede.x.lim[0])*cede.kcal,(tot.fat-riferimento)/riduzione);
      const delta=k=>riceve.densita[k]-cede.densita[k];
      if(delta('protein')<0)kcal=Math.min(kcal,Math.max(0,tot.protein-proteineMin-EPS)/-delta('protein'));
      if(delta('fibre')<0)kcal=Math.min(kcal,Math.max(0,tot.fibre-fibraMin-EPS)/-delta('fibre'));
      if(delta('salt')>0)kcal=Math.min(kcal,Math.max(0,saleMax-tot.salt-EPS)/delta('salt'));
      if(delta('satFat')>0)kcal=Math.min(kcal,Math.max(0,saturiMax-tot.satFat-EPS)/delta('satFat'));
      const miglioramento=kcal*riduzione;
      if(kcal>EPS&&miglioramento>EPS&&(!migliore||miglioramento>migliore.miglioramento+EPS))migliore={riceve,cede,kcal,miglioramento};
    }
    if(!migliore)break;
    const{riceve,cede,kcal}=migliore;
    riceve.x.f=Math.min(riceve.x.lim[1],riceve.x.f+kcal/riceve.kcal);
    cede.x.f=Math.max(cede.x.lim[0],cede.x.f-kcal/cede.kcal);
  }
  return stato;
}
function riepilogoGrassi(kcal,grammi){
  if(!Number.isFinite(kcal)||!Number.isFinite(grammi)||kcal<=0||grammi<0)return null;
  const percento=grammi*9/kcal*100;
  return {grammi:Math.round(grammi*10)/10,percento_energia:Math.round(percento*10)/10,
    riferimento_percento:[RIFERIMENTO_GRASSI.minPercento,RIFERIMENTO_GRASSI.maxPercento],tipo_riferimento:'generale_non_clinico',
    posizione:percento>35.05?'sopra_riferimento':percento<19.95?'sotto_riferimento':'nel_riferimento'};
}
module.exports={bilanciaGrassi,riepilogoGrassi,RIFERIMENTO_GRASSI};
