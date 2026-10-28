const {caricaContestoModifiche,leggiRighePiano,salvaModifiche,errorePiano}=require('./modifiche-piano');
async function cambiaBlocco(supabase,userId,body={}){
 const {plan_item_id,bloccato,day_of_week}=body;
 const giorno=day_of_week!==undefined;
 const itemId=typeof plan_item_id==='string'?plan_item_id.toLowerCase():null;
 if(typeof bloccato!=='boolean'||(giorno&&plan_item_id!==undefined)||(!giorno&&(typeof plan_item_id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(plan_item_id.toLowerCase())))||giorno&&(!Number.isInteger(day_of_week)||day_of_week<1||day_of_week>7))throw errorePiano('blocco_non_valido','Choose a dish or day and try again.',400);
 const contesto=await caricaContestoModifiche(supabase,userId);
 let pianoId;
 if(giorno){
  const {data,error}=await supabase.from('plans').select('id').eq('user_id',userId).order('generated_at',{ascending:false}).order('id',{ascending:false}).limit(1).maybeSingle();
  if(error)throw Error('lettura plans: '+error.message);
  if(!data)throw errorePiano('piano_non_trovato','Build a week before keeping a day.',404);
  pianoId=data.id;
 }else{
  const {data,error}=await supabase.from('plan_items').select('id,plan_id,plans!inner(user_id)').eq('id',itemId).maybeSingle();
  if(error)throw Error('lettura plan_items: '+error.message);
  if(!data||data.plans?.user_id!==userId)throw errorePiano('non_autorizzato','You cannot edit this plan.',403);
  pianoId=data.plan_id;
 }
 const attese=await leggiRighePiano(supabase,pianoId);
 const scelte=attese.filter(r=>giorno?r.day_of_week===day_of_week:r.id===itemId);
 if(!scelte.length)throw errorePiano('riga_non_trovata','This dish or day is no longer in the plan.',404);
 const modifiche=scelte.filter(r=>Boolean(r.bloccato)!==bloccato).map(r=>({id:r.id,patch:{bloccato}}));
 if(modifiche.length)await salvaModifiche(supabase,userId,pianoId,attese,modifiche,contesto);
 return {ok:true};
}
module.exports={cambiaBlocco};
