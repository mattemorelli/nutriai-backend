// misura-proteine.js — misura come si comporta QUOTE sulle settimane generate.
// Non scrive niente: usa il modo prova ({ salva: false }).
// Uso: node misura-proteine.js <USER_ID> [N_SEED] [--inverso] [--pausa]

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva, QUOTE } = require('./genera.js');

const USER_ID = process.argv[2];
const N_SEED = Number(process.argv[3] || 30);
const INVERSO = process.argv.includes('--inverso');
const PAUSA = process.argv.includes('--pausa');

if (!USER_ID) {
  console.error('Uso: node misura-proteine.js <USER_ID> [N_SEED] [--inverso] [--pausa]');
  process.exit(1);
}

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

const GRUPPI = Object.keys(QUOTE);
const attesa = (ms) => new Promise((r) => setTimeout(r, ms));

function riga(etichetta, valore) {
  return `  ${etichetta.padEnd(30)} ${valore}`;
}

function istogramma(conteggi) {
  return conteggi.map((c) => `    ${String(c.valore).padStart(2)}x : ${'█'.repeat(c.n)} ${c.n}`).join('\n');
}

(async () => {
  const ordine = Array.from({ length: N_SEED }, (_, i) => (INVERSO ? N_SEED - i : i + 1));
  const settimane = [];
  const falliti = [];

  console.log(`Ordine: ${INVERSO ? 'INVERSO' : 'normale'} (primo seed: ${ordine[0]}, ultimo: ${ordine[ordine.length - 1]})`);
  console.log(`Pausa fra le generazioni: ${PAUSA ? '1000 ms' : 'nessuna'}`);
  process.stdout.write('Genero in modo prova ');

  for (let posizione = 0; posizione < ordine.length; posizione++) {
    const seed = ordine[posizione];
    try {
      const esito = await generaESalva(supabase, USER_ID, seed, { salva: false });

      if (esito.plan_id !== null && esito.plan_id !== undefined) {
        console.error(`\n\nFERMO: con { salva: false } il seed ${seed} ha scritto il piano ${esito.plan_id}.`);
        process.exit(1);
      }
      if (!esito.uso_gruppi) {
        console.error(`\n\nFERMO: il seed ${seed} non restituisce uso_gruppi.`);
        process.exit(1);
      }

      settimane.push({
        seed,
        uso: esito.uso_gruppi,
        gradino: esito.gradino,
        conformi: esito.giorni_conformi,
        concessioni: esito.concessioni || []
      });
      process.stdout.write('.');
    } catch (errore) {
      falliti.push({
        seed,
        posizione: posizione + 1,
        messaggio: errore.message,
        causa: errore.cause ? String(errore.cause) : '(nessuna causa)',
        codice: (errore.cause && errore.cause.code) || errore.code || '(nessun codice)'
      });
      process.stdout.write('x');
    }
    if (PAUSA) await attesa(1000);
  }

  console.log('\n');
  console.log(`Settimane generate: ${settimane.length} / ${N_SEED}`);

  if (falliti.length) {
    console.log(`\n=== Falliti: ${falliti.length} ===\n`);
    console.log('  seed  posizione  codice              messaggio');
    console.log('  ----  ---------  ------------------  ---------');
    for (const f of falliti) {
      console.log(
        '  ' + String(f.seed).padEnd(6) + String(f.posizione).padEnd(11) +
        String(f.codice).padEnd(20) + f.messaggio
      );
    }
    console.log('\n  cause distinte:');
    for (const c of new Set(falliti.map((f) => f.causa))) console.log(`    ${c}`);
    console.log(`\n  seed falliti:      ${falliti.map((f) => f.seed).sort((a, b) => a - b).join(', ')}`);
    console.log(`  posizioni fallite: ${falliti.map((f) => f.posizione).sort((a, b) => a - b).join(', ')}`);
  }

  if (!settimane.length) {
    console.log('\nNessuna settimana da misurare.');
    process.exit(0);
  }
  if (settimane.length < N_SEED) {
    console.log('\nATTENZIONE: campione incompleto. I numeri sotto NON sono confrontabili');
    console.log('con la fotografia di riferimento, che e\' su 30 seed.\n');
  }

  console.log('\n=== QUOTE, gruppo per gruppo ===\n');
  console.log('  gruppo        min  max | medio   osservato   sotto-min   sopra-max');

  let sottoMinTot = 0, sopraMaxTot = 0;

  for (const gruppo of GRUPPI) {
    const q = QUOTE[gruppo];
    const valori = settimane.map((s) => s.uso[gruppo] || 0);
    const medio = valori.reduce((a, b) => a + b, 0) / valori.length;
    const sottoMin = valori.filter((v) => v < q.min).length;
    const sopraMax = valori.filter((v) => v > q.max).length;
    sottoMinTot += sottoMin;
    sopraMaxTot += sopraMax;

    console.log(
      '  ' + gruppo.padEnd(13) + String(q.min).padStart(3) + String(q.max).padStart(5) + ' | ' +
      medio.toFixed(2).padStart(5) + '   ' +
      `${Math.min(...valori)}-${Math.max(...valori)}`.padEnd(11) +
      String(sottoMin).padStart(9) + String(sopraMax).padStart(12)
    );
  }

  const tutteRispettate = settimane.filter((s) =>
    GRUPPI.every((g) => {
      const v = s.uso[g] || 0;
      return v >= QUOTE[g].min && v <= QUOTE[g].max;
    })
  ).length;

  console.log('');
  console.log(riga('settimane a posto:', `${tutteRispettate} / ${settimane.length}`));
  console.log(riga('sforamenti sotto il minimo:', sottoMinTot));
  console.log(riga('sforamenti sopra il massimo:', sopraMaxTot));

  for (const gruppo of ['carne_rossa', 'pesce', 'carne_bianca', 'uova', 'legumi']) {
    if (!GRUPPI.includes(gruppo)) continue;
    const valori = settimane.map((s) => s.uso[gruppo] || 0);
    const distinti = [...new Set(valori)].sort((a, b) => a - b);
    console.log(`\n  ${gruppo} (min ${QUOTE[gruppo].min}, max ${QUOTE[gruppo].max}) per settimana:`);
    console.log(istogramma(distinti.map((v) => ({ valore: v, n: valori.filter((x) => x === v).length }))));
  }

  console.log('\n=== Gradini e concessioni ===\n');

  const perGradino = {};
  for (const s of settimane) perGradino[s.gradino] = (perGradino[s.gradino] || 0) + 1;
  for (const [gradino, n] of Object.entries(perGradino).sort()) {
    console.log(riga(`gradino ${gradino}:`, `${n} settimane`));
  }

  const perVincolo = {};
  for (const s of settimane) {
    for (const c of s.concessioni) perVincolo[c.vincolo] = (perVincolo[c.vincolo] || 0) + 1;
  }
  console.log('');
  if (!Object.keys(perVincolo).length) {
    console.log(riga('concessioni:', 'nessuna'));
  } else {
    for (const [vincolo, n] of Object.entries(perVincolo).sort((a, b) => b[1] - a[1])) {
      console.log(riga(vincolo + ':', n));
    }
  }

  console.log('\n=== Deviazioni dal piano: da quale gruppo a quale ===\n');
  const deviazioni = {};
  for (const s of settimane) {
    for (const c of s.concessioni) {
      if (c.vincolo !== 'gruppo_proteico_pianificato') continue;
      const chiave = `${c.prima || '(nessuno)'} -> ${c.dopo || '(nessuno)'}`;
      deviazioni[chiave] = (deviazioni[chiave] || 0) + 1;
    }
  }
  const ordinate = Object.entries(deviazioni).sort((a, b) => b[1] - a[1]);
  if (!ordinate.length) {
    console.log('  nessuna deviazione');
  } else {
    for (const [chiave, n] of ordinate) console.log(`  ${chiave.padEnd(34)} ${n}`);
    const perse = {}, vinte = {};
    for (const [chiave, n] of ordinate) {
      const [da, a] = chiave.split(' -> ');
      perse[da] = (perse[da] || 0) + n;
      vinte[a] = (vinte[a] || 0) + n;
    }
    console.log('\n  saldo per gruppo (vinte - perse):');
    for (const g of new Set([...Object.keys(perse), ...Object.keys(vinte)])) {
      const saldo = (vinte[g] || 0) - (perse[g] || 0);
      console.log(`  ${g.padEnd(34)} ${saldo > 0 ? '+' : ''}${saldo}`);
    }
  }

  console.log('');
})();