const { caricaPiatti, caricaPiattiPerId, FAMIGLIE_PER_CUCINA, GENERICI, caricaVincoli, caricaEsiti, accompagnaBene, sostitutoSenzaGlutineNonRichiesto, limitiDi, QUOTE } = require('./genera');
const { preservaQuantitaGiornaliere, origineAvanzo, leggiRighePiano, salvaModifiche, caricaContestoModifiche, errorePiano, verificaModificabile, puoScambiare, settimanaPreservata } = require('./modifiche-piano');
const { preservaRuoliDelPasto } = require('./modelli-pasto');
const { tempoDi, limiteTempo, ammessoNelContesto, tempoPastoPreservato, porzioneProposta, validaPorzione, giornataPreservata, nutrientiPorzione } = require('./vincoli-swap');

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
    .select('*')
    .eq('id', itemId)
    .single();
  if (e1 || !item) throw new Error('Riga del piano non trovata');

  // 2. il piano deve appartenere all'utente
  const { data: piano, error: ePiano } = await supabase
    .from('plans')
    .select('id, user_id, energy_target_id')
    .eq('id', item.plan_id)
    .maybeSingle();
  if (ePiano) throw new Error('lettura plans: ' + ePiano.message);
  if (!piano || piano.user_id !== userId) throw new Error('Non autorizzato');

  // 3. il profilo dell'utente (serve per tempo e dieta)
  const { data: profilo, error: eProfilo } = await supabase
    .from('users')
    .select('evening_minutes, diet, paesi, pasti_casa, lunch_away')
    .eq('id', userId)
    .maybeSingle();
  if (eProfilo) throw new Error('lettura users: ' + eProfilo.message);
  if (!profilo) throw new Error('Profilo non disponibile');

  // 4. i piatti già usati nella settimana
  const righe = await leggiRighePiano(supabase, item.plan_id);
  const corrente = righe.find(r=>r.id===item.id);
  if (!corrente) throw errorePiano('riga_non_trovata', 'This dish is no longer in the plan.', 404);
  Object.assign(item, corrente);
  const giaUsati = new Set(righe.filter(r=>r.stato!=='saltato').map(r=>r.dish_id));
  const gemelliDishIds = [...new Set(righe.filter(r=>r.day_of_week===item.day_of_week&&r.meal===item.meal&&r.id!==item.id&&r.stato!=='saltato').map(r=>r.dish_id))];

  // I tetti si riferiscono al target della settimana salvata, anche dopo
  // una modifica del profilo. Non prendere un target di un altro utente.
  let qTarget = supabase.from('energy_targets').select('kcal, protein_g_min').eq('user_id', userId);
  qTarget = piano.energy_target_id ? qTarget.eq('id', piano.energy_target_id) : qTarget.order('computed_at', { ascending: false }).limit(1);
  const { data: target, error: eTarget } = await qTarget.maybeSingle();
  if (eTarget) throw new Error('lettura energy_targets: ' + eTarget.message);
  if (!(Number(target?.kcal) > 0 && Number(target?.protein_g_min) > 0)) throw new Error('Fabbisogno del piano non disponibile');
  return { item, piano, profilo, giaUsati, gemelliDishIds, kcalTarget: Number(target.kcal), target, righeGiornata: righe.filter(r=>r.stato!=='saltato'), righePiano: righe };
}

// Cerca tre alternative, allargando i vincoli se non ne trova abbastanza.
async function trovaProposte(supabase, userId, itemId) {
  const { item, profilo, giaUsati, gemelliDishIds, kcalTarget, target, righeGiornata, righePiano } = await proposte(supabase, userId, itemId);

  verificaModificabile(item, righePiano);
  // Le preferenze vere dell'utente, come le legge il generatore
  const { data: prefRaw, error: ePreferenze } = await supabase
    .from('user_cuisine_preferences')
    .select('cucina, rank')
    .eq('user_id', userId);

  if (ePreferenze) throw new Error('lettura user_cuisine_preferences: ' + ePreferenze.message);
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

  const tutti = await caricaPiatti(supabase, famiglie.length ? famiglie : ['mediterranea'], 6);
  const { ammesso, gradito, categorieVietate } = await caricaVincoli(supabase, userId, profilo?.diet || 'onnivoro');
  const esiti = await caricaEsiti(supabase, userId);
  const { rifiutato } = esiti;
  const haVincoloGlutine = categorieVietate.has('glutine');
  // Nello Swap non cede niente: ne' le allergie ne' le preferenze, ne' un
  // piatto gia' rifiutato due volte per gusto (stessa regola del generatore).
  // Un piatto "senza glutine" non si propone a chi non ne ha bisogno
  // (problema 4 dell'audit), stessa regola del generatore.
  const piatti = tutti.filter((p) => ammesso(p) && gradito(p) && !rifiutato(p) && !sostitutoSenzaGlutineNonRichiesto(p, haVincoloGlutine));

  const originale = tutti.find(p => p.id === item.dish_id)
    || (await caricaPiattiPerId(supabase, [item.dish_id]))[0];
  if (!originale) throw new Error('Impossibile verificare il piatto originale');
  const slotCercato = originale ? originale.meal_slot : item.slot;
  const tempoBase = originale ? (originale.prep_min || 30) : (profilo?.evening_minutes || 40);

  // I piatti gemelli dello stesso pasto, risolti dallo stesso catalogo
  // arricchito (amidoReale, ruoli_coperti, principale - gli stessi campi che
  // accompagnaBene legge in genera.js). Un gemello non trovato nel pool
  // arricchito (dieta/famiglia diversa da quella dell'utente che sta
  // facendo lo swap, caso raro) va riletto per id; una componente non
  // risolvibile interrompe la verifica del pasto.
  const gemelli = await caricaPiattiPerId(supabase, gemelliDishIds);
  if (gemelli.length !== gemelliDishIds.length) throw new Error('Impossibile verificare il resto del pasto');
  const accompagnaTuttiIGemelli = (p) => gemelli.every(g => accompagnaBene(p, g));
  const perId = new Map((await caricaPiattiPerId(supabase, [...new Set(righePiano.map(r=>r.dish_id))])).map(p=>[p.id,p]));
  piatti.forEach(p=>perId.set(p.id,p));

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
      tempoDi(p) <= tempoBase + giro.tempoExtra &&
      ammessoNelContesto(p, item, profilo, esiti) &&
      tempoPastoPreservato(originale,p,gemelli,item,profilo,esiti) &&
      porzioneProposta(p, item, kcalTarget, limitiDi) !== null &&
      giornataPreservata(item, righeGiornata, target, nutrientiPorzione(p, porzioneProposta(p, item, kcalTarget, limitiDi))) &&
      preservaQuantitaGiornaliere(righePiano,righePiano.map(r=>r.id===item.id?{...r,dish_id:p.id,portion_g:porzioneProposta(p,item,kcalTarget,limitiDi)}:r),perId,target,[item.day_of_week]) &&
      (p.health_score || 0) >= giro.scoreMin &&
      (!giro.escludiSettimana || !giaUsati.has(p.id)) &&
      paeseCompatibile(p, giro) &&
      preservaRuoliDelPasto(originale, p, gemelli) &&
      accompagnaTuttiIGemelli(p) &&
      settimanaPreservata(righePiano,righePiano.map(r=>r.id===item.id?{...r,dish_id:p.id}:r),perId,QUOTE)
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
          portion_g: porzioneProposta(p, item, kcalTarget, limitiDi),
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
  const contesto=await caricaContestoModifiche(supabase,userId);
  const { item, profilo, gemelliDishIds, kcalTarget, target, righeGiornata, righePiano } = await proposte(supabase, userId, itemId);

  verificaModificabile(item, righePiano);
  const vincoli = await caricaVincoli(supabase, userId, profilo.diet || 'onnivoro');
  const esiti = await caricaEsiti(supabase, userId);

  // Stessa difesa lato server per l'abbinamento col pasto (problema F
  // dell'audit): anche se trovaProposte ha gia' filtrato, applicaSostituzione
  // e' il punto che scrive davvero sul piano - deve controllare di nuovo, non
  // fidarsi che il client richiami per forza con un dish_id uscito da
  // trovaProposte. Risolve il nuovo piatto e i gemelli dallo stesso catalogo
  // arricchito di genera.js (amidoReale, ruoli_coperti, principale), non da
  // una sua riletture a mano.
  {
    const risolti = await caricaPiattiPerId(supabase, [...new Set([nuovoDishId, ...righePiano.map(r=>r.dish_id)])]);
    const perId = new Map(risolti.map(p => [p.id, p]));
    const piattoNuovo = perId.get(nuovoDishId), originale = perId.get(item.dish_id);
    const gemelli = gemelliDishIds.map(id => perId.get(id));
    if (!piattoNuovo || !originale || gemelli.some(p => !p)) throw new Error('Impossibile verificare la composizione del pasto');
    if (piattoNuovo.meal_slot !== item.slot) throw new Error('Piatto non ammesso in questa portata');
    if (!(piattoNuovo.health_score>=6)) throw errorePiano('piatto_non_ammesso','This dish is outside the supported catalogue.');
    if (!settimanaPreservata(righePiano,righePiano.map(r=>r.id===item.id?{...r,dish_id:nuovoDishId}:r),perId,QUOTE)) {
      throw errorePiano('frequenze_settimanali','This swap would unbalance the weekly food groups.');
    }
    if (!vincoli.ammesso(piattoNuovo) || !vincoli.gradito(piattoNuovo) || esiti.rifiutato(piattoNuovo)
        || sostitutoSenzaGlutineNonRichiesto(piattoNuovo, vincoli.categorieVietate.has('glutine'))) {
      throw new Error('Piatto non ammesso per dieta, allergie o preferenze');
    }
    if (!ammessoNelContesto(piattoNuovo, item, profilo, esiti) || !tempoPastoPreservato(originale,piattoNuovo,gemelli,item,profilo,esiti)) throw new Error('Piatto non ammesso per tempo, tecnica o trasporto');
    validaPorzione(piattoNuovo, item, portionG, kcalTarget, limitiDi);

    if (!preservaRuoliDelPasto(originale, piattoNuovo, gemelli)) {
      throw new Error('La sostituzione toglierebbe una componente del pasto senza rimpiazzarla');
    }
    if (gemelli.some(g => !accompagnaBene(piattoNuovo, g))) {
      throw new Error('Piatto non ammesso: non si abbina bene con il resto del pasto (doppio amido, doppia proteina o stesso ingrediente principale)');
    }
    if (!preservaQuantitaGiornaliere(righePiano,righePiano.map(r=>r.id===item.id?{...r,dish_id:nuovoDishId,portion_g:portionG}:r),perId,target,[item.day_of_week])) {
      throw errorePiano('quantita_giornaliere','This swap would undo the daily balance of nuts or fats. Choose another dish.');
    }
  }

  // ingredienti del nuovo piatto, per 100 g di ricetta
  const { data: righe, error: e1 } = await supabase
    .from('dish_ingredients')
    .select('grams, foods (kcal_100g, protein_100g, sat_fat_100g, fibre_100g, salt_100g)')
    .eq('dish_id', nuovoDishId);
  if (e1) throw new Error(e1.message);
  if (!righe?.length || righe.some(r => !r.foods || !(Number(r.grams) > 0))) throw new Error('Ingredienti del piatto non verificabili');

  const tot = { kcal: 0, protein: 0, satFat: 0, fibre: 0, salt: 0, grams: 0 };
  for (const r of righe || []) {
    const f = r.foods || {};
    const k = r.grams / 100;
    tot.kcal    += (f.kcal_100g    || 0) * k;
    tot.protein += (f.protein_100g || 0) * k;
    tot.satFat  += (f.sat_fat_100g || 0) * k;
    tot.fibre   += (f.fibre_100g   || 0) * k;
    tot.salt    += (f.salt_100g    || 0) * k;
    tot.grams   += Number(r.grams);
  }

  // fattore di scala dalla ricetta base alla porzione scelta
  const s = tot.grams > 0 ? portionG / tot.grams : 1;
  const arr = (n) => Math.round(n * 10) / 10;
  if (!giornataPreservata(item, righeGiornata, target, nutrientiPorzione(tot, portionG))) {
    throw new Error('La sostituzione peggiorerebbe il bilanciamento della giornata');
  }

  await salvaModifiche(supabase,userId,item.plan_id,righePiano,[{id:itemId,patch:{
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
    }}],contesto);

  return { ok: true, item_id: itemId, nuovo_dish_id: nuovoDishId };
}

// Scambia questa riga con quella dello stesso pasto/slot in un altro giorno.
async function spostaGiorno(supabase, userId, itemId, giornoDestinazione) {
  if (!Number.isInteger(giornoDestinazione)||giornoDestinazione<1||giornoDestinazione>7) throw errorePiano('giorno_non_valido','Choose a day from Monday to Sunday.',400);
  const contesto=await caricaContestoModifiche(supabase,userId);
  const {item,profilo,target,righePiano} = await proposte(supabase,userId,itemId);
  if (giornoDestinazione===item.day_of_week) throw errorePiano('stesso_giorno','This dish is already on that day.',400);
  verificaModificabile(item,righePiano);
  const ids=[...new Set(righePiano.map(r=>r.dish_id))];
  const perId=new Map((await caricaPiattiPerId(supabase,ids)).map(p=>[p.id,p]));
  if(perId.size!==ids.length)throw errorePiano('dati_piano_incompleti','Some dishes cannot be checked. Please build a new week.');
  const vincoli=await caricaVincoli(supabase,userId,profilo.diet||'onnivoro');
  const esiti=await caricaEsiti(supabase,userId);
  const candidate=righePiano.filter(r=>r.day_of_week===giornoDestinazione&&r.meal===item.meal&&r.slot===item.slot&&r.stato!=='saltato');
  let gemella=null;
  for(const r of candidate){
    try { verificaModificabile(r,righePiano); } catch(e) { if(e.status===422)continue;throw e; }
    if(![item,r].every(q=>vincoli.ammesso(perId.get(q.dish_id))&&vincoli.gradito(perId.get(q.dish_id))&&!esiti.rifiutato(perId.get(q.dish_id))))continue;
    if(puoScambiare(item,r,righePiano,perId,profilo,esiti,target,QUOTE,accompagnaBene)){gemella=r;break;}
  }
  if(!gemella)throw errorePiano('spostamento_non_compatibile','No compatible swap was found for that day. Your plan has not changed.');
  const ora=new Date().toISOString();
  await salvaModifiche(supabase,userId,item.plan_id,righePiano,[
    {id:item.id,patch:{day_of_week:giornoDestinazione,stato:'spostato',spostato_da_giorno:item.day_of_week,modificato_il:ora}},
    {id:gemella.id,patch:{day_of_week:item.day_of_week,stato:'spostato',spostato_da_giorno:giornoDestinazione,modificato_il:ora}},
  ],contesto);
  return {ok:true,scambiato:true,con_item:gemella.id};
}

// Il salto e' una scelta esplicita: non gonfia automaticamente gli altri
// pasti. La rilettura del piano mostra i totali e gli avvisi aggiornati.
async function saltaPasto(supabase,userId,itemId,annulla=false){
  const contesto=await caricaContestoModifiche(supabase,userId);
  const {item,profilo,righePiano}=await proposte(supabase,userId,itemId);
  if(annulla ? item.stato!=='saltato' : item.stato==='saltato')return {ok:true,item_id:itemId,stato:item.stato};
  verificaModificabile(item,righePiano,{salto:true});
  let patch;
  if(annulla){
    if(item.avanzi && (!origineAvanzo(righePiano,item)||origineAvanzo(righePiano,item).stato==='saltato'))throw errorePiano('avanzi_collegati','Put the original preparation back before restoring these leftovers.');
    const piatti=await caricaPiattiPerId(supabase,[...new Set([item.dish_id,...righePiano.filter(r=>r.day_of_week===item.day_of_week&&r.meal===item.meal&&r.stato!=='saltato').map(r=>r.dish_id)])]);
    const idsRichiesti=new Set([item.dish_id,...righePiano.filter(r=>r.day_of_week===item.day_of_week&&r.meal===item.meal&&r.stato!=='saltato').map(r=>r.dish_id)]);
    if(piatti.length!==idsRichiesti.size)throw errorePiano('dati_piano_incompleti','The rest of this meal cannot be checked.');
    const p=piatti.find(p=>p.id===item.dish_id);
    const vincoli=await caricaVincoli(supabase,userId,profilo.diet||'onnivoro');
    const esiti=await caricaEsiti(supabase,userId);
    if(!p||!vincoli.ammesso(p)||!vincoli.gradito(p)||esiti.rifiutato(p)||!ammessoNelContesto(p,item,profilo,esiti))throw errorePiano('piatto_non_ammesso','This dish no longer matches your diet or allergies.');
    if(piatti.some(q=>q.id!==p.id&&!accompagnaBene(p,q)))throw errorePiano('ripristino_non_compatibile','This dish no longer fits with the rest of the meal.');
    const perId=new Map(piatti.map(q=>[q.id,q]));
    const durata=righePiano.filter(r=>r.day_of_week===item.day_of_week&&r.meal===item.meal&&(r.stato!=='saltato'||r.id===item.id)).reduce((s,r)=>s+(r.avanzi?0:tempoDi(perId.get(r.dish_id))),0);
    if(durata>Math.max(limiteTempo(item,profilo,esiti),Number(item.ripristino_salto?.minuti_pasto)||0))throw errorePiano('ripristino_non_compatibile','Restoring this dish would make the meal too long to prepare.');
    const stato=item.ripristino_salto?.stato || (item.spostato_da_giorno!=null?'spostato':item.sostituito_da_dish_id?'sostituito':'previsto');
    patch={stato,modificato_il:item.ripristino_salto?.modificato_il??null,ripristino_salto:null};
  }else{
    const pasto=righePiano.filter(r=>r.day_of_week===item.day_of_week&&r.meal===item.meal&&r.stato!=='saltato');
    const piatti=await caricaPiattiPerId(supabase,[...new Set(pasto.map(r=>r.dish_id))]);
    const perId=new Map(piatti.map(p=>[p.id,p]));
    const minuti=pasto.every(r=>perId.has(r.dish_id))?pasto.reduce((s,r)=>s+(r.avanzi?0:tempoDi(perId.get(r.dish_id))),0):null;
    patch={stato:'saltato',modificato_il:new Date().toISOString(),ripristino_salto:{stato:item.stato||'previsto',modificato_il:item.modificato_il??null,minuti_pasto:minuti}};
  }
  await salvaModifiche(supabase,userId,item.plan_id,righePiano,[{id:item.id,patch}],contesto);
  return {ok:true,item_id:itemId,stato:patch.stato};
}

module.exports = { proposte, trovaProposte, applicaSostituzione, spostaGiorno, saltaPasto, GIRI };
