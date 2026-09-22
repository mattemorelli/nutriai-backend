// F0bis, blocco A — 6 primi vegani (asiatico-sudest, asia_generico) + 3
// contorni vegani (latino-chimichurri, argentina). Chiudono i due gradini
// 3b rimasti (primi asiatici, contorni argentini).
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const COMUNE_PRIMI = {
  meal_slot: 'primo', profilo: 'asiatico-sudest', famiglia: 'asiatica',
  paese: 'asia_generico', tecnica: 'semplice', ha_amido: true, ha_proteina: false,
  cucina: 'asiatica', occasione: 'quotidiano', base_amidacea: false,
  trasportabile: true, salsa_industriale: false,
};
const COMUNE_CONTORNI = {
  meal_slot: 'contorno', profilo: 'latino-chimichurri', famiglia: 'latina',
  paese: 'argentina', tecnica: 'semplice', ha_amido: false, ha_proteina: false,
  cucina: 'sud_americana', occasione: 'quotidiano', base_amidacea: false,
  trasportabile: true, salsa_industriale: false,
};

const PRIMI = [
  {
    name: 'Brown rice stir-fry with vegetables, lime and ginger',
    name_it: 'Riso integrale saltato con verdure, lime e zenzero',
    prep_min: 25, health_score: 8.0,
    ingredienti: [
      ['riso_integrale_cotto_it', 220], ['170393', 80], ['cavolo_cappuccio_it', 80], ['170419', 60],
      ['cipollotto_it', 40], ['zenzero_it', 10], ['169230', 5], ['lime_sudam_it', 25],
      ['salsa_soia_it', 12], ['olio_arachide_it', 12], ['coriandolo_it', 8],
    ],
    steps: [
      'Salta zenzero e aglio, poi carote, cavolo e piselli a fuoco vivo finché restano croccanti.',
      'Aggiungi il riso e la salsa di soia, premendolo contro le pareti del wok perché prenda colore.',
      'Spegni e completa con succo di lime, cipollotto e coriandolo.',
    ],
    steps_en: [
      "If you're using rice cooked the day before, break it up with your hands before stir-frying: cold rice separates, freshly cooked rice clumps.",
      'Cut the carrots into julienne, shred the cabbage finely and slice the spring onion.',
      'Heat the oil in a wok over high heat, add the chopped ginger and garlic and stir-fry for 30 seconds.',
      'Add the carrots, cabbage and peas and stir-fry for 3 minutes over high heat, then add the rice and soy sauce and stir-fry for another 3 minutes, pressing the rice against the sides of the wok so it colours.',
      'Take off the heat and finish with lime juice, spring onion and coriander.',
    ],
  },
  {
    name: 'Rice noodles with light coconut, lime and green beans',
    name_it: 'Spaghetti di riso al cocco leggero, lime e fagiolini',
    prep_min: 20, health_score: 7.9,
    ingredienti: [
      ['spaghetti_riso_it', 80], ['fagiolini_it', 120], ['latte_cocco_leggero_it', 80], ['170393', 60],
      ['lime_sudam_it', 25], ['zenzero_it', 8], ['169230', 5], ['salsa_soia_it', 10],
      ['olio_arachide_it', 10], ['basilico_thai_it', 8],
    ],
    steps: [
      'Ammolla gli spaghetti di riso in acqua calda finché flessibili, poi scolali.',
      'Cuoci fagiolini e carote, poi aggiungi latte di cocco e salsa di soia e porta a leggero bollore.',
      'Unisci gli spaghetti, fai assorbire il liquido e completa con lime e basilico thai.',
    ],
    steps_en: [
      'Soak the rice noodles in hot water for 8 minutes, until flexible but still firm in the middle, then drain.',
      'Top and tail the green beans and cut them into three; cut the carrots into batons.',
      'Heat the oil in a wide pan, add the chopped ginger and garlic and stir-fry for 30 seconds, then add the beans and carrots and cook for 4 minutes.',
      'Pour in the coconut milk and soy sauce, bring to a gentle simmer, add the noodles and cook for 2-3 minutes, stirring, until they absorb most of the liquid.',
      'Take off the heat and finish with lime juice and Thai basil.',
    ],
  },
  {
    name: 'Steamed jasmine rice with ginger, lime and fresh herbs',
    name_it: 'Riso jasmine al vapore con zenzero, lime ed erbe fresche',
    prep_min: 20, health_score: 7.9,
    ingredienti: [
      ['riso_jasmine_it', 80], ['zenzero_it', 12], ['lime_sudam_it', 25], ['cipollotto_it', 40],
      ['coriandolo_it', 10], ['menta_it', 6], ['olio_sesamo_it', 8], ['173468', 1],
    ],
    steps: [
      'Sciacqua il riso finché l\'acqua esce quasi limpida, poi cuocilo con zenzero grattugiato e sale.',
      'Lascia riposare coperto 5 minuti a fine cottura, perché il vapore residuo finisca il lavoro.',
      'Sgrana, condisci con olio di sesamo e lime, e completa con cipollotto, coriandolo e menta.',
    ],
    steps_en: [
      'Rinse the rice in cold water three times, until the water runs almost clear: this removes excess starch and keeps the grains separate.',
      'Put it in a pan with 120 g of cold water, the grated ginger and the salt, bring to the boil, cover and turn the heat to minimum.',
      'Cook for 12 minutes without ever lifting the lid, then turn off the heat and leave covered for a further 5 minutes: the residual steam finishes the cooking.',
      'Fluff with a fork and dress with the sesame oil and lime juice.',
      'Finish with sliced spring onion, coriander and hand-torn mint.',
    ],
  },
  {
    name: 'Soba noodles with lime, sesame and cucumber',
    name_it: 'Soba al lime, sesamo e cetriolo',
    prep_min: 15, health_score: 7.9,
    ingredienti: [
      ['soba_it', 80], ['168409', 100], ['170393', 60], ['cipollotto_it', 30], ['lime_sudam_it', 25],
      ['salsa_soia_it', 12], ['olio_sesamo_it', 10], ['semi_sesamo_it', 8], ['zenzero_it', 6],
    ],
    steps: [
      'Cuoci i soba in acqua non salata, poi sciacquali subito sotto acqua fredda strofinandoli per togliere l\'amido.',
      'Taglia cetriolo e carote a bastoncini sottili.',
      'Condisci i soba con salsa di soia, olio di sesamo, lime e zenzero grattugiato, unisci le verdure e i semi di sesamo tostati.',
    ],
    steps_en: [
      'Bring a large pan of UNSALTED water to the boil and cook the soba for the time on the packet, usually 4-5 minutes.',
      'Drain and rinse them immediately under cold water, rubbing them with your hands: removing the surface starch is what keeps them separate rather than sticky.',
      'Cut the cucumber and carrots into thin batons and slice the spring onion.',
      'In a bowl, mix the soy sauce, sesame oil, lime juice and grated ginger.',
      'Dress the soba with the sauce, add the vegetables and finish with toasted sesame seeds.',
    ],
  },
  {
    name: 'Cold rice vermicelli with herbs, lime and peanuts',
    name_it: 'Vermicelli di riso freddi con erbe, lime e arachidi',
    prep_min: 18, health_score: 8.2,
    ingredienti: [
      ['spaghetti_riso_it', 80], ['170393', 80], ['168409', 80], ['lattuga_it', 50], ['arachidi_crude_it', 25],
      ['lime_sudam_it', 30], ['salsa_soia_it', 10], ['zucchero_it', 3], ['169230', 4], ['peperoncino_it', 2],
      ['menta_it', 8], ['coriandolo_it', 8],
    ],
    steps: [
      'Ammolla i vermicelli in acqua bollente finché teneri, scolali e raffreddali sotto acqua corrente.',
      'Prepara il condimento sciogliendo lo zucchero nel lime, poi aggiungi salsa di soia, aglio e peperoncino.',
      'Componi la ciotola con vermicelli, verdure ed erbe, versa il condimento e completa con le arachidi tostate e tritate.',
    ],
    steps_en: [
      'Turn off the heat under a pan of boiling water, add the vermicelli and leave for 3-4 minutes until tender, then drain and cool under running water.',
      'Cut the carrots and cucumber into julienne and shred the lettuce.',
      'Make the dressing: dissolve the sugar in the lime juice, then add the soy sauce, very finely chopped garlic and chilli.',
      'Toast the peanuts in a dry pan for 3 minutes and chop them roughly.',
      'Build the bowl with the vermicelli, vegetables and herbs, pour over the dressing and finish with the chopped peanuts.',
    ],
  },
  {
    name: 'Pineapple fried rice with cashews and lime',
    name_it: "Riso saltato all'ananas, anacardi e lime",
    prep_min: 22, health_score: 7.9,
    ingredienti: [
      ['riso_jasmine_cotto_it', 220], ['ananas_it', 120], ['peperone_rosso_it', 80], ['cipollotto_it', 40],
      ['anacardi_it', 25], ['lime_sudam_it', 25], ['salsa_soia_it', 12], ['curry_it', 2],
      ['olio_arachide_it', 12], ['coriandolo_it', 8],
    ],
    contiene_frutta_secca: true,
    steps: [
      'Tosta gli anacardi a secco e tienili da parte.',
      'Salta il peperone, poi l\'ananas finché si caramella ai bordi.',
      'Unisci il riso, il curry e la salsa di soia, sgranando il riso; spegni e completa con lime, cipollotto, coriandolo e anacardi.',
    ],
    steps_en: [
      'Toast the cashews in a dry pan for 3 minutes, moving them often, and set aside.',
      'Cut the pineapple into 1 cm cubes and the pepper into strips.',
      'Heat the oil in the wok over high heat, add the pepper and stir-fry for 2 minutes, then add the pineapple and stir-fry for another 2 minutes until caramelised at the edges.',
      'Add the rice, curry powder and soy sauce and stir-fry for 3 minutes over high heat, breaking up the rice.',
      'Take off the heat and finish with lime juice, spring onion, coriander and the toasted cashews.',
    ],
  },
];

const CONTORNI = [
  {
    name: 'Griddled courgettes with chimichurri',
    name_it: 'Zucchine grigliate al chimichurri',
    prep_min: 15, health_score: 7.5,
    ingredienti: [
      ['169291', 250], ['171413', 12], ['prezzemolo_it', 10], ['171328', 2], ['169230', 4],
      ['172240', 10], ['171319', 1], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Griglia le fette di zucchina finché ben segnate.',
      'Prepara il chimichurri con prezzemolo, aglio, origano, peperoncino, aceto e olio.',
      'Versa il chimichurri sulle zucchine e lascia insaporire prima di servire.',
    ],
    steps_en: [
      'Cut the courgettes lengthways into 5 mm slices: thinner and they fall apart, thicker and they stay raw inside.',
      'Heat a pan over high heat, brush the slices with 4 g of oil and griddle for 3 minutes per side without moving them, until well marked.',
      'Make the chimichurri: chop the parsley and garlic and mix with the oregano, chilli flakes, vinegar and remaining 8 g of oil.',
      'Arrange the courgettes, spoon over the chimichurri, season with salt and pepper and let it sit for 5 minutes before serving.',
    ],
  },
  {
    name: 'Ensalada criolla',
    name_it: 'Ensalada criolla',
    prep_min: 10, health_score: 7.7,
    ingredienti: [
      ['170457', 120], ['peperone_rosso_it', 80], ['cipolla_rossa_it', 60], ['171413', 12],
      ['172240', 10], ['171328', 2], ['prezzemolo_it', 6], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Marina la cipolla rossa in acqua e aceto per toglierle il pungente.',
      'Taglia pomodoro e peperone a cubetti regolari e unisci alla cipolla scolata.',
      "Condisci con olio, aceto, origano, sale e pepe, e lascia riposare almeno 10 minuti.",
    ],
    steps_en: [
      'Slice the red onion thinly and leave it for 5 minutes in cold water with half the vinegar, so it loses its bite.',
      'Cut the tomato and pepper into even 1 cm dice.',
      'Drain the onion and combine with the other vegetables, the oil, remaining vinegar, oregano, salt and pepper.',
      "Stir and leave to rest for at least 10 minutes before serving: the resting is what makes it a criolla rather than just a salad.",
    ],
  },
  {
    name: 'Roast squash with oregano and vinegar',
    name_it: "Zucca arrosto all'origano e aceto",
    prep_min: 25, health_score: 7.5,
    ingredienti: [
      ['168448', 250], ['171413', 12], ['172240', 10], ['171328', 3], ['169230', 4],
      ['171319', 1], ['prezzemolo_it', 6], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Condisci la zucca a spicchi con olio, origano, aglio, sale e pepe e arrostisci in forno a 220°C.',
      'Gira a metà cottura finché i bordi si caramellano.',
      'Sforna e condisci ancora calda con aceto, peperoncino e prezzemolo.',
    ],
    steps_en: [
      'Heat the oven to 220 °C and cut the squash into 2 cm wedges.',
      'Toss with 8 g of oil, the oregano, crushed garlic, salt and pepper and spread on a tray in a single layer, without overlapping.',
      'Roast for 18-20 minutes, turning the wedges halfway, until the edges caramelise.',
      'Take out and dress while still hot with the vinegar, remaining oil, chilli flakes and parsley: hot squash absorbs vinegar far better.',
    ],
  },
];

async function inserisciTutti(comune, piatti) {
  const inseriti = [];
  for (const p of piatti) {
    const { data: dish, error } = await supabase.from('dishes').insert({
      ...comune,
      name: p.name_it, name_en: p.name,
      prep_min: p.prep_min, health_score: p.health_score,
      steps: p.steps, steps_en: p.steps_en,
      ...(p.contiene_frutta_secca ? { contiene_frutta_secca: true } : {}),
    }).select('id, name').single();
    if (error) throw new Error(`${p.name_it}: ${error.message}`);

    const righe = p.ingredienti.map(([food_id, grams]) => ({ dish_id: dish.id, food_id, grams }));
    const { error: e2 } = await supabase.from('dish_ingredients').insert(righe);
    if (e2) throw new Error(`${p.name_it} ingredienti: ${e2.message}`);

    inseriti.push(dish);
    console.log(`Inserito: ${dish.name} (${dish.id})`);
  }
  return inseriti;
}

(async () => {
  const primi = await inserisciTutti(COMUNE_PRIMI, PRIMI);
  const contorni = await inserisciTutti(COMUNE_CONTORNI, CONTORNI);
  console.log(`\n${primi.length}/6 primi inseriti, ${contorni.length}/3 contorni inseriti.`);
})();
