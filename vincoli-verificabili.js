// Solo una preferenza esplicitamente facoltativa puo' essere irrisolta.
const preferenzaFacoltativa=v=>v.kind==='non_gradito'&&v.severity==='preferibile';
function erroreVincoliNonVerificabili(){return Object.assign(new Error('Non posso verificare alcune esclusioni alimentari. Controllale nel profilo prima di continuare.'),{code:'vincoli_non_verificabili',status:422});}
function riferimentoVerificabile(v,foodIds,categorie){
 if(v.food_id&&v.categoria)return false;
 if(v.food_id)return foodIds.has(v.food_id);
 if(v.categoria)return (categorie[v.categoria]?.size||0)>0;
 return false;
}
function verificaVincoli(vincoli,foodIds,categorie){
 if(vincoli.some(v=>!preferenzaFacoltativa(v)&&!riferimentoVerificabile(v,foodIds,categorie)))throw erroreVincoliNonVerificabili();
}
module.exports={preferenzaFacoltativa,erroreVincoliNonVerificabili,riferimentoVerificabile,verificaVincoli};
