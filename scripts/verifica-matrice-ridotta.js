// Controllo permanente, SOLA LETTURA: una versione ridotta ma
// rappresentativa della matrice 36 combinazioni x 3 semi (vedi
// matrice-v4-lotto02.js per quella completa) - gira in pochi secondi,
// pensata per il controllo prima del push (scripts/verifica.js), non per
// misurare la qualita' fine come la matrice completa.
//
// 12 combinazioni, un seme fisso: le 4 diete senza allergie, le 4 diete
// con glutine (il vincolo storicamente piu' fragile), due triple
// combinazioni gia' state un problema (vegetariano/vegano + glutine +
// frutta a guscio) e due combinazioni miste a caso per coprire
// lattosio/uova/crostacei.
//
// AGGIORNATO 2026-10-23 (sera): le migrazioni pane/patate e il lotto 02
// sono stati applicati davvero al database (vedi i commit di oggi) - non
// serve piu' simulare nulla, il catalogo reale li contiene gia'. Prima
// usava simula-lotto-02.js per testare prima della scrittura; ora legge
// 'reale' direttamente. Se in futuro un lotto 03 viene preparato ma non
// ancora scritto, va di nuovo avvolto in un wrapper di simulazione simile,
// qui o in un file a parte - senza, questo controllo valida solo cio' che
// e' gia' nel database, non cio' che sta per entrarci.
//
// Uso: node scripts/verifica-matrice-ridotta.js
// Fallisce (exit code 1) se una sola delle 12 combinazioni non riesce.
require('dotenv').config({ quiet: true });
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const supabaseReale = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { generaESalva, risolviSubject, caricaCatalogoPerRisoluzione } = require('../genera.js');

const SEED = 2026;

function clienteFinto(reale, profiloSintetico, vincoliSintetici) {
  return {
    from(tabella) {
      if (tabella === 'users') return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: profiloSintetico, error: null }) };
      if (tabella === 'user_constraints') { const q={select:()=>q,eq:()=>q,order:()=>q,range:()=>q,then:(a,b)=>Promise.resolve({data:vincoliSintetici,error:null}).then(a,b)};return q;}
      return reale.from(tabella);
    },
  };
}

const ESPANSIONE_SPECIALE = { crostacei: ['crostacei', 'molluschi'] };
async function costruisciVincoli(catalogo, codici) {
  const righe = [];
  for (const c of codici) {
    for (const subject of (ESPANSIONE_SPECIALE[c] || [c])) {
      let risolto;
      try { risolto = risolviSubject(subject, catalogo); } catch (e) { risolto = { tipo: 'irrisolto' }; }
      if (risolto.tipo === 'categoria') righe.push({ kind: 'allergia', subject, severity: 'assoluto', food_id: null, categoria: risolto.codice });
      else if (risolto.tipo === 'alimenti') for (const fid of risolto.foodIds) righe.push({ kind: 'allergia', subject, severity: 'assoluto', food_id: fid, categoria: null });
      else righe.push({ kind: 'allergia', subject, severity: 'assoluto', food_id: null, categoria: null });
    }
  }
  return righe;
}

const PROFILO_SCHEDULE = {
  cook_days: [1, 2, 3, 4, 5, 6, 7], lunch_away: true,
  pasti_casa: { 1: { pranzo: true, cena: true }, 2: { pranzo: true, cena: true }, 3: { pranzo: true, cena: true }, 4: { pranzo: true, cena: true }, 5: { pranzo: true, cena: true }, 6: { pranzo: false, cena: true }, 7: { pranzo: false, cena: true } },
  evening_minutes: 35, household_size: 1, paesi: ['italia'],
};

const COMBO = [
  ['onnivoro', []], ['pescetariano', []], ['vegetariano', []], ['vegano', []],
  ['onnivoro', ['glutine']], ['pescetariano', ['glutine']], ['vegetariano', ['glutine']], ['vegano', ['glutine']],
  ['vegetariano', ['glutine', 'frutta_guscio']], ['vegano', ['glutine', 'frutta_guscio']],
  ['onnivoro', ['lattosio', 'uova']], ['pescetariano', ['crostacei']],
];

(async () => {
  const catalogo = await caricaCatalogoPerRisoluzione(supabaseReale);
  const risultati = [];
  for (const [dieta, codici] of COMBO) {
    const vincoli = await costruisciVincoli(catalogo, codici);
    const profiloSintetico = { ...PROFILO_SCHEDULE, diet: dieta };
    const finto = clienteFinto(supabaseReale, profiloSintetico, vincoli);
    const etichetta = dieta + (codici.length ? '+' + codici.join('+') : '');
    const inizio = Date.now();
    try {
      const r = await generaESalva(finto, crypto.randomUUID(), SEED, { salva: false });
      // piano_impossibile (25 ottobre 2026): generaESalva ora RITORNA questo
      // esito invece di lanciare un errore - va trattato come un fallimento
      // qui, altrimenti risulterebbe "OK" con un gradino inesistente.
      if (r.errore === 'piano_impossibile') {
        risultati.push({ etichetta, ok: false, errore: `piano_impossibile (${r.vincolo_bloccante}): ${r.dettaglio}`, secondi: (Date.now() - inizio) / 1000 });
      } else {
        risultati.push({ etichetta, ok: true, gradino: r.gradino, secondi: (Date.now() - inizio) / 1000 });
      }
    } catch (e) {
      risultati.push({ etichetta, ok: false, errore: e.message, secondi: (Date.now() - inizio) / 1000 });
    }
  }

  const ok = risultati.filter((r) => r.ok);
  console.log(`\n[matrice ridotta] ${ok.length}/${risultati.length} riuscite (seme ${SEED})`);
  for (const r of risultati) {
    console.log(`  ${r.ok ? 'OK ' : 'XX '} ${r.etichetta.padEnd(32)} ${r.ok ? 'gradino ' + r.gradino : 'FALLITO: ' + r.errore} (${r.secondi.toFixed(1)}s)`);
  }

  const ATTESO = COMBO.length; // oggi: 12/12. Se scende, la matrice ridotta deve fermare il push.
  if (ok.length < ATTESO) {
    console.error(`\nFALLITO: ${ok.length}/${ATTESO} attese - il push non puo' continuare.`);
    process.exitCode = 1;
  } else {
    console.log('\nOK: tutte le combinazioni attese riescono.');
  }
})().catch((e) => { console.error('ERRORE nello script:', e.message); process.exitCode = 1; });
