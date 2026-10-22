require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { caricaPiatti } = require('./genera.js');
const { clienteConAccompagnamenti } = require('./simula-accompagnamenti-pane-patate.js');

(async () => {
  const finto = clienteConAccompagnamenti(supabase);
  const piatti = await caricaPiatti(finto, ['mediterranea'], 6);
  const virtuali = piatti.filter((p) => p.id.startsWith('v4-'));
  console.log('piatti virtuali trovati:', virtuali.length, '(attesi 9)');
  for (const v of virtuali) {
    console.log(`${v.name.padEnd(22)} tipoAmido=${v.tipoAmido} kcal=${v.kcal?.toFixed(0)} protein=${v.protein?.toFixed(1)} grams=${v.grams} glutine=${v.contiene_glutine} health=${v.health_score}`);
  }
})();
