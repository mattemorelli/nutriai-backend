require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { marchePer } = require('./spesa');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const FOOD_IDS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['171955', 'mandorle_it', 'uovo_grande_it', '170457'];

(async () => {
  for (const id of FOOD_IDS) {
    const r = await marchePer(supabase, id, 'italy', 5);
    console.log(`\n${'='.repeat(64)}`);
    console.log(`${r.ingrediente || id}  —  ${r.prodotti.length} marche`);
    for (const p of r.prodotti) {
      console.log(
        `\n  ${p.impatto || '–'} impatto   ${p.nutrizione || '–'} nutrizione   ` +
        `${(p.marca || 'senza marca')} — ${p.nome.slice(0, 40)}`
      );
      for (const w of p.perche.slice(0, 3)) {
        console.log(`      ${w.testo}  [${w.fonte}]`);
      }
    }
  }
})();