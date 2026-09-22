// F0bis, blocco 3/4 — 7 secondi vegani, profilo asiatico-sudest, pool
// asia_generico (chiude Giappone, Cina, Thailandia, Corea, Vietnam).
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const COMUNE = {
  meal_slot: 'secondo', profilo: 'asiatico-sudest', famiglia: 'asiatica',
  paese: 'asia_generico', tecnica: 'semplice', ha_proteina: true, ha_amido: false,
  cucina: 'asiatica', occasione: 'quotidiano', base_amidacea: false,
  trasportabile: true, salsa_industriale: false,
};

const PIATTI = [
  {
    name: 'Lemongrass and lime tofu with green beans',
    name_it: 'Tofu al lime e citronella con fagiolini',
    prep_min: 20, health_score: 8.7,
    ingredienti: [
      ['172475', 170], ['fagiolini_it', 150], ['citronella_it', 15], ['lime_sudam_it', 30],
      ['169230', 5], ['zenzero_it', 8], ['salsa_soia_it', 12], ['olio_arachide_it', 12],
      ['coriandolo_it', 10], ['peperoncino_it', 3],
    ],
    steps: [
      'Rosola il tofu a cubetti finché dorato su più lati, tienilo da parte.',
      'Salta citronella, aglio, zenzero e peperoncino un minuto senza bruciarli, poi aggiungi i fagiolini scottati e la salsa di soia.',
      'Rimetti il tofu, spegni e condisci con succo di lime e coriandolo: il lime a fuoco spento, altrimenti perde il profumo.',
    ],
    steps_en: [
      'Press the tofu between two sheets of kitchen paper for 5 minutes and cut it into 2.5 cm cubes. Strip the tough outer layer from the lemongrass and finely chop only the tender white part.',
      'Top and tail the green beans and halve them. Blanch for 4 minutes in boiling water, then drain and refresh under cold water.',
      'Heat 8 g of oil in a wok or wide pan over high heat and brown the tofu cubes for 6 minutes, turning, until golden on several sides.',
      'Lower the heat, add the chopped lemongrass, garlic and ginger with the chilli, and stir-fry for 1 minute: any longer and they burn and turn bitter.',
      'Raise the heat again, add the green beans and soy sauce, stir-fry for 2 minutes, then take off the heat and finish with the lime juice, remaining oil and coriander. The lime goes in off the heat or it loses its aroma.',
    ],
  },
  {
    name: 'Coconut and lime tempeh with green beans',
    name_it: 'Tempeh al cocco e lime con fagiolini',
    prep_min: 22, health_score: 8.2,
    ingredienti: [
      ['tempeh_it', 160], ['fagiolini_it', 150], ['latte_cocco_leggero_it', 70], ['lime_sudam_it', 30],
      ['scalogno_it', 50], ['169230', 5], ['zenzero_it', 8], ['salsa_soia_it', 10],
      ['olio_arachide_it', 10], ['curcuma_it', 2], ['coriandolo_it', 10],
    ],
    steps: [
      'Rosola le fette di tempeh finché dorate e croccanti ai bordi, tienile da parte.',
      'Cuoci scalogno, aglio, zenzero e curcuma, poi aggiungi il latte di cocco e i fagiolini e cuoci coperto finché teneri.',
      'Rimetti il tempeh con la salsa di soia, scalda e completa con lime e coriandolo.',
    ],
    steps_en: [
      'Cut the tempeh into 1.5 cm slices. Top and tail the green beans and cut them into three.',
      'Heat the oil in a pan over medium-high heat and brown the tempeh slices for 4 minutes per side, until golden and crisp at the edges; remove and set aside.',
      'In the same pan cook the chopped shallot, garlic and ginger with the turmeric for 2 minutes over medium heat.',
      'Add the coconut milk and green beans, cover and cook for 6 minutes, until the beans are tender but still bright.',
      'Return the tempeh, add the soy sauce and heat through for 2 minutes, then take off the heat and finish with lime juice and coriander.',
    ],
  },
  {
    name: 'Ginger and lime edamame with cabbage and carrot',
    name_it: 'Edamame allo zenzero e lime con cavolo e carote',
    prep_min: 15, health_score: 8.5,
    ingredienti: [
      ['edamame_it', 180], ['cavolo_cappuccio_it', 120], ['170393', 100], ['cipollotto_it', 40],
      ['zenzero_it', 10], ['lime_sudam_it', 30], ['salsa_soia_it', 12], ['olio_sesamo_it', 8],
      ['olio_arachide_it', 6], ['semi_sesamo_it', 8],
    ],
    steps: [
      'Lessa gli edamame e tienili da parte.',
      'Salta lo zenzero, poi cavolo e carote a fuoco vivo finché restano croccanti, non appassiti.',
      'Unisci edamame e salsa di soia, spegni e condisci con lime, olio di sesamo, cipollotto e semi di sesamo.',
    ],
    steps_en: [
      'Boil the edamame for 4 minutes, drain and set aside.',
      'Shred the cabbage finely, cut the carrots into julienne and slice the spring onion into rounds.',
      'Heat the groundnut oil in a wok over high heat, add the grated ginger and stir-fry for 30 seconds.',
      'Add the cabbage and carrots and stir-fry for 3-4 minutes over high heat, stirring constantly: they should stay crisp, not wilt.',
      'Add the edamame and soy sauce, toss for 1 minute, then take off the heat and dress with lime juice, sesame oil, spring onion and toasted sesame seeds.',
    ],
  },
  {
    name: 'Quick red lentil, coconut and lime curry',
    name_it: 'Curry rapido di lenticchie rosse al cocco e lime',
    prep_min: 25, health_score: 8.2,
    ingredienti: [
      ['lenticchie_rosse_it', 90], ['spinaci_it', 120], ['latte_cocco_leggero_it', 80], ['170000', 60],
      ['169230', 5], ['zenzero_it', 10], ['lime_sudam_it', 30], ['curcuma_it', 2], ['170923', 2],
      ['olio_arachide_it', 12], ['coriandolo_it', 10], ['173468', 1], ['acqua_it', 250],
    ],
    steps: [
      'Soffriggi cipolla, aglio e zenzero, tosta curcuma e cumino.',
      'Aggiungi le lenticchie rosse e l\'acqua e cuoci finché si sfaldano in una crema morbida.',
      'Unisci latte di cocco e spinaci, spegni e completa con sale, lime e coriandolo.',
    ],
    steps_en: [
      'Rinse the red lentils under running water until the water runs clear.',
      'Heat the oil in a pan over medium heat and cook the chopped onion, garlic and ginger for 4 minutes, then add the turmeric and cumin and toast for 30 seconds.',
      'Add the lentils and 250 g of water, bring to the boil and cook for 12-14 minutes over medium-low heat, stirring occasionally: red lentils break down and should become a soft purée.',
      'Stir in the coconut milk and spinach and cook for 2 minutes, just until the spinach wilts.',
      "Take off the heat and add salt, lime juice and coriander. Taste: if it's too thick, loosen with a spoonful of hot water.",
    ],
  },
  {
    name: 'Chickpeas with coconut, squash and lime',
    name_it: 'Ceci al cocco, zucca e lime',
    prep_min: 25, health_score: 7.7,
    ingredienti: [
      ['175206', 180], ['168448', 150], ['latte_cocco_leggero_it', 80], ['cipollotto_it', 50],
      ['169230', 5], ['zenzero_it', 8], ['lime_sudam_it', 30], ['curcuma_it', 2], ['peperoncino_it', 3],
      ['olio_arachide_it', 12], ['coriandolo_it', 10], ['173468', 1], ['acqua_it', 100],
    ],
    steps: [
      'Soffriggi aglio, zenzero, peperoncino e curcuma, poi cuoci la zucca a cubetti finché si infilza.',
      'Unisci il latte di cocco e i ceci e cuoci scoperto finché il fondo si addensa.',
      'Aggiusta di sale e completa con lime, cipollotto e coriandolo.',
    ],
    steps_en: [
      'Cut the squash into 2 cm cubes and slice the spring onion.',
      'Heat the oil in a pan over medium heat, add the garlic, ginger, chilli and turmeric and cook for 1 minute.',
      'Add the squash and 100 g of water, cover and cook for 10 minutes, until the squash pierces easily but still holds together.',
      'Add the coconut milk and the rinsed chickpeas and cook uncovered for 6 minutes, until the sauce thickens slightly.',
      'Take off the heat, season with salt and finish with lime juice, spring onion and coriander.',
    ],
  },
  {
    name: 'Mung beans with lime, ginger and coriander',
    name_it: 'Fagioli mung al lime, zenzero e coriandolo',
    prep_min: 18, health_score: 8.5,
    ingredienti: [
      ['fagioli_mung_cotti_it', 200], ['170393', 120], ['fagiolini_it', 100], ['cipollotto_it', 50],
      ['zenzero_it', 10], ['169230', 5], ['lime_sudam_it', 30], ['salsa_soia_it', 12],
      ['olio_arachide_it', 12], ['coriandolo_it', 12], ['menta_it', 6],
    ],
    steps: [
      'Scotta carote e fagiolini insieme, poi raffreddali sotto acqua corrente.',
      'Salta zenzero e aglio, aggiungi carote, fagiolini e fagioli mung con la salsa di soia.',
      'Spegni e condisci con lime, cipollotto, coriandolo e menta spezzettata.',
    ],
    steps_en: [
      'Cut the carrots into thin batons and the green beans into three.',
      'Blanch them together for 4 minutes in boiling water, then drain and cool under running water to stop the cooking.',
      'Heat 8 g of oil in a wok over high heat, add the chopped ginger and garlic and stir-fry for 30 seconds.',
      'Add the carrots, green beans and rinsed mung beans, raise the heat and stir-fry for 3 minutes with the soy sauce.',
      'Take off the heat and dress with lime juice, the remaining oil, sliced spring onion, coriander and hand-torn mint.',
    ],
  },
  {
    name: 'Stir-fried soybeans with peppers, lime and cashews',
    name_it: 'Soia gialla saltata al lime con peperoni e anacardi',
    prep_min: 20, health_score: 8.9,
    ingredienti: [
      ['soia_gialla_cotta_it', 180], ['peperone_rosso_it', 150], ['cipollotto_it', 50], ['anacardi_it', 30],
      ['169230', 5], ['zenzero_it', 8], ['lime_sudam_it', 30], ['salsa_soia_it', 12],
      ['olio_arachide_it', 12], ['basilico_thai_it', 8], ['peperoncino_it', 3],
    ],
    steps: [
      'Tosta gli anacardi a secco e tienili da parte.',
      'Salta aglio, zenzero e peperoncino, poi il peperone, poi la soia con la salsa di soia.',
      'Spegni e aggiungi lime, cipollotto, basilico thai e anacardi: il basilico va a fuoco spento, cotto perde il profumo.',
    ],
    steps_en: [
      'Toast the cashews in a dry pan for 3 minutes over medium heat, moving them often, and set aside.',
      'Cut the pepper into strips and the spring onion into 3 cm lengths.',
      'Heat the oil in the same wok over high heat, add the garlic, ginger and chilli and stir-fry for 30 seconds.',
      'Add the pepper and stir-fry for 3 minutes over high heat, then add the rinsed soybeans and the soy sauce and continue for 3 minutes.',
      'Take off the heat and add the lime juice, spring onion, Thai basil and toasted cashews. Thai basil goes in off the heat: cooked, it loses its aniseed scent immediately.',
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
