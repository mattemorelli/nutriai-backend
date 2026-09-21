const { caricaPiatti, FAMIGLIE_PER_CUCINA, GENERICI, caricaVincoli, caricaEsiti } = require('./genera');

// Allarga i vincoli a ogni giro finché non trova tre proposte.
const GIRI = [
  { tempoExtra: 0,  scoreMin: 7,   stessoPaese: true,  escludiSettimana: true  },
  { tempoExtra: 10, scoreMin: 7,   stessoPaese: true,  escludiSettimana: true  },
  { tempoExtra: 15, scoreMin: 6.5, stessoPaese: false, escludiSettimana: true  },
  { tempoExtra: 20, scoreMin: 6,   stessoPaese: false, escludiSettimana: false },
];

async function proposte(supabase, userId, itemId) {
  // 1. la riga del piano da sostituire
  const { data: item, error: e1 } = await supabase
    .from('plan_items')
    .select('id, plan_id, day_of_week, meal, slot, dish_id, portion_g, kcal')
    .eq('id', itemId)
    .single();
  if (e1 || !item) throw new Error('Riga del piano non trovata');

  // 2. il piano deve appartenere all'utente
  const { data: piano, error: ePiano } = await supabase
    .from('plans')
    .select('id, user_id')
    .eq('id', item.plan_id)
    .maybeSingle();
  if (ePiano) throw new Error('lettura plans: ' + ePiano.message);
  if (!piano || piano.user_id !== userId) throw new Error('Non autorizzato');

  // 3. il profilo dell'utente (serve per tempo e dieta)
  const { data: profilo, error: eProfilo } = await supabase
    .from('users')
    .select('evening_minutes, diet, paesi')
    .eq('id', userId)
    .maybeSingle();
  if (eProfilo) throw new Error('lettura users: ' + eProfilo.message);

  // 4. i piatti già usati nella settimana
  const { data: righe } = await supabase
    .from('plan_items')
    .select('dish_id')
    .eq('plan_id', item.plan_id);
  const giaUsati = new Set((righe || []).map(r => r.dish_id));

  return { item, piano, profilo, giaUsati };
}

// Cerca tre alternative, allargando i vincoli se non ne trova abbastanza.
async function trovaProposte(supabase, userId, itemId) {
  const { item, profilo, giaUsati } = await proposte(supabase, userId, itemId);

  // Le preferenze vere dell'utente, come le legge il generatore
  const { data: prefRaw } = await supabase
    .from('user_cuisine_preferences')
    .select('cucina, rank')
    .eq('user_id', userId);

  const preferenze = (prefRaw && prefRaw.length) ? prefRaw : [{ cucina: 'europea', rank: 1 }];

  // Stessa fonte di genera.js (FAMIGLIE_PER_CUCINA, esportata), non una
  // copia a mano: le due erano andate fuori sincrono in silenzio
  // (australiana->americana qui, ->mediterranea in genera.js) prima che il
  // filtro famiglia in caricaPiatti diventasse reale e lo rendesse visibile.
  const famiglie = [...new Set(
    preferenze
      .sort((a, b) => (a.rank || 9) - (b.rank || 9))
      .flatMap(p => FAMIGLIE_PER_CUCINA[p.cucina] || [])
  )];

  const tutti = await caricaPiatti(supabase, famiglie.length ? famiglie : ['mediterranea']);
  const { ammesso, gradito } = await caricaVincoli(supabase, userId, profilo?.diet || 'onnivoro');
  const { rifiutato } = await caricaEsiti(supabase, userId);
  // Nello Swap non cede niente: ne' le allergie ne' le preferenze, ne' un
  // piatto gia' rifiutato due volte per gusto (stessa regola del generatore).
  const piatti = tutti.filter((p) => ammesso(p) && gradito(p) && !rifiutato(p));

  const originale = tutti.find(p => p.id === item.dish_id);
  const slotCercato = originale ? originale.meal_slot : item.slot;
  const tempoBase = originale ? (originale.prep_min || 30) : (profilo?.evening_minutes || 40);

  // Il paese della giornata che si sta sostituendo: le proposte restano dentro
  const paeseGiorno = originale ? originale.paese : null;
  const paesiScelti = (profilo && profilo.paesi) || [];
  console.log('paese giornata:', paeseGiorno, '| paesi utente:', paesiScelti, '| famiglie:', famiglie);

  const paeseCompatibile = (p, giro) => {
    if (!giro.stessoPaese) return true;
    if (!paeseGiorno) return true;
    if (p.paese === paeseGiorno) return true;
    if (GENERICI.includes(p.paese)) return true;
    return false;
  };

  for (const giro of GIRI) {
    const trovati = piatti.filter(p =>
      p.meal_slot === slotCercato &&
      p.id !== item.dish_id &&
      (p.prep_min || 30) <= tempoBase + giro.tempoExtra &&
      (p.health_score || 0) >= giro.scoreMin &&
      (!giro.escludiSettimana || !giaUsati.has(p.id)) &&
      paeseCompatibile(p, giro)
    );

    if (trovati.length >= 3 || giro === GIRI[GIRI.length - 1]) {
      const scelti = trovati
        .sort((a, b) => (b.health_score || 0) - (a.health_score || 0))
        .slice(0, 3)
        .map(p => ({
          dish_id: p.id,
          nome: p.name_en || p.name,
          minuti: p.prep_min,
          voto: p.health_score,
          gruppo: p.gruppo,
          // porzione scalata per mantenere le stesse calorie della riga originale
          portion_g: p.kcal > 0
            ? Math.round((item.kcal / p.kcal) * p.grams)
            : p.grams,
        }));

      return {
        item_id: item.id,
        originale: originale ? (originale.name_en || originale.name) : null,
        proposte: scelti,
        allargato: giro !== GIRI[0],
        poche: scelti.length < 3,
      };
    }
  }
}

// Applica la sostituzione scelta dall'utente, ricalcolando i valori nutrizionali.
async function applicaSostituzione(supabase, userId, itemId, nuovoDishId, portionG) {
  const { item, profilo } = await proposte(supabase, userId, itemId);

  // Difesa lato server: anche se il client manda un piatto vietato, non passa.
  const { foodIdVietati } = await caricaVincoli(supabase, userId, profilo?.diet || 'onnivoro');
  const { data: ingNuovo } = await supabase
    .from('dish_ingredients').select('food_id').eq('dish_id', nuovoDishId);
  if ((ingNuovo || []).some((i) => foodIdVietati.has(i.food_id))) {
    throw new Error('Piatto non ammesso per le allergie o la dieta dell\'utente');
  }

  // ingredienti del nuovo piatto, per 100 g di ricetta
  const { data: righe, error: e1 } = await supabase
    .from('dish_ingredients')
    .select('grams, foods (kcal_100g, protein_100g, sat_fat_100g, fibre_100g, salt_100g)')
    .eq('dish_id', nuovoDishId);
  if (e1) throw new Error(e1.message);

  const tot = { kcal: 0, protein: 0, satFat: 0, fibre: 0, salt: 0, grams: 0 };
  for (const r of righe || []) {
    const f = r.foods || {};
    const k = r.grams / 100;
    tot.kcal    += (f.kcal_100g    || 0) * k;
    tot.protein += (f.protein_100g || 0) * k;
    tot.satFat  += (f.sat_fat_100g || 0) * k;
    tot.fibre   += (f.fibre_100g   || 0) * k;
    tot.salt    += (f.salt_100g    || 0) * k;
    tot.grams   += r.grams;
  }

  // fattore di scala dalla ricetta base alla porzione scelta
  const s = tot.grams > 0 ? portionG / tot.grams : 1;
  const arr = (n) => Math.round(n * 10) / 10;

  const { error } = await supabase
    .from('plan_items')
    .update({
      dish_id: nuovoDishId,
      portion_g: portionG,
      kcal:      Math.round(tot.kcal * s),
      protein_g: arr(tot.protein * s),
      sat_fat_g: arr(tot.satFat  * s),
      fibre_g:   arr(tot.fibre   * s),
      salt_g:    arr(tot.salt    * s),
      stato: 'sostituito',
      sostituito_da_dish_id: item.dish_id,
      modificato_il: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) throw new Error(error.message);
  return { ok: true, item_id: itemId, nuovo_dish_id: nuovoDishId };
}

// Scambia questa riga con quella dello stesso pasto/slot in un altro giorno.
async function spostaGiorno(supabase, userId, itemId, giornoDestinazione) {
  const { item } = await proposte(supabase, userId, itemId);

  if (giornoDestinazione === item.day_of_week) {
    throw new Error('È già in quel giorno');
  }

  // Possono esserci più righe con lo stesso pasto/slot (contorni, spuntini):
  // si scambia con la prima che non sia già stata spostata.
  const { data: candidate } = await supabase
    .from('plan_items')
    .select('id, day_of_week, stato')
    .eq('plan_id', item.plan_id)
    .eq('day_of_week', giornoDestinazione)
    .eq('meal', item.meal)
    .eq('slot', item.slot)
    .order('id');

  const gemella = (candidate || []).find(c => c.stato !== 'spostato') || (candidate || [])[0] || null;

  const ora = new Date().toISOString();

  if (!gemella) {
    // nessuna riga da scambiare: sposta e basta
    const { error } = await supabase
      .from('plan_items')
      .update({
        day_of_week: giornoDestinazione,
        stato: 'spostato',
        spostato_da_giorno: item.day_of_week,
        modificato_il: ora,
      })
      .eq('id', itemId);
    if (error) throw new Error(error.message);
    return { ok: true, scambiato: false };
  }

  // scambio: le due righe si scambiano il giorno
  const { error: e1 } = await supabase
    .from('plan_items')
    .update({
      day_of_week: giornoDestinazione,
      stato: 'spostato',
      spostato_da_giorno: item.day_of_week,
      modificato_il: ora,
    })
    .eq('id', itemId);
  if (e1) throw new Error(e1.message);

  const { error: e2 } = await supabase
    .from('plan_items')
    .update({
      day_of_week: item.day_of_week,
      stato: 'spostato',
      spostato_da_giorno: giornoDestinazione,
      modificato_il: ora,
    })
    .eq('id', gemella.id);
  if (e2) throw new Error(e2.message);

  return { ok: true, scambiato: true, con_item: gemella.id };
}

// Segna una riga come saltata (non la cancella: resta lo storico).
async function saltaPasto(supabase, userId, itemId, annulla = false) {
  await proposte(supabase, userId, itemId); // verifica proprietà

  const { error } = await supabase
    .from('plan_items')
    .update({
      stato: annulla ? 'previsto' : 'saltato',
      modificato_il: annulla ? null : new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) throw new Error(error.message);
  return { ok: true, item_id: itemId, stato: annulla ? 'previsto' : 'saltato' };
}

module.exports = { proposte, trovaProposte, applicaSostituzione, spostaGiorno, saltaPasto, GIRI };