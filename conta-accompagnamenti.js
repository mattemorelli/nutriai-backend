// SOLA LETTURA: conta quanti piatti del mercato Italia qualificano come
// accompagnamento 'pane' o 'patate' (dopo la Correzione 1, simulata senza
// scrivere nel database), per ciascuna dieta e per chi ha allergia al
// glutine. Risponde al punto 1 della richiesta di oggi.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { caricaPiatti, foodIdVietatiPerDieta, risolviSubject, caricaCatalogoPerRisoluzione } = require('./genera.js');
const { clienteConAccompagnamenti } = require('./simula-accompagnamenti-pane-patate.js');

function ammessoBase(idVietatiDieta) {
  return (p) => {
    const ingredienti = p.ingredienti || p.dish_ingredients || [];
    for (const i of ingredienti) {
      const fid = i.food_id || (i.foods && i.foods.id);
      if (fid && idVietatiDieta.has(fid)) return false;
    }
    return true;
  };
}

(async () => {
  const finto = clienteConAccompagnamenti(supabase);
  const catalogo = await caricaCatalogoPerRisoluzione(supabase);

  const DIETE = ['onnivoro', 'pescetariano', 'vegetariano', 'vegano'];
  console.log('--- per dieta (nessuna allergia), mercato IT, famiglia mediterranea+neutro ---');
  for (const dieta of DIETE) {
    const idVietatiDieta = new Set(await foodIdVietatiPerDieta(finto, dieta));
    const ammesso = ammessoBase(idVietatiDieta);
    const piatti = (await caricaPiatti(finto, ['mediterranea'], 6)).filter(ammesso);
    const pane = piatti.filter(p => p.tipoAmido === 'pane').length;
    const patate = piatti.filter(p => p.tipoAmido === 'patate').length;
    const nessuno = piatti.length - pane - patate;
    console.log(`${dieta.padEnd(14)} piatti totali: ${piatti.length} | pane: ${pane} | patate: ${patate} | nessuno dei due: ${nessuno}`);
  }

  console.log('\n--- onnivoro + senza glutine (categoria vera) ---');
  const idVietatiOnnivoro = new Set(await foodIdVietatiPerDieta(finto, 'onnivoro'));
  const risoltoGlutine = risolviSubject('glutine', catalogo);
  const { data: catRighe } = await supabase.from('categorie_alimenti').select('food_id').eq('categoria', risoltoGlutine.codice);
  const idGlutine = new Set((catRighe || []).map(r => r.food_id));
  const idVietatiTotali = new Set([...idVietatiOnnivoro, ...idGlutine]);
  const ammessoGlutine = ammessoBase(idVietatiTotali);
  const piattiGlutine = (await caricaPiatti(finto, ['mediterranea'], 6)).filter(ammessoGlutine);
  const paneG = piattiGlutine.filter(p => p.tipoAmido === 'pane').length;
  const patateG = piattiGlutine.filter(p => p.tipoAmido === 'patate').length;
  console.log(`onnivoro+glutine piatti totali: ${piattiGlutine.length} | pane: ${paneG} | patate: ${patateG} | nessuno: ${piattiGlutine.length - paneG - patateG}`);

  console.log('\n--- quanti alimenti "pane"/"patate" distinti usano questi piatti ---');
  const tuttiPiatti = await caricaPiatti(finto, ['mediterranea'], 6);
  const paneDishes = tuttiPiatti.filter(p => p.tipoAmido === 'pane');
  const patateDishes = tuttiPiatti.filter(p => p.tipoAmido === 'patate');
  console.log('piatti "pane" (nomi):', paneDishes.map(p => p.name).join(', ') || '(nessuno)');
  console.log('piatti "patate" (nomi):', patateDishes.map(p => p.name).join(', ') || '(nessuno)');
})();
