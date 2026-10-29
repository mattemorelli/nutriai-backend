// Limiti tecnici gia' usati dal prodotto; non certificano l'idoneita' clinica.
const { annoNascitaValido, altezzaValida, pesoValido, calcolaBMI, obiettivoAdattoAlBMI } = require('./validazione-profilo');
const ATTIVITA = ['camminata', 'corsa', 'ciclismo', 'pesi', 'nuoto', 'squadra', 'hiit', 'yoga'];
const INTENSITA = ['leggera', 'moderata', 'intensa'];
const OCCUPAZIONI = ['sedentario', 'in_piedi', 'fisico', 'molto_fisico'];
function erroreDati(messaggio) {
  return Object.assign(new Error(messaggio), { status: 400 });
}
function numero(v) {
  return (typeof v === 'number' || (typeof v === 'string' && v.trim() !== ''))
    && Number.isFinite(Number(v));
}
function massaGrassa(v) {
  if (v == null) return null;
  // Intervallo del metodo Katch gia' supportato: fuori da qui prima veniva
  // ignorato silenziosamente, mostrando comunque una confidenza maggiore.
  if (!numero(v) || Number(v) <= 3 || Number(v) >= 60) {
    throw erroreDati('Massa grassa non valida: usare un valore maggiore di 3 e minore di 60, oppure ometterla');
  }
  return Number(v);
}
function allenamenti(sessioni = []) {
  if (!Array.isArray(sessioni)) throw erroreDati('Allenamenti non validi');
  return sessioni.map(s => {
    if (!s || !ATTIVITA.includes(s.activity)) throw erroreDati('Attività di allenamento non riconosciuta');
    if (!INTENSITA.includes(s.intensity)) throw erroreDati('Intensità di allenamento non valida');
    if (!numero(s.minutes_per_week) || !Number.isInteger(Number(s.minutes_per_week)) || Number(s.minutes_per_week) < 0 || Number(s.minutes_per_week) > 1200) {
      throw erroreDati('Durata di allenamento non valida: da 0 a 1200 minuti interi settimanali');
    }
    return { activity: s.activity, intensity: s.intensity, minutes_per_week: Number(s.minutes_per_week) };
  });
}
function validaDati(u, m) {
  if (!u || !m || !['M', 'F'].includes(u.sex) || !annoNascitaValido(u.birth_year)
      || !altezzaValida(u.height_cm) || !pesoValido(m.weight_kg)
      || !['dimagrimento', 'mantenimento', 'massa'].includes(u.goal)) {
    throw erroreDati('Dati insufficienti o non validi per calcolare il fabbisogno');
  }
  if (u.occupation_level != null && !OCCUPAZIONI.includes(u.occupation_level)) {
    throw erroreDati('Livello di attività non valido');
  }
  massaGrassa(m.body_fat_pct);
  if (!obiettivoAdattoAlBMI(u.goal, calcolaBMI(m.weight_kg, u.height_cm))) {
    throw Object.assign(erroreDati('obiettivo_non_adatto'), { motivo: 'bmi_basso' });
  }
}
module.exports = { allenamenti, massaGrassa, validaDati, numero, erroreDati, OCCUPAZIONI };
