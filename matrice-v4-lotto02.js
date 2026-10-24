// SOLA LETTURA, nessuna scrittura. Come matrice-v4.js, ma con gli
// accompagnamenti pane/patate sempre disponibili (simula-accompagnamenti-
// pane-patate.js) oltre alla Correzione 1. Risponde al punto 3 della
// richiesta di oggi.
require('dotenv').config({ quiet: true });
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const supabaseReale = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { generaESalva, risolviSubject, caricaCatalogoPerRisoluzione } = require('./genera.js');
const { clienteConLotto02 } = require('./simula-lotto-02.js');

function clienteFinto(reale, profiloSintetico, vincoliSintetici) {
  const base = clienteConLotto02(reale);
  return {
    from(tabella) {
      if (tabella === 'users') return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: profiloSintetico, error: null }) };
      if (tabella === 'user_constraints') return { select() { return this; }, eq: async () => ({ data: vincoliSintetici, error: null }) };
      return base.from(tabella);
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

const DIETE = ['onnivoro', 'pescetariano', 'vegetariano', 'vegano'];
const SINGOLE = ['nessuna', 'glutine', 'lattosio', 'frutta_guscio', 'crostacei', 'uova', 'soia'];
const COPPIE = [['glutine', 'lattosio'], ['glutine', 'frutta_guscio'], ['lattosio', 'uova']];
function eRidondante(dieta, codici) {
  const esclusiDaDieta = { vegano: ['crostacei', 'uova'], vegetariano: ['crostacei'] }[dieta] || [];
  return codici.some((c) => esclusiDaDieta.includes(c));
}

const SEED = Number(process.argv[2] || 42);
const FILE_OUT = process.argv[3];
const ETICHETTA = process.argv[4] || 'v4-accompagnamenti';

(async () => {
  const catalogo = await caricaCatalogoPerRisoluzione(supabaseReale);
  const combos = [];
  for (const dieta of DIETE) {
    for (const s of SINGOLE) {
      const codici = s === 'nessuna' ? [] : [s];
      if (eRidondante(dieta, codici)) continue;
      combos.push({ dieta, codici, etichetta: s });
    }
    for (const coppia of COPPIE) {
      if (eRidondante(dieta, coppia)) continue;
      combos.push({ dieta, codici: coppia, etichetta: coppia.join('+') });
    }
  }
  console.log(`[${ETICHETTA} seed${SEED}] ${combos.length} combinazioni`);

  const risultati = [];
  for (const combo of combos) {
    const inizio = Date.now();
    const vincoli = await costruisciVincoli(catalogo, combo.codici);
    const profiloSintetico = { ...PROFILO_SCHEDULE, diet: combo.dieta };
    const finto = clienteFinto(supabaseReale, profiloSintetico, vincoli);
    let esito;
    try {
      const r = await generaESalva(finto, crypto.randomUUID(), SEED, { salva: false });
      esito = { ok: true, gradino: r.gradino, concessioni: r.concessioni.length };
    } catch (e) {
      esito = { ok: false, errore: e.message };
    }
    const secondi = (Date.now() - inizio) / 1000;
    const etichettaCombo = combo.dieta + (combo.codici.length ? '+' + combo.codici.join('+') : '');
    risultati.push({ versione: ETICHETTA, seed: SEED, combo: etichettaCombo, ...esito, secondi });
    console.log(`[${ETICHETTA} seed${SEED}] ${etichettaCombo}: ${esito.ok ? 'OK g' + esito.gradino : 'FALLITO'} (${secondi.toFixed(1)}s)`);
    if (FILE_OUT) fs.writeFileSync(FILE_OUT, JSON.stringify(risultati, null, 2));
  }
  console.log(`=== FATTO (${ETICHETTA} seed${SEED}) ===`);
})();
