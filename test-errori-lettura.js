// test-errori-lettura.js — Punto 9, PASSO 3. Verifica che un errore di
// lettura su user_constraints, categorie_alimenti, meal_outcomes, plans o
// energy_targets faccia LANCIARE un errore (non passi piu' in silenzio), e
// che invece "nessuna riga" (energy_targets/plans vuoti, caso legittimo)
// NON lanci. Non tocca il database reale per scrivere niente: solo letture
// vere sulle tabelle non simulate, piu' due tabelle con una riga finta
// costruita in memoria per forzare il percorso di categorie_alimenti.
// Sempre salva:false.
// Uso: node test-errori-lettura.js <USER_ID di test>

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva, caricaVincoli } = require('./genera.js');

const USER_ID = process.argv[2];
if (!USER_ID) { console.error('Uso: node test-errori-lettura.js <USER_ID di test>'); process.exit(1); }

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

const supabaseReale = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

// Query fasulla, chainable su qualunque metodo, che risolve sempre allo
// stesso risultato qualunque sia la catena di chiamate usata dal chiamante.
function query(risultato) {
  const q = {
    select: () => q, eq: () => q, order: () => q, limit: () => q, in: () => q,
    gte: () => q, not: () => q, or: () => q, range: () => q,
    maybeSingle: () => Promise.resolve(risultato),
    single: () => Promise.resolve(risultato),
    then: (res, rej) => Promise.resolve(risultato).then(res, rej),
  };
  return q;
}

// Client che si comporta normalmente su ogni tabella TRANNE quelle elencate
// in `sostituzioni` (nome tabella -> risultato fisso da restituire).
function clientCon(sostituzioni) {
  const finto = Object.create(supabaseReale);
  finto.from = (tabella) =>
    Object.prototype.hasOwnProperty.call(sostituzioni, tabella)
      ? query(sostituzioni[tabella])
      : supabaseReale.from(tabella);
  return finto;
}

const ERRORE = { data: null, error: { message: 'simulato' } };
const VUOTO_LISTA = { data: [], error: null };
const VUOTO_SINGOLO = { data: null, error: null };

// Una riga finta di vincolo a categoria, per forzare espandi() a interrogare
// davvero categorie_alimenti (l'utente di test non ha vincoli reali).
const UN_VINCOLO_A_CATEGORIA = {
  data: [{ kind: 'allergia', subject: 'test', severity: 'grave', food_id: null, categoria: 'glutine' }],
  error: null,
};

async function siAspettaLancio(etichetta, promessa) {
  try {
    await promessa;
    return { etichetta, atteso: 'LANCIA', ottenuto: 'non ha lanciato' };
  } catch (e) {
    return { etichetta, atteso: 'LANCIA', ottenuto: `lanciato: "${e.message}"` };
  }
}

async function siAspettaNoLancio(etichetta, promessa) {
  try {
    await promessa;
    return { etichetta, atteso: 'NON lancia', ottenuto: 'non ha lanciato' };
  } catch (e) {
    return { etichetta, atteso: 'NON lancia', ottenuto: `lanciato: "${e.message}"` };
  }
}

(async () => {
  const risultati = [];

  risultati.push(await siAspettaLancio(
    'user_constraints',
    caricaVincoli(clientCon({ user_constraints: ERRORE }), USER_ID, 'onnivoro')
  ));

  risultati.push(await siAspettaLancio(
    'categorie_alimenti',
    caricaVincoli(
      clientCon({ user_constraints: UN_VINCOLO_A_CATEGORIA, categorie_alimenti: ERRORE }),
      USER_ID, 'onnivoro'
    )
  ));

  risultati.push(await siAspettaLancio(
    'meal_outcomes',
    generaESalva(clientCon({ meal_outcomes: ERRORE }), USER_ID, 1, { salva: false })
  ));

  risultati.push(await siAspettaLancio(
    'plans (errore vero)',
    generaESalva(clientCon({ plans: ERRORE }), USER_ID, 2, { salva: false })
  ));

  risultati.push(await siAspettaLancio(
    'energy_targets (errore vero)',
    generaESalva(clientCon({ energy_targets: ERRORE }), USER_ID, 3, { salva: false })
  ));

  risultati.push(await siAspettaNoLancio(
    'energy_targets (nessuna riga)',
    generaESalva(clientCon({ energy_targets: VUOTO_SINGOLO }), USER_ID, 4, { salva: false })
  ));

  risultati.push(await siAspettaNoLancio(
    'plans (nessuna riga)',
    generaESalva(clientCon({ plans: VUOTO_SINGOLO }), USER_ID, 5, { salva: false })
  ));

  console.log('tabella / caso              | atteso     | ottenuto');
  console.log('-----------------------------|------------|---------');
  let falliti = 0;
  for (const r of risultati) {
    const ok = (r.atteso === 'LANCIA' && r.ottenuto.startsWith('lanciato')) ||
               (r.atteso === 'NON lancia' && r.ottenuto === 'non ha lanciato');
    if (!ok) falliti++;
    console.log(r.etichetta.padEnd(29) + ' | ' + r.atteso.padEnd(10) + ' | ' + r.ottenuto + (ok ? '' : '  <-- FALLITO'));
  }
  console.log(`\n${falliti === 0 ? 'PROVA SUPERATA' : `PROVA FALLITA (${falliti} righe non combaciano)`}`);
})();
