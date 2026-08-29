require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { listaSpesa } = require('./spesa');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';

(async () => {
  try {
    const r = await listaSpesa(supabase, USER_ID);
    for (const rep of r.reparti) {
      console.log('\n' + rep.reparto.toUpperCase());
      for (const v of rep.voci) {
        const imp = v.impatto
          ? `  ${v.impatto.voto}  ${String(v.impatto.co2_kg).padStart(5)} kg CO2e`
          : '';
        console.log('  ' + v.nome.padEnd(30), String(v.quantita).padStart(9), imp);
        if (v.per.length) {
          const coda = v.altri ? ` +${v.altri} more` : '';
          console.log('      for ' + v.per.join(', ') + coda);
        }
      }
    }

    const t = r.totale;
    console.log('\n' + '─'.repeat(52));
    console.log(`${t.voci} things · ~ € ${t.costo_min}–${t.costo_max} · € ${t.costo_giorno} a day`);
    console.log(`${t.co2_kg} kg CO2e this week`);
    console.log('\nWhat weighs most:');
    for (const p of t.peggiori) {
      console.log(`  ${p.nome.padEnd(24)} ${p.co2_kg} kg   ${p.quota}%`);
    }
  } catch (e) {
    console.error('ERRORE:', e.message);
  }
})();