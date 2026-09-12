// Dati per la schermata "You": ritratto, andamento della CO2, paesi cucinati.
// Le tre sezioni sono vantaggi Pro (lib/piano.js lato app): il ritratto ha
// una frase ridotta per tutti, carbonio e mappa restano null se non-Pro.

const PAESI = {
  italia:      { nome: 'Italy',          aggettivo: 'Italian',     continente: 'Europe' },
  francia:     { nome: 'France',         aggettivo: 'French',      continente: 'Europe' },
  grecia:      { nome: 'Greece',         aggettivo: 'Greek',       continente: 'Europe' },
  spagna:      { nome: 'Spain',          aggettivo: 'Spanish',     continente: 'Europe' },
  portogallo:  { nome: 'Portugal',       aggettivo: 'Portuguese',  continente: 'Europe' },
  germania:    { nome: 'Germany',        aggettivo: 'German',      continente: 'Europe' },
  regno_unito: { nome: 'United Kingdom', aggettivo: 'British',     continente: 'Europe' },
  stati_uniti: { nome: 'United States',  aggettivo: 'American',    continente: 'North America' },
  messico:     { nome: 'Mexico',         aggettivo: 'Mexican',     continente: 'North America' },
  argentina:   { nome: 'Argentina',      aggettivo: 'Argentinian', continente: 'South America' },
  brasile:     { nome: 'Brazil',         aggettivo: 'Brazilian',   continente: 'South America' },
  cina:        { nome: 'China',          aggettivo: 'Chinese',     continente: 'Asia' },
  giappone:    { nome: 'Japan',          aggettivo: 'Japanese',    continente: 'Asia' },
  corea:       { nome: 'South Korea',    aggettivo: 'Korean',      continente: 'Asia' },
  vietnam:     { nome: 'Vietnam',        aggettivo: 'Vietnamese',  continente: 'Asia' },
  thailandia:  { nome: 'Thailand',       aggettivo: 'Thai',        continente: 'Asia' },
  australia:   { nome: 'Australia',      aggettivo: 'Australian',  continente: 'Oceania' },
};

// Stessa lista di spesa.js (SETTIMANA_TIPICA/PROTEICHE): le categorie la cui
// quantita' settimanale sposta davvero la CO2 e ha senso raccontare.
const PROTEICHE = ['manzo', 'agnello', 'maiale', 'pollame', 'pesce_selvatico',
  'pesce_allevato', 'gamberi', 'formaggio', 'uova', 'legumi', 'tofu'];

const NOME_CATEGORIA = {
  manzo: 'beef', agnello: 'lamb', maiale: 'pork', pollame: 'chicken',
  pesce_selvatico: 'wild fish', pesce_allevato: 'farmed fish', gamberi: 'shrimp',
  formaggio: 'cheese', uova: 'eggs', legumi: 'legumes', tofu: 'tofu',
};

const SETTIMANA_TIPICA = {
  manzo: { quota: 0.20, co2: 60.0 }, maiale: { quota: 0.22, co2: 7.2 },
  pollame: { quota: 0.28, co2: 6.1 }, pesce_selvatico: { quota: 0.10, co2: 3.5 },
  pesce_allevato: { quota: 0.06, co2: 5.1 }, formaggio: { quota: 0.08, co2: 21.2 },
  uova: { quota: 0.04, co2: 4.7 }, legumi: { quota: 0.02, co2: 0.9 },
};

// Rigenerare la settimana crea un nuovo piano senza cancellare i tentativi
// precedenti (/genera-piano non elimina nulla): per le statistiche conta solo
// l'ultima versione generata di ogni settimana di calendario, altrimenti un
// utente che rigenera piu' volte la stessa settimana la fa contare piu' volte.
async function pianiCorrentiPerSettimana(supabase, userId) {
  const tutti = await paginaTutto((da, a) => supabase
    .from('plans')
    .select('id, week_start, generated_at')
    .eq('user_id', userId)
    .order('id')
    .range(da, a));

  const ultimoPerSettimana = new Map();
  for (const p of tutti) {
    const attuale = ultimoPerSettimana.get(p.week_start);
    if (!attuale || p.generated_at > attuale.generated_at) ultimoPerSettimana.set(p.week_start, p);
  }
  return [...ultimoPerSettimana.values()].sort((a, b) => b.week_start.localeCompare(a.week_start));
}

function co2Tipica(grammiProteici) {
  let co2 = 0;
  for (const v of Object.values(SETTIMANA_TIPICA)) co2 += (grammiProteici / 1000) * v.quota * v.co2;
  return co2;
}

// PostgREST impone un tetto di righe per risposta (di default 1000)
// indipendente da .limit(): con 2091 piatti nel catalogo (e la cronologia
// di un utente che cresce nel tempo) va paginato con .range(), altrimenti
// le righe oltre la millesima spariscono in silenzio (visto gia' in genera.js).
async function paginaTutto(costruisciQuery) {
  const righe = [];
  const PAGINA = 1000;
  for (let offset = 0; ; offset += PAGINA) {
    const { data: blocco, error } = await costruisciQuery(offset, offset + PAGINA - 1);
    if (error) throw new Error(error.message);
    righe.push(...(blocco || []));
    if (!blocco || blocco.length < PAGINA) break;
  }
  return righe;
}

// CO2 di un piano: stessa logica di spesa.js/listaSpesa (categoria_impatto,
// scalata sulla porzione reale), duplicata qui apposta per non toccare un
// modulo gia' in produzione. Ritorna anche i grammi per categoria, servono
// sia al confronto "settimana tipica" sia a trovare la mossa che ha spostato
// di piu' la settimana.
async function co2DiPiano(supabase, planId, co2Di) {
  const righe = await paginaTutto((da, a) => supabase
    .from('plan_items')
    .select('id, dish_id, portion_g, stato, avanzi')
    .eq('plan_id', planId)
    .order('id')
    .range(da, a));
  const attive = righe.filter(r => r.stato !== 'saltato' && !r.avanzi);
  if (!attive.length) return { totale: 0, perCategoriaKg: {}, grammiProteici: 0 };

  const dishIds = [...new Set(attive.map(r => r.dish_id))];
  const ing = await paginaTutto((da, a) => supabase
    .from('dish_ingredients')
    .select('dish_id, grams, foods (categoria_impatto)')
    .in('dish_id', dishIds)
    .order('dish_id').order('food_id')
    .range(da, a));

  const baseDi = {};
  for (const r of ing || []) baseDi[r.dish_id] = (baseDi[r.dish_id] || 0) + Number(r.grams || 0);

  let totale = 0;
  let grammiProteici = 0;
  const perCategoriaKg = {};
  for (const riga of attive) {
    const base = baseDi[riga.dish_id] || 0;
    const scala = base > 0 ? Number(riga.portion_g || base) / base : 1;
    for (const r of (ing || []).filter(x => x.dish_id === riga.dish_id)) {
      const cat = r.foods?.categoria_impatto;
      const grammi = Number(r.grams || 0) * scala;
      if (PROTEICHE.includes(cat)) grammiProteici += grammi;
      if (!cat || !co2Di[cat]) continue;
      const kg = co2Di[cat] * (grammi / 1000);
      totale += kg;
      perCategoriaKg[cat] = (perCategoriaKg[cat] || 0) + kg;
    }
  }
  return { totale, perCategoriaKg, grammiProteici };
}

function frequenzaSettimanale(n) {
  if (n <= 0) return null;
  if (n === 1) return 'once a week';
  if (n === 2) return 'twice a week';
  const parole = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
  return `${parole[Math.min(n, 7)]} times a week`;
}

function paroleSettimane(n) {
  const parole = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];
  return n < parole.length ? parole[n] : String(n);
}

// Ogni clausola e' { prefisso, valore, colore }: prefisso e connettivi restano
// testo normale, solo il valore (nome proprio o numero) prende colore - cosi'
// il frontend colora "le parti salienti" senza dover indovinare quali siano.
// Da 1 a 3 clausole (cucina/pesce/co2), unite in prosa naturale: "A.",
// "A e B.", "A, B e C." - l'unico punto dinamico e' quali esistono.
function unisciParti(clausole) {
  const c = clausole.filter(Boolean);
  if (!c.length) return null;
  const parti = [{ testo: 'You ', colore: null }];
  c.forEach((cl, i) => {
    parti.push({ testo: cl.prefisso, colore: null });
    parti.push({ testo: cl.valore, colore: cl.colore });
    if (i < c.length - 2) parti.push({ testo: ', ', colore: null });
    else if (i === c.length - 2) parti.push({ testo: c.length === 2 ? ' and ' : ', and ', colore: null });
  });
  parti.push({ testo: '.', colore: null });
  return parti;
}

async function ritratto(supabase, userId, isPro) {
  const piani = await pianiCorrentiPerSettimana(supabase, userId);
  if (!piani.length) return { parti: null, parti2: null };

  const planIds = piani.map(p => p.id);
  const righe = await paginaTutto((da, a) => supabase
    .from('plan_items')
    .select('id, plan_id, dish_id, stato, avanzi')
    .in('plan_id', planIds)
    .order('id')
    .range(da, a));
  const attive = righe.filter(r => r.stato !== 'saltato' && !r.avanzi);
  if (!attive.length) return { parti: null, parti2: null };

  const dishIds = [...new Set(attive.map(r => r.dish_id))];
  const piatti = await paginaTutto((da, a) => supabase
    .from('dishes').select('id, paese').in('id', dishIds).order('id').range(da, a));
  const paeseDi = {};
  for (const p of piatti || []) paeseDi[p.id] = p.paese;

  // clausola 1: le cucine piu' cucinate (solo paesi veri, non i generici)
  const conteggioPaese = {};
  for (const r of attive) {
    const paese = paeseDi[r.dish_id];
    if (!paese || paese.endsWith('_generico') || !PAESI[paese]) continue;
    conteggioPaese[paese] = (conteggioPaese[paese] || 0) + 1;
  }
  const topPaesi = Object.entries(conteggioPaese).sort((a, b) => b[1] - a[1]).slice(0, 2);
  const totalePaesi = Object.values(conteggioPaese).reduce((s, n) => s + n, 0);
  const clausolaCucina = totalePaesi >= 3
    ? { prefisso: 'cook mostly ', valore: topPaesi.map(([p]) => PAESI[p].aggettivo).join(' and '), colore: 'verde' }
    : null;

  if (!isPro) {
    return { parti: unisciParti([clausolaCucina]), parti2: null };
  }

  // clausola 2: quante volte a settimana il pesce e' protagonista (non traccia)
  const ingPesce = await paginaTutto((da, a) => supabase
    .from('dish_ingredients')
    .select('dish_id, grams, foods (categoria_impatto)')
    .in('dish_id', dishIds)
    .gte('grams', 80)
    .order('dish_id').order('food_id')
    .range(da, a));
  const piattiPesce = new Set(
    ingPesce
      .filter(r => ['pesce_selvatico', 'pesce_allevato'].includes(r.foods?.categoria_impatto))
      .map(r => r.dish_id)
  );
  const occorrenzePesce = attive.filter(r => piattiPesce.has(r.dish_id)).length;
  const settimaneAnalizzate = piani.length;
  const frequenzaPesce = Math.round(occorrenzePesce / settimaneAnalizzate);
  const clausolaPesce = frequenzaSettimanale(frequenzaPesce)
    ? { prefisso: 'eat fish ', valore: frequenzaSettimanale(frequenzaPesce), colore: 'ambra' }
    : null;

  // clausola 3: quanto inquina la spesa dell'ultimo piano vs una settimana tipica
  const { data: categorie } = await supabase.from('impatto_categorie').select('categoria, co2_kg_per_kg');
  const co2Di = {};
  for (const c of categorie || []) co2Di[c.categoria] = Number(c.co2_kg_per_kg);

  const ultimoPiano = piani[0];
  const { totale: co2Totale, grammiProteici } = await co2DiPiano(supabase, ultimoPiano.id, co2Di);
  const co2Media = co2Tipica(grammiProteici);
  let clausolaCo2 = null;
  if (co2Totale > 0 && co2Media > 0) {
    const diff = Math.round((1 - co2Totale / co2Media) * 100);
    if (diff > 0) {
      clausolaCo2 = { prefisso: 'your shopping pollutes ', valore: `${diff}% less than average`, colore: 'ambra' };
    } else if (diff < 0) {
      clausolaCo2 = { prefisso: 'your shopping pollutes ', valore: `${Math.abs(diff)}% more than average`, colore: 'ambra' };
    }
  }

  const parti = unisciParti([clausolaCucina, clausolaPesce, clausolaCo2]);

  // seconda frase: streak senza ripetizioni, altrimenti varieta' se notevole
  const finestraSettimane = Math.min(6, settimaneAnalizzate);
  const planIdsFinestra = new Set(piani.slice(0, finestraSettimane).map(p => p.id));
  const dishIdsFinestra = attive.filter(r => planIdsFinestra.has(r.plan_id)).map(r => r.dish_id);
  let parti2 = null;
  if (finestraSettimane >= 2 && dishIdsFinestra.length) {
    const distinti = new Set(dishIdsFinestra).size;
    if (distinti === dishIdsFinestra.length) {
      parti2 = [
        { testo: `In ${paroleSettimane(finestraSettimane)} weeks `, colore: null },
        { testo: "you haven't repeated a single dish", colore: 'verde' },
        { testo: '.', colore: null },
      ];
    } else if (distinti / dishIdsFinestra.length >= 0.7) {
      parti2 = [
        { testo: "You've cooked ", colore: null },
        { testo: `${distinti} different dishes`, colore: 'verde' },
        { testo: ` in the last ${paroleSettimane(finestraSettimane)} weeks.`, colore: null },
      ];
    }
  }

  return { parti, parti2 };
}

async function carbonioSettimanale(supabase, userId) {
  const piani = (await pianiCorrentiPerSettimana(supabase, userId)).slice(0, 6);
  if (piani.length < 2) return null;

  const { data: categorie } = await supabase.from('impatto_categorie').select('categoria, co2_kg_per_kg');
  const co2Di = {};
  for (const c of categorie || []) co2Di[c.categoria] = Number(c.co2_kg_per_kg);

  const ordinati = [...piani].reverse(); // dalla piu' vecchia alla piu' recente
  const conCo2 = [];
  for (const p of ordinati) {
    const r = await co2DiPiano(supabase, p.id, co2Di);
    conCo2.push({ inizio: p.week_start, kg: Math.round(r.totale * 10) / 10, perCategoriaKg: r.perCategoriaKg });
  }

  const settimane = conCo2.map(w => ({ inizio: w.inizio, kg: w.kg }));
  const media = Math.round((settimane.reduce((s, w) => s + w.kg, 0) / settimane.length) * 10) / 10;

  const corrente = conCo2[conCo2.length - 1];
  const precedente = conCo2[conCo2.length - 2];
  let mossa = null;
  let peggiorDelta = 0;
  let peggiorCat = null;
  for (const cat of PROTEICHE) {
    const delta = (corrente.perCategoriaKg[cat] || 0) - (precedente.perCategoriaKg[cat] || 0);
    if (delta < peggiorDelta) { peggiorDelta = delta; peggiorCat = cat; }
  }
  if (peggiorCat) {
    mossa = { testo: `Less ${NOME_CATEGORIA[peggiorCat]}`, delta_kg: Math.round(peggiorDelta * 10) / 10 };
  }

  return { settimane, media, mossa };
}

async function mappaPaesi(supabase, userId) {
  // Il catalogo, non i 17 paesi che sappiamo riconoscere, decide il
  // denominatore: una cucina "conta" solo se ha abbastanza piatti da
  // costruirci davvero delle settimane, e i generici (rete di sicurezza,
  // non una scelta dell'utente) non contano come cucine proprie.
  const SOGLIA_CUCINA = 40;
  const catalogo = await paginaTutto((da, a) => supabase.from('dishes').select('id, paese').order('id').range(da, a));
  const conteggioCatalogo = {};
  for (const d of catalogo) conteggioCatalogo[d.paese] = (conteggioCatalogo[d.paese] || 0) + 1;
  const totale = Object.keys(conteggioCatalogo)
    .filter(p => !p.endsWith('_generico') && conteggioCatalogo[p] >= SOGLIA_CUCINA)
    .length;

  const piani = await pianiCorrentiPerSettimana(supabase, userId);
  if (!piani.length) return { paesi: [], continenti: 0, suggerimento: null, totale };
  const planIds = piani.map(p => p.id);

  const righe = await paginaTutto((da, a) => supabase
    .from('plan_items')
    .select('id, dish_id, stato, avanzi')
    .in('plan_id', planIds)
    .order('id')
    .range(da, a));
  const attive = righe.filter(r => r.stato !== 'saltato' && !r.avanzi);
  const dishIds = [...new Set(attive.map(r => r.dish_id))];
  const piatti = await paginaTutto((da, a) => supabase
    .from('dishes').select('id, paese').in('id', dishIds).order('id').range(da, a));
  const paeseDi = {};
  for (const p of piatti || []) paeseDi[p.id] = p.paese;

  const conteggio = {};
  for (const r of attive) {
    const paese = paeseDi[r.dish_id];
    if (!paese || !PAESI[paese]) continue;
    conteggio[paese] = (conteggio[paese] || 0) + 1;
  }

  const paesi = Object.entries(conteggio).map(([paese, piatti]) => ({
    paese, nome: PAESI[paese].nome, continente: PAESI[paese].continente, piatti,
  }));
  const continenti = new Set(paesi.map(p => p.continente)).size;

  // suggerimento: un paese non ancora cucinato con un catalogo abbastanza
  // ricco (almeno 60 piatti) da valere la pena provarlo davvero.
  const cucinati = new Set(Object.keys(conteggio));
  const candidati = Object.keys(PAESI)
    .filter(p => !cucinati.has(p) && (conteggioCatalogo[p] || 0) >= 60)
    .sort((a, b) => (conteggioCatalogo[b] || 0) - (conteggioCatalogo[a] || 0));

  const suggerimento = candidati.length
    ? { paese: candidati[0], nome: PAESI[candidati[0]].nome }
    : null;

  return { paesi, continenti, suggerimento, totale };
}

module.exports = { ritratto, carbonioSettimanale, mappaPaesi, PAESI };
