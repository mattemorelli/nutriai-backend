const {registraCatalogo,valido:catalogoValido,erroreCatalogoModificato}=require('./contesto-catalogo');
function erroreContestoModificato(){
 return Object.assign(new Error('Your profile or choices changed while the week was being built. Try again.'),{code:'contesto_generazione_modificato',status:409});
}
async function caricaContestoGenerazione(supabase,userId){
 const {data,error}=await supabase.rpc('quadrio_contesto_generazione_v2',{p_user_id:userId});
 if(error)throw new Error('lettura contesto generazione: '+error.message);
 if(!data||typeof data.versione!=='string'||!/^\d+$/.test(data.versione)||!catalogoValido(data))throw new Error('contesto generazione non disponibile');
 const registrato=registraCatalogo(supabase,data);
 if(registrato.catalogo_versione!==data.catalogo_versione)throw erroreCatalogoModificato();
 return data;
}
async function salvaGenerazione(supabase,userId,contesto,piano,righe){
 const {data,error}=await supabase.rpc('quadrio_salva_generazione_v2',{
  p_user_id:userId,p_contesto:contesto,p_piano:piano,p_righe:righe,
 });
 if(error){
  if(error.code==='PT410')throw erroreCatalogoModificato();
  if(['PT409','40001','40P01'].includes(error.code))throw erroreContestoModificato();
  if(['57014','55P03'].includes(error.code))throw Object.assign(new Error('Saving is taking too long. Try again.'),{code:'salvataggio_generazione_temporaneo',status:503});
  throw new Error('salvataggio generazione: '+error.message);
 }
 if(!data||typeof data.id!=='string'||data.righe!==righe.length)throw new Error('salvataggio generazione non confermato');
 return data;
}
module.exports={caricaContestoGenerazione,salvaGenerazione,erroreContestoModificato};
