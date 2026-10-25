// Limiti d'ingresso (eta', peso, altezza) e la regola BMI-obiettivo, in un
// solo posto: prima erano ripetuti (con valori diversi!) in /onboarding,
// /profilo e /peso - vedi la verifica del 26 ottobre 2026
// (mappa-utenti-fabbisogno.md) che ha trovato le 3 rotte con limiti
// diversi fra loro e nessuna delle tre con un controllo legato al BMI.
//
// Branch dedicato (sicurezza-input): non ancora su main.

const ETA_MINIMA = 18;
const ETA_MASSIMA = 100;
const PESO_MINIMO = 40;
const PESO_MASSIMO = 220;
const ALTEZZA_MINIMA = 140;
const ALTEZZA_MASSIMA = 210;
const BMI_SOTTOPESO = 18.5; // soglia OMS: sotto 18.5 e' "sottopeso".

function annoNascitaValido(birthYear, annoCorrente = new Date().getFullYear()) {
  const y = Number(birthYear);
  if (!Number.isInteger(y)) return false;
  const eta = annoCorrente - y;
  return eta >= ETA_MINIMA && eta <= ETA_MASSIMA;
}

function altezzaValida(cm) {
  const h = Number(cm);
  return h >= ALTEZZA_MINIMA && h <= ALTEZZA_MASSIMA;
}

function pesoValido(kg) {
  const w = Number(kg);
  return w >= PESO_MINIMO && w <= PESO_MASSIMO;
}

function calcolaBMI(pesoKg, altezzaCm) {
  const h = Number(altezzaCm) / 100;
  return Number(pesoKg) / (h * h);
}

// true = l'obiettivo e' adatto al BMI attuale; false = va bloccato
// (oggi solo "dimagrimento" sotto la soglia di sottopeso - mantenimento e
// massa restano sempre ammessi, qualunque sia il BMI).
function obiettivoAdattoAlBMI(goal, bmi) {
  if (goal !== 'dimagrimento') return true;
  if (bmi == null || Number.isNaN(bmi)) return true; // dato insufficiente: non blocca, non e' questo il controllo che deve farlo
  return bmi >= BMI_SOTTOPESO;
}

module.exports = {
  ETA_MINIMA, ETA_MASSIMA, PESO_MINIMO, PESO_MASSIMO, ALTEZZA_MINIMA, ALTEZZA_MASSIMA, BMI_SOTTOPESO,
  annoNascitaValido, altezzaValida, pesoValido, calcolaBMI, obiettivoAdattoAlBMI,
};
