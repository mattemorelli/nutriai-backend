// prova-spesa.js — lista della spesa vera per un utente: reparti, marche,
// impatto CO2, totale. Se l'utente non ha un piano ne genera uno di prova e
// lo cancella sempre alla fine (0 residui) - non tocca piani gia' esistenti.
// Uso: node prova-spesa.js <USER_ID> [--utente-reale]

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { listaSpesa } = require('./spesa');
const { generaESalva } = require('./genera.js');

const USER_ID = process.argv[2];
if (!USER_ID) { console.error('Uso: node prova-spesa.js <USER_ID> [--utente-reale]'); process.exit(1); }

// Guardrail: gli utenti veri si misurano solo dicendolo a voce alta.
const UTENTE_DI_TEST = 'c29890d4-a37f-4995-a00d-543d07263c32';

if (USER_ID !== UTENTE_DI_TEST && !process.argv.includes('--utente-reale')) {
  console.error(
    `FERMO: ${USER_ID} non e' l'utente di test.\n` +
    `Se e' voluto, rilancia aggiungendo --utente-reale.`
  );
  process.exit(1);
}
if (USER_ID !== UTENTE_DI_TEST) {
  console.warn(`ATTENZIONE: sto misurando su un utente reale (${USER_ID}).\n`);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

let planIdDiProva = null;

async function pulisci() {
  if (!planIdDiProva) return;
  await supabase.from('plan_items').delete().eq('plan_id', planIdDiProva);
  await supabase.from('plans').delete().eq('id', planIdDiProva);
  const { count } = await supabase
    .from('plans').select('id', { count: 'exact', head: true }).eq('id', planIdDiProva);
  console.log(`\nPulizia: piano di prova ${planIdDiProva} rimosso (residui: ${count}).`);
}

(async () => {
  try {
    const { count: nPiani } = await supabase
      .from('plans').select('id', { count: 'exact', head: true }).eq('user_id', USER_ID);

    if (!nPiani) {
      console.log(`Nessun piano per ${USER_ID}: ne genero uno di prova (verra' cancellato alla fine).`);
      const piano = await generaESalva(supabase, USER_ID, 1, { salva: true });
      planIdDiProva = piano.plan_id;
    }

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
  } finally {
    await pulisci();
  }
})();
