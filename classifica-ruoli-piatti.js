// Fase 4, F1 — Ruolo nel piatto.
// Ogni piatto dichiara un ruolo primario (l'ingrediente piu' pesante in
// grammi - SEMPRE per peso di alimento, qualunque sia il ruolo) e l'insieme
// dei ruoli coperti.
//
// METRICA DI COPERTURA, dichiarata qui perche' F2 la deve leggere da qui e
// non ricalcolarla una seconda volta (2026-09-12, dopo la misura in
// misura-soglia-proteina-f2.js):
//  - proteina_principale, latticino: grammi di PROTEINA reale
//    (protein_100g * grams / 100), non grammi di alimento. Coperto se
//    l'ingrediente/i di quel ruolo forniscono >=10g di proteine, OPPURE
//    >=25% delle proteine totali del piatto (quale delle due e' piu'
//    facile). Il peso dell'alimento e' la misura sbagliata per la proteina:
//    "pollo con broccoli e gochujang" ha piu' broccoli che pollo in grammi,
//    ma il pollo e' l'85% delle proteine del piatto. Stessa logica per
//    latticino: 15g di parmigiano su una pasta pesano poco, ma sono gia'
//    un quinto delle proteine del piatto.
//  - verdura, base_amidacea, frutta, condimento: grammi di ALIMENTO (soglia
//    adattiva SOGLIA_SIGNIFICATIVA, sotto). Per questi ruoli la massa e' la
//    misura giusta: una porzione di verdura o di pane si giudica da quanta
//    ce n'e', non da un singolo nutriente.
//
// SOGLIA_SIGNIFICATIVA = 40g (per i ruoli a peso): non e' un numero nuovo,
// e' la stessa soglia gia' usata da gruppoDa/ingredientePrincipale in
// genera.js per decidere se un ingrediente conta come "vero" componente del
// piatto invece che una traccia. Scende al 20% del peso totale del piatto
// quando e' piu' bassa di 40g, cosi' uno spuntino leggero non resta senza
// ruoli coperti per pura aritmetica.
//
// Ruoli: proteina_principale, base_amidacea, verdura, frutta, latticino,
// condimento. Un piatto il cui ingrediente dominante e' un condimento non
// viene classificato (resta senza ruolo, come un piatto senza profilo non
// viene usato) - va segnalato come caso dubbio, non forzato. Le bevande
// (caffe', te', acqua frizzante/tonica, root beer) non sono un ruolo nel
// piatto: sono escluse a monte, non possono mai essere l'ingrediente
// dominante ne' contare in nessun ruolo - "un caffe' accanto ai savoiardi"
// non deve mai decidere il ruolo del piatto.
//
// RUOLO vs CATEGORIA (da non confondere MAI, in nessun punto del codice, in
// NESSUNA delle due direzioni - corretto il 2026-09-12 dopo il caso
// "Savoiardi"): il ruolo descrive cosa fa l'alimento nel piatto, la
// categoria (categorie_alimenti) descrive cosa contiene per allergie/diete,
// ed e' VOLUTAMENTE inclusiva (taggare "uova" su un biscotto che ne contiene
// e' corretto per un'allergia). Le due domande sono diverse e la categoria
// NON deve mai determinare il ruolo: "Savoiardi" e' taggato 'uova' in
// categorie_alimenti (giusto, contengono uovo), ma il suo ruolo e'
// base_amidacea (farina e zucchero), non proteina_principale solo perche'
// c'e' un uovo nella ricetta. Per questo i ruoli proteina_principale e
// latticino NON leggono piu' da categorie_alimenti (vedi sotto) - si
// derivano dal nome esattamente come verdura/frutta/base_amidacea/
// condimento, con la stessa logica "cosa fa l'alimento", non "cosa contiene
// che qualcuno deve evitare". Alla prova: "Pasta di curry rosso" e "Kimchi"
// sono taggati crostacei/pesce (contengono pasta di gamberetti/salsa di
// pesce, giusto per le allergie) ma il loro ruolo e' condimento/verdura, non
// proteina_principale - con la derivazione per nome ci arrivano da soli
// (curry -> condimento, kimchi -> verdura), senza bisogno di un'eccezione.
// Questo file legge zero campi da categorie_alimenti e non ne scrive mai:
// la separazione vale in entrambe le direzioni, non solo "mai derivare le
// categorie dai ruoli" ma anche "mai derivare i ruoli dalle categorie".
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const SOGLIA_SIGNIFICATIVA = 40;

// legumi/soia hanno sia proteina che carboidrati significativi (ha_amido=true
// su molti piatti a base di legumi nei dati esistenti): l'insieme dei loro
// food_id serve solo ad ammorbidire il controllo incrociato con ha_amido
// (sotto), NON a determinare il ruolo - quello resta proteina_principale,
// derivato dal nome come tutto il resto.
const RX_LEGUME_O_SOIA = /\bceci\b|fagiol|\bfave\b|lenticchi|lupini|piselli|taccole|edamame|hummus|\btofu\b|tempeh|germogli di soia|semi di soia/i;

// ---- Livello 2: regex sul nome, per tutto cio' che categorie_alimenti non copre ----
// (verdura, frutta, base_amidacea, condimento - categorie_alimenti e' solo
// proteine/allergeni, non una tassonomia alimentare completa).

// Erbe fresche/secche, spezie, oli, aceti, salse, dolcificanti, lieviti,
// estratti: usati per grammatura minima, mai come porzione. Include gli
// stessi esclusi da ingredientePrincipale in genera.js (aglio, zenzero,
// salse, agrumi da condimento) piu' il resto del registro "spezie/condimenti".
// Bevande: MAI un ruolo, escluse a monte prima ancora di arrivare a
// ruoloDaNome (vedi filtraBevande sotto) - non stanno neppure in questo
// regex, per non doverle poi ricordarsi di escludere ovunque nel codice.
// Niente \b finale dopo [eè]/[eè] verde: in JavaScript \b si basa su \w
// ASCII, che non include le lettere accentate - "caff[eè]\b" non
// troverebbe MAI il confine dopo "Caffè" seguito da uno spazio, perche'
// 'è' e' gia' "non parola" per \b quanto lo spazio stesso.
const RX_BEVANDA = /\b(caff[eè]|coffee|t[eè] verde|green tea|\btea\b|root beer|acqua (frizzante|tonica)|club soda|tonic water)/i;

const RX_CONDIMENTO = /\b(olio|oil|aceto|vinegar|sriracha|tabasco|ketchup|senape|mustard|salsa|sauce|dressing|chimichurri|gochujang|hoisin|teriyaki|miso|tahini|relish|chutney|marmellata|jam\b|miele|honey|sciroppo|syrup|melassa|molasses|zucchero|sugar|stevia|sale\b|salt,|lievito|leavening|baking (soda|powder)|yeast|amido di mais|cornstarch|estratto di vaniglia|vanilla extract|vaniglia|cacao|cocoa|cioccolat|chocolate|aglio|garlic|zenzero|ginger root|zenzero fresco|basilico|prezzemolo|parsley|coriandolo|cilantro|menta|mint\b|rosmarino|rosemary|salvia|sage\b|timo|thyme|aneto|dill\b|erba cipollina|chives|maggiorana|marjoram|alloro|bay leaf|cannella|cinnamon|cardamomo|cardamom|chiodi di garofano|cloves|cumino|cumin\b|curcuma|turmeric|curry|noce moscata|nutmeg|origano|oregano|paprika|pepe |pepper,|peperoncino in polvere|chili powder|anice stellato|star anise|semi di (chia|lino|sesamo|girasole|zucca|cumino|finocchio)|seeds?,|capperi|capers|\bolive\b|\bolives\b|rafano|horseradish|vino bianco|vino rosso|wine,|brodo|stock,|broth|pasta di tamarindo|tamarind|latte di cocco|coconut milk|mandorl|almond|nocciol|hazelnut|anacard|cashew|pistacch|pistachio|arachid|peanut|noci\b|noce\b|walnut|macadamia|passata di pomodoro|tomato.*(puree|paste)|concentrato di pomodoro|condimento italiano|italian dressing|pomodori secchi|sun-dried tomato|maionese|\bmayo\b|mayonnaise|pesto|worcestershire|\bburro\b|\bbutter\b|margarina|margarine)/i;

// castagne/chestnut spostate qui da RX_FRUTTA (2026-09-12, campione F1):
// nutrizionalmente sono amido, non zucchero di frutta (~40g carboidrati/100g,
// piu' vicine a un cereale che a una mela) - il vecchio ha_amido=true su
// "Roasted chestnuts" aveva ragione, la prima classificazione no. Savoiardi
// aggiunto nello stesso giro (biscotto, mancava dal regex). cornetto/muffin/
// sfoglia aggiunti insieme alla rimozione di categorie_alimenti dal ruolo
// (2026-09-12): "Cornetto con uovo formaggio e prosciutto" e "Muffin
// inglese con formaggio e salsiccia" sono panini/dolci da forno, non un
// piatto di proteina solo perche' contengono anche uovo/formaggio/salsiccia.
const RX_BASE_AMIDACEA = /\b(riso|rice,|pasta|spaghett|penne|farro|spelt|orzo|barley|couscous|cous\b|bulgur|polenta|cornmeal|farina|flour|pane\b|pane,|bread|fette biscottate|savoiardi|biscott|ladyfinger|cracker|cornetto|croissant|muffin|sfoglia|puff pastry|patat|potato|quinoa|amaranto|amaranth|grano saraceno|buckwheat|miglio|millet|teff|avena|oat,|oats|tapioca|popcorn|tortilla|carta di riso|rice paper|gallette di riso|rice cakes|platano|plantain|\byuca\b|manioca|cassava|\bbun\b|panino|noodle|udon|soba\b|ramen|vermicelli|castagne|chestnut)/i;

// Latte di mandorla: ruolo latticino (fa il lavoro del latte nel piatto -
// es. "Cereals with almond milk"), ma NON deve mai toccare categorie_alimenti
// (resta fuori da 'latticini'/'lattosio', vedi nota RUOLO vs CATEGORIA in
// testa al file). Controllata PRIMA di RX_CONDIMENTO, che altrimenti la
// cattura via "mandorl". Latte/yogurt di soia non hanno bisogno della stessa
// eccezione: "soia" da sola non e' un termine condimento (lo sono solo i
// composti - salsa di soia, miso, gochujang, tofu/tempeh restano proteina),
// quindi arrivano a RX_LATTICINO sotto senza essere intercettati prima.
const RX_LATTICINO_VEGETALE = /\b(latte di mandorla|almond milk)\b/i;

const RX_FRUTTA = /\b(mela\b|mele\b|apple|banana|arancia|arance|orange|clementine|pompelmo|grapefruit|limone|lime\b|lemon|kiwi|ananas|pineapple|anguria|watermelon|melone|melon|cantaloupe|uva\b|uvetta|grape|raisin|ciliegie|cherr|fragol|strawberr|lampon|raspberr|mirtill|blueberr|cranberr|\bmore\b|blackberr|frutti di bosco|mixed berries|pesc[ah]e|peach|susine|prugn|plum|albicocc|apricot|fichi|\bfico\b|fig,|figs\b|cachi|persimmon|datteri|dates,|melagrana|melograno|pomegranate|guava|papaya|\bmango\b|acai|\bpera\b|pere\b|\bpears?\b|cocco fresco|fresh coconut)/i;

// kimchi aggiunto insieme alla rimozione di categorie_alimenti dal ruolo
// (2026-09-12): taggato pesce/crostacei per la salsa di pesce/gamberetti
// che contiene (giusto per le allergie), ma il ruolo e' verdura - e'
// cavolo fermentato, come i crauti gia' qui sotto.
const RX_VERDURA = /\b(pomodor|tomato|zucchin|zucca|squash|pumpkin|melanzan|eggplant|aubergine|peperon|pepper,|jalapeno|padr[oó]n|cipoll|onion|scalogno|shallot|porr[io]|leek|aglio fresco|carota|carrot|sedano|celery|finocchi|fennel|cavol|cabbage|kale|broccol|cavolfiore|cauliflower|bok choy|collard|spinaci|spinach|bietol|chard|lattuga|lettuce|rucola|arugula|radicchio|scarola|escarole|indivia|endive|cicoria|chicory|crescione|watercress|valeriana|asparagi|asparagus|carciof|artichoke|barbabiet|beetroot|beet,|\brapa\b|\brape\b|rape rosse|turnip|ravanell|radish|daikon|topinambur|jerusalem artichoke|funghi|mushroom|\balga\b|alghe|seaweed|kelp|wakame|nori|crauti|sauerkraut|\bkimchi\b|okra|cetriol|cucumber|avocado|mais dolce|mais bianco|sweet corn|corn,|\bolive\b|\bolives\b|pastinaca|parsnip)/i;

// ---- Proteina e latticino: DERIVATI DAL NOME, non da categorie_alimenti
// (vedi nota RUOLO vs CATEGORIA in testa al file). Elenco costruito sui
// nomi reali dei 247 alimenti oggi taggati con una categoria proteica/
// allergenica, per verificare che coprano gli alimenti VERI (carne, pesce,
// legumi, uova) e lascino fuori le salse/composti che li contengono solo
// come ingrediente minoritario (kimchi, pasta di curry, salsa di pesce,
// salsa di soia/hoisin/teriyaki, miso, gochujang, maionese, salse BBQ/
// Buffalo/ranch, cornetto/muffin) - quelli cadono gia' su condimento o
// base_amidacea sopra, prima di arrivare qui.
const RX_PROTEINA_PRINCIPALE = /\b(pollo|chicken|tacchino|turkey|anatra|duck|\boca\b|\bgoose\b|coniglio|rabbit|fagiano|pheasant|piccione|pigeon|quaglia|quail|manzo|beef|vitello|veal|agnello|lamb|maiale|pork|\bcapra\b|\bgoat\b|cinghiale|\bboar\b|canguro|kangaroo|bisonte|bison|\bcervo\b|venison|salame|salami|mortadella|salsiccia|sausage|\bbacon\b|pancetta|\bspeck\b|bresaola|prosciutto|ham\b|w[uü]rstel|leberwurst|fegato|liver|\blingua\b|\btongue\b|zampe|trotter|costine|costol|rib\b|ribs\b|stinco|\blonza\b|guancia|cheek\b|\blardo\b|\breni\b|kidney|\bsego\b|tallow|petto di (pollo|tacchino|anatra|manzo)|chicken breast|turkey breast|duck breast|beef brisket|acciughe|anchov|anguilla|\beel\b|aringa|herring|baccal[aà]|\bcod\b|barramundi|branzino|sea bass|\bcarpa\b|\bcarp\b|caviale|caviar|cernia|grouper|\bdentice\b|eglefino|haddock|\bhalibut\b|mahi mahi|merluzzo|nasello|\bhake\b|\borata\b|passera|plaice|\bpersico\b|\bperch\b|pesce (farfalla|gatto|spada)|swordfish|catfish|\bplatessa\b|\bpollock\b|\brombo\b|turbot|salmone|salmon|\bsardine\b|\bsgombro\b|mackerel|sogliola|\bsole\b|\bspigola\b|\bsurimi\b|\btilapia\b|\btonno\b|\btuna\b|\btrota\b|\btrout\b|aragosta|lobster|\bastice\b|gamberetti|\bgambero\b|\bshrimp\b|\bprawn\b|granchio|\bcrab\b|\bscampi\b|calamari|squid|capesante|scallop|\bcozze\b|mussel|\bpolpo\b|octopus|\bseppia\b|cuttlefish|vongole|\bclam\b|\bceci\b|chickpea|fagiol|\bbean\b|\bbeans\b|fagiolini|green bean|\bfave\b|\bfava\b|lenticchi|lentil|\blupini\b|\bpiselli\b|\bpeas\b|\btaccole\b|\bedamame\b|\bhummus\b|\btofu\b|\btempeh\b|germogli di soia|soy sprouts|semi di soia|soybean|\balbume\b|egg white|\btuorlo\b|egg yolk|\buovo\b|\buova\b|\begg\b|\beggs\b)/i;

// Formaggi, latte e derivati che fanno il lavoro del latte/formaggio nel
// piatto. Burro e margarina restano condimento (funzionano come grasso di
// cottura, non come "il latticino del pasto") - esclusi qui apposta, gia'
// in RX_CONDIMENTO sopra.
const RX_LATTICINO = /\b(asiago|\bbrie\b|caciocavallo|camembert|cheddar|crescenza|emmental|\bfeta\b|fontina|formaggio|cheese\b|gorgonzola|\bgouda\b|gruyere|caprino|goat cheese|mascarpone|\bmonterey\b|mozzarella|parmigiano|parmesan|pecorino|\bprovola\b|provolone|\bqueso\b|ricotta|\brobiola\b|scamorza|stracchino|\btaleggio\b|\blatte\b|\bmilk\b|\bpanna\b|\bcream\b|latticello|buttermilk|\bkefir\b|\byogurt\b|\bgelato\b|ice cream|siero di latte|whey)/i;

// Le due eccezioni concordate per non lasciare "il condimento non e' mai
// primario" a bocciare due famiglie di piatti frequenti e non ambigue:
// - uno spuntino di sola frutta secca/semi (mandorle, noci, nocciole,
//   anacardi, pistacchi, arachidi, semi di zucca/girasole - non olive, non
//   latte di frutta secca) prende proteina_principale: contengono proteine
//   reali (5-6g per 30g di mandorle/noci) e funzionano nutrizionalmente
//   come lo spuntino proteico, non come porzione di frutta.
// - un piatto dove la passata/il concentrato di pomodoro domina prende
//   verdura: e' pomodoro, solo ridotto in purea, non un condimento aggiunto
//   a qualcos'altro (es. "Tomato rice").
const RX_FRUTTA_SECCA_SOLA = /\b(mandorl|almond|nocciol|hazelnut|anacard|cashew|pistacch|pistachio|arachid|peanut|noci\b|noce\b|walnut|macadamia|semi di (chia|lino|sesamo|girasole|zucca|cumino|finocchio)|seeds?,)/i;
const RX_POMODORO_CONCENTRATO = /\b(passata di pomodoro|tomato.*(puree|paste)|concentrato di pomodoro|pomodori secchi|sun-dried tomato)\b/i;

function eccezioneCondimento(nome) {
  if (RX_POMODORO_CONCENTRATO.test(nome)) return 'verdura';
  if (RX_FRUTTA_SECCA_SOLA.test(nome)) return 'proteina_principale';
  return null;
}

// Ordine deliberato: base_amidacea PRIMA di latticino/proteina, cosi' un
// prodotto composito da forno ("Cornetto con uovo formaggio e prosciutto",
// "Muffin inglese con formaggio e salsiccia") resta il pane/dolce che e',
// non il formaggio o il prosciutto che contiene solo come farcitura.
function ruoloDaNome(nome) {
  if (RX_LATTICINO_VEGETALE.test(nome)) return 'latticino';
  if (RX_CONDIMENTO.test(nome)) return 'condimento';
  if (RX_BASE_AMIDACEA.test(nome)) return 'base_amidacea';
  if (RX_LATTICINO.test(nome)) return 'latticino';
  if (RX_PROTEINA_PRINCIPALE.test(nome)) return 'proteina_principale';
  if (RX_FRUTTA.test(nome)) return 'frutta';
  if (RX_VERDURA.test(nome)) return 'verdura';
  return null;
}

async function costruisciMappaRuoli(supabase) {
  const mappa = new Map();
  const foodIdLegumiSoia = new Set();

  // Nessuna lettura da categorie_alimenti: il ruolo si deriva SOLO dal nome,
  // per tutti e sei i ruoli allo stesso modo (vedi nota RUOLO vs CATEGORIA
  // in testa al file).
  const { data: foods } = await supabase.from('foods').select('id, name, name_it');
  for (const f of foods) {
    const nome = f.name_it || f.name || '';
    const ruolo = ruoloDaNome(nome) || ruoloDaNome(f.name || '');
    if (ruolo) mappa.set(f.id, ruolo);
    // Serve solo ad ammorbidire il controllo incrociato con ha_amido (i
    // legumi hanno carboidrati veri), non a determinare il ruolo.
    if (RX_LEGUME_O_SOIA.test(nome) || RX_LEGUME_O_SOIA.test(f.name || '')) foodIdLegumiSoia.add(f.id);
  }
  const nomeDi = Object.fromEntries(foods.map(f => [f.id, f.name_it || f.name]));
  return { mappa, nomeDi, foodIdLegumiSoia };
}

async function caricaTuttiIPiatti(supabase) {
  const piatti = [];
  const PAGINA = 1000;
  for (let offset = 0; ; offset += PAGINA) {
    const { data, error } = await supabase
      .from('dishes').select('id, name, name_en, meal_slot, ha_amido, ha_proteina')
      .order('id').range(offset, offset + PAGINA - 1);
    if (error) throw new Error(error.message);
    piatti.push(...data);
    if (data.length < PAGINA) break;
  }
  return piatti;
}

async function caricaIngredientiDi(supabase, ids) {
  const per = {};
  for (let i = 0; i < ids.length; i += 200) {
    const blocco = ids.slice(i, i + 200);
    const { data, error } = await supabase
      .from('dish_ingredients')
      .select('dish_id, food_id, grams, foods (protein_100g)')
      .in('dish_id', blocco)
      .order('dish_id').order('food_id');
    if (error) throw new Error(error.message);
    for (const r of data) {
      (per[r.dish_id] ||= []).push({
        food_id: r.food_id, grams: r.grams,
        proteina: ((r.foods && r.foods.protein_100g) || 0) * (r.grams || 0) / 100,
      });
    }
  }
  return per;
}

// Ruoli la cui copertura si misura in grammi di PROTEINA reale, non in
// grammi di alimento - dichiarato una sola volta qui, F2 legge ruoli_coperti
// gia' calcolato con la metrica giusta, non la ricalcola.
const RUOLI_A_PROTEINA = new Set(['proteina_principale', 'latticino']);
const SOGLIA_PROTEINA_G = 10;
const QUOTA_PROTEINA = 0.25;

(async () => {
  console.log('Costruzione mappa food_id -> ruolo...');
  const { mappa: mappaRuoli, nomeDi, foodIdLegumiSoia } = await costruisciMappaRuoli(supabase);
  console.log(`Mappa pronta: ${mappaRuoli.size} alimenti classificati.`);

  const piatti = await caricaTuttiIPiatti(supabase);
  console.log(`Piatti totali: ${piatti.length}`);
  const ingredientiPer = await caricaIngredientiDi(supabase, piatti.map(p => p.id));

  const aggiornamenti = [];
  const dubbi = [];

  for (const piatto of piatti) {
    const tuttiGliIngredienti = ingredientiPer[piatto.id] || [];
    if (!tuttiGliIngredienti.length) {
      dubbi.push({ tipo: 'nessun_ingrediente', piatto: piatto.name_en || piatto.name, id: piatto.id });
      continue;
    }

    // Le bevande non sono mai un ruolo nel piatto: escluse prima di
    // calcolare qualunque cosa, non solo prima di sceglierle come primario -
    // un caffe' da 30g non deve nemmeno contribuire al peso o alla proteina
    // di nessun ruolo.
    const ingredienti = tuttiGliIngredienti.filter(i => !RX_BEVANDA.test(nomeDi[i.food_id] || ''));
    if (!ingredienti.length) {
      dubbi.push({ tipo: 'solo_bevanda', piatto: piatto.name_en || piatto.name, id: piatto.id,
        dettaglio: 'tutti gli ingredienti sono bevande, nessun ruolo possibile' });
      continue;
    }

    const pesoTotale = ingredienti.reduce((s, i) => s + (i.grams || 0), 0);
    const proteinaTotale = ingredienti.reduce((s, i) => s + (i.proteina || 0), 0);
    const pesoPerRuolo = {};
    const proteinaPerRuolo = {};
    const nonClassificati = [];
    for (const ing of ingredienti) {
      const ruolo = mappaRuoli.get(ing.food_id);
      if (!ruolo) { nonClassificati.push(ing); continue; }
      pesoPerRuolo[ruolo] = (pesoPerRuolo[ruolo] || 0) + (ing.grams || 0);
      proteinaPerRuolo[ruolo] = (proteinaPerRuolo[ruolo] || 0) + (ing.proteina || 0);
    }

    // L'ingrediente singolo piu' pesante determina il ruolo primario -
    // serve il food_id dominante, non solo il ruolo, per il controllo
    // "condimento non e' mai primario". Sempre per peso di alimento, anche
    // per i ruoli la cui COPERTURA si misura in proteina: il primario
    // risponde "cosa c'e' di piu' in questo piatto", non "cosa ne domina la
    // proteina" - sono due domande diverse (vedi nota in testa al file).
    const dominante = ingredienti.slice().sort((a, b) => (b.grams || 0) - (a.grams || 0))[0];
    const ruoloDominante = mappaRuoli.get(dominante.food_id);

    if (!ruoloDominante) {
      dubbi.push({
        tipo: 'ingrediente_dominante_non_classificato', piatto: piatto.name_en || piatto.name, id: piatto.id,
        dettaglio: `food_id dominante ${dominante.food_id} (${nomeDi[dominante.food_id] || '?'}, ${dominante.grams}g) non ha un ruolo`,
        food_id_dominante: dominante.food_id, nome_dominante: nomeDi[dominante.food_id] || null,
      });
      continue;
    }
    let ruoloEffettivo = ruoloDominante;
    if (ruoloDominante === 'condimento') {
      const eccezione = eccezioneCondimento(nomeDi[dominante.food_id] || '');
      if (eccezione) {
        ruoloEffettivo = eccezione;
        // Lo spostamento vale anche nel conteggio per ruoli_coperti: peso E
        // proteina dell'ingrediente dominante seguono la sua eccezione, non
        // restano sotto 'condimento' mentre il ruolo primario dice altro
        // (la frutta secca ha proteina reale, serve al calcolo di copertura
        // di proteina_principale che ora e' sui grammi di proteina).
        pesoPerRuolo['condimento'] = (pesoPerRuolo['condimento'] || 0) - (dominante.grams || 0);
        pesoPerRuolo[eccezione] = (pesoPerRuolo[eccezione] || 0) + (dominante.grams || 0);
        proteinaPerRuolo['condimento'] = (proteinaPerRuolo['condimento'] || 0) - (dominante.proteina || 0);
        proteinaPerRuolo[eccezione] = (proteinaPerRuolo[eccezione] || 0) + (dominante.proteina || 0);
      } else {
        dubbi.push({
          tipo: 'primario_sarebbe_condimento', piatto: piatto.name_en || piatto.name, id: piatto.id,
          dettaglio: `ingrediente dominante food_id ${dominante.food_id} (${nomeDi[dominante.food_id] || '?'}, ${dominante.grams}g) e' un condimento`,
        });
        continue;
      }
    }

    // Soglia adattiva per i ruoli a peso (verdura/base_amidacea/frutta/
    // condimento): 40g fissi penalizzano gli spuntini leggeri (un piatto da
    // 45g totali non fa mai scattare un ingrediente da 40g, anche quando
    // quell'ingrediente E' chiaramente il corpo del piatto). Scende al 20%
    // del peso totale quando e' piu' basso di 40g, resta 40g altrimenti.
    const sogliaPesoCoperti = Math.min(SOGLIA_SIGNIFICATIVA, pesoTotale * 0.20);

    // proteina_principale e latticino usano la metrica dichiarata in testa
    // al file: grammi di proteina reale, non grammi di alimento (vedi
    // misura-soglia-proteina-f2.js). F2 legge questo risultato, non
    // ricalcola una sua soglia.
    const copreAProteina = (ruolo) => {
      const g = proteinaPerRuolo[ruolo] || 0;
      return g >= SOGLIA_PROTEINA_G || (proteinaTotale > 0 && g / proteinaTotale >= QUOTA_PROTEINA);
    };

    const ruoliCoperti = [...new Set([...Object.keys(pesoPerRuolo), ...Object.keys(proteinaPerRuolo)])]
      .filter(r => (pesoPerRuolo[r] || 0) > 0 || (proteinaPerRuolo[r] || 0) > 0)
      .filter(r => RUOLI_A_PROTEINA.has(r) ? copreAProteina(r) : (pesoPerRuolo[r] || 0) >= sogliaPesoCoperti);

    // Controlli incrociati con i flag di dishes gia' esistenti: un piatto
    // ha_proteina=true senza alcun ingrediente proteina_principale (o
    // viceversa ha_amido=true senza base_amidacea) e' un segnale che la
    // derivazione automatica o il flag esistente non tornano. Ammorbiditi
    // per due casi reali e non errori (vedi f1-casi-dubbi.json v1, 251/306
    // casi erano di questo tipo, non dubbi piatto per piatto):
    //  - ha_proteina e' soddisfatto anche da latticino (yogurt/formaggio
    //    hanno proteine vere, restano un ruolo diverso da proteina_principale).
    //  - ha_amido e' soddisfatto anche da un legume/soia significativo
    //    (fagioli/lenticchie hanno carboidrati veri, restano classificati
    //    proteina_principale come ruolo - qui serve solo a non segnalarli).
    const pesoLegumiSoia = ingredienti
      .filter(i => foodIdLegumiSoia.has(i.food_id))
      .reduce((s, i) => s + (i.grams || 0), 0);

    const flagSenzaRuolo = [];
    if (piatto.ha_proteina && !ruoliCoperti.includes('proteina_principale') && !ruoliCoperti.includes('latticino')) {
      flagSenzaRuolo.push('ha_proteina=true ma nessun ingrediente proteina_principale o latticino');
    }
    if (piatto.ha_amido && !ruoliCoperti.includes('base_amidacea') && pesoLegumiSoia < SOGLIA_SIGNIFICATIVA) {
      flagSenzaRuolo.push('ha_amido=true ma nessun ingrediente base_amidacea o legume significativo');
    }

    if (flagSenzaRuolo.length) {
      dubbi.push({
        tipo: 'flag_dish_incoerente', piatto: piatto.name_en || piatto.name, id: piatto.id,
        dettaglio: flagSenzaRuolo.join('; '),
        ruolo_primario_proposto: ruoloEffettivo, ruoli_coperti_proposti: ruoliCoperti,
      });
      continue;
    }

    aggiornamenti.push({ id: piatto.id, ruolo_primario: ruoloEffettivo, ruoli_coperti: ruoliCoperti });
  }

  console.log(`\nClassificati automaticamente: ${aggiornamenti.length}`);
  console.log(`Casi dubbi (NON scritti, restano senza ruolo): ${dubbi.length}`);
  const perTipo = {};
  for (const d of dubbi) perTipo[d.tipo] = (perTipo[d.tipo] || 0) + 1;
  console.log('  per tipo:', perTipo);

  require('fs').writeFileSync(
    __dirname + '/f1-casi-dubbi.json',
    JSON.stringify(dubbi, null, 2)
  );
  console.log('Casi dubbi salvati in f1-casi-dubbi.json');

  if (process.argv.includes('--dry')) {
    console.log('\n--dry: nessuna scrittura sul database effettuata.');
    return;
  }

  // Scrittura in blocchi da 500 (update singoli, dishes non ha una funzione
  // di bulk update lato client - upsert per id e' l'equivalente corretto).
  let scritti = 0;
  for (const u of aggiornamenti) {
    const { error } = await supabase.from('dishes')
      .update({ ruolo_primario: u.ruolo_primario, ruoli_coperti: u.ruoli_coperti })
      .eq('id', u.id);
    if (error) throw new Error(`${u.id}: ${error.message}`);
    scritti++;
    if (scritti % 200 === 0) console.log(`  ...${scritti}/${aggiornamenti.length}`);
  }
  console.log(`Scritti ${scritti} piatti.`);
})();
