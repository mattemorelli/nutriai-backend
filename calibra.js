const { caricaContestoGenerazione } = require('./salvataggio-generazione');
const {finestraCalibrazione}=require('./date-locali');
const KCAL_PER_KG = 7700;
const numeroPositivo = n => n !== null && n !== '' && Number.isFinite(Number(n)) && Number(n) > 0;
const erroreDati = () => Object.assign(new Error('Check your weight and intake records before calibrating.'), { status: 422, code: 'dati_calibrazione_non_validi' });

function pendenzaKgAlGiorno(misure) {
  const n = misure.length;
  if (n < 6) return null;
  const t0 = new Date(misure[0].measured_on).getTime();
  const punti = misure.map(m => ({ x: (new Date(m.measured_on).getTime() - t0) / 86400000, y: Number(m.weight_kg) }));
  const mx = punti.reduce((s, p) => s + p.x, 0) / n;
  const my = punti.reduce((s, p) => s + p.y, 0) / n;
  const num = punti.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = punti.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  return den === 0 ? null : num / den;
}

async function leggiSerie(supabase, userId, tabella, data, campi, da, oggi) {
  const tutte = [];
  for (let i = 0; ; i += 500) {
    const { data: righe, error } = await supabase.from(tabella).select(campi).eq('user_id', userId)
      .gte(data, da).lte(data, oggi).order(data).order('id').range(i, i + 499);
    if (error) throw new Error('lettura ' + tabella + ': ' + error.message);
    tutte.push(...(righe || []));
    if (!righe || righe.length < 500) return tutte;
  }
}

async function calibra(supabase, userId) {
  // Leggere la versione prima dei dati impedisce di salvare su una serie
  // cambiata durante il calcolo. Anche pesi e introiti fanno avanzare la versione.
  const contesto = await caricaContestoGenerazione(supabase, userId);
  const {oggi,da}=finestraCalibrazione();
  const [misure, introiti] = await Promise.all([
    leggiSerie(supabase, userId, 'body_measurements', 'measured_on', 'id, measured_on, weight_kg', da, oggi),
    leggiSerie(supabase, userId, 'intake_estimates', 'day', 'id, day, kcal_est', da, oggi),
  ]);
  if (misure.some(m => !numeroPositivo(m.weight_kg) || !Number.isFinite(Date.parse(m.measured_on)))
    || introiti.some(i => !numeroPositivo(i.kcal_est) || !Number.isFinite(Date.parse(i.day)))
    || new Set(misure.map(m => m.measured_on)).size !== misure.length
    || new Set(introiti.map(i => i.day)).size !== introiti.length) throw erroreDati();
  if (misure.length < 6) return { calibrato: false, motivo: 'Servono almeno 6 pesate nelle ultime 4 settimane' };
  if (introiti.length < 10) return { calibrato: false, motivo: 'Servono almeno 10 giorni di consumo registrato' };
  const pendenza = pendenzaKgAlGiorno(misure);
  if (pendenza === null) return { calibrato: false, motivo: 'Andamento del peso non leggibile' };
  const introitoMedio = introiti.reduce((s, i) => s + Number(i.kcal_est), 0) / introiti.length;
  const tdeeMisurato = introitoMedio - pendenza * KCAL_PER_KG;
  if (!numeroPositivo(tdeeMisurato)) throw erroreDati();
  const { data: ultimo, error: eTarget } = await supabase.from('energy_targets').select('*')
    .eq('user_id', userId).order('computed_at', { ascending: false }).order('id', { ascending: false }).limit(1).maybeSingle();
  if (eTarget) throw new Error('lettura energy_targets: ' + eTarget.message);
  if (!ultimo) return { calibrato: false, motivo: 'Nessun target da calibrare' };
  const predetto = ultimo.tdee_predetto == null ? tdeeMisurato : Number(ultimo.tdee_predetto);
  if (!numeroPositivo(predetto)) throw erroreDati();
  const giorni = introiti.length;
  const fiducia = Math.min(0.8, (giorni / 28) * 0.8);
  const tdee = Math.round(predetto * (1 - fiducia) + tdeeMisurato * fiducia);
  if (Math.abs(tdee - predetto) / predetto > 0.25) return { calibrato: false, motivo: 'Scostamento implausibile: probabile errore nei dati' };
  const { data: u, error: eUtente } = await supabase.from('users').select('goal').eq('id', userId).single();
  if (eUtente) throw new Error('lettura users: ' + eUtente.message);
  const ritmo = { dimagrimento: -0.006, mantenimento: 0, massa: 0.0025 };
  if (!u || !Object.hasOwn(ritmo, u.goal)) throw erroreDati();
  const pesoOra = Number(misure.at(-1).weight_kg);
  const scarto = pesoOra * ritmo[u.goal] * KCAL_PER_KG / 7;
  let kcal = Math.round(tdee + scarto);
  if (kcal < tdee * 0.80) kcal = Math.round(tdee * 0.80);
  if (kcal < 1200) kcal = 1200;
  const target = { computed_at: new Date().toISOString(), kcal, confidence: giorni >= 21 ? 'alta' : 'media',
    tdee_predetto: predetto, tdee_misurato: Math.round(tdeeMisurato), giorni_dati: giorni,
    notes: `calibrato su ${giorni} giorni | predetto ${predetto} | misurato ${Math.round(tdeeMisurato)} | fiducia ${fiducia.toFixed(2)}` };
  const { data: salvato, error } = await supabase.rpc('quadrio_salva_calibrazione_v1', {
    p_user_id: userId, p_contesto: contesto, p_target_id: ultimo.id, p_target: target,
  });
  if (error) {
    if (['PT409', '40001', '40P01'].includes(error.code)) throw Object.assign(new Error('Your records changed while calibrating. Try again.'), { status: 409, code: 'contesto_calibrazione_modificato' });
    if (['57014', '55P03'].includes(error.code)) throw Object.assign(new Error('Saving is taking too long. Try again.'), { status: 503, code: 'salvataggio_generazione_temporaneo' });
    throw new Error('salvataggio calibrazione: ' + error.message);
  }
  if (!salvato?.ok || typeof salvato.target_id !== 'string') throw new Error('salvataggio calibrazione non confermato');
  return { calibrato: true, kcal, tdee, tdeeMisurato: Math.round(tdeeMisurato), giorni };
}
module.exports = { calibra };
