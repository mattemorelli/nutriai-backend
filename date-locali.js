// Stesso giorno civile usato dal server per salvare una pesata.
function dataLocale(d=new Date()) {
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function finestraCalibrazione(adesso=new Date()) {
 const inizio=new Date(adesso);
 inizio.setDate(inizio.getDate()-28);
 return {oggi:dataLocale(adesso),da:dataLocale(inizio)};
}
module.exports={dataLocale,finestraCalibrazione};
