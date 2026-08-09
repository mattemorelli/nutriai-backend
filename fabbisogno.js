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

function proteineTarget(peso, goal, minutiAllenamento) {
  let gPerKg = goal === 'massa' ? 1.7 : goal === 'dimagrimento' ? 1.6 : 1.4;
  if (minutiAllenamento >= 240) gPerKg += 0.1;
  return Math.round(peso * gPerKg);
}

async function calcolaESalvaTarget(supabase, userId) {
  const { data: u } = await supabase
    .from('users').select('sex, birth_year, height_cm, goal, occupation_level')
    .eq('id', userId).single();

  const { data: m } = await supabase
    .from('body_measurements').select('weight_kg, body_fat_pct')
    .eq('user_id', userId).order('measured_on', { ascending: false }).limit(1).maybeSingle();

  const { data: sessioni } = await supabase
    .from('training_sessions').select('activity, minutes_per_week, intensity')
    .eq('user_id', userId);

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
    const { data: att } = await supabase
      .from('activity_periods').select('pal')
      .eq('user_id', userId).order('valid_from', { ascending: false }).limit(1).maybeSingle();
    const pal = Number(att && att.pal) || 1.4;
    tdee = Math.round(bmr * pal);
    modello = 'pal_legacy';
  }

  const minutiTot = (sessioni || []).reduce((s, x) => s + (x.minutes_per_week || 0), 0);
  const { kcal, rete } = applicaObiettivo(tdee, bmr, dati.peso, u.goal);

  const riga = {
    user_id: userId,
    computed_at: new Date().toISOString(),
    kcal,
    protein_g_min: proteineTarget(dati.peso, u.goal, minutiTot),
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