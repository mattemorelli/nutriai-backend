// Generatore versione 4 - Parte 1 punto 11 (ricerca piu' efficiente),
// notte 2026-10-22. Vive ACCANTO a genera.js, non lo sostituisce: nessun
// chiamante esistente deve rompersi. Attivabile passando v4:true a
// generaESalvaV4 invece di chiamare generaESalva direttamente, o tramite
// l'interruttore in server.js (da collegare domani).
//
// Punto 11c (tanti tentativi brevi con seed diversi, invece di uno lungo):
// genera.js oggi fa UN tentativo con un budget di 5000 "passi" per profilo
// per gradino - se quel seed e' sfortunato, il tentativo intero (fino al
// gradino 5) puo' costare 10-15s e comunque fallire (misurato stanotte
// sulla matrice, vedi RAPPORTO-NOTTE.md). Qui si fanno invece piu' tentativi
// INDIPENDENTI, ciascuno con un budget piu' basso (quindi piu' veloce da
// esaurire se quel seed non funziona), fermandosi al primo che riesce.
// Nessuna regola allentata, nessun gradino nuovo: stesso generaESalva,
// stessa scala, solo chiamato piu' volte con meno pazienza ciascuna.
const { generaESalva } = require('./genera.js');

const TENTATIVI_DEFAULT = 8;
const PASSI_DEFAULT = 900;
// Numero primo per disperdere bene i seed derivati dal seed base - evita che
// due tentativi vicini condividano un tratto di sequenza pseudo-casuale.
const PASSO_SEED = 104729;

async function generaESalvaV4(supabase, userId, seedIniziale, opzioni = {}) {
  const tentativi = opzioni.tentativiV4 || TENTATIVI_DEFAULT;
  const passiPerTentativo = opzioni.maxPassiPerProfilo || PASSI_DEFAULT;
  const baseSeed = (seedIniziale != null ? Number(seedIniziale) : Math.floor(Math.random() * 4294967296)) >>> 0;

  let ultimoErrore = null;
  const tentativiEffettuati = [];
  for (let i = 0; i < tentativi; i++) {
    const seedTentativo = (baseSeed + i * PASSO_SEED) >>> 0;
    const inizio = Date.now();
    try {
      const risultato = await generaESalva(supabase, userId, seedTentativo, { ...opzioni, maxPassiPerProfilo: passiPerTentativo });
      tentativiEffettuati.push({ seed: seedTentativo, ms: Date.now() - inizio, ok: true });
      return { ...risultato, v4: { tentativi: tentativiEffettuati.length, dettaglio: tentativiEffettuati } };
    } catch (e) {
      tentativiEffettuati.push({ seed: seedTentativo, ms: Date.now() - inizio, ok: false });
      ultimoErrore = e;
    }
  }
  throw new Error(
    `Versione 4: nessuno dei ${tentativi} tentativi brevi (${passiPerTentativo} passi ciascuno) ha completato una settimana. ` +
    `Ultimo errore: ${ultimoErrore.message}`
  );
}

module.exports = { generaESalvaV4 };
