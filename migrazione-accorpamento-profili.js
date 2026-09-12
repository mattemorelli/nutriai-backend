// Applica l'accorpamento dei profili di sapore misurato e approvato
// (misura-accorpamento-profili.js, 2026-09-12): 16 profili non-neutri -> 8.
// Aggiorna SOLO dishes.profilo. Non tocca famiglia, cucina, paese, ingredienti.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const MAPPA = {
  'mediterraneo-olio': 'mediterraneo',
  'mediterraneo-erbe': 'mediterraneo',
  'europeo-aceto': 'europeo-leggero',
  'europeo-erbe': 'europeo-leggero',
  'europeo-burro': 'europeo-ricco',
  'europeo-panna': 'europeo-ricco',
  'europeo-brasato': 'europeo-ricco',
  'asiatico-soia': 'asiatico-orientale',
  'asiatico-gochujang': 'asiatico-orientale',
  'asiatico-lime': 'asiatico-sudest',
  'asiatico-cocco': 'asiatico-sudest',
  'latino-lime': 'latino-messicano-ampio',
  'latino-messicano': 'latino-messicano-ampio',
  'americano-comfort': 'americano',
  'americano-bbq': 'americano',
  // latino-chimichurri resta invariato: nessuna riga.
};

// PostgREST impone un tetto di righe per risposta (di default 1000)
// indipendente da .limit(): dishes ha oltre 2000 righe, quindi va paginato
// con .range() - qui serve soprattutto per il controllo prima/dopo, non farlo
// darebbe un conteggio troncato che sembra tornare per puro caso.
async function contaProfili() {
  const conta = {};
  const PAGINA = 1000;
  for (let offset = 0; ; offset += PAGINA) {
    const { data: blocco, error } = await supabase
      .from('dishes').select('profilo').range(offset, offset + PAGINA - 1);
    if (error) throw new Error(error.message);
    for (const r of blocco) conta[r.profilo] = (conta[r.profilo] || 0) + 1;
    if (blocco.length < PAGINA) break;
  }
  return conta;
}

(async () => {
  const contaPrima = await contaProfili();
  const totalePrima = Object.values(contaPrima).reduce((a, b) => a + b, 0);

  console.log('=== Migrazione accorpamento profili ===\n');
  for (const [vecchio, nuovo] of Object.entries(MAPPA)) {
    const { data, error } = await supabase
      .from('dishes')
      .update({ profilo: nuovo })
      .eq('profilo', vecchio)
      .select('id');
    if (error) throw new Error(`${vecchio} -> ${nuovo}: ${error.message}`);
    console.log(`${vecchio} -> ${nuovo}: ${data.length} righe aggiornate`);
  }

  const contaDopo = await contaProfili();
  const totaleDopo = Object.values(contaDopo).reduce((a, b) => a + b, 0);

  console.log('\n--- Distribuzione dopo ---');
  for (const [p, n] of Object.entries(contaDopo).sort()) console.log(`  ${p}: ${n}`);

  console.log(`\nTotale righe con profilo, prima: ${totalePrima}, dopo: ${totaleDopo}`);
  if (totalePrima !== totaleDopo) {
    console.error('ERRORE: il totale delle righe e\' cambiato - qualcosa non va, nessuna riga doveva sparire o comparire.');
    process.exit(1);
  }
  console.log(totalePrima === totaleDopo ? 'OK: nessuna riga persa.' : 'ATTENZIONE: controllare.');
})();
