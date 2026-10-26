// I MET misurano il costo di un'attività in multipli del metabolismo a riposo.
// Sottraiamo 1 perché quel riposo è già dentro il basale: sommarlo due volte
// è l'errore più comune nei calcolatori online.
const MET = {
  camminata: { leggera: 3.0, moderata: 3.8, intensa: 4.5 },
  corsa:     { leggera: 7.0, moderata: 9.8, intensa: 12.0 },
  ciclismo:  { leggera: 4.0, moderata: 8.0, intensa: 10.0 },
  pesi:      { leggera: 3.5, moderata: 5.0, intensa: 6.0 },
  nuoto:     { leggera: 5.0, moderata: 7.0, intensa: 9.0 },
  squadra:   { leggera: 5.0, moderata: 7.0, intensa: 9.0 },
  hiit:      { leggera: 6.0, moderata: 8.0, intensa: 10.0 },
  yoga:      { leggera: 2.5, moderata: 3.0, intensa: 4.0 },
};

// Quanto costa vivere, allenamento escluso.
const NEAT = {
  sedentario: 1.35, in_piedi: 1.50, fisico: 1.65, molto_fisico: 1.80,
};

const KCAL_PER_KG_GRASSO = 7700;

function bmrMifflin({ peso, altezza, eta, sesso }) {
  const base = 10 * peso + 6.25 * altezza - 5 * eta;
  return sesso === 'F' ? base - 161 : base + 5;
}

function bmrKatch(peso, bodyFatPct) {
  const magra = peso * (1 - bodyFatPct / 100);
  return 370 + 21.6 * magra;
}

function calcolaBMR(dati) {
  if (dati.bodyFatPct && dati.bodyFatPct > 3 && dati.bodyFatPct < 60) {
    return { valore: bmrKatch(dati.peso, dati.bodyFatPct), metodo: 'katch_mcardle' };
  }
  return { valore: bmrMifflin(dati), metodo: 'mifflin_st_jeor' };
}

function kcalAllenamento(sessioni, peso) {
  let settimanale = 0;
  for (const s of (sessioni || [])) {
    const met = (MET[s.activity] || MET.camminata)[s.intensity] || 4;
    const ore = (s.minutes_per_week || 0) / 60;
    settimanale += (met - 1) * 1.05 * peso * ore;
  }
  return settimanale / 7;
}

// L'obiettivo è un ritmo di variazione settimanale, non una percentuale fissa.
function applicaObiettivo(tdee, bmr, peso, goal) {
  const ritmo = { dimagrimento: -0.006, mantenimento: 0, massa: 0.0025 }[goal] ?? 0;
  const scarto = (peso * ritmo * KCAL_PER_KG_GRASSO) / 7;

  let target = tdee + scarto;
  let rete = null;

  if (target < tdee * 0.80) { target = tdee * 0.80; rete = 'deficit_max_20'; }
  if (target < bmr)          { target = bmr;         rete = 'sotto_basale'; }
  if (target < 1200)         { target = 1200;        rete = 'minimo_clinico'; }

  return { kcal: Math.round(target), rete };
}

// Sopra un BMI di 30 il peso reale sovrastima il bisogno proteico (la massa
// grassa non consuma proteine come la massa magra, e g/kg sul peso reale
// diventerebbe irrealistico per chi e' molto sovrappeso): si usa un peso di
// riferimento a BMI 25 invece del peso reale. Sotto 30 il peso reale resta
// il riferimento, senza correzione. Soglia alzata da 27 a 30 il 2026-10-09,
// richiesta esplicita.
function pesoRiferimentoProteico(peso, altezzaCm) {
  if (!altezzaCm) return peso;
  const h = altezzaCm / 100;
  const bmi = peso / (h * h);
  if (bmi <= 30) return peso;
  return 25 * h * h;
}

// Rifatta il 2026-10-09 (seconda correzione: la prima, 1.2 + 0.2 deficit +
// 0.2 forza, dava 95g a un fabbisogno di 1590 kcal - 24% delle kcal dalla
// sola proteina, irraggiungibile col catalogo attuale, trovato bloccando il
// generatore su quel profilo). Il deficit calorico NON alza piu' il minimo
// (richiesta esplicita: "anche in deficit" il sedentario resta a 1.2 g/kg -
// la letteratura sportiva alzerebbe il minimo in deficit per difendere la
// massa magra, ma qui si e' scelta la raggiungibilita' su un fabbisogno
// basso rispetto all'ottimo teorico). Due fasce, non piu' quattro incrementi
// cumulabili: 1.2 g/kg sedentario o attivita' leggera (anche in deficit),
// 1.6 g/kg con allenamento di forza almeno 90 min/settimana (2 sedute). Fra
// le due, un allenamento di forza presente ma sotto soglia vale 1.4 g/kg
// (interpolazione non scritta esplicitamente nella richiesta, per non far
// scattare la soglia come un gradino unico da zero a tutto).
function proteineTarget({ peso, altezzaCm, minutiForza }) {
  const gPerKg = minutiForza >= 90 ? 1.6 : minutiForza > 0 ? 1.4 : 1.2;
  const pesoRif = pesoRiferimentoProteico(peso, altezzaCm);
  return Math.round(pesoRif * gPerKg);
}

async function calcolaESalvaTarget(supabase, userId) {
  const { data: u, error: erroreUtente } = await supabase
    .from('users').select('sex, birth_year, height_cm, goal, occupation_level')
    .eq('id', userId).single();
  if (erroreUtente) throw new Error('lettura users: ' + erroreUtente.message);

  const { data: m, error: erroreMisure } = await supabase
    .from('body_measurements').select('weight_kg, body_fat_pct')
    .eq('user_id', userId).order('measured_on', { ascending: false }).limit(1).maybeSingle();
  if (erroreMisure) throw new Error('lettura body_measurements: ' + erroreMisure.message);

  const { data: sessioni, error: erroreAllenamenti } = await supabase
    .from('training_sessions').select('activity, minutes_per_week, intensity')
    .eq('user_id', userId);
  // Una lettura fallita non significa "nessun allenamento": ignorarla
  // sottostimava il fabbisogno e salvava quel valore come valido.
  if (erroreAllenamenti) throw new Error('lettura training_sessions: ' + erroreAllenamenti.message);

  if (!u || !m || !u.height_cm || !u.birth_year) {
    throw new Error('Dati insufficienti per calcolare il fabbisogno');
  }

  const dati = {
    peso: Number(m.weight_kg),
    altezza: Number(u.height_cm),
    eta: new Date().getFullYear() - u.birth_year,
    sesso: u.sex,
    bodyFatPct: m.body_fat_pct ? Number(m.body_fat_pct) : null,
  };

  const { valore: bmr, metodo } = calcolaBMR(dati);

  // Chi si è registrato prima della migrazione ha solo il PAL.
  // Meglio usare quello che fingere che sia sedentario e non si alleni mai.
  const haNuoviDati = Boolean(u.occupation_level);
  let tdee, modello, sport = 0;

  if (haNuoviDati) {
    const neat = NEAT[u.occupation_level] || NEAT.sedentario;
    sport = kcalAllenamento(sessioni, dati.peso);
    // L'effetto termico del cibo vale circa il 10% dell'introito:
    // si applica sul totale, quindi si divide.
    tdee = Math.round((bmr * neat + sport) / 0.90);
    modello = 'neat_met';
  } else {
    const { data: att, error: erroreAttivita } = await supabase
      .from('activity_periods').select('pal')
      .eq('user_id', userId).order('valid_from', { ascending: false }).limit(1).maybeSingle();
    if (erroreAttivita) throw new Error('lettura activity_periods: ' + erroreAttivita.message);
    const pal = Number(att && att.pal) || 1.4;
    tdee = Math.round(bmr * pal);
    modello = 'pal_legacy';
  }

  const minutiForza = (sessioni || [])
    .filter(s => s.activity === 'pesi')
    .reduce((s, x) => s + (x.minutes_per_week || 0), 0);
  const { kcal, rete } = applicaObiettivo(tdee, bmr, dati.peso, u.goal);

  const riga = {
    user_id: userId,
    computed_at: new Date().toISOString(),
    kcal,
    protein_g_min: proteineTarget({ peso: dati.peso, altezzaCm: dati.altezza, goal: u.goal, minutiForza }),
    fibre_g_min: 25,
    sat_fat_g_max: Number(((kcal * 0.10) / 9).toFixed(1)),
    free_sugar_g_max: Number(((kcal * 0.10) / 4).toFixed(1)),
    salt_g_max: 5,
    method: 'stima_iniziale',
    confidence: dati.bodyFatPct ? 'media' : 'bassa',
    tdee_predetto: tdee,
    notes: `${modello} | ${metodo} | BMR ${Math.round(bmr)} | sport ${Math.round(sport)} kcal/g | TDEE ${tdee}${rete ? ' | rete ' + rete : ''}`,
  };

  const { error } = await supabase.from('energy_targets').insert(riga);
  if (error) throw new Error('Salvataggio target fallito: ' + error.message);
  return riga;
}

module.exports = { calcolaESalvaTarget, calcolaBMR, MET, NEAT };
