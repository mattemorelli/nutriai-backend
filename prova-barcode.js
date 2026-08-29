require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { votoBarcode } = require('./voto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const BARCODE = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['3046920022651', '7622300336738', '4000417025005'];

(async () => {
  for (const b of BARCODE) {
    const t0 = Date.now();
    let r;
    try {
      r = await votoBarcode(supabase, b, 'it');
    } catch (e) {
      console.log(`\n${b}: ${e.message}`);
      await new Promise(s => setTimeout(s, 800));
      continue;
    }
    const ms = Date.now() - t0;

    if (!r.trovato) { console.log(`\n${b}: non trovato`); continue; }
    if (!r.voto) { console.log(`\n${r.nome}: ${r.motivo}`); continue; }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`${r.voto}  ${r.punteggio}/100   ${r.marca} — ${r.nome}`);
    console.log(`categoria: ${r.categoria} | confidenza: ${r.confidenza} | ${ms} ms`);
    for (const d of r.dettaglio) {
      for (const m of d.modificatori) {
        console.log(`  ${m.punti > 0 ? '+' : ''}${m.punti}  ${m.descrizione}  [${m.fonte}]`);
      }
    }
    await new Promise(s => setTimeout(s, 400));
  }
})();