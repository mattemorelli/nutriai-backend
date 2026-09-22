// F0bis, blocco B — 14 secondi vegani in centro_nord_generico: 7 profilo
// mediterraneo + 7 profilo europeo-leggero. Chiudono l'ultimo pool ancora
// in "regge solo con allentamento" al 100% delle volte (Germania/Regno
// Unito, mai un buco vero perche' la scala arriva sempre al gradino 3a).
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const COMUNE_A = {
  meal_slot: 'secondo', profilo: 'mediterraneo', famiglia: 'mediterranea',
  paese: 'centro_nord_generico', tecnica: 'semplice', ha_proteina: true, ha_amido: false,
  cucina: 'europea', occasione: 'quotidiano', base_amidacea: false,
  trasportabile: true, salsa_industriale: false,
};
const COMUNE_B = {
  meal_slot: 'secondo', profilo: 'europeo-leggero', famiglia: 'mediterranea',
  paese: 'centro_nord_generico', tecnica: 'semplice', ha_proteina: true, ha_amido: false,
  cucina: 'europea', occasione: 'quotidiano', base_amidacea: false,
  trasportabile: true, salsa_industriale: false,
};

const GRUPPO_A = [
  {
    name: 'Rosemary chickpeas with cherry tomatoes and spinach',
    name_it: 'Ceci al rosmarino con pomodorini e spinaci',
    prep_min: 18, health_score: 7.9,
    ingredienti: [
      ['175206', 180], ['pomodorini_it', 150], ['spinaci_it', 100], ['169230', 5], ['rosmarino_it', 3],
      ['171413', 15], ['limone_it', 20], ['171319', 1], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Scalda aglio, rosmarino e peperoncino in olio, poi rosola i pomodorini finché rilasciano il sugo.',
      'Unisci i ceci e scaldali, poi gli spinaci finché appassiscono.',
      "Spegni e condisci con limone a fuoco spento: aiuta ad assorbire il ferro di ceci e spinaci.",
    ],
    steps_en: [
      'Halve the cherry tomatoes and finely chop the rosemary.',
      'Heat 10 g of oil in a pan over medium heat with the crushed garlic, rosemary and chilli flakes, and let it infuse for 1 minute without letting the garlic burn.',
      'Add the tomatoes and cook for 5 minutes over high heat, crushing a few with a spoon so they release their juice.',
      'Add the rinsed chickpeas and heat through for 4 minutes, then add the spinach and cook for 2 minutes until wilted.',
      'Take off the heat and dress with lemon juice, the remaining oil, salt and pepper. The lemon off the heat helps the iron in the chickpeas and spinach be absorbed.',
    ],
  },
  {
    name: 'Thyme lentils with courgettes and lemon',
    name_it: 'Lenticchie al timo con zucchine e limone',
    prep_min: 20, health_score: 8.4,
    ingredienti: [
      ['lenticchie_cotte_it', 180], ['169291', 180], ['170000', 50], ['169230', 5], ['timo_it', 3],
      ['171413', 15], ['limone_it', 25], ['prezzemolo_it', 8], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Rosola le zucchine finché dorate ai lati, poi aggiungi cipolla, aglio e timo.',
      'Unisci le lenticchie e scaldale.',
      'Spegni e condisci con limone, olio, prezzemolo, sale e pepe.',
    ],
    steps_en: [
      'Cut the courgettes into 5 mm half-moons and slice the onion thinly.',
      'Heat 10 g of oil in a pan over medium-high heat and cook the courgettes for 6 minutes without stirring much, until golden at the edges.',
      'Lower the heat, add the onion, chopped garlic and thyme and cook for 3 minutes.',
      'Add the rinsed lentils and heat through for 3 minutes.',
      'Take off the heat and dress with lemon juice and zest, the remaining oil, parsley, salt and pepper.',
    ],
  },
  {
    name: 'Garlic and sage cannellini with cavolo nero',
    name_it: "Cannellini all'aglio e salvia con cavolo nero",
    prep_min: 20, health_score: 8.9,
    ingredienti: [
      ['fagioli_cannellini_it', 180], ['kale_it', 180], ['169230', 6], ['salvia_it', 3], ['171413', 15],
      ['171319', 1], ['limone_it', 20], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Lessa il cavolo nero, tenendo da parte un po\' di acqua di cottura.',
      "Insaporisci olio con aglio, salvia e peperoncino, poi unisci cavolo e cannellini con l'acqua tenuta da parte.",
      "Spegni e condisci con limone, sale e pepe.",
    ],
    steps_en: [
      'Strip out the tough central rib of the cavolo nero and shred the leaves.',
      'Boil them in lightly salted water for 5 minutes, then drain, keeping two spoonfuls of the cooking water.',
      'Heat 10 g of oil in a pan with the sliced garlic, sage and chilli flakes, and infuse for 2 minutes over low heat.',
      'Add the cavolo nero and the rinsed cannellini with the reserved cooking water, and cook for 4 minutes, crushing a few beans with a spoon to thicken the sauce.',
      'Take off the heat and dress with lemon juice, the remaining oil, salt and pepper.',
    ],
  },
  {
    name: 'Herb tofu with peppers and olives',
    name_it: 'Tofu alle erbe con peperoni e olive',
    prep_min: 22, health_score: 8.4,
    ingredienti: [
      ['172475', 170], ['peperone_rosso_it', 150], ['169094', 30], ['cipolla_rossa_it', 50], ['169230', 5],
      ['171328', 2], ['basilico_it', 8], ['171413', 15], ['limone_it', 20], ['pepe_nero_it', 1],
    ],
    steps: [
      'Rosola il tofu finché dorato, tienilo da parte.',
      'Cuoci peperone e cipolla, poi rimetti il tofu con aglio, origano e olive.',
      'Spegni e completa con basilico, limone e pepe. Niente sale: le olive ne portano già.',
    ],
    steps_en: [
      'Press the tofu between two sheets of kitchen paper for 5 minutes and cut into 2.5 cm cubes. Cut the pepper into strips and the onion into rings.',
      'Heat 10 g of oil in a pan over medium-high heat and brown the tofu for 6 minutes, turning; remove and set aside.',
      'In the same pan cook the pepper and onion for 7 minutes, until the pepper softens.',
      'Return the tofu, add the chopped garlic, oregano and pitted olives and heat for 2 minutes.',
      'Take off the heat and finish with hand-torn basil, lemon juice, the remaining oil and pepper. Add no salt: the olives bring enough.',
    ],
  },
  {
    name: 'Broad beans and peas with basil and tomato',
    name_it: 'Fave e piselli al basilico con pomodoro',
    prep_min: 18, health_score: 8.2,
    ingredienti: [
      ['fave_it', 120], ['170419', 120], ['pomodorini_it', 150], ['cipollotto_it', 50], ['169230', 5],
      ['171413', 15], ['basilico_it', 10], ['limone_it', 20], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Lessa fave e piselli e raffreddali sotto acqua corrente.',
      'Cuoci i pomodorini con aglio, poi unisci fave, piselli e cipollotto.',
      'Spegni e completa con basilico, limone, sale e pepe.',
    ],
    steps_en: [
      'Boil the broad beans and peas for 4-5 minutes in lightly salted water, drain and refresh under cold water to keep their colour.',
      'Halve the cherry tomatoes and slice the spring onion.',
      'Heat 10 g of oil in a pan over medium heat with the crushed garlic, add the tomatoes and cook for 5 minutes.',
      'Add the broad beans, peas and spring onion and toss for 3 minutes over high heat.',
      'Take off the heat and finish with torn basil, lemon juice, the remaining oil, salt and pepper.',
    ],
  },
  {
    name: 'Baked borlotti with aubergine and oregano',
    name_it: 'Borlotti al forno con melanzane e origano',
    prep_min: 25, health_score: 8.5,
    ingredienti: [
      ['fagioli_borlotti_it', 180], ['melanzana_it', 180], ['passata_pomodoro_it', 80], ['170000', 50], ['169230', 5],
      ['171328', 3], ['171413', 15], ['prezzemolo_it', 8], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Arrostisci le melanzane a cubetti in forno.',
      'Prepara il sugo con cipolla, aglio, passata e origano, poi unisci i borlotti.',
      'Aggiungi le melanzane arrostite, aggiusta di sale e pepe e completa con prezzemolo.',
    ],
    steps_en: [
      'Heat the oven to 220 °C and cut the aubergine into 2 cm cubes.',
      'Toss with 10 g of oil, salt and pepper and spread on a tray in a single layer; roast for 15 minutes.',
      'Meanwhile heat the remaining oil in a pan and cook the chopped onion and garlic for 3 minutes, then add the passata and oregano and simmer for 5 minutes.',
      'Add the rinsed borlotti to the sauce and cook for 3 minutes.',
      'Fold in the roasted aubergine, season with salt and pepper and finish with parsley.',
    ],
  },
  {
    name: 'Lupini beans with broccoli, garlic and chilli',
    name_it: 'Lupini con broccoli, aglio e peperoncino',
    prep_min: 15, health_score: 9.2,
    ingredienti: [
      ['lupini_it', 180], ['170379', 200], ['169230', 6], ['171319', 2], ['171413', 15],
      ['limone_it', 25], ['prezzemolo_it', 8], ['pepe_nero_it', 1],
    ],
    steps: [
      'Sciacqua bene i lupini per eliminare il sale della salamoia.',
      'Lessa i broccoli, poi saltali con aglio e peperoncino e aggiungi i lupini.',
      'Spegni e condisci con limone, olio, prezzemolo e pepe. Niente sale.',
    ],
    steps_en: [
      'Rinse the lupini under running water for at least a minute and drain well: brined lupini are very salty.',
      'Break the broccoli into small florets and boil for 4 minutes, then drain.',
      'Heat 10 g of oil in a pan with the sliced garlic and chilli flakes for 1 minute over low heat.',
      'Raise the heat, add the broccoli and toss for 3 minutes, then add the lupini and heat through for 2 minutes.',
      'Take off the heat and dress with lemon juice, the remaining oil, parsley and pepper. No salt.',
    ],
  },
];

const GRUPPO_B = [
  {
    name: 'Mustard lentils with leeks and dill',
    name_it: 'Lenticchie alla senape con porri e aneto',
    prep_min: 20, health_score: 8.5,
    ingredienti: [
      ['lenticchie_cotte_it', 180], ['porri_it', 180], ['senape_it', 12], ['aceto_vino_it', 12], ['171413', 15],
      ['aneto_it', 8], ['170917', 0.5], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Cuoci i porri con alloro finché morbidi senza colorire.',
      'Aggiungi le lenticchie, poi la salsina di senape, aceto e olio.',
      'Spegni, togli l\'alloro e completa con aneto, sale e pepe.',
    ],
    steps_en: [
      'Cut the leeks into 1 cm rounds and wash them in cold water to remove the grit between the layers.',
      'Heat 5 g of oil in a pan over medium heat, add the leeks and bay leaf, cover and cook for 8 minutes, stirring occasionally, until soft but not coloured.',
      'Add the rinsed lentils and heat through for 3 minutes, then remove the bay leaf.',
      'Whisk the mustard, vinegar and remaining 10 g of oil into a thick dressing.',
      'Take off the heat, pour over the dressing, add chopped dill, salt and pepper and stir.',
    ],
  },
  {
    name: 'Red beans with cider vinegar, red cabbage and apple',
    name_it: 'Fagioli rossi all\'aceto di mele con cavolo rosso e mela',
    prep_min: 22, health_score: 8.0,
    ingredienti: [
      ['174285', 180], ['cavolo_rosso_it', 180], ['mela_it', 100], ['170000', 50], ['173469', 15],
      ['171413', 15], ['prezzemolo_it', 8], ['170917', 0.5], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Cuoci il cavolo rosso con alloro e metà aceto: l\'aceto tiene vivo il colore viola.',
      'Aggiungi mela e fagioli.',
      'Spegni, togli l\'alloro e condisci con l\'aceto rimasto, olio, prezzemolo, sale e pepe.',
    ],
    steps_en: [
      'Shred the red cabbage finely, slice the apple without peeling it and slice the onion thinly.',
      'Heat 10 g of oil in a pan over medium heat and cook the onion for 3 minutes.',
      'Add the red cabbage, bay leaf and half the vinegar, cover and cook for 10 minutes: the vinegar also keeps the purple colour bright, otherwise it turns grey.',
      'Add the apple and the rinsed beans and cook uncovered for 4 minutes.',
      'Take off the heat, remove the bay leaf and dress with the remaining vinegar and oil, parsley, salt and pepper.',
    ],
  },
  {
    name: 'Split peas with dill, carrots and mustard',
    name_it: 'Piselli spezzati all\'aneto con carote e senape',
    prep_min: 25, health_score: 8.5,
    ingredienti: [
      ['piselli_spezzati_cotti_it', 180], ['170393', 150], ['170000', 50], ['senape_it', 10], ['aceto_vino_it', 10],
      ['171413', 15], ['aneto_it', 8], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Cuoci carote e cipolla col coperchio finché tenere.',
      'Unisci i piselli spezzati, schiacciandone una parte per legare.',
      'Spegni e condisci con la salsina di senape e aceto, aneto, sale e pepe.',
    ],
    steps_en: [
      'Cut the carrots into 5 mm rounds and dice the onion.',
      'Heat 5 g of oil in a pan over medium heat and cook the carrots and onion covered for 10 minutes, stirring occasionally, until the carrots are tender.',
      'Add the split peas and heat through for 4 minutes, mashing some with a spoon to bind the dish.',
      'Whisk the mustard, vinegar and remaining 10 g of oil.',
      'Take off the heat and dress with the sauce, chopped dill, salt and pepper.',
    ],
  },
  {
    name: 'Horseradish tofu with chives and cucumber',
    name_it: 'Tofu al rafano ed erba cipollina con cetriolo',
    prep_min: 18, health_score: 8.2,
    ingredienti: [
      ['172475', 170], ['168409', 150], ['173472', 8], ['aceto_vino_it', 12], ['171413', 14],
      ['erba_cipollina_it', 10], ['aneto_it', 6], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Rosola il tofu a fette finché si stacca da solo dalla padella.',
      'Mescola rafano, aceto e olio in una salsa liscia.',
      'Disponi tofu e cetriolo, versa la salsa e completa con erba cipollina, aneto, sale e pepe.',
    ],
    steps_en: [
      'Press the tofu between two sheets of kitchen paper for 5 minutes and cut it into 1.5 cm slices.',
      'Heat 8 g of oil in a non-stick pan over medium-high heat and brown the slices for 4 minutes per side, without moving them until they release by themselves.',
      'Cut the cucumber into thin half-moons.',
      'Mix the horseradish, vinegar and remaining 6 g of oil into a smooth sauce.',
      'Arrange the tofu and cucumber, spoon over the horseradish sauce and finish with snipped chives, dill, salt and pepper.',
    ],
  },
  {
    name: 'Butter beans with caraway and white cabbage',
    name_it: 'Fagioli di Spagna al kümmel con cavolo cappuccio',
    prep_min: 20, health_score: 8.4,
    ingredienti: [
      ['fagioli_spagna_it', 180], ['cavolo_cappuccio_it', 180], ['170000', 50], ['kummel_it', 3], ['aceto_vino_it', 12],
      ['171413', 15], ['prezzemolo_it', 8], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Cuoci cipolla e kümmel finché i semi profumano.',
      'Aggiungi il cavolo e un po\' d\'acqua, cuoci coperto finché tenero.',
      'Unisci i fagioli, condisci con aceto, olio, prezzemolo, sale e pepe.',
    ],
    steps_en: [
      'Shred the cabbage finely and slice the onion thinly.',
      'Heat 10 g of oil in a pan over medium heat, add the onion and caraway and cook for 2 minutes until the seeds become fragrant.',
      'Add the cabbage and 50 g of water, cover and cook for 10 minutes, until tender but not collapsed.',
      'Add the rinsed beans and cook uncovered for 3 minutes so the water evaporates.',
      'Take off the heat and dress with the vinegar, remaining oil, parsley, salt and pepper.',
    ],
  },
  {
    name: 'Chickpeas with beetroot, vinegar and dill',
    name_it: "Ceci all'aceto con barbabietola e aneto",
    prep_min: 15, health_score: 7.9,
    ingredienti: [
      ['175206', 180], ['barbabietola_cotta_it', 150], ['cipolla_rossa_it', 50], ['172240', 12], ['senape_it', 8],
      ['171413', 15], ['aneto_it', 10], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Marina la cipolla rossa in acqua e aceto.',
      'Unisci ceci, barbabietola a cubetti e cipolla scolata.',
      'Condisci con la salsina di senape e aceto, aneto, sale e pepe. Mescola all\'ultimo, altrimenti la barbabietola colora tutto.',
    ],
    steps_en: [
      'Slice the red onion thinly and leave it for 5 minutes in cold water with half the vinegar.',
      'Cut the beetroot into 1.5 cm cubes.',
      'Whisk the mustard, remaining vinegar and oil into a thick dressing.',
      'Combine the rinsed chickpeas, beetroot and drained onion in a bowl.',
      'Dress, add chopped dill, salt and pepper and leave for 5 minutes. Stir at the last moment, or the beetroot turns everything pink.',
    ],
  },
  {
    name: 'Mustard tempeh with Brussels sprouts',
    name_it: 'Tempeh alla senape con cavolini di Bruxelles',
    prep_min: 25, health_score: 8.4,
    ingredienti: [
      ['tempeh_it', 160], ['cavolini_it', 200], ['senape_it', 12], ['173469', 12], ['171413', 15],
      ['scalogno_it', 50], ['timo_it', 3], ['prezzemolo_it', 8], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Arrostisci i cavolini col lato tagliato verso il basso, perché caramellino invece di appassire.',
      'Rosola il tempeh con scalogno e timo.',
      'Unisci i cavolini, condisci con la salsina di senape e aceto di mele, aggiungi prezzemolo e servi subito.',
    ],
    steps_en: [
      'Heat the oven to 220 °C. Halve the Brussels sprouts and cut the tempeh into 2 cm cubes.',
      "Toss the sprouts with 8 g of oil, salt and pepper and spread them on the tray cut-side down: that's what makes them caramelise rather than wilt. Roast for 18 minutes.",
      'Meanwhile heat a pan with 4 g of oil and brown the tempeh for 4 minutes per side with the sliced shallot and thyme.',
      'Whisk the mustard, cider vinegar and remaining 3 g of oil.',
      'Add the roasted sprouts to the tempeh, dress with the sauce, add the parsley and serve immediately.',
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
  const a = await inserisciTutti(COMUNE_A, GRUPPO_A);
  const b = await inserisciTutti(COMUNE_B, GRUPPO_B);
  console.log(`\n${a.length}/7 mediterraneo inseriti, ${b.length}/7 europeo-leggero inseriti.`);
})();
