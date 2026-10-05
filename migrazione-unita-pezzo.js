// Assegna unita/peso_pezzo_g realistici agli alimenti che oggi ricadono sul
// ramo "grammi" di quantitaLeggibile (spesa.js) perche' non hanno un'unita'
// dichiarata - risultato: "patate 966 g" invece di "6 patate, circa 1 kg".
//
// Trovati cosi' (vedi anche la lista allegata al commit): tutti i food_id
// che compaiono negli ingredienti di un piatto usato in almeno un piano
// reale (join dish_ingredients -> plan_items) e hanno unita is null o
// unita='peso'.
//
// Criteri dichiarati (non una fonte unica, come permesso dal compito):
// - Verdure/frutti solitamente venduti sfusi a pezzo: peso di un pezzo
//   medio, calibrato sui valori GIA' presenti in questo stesso catalogo
//   per alimenti simili (es. zucchina 200g, peperone 200g, limone 100g,
//   mela 180-200g, uovo 55g - vedi 169291, peperone_rosso_it, limone_it,
//   mela_it, uovo_grande_it) quando esiste un sibling diretto, altrimenti
//   una stima di buon senso dello stesso ordine di grandezza.
// - Verdure a foglia vendute in mazzo dal fruttivendolo (bietole, cime di
//   rapa, cavolo riccio, cicoria, scarola a foglia sciolta): mazzo, peso
//   del mazzo tipico (200-300g).
// - Insalate pronte lavate in busta (spinaci baby, rucola, valeriana,
//   germogli): confezione, taglia busta tipica italiana (100-200g).
// - Funghi, pomodorini, taccole, okra, fagiolini: confezione (vaschetta),
//   taglia tipica (200-400g).
// - Pesce in filetto o pesce piccolo intero: pezzi, peso di un filetto o
//   di un pesce piccolo intero (120-250g), coerente con l'esempio del
//   mockup approvato (orata: 2 filetti, circa 300g -> 150g a filetto).
// - Carne macinata, tagli da cuocere interi grandi, pesce grande (polpo,
//   astice): confezione (vaschetta/pezzo unico), taglia tipica.
// - Tagli di carne a fetta/scaloppina/cotoletta: pezzi, peso di una fetta.
// - Formaggi, yogurt, kefir, panna: confezione, formato tipico italiano
//   (yogurt 500g vasca, formaggi a pezzo 200g, panna 200ml).
// - Olio, aceti: confezione, formato bottiglia tipico (olio 1 L, aceto
//   500 ml, aceto balsamico 250 ml).
// - Frutta secca, semi, legumi/cereali cotti o secchi in busta: confezione,
//   formato busta tipico (200-500g).
// - Scarti/spezie/condimenti usati in quantita' da pizzico (buccia di
//   limone, pepe nero, cumino dei prati): lasciati su "peso" di proposito -
//   sono sempre sotto i 15g in ricetta, "a pinch" resta la resa giusta,
//   forzare un pezzo o una confezione sarebbe artificiale.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const CHIAVE = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(process.env.SUPABASE_URL, CHIAVE);

// food_id -> [unita, peso_pezzo_g]
const MAPPA = {
  // --- Produce: pezzo ---
  '170393': ['pezzi', 70],              // Carrots
  '170028': ['pezzi', 150],             // Potatoes
  '170379': ['pezzi', 400],             // Broccoli (whole head)
  '169975': ['pezzi', 900],             // Cabbage (whole head)
  cavolo_cappuccio_it: ['pezzi', 900],
  cavolo_rosso_it: ['pezzi', 900],
  cavolo_napa_it: ['pezzi', 700],
  cavolfiore_it: ['pezzi', 800],
  '168448': ['pezzi', 600],             // Pumpkin (wedge as commonly sold cut)
  melanzana_it: ['pezzi', 250],         // Aubergine
  cipolla_rossa_it: ['pezzi', 150],     // Red onion
  pastinaca_it: ['pezzi', 150],         // Parsnip
  barbabietole_it: ['pezzi', 120],
  barbabietola_australiana_it: ['pezzi', 120],
  finocchio_it: ['pezzi', 300],         // Fennel bulb
  peperone_verde_it: ['pezzi', 200],    // matches red/yellow siblings
  zenzero_it: ['pezzi', 70],            // Ginger knob
  '169998': ['pezzi', 150],             // Sweet corn, on the cob
  bok_choy_it: ['pezzi', 150],
  indivia_it: ['pezzi', 300],
  scarola_it: ['pezzi', 400],
  yuca_it: ['pezzi', 300],              // Cassava root piece
  cipollotto_it: ['mazzo', 100],        // Spring onions, bunch
  sedano_it: ['pezzi', 400],            // Celery, whole bunch of stalks
  porri_it: ['pezzi', 150],             // Leek, one stalk

  // --- Produce: mazzo (foglia) ---
  bietola_it: ['mazzo', 300],
  bietole_it: ['mazzo', 300],
  rape_it: ['mazzo', 300],              // Turnip greens / cime di rapa
  kale_it: ['mazzo', 200],
  cicoria_it: ['mazzo', 300],
  aneto_it: ['mazzo', 30],              // Dill
  cavolo_verde_it: ['mazzo', 300],      // Collard greens

  // --- Produce: confezione (busta/vaschetta) ---
  spinaci_it: ['confezione', 200],
  rucola_it: ['confezione', 100],
  valeriana_it: ['confezione', 100],
  germogli_soia_it: ['confezione', 200],
  funghi_champignon_it: ['confezione', 250],
  '168434': ['confezione', 250],        // Mushrooms, cremini
  funghi_porcini_it: ['confezione', 200],
  funghi_it: ['confezione', 250],
  pomodorini_it: ['confezione', 250],   // Cherry tomatoes
  taccole_it: ['confezione', 200],      // Snow peas
  okra_it: ['confezione', 200],
  fagiolini_it: ['confezione', 400],    // Green beans
  cavolini_bruxelles_it: ['confezione', 400],
  cavolini_it: ['confezione', 400],
  '170419': ['confezione', 400],        // Green peas
  topinambur_it: ['confezione', 500],   // Jerusalem artichokes, net bag

  // --- Produce: frutta a pezzo ---
  ciliegie_it: ['confezione', 400],     // Cherries, punnet
  lamponi_it: ['confezione', 125],      // Raspberries, punnet
  fragole_it: ['confezione', 250],      // Strawberries, punnet
  frutti_bosco_it: ['confezione', 150], // Mixed berries, punnet
  uva_it: ['confezione', 500],          // Grapes, bunch/bag

  // --- Meat & fish: pezzo (filetto / pesce piccolo intero) ---
  '171077': ['pezzi', 170],             // Chicken breast fillet
  '171098': ['pezzi', 170],             // Turkey breast fillet
  '173686': ['pezzi', 150],             // Salmon fillet
  salmone_selvaggio_it: ['pezzi', 150],
  '171955': ['pezzi', 150],             // Cod fillet
  orata_it: ['pezzi', 150],             // Sea bream fillet (mockup: 2 fillets ~300g)
  branzino_it: ['pezzi', 350],          // Sea bass, whole
  sgombro_it: ['pezzi', 250],           // Mackerel, whole
  mahi_mahi_it: ['pezzi', 170],
  halibut_it: ['pezzi', 180],
  '175154': ['pezzi', 250],             // Trout, whole
  platessa_it: ['pezzi', 150],
  nasello_it: ['pezzi', 150],
  barramundi_it: ['pezzi', 170],
  '173713': ['pezzi', 200],             // Whiting, whole
  rombo_it: ['pezzi', 180],
  aringa_it: ['pezzi', 150],
  anguilla_it: ['pezzi', 200],
  seppie_it: ['pezzi', 300],
  tonno_fresco_it: ['pezzi', 180],      // Tuna steak
  pollo_coscia_it: ['pezzi', 150],      // Chicken thigh
  anatra_petto_it: ['pezzi', 200],      // Duck breast
  vitello_it: ['pezzi', 120],           // Veal escalope
  vitello_magro_it: ['pezzi', 120],
  maiale_lonza_it: ['pezzi', 180],      // Pork loin chop
  '168249': ['pezzi', 180],

  // --- Meat & fish: confezione (macinato, pezzi grandi, vaschette) ---
  gamberetti_it: ['confezione', 300],   // Shrimp tray
  scampi_it: ['confezione', 300],
  vongole_it: ['confezione', 500],
  cozze_it: ['confezione', 500],
  polpo_it: ['confezione', 800],
  astice_it: ['confezione', 500],
  baccala_it: ['confezione', 400],
  salmone_affumicato_it: ['confezione', 100],
  bresaola_it: ['confezione', 100],
  turkey_bacon_us: ['confezione', 150],
  cinghiale_it: ['confezione', 400],
  canguro_it: ['confezione', 400],
  coniglio_it: ['confezione', 1200],
  maiale_macinato_magro_it: ['confezione', 400],
  tacchino_macinato_it: ['confezione', 400],
  manzo_magro_arg_it: ['confezione', 500],
  petto_manzo_magro_it: ['confezione', 600],
  '171796': ['confezione', 400],        // Ground beef
  fegato_vitello_it: ['confezione', 300],
  agnello_australiano_it: ['confezione', 400],

  // --- Dairy & eggs ---
  '171284': ['confezione', 500],        // Plain yogurt, tub
  '171304': ['confezione', 500],        // Greek yogurt, tub
  kefir_it: ['confezione', 500],
  '170848': ['confezione', 200],        // Parmesan wedge
  '171241': ['confezione', 200],        // Gouda
  '173420': ['confezione', 200],        // Feta (matches mockup)
  emmental_it: ['confezione', 200],
  sharp_cheddar_us: ['confezione', 200],
  ricotta_it: ['confezione', 250],
  pecorino_it: ['confezione', 200],
  formaggio_fresco_it: ['confezione', 200],
  panna_it: ['confezione', 200],

  // --- Pantry: confezione (bottiglie, buste, barattoli non gia' 'barattolo') ---
  '171413': ['confezione', 1000],       // Olive oil, 1 L bottle
  aceto_vino_it: ['confezione', 500],
  aceto_balsamico_it: ['confezione', 250],
  aceto_sherry_it: ['confezione', 250],
  tofu_it: ['confezione', 200],
  tempeh_it: ['confezione', 200],
  albicocche_secche_it: ['confezione', 200],
  acai_it: ['confezione', 100],
  semi_zucca_it: ['confezione', 200],
  anacardi_it: ['confezione', 200],
  anacardi_salt_it: ['confezione', 200],
  arachidi_crude_it: ['confezione', 200],
  '168162': ['confezione', 200],        // Prunes
  lenticchie_cotte_it: ['confezione', 400],
  piselli_spezzati_cotti_it: ['confezione', 400],
  piselli_spezzati_it: ['confezione', 500],
  fagioli_spagna_it: ['confezione', 400],
  fave_it: ['confezione', 400],
  polenta_it: ['confezione', 500],
  barbabietola_cotta_it: ['confezione', 400], // Beets, cooked, vacuum pack
  pasta_it: ['confezione', 500],              // voce generica, duplicato legacy
};

(async () => {
  let ok = 0, falliti = [];
  for (const [foodId, [unita, pezzo]] of Object.entries(MAPPA)) {
    const { error } = await supabase
      .from('foods')
      .update({ unita, peso_pezzo_g: pezzo })
      .eq('id', foodId);
    if (error) falliti.push({ foodId, error: error.message });
    else ok++;
  }
  console.log(`Aggiornati: ${ok}/${Object.keys(MAPPA).length}`);
  if (falliti.length) console.log('Falliti:', JSON.stringify(falliti, null, 2));
})();
