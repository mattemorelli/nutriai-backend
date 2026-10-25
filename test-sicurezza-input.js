// Test del modulo validazione-profilo.js (branch sicurezza-input). Niente
// framework di test nel repository (stessa convenzione delle altre
// verifiche manuali, es. test-errori-lettura.js): un assert() minimo,
// uscita 1 al primo fallimento.
const {
  ETA_MINIMA, PESO_MINIMO, PESO_MASSIMO, ALTEZZA_MINIMA, ALTEZZA_MASSIMA, BMI_SOTTOPESO,
  annoNascitaValido, altezzaValida, pesoValido, calcolaBMI, obiettivoAdattoAlBMI,
} = require('./validazione-profilo');

let falliti = 0;
function assert(condizione, messaggio) {
  if (!condizione) { console.error('FALLITO:', messaggio); falliti++; }
  else console.log('ok  ', messaggio);
}

const ANNO = 2026;

// --- eta' ---
assert(!annoNascitaValido(ANNO - 17, ANNO), 'eta\' 17 (minorenne) rifiutata');
assert(!annoNascitaValido(ANNO - 16, ANNO), 'eta\' 16 rifiutata (limite precedente, ora sotto soglia)');
assert(annoNascitaValido(ANNO - 18, ANNO), 'eta\' 18 (limite minimo) accettata');
assert(annoNascitaValido(ANNO - 100, ANNO), 'eta\' 100 (limite massimo) accettata');
assert(!annoNascitaValido(ANNO - 101, ANNO), 'eta\' 101 rifiutata');
assert(!annoNascitaValido(ANNO - 15, ANNO), 'eta\' 15 rifiutata (era il minimo della UI, ora fuori range)');
assert(!annoNascitaValido('abc', ANNO), 'anno di nascita non numerico rifiutato');

// --- altezza ---
assert(!altezzaValida(230), 'altezza 230cm (limite precedente) ora rifiutata');
assert(!altezzaValida(120), 'altezza 120cm (limite precedente) ora rifiutata');
assert(altezzaValida(ALTEZZA_MINIMA), `altezza ${ALTEZZA_MINIMA}cm (nuovo minimo) accettata`);
assert(altezzaValida(ALTEZZA_MASSIMA), `altezza ${ALTEZZA_MASSIMA}cm (nuovo massimo) accettata`);
assert(!altezzaValida(ALTEZZA_MINIMA - 1), 'altezza appena sotto il nuovo minimo rifiutata');
assert(!altezzaValida(ALTEZZA_MASSIMA + 1), 'altezza appena sopra il nuovo massimo rifiutata');

// --- peso ---
assert(!pesoValido(300), 'peso 300kg (limite precedente /onboarding) ora rifiutato');
assert(!pesoValido(35), 'peso 35kg (limite precedente /onboarding) ora rifiutato');
assert(!pesoValido(30), 'peso 30kg (limite precedente /peso) ora rifiutato');
assert(pesoValido(PESO_MINIMO), `peso ${PESO_MINIMO}kg (nuovo minimo) accettato`);
assert(pesoValido(PESO_MASSIMO), `peso ${PESO_MASSIMO}kg (nuovo massimo) accettato`);
assert(!pesoValido(PESO_MASSIMO + 1), 'peso appena sopra il nuovo massimo rifiutato (evita il caso 235kg->10.700kcal trovato nella verifica del 26/10)');

// --- BMI + obiettivo ---
const bmiSottopeso = calcolaBMI(50, 180); // 50kg, 180cm -> BMI 15.4
assert(bmiSottopeso < BMI_SOTTOPESO, 'calcolaBMI: 50kg/180cm e\' sotto la soglia di sottopeso (controllo del dato di test)');
assert(!obiettivoAdattoAlBMI('dimagrimento', bmiSottopeso), '"dimagrimento" bloccato con BMI sottopeso (15,4)');
assert(obiettivoAdattoAlBMI('mantenimento', bmiSottopeso), '"mantenimento" resta ammesso con lo stesso BMI basso');
assert(obiettivoAdattoAlBMI('massa', bmiSottopeso), '"massa" resta ammesso con lo stesso BMI basso');

const bmiNormale = calcolaBMI(70, 175); // BMI 22.9
assert(obiettivoAdattoAlBMI('dimagrimento', bmiNormale), '"dimagrimento" ammesso con BMI normale (22,9)');

const bmiSogliaEsatta = calcolaBMI(BMI_SOTTOPESO * (1.75 ** 2), 175); // esattamente 18.5 a 175cm
assert(obiettivoAdattoAlBMI('dimagrimento', bmiSogliaEsatta), '"dimagrimento" ammesso esattamente alla soglia (18,5, non e\' sottopeso)');

assert(obiettivoAdattoAlBMI('dimagrimento', null), 'BMI non calcolabile (dato mancante): non blocca qui, il controllo non deve creare falsi positivi su dati insufficienti');

console.log(`\n${falliti === 0 ? 'Tutti i test superati.' : `${falliti} test falliti.`}`);
process.exitCode = falliti === 0 ? 0 : 1;
