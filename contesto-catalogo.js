// La versione e' monotona anche se due risposte arrivano in ordine inverso.
// Il marcatore distingue cataloghi di progetti diversi nello stesso processo.
const perClient=new WeakMap(),perCatalogo=new Map(),inCorso=new WeakMap();
const versioneValida=v=>typeof v==='string'&&/^\d+$/.test(v);
function valido(c){return !!c&&typeof c.catalogo_id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.catalogo_id)&&versioneValida(c.catalogo_versione);}
function registraCatalogo(client,c){
 if(!valido(c))throw new Error('contesto catalogo non disponibile');
 const vecchio=perCatalogo.get(c.catalogo_id);
 const attuale=vecchio&&BigInt(vecchio.catalogo_versione)>BigInt(c.catalogo_versione)?vecchio:{catalogo_id:c.catalogo_id,catalogo_versione:c.catalogo_versione};
 perCatalogo.set(c.catalogo_id,attuale);perClient.set(client,{...attuale,scadenza:Date.now()+1000});return attuale;
}
async function caricaContestoCatalogo(client){
 const noto=perClient.get(client);
 if(noto&&Date.now()<noto.scadenza)return perCatalogo.get(noto.catalogo_id);
 if(inCorso.has(client))return inCorso.get(client);
 const promessa=(async()=>{const {data,error}=await client.rpc('quadrio_contesto_catalogo_v1');if(error)throw new Error('lettura contesto catalogo: '+error.message);return registraCatalogo(client,data);})();
 inCorso.set(client,promessa);try{return await promessa;}finally{if(inCorso.get(client)===promessa)inCorso.delete(client);}
}
function ultimoCatalogo(id){return perCatalogo.get(id);}
function erroreCatalogoModificato(){return Object.assign(new Error('Recipes changed while this was being prepared. Try again.'),{status:409,code:'catalogo_modificato'});}
module.exports={registraCatalogo,caricaContestoCatalogo,ultimoCatalogo,valido,erroreCatalogoModificato};
