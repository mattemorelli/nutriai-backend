const DIETE=['onnivoro','vegetariano','vegano','pescetariano'];
const numero=v=>(typeof v==='number'||typeof v==='string'&&v.trim()!=='')&&Number.isFinite(Number(v));
const errore=message=>Object.assign(new Error(message),{status:400,code:'scelte_non_valide'});
// I valori omessi restano omessi. Un valore dichiarato ma invalido non
// viene trasformato in una dieta o un tempo di cucina diverso.
function validaScelte(b){
 if(!b||typeof b!=='object'||Array.isArray(b))throw errore('Check your profile choices.');
 const out={};
 if('diet'in b){if(!DIETE.includes(b.diet))throw errore('Choose a supported diet.');out.diet=b.diet;}
 if('evening_minutes'in b){if(!numero(b.evening_minutes)||!Number.isInteger(Number(b.evening_minutes))||Number(b.evening_minutes)<10||Number(b.evening_minutes)>180)throw errore('Choose a cooking time between 10 and 180 whole minutes.');out.evening_minutes=Number(b.evening_minutes);}
 if('household_size'in b){if(!numero(b.household_size)||!Number.isInteger(Number(b.household_size))||Number(b.household_size)<1||Number(b.household_size)>12)throw errore('Choose a household size between 1 and 12.');out.household_size=Number(b.household_size);}
 if('lunch_away'in b){if(typeof b.lunch_away!=='boolean')throw errore('Choose whether lunch needs to travel.');out.lunch_away=b.lunch_away;}
 if('paesi'in b){if(!Array.isArray(b.paesi)||b.paesi.some(p=>typeof p!=='string'||!p.trim()))throw errore('Check your country preferences.');out.paesi=b.paesi;}
 return out;
}
module.exports={validaScelte};
