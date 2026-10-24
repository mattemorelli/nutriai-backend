// SOLA LETTURA: scompone il pool mercato IT per vegetariano/vegano, per
// meal_slot e gruppo proteico, con la Correzione 1 + accompagnamenti
// simulati attivi - per capire esattamente dove manca varietà (punto 4).
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { caricaPiatti, foodIdVietatiPerDieta } = require('./genera.js');
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
  for (const dieta of ['vegetariano', 'vegano']) {
    console.log(`\n=== ${dieta.toUpperCase()} (sogliaSalute 6, famiglia mediterranea+neutro, mercato IT) ===`);
    const idVietati = new Set(await foodIdVietatiPerDieta(finto, dieta));
    const ammesso = ammessoBase(idVietati);
    const piatti = (await caricaPiatti(finto, ['mediterranea'], 6)).filter(ammesso);

    const perSlot = {};
    for (const p of piatti) (perSlot[p.meal_slot] ||= []).push(p);
    for (const slot of ['colazione', 'primo', 'secondo', 'contorno', 'spuntino']) {
      console.log(`  ${slot.padEnd(10)}: ${(perSlot[slot] || []).length} piatti`);
    }

    const secondi = perSlot['secondo'] || [];
    const perGruppo = {};
    for (const p of secondi) perGruppo[p.gruppo || '(nessun gruppo)'] = (perGruppo[p.gruppo || '(nessun gruppo)'] || 0) + 1;
    console.log('  secondi per gruppo proteico:', JSON.stringify(perGruppo));

    // soglie usate da analizzaCapienza/QUOTE, per confronto diretto
    console.log('  --- soglie minime richieste dal generatore ---');
    console.log('  primi: servono >=7, ne ha', (perSlot['primo'] || []).length);
    console.log('  contorni: servono >=14 (cena+pranzo), ne ha', (perSlot['contorno'] || []).length);
    console.log('  colazioni: servono >=7, ne ha', (perSlot['colazione'] || []).length);
    console.log('  spuntini: servono >=14, ne ha', (perSlot['spuntino'] || []).length);
    console.log('  secondi distinti: servono >=7 (o 6 con una ripetizione), ne ha', secondi.length);
  }
})();
