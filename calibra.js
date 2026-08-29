const KCAL_PER_KG = 7700;

// Il peso oscilla di 1-2 kg al giorno per acqua e glicogeno.
// Confrontare primo e ultimo giorno è quindi rumore: serve la pendenza
// della retta su tutte le misure.
function pendenzaKgAlGiorno(misure) {
  const n = misure.length;
  if (n < 6) return null;

  const t0 = new Date(misure[0].measured_on).getTime();
  const punti = misure.map(m => ({
    x: (new Date(m.measured_on).getTime() - t0) / 86400000,
    y: Number(m.weight_kg),
  }));

  const mx = punti.reduce((s, p) => s + p.x, 0) / n;
  const my = punti.reduce((s, p) => s + p.y, 0) / n;
  const num = punti.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = punti.reduce((s, p) => s + (p.x - mx) ** 2, 0);

  return den === 0 ? null : num / den;
}

async function calibra(supabase, userId) {
  const da = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);

  const { data: misure } = await supabase
    .from('body_measurements').select('measured_on, weight_kg')
    .eq('user_id', userId).gte('measured_on', da).order('measured_on');

  const { data: introiti } = await supabase
    .from('intake_estimates').select('day, kcal')
    .eq('user_id', userId).gte('day', da);

  if (!misure || misure.length < 6) {
    return { calibrato: false, motivo: 'Servono almeno 6 pesate nelle ultime 4 settimane' };
  }
  if (!introiti || introiti.length < 10) {
    return { calibrato: false, motivo: 'Servono almeno 10 giorni di consumo registrato' };
  }

  const pendenza = pendenzaKgAlGiorno(misure);
  if (pendenza === null) {
    return { calibrato: false, motivo: 'Andamento del peso non leggibile' };
  }

  const introitoMedio = introiti.reduce((s, i) => s + Number(i.kcal), 0) / introiti.length;

  // Se il peso sale, consumi meno di quanto mangi: la differenza è il consumo reale.
  const tdeeMisurato = introitoMedio - pendenza * KCAL_PER_KG;

  const { data: ultimo } = await supabase
    .from('energy_targets').select('*')
    .eq('user_id', userId).order('computed_at', { ascending: false }).limit(1).single();

  if (!ultimo) return { calibrato: false, motivo: 'Nessun target da calibrare' };

  const predetto = Number(ultimo.tdee_predetto) || tdeeMisurato;

  // La fiducia nella misura cresce con i dati: all'inizio vince la formula,
  // dopo un mese vince la bilancia.
  const giorni = introiti.length;
  const fiducia = Math.min(0.8, (giorni / 28) * 0.8);
  const tdee = Math.round(predetto * (1 - fiducia) + tdeeMisurato * fiducia);

  // Oltre il 25% di scostamento è quasi sempre un errore di registrazione,
  // non un metabolismo eccezionale.
  if (Math.abs(tdee - predetto) / predetto > 0.25) {
    return { calibrato: false, motivo: 'Scostamento implausibile: probabile errore nei dati' };
  }

  const ritmo = { dimagrimento: -0.006, mantenimento: 0, massa: 0.0025 };
  const { data: u } = await supabase.from('users').select('goal').eq('id', userId).single();
  const pesoOra = Number(misure[misure.length - 1].weight_kg);
  const scarto = (pesoOra * (ritmo[u.goal] ?? 0) * KCAL_PER_KG) / 7;

  let kcal = Math.round(tdee + scarto);
  if (kcal < tdee * 0.80) kcal = Math.round(tdee * 0.80);
  if (kcal < 1200) kcal = 1200;

  await supabase.from('energy_targets').insert({
    ...ultimo,
    id: undefined,
    computed_at: new Date().toISOString(),
    kcal,
    method: 'calibrato',
    confidence: giorni >= 21 ? 'alta' : 'media',
    tdee_predetto: predetto,
    tdee_misurato: Math.round(tdeeMisurato),
    giorni_dati: giorni,
    notes: `calibrato su ${giorni} giorni | predetto ${predetto} | misurato ${Math.round(tdeeMisurato)} | fiducia ${fiducia.toFixed(2)}`,
  });

  return { calibrato: true, kcal, tdee, tdeeMisurato: Math.round(tdeeMisurato), giorni };
}

module.exports = { calibra };