// misura-pasti-casa.js — PUNTO 4: quanti primi sono candidati per il pranzo,
// vecchio comportamento (lunch_away su tutta la settimana) vs nuovo
// (pasti_casa, filtro trasportabile solo sui giorni "fuori").
//
// Il filtro che cambia e' un solo predicato, lo stesso letto da
// candidatiPrimo in genera.js: (!pranzoFuori(g) || p.trasportabile).
// Vecchio: pranzoFuori(g) = true per ogni g (lunch_away=true tutta la
// settimana) -> il pool disponibile in OGNI giorno e' solo i trasportabili,
// quindi l'unione sui 7 giorni e' count(trasportabile=true).
// Nuovo: pranzoFuori(g) = true solo nei 2 giorni "fuori" -> negli altri 5
// giorni nessun filtro, quindi l'unione sui 7 giorni e' count(tutti) -
// il pool pieno del profilo, perche' 5 giorni su 7 non hanno restrizione.
// Non genera nessun piano, non scrive niente: solo lettura del catalogo con
// le stesse funzioni che il generatore usa davvero (caricaPiatti,
// FAMIGLIE_PER_CUCINA), non una loro reimplementazione approssimata.
// Uso: node misura-pasti-casa.js <USER_ID di test>

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { caricaPiatti, FAMIGLIE_PER_CUCINA } = require('./genera.js');

const USER_ID = process.argv[2];
if (!USER_ID) { console.error('Uso: node misura-pasti-casa.js <USER_ID di test>'); process.exit(1); }

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

(async () => {
  const { data: prefRaw } = await supabase
    .from('user_cuisine_preferences').select('cucina, rank').eq('user_id', USER_ID);
  const preferenze = (prefRaw && prefRaw.length) ? prefRaw : [{ cucina: 'europea', rank: 1 }];
  const famiglie = [...new Set(
    preferenze.sort((a, b) => (a.rank || 9) - (b.rank || 9)).flatMap((p) => FAMIGLIE_PER_CUCINA[p.cucina] || [])
  )];
  console.log(`Famiglie derivate dalle preferenze: ${famiglie.join(', ')}\n`);

  const catalogo = await caricaPiatti(supabase, famiglie.length ? famiglie : ['mediterranea'], 6);
  const primi = catalogo.filter((p) => p.meal_slot === 'primo');

  const trasportabili = primi.filter((p) => p.trasportabile).length;
  const totali = primi.length;

  console.log(`Primi nel pool di questo utente: ${totali}`);
  console.log(`  di cui trasportabili:          ${trasportabili}`);
  console.log(`  di cui NON trasportabili:      ${totali - trasportabili}`);

  console.log(`\nPRIMA (lunch_away=true tutta la settimana, 7/7 giorni col filtro):`);
  console.log(`  primi candidati nella settimana: ${trasportabili}`);

  console.log(`\nDOPO (pasti_casa, 2 giorni "fuori" su 7 col filtro, 5 giorni senza):`);
  console.log(`  primi candidati nella settimana: ${totali}`);

  console.log(`\nDifferenza: +${totali - trasportabili} primi disponibili nella settimana col nuovo comportamento.`);
})();
