const {erroreCatalogoModificato}=require('./contesto-catalogo');
async function salvaVincoli(supabase,userId,contesto,righe){
 const {data,error}=await supabase.rpc('quadrio_aggiungi_vincoli_v1',{p_user_id:userId,p_contesto:contesto,p_righe:righe});
 if(error){
  if(error.code==='PT410')throw erroreCatalogoModificato();
  if(['PT409','40001','40P01'].includes(error.code))throw Object.assign(new Error('Your profile or exclusions changed while saving. Review them and try again.'),{status:409,code:'contesto_vincoli_modificato'});
  if(error.code==='PT403')throw Object.assign(new Error('Health data consent is required before saving these exclusions.'),{status:403,code:'consenso_mancante'});
  if(error.code==='22023')throw Object.assign(new Error('Check your food exclusions and try again.'),{status:400,code:'vincoli_non_validi'});
  if(['57014','55P03'].includes(error.code))throw Object.assign(new Error('Saving is taking too long. Try again.'),{status:503,code:'salvataggio_generazione_temporaneo'});
  throw new Error('salvataggio vincoli: '+error.message);
 }
 if(!data?.ok||!Array.isArray(data.righe)||data.righe.length!==righe.length||data.righe.some(r=>typeof r.id!=='string'))throw new Error('salvataggio vincoli non confermato');
 return data.righe;
}
module.exports={salvaVincoli};
