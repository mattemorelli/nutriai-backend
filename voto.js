// Calcola il voto A-F di un alimento o prodotto, componente per componente.

// Da kg CO2e per kg a punti 0-100 (scala logaritmica: sotto 1 kg è ottimo,
// sopra 20 kg è pessimo, e le differenze contano di più in basso).
function puntiCarbonio(co2) {
  if (co2 <= 0.5) return 100;
  if (co2 >= 60) return 0;
  const p = 100 - (Math.log10(co2 / 0.5) / Math.log10(120)) * 100;
  return Math.max(0, Math.min(100, p));
}

const ORDINE_CONFIDENZA = ['categoria', 'stimato', 'dichiarato', 'verificato'];

function lettera(punteggio) {
  if (punteggio >= 80) return 'A';
  if (punteggio >= 65) return 'B';
  if (punteggio >= 50) return 'C';
  if (punteggio >= 35) return 'D';
  if (punteggio >= 20) return 'E';
  return 'F';
}

function prodottoTag(p = {}) {
  return [...(p.categories_tags || []), ...(p.origins ? [p.origins] : [])]
    .join(' ').toLowerCase();
}

// Quanto un modificatore pesa sul voto finale. Alzalo per allargare la forbice
// fra il prodotto peggiore e il migliore della stessa categoria.
const FATTORE = 5;

function calcolaVoto({ base, pesi, modificatori = [] }) {
  const dettaglio = [];
  let deltaPesato = 0;
  let pesoTotale = 0;
  let confidenzaVoto = 'categoria';

  for (const p of pesi) {
    const nome = p.componente;
    const miei = modificatori.filter(x => x.componente === nome);

    let delta = 0;
    let conf = 'categoria';
    const applicati = [];

    for (const m of miei) {
      delta += Number(m.punti);
      applicati.push({
        codice: m.codice,
        punti: Number(m.punti),
        descrizione: m.descrizione,
        fonte: m.fonte,
      });
      if (ORDINE_CONFIDENZA.indexOf(m.confidenza) > ORDINE_CONFIDENZA.indexOf(conf)) {
        conf = m.confidenza;
      }
    }

    deltaPesato += delta * Number(p.peso);
    pesoTotale += Number(p.peso);

    // La confidenza del voto è quella del dato più forte che lo ha spostato:
    // se nessun modificatore si applica, il voto resta di categoria.
    if (ORDINE_CONFIDENZA.indexOf(conf) > ORDINE_CONFIDENZA.indexOf(confidenzaVoto)) {
      confidenzaVoto = conf;
    }

    dettaglio.push({
      componente: nome,
      delta,
      peso: Number(p.peso),
      confidenza: conf,
      modificatori: applicati,
    });
  }

  const spostamento = pesoTotale > 0 ? (deltaPesato / pesoTotale) * FATTORE : 0;
  const finale = Math.max(0, Math.min(100, 50 + spostamento));

  return {
    voto: lettera(finale),
    punteggio: Math.round(finale),
    confidenza: confidenzaVoto,
    // contesto: quanto pesa la categoria in assoluto, per non far sembrare
    // "ottimo" un prodotto che resta comunque ad alto impatto
    categoria: base.categoria,
    impatto_categoria: {
      co2_kg_per_kg: Number(base.co2_kg_per_kg),
      punti_assoluti: Math.round(puntiCarbonio(Number(base.co2_kg_per_kg))),
      nota: base.nota,
    },
    fonte: base.fonte,
    dettaglio,
  };
}

// Carica base, pesi e modificatori dal database e restituisce il voto.
async function votoAlimento(supabase, foodId, modificatoriCodici = []) {
  const { data: alimento } = await supabase
    .from('foods')
    .select('id, name_en, categoria_impatto')
    .eq('id', foodId)
    .single();
  if (!alimento?.categoria_impatto) throw new Error('Alimento senza categoria d\'impatto');

  const { data: base } = await supabase
    .from('impatto_categorie')
    .select('*')
    .eq('categoria', alimento.categoria_impatto)
    .single();

  const { data: pesi } = await supabase
    .from('voto_pesi')
    .select('componente, peso')
    .eq('tipo_prodotto', base.tipo_prodotto);

  let modificatori = [];
  if (modificatoriCodici.length) {
    const { data } = await supabase
      .from('voto_modificatori')
      .select('*')
      .in('codice', modificatoriCodici);
    modificatori = data || [];
  }

  return {
    alimento: alimento.name_en,
    ...calcolaVoto({ base, pesi, modificatori }),
  };
}

// Da un prodotto Open Food Facts ai codici modificatore che si applicano.
// `categoria` è la categoria d'impatto: serve a scegliere le regole giuste.
function modificatoriDa(p = {}, categoria = null) {
  const codici = [];
  const etichette   = (p.labels_tags || []).join(' ').toLowerCase();
  const ingredienti = (p.ingredients_tags || []).join(' ').toLowerCase();
  const imballaggio = (p.packaging_tags || []).join(' ').toLowerCase();
  const origine     = (p.origins || '').toLowerCase();
  const nome        = (p.product_name || '').toLowerCase();

  const ha = (rx, dove) => rx.test(dove);

  // --- Certificazioni generali (etichette in inglese, francese e italiano) ---
  const bio = /\borganic|\bbio\b|biologico|biologique|eu-organic|ab-agriculture/.test(etichette);
  if (bio) {
    codici.push('bio_ue');
    if (p.tipo_prodotto === 'animale') codici.push('bio_ue_animale');
  }
  if (/fair-?trade|commerce-equitable|equosolidale/.test(etichette)) {
    codici.push(categoria === 'cioccolato' || categoria === 'caffe' ? 'cacao_fairtrade' : 'fairtrade');
  }
  if (/rainforest-alliance|utz/.test(etichette)) codici.push('cacao_rainforest');
  if (/msc|sustainable-fishing|peche-durable|pesca-sostenibile/.test(etichette)) codici.push('msc');
  if (/free-?range|plein-air|all-aperto|allevato-a-terra/.test(etichette)) codici.push('allevamento_aperto');
  if (/slow-?grow|croissance-lente/.test(etichette)) codici.push('crescita_lenta');

  // --- Certificazioni di origine e qualità europee ---
  if (/\bpdo\b|\bdop\b|protected-designation/.test(etichette)) codici.push('dop');
  else if (/\bpgi\b|\bigp\b|protected-geographical/.test(etichette)) codici.push('igp');

  if (/made-in-italy|prodotto-in-italia|origine-italiana/.test(etichette)) codici.push('made_in_italy');
  if (/no-palm-oil|sans-huile-de-palme|senza-olio-di-palma/.test(etichette)) codici.push('senza_palma');
  if (/\bfsc\b|fsc-mix|fsc-recycled/.test(etichette)) codici.push('fsc');
  if (/utz/.test(etichette)) codici.push('utz');
  if (/no-preservatives|sans-conservateur|senza-conservanti/.test(etichette)) codici.push('senza_conservanti');
  if (/no-colorings|no-colours|sans-colorant|senza-coloranti/.test(etichette)) codici.push('senza_coloranti');

  // --- Olio di palma: certificato o no ---
  const palma = /palm-oil|huile-de-palme|olio-di-palma/.test(ingredienti);
  if (palma) {
    const certificata = /rspo|sustainable-palm|palme-durable/.test(etichette);
    codici.push(certificata ? 'palma_certificata' : 'olio_palma');
  }

  // --- Regole specifiche del cioccolato ---
  if (categoria === 'cioccolato') {
    // percentuale di cacao dal nome: "70%", "85 %"
    const perc = nome.match(/(\d{2,3})\s*%/);
    if (perc && Number(perc[1]) >= 60) codici.push('cacao_alto');

    if (/milk-chocolate|chocolat-au-lait|cioccolato-al-latte/.test(ingredienti)
        || /latte|milk|lait/.test(nome)) {
      codici.push('con_latte');
    }
    if (bio) codici.push('cacao_bio');
    if (/single-origin|origine-unica|monorigine/.test(etichette + ' ' + nome)) {
      codici.push('cacao_origine_unica');
    }
    // additivi: i codici E nella lista ingredienti
    const additivi = (p.ingredients_tags || []).filter(t => /^en:e\d{3}/.test(t)).length;
    if (additivi >= 3) codici.push('molti_additivi');
  }

  // --- Regole specifiche del pesce ---
  if (categoria === 'pesce_selvatico' || categoria === 'pesce_allevato' || categoria === 'gamberi') {
    const tutto = etichette + ' ' + nome + ' ' + (prodottoTag(p) || '');

    if (/\basc\b|aquaculture-stewardship/.test(etichette)) codici.push('asc_allevamento');
    if (/friend-of-the-sea/.test(etichette)) codici.push('friend_of_sea');
    if (/dolphin-safe|sans-dauphin/.test(etichette)) codici.push('dolphin_safe');
    if (bio && categoria !== 'pesce_selvatico') codici.push('bio_acquacoltura');

    // metodo di pesca
    if (/pole-and-line|canne|a-canna|hameçon|hand-?line/.test(tutto)) codici.push('canna_amo');
    if (/trawl|chalut|strascico|bottom-trawl/.test(tutto)) codici.push('strascico');

    // specie: azzurro, sovrasfruttate, in buono stato
    if (/sardine|sardina|anchov|acciugh|alici|mackerel|sgombro|maquereau|herring|aringa|spratto/.test(tutto)) {
      codici.push('pesce_azzurro');
    }
    if (/bluefin|rosso|thon-rouge|tonno-rosso|eel|anguilla|swordfish|pesce-spada|orange-roughy|shark|squalo|skate|razza/.test(tutto)) {
      codici.push('specie_sovrasfruttata');
    }
    if (/skipjack|listao|tonnetto|pollock|merluzzo-dell-alaska|hoki|capelin/.test(tutto)) {
      codici.push('specie_abbondante');
    }
  }

  // --- Segnali presenti su quasi tutti i prodotti ---
  const ingr = p.ingredients_tags || [];
  // conto solo gli ingredienti veri, non le categorie derivate
  const nIngr = ingr.filter(t => !/^en:e\d/.test(t)).length;
  if (nIngr > 0) {
    if (nIngr <= 3) codici.push('lista_corta');
    else if (nIngr >= 12) codici.push('lista_lunga');
  }

  const nAdd = ingr.filter(t => /^en:e\d{3}/.test(t)).length;
  if (ingr.length > 0) {
    if (nAdd === 0) codici.push('senza_additivi');
    else if (nAdd <= 2) codici.push('pochi_additivi');
    else codici.push('molti_additivi_g');
  }

  // materiale dell'imballaggio
  if (/glass|verre|vetro/.test(imballaggio)) codici.push('vetro');
  else if (/metal|steel|aluminium|alluminio|can\b|boite|lattina/.test(imballaggio)) codici.push('lattina');
  else if (/carton|cardboard|paper|papier|carta|brick/.test(imballaggio)) codici.push('carta_cartone');
  else if (/plastic|plastique|plastica|pet\b|film|sachet/.test(imballaggio)) codici.push('plastica');

  if (/individual|portion|monoporzione|single-serve|sachets/.test(imballaggio)) {
    codici.push('monoporzione');
  }

  // --- Imballaggio e origine ---
  if (/recycl|riciclabil|carton|glass|verre|vetro/.test(imballaggio)) {
    codici.push('imballaggio_riciclabile');
  }
  if (p.paese_utente && origine.includes(p.paese_utente.toLowerCase())) {
    codici.push('origine_nazionale');
  }

  // --- Luogo di produzione: presente su molti prodotti senza altre info ---
  const luogo = (p.manufacturing_places || '').toLowerCase();
  if (luogo) {
    if (/italia|italy|\bit\b/.test(luogo)) {
      codici.push('prodotto_italia');
    } else if (/franc|german|deutsch|spagn|spain|espa|belg|nederland|olanda|austria|portug|polon|poland|grec|danim|svez|sweden|finl|irland|ungher|cechia|czech|sloven|slovac|croaz|romani|bulgar|estonia|lettonia|lituania|lussemburgo|malta|cipro|europ/.test(luogo)) {
      codici.push('prodotto_ue');
    } else {
      codici.push('prodotto_lontano');
    }
  }

  return [...new Set(codici)];
}

// Uova: il codice stampato sul guscio (0-3) è il dato più forte che esista.
function modificatoreUova(primaCifra) {
  const mappa = {
    0: 'uova_codice_0',
    1: 'uova_codice_1',
    2: 'uova_codice_2',
    3: 'uova_codice_3',
  };
  return mappa[Number(primaCifra)] || null;
}

// Dalla categoria Open Food Facts alla nostra categoria d'impatto.
const DA_OFF = [
  ['manzo',           /\bbeef|boeuf|manzo|steak|hamburger/],
  ['agnello',         /\blamb|agneau|agnello|mutton/],
  ['maiale',          /\bpork|porc|maiale|bacon|ham\b|jambon|prosciutt|salami|saucisson|wurstel/],
  ['pollame',         /chicken|poulet|pollo|turkey|dinde|tacchino|duck|canard/],
  ['gamberi',         /shrimp|crevette|gamber|prawn|lobster|homard|crab/],
  ['pesce_allevato',  /salmon|saumon|salmone|trout|truite|sea-bream|orata|sea-bass|branzino/],
  ['pesce_selvatico', /\bfish|poisson|pesce|tuna|thon|tonno|cod\b|cabillaud|merluzz|sardine|anchov|mackerel/],
  ['uova',            /\begg|oeuf|uova\b|uovo/],
  ['formaggio',       /cheese|fromage|formagg|mozzarella|ricotta|parmesan|gorgonzola/],
  ['burro',           /\bbutter|beurre|burro\b/],
  ['yogurt',          /yogurt|yaourt|yoghurt|kefir/],
  ['latte',           /\bmilk|\blait|latte\b|cream|creme-fraiche|panna/],
  ['pane_pasta',      /bread|pain|pane\b|pasta|pates|cereal-bar/],
  ['cioccolato',      /chocolate|chocolat|cioccolat|cocoa|cacao/],
  ['caffe',           /coffee|cafe|caffe/],
  ['riso',            /\brice|\briz|riso\b/],
  ['olio',            /olive-oil|huile|\boil|olio\b/],
  ['tofu',            /tofu|tempeh|soy|soja/],
  ['frutta_secca',    /\bnut|noix|noci|almond|amande|mandorl|pistach|cashew|hazelnut|noisette/],
  ['legumi',          /\bbean|haricot|fagiol|lentil|lentille|lenticch|chickpea|pois-chiche|ceci\b/],
  ['patate',          /potato|pomme-de-terre|patat/],
  ['spezie',          /spice|epice|spezie|herb|salt|sel\b|sale\b|pepper|poivre/],
  ['frutta',          /fruit|frutta|apple|banana|orange|berry|jam|confiture|marmellata/],
  ['verdura',         /vegetable|legume-vert|verdura|tomato|tomate|pomodor|soup|soupe|zuppa/],
  ['cereali',         /flour|farine|farina|oat|avoine|avena|grain|cereale|muesli|granola/],
];

function categoriaDa(prodotto = {}) {
  const tag = (prodotto.categories_tags || []).join(' ').toLowerCase();
  const nome = (prodotto.product_name || '').toLowerCase();
  const testo = tag + ' ' + nome;

  // Prima le forme composte: un biscotto al cioccolato è un biscotto.
  if (/biscuit|cookie|cracker|wafer|biscotti|barquette/.test(testo)) return 'pane_pasta';
  if (/spread|tartiner|crema-spalmabile|hazelnut-spread/.test(testo)) return 'pane_pasta';
  if (/ice-cream|glace|gelato/.test(testo)) return 'latte';

  // Pasta e prodotti da forno: tag al plurale nell'esportazione
  if (/pastas?\b|fresh-pasta|spatzle|gnocch|couscous|noodle/.test(testo)) return 'pane_pasta';
  if (/breads?\b|pane\b|piadin|focacc|tortilla|crouton/.test(testo)) return 'pane_pasta';
  if (/frozen-seafood|frozen-fish/.test(testo)) return 'pesce_selvatico';
  if (/frozen-vegetables|frozen-fruits/.test(testo)) return 'verdura';
  if (/sausage|salsicc|wurstel|speck|salumi|italian-meat|cured-meat|prosciutt|mortadell|salame|bresaola|pancett|guancial/.test(testo)) return 'maiale';
  if (/canned-vegetables|canned-legumes|canned-beans|legumes|beans|lentils|chickpeas/.test(testo)) return 'legumi';
  if (/canned-fish|canned-tuna|tuna/.test(testo)) return 'pesce_selvatico';

  // Poi le categorie vere, dalla più specifica alla più generica.
  for (const [nostra, rx] of DA_OFF) {
    if (nostra === 'pane_pasta') continue;   // già gestita sopra
    if (rx.test(testo)) return nostra;
  }
  return null;
}

const CAMPI_OFF = 'code,product_name,brands,quantity,categories_tags,labels_tags,'
  + 'ingredients_tags,packaging_tags,origins,nutriscore_grade,image_front_small_url';

async function daOpenFoodFacts(barcode) {
  const r = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${CAMPI_OFF}`,
    { headers: { 'User-Agent': 'Sorrel/0.1 (sorrel.app)' } }
  );
  if (!r.ok) {
    const e = new Error('Servizio prodotti non raggiungibile');
    e.temporaneo = true;
    throw e;
  }
  const testo = await r.text();
  let d;
  try { d = JSON.parse(testo); }
  catch {
    const e = new Error('Risposta non valida dal servizio prodotti');
    e.temporaneo = true;
    throw e;
  }
  return d.status === 1 ? d.product : null;
}

// Dal codice a barre al voto completo, con cache sulla tabella prodotti.
async function votoBarcode(supabase, barcode, paese = 'it') {
  // 1. già in catalogo?
  const { data: salvato } = await supabase
    .from('prodotti').select('*').eq('barcode', barcode).maybeSingle();

  // Voto già calcolato e ancora fresco: si risponde subito.
  const FRESCO_GIORNI = 30;
  if (salvato?.voto_json && salvato.fonte !== 'manuale') {
    const eta = (Date.now() - new Date(salvato.aggiornato_il).getTime()) / 86400000;
    if (eta < FRESCO_GIORNI) {
      return { trovato: true, barcode, daCache: true, ...salvato.voto_json };
    }
  }

  let p, categoria;

  if (salvato && salvato.fonte === 'manuale') {
    // un prodotto corretto a mano vince sempre sul dato esterno
    p = { product_name: salvato.nome, brands: salvato.marca,
          labels_tags: salvato.certificazioni || [], origins: salvato.origine || '' };
    categoria = salvato.categoria_impatto;
  } else {
    p = await daOpenFoodFacts(barcode);
    if (!p) return { trovato: false, barcode };
    categoria = categoriaDa(p);
  }

  if (!categoria) {
    return { trovato: true, barcode, nome: p.product_name, marca: p.brands,
             voto: null, motivo: 'Categoria non riconosciuta' };
  }

  // 2. base, pesi e modificatori
  const { data: base } = await supabase
    .from('impatto_categorie').select('*').eq('categoria', categoria).single();
  if (!base) return { trovato: true, barcode, voto: null, motivo: 'Categoria senza dati d\'impatto' };

  const { data: pesi } = await supabase
    .from('voto_pesi').select('componente, peso').eq('tipo_prodotto', base.tipo_prodotto);

  const codici = modificatoriDa({ ...p, tipo_prodotto: base.tipo_prodotto, paese_utente: paese }, categoria);
  const { data: mod } = codici.length
    ? await supabase.from('voto_modificatori').select('*').in('codice', codici)
    : { data: [] };

  const applicabili = (mod || []).filter(m =>
    !m.categorie || m.categorie.includes(categoria));

  const risultato = calcolaVoto({ base, pesi, modificatori: applicabili });

  const risposta = {
    trovato: true,
    barcode,
    nome: p.product_name,
    marca: p.brands,
    immagine: p.image_front_small_url || null,
    categoria,
    ...risultato,
  };

  // 3. salva in catalogo, così la prossima scansione è immediata
  await supabase.from('prodotti').upsert({
    barcode,
    nome: p.product_name,
    marca: p.brands,
    paese,
    eco_score: risultato.voto,
    nutri_score: p.nutriscore_grade || null,
    certificazioni: p.labels_tags || [],
    origine: p.origins || null,
    categoria_riconosciuta: categoria,
    voto_json: risposta,
    fonte: salvato?.fonte === 'manuale' ? 'manuale' : 'openfoodfacts',
    aggiornato_il: new Date().toISOString(),
  }, { onConflict: 'barcode' });

  return risposta;
}

module.exports = { calcolaVoto, votoAlimento, modificatoriDa, modificatoreUova, categoriaDa, votoBarcode, lettera, puntiCarbonio };