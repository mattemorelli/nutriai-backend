// F0bis, blocco 2/4 — 7 secondi vegani, profilo europeo-ricco, pool francia
// (chiude Francia).
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const COMUNE = {
  meal_slot: 'secondo', profilo: 'europeo-ricco', famiglia: 'mediterranea',
  paese: 'francia', tecnica: 'semplice', ha_proteina: true, ha_amido: false,
  cucina: 'europea', occasione: 'quotidiano', base_amidacea: false,
  trasportabile: false, salsa_industriale: false,
};

const PIATTI = [
  {
    name: 'Tofu and mushroom blanquette',
    name_it: 'Blanquette di tofu e funghi',
    prep_min: 25, health_score: 8.0,
    ingredienti: [
      ['172475', 170], ['funghi_champignon_it', 140], ['170393', 120], ['porro_it', 60],
      ['panna_avena_it', 60], ['vino_bianco_it', 50], ['171413', 12], ['succo_limone_it', 10],
      ['timo_it', 2], ['170917', 0.5], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Rosola il tofu a cubetti in padella finché si dora, tienilo da parte.',
      'Nella stessa padella cuoci porro, carote e funghi finché i funghi rilasciano l\'acqua, sfuma con il vino e riduci.',
      'Rimetti il tofu, aggiungi la panna vegetale e cuoci finché la salsa si addensa; il limone va a fuoco spento, dà l\'acidità tipica della blanquette.',
    ],
    steps_en: [
      'Press the tofu between two sheets of kitchen paper and cut it into 2.5 cm cubes. Cut the carrots into 5 mm rounds, the leek into rounds and quarter the mushrooms.',
      'Heat the oil in a pan over medium-high heat and brown the tofu cubes for 5 minutes, turning; remove and set aside.',
      'In the same pan cook the leek, carrots and mushrooms for 6 minutes, until the mushrooms release their water and it evaporates completely.',
      'Deglaze with the white wine, add thyme and bay and reduce for 3 minutes over high heat. Return the tofu, add the oat cream and cook for 5 minutes over low heat, until the sauce coats the back of a spoon.',
      "Turn off the heat, remove the bay leaf and add the lemon juice, salt and pepper. The lemon goes in off the heat: it's what gives a blanquette its characteristic sharpness.",
    ],
  },
  {
    name: 'White beans with mustard and white wine',
    name_it: 'Cannellini alla senape e vino bianco',
    prep_min: 15, health_score: 8.7,
    ingredienti: [
      ['fagioli_cannellini_it', 180], ['scalogno_it', 50], ['panna_avena_it', 50], ['senape_it', 12],
      ['vino_bianco_it', 60], ['171413', 12], ['timo_it', 3], ['prezzemolo_it', 8],
      ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Appassisci lo scalogno tritato in olio, sfuma con il vino bianco e riduci finché il liquido si dimezza.',
      'Unisci panna e senape, poi i cannellini sciacquati e scaldali nella salsa.',
      'Aggiusta di sale e pepe e completa con prezzemolo tritato.',
    ],
    steps_en: [
      'Finely chop the shallot.',
      'Heat the oil in a pan over medium heat and soften the shallot for 3 minutes without letting it colour.',
      'Deglaze with the white wine, add the thyme and reduce for 4 minutes, until the liquid has halved.',
      'Lower the heat, stir in the oat cream and mustard, then add the rinsed and drained cannellini beans and warm them through in the sauce for 4 minutes.',
      'Turn off the heat, season with salt and pepper and finish with chopped parsley.',
    ],
  },
  {
    name: 'Lentils and mushrooms forestière',
    name_it: 'Lenticchie e funghi alla forestière',
    prep_min: 20, health_score: 8.5,
    ingredienti: [
      ['lenticchie_cotte_it', 200], ['funghi_it', 150], ['scalogno_it', 50], ['169230', 4],
      ['171413', 15], ['vino_bianco_it', 50], ['prezzemolo_it', 10], ['timo_it', 2],
      ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Rosola i funghi a fuoco alto senza mescolarli troppo, finché dorano invece di bollire nella loro acqua.',
      'Aggiungi scalogno e aglio, sfuma con il vino e lascia evaporare, poi unisci le lenticchie.',
      'Condisci a crudo con olio, sale, pepe e molto prezzemolo tritato.',
    ],
    steps_en: [
      'Clean the mushrooms with a damp cloth rather than washing them under water, then cut them into thick slices.',
      'Heat 10 g of oil in a wide pan over high heat and cook the mushrooms for 6-7 minutes without stirring much: they should brown, not boil in their own liquid.',
      'Lower the heat, add the chopped shallot and crushed garlic and cook for 2 minutes.',
      'Deglaze with the wine, add the thyme, let it evaporate for 3 minutes, then add the rinsed lentils and heat through for 3 minutes.',
      'Turn off the heat and dress with the remaining oil, salt, pepper and a generous handful of chopped parsley.',
    ],
  },
  {
    name: 'Normandy-style chickpeas with apple and cider',
    name_it: 'Ceci alla normanda con mela e sidro',
    prep_min: 20, health_score: 7.7,
    ingredienti: [
      ['175206', 180], ['mela_it', 150], ['porro_it', 80], ['panna_avena_it', 50],
      ['sidro_secco_it', 60], ['171413', 12], ['senape_it', 6], ['timo_it', 2],
      ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Cuoci il porro finché morbido, poi rosola la mela a spicchi finché si segna ma resta intera.',
      'Sfuma con il sidro, riduci, poi aggiungi panna e senape mescolando.',
      'Unisci i ceci, scaldali nella salsa e completa con timo, sale e pepe.',
    ],
    steps_en: [
      'Cut the leek into rounds and the apple into 1 cm wedges, without peeling it.',
      'Heat the oil in a pan over medium heat and cook the leek for 4 minutes, until soft and translucent.',
      'Raise the heat, add the apple and brown for 3 minutes per side, until marked but still holding its shape.',
      'Deglaze with the cider and reduce for 4 minutes, then lower the heat and stir in the oat cream and mustard.',
      'Add the rinsed chickpeas, warm through in the sauce for 4 minutes, season with salt and pepper and finish with the thyme.',
    ],
  },
  {
    name: 'Borlotti and leek fricassée with tarragon',
    name_it: "Fricassea di borlotti e porri all'estragone",
    prep_min: 18, health_score: 8.2,
    ingredienti: [
      ['fagioli_borlotti_it', 180], ['porri_it', 200], ['panna_avena_it', 60], ['vino_bianco_it', 50],
      ['171413', 12], ['senape_it', 5], ['estragone_it', 5], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Cuoci i porri col coperchio finché si ammorbidiscono senza colorire, poi sfuma con il vino.',
      'Aggiungi panna e senape, poi i borlotti e scalda nella salsa.',
      "Spegni e aggiungi l'estragone solo alla fine: cotto perde subito il profumo di anice.",
    ],
    steps_en: [
      'Cut the leeks into 1 cm rounds, wash them in cold water to remove the grit between the layers and drain well.',
      'Heat the oil in a pan over medium heat, add the leeks and cook covered for 6 minutes, stirring occasionally, until soft but not coloured.',
      'Deglaze with the wine and let it evaporate for 3 minutes over high heat.',
      'Lower the heat, stir in the oat cream and mustard, then add the rinsed borlotti beans and cook for 4 minutes.',
      'Turn off the heat and add the chopped tarragon, salt and pepper. Tarragon goes in last: cooked, it loses its aniseed scent almost immediately.',
    ],
  },
  {
    name: 'Quick mushroom and red bean bourguignon',
    name_it: 'Bourguignon rapido di funghi e fagioli rossi',
    prep_min: 25, health_score: 8.2,
    ingredienti: [
      ['174285', 200], ['funghi_champignon_it', 150], ['170393', 150], ['170000', 60],
      ['vino_rosso_it', 80], ['concentrato_pomodoro_it', 15], ['171413', 15], ['169230', 4],
      ['timo_it', 2], ['170917', 0.5], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Rosola i funghi a fuoco alto senza mescolarli troppo, poi aggiungi cipolla, carote e aglio.',
      "Tosta il concentrato di pomodoro un minuto, sfuma con il vino rosso e fai sobbollire finché si riduce e diventa sciropposo.",
      'Unisci i fagioli rossi, scaldali e completa con sale, pepe e olio a crudo.',
    ],
    steps_en: [
      'Cut the carrots into thick rounds, dice the onion and halve the mushrooms, quartering them if large.',
      'Heat 10 g of oil in a pan over high heat and brown the mushrooms for 5 minutes without stirring much, until deeply golden.',
      'Add the onion, carrots and crushed garlic and cook for 4 minutes over medium heat.',
      'Stir in the tomato paste and toast it for 1 minute, then deglaze with the red wine, add thyme and bay and simmer for 8 minutes, until the liquid has halved and turned syrupy.',
      'Add the rinsed red beans, heat through for 3 minutes, remove the bay leaf and finish with salt, pepper and the remaining oil off the heat.',
    ],
  },
  {
    name: 'Cauliflower and broad bean gratin with cashew cream',
    name_it: 'Gratin di cavolfiore e fave con crema di anacardi',
    prep_min: 25, health_score: 8.2,
    contiene_frutta_secca: true,
    ingredienti: [
      ['cavolfiore_it', 200], ['fave_it', 180], ['anacardi_it', 35], ['acqua_it', 80],
      ['senape_it', 6], ['169230', 3], ['succo_limone_it', 8], ['171413', 10],
      ['noce_moscata_it', 0.3], ['erba_cipollina_it', 6], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Lessa cavolfiore e fave, poi scola bene.',
      "Frulla anacardi, acqua, senape, aglio, limone e noce moscata in una crema liscia.",
      'Versa la crema su cavolfiore e fave, irrora con olio e gratina in forno finché dora a chiazze.',
    ],
    steps_en: [
      'Heat the oven grill and break the cauliflower into 3 cm florets.',
      'Boil the florets in lightly salted water for 5 minutes, adding the broad beans for the last 2 minutes, then drain thoroughly.',
      'Blend the cashews with the water, mustard, garlic, lemon juice and nutmeg until smooth. If you have time, soak the cashews in hot water for 10 minutes first: the cream comes out far silkier.',
      'Arrange the cauliflower and broad beans in an oven dish, pour over the cream and fold gently so everything is coated.',
      'Drizzle with the oil and grill for 6-8 minutes, until the surface is browned in patches. Serve with pepper and snipped chives.',
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
      ...(p.contiene_frutta_secca ? { contiene_frutta_secca: true } : {}),
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
