const {caricaContestoGenerazione}=require('./salvataggio-generazione');
const {preparaTarget}=require('./fabbisogno');
async function salvaDatiOnboarding(supabase,userId,dati){
 const contesto=await caricaContestoGenerazione(supabase,userId);
 const target=await preparaTarget(supabase,userId,{profilo:dati.profilo,misura:dati.misura,sessioni:dati.sessioni});
 const {data,error}=await supabase.rpc('quadrio_salva_onboarding_v1',{
  p_user_id:userId,p_contesto:contesto,p_profilo:dati.profilo,p_misura:dati.misura,p_sport:dati.sessioni,
  p_vincoli:dati.vincoli,p_preferenze:dati.preferenze,p_target:target,
 });
 if(error){
  if(['PT409','40001','40P01'].includes(error.code))throw Object.assign(new Error('Your profile changed while saving. Review it and try again.'),{status:409,code:'contesto_onboarding_modificato'});
  if(error.code==='PT403')throw Object.assign(new Error('Health data consent is required before saving these exclusions.'),{status:403,code:'consenso_mancante'});
  if(['57014','55P03'].includes(error.code))throw Object.assign(new Error('Saving is taking too long. Try again.'),{status:503,code:'salvataggio_generazione_temporaneo'});
  throw new Error('salvataggio onboarding: '+error.message);
 }
 if(!data?.ok||typeof data.target_id!=='string')throw new Error('salvataggio onboarding non confermato');
 return target;
}
module.exports={salvaDatiOnboarding};
