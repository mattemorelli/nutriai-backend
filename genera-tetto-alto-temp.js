console.log('[genera] v6-piano-proteico caricato');

// Il generico è ammesso solo dentro la sua famiglia: un piatto
// "mediterraneo generico" sta bene in una giornata italiana,
// non in una giapponese.
const GENERICO_DI = {
  italia: 'mediterraneo_generico', francia: 'mediterraneo_generico',
  spagna: 'mediterraneo_generico', grecia: 'mediterraneo_generico',
  portogallo: 'mediterraneo_generico',
  germania: 'centro_nord_generico', regno_unito: 'centro_nord_generico',
  giappone: 'asia_generico', cina: 'asia_generico', thailandia: 'asia_generico',
  corea: 'asia_generico', vietnam: 'asia_generico',
  messico: 'latino_generico', argentina: 'latino_generico',
  brasile: 'latino_generico', ande: 'latino_generico',
  stati_uniti: null, australia: 'mediterraneo_generico',
};

const CORPUS_VERSION = 'v8-paesi-e-vincoli';

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

// Un generatore pseudocasuale CON SEME, non Math.random diretto: la stessa
// generazione (stesso profilo, stesso seed) deve produrre sempre lo stesso
// piano, cosi' un fallimento intermittente si puo' rigiocare invece di
// restare un mistero. E' passato esplicitamente a ogni funzione che pesca a
// caso (mai una variabile di modulo condivisa): il server serve piu' utenti
// sullo stesso processo Node, e uno stato condiviso mutabile fra chiamate
// asincrone concorrenti mescolerebbe il seed di un utente con quello di un
// altro.
function creaRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pescaPesato(voci, peso, rng) {
  const totale = voci.reduce((s, v) => s + peso(v), 0);
  if (totale <= 0) return null;
  let r = rng() * totale;
  for (const v of voci) {
    r -= peso(v);
    if (r <= 0) return v;
  }
  return voci[voci.length - 1];
}

function pescaCasuale(lista, filtro, rng) {
  const buoni = filtro ? lista.filter(filtro) : lista;
  if (!buoni.length) return null;
  return buoni[Math.floor(rng() * buoni.length)];
}

function mescola(a, rng) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// Costruisce in anticipo l'ordine dei gruppi proteici della settimana,
// cosi' le quote sono garantite invece di sperate.
function pianoProteico(gruppiDisponibili, rng) {
  const piano = [];
  for (const [gruppo, q] of Object.entries(QUOTE)) {
    if (!gruppiDisponibili.has(gruppo)) continue;
    for (let i = 0; i < q.min; i++) piano.push(gruppo);
  }
  const riempitivi = Object.entries(QUOTE)
    .filter(([g]) => gruppiDisponibili.has(g))
    .flatMap(([g, q]) => Array(Math.max(0, q.max - q.min)).fill(g));

  const extra = mescola(riempitivi, rng);
  while (piano.length < 7 && extra.length) piano.push(extra.pop());
  while (piano.length < 7) piano.push(null); // nessun vincolo su questo giorno
  return mescola(piano, rng).slice(0, 7);
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

// Normalizza una stringa per il confronto fra alias: minuscole, accenti
// rimossi, spazi e underscore trattati come equivalenti. "Frutta a guscio",
// "frutta_guscio", "FRUTTA A GUSCIO" devono ridursi tutte alla stessa chiave.
function normalizza(s) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, ' ')
    .trim();
}

// Risolve il subject dichiarato da un utente (codice categoria, nome_it,
// nome_en o sinonimo, in qualunque forma) al codice categoria corrispondente,
// usando la tabella alias_categoria come unica fonte - li' un vincolo di
// unicita' sul database impedisce che lo stesso alias appartenga a due
// categorie diverse (e' esattamente il punto dove e' nato il bug
// latticini/lattosio). Estratta come funzione a se' ed esportata perche' un
// test deve poter chiamare QUESTA funzione, non una sua reimplementazione.
function trovaCategoria(subject, mappaAlias) {
  const chiave = normalizza(subject);
  if (!chiave) return null;
  const codice = mappaAlias.get(chiave);
  return codice ? { codice } : null;
}

// Alcune categorie ne contengono altre: il maiale e' comunque carne rossa,
// il lattosio e' comunque presente nei latticini. Chi esclude la categoria
// piu' ampia deve escludere anche quella contenuta, anche se un domani un
// alimento venisse taggato con una sola delle due per una svista - non ci si
// puo' affidare al doppio tag manuale per sempre.
const CONTENUTE_IN = {
  carne_rossa: ['maiale'],
  latticini: ['lattosio'],
};

async function caricaPiatti(supabase, famiglie, sogliaSalute = 7) {
  // PostgREST impone un tetto di righe per risposta (di default 1000)
  // indipendente da .limit(): con 1741 piatti nel db va paginato con
  // .range(), altrimenti i piatti inseriti per ultimi (es. centro_nord_generico)
  // restano sempre fuori dal generatore.
  const piatti = [];
  const PAGINA = 1000;
  for (let offset = 0; ; offset += PAGINA) {
    const { data: blocco, error } = await supabase
      .from('dishes')
      .select('id, name, name_en, meal_slot, cucina, profilo, famiglia, ha_amido, ha_proteina, prep_min, occasione, tecnica, health_score, salsa_industriale, base_amidacea, trasportabile, contiene_glutine, contiene_lattosio, contiene_frutta_secca, paese')
      .gte('health_score', sogliaSalute)
      .not('profilo', 'is', null)
      .in('occasione', ['quotidiano', 'lungo'])
      .order('id')
      .range(offset, offset + PAGINA - 1);

    if (error) throw new Error(error.message);
    piatti.push(...blocco);
    if (blocco.length < PAGINA) break;
  }

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

async function generaESalva(supabase, userId, seedIniziale) {
  // Seed esplicito se passato (per rigiocare un fallimento segnalato),
  // altrimenti generato qui - ma sempre salvato col piano, cosi' ogni
  // generazione e' rigiocabile a posteriori, non solo quando lo si prevede.
  const seed = (seedIniziale != null ? Number(seedIniziale) : Math.floor(Math.random() * 4294967296)) >>> 0;
  const rng = creaRng(seed);

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
  const GENERICI = ['mediterraneo_generico', 'asia_generico', 'latino_generico', 'centro_nord_generico'];
  // A quale macro-area appartiene ciascun generico: centro_nord_generico e'
  // comunque Europa (i paesi che vi ricadono, Germania e Regno Unito, sono
  // sotto la stessa cucina 'europea' -> famiglia 'mediterranea' di
  // Italia/Francia/Spagna in FAMIGLIE_PER_CUCINA). Un tedesco che finisce nel
  // pool mediterraneo resta in Europa; solo asia_generico e latino_generico
  // sono davvero un'altra macro-area (Fase 3 Passo C bis, C9).
  const FAMIGLIA_DI_GENERICO = {
    mediterraneo_generico: 'mediterranea',
    centro_nord_generico: 'mediterranea',
    asia_generico: 'asiatica',
    latino_generico: 'latina',
  };

  // Il paese scelto domina, il generico della famiglia lo accompagna,
  // gli altri paesi restano possibili ma rari: e' cosi' che mangia una persona.
  const pesoPaese = (p) => {
    if (!paesiScelti.length) return 1;
    if (paesiScelti.includes(p.paese)) return 25;
    if (GENERICI.includes(p.paese)) return 6;
    return 1;
  };

  // --- Espansione dei vincoli tramite categorie_alimenti ---

  // 1. I vincoli dell'utente
  const { data: vincoli } = await supabase
    .from('user_constraints')
    .select('kind, subject, severity')
    .eq('user_id', userId);

  // 2. Gli alias delle categorie (codice, nome_it, nome_en, sinonimi gia'
  // normalizzati), unica fonte di risoluzione: il vincolo di unicita' vive
  // sul database (alias_categoria.alias e' chiave primaria).
  const { data: aliasRighe } = await supabase
    .from('alias_categoria')
    .select('alias, codice');
  const mappaAlias = new Map((aliasRighe || []).map(r => [r.alias, r.codice]));

  // 3. Per ogni subject dichiarato, l'insieme dei food_id da escludere
  const foodIdVietati = new Set();

  for (const v of (vincoli || [])) {
    const s = (v.subject || '').trim();
    if (!s) continue;

    // Il subject corrisponde a una categoria (per codice, nome o sinonimo)?
    const cat = trovaCategoria(s, mappaAlias);

    if (cat) {
      const codiciDaEscludere = [cat.codice, ...(CONTENUTE_IN[cat.codice] || [])];
      for (const codice of codiciDaEscludere) {
        const { data: righe } = await supabase
          .from('categorie_alimenti')
          .select('food_id')
          .eq('categoria', codice);
        for (const r of (righe || [])) foodIdVietati.add(r.food_id);
      }
      continue;
    }

    // Altrimenti e' un singolo alimento: prendo TUTTE le corrispondenze
    const { data: cibi } = await supabase
      .from('foods')
      .select('id')
      .or(`name.ilike.%${s}%,name_it.ilike.%${s}%`);
    for (const c of (cibi || [])) foodIdVietati.add(c.id);
  }

  // 4. Le categorie escluse dalla dieta
  const dieta = profiloUtente?.diet || 'onnivoro';
  const categorieDieta = {
    vegano:       ['carne_rossa', 'carne_bianca', 'pesce', 'crostacei', 'molluschi', 'uova', 'latticini'],
    vegetariano:  ['carne_rossa', 'carne_bianca', 'pesce', 'crostacei', 'molluschi'],
    pescetariano: ['carne_rossa', 'carne_bianca'],
  };

  const codiciDietaEspansi = new Set();
  for (const codice of (categorieDieta[dieta] || [])) {
    codiciDietaEspansi.add(codice);
    for (const contenuta of (CONTENUTE_IN[codice] || [])) codiciDietaEspansi.add(contenuta);
  }

  for (const codice of codiciDietaEspansi) {
    const { data: righe } = await supabase
      .from('categorie_alimenti')
      .select('food_id')
      .eq('categoria', codice);
    for (const r of (righe || [])) foodIdVietati.add(r.food_id);
  }

  // 5. Il filtro: un piatto e' ammesso se nessuno dei suoi ingredienti e' vietato
  const ammesso = (p) => {
    const ingredienti = p.ingredienti || p.dish_ingredients || [];
    for (const i of ingredienti) {
      const fid = i.food_id || (i.foods && i.foods.id);
      if (fid && foodIdVietati.has(fid)) return false;
    }
    return true;
  };

  console.log(`Vincoli: ${foodIdVietati.size} alimenti esclusi (dieta: ${dieta})`);

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

  // Soglia 6, la piu' bassa mai ammessa (gradino 5 del Passo C): il filtro
  // vero per voto salute si applica in memoria a ogni tentativo, cosi' non
  // si riinterroga il database per ogni gradino della scala.
  let piatti = await caricaPiatti(supabase, famiglie, 6);

  // La dieta è un vincolo assoluto: si applica una volta sola, a monte,
  // così quote, piano proteico e selezione lavorano già su piatti ammessi.
  piatti = piatti.filter(ammesso);

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

  // Conta tutti i secondi utilizzabili per la soglia dei profili dominanti.
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

  // Fase 3 Passo B: non si prefiltra piu' quali profili sono "abbastanza
  // ricchi" (la vecchia soglia >=5 secondi e >=2 gruppi proteici misurava la
  // cosa sbagliata - ammetteva profili che poi non completavano sette giorni,
  // e ne rifiutava altri risolvibili). Si prova ogni profilo con secondi
  // utilizzabili tramite costruzione incrementale con backtracking: e' la
  // costruzione stessa a rispondere se una settimana esiste.

  const famigliaDi = {};
  piatti.forEach(p => { if (p.profilo !== 'neutro') famigliaDi[p.profilo] = p.famiglia; });

  // ================= Fase 3 Passo B+C: costruttore con backtracking e scala di allentamento =================
  // Si costruisce UNA settimana un pezzo alla volta: ogni volta si riempie lo
  // slot con MENO candidati ammissibili, e quando uno slot resta senza
  // candidati si torna indietro all'ultima scelta fatta e si prova il
  // candidato successivo di QUELLO slot - non si butta via la settimana. Un
  // tetto di passi (5000 per profilo tentato) evita casi patologici. Se la
  // ricerca completa a un gradino di allentamento e' esaurita per TUTTI i
  // profili, si sale di un gradino e si rifa' la ricerca completa da capo -
  // mai un allentamento parziale "a occhio".
  //
  // Dieta, allergie e i non_graditi assoluti NON hanno alcun percorso qui
  // dentro: sono gia' fuori dal pool prima ancora di arrivarci (piatti =
  // piatti.filter(ammesso), sopra) - la scala non li vede proprio, non c'e'
  // un gradino che li "non applica", semplicemente non esiste codice che li
  // tocchi in questa funzione.

  const MAX_PASSI = Number(process.env.MAX_PASSI_TEST || 5000);

  // Mescola una lista con l'rng col seme, ordinata per peso (famiglia
  // preferita) DOPO il mescolamento: usata per la scelta del profilo, non
  // per i piatti (quelli usano l'estrazione pesata qui sotto, C6).
  function pesoOrdinato(lista, pesoFn, rng) {
    return mescola(lista, rng)
      .map(v => ({ v, peso: pesoFn(v) }))
      .sort((a, b) => b.peso - a.peso)
      .map(x => x.v);
  }

  // C6: peso di qualita' di un candidato piatto. Il voto salute domina
  // l'ordine, l'aderenza alle preferenze di cucina (pesoPaese: 25 sul paese
  // scelto, 6 sul generico, 1 altrove) e' un correttivo piu' leggero che
  // conta solo a parita' di voto - per questo e' su scala log2 mentre il
  // voto e' moltiplicato per 10. Pensata per crescere: le preferenze
  // nutrizionali di una fase successiva si aggiungono come un altro termine
  // sommato qui, non come un rimpiazzo.
  function pesoCandidato(p) {
    const salute = (p.health_score != null ? p.health_score : 6) * 10;
    const aderenza = Math.log2((pesoPaese(p) || 1) + 1);
    return salute + aderenza;
  }

  // Estrazione pesata col seme: pesca senza reimbussolare, ricalcolando i
  // pesi sui rimanenti - e' l'idea di pescaPesato ripetuta finche' la lista
  // non si esaurisce, cosi' l'intero ORDINE riflette il peso, non solo il
  // primo elemento. Ogni candidato resta raggiungibile: cambia la
  // probabilita' di essere provato presto, mai l'insieme di cio' che e'
  // possibile provare.
  function mescolaPesata(lista, pesoFn, rng) {
    const rimanenti = lista.slice();
    const risultato = [];
    while (rimanenti.length) {
      const pesi = rimanenti.map(pesoFn);
      const totale = pesi.reduce((s, w) => s + Math.max(w, 1e-6), 0);
      let r = rng() * totale;
      let scelto = rimanenti.length - 1;
      for (let i = 0; i < rimanenti.length; i++) {
        r -= Math.max(pesi[i], 1e-6);
        if (r <= 0) { scelto = i; break; }
      }
      risultato.push(rimanenti[scelto]);
      rimanenti.splice(scelto, 1);
    }
    return risultato;
  }

  // Concatena piu' livelli di preferenza (es. profilo proprio, poi
  // ripetizione consentita): ogni livello e' estratto pesato per conto suo,
  // i duplicati fra livelli sono tolti. Il livello piu' preferito resta
  // primo nella struttura, ma la ricerca puo' comunque scendere ai livelli
  // successivi invece di fermarsi.
  function concatenaLivelli(livelli, rng) {
    const visti = new Set();
    const risultato = [];
    for (const livello of livelli) {
      for (const p of mescolaPesata(livello, pesoCandidato, rng)) {
        if (visti.has(p.id)) continue;
        visti.add(p.id);
        risultato.push(p);
      }
    }
    return risultato;
  }

  // Un tentativo di costruzione completo a un dato gradino di allentamento.
  // gradino 0 = obiettivo, nessun allentamento. sogliaSalute e' passata a
  // parte perche' al gradino 5 scende sotto 7 in due passi (6.5 poi 6),
  // sempre dentro lo stesso gradino 5.
  function provaGradino(opz, sogliaSalute) {
    const perSlot = (slot) => piatti.filter(p => p.meal_slot === slot && (p.health_score == null || p.health_score >= sogliaSalute));
    const primi     = perSlot('primo');
    const secondi   = perSlot('secondo');
    const contorni  = perSlot('contorno');
    const colazioni = perSlot('colazione');
    const spuntini  = perSlot('spuntino');

    const diagnosticaProfili = [];
    const profiliDaProvare = pesoOrdinato(profiliConSecondo, pr => pesoFamiglia[famigliaDi[pr]] || 1, rng);

    profiliEsterni:
    for (const profiloSettimana of profiliDaProvare) {
      const passiUsati = { valore: 0 };

      const gruppiDelProfilo = gruppiPerProfilo[profiloSettimana] || new Set();
      const sequenza = pianoProteico(gruppiDelProfilo, rng);

      // Stato mutabile di questo tentativo: ogni frame della pila sa come
      // annullare esattamente cio' che ha causato, cosi' tornare indietro e'
      // la semplice inversa di andare avanti.
      const usati = new Set();
      const usoGruppi = {};
      const usoSalse = { valore: 0 };
      const ripetizioniSecondo = { valore: 0 }; // gradino 1: al massimo una nell'intera settimana
      const statoGiorni = Array.from({ length: 7 }, () => ({}));
      const pila = [];

      function creaFrame(giorno, nomeSlot, candidati, applica) {
        return { giorno, nomeSlot, candidati, indice: 0, applica, annullaCorrente: null };
      }
      function entraFrame(frame) {
        frame.annullaCorrente = frame.applica(frame.candidati[0]);
        passiUsati.valore++;
      }
      function riprovaFrame(frame) {
        if (frame.annullaCorrente) { frame.annullaCorrente(); frame.annullaCorrente = null; }
        frame.indice++;
        if (frame.indice >= frame.candidati.length) return false;
        frame.annullaCorrente = frame.applica(frame.candidati[frame.indice]);
        passiUsati.valore++;
        return true;
      }
      // Torna indietro all'ultima scelta e prova il candidato successivo di
      // QUELLO slot (B2); se e' esaurito, si scende di un altro livello
      // nella pila, finche' non se ne trova uno con alternative o la pila
      // si svuota (questo profilo, a questo gradino, non regge nessuna
      // settimana).
      function indietro() {
        while (pila.length) {
          const frame = pila[pila.length - 1];
          if (riprovaFrame(frame)) return frame.giorno - 1;
          pila.pop();
        }
        return -1;
      }

      function assegnaSlot(gi, nomeSlot, piatto) {
        statoGiorni[gi][nomeSlot] = piatto;
        usati.add(piatto.id);
        return () => { delete statoGiorni[gi][nomeSlot]; usati.delete(piatto.id); };
      }
      // Un secondo puo' essere: fresco (non ancora usato, il caso normale),
      // oppure - solo dal gradino 1 in su, e al massimo una volta nella
      // settimana - una ripetizione di un secondo gia' servito. La
      // distinzione si legge da 'usati' al momento della scelta, non serve
      // taggare il candidato a monte.
      function assegnaSecondoScelto(gi, piatto) {
        const eRipetizione = usati.has(piatto.id);
        statoGiorni[gi].secondo = piatto;
        statoGiorni[gi].secondoEAvanzo = false;
        statoGiorni[gi].secondoERipetizione = eRipetizione;
        let salsaIncrementata = false;
        if (!eRipetizione) {
          usati.add(piatto.id);
          if (piatto.salsa_industriale) { usoSalse.valore++; salsaIncrementata = true; }
        } else {
          ripetizioniSecondo.valore++;
        }
        if (piatto.gruppo) usoGruppi[piatto.gruppo] = (usoGruppi[piatto.gruppo] || 0) + 1;
        return () => {
          delete statoGiorni[gi].secondo;
          delete statoGiorni[gi].secondoEAvanzo;
          delete statoGiorni[gi].secondoERipetizione;
          if (!eRipetizione) {
            usati.delete(piatto.id);
            if (salsaIncrementata) usoSalse.valore--;
          } else {
            ripetizioniSecondo.valore--;
          }
          if (piatto.gruppo) usoGruppi[piatto.gruppo]--;
        };
      }
      function assegnaProfiloGiorno(gi, profilo) {
        statoGiorni[gi].profiloGiorno = profilo;
        return () => { delete statoGiorni[gi].profiloGiorno; };
      }

      // Candidati per ciascuno slot, dato lo stato attuale del giorno.
      // paeseOk e limiteOggi sono gia' allargati (gradini 3 e 4) da chi li
      // costruisce in prossimaDecisione, quindi qui i filtri restano
      // identici a prima: e' l'ingresso che e' piu' largo, non la logica.
      function candidatiSecondo(gi, profiloGiorno, paeseGiorno, genericoOggi, paeseOk, limiteOggi) {
        const g = gi + 1;
        const gruppoRichiesto = sequenza[gi];
        const baseComune = (p) =>
          !rifiutato(p) &&
          (p.prep_min || 30) <= limiteOggi && tecnicaOk(p, g) &&
          (!p.salsa_industriale || usoSalse.valore < 1);

        const proprio = secondi.filter(p => p.profilo === profiloGiorno && paeseOk(p) && baseComune(p) && !usati.has(p.id));
        const proprioCentra = gruppoRichiesto ? proprio.filter(p => p.gruppo === gruppoRichiesto) : [];
        const proprioAltro = gruppoRichiesto ? proprio.filter(p => p.gruppo !== gruppoRichiesto) : proprio;
        const generico = paeseGiorno
          ? secondi.filter(p => p.paese === genericoOggi && baseComune(p) && !usati.has(p.id))
          : [];
        // Gradino 1, ultimo livello: una ripetizione, mai piu' di una a
        // settimana, provata solo se non c'e' altro fresco disponibile.
        const ripetuto = (opz.ripetizione && ripetizioniSecondo.valore < 1)
          ? secondi.filter(p => p.profilo === profiloGiorno && paeseOk(p) && baseComune(p) && usati.has(p.id))
          : [];
        return concatenaLivelli([proprioCentra, proprioAltro, generico, ripetuto], rng);
      }

      function candidatiPrimo(gi, profiloGiorno, paeseGiorno, genericoOggi, paeseOk, limiteOggi) {
        const g = gi + 1;
        const base = (p) =>
          !usati.has(p.id) && !rifiutato(p) &&
          (p.prep_min || 30) <= limiteOggi && tecnicaOk(p, g) &&
          (!pranzoFuori || p.trasportabile);

        const proprio = primi.filter(p => compatibile(p, profiloGiorno) && paeseOk(p) && base(p));
        const generico = paeseGiorno ? primi.filter(p => p.paese === genericoOggi && base(p)) : [];
        const neutro = primi.filter(p => (p.profilo === 'neutro' || !p.profilo || p.paese === 'mediterraneo_generico') && base(p));
        return concatenaLivelli([proprio, generico, neutro], rng);
      }

      function candidatiContorno(gi, ruolo, profiloGiorno, paeseGiorno, paeseOk, limiteOggi, piattoAbbinato, altroContorno) {
        const g = gi + 1;
        const trasportabileSeServe = ruolo === 'pranzo' ? (c) => (!pranzoFuori || c.trasportabile) : () => true;
        const base = (c) =>
          !usati.has(c.id) && !rifiutato(c) &&
          (c.prep_min || 20) <= limiteOggi && tecnicaOk(c, g) &&
          (!altroContorno || c.id !== altroContorno.id) &&
          trasportabileSeServe(c);

        const proprio = contorni.filter(c => compatibile(c, profiloGiorno) && accompagnaBene(c, piattoAbbinato) && paeseOk(c) && base(c));
        const neutroStretto = contorni.filter(c => (c.profilo === 'neutro' || !c.profilo) && paeseOk(c) && base(c));
        const neutroLargo = contorni.filter(c => (c.profilo === 'neutro' || !c.profilo || c.paese === 'mediterraneo_generico') && accompagnaBene(c, piattoAbbinato) && base(c));
        return concatenaLivelli([proprio, neutroStretto, neutroLargo], rng);
      }

      function candidatiColazione(gi, profiloGiorno, paeseOkLeggero, cappaMinuti) {
        const base = (p) => !usati.has(p.id) && (p.prep_min || 10) <= cappaMinuti && paeseOkLeggero(p);
        const proprio = colazioni.filter(p => compatibile(p, profiloGiorno) && base(p));
        const neutro = colazioni.filter(p => (p.profilo === 'neutro' || !p.profilo) && base(p));
        return concatenaLivelli([proprio, neutro], rng);
      }

      function candidatiSpuntino(gi, profiloGiorno, paeseOkLeggero, altroSpuntino, cappaMinuti) {
        const base = (p) => !usati.has(p.id) && (p.prep_min || 5) <= cappaMinuti && paeseOkLeggero(p) && (!altroSpuntino || p.id !== altroSpuntino.id);
        const proprio = spuntini.filter(p => compatibile(p, profiloGiorno) && base(p));
        const neutro = spuntini.filter(p => (p.profilo === 'neutro' || !p.profilo) && base(p));
        return concatenaLivelli([proprio, neutro], rng);
      }

      function candidatiBase(paeseOk) {
        return mescolaPesata(contorni.filter(p => p.base_amidacea && paeseOk(p) && !usati.has(p.id)), pesoCandidato, rng);
      }

      // Determina la prossima decisione necessaria per il giorno `gi`.
      // Ritorna 'COMPLETO' se il giorno non ha piu' nulla da decidere,
      // altrimenti il frame pronto da inserire in pila, o null se la
      // decisione necessaria non ha candidati (vicolo cieco).
      function prossimaDecisione(gi) {
        const g = gi + 1;
        const st = statoGiorni[gi];

        if (st.bloccatoCompleto === undefined) {
          const bloccatiOggi = bloccatiPerGiorno[g] || [];
          st.bloccatoCompleto = bloccatiOggi.some(b => b.slot === 'secondo') && bloccatiOggi.some(b => b.slot === 'primo');
          st.bloccatiOggi = bloccatiOggi;
        }
        if (st.bloccatoCompleto) return 'COMPLETO';

        if ((g === 3 || g === 6) && st.profiloGiorno === undefined) {
          const candidati = pesoOrdinato(profiliConSecondo, pr => pesoFamiglia[famigliaDi[pr]] || 1, rng);
          if (!candidati.length) return null;
          return creaFrame(g, 'profiloGiorno', candidati, (pr) => assegnaProfiloGiorno(gi, pr));
        }
        if (st.profiloGiorno === undefined) st.profiloGiorno = profiloSettimana;

        const profiloGiorno = st.profiloGiorno;
        const paeseGiorno = paesiScelti.length ? paesiScelti[(g - 1) % paesiScelti.length] : null;
        const genericoOggi = paeseGiorno ? GENERICO_DI[paeseGiorno] : null;
        // Gradino 3a: oltre al proprio generico, si accetta il pool generico
        // di un'altra macro-area SOLO se e' la stessa famiglia culinaria del
        // paese scelto (per la Germania: anche mediterraneo_generico, che e'
        // comunque Europa). Gradino 3b: qualunque macro-area (GENERICI
        // intero) - quello che prima era un unico gradino 3, ora il secondo
        // dei due (Fase 3 Passo C bis, C9).
        const famigliaOggi = genericoOggi ? FAMIGLIA_DI_GENERICO[genericoOggi] : null;
        const paeseOk = (p) => !paeseGiorno
          || p.paese === paeseGiorno
          || (genericoOggi && p.paese === genericoOggi)
          || (opz.genericoStessaFamiglia && famigliaOggi && FAMIGLIA_DI_GENERICO[p.paese] === famigliaOggi)
          || (opz.genericoQualunqueFamiglia && GENERICI.includes(p.paese));
        const paeseOkLeggero = (p) => paeseOk(p) || p.paese === 'mediterraneo_generico';
        const limiteBase = ferialeG(g) ? limiteFeriale : Math.max(limiteFeriale, 75);
        // Gradino 4: +10 minuti. Resta minimo perche' e' comunque solo un
        // livello IN PIU' nella lista di candidati di ogni slot (concatenaLivelli
        // non lo aggiunge come filtro sostitutivo ma come coda), quindi entra
        // in gioco solo quando i piatti entro il tempo normale non bastano.
        const limiteOggi = opz.tempoAllargato ? limiteBase + 10 : limiteBase;
        const cappaColazione = opz.tempoAllargato ? 25 : 15;
        const cappaSpuntino = opz.tempoAllargato ? 20 : 10;

        st.paeseGiorno = paeseGiorno;
        st.genericoOggi = genericoOggi;
        st.limiteBase = limiteBase;

        if (st.secondo === undefined && !cucinaOggi(g)) {
          for (let k = gi - 1; k >= 0; k--) {
            const s = statoGiorni[k];
            if (s.secondo && !s.secondoEAvanzo) { st.secondo = s.secondo; st.secondoEAvanzo = true; break; }
          }
        }

        if (st.secondo === undefined) {
          const candidati = candidatiSecondo(gi, profiloGiorno, paeseGiorno, genericoOggi, paeseOk, limiteOggi);
          if (!candidati.length) return null;
          return creaFrame(g, 'secondo', candidati, (p) => assegnaSecondoScelto(gi, p));
        }

        const pronti = [];
        if (st.primo === undefined) pronti.push(['primo', () => candidatiPrimo(gi, profiloGiorno, paeseGiorno, genericoOggi, paeseOk, limiteOggi)]);
        if (st.contornoCena === undefined) pronti.push(['contornoCena', () => candidatiContorno(gi, 'cena', profiloGiorno, paeseGiorno, paeseOk, limiteOggi, st.secondo, st.contornoPranzo)]);
        if (st.primo !== undefined && st.contornoPranzo === undefined) pronti.push(['contornoPranzo', () => candidatiContorno(gi, 'pranzo', profiloGiorno, paeseGiorno, paeseOk, limiteOggi, st.primo, st.contornoCena)]);
        if (st.colazione === undefined) pronti.push(['colazione', () => candidatiColazione(gi, profiloGiorno, paeseOkLeggero, cappaColazione)]);
        if (st.spuntino === undefined) pronti.push(['spuntino', () => candidatiSpuntino(gi, profiloGiorno, paeseOkLeggero, st.spuntino2, cappaSpuntino)]);
        if (st.spuntino2 === undefined) pronti.push(['spuntino2', () => candidatiSpuntino(gi, profiloGiorno, paeseOkLeggero, st.spuntino, cappaSpuntino)]);
        if (st.contornoCena !== undefined && st.base === undefined) {
          const cenaHaAmido = st.secondo.ha_amido || (st.contornoCena && st.contornoCena.ha_amido);
          if (!cenaHaAmido) pronti.push(['base', () => candidatiBase(paeseOk)]);
          else st.base = null;
        }

        if (!pronti.length) return 'COMPLETO';

        let scelto = null;
        for (const [nomeSlot, calcola] of pronti) {
          const candidati = calcola();
          if (!candidati.length) return null;
          if (!scelto || candidati.length < scelto.candidati.length) scelto = { nomeSlot, candidati };
        }

        const applicaPerSlot = {
          primo: (p) => assegnaSlot(gi, 'primo', p),
          contornoCena: (p) => assegnaSlot(gi, 'contornoCena', p),
          contornoPranzo: (p) => assegnaSlot(gi, 'contornoPranzo', p),
          colazione: (p) => assegnaSlot(gi, 'colazione', p),
          spuntino: (p) => assegnaSlot(gi, 'spuntino', p),
          spuntino2: (p) => assegnaSlot(gi, 'spuntino2', p),
          base: (p) => assegnaSlot(gi, 'base', p),
        };
        return creaFrame(g, scelto.nomeSlot, scelto.candidati, applicaPerSlot[scelto.nomeSlot]);
      }

      // 'tetto' e 'reale' sono due fallimenti diversi (C16): il primo dice
      // solo che la ricerca si e' arresa al limite di passi, non che lo
      // spazio sia stato esplorato per intero (la pila aveva ancora
      // candidati non provati); il secondo dice che la pila si e' svuotata
      // da sola, nessuna alternativa restava da tentare per questo profilo.
      function avanzaFinDove(giIniziale) {
        let gi = giIniziale;
        while (gi < 7) {
          if (passiUsati.valore > MAX_PASSI) return { esaurito: true, motivo: 'tetto' };
          const decisione = prossimaDecisione(gi);
          if (decisione === 'COMPLETO') { gi++; continue; }
          if (decisione === null) {
            const tornaA = indietro();
            if (tornaA < 0) return { esaurito: true, motivo: 'reale' };
            gi = tornaA;
            continue;
          }
          pila.push(decisione);
          entraFrame(decisione);
        }
        return { esaurito: false };
      }

      const primoTentativo = avanzaFinDove(0);
      if (primoTentativo.esaurito) {
        diagnosticaProfili.push(`${profiloSettimana}: ${primoTentativo.motivo === 'tetto' ? 'tetto passi raggiunto' : 'esaurimento reale'} (passi: ${passiUsati.valore})`);
        continue profiliEsterni;
      }

      // Prima del gradino 2: le quote minime sui gruppi proteici restano un
      // vincolo duro verificato a fine settimana (dipende da tutti i giorni
      // insieme), e un vicolo cieco come un altro innesca backtracking. Dal
      // gradino 2 in su si accetta il risultato comunque: lo scostamento
      // viene registrato come concessione, non forzato a sparire.
      if (!opz.quotaTollerante) {
        while (true) {
          let quoteRispettate = true;
          for (const [gruppo, q] of Object.entries(QUOTE)) {
            if (!gruppiDelProfilo.has(gruppo)) continue;
            if ((usoGruppi[gruppo] || 0) < q.min) { quoteRispettate = false; break; }
          }
          if (quoteRispettate) break;

          const tornaA = indietro();
          if (tornaA < 0) { diagnosticaProfili.push(`${profiloSettimana}: quote proteiche mai soddisfatte (esaurimento reale)`); continue profiliEsterni; }
          const ripreso = avanzaFinDove(tornaA);
          if (ripreso.esaurito) {
            diagnosticaProfili.push(`${profiloSettimana}: ${ripreso.motivo === 'tetto' ? 'tetto passi raggiunto' : 'esaurimento reale'} durante la ricerca quote (passi: ${passiUsati.valore})`);
            continue profiliEsterni;
          }
        }
      }

      // ---- Successo a questo gradino: ricostruisce la settimana e rileva le concessioni usate ----
      const settimana = [];
      const concessioni = [];

      for (let k = 0; k < 7; k++) {
        const g = k + 1;
        const st = statoGiorni[k];
        if (st.bloccatoCompleto) {
          settimana.push({ giorno: g, profilo: st.profiloGiorno ?? profiloSettimana, bloccati: st.bloccatiOggi, conforme: true, pasti: [] });
          continue;
        }
        const pasti = [
          st.colazione      && { meal: 'colazione', slot: 'colazione', piatto: st.colazione },
          st.primo          && { meal: 'pranzo',    slot: 'primo',     piatto: st.primo },
          st.contornoPranzo && { meal: 'pranzo',    slot: 'contorno',  piatto: st.contornoPranzo },
          st.spuntino       && { meal: 'spuntino',  slot: 'spuntino',  piatto: st.spuntino },
          st.secondo        && { meal: 'cena',      slot: 'secondo',   piatto: st.secondo, avanzi: st.secondoEAvanzo },
          st.contornoCena   && { meal: 'cena',      slot: 'contorno',  piatto: st.contornoCena },
          st.base           && { meal: 'cena',      slot: 'contorno',  piatto: st.base },
          st.spuntino2      && { meal: 'spuntino',  slot: 'spuntino',  piatto: st.spuntino2 },
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

        settimana.push({ giorno: g, profilo: st.profiloGiorno, pasti, conforme });

        // C5: deviazione dalla sequenza proteica pianificata - sempre
        // registrata, a qualunque gradino, perche' non e' un allentamento
        // della scala, e' un segnale di quanto il catalogo sia magro li'.
        if (st.secondo && !st.secondoEAvanzo && !st.secondoERipetizione) {
          const gruppoRichiesto = sequenza[k];
          if (gruppoRichiesto && st.secondo.gruppo !== gruppoRichiesto) {
            concessioni.push({ gradino: null, tipo: 'deviazione_sequenza', giorno: g, slot: 'secondo', vincolo: 'gruppo_proteico_pianificato', prima: gruppoRichiesto, dopo: st.secondo.gruppo || null });
          }
        }

        // Gradino 1: ripetizione del secondo.
        if (st.secondoERipetizione) {
          concessioni.push({ gradino: '1', tipo: 'allentamento', giorno: g, slot: 'secondo', vincolo: 'ripetizione_piatto', prima: 'nessuna ripetizione', dopo: st.secondo.name || st.secondo.id });
        }

        // Gradino 3a: pool generico di un'altra famiglia culinaria ma STESSA
        // macro-area (es. Germania -> mediterraneo_generico, ancora Europa).
        // Gradino 3b: davvero un'altra macro-area (es. Germania -> asiatico).
        for (const [slot, piatto] of [['secondo', st.secondo], ['primo', st.primo], ['contornoCena', st.contornoCena], ['contornoPranzo', st.contornoPranzo]]) {
          if (!piatto || (slot === 'secondo' && (st.secondoEAvanzo || st.secondoERipetizione))) continue;
          if (st.paeseGiorno && piatto.paese !== st.paeseGiorno && piatto.paese !== st.genericoOggi && GENERICI.includes(piatto.paese)) {
            const famigliaPropria = st.genericoOggi ? FAMIGLIA_DI_GENERICO[st.genericoOggi] : null;
            const stessaFamiglia = famigliaPropria && FAMIGLIA_DI_GENERICO[piatto.paese] === famigliaPropria;
            concessioni.push({
              gradino: stessaFamiglia ? '3a' : '3b',
              tipo: 'allentamento', giorno: g, slot,
              vincolo: stessaFamiglia ? 'pool_generico_stessa_famiglia' : 'pool_generico_famiglia_diversa',
              prima: st.genericoOggi, dopo: piatto.paese,
            });
          }
        }

        // Gradino 4: tetto dei minuti allentato.
        for (const [slot, piatto, cappa] of [
          ['secondo', st.secondo, st.limiteBase], ['primo', st.primo, st.limiteBase],
          ['contornoCena', st.contornoCena, st.limiteBase], ['contornoPranzo', st.contornoPranzo, st.limiteBase],
          ['colazione', st.colazione, 15], ['spuntino', st.spuntino, 10], ['spuntino2', st.spuntino2, 10],
        ]) {
          if (!piatto || (slot === 'secondo' && (st.secondoEAvanzo || st.secondoERipetizione))) continue;
          const minuti = piatto.prep_min || 0;
          if (minuti > cappa) {
            concessioni.push({ gradino: '4', tipo: 'allentamento', giorno: g, slot, vincolo: 'tetto_minuti', prima: cappa, dopo: minuti });
          }
        }

        // Gradino 5: voto salute sotto la soglia obiettivo di 7.
        for (const [slot, piatto] of Object.entries({ secondo: st.secondo, primo: st.primo, contornoCena: st.contornoCena, contornoPranzo: st.contornoPranzo, colazione: st.colazione, spuntino: st.spuntino, spuntino2: st.spuntino2, base: st.base })) {
          if (!piatto) continue;
          const voto = piatto.health_score;
          if (voto != null && voto < 7) {
            concessioni.push({ gradino: '5', tipo: 'allentamento', giorno: g, slot, vincolo: 'voto_salute_minimo', prima: 7, dopo: voto });
          }
        }
      }

      // Gradino 2: quote minime non raggiunte (una riga per gruppo, non per giorno).
      for (const [gruppo, q] of Object.entries(QUOTE)) {
        if (!gruppiDelProfilo.has(gruppo)) continue;
        const ottenuto = usoGruppi[gruppo] || 0;
        if (ottenuto < q.min) {
          concessioni.push({ gradino: '2', tipo: 'allentamento', giorno: null, slot: null, vincolo: 'quota_minima_gruppo_proteico', prima: q.min, dopo: ottenuto, gruppo });
        }
      }

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

      return { ok: true, settimana, punteggio, concessioni, mediaSalute };
    }

    return { ok: false, diagnosticaProfili };
  }

  // ---- La scala: si sale di un gradino solo dopo aver esaurito onestamente quello precedente ----
  // Ogni gradino eredita gli allentamenti di quelli precedenti (si sale,
  // non si passa da uno all'altro): 3a e 3b restano due gradini distinti
  // (Passo C bis, C9) perche' il danno culturale di un pool generico della
  // STESSA famiglia (3a) e' nullo, quello di un'ALTRA macro-area (3b) no.
  const GRADINI = [
    { gradino: '0',  soglia: 7,   opz: {} },
    { gradino: '1',  soglia: 7,   opz: { ripetizione: true } },
    { gradino: '2',  soglia: 7,   opz: { ripetizione: true, quotaTollerante: true } },
    { gradino: '3a', soglia: 7,   opz: { ripetizione: true, quotaTollerante: true, genericoStessaFamiglia: true } },
    { gradino: '3b', soglia: 7,   opz: { ripetizione: true, quotaTollerante: true, genericoStessaFamiglia: true, genericoQualunqueFamiglia: true } },
    { gradino: '4',  soglia: 7,   opz: { ripetizione: true, quotaTollerante: true, genericoStessaFamiglia: true, genericoQualunqueFamiglia: true, tempoAllargato: true } },
    { gradino: '5',  soglia: 6.5, opz: { ripetizione: true, quotaTollerante: true, genericoStessaFamiglia: true, genericoQualunqueFamiglia: true, tempoAllargato: true } },
    { gradino: '5',  soglia: 6,   opz: { ripetizione: true, quotaTollerante: true, genericoStessaFamiglia: true, genericoQualunqueFamiglia: true, tempoAllargato: true } },
  ];

  let esito = null;
  let gradinoRaggiunto = null;
  const diagnosticaCompleta = [];

  for (const passo of GRADINI) {
    const r = provaGradino(passo.opz, passo.soglia);
    if (r.ok) {
      console.log(`[scala] gradino ${passo.gradino} (soglia ${passo.soglia}): RIUSCITO`);
      esito = r; gradinoRaggiunto = passo.gradino; break;
    }
    console.log(`[scala] gradino ${passo.gradino} (soglia ${passo.soglia}): esaurito per tutti i profili - ${r.diagnosticaProfili.join(' | ') || 'nessun profilo'}`);
    diagnosticaCompleta.push(`gradino ${passo.gradino} (soglia ${passo.soglia}): ${r.diagnosticaProfili.join(', ') || 'nessun profilo'}`);
  }

  if (!esito) {
    // Residuo ammesso da C4: se anche al gradino piu' permissivo non esiste
    // NESSUN secondo compatibile con dieta/allergie per il paese scelto, il
    // messaggio dice esattamente questo, non una frase generica - e' l'unico
    // fallimento che dieta e allergie da sole possono causare, e la scala non
    // ha ne' deve avere un gradino che le tocchi.
    const paeseUnico = paesiScelti[0] || null;
    const genericoUnico = paeseUnico ? GENERICO_DI[paeseUnico] : null;
    const nessunSecondoPerPaese = paeseUnico
      ? !piatti.some(p => p.meal_slot === 'secondo' && (p.paese === paeseUnico || p.paese === genericoUnico))
      : false;
    if (nessunSecondoPerPaese) {
      throw new Error(
        `Nessun secondo compatibile con la dieta dichiarata e' disponibile per ${paeseUnico} (o il suo generico ${genericoUnico}). ` +
        `Manca il catalogo per questa combinazione, non e' un limite della ricerca.`
      );
    }
    throw new Error(
      `Nessuna settimana completabile nonostante la scala di allentamento fino al gradino 5. ` +
      diagnosticaCompleta.join(' || ')
    );
  }

  const { settimana: migliore, punteggio: migliorPunteggio, concessioni } = esito;

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
      corpus_version: CORPUS_VERSION,
      seed,
      gradino_raggiunto: gradinoRaggiunto,
      concessioni,
      dieta,
      paesi: paesiScelti,
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

  return { plan_id: piano.id, giorni_conformi: Math.floor(migliorPunteggio), seed, gradino: gradinoRaggiunto, concessioni };
}

module.exports = { generaESalva, caricaPiatti, gruppoDa, GRUPPI, QUOTE, trovaCategoria, normalizza, CONTENUTE_IN };
