console.log('[genera] v6-piano-proteico caricato');

// Quanto ogni elemento puo' essere scalato. Le ancore hanno margini stretti,
// le leve margini ampi. E' questa distinzione che evita le porzioni assurde.
const LIMITI_SCALA = {
  base:      [0.4, 2.2],   // riso, pasta, pane, patate: la leva principale
  colazione: [0.8, 2.0],
  spuntino:  [0.8, 2.0],
  primo:     [0.7, 1.8],
  contorno:  [0.8, 1.5],
  secondo:   [0.9, 1.3],   // ancora: la porzione di proteina quasi non si tocca
};

function limitiDi(p) {
  if (p.piatto.base_amidacea) return LIMITI_SCALA.base;
  return LIMITI_SCALA[p.slot] || [0.9, 1.2];
}

// Distribuisce il residuo calorico proporzionalmente allo spazio di manovra
// di ciascun elemento, invece di moltiplicare tutto per lo stesso fattore.
function adattaGiornata(pasti, obiettivo) {
  const stato = pasti.map(p => ({ p, f: 1, lim: limitiDi(p) }));
  const totale = () => stato.reduce((s, x) => s + (x.p.piatto.kcal || 0) * x.f, 0);

  for (let i = 0; i < 15; i++) {
    const diff = obiettivo - totale();
    if (Math.abs(diff) < 40) break;

    if (diff > 0) {
      const spazio = stato.reduce((s, x) =>
        s + (x.p.piatto.kcal || 0) * Math.max(0, x.lim[1] - x.f), 0);
      if (spazio < 1) break;
      const quota = Math.min(1, diff / spazio);
      stato.forEach(x => { x.f += (x.lim[1] - x.f) * quota; });
    } else {
      const spazio = stato.reduce((s, x) =>
        s + (x.p.piatto.kcal || 0) * Math.max(0, x.f - x.lim[0]), 0);
      if (spazio < 1) break;
      const quota = Math.min(1, -diff / spazio);
      stato.forEach(x => { x.f -= (x.f - x.lim[0]) * quota; });
    }
  }
  return stato;
}

const LIMITI = { satMaxGiorno: 29, saleMaxGiorno: 5, fibraMinGiorno: 25 };

const QUOTE = {
  carne_rossa:  { min: 0, max: 1 },
  carne_bianca: { min: 1, max: 3 },
  pesce:        { min: 2, max: 4 },
  legumi:       { min: 1, max: 3 },
  uova:         { min: 0, max: 2 },
  formaggio:    { min: 0, max: 2 },
};

const FAMIGLIE_PER_CUCINA = {
  europea: ['mediterranea'],
  australiana: ['mediterranea'],
  asiatica: ['asiatica'],
  sud_americana: ['latina'],
  usa: ['americana'],
};

const GRUPPI = [
  ['pesce',        /fish|salmon|salmone|cod,|merluzzo|tuna|tonno|trout|trota|sgombro|sardin|acciugh|aringa|branzino|orata|barramundi|halibut|nasello|rombo|sogliola|anguilla|baccal|mahi|astice|granchio|crab|shrimp|gamber|vongol|cozze|seppia|polpo/i],
  ['carne_rossa',  /beef|manzo|brisket|agnello|lamb|canguro|kangaroo|vitell|veal|maiale|pork|lonza|speck|bresaola/i],
  ['carne_bianca', /chicken|pollo|turkey|tacchino|coniglio|rabbit/i],
  ['uova',         /\begg|uovo/i],
  ['formaggio',    /cheese|formagg|mozzarella|ricotta|pecorino|gorgonzola|taleggio|provola|emmental|caprino|stracchino|cheddar|feta|parmig/i],
  ['legumi',       /fagiol|beans,|lentil|lenticch|ceci|chickpea|lupini|tofu|tempeh|edamame/i],
];

const rankInPeso = (rank) => Math.round(25 / Math.pow(2, rank - 1));

function gruppoDa(ingredienti) {
  const testo = ingredienti.filter(i => i.grams >= 40).map(i => i.nome).join(' | ');
  for (const [gruppo, rx] of GRUPPI) {
    if (rx.test(testo)) return gruppo;
  }
  return null;
}

function ingredientePrincipale(ingredienti) {
  const utili = ingredienti.filter(i =>
    i.grams >= 40 &&
    !/oil|olio|garlic|aglio|zenzer|ginger|salsa|sauce|zucchero|sugar|miso|curry|chimichurri|gochujang|hoisin|teriyaki|limon|lime|coriandol|dressing/i.test(i.nome || '')
  );
  if (!utili.length) return null;
  return utili.sort((a, b) => b.grams - a.grams)[0].nome.toLowerCase().slice(0, 22);
}

function lunediCorrente() {
  const oggi = new Date();
  const giorno = oggi.getDay();
  const scarto = giorno === 0 ? -6 : 1 - giorno;
  const lun = new Date(oggi);
  lun.setDate(oggi.getDate() + scarto);
  return lun.toISOString().slice(0, 10);
}

function pescaPesato(voci, peso) {
  const totale = voci.reduce((s, v) => s + peso(v), 0);
  if (totale <= 0) return null;
  let r = Math.random() * totale;
  for (const v of voci) {
    r -= peso(v);
    if (r <= 0) return v;
  }
  return voci[voci.length - 1];
}

function pescaCasuale(lista, filtro) {
  const buoni = filtro ? lista.filter(filtro) : lista;
  if (!buoni.length) return null;
  return buoni[Math.floor(Math.random() * buoni.length)];
}

function mescola(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// Costruisce in anticipo l'ordine dei gruppi proteici della settimana,
// cosi' le quote sono garantite invece di sperate.
function pianoProteico(gruppiDisponibili) {
  const piano = [];
  for (const [gruppo, q] of Object.entries(QUOTE)) {
    if (!gruppiDisponibili.has(gruppo)) continue;
    for (let i = 0; i < q.min; i++) piano.push(gruppo);
  }
  const riempitivi = Object.entries(QUOTE)
    .filter(([g]) => gruppiDisponibili.has(g))
    .flatMap(([g, q]) => Array(Math.max(0, q.max - q.min)).fill(g));

  const extra = mescola(riempitivi);
  while (piano.length < 7 && extra.length) piano.push(extra.pop());
  while (piano.length < 7) piano.push(null); // nessun vincolo su questo giorno
  return mescola(piano).slice(0, 7);
}

// I minuti dichiarati sono una preferenza, non un muro. Se con quel limite
// nessun profilo ha abbastanza secondi, si allarga di 10 minuti alla volta:
// meglio una cena da 30 minuti che nessuna cena.
function limiteEfficace(secondi, profili, minutiDichiarati, minimoRichiesto) {
  for (const extra of [0, 10, 20, 35, 50]) {
    const limite = minutiDichiarati + extra;
    const reggono = profili.filter(pr =>
      secondi.filter(p =>
        p.profilo === pr &&
        (p.prep_min || 30) <= limite &&
        (p.tecnica || 'semplice') === 'semplice'
      ).length >= minimoRichiesto
    );
    if (reggono.length) return { limite, allargato: extra > 0 };
  }
  return { limite: minutiDichiarati + 60, allargato: true };
}

async function caricaPiatti(supabase, famiglie) {
  const { data: piatti, error } = await supabase
    .from('dishes')
    .select('id, name, name_en, meal_slot, cucina, profilo, famiglia, ha_amido, ha_proteina, prep_min, occasione, tecnica, health_score, salsa_industriale, base_amidacea, trasportabile, contiene_glutine, contiene_lattosio, contiene_frutta_secca, paese')
    .gte('health_score', 7)
    .not('profilo', 'is', null)
    .in('occasione', ['quotidiano', 'lungo'])
    .in('famiglia', [...famiglie, 'neutra']);

  if (error) throw new Error(error.message);
  if (!piatti?.length) throw new Error('Nessun piatto etichettato per le cucine scelte');

  const ids = piatti.map(p => p.id);
  const valori = {};

  for (let i = 0; i < ids.length; i += 200) {
    const blocco = ids.slice(i, i + 200);
    const { data: righe, error: e2 } = await supabase
      .from('dish_ingredients')
      .select('dish_id, food_id, grams, foods (name, kcal_100g, protein_100g, sat_fat_100g, fibre_100g, salt_100g)')
      .in('dish_id', blocco);
    if (e2) throw new Error(e2.message);

    for (const r of righe) {
      if (!valori[r.dish_id]) {
        valori[r.dish_id] = { kcal: 0, protein: 0, satFat: 0, fibre: 0, salt: 0, grams: 0, ingredienti: [] };
      }
      const v = valori[r.dish_id];
      const f = r.foods || {};
      const k = r.grams / 100;
      v.kcal    += (f.kcal_100g    || 0) * k;
      v.protein += (f.protein_100g || 0) * k;
      v.satFat  += (f.sat_fat_100g || 0) * k;
      v.fibre   += (f.fibre_100g   || 0) * k;
      v.salt    += (f.salt_100g    || 0) * k;
      v.grams   += r.grams;
      v.ingredienti.push({ food_id: r.food_id, nome: f.name || '', grams: r.grams });
    }
  }

  return piatti
    .filter(p => valori[p.id])
    .map(p => ({
      ...p,
      ...valori[p.id],
      gruppo: gruppoDa(valori[p.id].ingredienti),
      principale: ingredientePrincipale(valori[p.id].ingredienti),
    }));
}

const compatibile = (piatto, profilo) => piatto.profilo === profilo || piatto.profilo === 'neutro';

function accompagnaBene(accompagnamento, piattoBase) {
  if (piattoBase.ha_amido && accompagnamento.ha_amido) return false;
  if (piattoBase.ha_proteina && accompagnamento.ha_proteina) return false;
  if (accompagnamento.principale && accompagnamento.principale === piattoBase.principale) return false;
  return true;
}

async function generaESalva(supabase, userId) {
  const { data: prefRaw, error: errPref } = await supabase
    .from('user_cuisine_preferences')
    .select('cucina, rank')
    .eq('user_id', userId);
  if (errPref) throw new Error(errPref.message);

  const preferenze = (prefRaw && prefRaw.length) ? prefRaw : [{ cucina: 'europea', rank: 1 }];

  const { data: profiloUtente } = await supabase
    .from('users')
    .select('cook_days, lunch_away, evening_minutes, household_size, diet, paesi')
    .eq('id', userId)
    .maybeSingle();

  const giorniCottura = (profiloUtente && Array.isArray(profiloUtente.cook_days) && profiloUtente.cook_days.length)
    ? profiloUtente.cook_days
    : [1, 2, 3, 4, 5, 6, 7];
  const pranzoFuori = Boolean(profiloUtente && profiloUtente.lunch_away);
  const minutiSera = (profiloUtente && Number(profiloUtente.evening_minutes)) || 45;

  const paesiScelti = (profiloUtente && profiloUtente.paesi) || [];
  const GENERICI = ['mediterraneo_generico', 'asia_generico', 'latino_generico'];

  // Il paese scelto domina, il generico della famiglia lo accompagna,
  // gli altri paesi restano possibili ma rari: e' cosi' che mangia una persona.
  const pesoPaese = (p) => {
    if (!paesiScelti.length) return 1;
    if (paesiScelti.includes(p.paese)) return 25;
    if (GENERICI.includes(p.paese)) return 6;
    return 1;
  };

  const { data: vincoli } = await supabase
    .from('user_constraints').select('kind, subject, severity').eq('user_id', userId);

  const esclusi = new Set((vincoli || []).map(v => v.subject));
  const dieta = profiloUtente?.diet || 'onnivoro';

  const ammesso = (p) => {
    if (esclusi.has('glutine') && p.contiene_glutine) return false;
    if (esclusi.has('lattosio') && p.contiene_lattosio) return false;
    if (esclusi.has('frutta_secca') && p.contiene_frutta_secca) return false;

    if (dieta === 'vegano' && ['carne_rossa','carne_bianca','pesce','uova','formaggio'].includes(p.gruppo)) return false;
    if (dieta === 'vegetariano' && ['carne_rossa','carne_bianca','pesce'].includes(p.gruppo)) return false;
    if (dieta === 'pescetariano' && ['carne_rossa','carne_bianca'].includes(p.gruppo)) return false;

    return true;
  };

  // Cosa l'utente ha deciso di tenere dalla settimana precedente
  const { data: pianoVecchio } = await supabase
    .from('plans').select('id')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false }).limit(1).maybeSingle();

  const bloccatiPerGiorno = {};
  if (pianoVecchio) {
    const { data: righeBloccate } = await supabase
      .from('plan_items')
      .select('day_of_week, meal, slot, dish_id, portion_g, kcal, protein_g, sat_fat_g, fibre_g, salt_g')
      .eq('plan_id', pianoVecchio.id)
      .eq('bloccato', true);

    for (const r of (righeBloccate || [])) {
      if (!bloccatiPerGiorno[r.day_of_week]) bloccatiPerGiorno[r.day_of_week] = [];
      bloccatiPerGiorno[r.day_of_week].push(r);
    }
  }

  const cucinaOggi = (g) => giorniCottura.includes(g);
  const ferialeG = (g) => g <= 5;

  const tecnicaOk = (piatto, g) =>
    !ferialeG(g) || (piatto.tecnica || 'semplice') === 'semplice';

  const pesoFamiglia = {};
  for (const p of preferenze) {
    for (const fam of (FAMIGLIE_PER_CUCINA[p.cucina] || [])) {
      pesoFamiglia[fam] = Math.max(pesoFamiglia[fam] || 0, rankInPeso(p.rank));
    }
  }
  const famiglie = Object.keys(pesoFamiglia);
  if (!famiglie.length) throw new Error('Nessuna famiglia di sapori derivabile dalle preferenze');

  const piatti = await caricaPiatti(supabase, famiglie);

  // Cosa e' successo nelle settimane precedenti
  const { data: esiti } = await supabase
    .from('meal_outcomes')
    .select('dish_id, status, skip_reason')
    .eq('user_id', userId)
    .order('recorded_at', { ascending: false })
    .limit(300);

  const saltati = {};
  let skipPerTempo = 0, skipTotali = 0;

  for (const e of (esiti || [])) {
    if (e.status === 'saltato') {
      saltati[e.dish_id] = (saltati[e.dish_id] || 0) + 1;
      skipTotali++;
      if (e.skip_reason === 'tempo') skipPerTempo++;
    }
  }

  // Un piatto saltato due volte non si ripropone: e' un no chiaro.
  const rifiutato = (p) => (saltati[p.id] || 0) >= 2;

  // Se piu' della meta' dei salti e' per mancanza di tempo, il limite
  // dichiarato non regge la vita reale e va stretto di dieci minuti.
  const minutiCorretti = (skipTotali >= 4 && skipPerTempo / skipTotali > 0.5)
    ? Math.max(15, minutiSera - 10)
    : minutiSera;

  const profiliConSecondo = [...new Set(
    piatti.filter(p => p.meal_slot === 'secondo' && p.profilo !== 'neutro').map(p => p.profilo)
  )];
  if (!profiliConSecondo.length) throw new Error('Nessun profilo ha secondi utilizzabili');

  const { limite: limiteFeriale, allargato } = limiteEfficace(
    piatti.filter(p => p.meal_slot === 'secondo' && p.profilo !== 'neutro'),
    profiliConSecondo,
    minutiCorretti,
    8
  );

  if (allargato) {
    console.log(`[genera] limite serale allargato da ${minutiCorretti} a ${limiteFeriale} min: catalogo insufficiente`);
  }

  const secondiPerProfilo = {};
  const gruppiPerProfilo = {};

  // Conta solo i secondi realmente utilizzabili con i minuti dichiarati dall'utente
  for (const p of piatti.filter(x =>
    x.meal_slot === 'secondo' && x.profilo !== 'neutro' &&
    (x.prep_min || 30) <= limiteFeriale &&
    (x.tecnica || 'semplice') === 'semplice'
  )) {
    secondiPerProfilo[p.profilo] = (secondiPerProfilo[p.profilo] || 0) + 1;
    if (p.gruppo) {
      if (!gruppiPerProfilo[p.profilo]) gruppiPerProfilo[p.profilo] = new Set();
      gruppiPerProfilo[p.profilo].add(p.gruppo);
    }
  }

  const profiliDominanti = profiliConSecondo.filter(pr =>
    (secondiPerProfilo[pr] || 0) >= 5 &&
    (gruppiPerProfilo[pr] ? gruppiPerProfilo[pr].size : 0) >= 2
  );

  if (!profiliDominanti.length) {
    throw new Error(
      'Nessun profilo ha abbastanza secondi per reggere una settimana. Disponibili: ' +
      profiliConSecondo.map(p => `${p}=${secondiPerProfilo[p] || 0}`).join(', ')
    );
  }

  const famigliaDi = {};
  piatti.forEach(p => { if (p.profilo !== 'neutro') famigliaDi[p.profilo] = p.famiglia; });

  const perSlot = (slot) => piatti.filter(p => p.meal_slot === slot);
  const primi     = perSlot('primo');
  const secondi   = perSlot('secondo');
  const contorni  = perSlot('contorno');
  const colazioni = perSlot('colazione');
  const spuntini  = perSlot('spuntino');

  const TENTATIVI = 600;
  let migliore = null;
  let migliorPunteggio = -Infinity;

  // Contatori diagnostici: se fallisce, sappiamo perche'
  const motivi = { secondo: 0, primo: 0, tempo: 0, completati: 0 };

  for (let t = 0; t < TENTATIVI; t++) {
    const profiloSettimana = pescaPesato(profiliDominanti, pr => pesoFamiglia[famigliaDi[pr]] || 1);
    if (!profiloSettimana) continue;

    const gruppiDelProfilo = gruppiPerProfilo[profiloSettimana] || new Set();
    const sequenza = pianoProteico(gruppiDelProfilo);

    const settimana = [];
    const usati = new Set();
    const usoGruppi = {};
    let usoSalse = 0;
    let valido = true;

    for (let g = 1; g <= 7 && valido; g++) {
      const profiloGiorno = (g === 3 || g === 6)
        ? pescaPesato(profiliConSecondo, pr => pesoFamiglia[famigliaDi[pr]] || 1)
        : profiloSettimana;
      if (!profiloGiorno) { valido = false; break; }

      // Se la giornata è bloccata per intero, si riporta identica
      const bloccatiOggi = bloccatiPerGiorno[g] || [];
      const giornoInteroBloccato = bloccatiOggi.some(b => b.slot === 'secondo')
        && bloccatiOggi.some(b => b.slot === 'primo');

      if (giornoInteroBloccato) {
        settimana.push({ giorno: g, profilo: profiloGiorno, bloccati: bloccatiOggi, conforme: true, pasti: [] });
        continue;
      }

      // ---- 1. Gli avanzi si cercano PRIMA di ogni altra cosa ----
      let secondo = null;
      let secondoEAvanzo = false;

      if (!cucinaOggi(g) && settimana.length > 0) {
        for (let k = settimana.length - 1; k >= 0; k--) {
          const cena = settimana[k].pasti.find(p => p.slot === 'secondo' && !p.avanzi);
          if (cena) { secondo = cena.piatto; secondoEAvanzo = true; break; }
        }
      }

      // ---- 2. UN SOLO limite, valido per tutti i piatti del giorno ----
      // I giorni senza cottura si esprimono con gli avanzi, non stringendo i minuti:
      // se non ci sono avanzi da riusare, quel giorno si cucina come gli altri.
      const limiteOggi = ferialeG(g) ? limiteFeriale : Math.max(limiteFeriale, 75);

      // ---- 3. Selezione, sempre con lo stesso limite ----
      if (!secondo) {
        const gruppoRichiesto = sequenza[g - 1];

        const candidati = secondi.filter(p =>
          p.profilo === profiloGiorno && !usati.has(p.id) && !rifiutato(p) && ammesso(p) &&
          (p.prep_min || 30) <= limiteOggi && tecnicaOk(p, g) &&
          (!p.salsa_industriale || usoSalse < 1) &&
          (!gruppoRichiesto || p.gruppo === gruppoRichiesto)
        );
        secondo = pescaPesato(candidati, pesoPaese);

        if (!secondo) {
          const larghi = secondi.filter(p =>
            p.profilo === profiloGiorno && !usati.has(p.id) && !rifiutato(p) && ammesso(p) &&
            (p.prep_min || 30) <= limiteOggi && tecnicaOk(p, g) &&
            (!p.salsa_industriale || usoSalse < 1)
          );
          secondo = pescaPesato(larghi, pesoPaese);
        }

        if (secondo && secondo.salsa_industriale) usoSalse++;
      }

      if (!secondo) { motivi.secondo++; valido = false; break; }

      const candidatiPrimo = primi.filter(p =>
        compatibile(p, profiloGiorno) && !usati.has(p.id) && !rifiutato(p) && ammesso(p) &&
        (p.prep_min || 30) <= limiteOggi && tecnicaOk(p, g) &&
        (!pranzoFuori || p.trasportabile)
      );
      const primo = pescaPesato(candidatiPrimo, pesoPaese);
      if (!primo) { motivi.primo++; valido = false; break; }

      const contornoCena = pescaCasuale(contorni, c =>
        compatibile(c, profiloGiorno) && accompagnaBene(c, secondo) &&
        !usati.has(c.id) && !rifiutato(c) && ammesso(c) &&
        (c.prep_min || 20) <= limiteOggi && tecnicaOk(c, g)
      );

      const contornoPranzo = pescaCasuale(contorni, c =>
        compatibile(c, profiloGiorno) && accompagnaBene(c, primo) &&
        !usati.has(c.id) && !rifiutato(c) && ammesso(c) &&
        c.id !== (contornoCena && contornoCena.id) &&
        (c.prep_min || 20) <= limiteOggi && tecnicaOk(c, g) &&
        (!pranzoFuori || c.trasportabile)
      );

      const colazione = pescaCasuale(colazioni, p =>
        compatibile(p, profiloGiorno) && !usati.has(p.id) && ammesso(p) && (p.prep_min || 10) <= 15
      );
      const spuntino = pescaCasuale(spuntini, p =>
        compatibile(p, profiloGiorno) && !usati.has(p.id) && ammesso(p) && (p.prep_min || 5) <= 10
      );

      // ---- 4. Base amidacea a cena ----
      let base = null;
      const cenaHaAmido = secondo.ha_amido || (contornoCena && contornoCena.ha_amido);
      if (!cenaHaAmido) {
        base = pescaCasuale(piatti.filter(p => p.base_amidacea), b => !usati.has(b.id) && ammesso(b));
      }

      const spuntino2 = pescaCasuale(spuntini, p =>
        compatibile(p, profiloGiorno) && !usati.has(p.id) && ammesso(p) &&
        p.id !== (spuntino && spuntino.id) && (p.prep_min || 5) <= 10
      );

      // ---- 5. Registrazione: l'avanzo non consuma il piatto ----
      [primo, contornoPranzo, contornoCena, colazione, spuntino, spuntino2, base]
        .filter(Boolean).forEach(p => usati.add(p.id));
      if (!secondoEAvanzo) usati.add(secondo.id);

      if (secondo.gruppo && !secondoEAvanzo) {
        usoGruppi[secondo.gruppo] = (usoGruppi[secondo.gruppo] || 0) + 1;
      }

      const pasti = [
        colazione      && { meal: 'colazione', slot: 'colazione', piatto: colazione },
        primo          && { meal: 'pranzo',    slot: 'primo',     piatto: primo },
        contornoPranzo && { meal: 'pranzo',    slot: 'contorno',  piatto: contornoPranzo },
        spuntino       && { meal: 'spuntino',  slot: 'spuntino',  piatto: spuntino },
        secondo        && { meal: 'cena',      slot: 'secondo',   piatto: secondo, avanzi: secondoEAvanzo },
        contornoCena   && { meal: 'cena',      slot: 'contorno',  piatto: contornoCena },
        base           && { meal: 'cena',      slot: 'contorno',  piatto: base },
        spuntino2      && { meal: 'spuntino',  slot: 'spuntino',  piatto: spuntino2 },
      ].filter(Boolean);

      const tot = pasti.reduce((a, p) => ({
        satFat: a.satFat + p.piatto.satFat,
        fibre:  a.fibre  + p.piatto.fibre,
        salt:   a.salt   + p.piatto.salt,
      }), { satFat: 0, fibre: 0, salt: 0 });

      const conforme =
        tot.satFat <= LIMITI.satMaxGiorno &&
        tot.salt   <= LIMITI.saleMaxGiorno &&
        tot.fibre  >= LIMITI.fibraMinGiorno;

      settimana.push({ giorno: g, profilo: profiloGiorno, pasti, conforme });
    }

    if (!valido || settimana.length < 7) continue;

    let quoteRispettate = true;
    for (const [gruppo, q] of Object.entries(QUOTE)) {
      // Il minimo vale solo se il profilo ha davvero quei piatti
      if (!gruppiDelProfilo.has(gruppo)) continue;
      if ((usoGruppi[gruppo] || 0) < q.min) { quoteRispettate = false; break; }
    }
    if (!quoteRispettate) continue;

    motivi.completati++;

    // I giorni bloccati non hanno pasti generati: non entrano nei calcoli sotto.
    const conPasti = settimana.filter(g => g.pasti.length > 0);
    const conformi = conPasti.filter(g => g.conforme).length;
    const completezza = conPasti.length
      ? conPasti.reduce((s, g) => s + g.pasti.length, 0) / (conPasti.length * 6)
      : 1;
    const mediaSalute = conPasti.length
      ? conPasti.reduce((s, g) =>
          s + g.pasti.reduce((a, p) => a + (p.piatto.health_score || 0), 0) / g.pasti.length, 0) / conPasti.length
      : 0;
    const punteggio = conformi + completezza * 2 + mediaSalute * 0.5;

    if (punteggio > migliorPunteggio) {
      migliorPunteggio = punteggio;
      migliore = settimana;
    }
  }

  if (!migliore) {
    throw new Error(
      `Nessuna settimana completabile. Miglior punteggio: ${migliorPunteggio}. ` +
      `Cause: secondo mancante ${motivi.secondo}, primo mancante ${motivi.primo}, ` +
      `tempo eccessivo ${motivi.tempo}, completate ${motivi.completati} su ${TENTATIVI}`
    );
  }

  const { data: target } = await supabase
    .from('energy_targets')
    .select('id, kcal')
    .eq('user_id', userId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const obiettivo = target?.kcal ?? null;

  const { data: piano, error: errPiano } = await supabase
    .from('plans')
    .insert({
      user_id: userId,
      week_start: lunediCorrente(),
      generated_at: new Date().toISOString(),
      energy_target_id: target?.id ?? null,
      corpus_version: 'v8-paesi',
    })
    .select('id')
    .single();
  if (errPiano) throw new Error(`Creazione piano fallita: ${errPiano.message}`);

  const righe = [];
  for (const g of migliore) {
    if (g.bloccati && g.bloccati.length && !g.pasti.length) {
      for (const b of g.bloccati) {
        righe.push({ plan_id: piano.id, ...b, bloccato: true });
      }
      continue;
    }
    const adattati = obiettivo ? adattaGiornata(g.pasti, obiettivo) : g.pasti.map(p => ({ p, f: 1 }));
    for (const x of adattati) {
      const p = x.p, f = x.f;
      righe.push({
        plan_id: piano.id,
        day_of_week: g.giorno,
        meal: p.meal,
        slot: p.slot,
        dish_id: p.piatto.id,
        portion_g: Math.round(p.piatto.grams * f),
        kcal: Math.round(p.piatto.kcal * f),
        protein_g: Number((p.piatto.protein * f).toFixed(1)),
        sat_fat_g: Number((p.piatto.satFat * f).toFixed(1)),
        fibre_g: Number((p.piatto.fibre * f).toFixed(1)),
        salt_g: Number((p.piatto.salt * f).toFixed(2)),
        avanzi: Boolean(p.avanzi),
      });
    }
  }

  const { error: errItems } = await supabase.from('plan_items').insert(righe);
  if (errItems) {
    await supabase.from('plans').delete().eq('id', piano.id);
    throw new Error(`Inserimento pasti fallito: ${errItems.message}`);
  }

  return { plan_id: piano.id, giorni_conformi: Math.floor(migliorPunteggio) };
}

module.exports = { generaESalva };
