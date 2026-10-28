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
// La stessa lettura completa serve al filtro e alla schermata in cui
// l'utente puo' correggere un vincolo, anche oltre la prima pagina.
async function leggiVincoliDichiarati(supabase,userId){
 const righe=[];
 for(let da=0;;da+=1000){
  const {data,error}=await supabase.from('user_constraints').select('id,kind,subject,severity,food_id,categoria,declared_at').eq('user_id',userId).order('declared_at',{ascending:true}).order('id').range(da,da+999);
  if(error)throw new Error('lettura user_constraints: '+error.message);
  righe.push(...data);
  if(data.length<1000)return righe;
 }
}
module.exports={leggiVincoliDichiarati,preferenzaFacoltativa,erroreVincoliNonVerificabili,riferimentoVerificabile,verificaVincoli};
