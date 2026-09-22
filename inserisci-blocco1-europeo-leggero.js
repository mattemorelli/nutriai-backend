// F0bis, blocco 1/4 — 7 secondi vegani, profilo europeo-leggero, pool
// mediterraneo_generico (chiudono Italia, Francia, Portogallo).
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const COMUNE = {
  meal_slot: 'secondo', profilo: 'europeo-leggero', famiglia: 'mediterranea',
  paese: 'mediterraneo_generico', tecnica: 'semplice', ha_proteina: true, ha_amido: false,
  cucina: 'europea', occasione: 'quotidiano', base_amidacea: false,
  trasportabile: true, salsa_industriale: false,
};

const PIATTI = [
  {
    name: 'Mustard lentils with carrots and parsley',
    name_it: 'Lenticchie alla senape con carote e prezzemolo',
    prep_min: 20, health_score: 8.4,
    ingredienti: [
      ['lenticchie_cotte_it', 180], ['170393', 150], ['sedano_it', 60], ['170000', 50],
      ['171413', 15], ['senape_it', 10], ['aceto_vino_it', 10], ['prezzemolo_it', 10],
      ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Rosola cipolla, carote e sedano in poco olio finché le carote sono ancora sode.',
      'Scalda le lenticchie nella stessa padella, poi condisci con la salsina di senape, aceto e olio.',
      'Aggiungi prezzemolo, sale e pepe e servi tiepido.',
    ],
    steps_en: [
      'Cut the carrots into 5 mm rounds, the celery into thin slices and the onion as finely as possible.',
      'Heat 5 g of oil in a pan over medium heat, add onion, carrots and celery and cook for 8-10 minutes, stirring often: the carrots should pierce easily but stay firm.',
      'Rinse and drain the lentils, add them to the pan and heat through for 3 minutes.',
      'In a cup, whisk the mustard, vinegar and remaining 10 g of oil until the dressing thickens.',
      'Remove from the heat, pour over the dressing, add chopped parsley, salt and pepper, stir and serve warm.',
    ],
  },
  {
    name: 'Cannellini beans with red wine vinegar, onion and cherry tomatoes',
    name_it: "Cannellini all'aceto rosso con cipolla e pomodorini",
    prep_min: 12, health_score: 8.5,
    ingredienti: [
      ['fagioli_cannellini_it', 180], ['cipolla_rossa_it', 60], ['pomodorini_it', 150],
      ['171413', 15], ['172240', 12], ['prezzemolo_it', 10], ['171328', 1],
      ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      "Marina la cipolla rossa in acqua e aceto per toglierle l'asprezza.",
      'Unisci cannellini, pomodorini e cipolla scolata, condisci con olio, aceto rimasto e origano.',
      'Aggiungi prezzemolo, sale e pepe e lascia riposare 5 minuti prima di servire.',
    ],
    steps_en: [
      'Slice the red onion paper-thin and leave it for 5 minutes in cold water with half the vinegar: it loses its harshness and stays crisp.',
      'Halve the cherry tomatoes.',
      'Rinse and drain the cannellini beans and put them in a bowl with the tomatoes.',
      'Drain the onion and add it to the beans with the oil, remaining vinegar, oregano, salt and pepper.',
      "Fold gently so the beans don't break up, add the parsley and let it rest for 5 minutes before serving.",
    ],
  },
  {
    name: 'Roasted chickpeas with thyme, squash and balsamic',
    name_it: 'Ceci arrostiti al timo con zucca e balsamico',
    prep_min: 25, health_score: 7.7,
    ingredienti: [
      ['175206', 180], ['168448', 200], ['171413', 15], ['aceto_balsamico_it', 10],
      ['timo_it', 3], ['169230', 3], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Taglia la zucca a cubetti e asciuga bene i ceci: se restano umidi non diventano croccanti.',
      "Condisci entrambi con olio, timo e aglio e arrostisci in forno a 220°C per 18-20 minuti.",
      'Irrora con aceto balsamico e olio rimasto appena sfornati, servi subito.',
    ],
    steps_en: [
      'Heat the oven to 220 °C.',
      "Cut the squash into 2 cm cubes. Rinse the chickpeas and dry them thoroughly with a tea towel: if they stay damp they won't crisp.",
      'Toss squash and chickpeas with 10 g of oil, thyme, crushed garlic, salt and pepper, and spread them on a tray in a single layer without overlapping.',
      'Roast for 18-20 minutes, stirring halfway, until the squash is tender and the chickpeas are golden.',
      'Take out, drizzle with the balsamic vinegar and the remaining 5 g of oil, and serve straight away while the chickpeas are crisp.',
    ],
  },
  {
    name: 'Borlotti beans with roasted peppers, dill and mustard',
    name_it: 'Borlotti con peperoni arrostiti, aneto e senape',
    prep_min: 22, health_score: 8.4,
    ingredienti: [
      ['fagioli_borlotti_it', 180], ['peperone_rosso_it', 200], ['171413', 15],
      ['senape_it', 8], ['173469', 10], ['aneto_it', 8], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Arrostisci in padella le falde di peperone dal lato della pelle finché si ammorbidiscono.',
      "Prepara la salsina con senape, aceto di mele e l'olio rimasto.",
      "Unisci peperoni a strisce e borlotti, condisci con la salsina, l'aneto, sale e pepe.",
    ],
    steps_en: [
      'Cut the pepper into wide strips, removing the seeds and white inner ribs.',
      'Heat a non-stick pan with 5 g of oil and cook the strips skin-side down for 8-10 minutes over medium-high heat, until softened and lightly charred.',
      'Meanwhile, rinse and drain the borlotti beans.',
      'In a cup, whisk the mustard, cider vinegar and remaining 10 g of oil.',
      'Cut the peppers into strips, add them to the beans, dress with the sauce, chopped dill, salt and pepper, and serve warm.',
    ],
  },
  {
    name: 'Cider-glazed tofu with chives and apple',
    name_it: "Tofu all'aceto di mele con erba cipollina e mela",
    prep_min: 18, health_score: 8.4,
    ingredienti: [
      ['172475', 160], ['mela_it', 120], ['cipollotto_it', 40], ['171413', 12],
      ['173469', 12], ['senape_it', 6], ['erba_cipollina_it', 8], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Asciuga bene il tofu e rosolalo in padella finché dorato su più lati.',
      'Aggiungi mela a fettine e cipollotto e scalda un paio di minuti senza sfaldare la mela.',
      "Condisci con aceto di mele, senape, l'olio rimasto, sale, pepe ed erba cipollina.",
    ],
    steps_en: [
      'Press the tofu between two sheets of kitchen paper for 5 minutes, then cut it into 2 cm cubes.',
      'Heat 8 g of oil in a non-stick pan over medium-high heat and brown the cubes for 6-8 minutes, turning, until golden on at least three sides.',
      'Meanwhile slice the apple thinly without peeling it, and cut the spring onion into rounds.',
      'Lower the heat, add apple and spring onion to the tofu and cook for 2 minutes, just to warm the apple without letting it collapse.',
      'Turn off the heat, dress with the vinegar, mustard, remaining oil, salt, pepper and snipped chives, stir and serve.',
    ],
  },
  {
    name: 'Broad beans and peas with mint and white wine vinegar',
    name_it: 'Fave e piselli alla menta con aceto bianco',
    prep_min: 15, health_score: 8.7,
    ingredienti: [
      ['fave_it', 120], ['170419', 120], ['cipollotto_it', 40], ['171413', 15],
      ['aceto_vino_it', 10], ['menta_it', 6], ['scorza_limone_it', 2], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Sbianca fave e piselli in acqua bollente e raffredda subito in acqua fredda per mantenerne il colore.',
      'Salta il tutto con il cipollotto in padella per due minuti a fuoco vivo.',
      "Condisci con aceto, l'olio rimasto, menta spezzettata, scorza di limone, sale e pepe.",
    ],
    steps_en: [
      'Bring a pan of lightly salted water to the boil.',
      'Boil the broad beans and peas for 4-5 minutes, drain and run them straight under cold water: this stops the cooking and keeps the green colour.',
      'Slice the spring onion thinly and soften it for 2 minutes in a pan with 5 g of oil.',
      'Add the broad beans and peas and toss for 2 minutes over high heat.',
      'Take off the heat and dress with the vinegar, remaining oil, hand-torn mint, grated lemon zest, salt and pepper.',
    ],
  },
  {
    name: 'Lupini beans with fennel, orange and vinegar',
    name_it: 'Lupini con finocchi, arancia e aceto',
    prep_min: 12, health_score: 9.2,
    ingredienti: [
      ['lupini_it', 180], ['finocchio_it', 200], ['arancia_it', 100], ['171413', 15],
      ['aceto_vino_it', 10], ['prezzemolo_it', 8], ['pepe_nero_it', 1],
    ],
    steps: [
      'Sciacqua bene i lupini per eliminare il sale della salamoia.',
      'Unisci finocchio affettato e spicchi di arancia con il loro succo.',
      "Condisci con olio, aceto, pepe e prezzemolo, senza aggiungere sale.",
    ],
    steps_en: [
      'Rinse the lupini beans under running water for at least a minute and drain well: brined lupini are very salty and rinsing is essential.',
      'Slice the fennel thinly, setting the green fronds aside.',
      'Peel the orange to the flesh and cut out the segments, catching the juice in a bowl.',
      'Combine the lupini, fennel and orange segments.',
      'Dress with the oil, vinegar, the collected orange juice, pepper, chopped parsley and the fennel fronds. Do not add salt.',
    ],
  },
];

(async () => {
  const inseriti = [];
  for (const p of PIATTI) {
    const { data: dish, error } = await supabase.from('dishes').insert({
      ...COMUNE,
      name: p.name_it, name_en: p.name,
      prep_min: p.prep_min, health_score: p.health_score,
      steps: p.steps, steps_en: p.steps_en,
    }).select('id, name').single();
    if (error) throw new Error(`${p.name_it}: ${error.message}`);

    const righe = p.ingredienti.map(([food_id, grams]) => ({ dish_id: dish.id, food_id, grams }));
    const { error: e2 } = await supabase.from('dish_ingredients').insert(righe);
    if (e2) throw new Error(`${p.name_it} ingredienti: ${e2.message}`);

    inseriti.push(dish);
    console.log(`Inserito: ${dish.name} (${dish.id})`);
  }
  console.log(`\n${inseriti.length}/7 piatti inseriti.`);
})();
