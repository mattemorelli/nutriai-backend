// Calcolo del fabbisogno energetico iniziale.
// Metodo: Mifflin-St Jeor per il metabolismo basale, moltiplicato per il PAL.
// E' una STIMA di partenza: sara' sostituita dalla calibrazione sui dati reali.

const GOAL_FATTORE = {
  dimagrimento: 0.85,
  mantenimento: 1.0,
  massa: 1.10,
};

function metabolismoBasale({ sesso, peso_kg, altezza_cm, eta }) {
  const base = 10 * peso_kg + 6.25 * altezza_cm - 5 * eta;
  return sesso === 'F' ? base - 161 : base + 5;
}

async function calcolaESalvaTarget(supabase, userId) {
  // profilo
  const { data: profilo, error: e1 } = await supabase
    .from('users')
    .select('sex, birth_year, height_cm, goal')
    .eq('id', userId)
    .single();
  if (e1) throw new Error(`Profilo non leggibile: ${e1.message}`);

  // peso piu' recente
  const { data: misura, error: e2 } = await supabase
    .from('body_measurements')
    .select('weight_kg')
    .eq('user_id', userId)
    .order('measured_on', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (e2) throw new Error(`Misure non leggibili: ${e2.message}`);

  // livello di attivita' corrente
  const { data: attivita, error: e3 } = await supabase
    .from('activity_periods')
    .select('pal')
    .eq('user_id', userId)
    .order('valid_from', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (e3) throw new Error(`Attivita' non leggibile: ${e3.message}`);

  if (!profilo?.height_cm || !profilo?.birth_year || !misura?.weight_kg) {
    throw new Error('Dati insufficienti per calcolare il fabbisogno');
  }

  const eta = new Date().getFullYear() - profilo.birth_year;
  const pal = Number(attivita?.pal) || 1.55;

  const bmr = metabolismoBasale({
    sesso: profilo.sex,
    peso_kg: Number(misura.weight_kg),
    altezza_cm: Number(profilo.height_cm),
    eta,
  });

  const dispendio = bmr * pal;
  let kcal = dispendio * (GOAL_FATTORE[profilo.goal] ?? 1.0);

  // Guardrail: mai sotto il metabolismo basale, mai sotto i minimi di sicurezza.
  const minimoSicurezza = profilo.sex === 'F' ? 1200 : 1500;
  let guardrail = null;
  if (kcal < bmr) { kcal = bmr; guardrail = 'sotto_bmr'; }
  if (kcal < minimoSicurezza) { kcal = minimoSicurezza; guardrail = 'minimo_sicurezza'; }

  kcal = Math.round(kcal);

  const goal = profilo.goal;
  const peso = Number(misura.weight_kg);

  // Fabbisogno proteico per chilo, secondo obiettivo e attivita'.
  // 0.83 g/kg e' il minimo per evitare carenze, non un obiettivo:
  // chi si allena ne serve il doppio, e in deficit ancora di piu'
  // per non perdere massa muscolare insieme al grasso.
  let gPerKg = 1.2;
  if (goal === 'massa') gPerKg = 1.7;
  else if (goal === 'dimagrimento') gPerKg = 1.6;
  else gPerKg = 1.4;
  if (Number(pal) >= 1.8) gPerKg += 0.1;

  const proteinMin = Math.round(peso * gPerKg);

  const riga = {
    user_id: userId,
    computed_at: new Date().toISOString(),
    kcal,
    protein_g_min: proteinMin,
    fibre_g_min: 25,                                                     // EFSA
    sat_fat_g_max: Number(((kcal * 0.10) / 9).toFixed(1)),               // <10% energia
    free_sugar_g_max: Number(((kcal * 0.10) / 4).toFixed(1)),            // <10% energia
    salt_g_max: 5,                                                       // WHO
    method: 'stima_iniziale',
    confidence: 'bassa',
    guardrail_hit: guardrail,
    input_window_days: null,
    notes: `BMR ${Math.round(bmr)} kcal, PAL ${pal}, obiettivo ${profilo.goal}`,
  };

  const { data, error } = await supabase
    .from('energy_targets')
    .insert(riga)
    .select('id, kcal')
    .single();

  if (error) throw new Error(`Salvataggio target fallito: ${error.message}`);
  return data;
}

module.exports = { calcolaESalvaTarget };