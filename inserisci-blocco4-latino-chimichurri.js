// F0bis, blocco 4/4 — 6 secondi vegani, profilo latino-chimichurri, pool
// argentina (chiude Argentina). Chimichurri/salsa criolla NON creati come
// voci uniche in foods: elencati i loro ingredienti singoli (prezzemolo,
// aglio, aceto, olio, origano, peperoncino/pomodoro/peperone/cipolla), come
// da istruzione esplicita.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const COMUNE = {
  meal_slot: 'secondo', profilo: 'latino-chimichurri', famiglia: 'latina',
  paese: 'argentina', tecnica: 'semplice', ha_proteina: true, ha_amido: false,
  cucina: 'sud_americana', occasione: 'quotidiano', base_amidacea: false,
  trasportabile: true, salsa_industriale: false,
};

const PIATTI = [
  {
    name: 'Quick lentil stew with squash and peppers',
    name_it: 'Guiso rapido di lenticchie con zucca e peperoni',
    prep_min: 25, health_score: 8.2,
    ingredienti: [
      ['lenticchie_cotte_it', 200], ['168448', 150], ['peperone_rosso_it', 100], ['170000', 60],
      ['passata_pomodoro_it', 80], ['171413', 12], ['169230', 5], ['171329', 3], ['170923', 2],
      ['171328', 2], ['170917', 0.5], ['173468', 1], ['pepe_nero_it', 1], ['acqua_it', 150],
    ],
    steps: [
      "Soffriggi cipolla e peperone, poi tosta aglio e spezie senza bruciarle.",
      'Aggiungi zucca, passata, alloro e acqua e cuoci finché la zucca si infilza senza sfaldarsi.',
      'Unisci le lenticchie, fai addensare il fondo e aggiusta di sale e pepe.',
    ],
    steps_en: [
      'Cut the squash into 2 cm cubes, the pepper into strips and the onion into small dice.',
      'Heat the oil in a pan over medium heat and cook the onion and pepper for 5 minutes, until softened.',
      "Add the chopped garlic, paprika, cumin and oregano and toast for 40 seconds: ground spices burn quickly, don't leave them alone on the hot base.",
      'Add the squash, passata, bay leaf and 150 g of water, cover and cook for 12 minutes, until the squash pierces easily but holds its shape.',
      'Add the rinsed lentils, uncover and cook for 4 minutes so the sauce thickens, then remove the bay leaf and season with salt and pepper.',
    ],
  },
  {
    name: 'White beans with squash and chimichurri',
    name_it: 'Porotos bianchi alla zucca con chimichurri',
    prep_min: 20, health_score: 8.7,
    ingredienti: [
      ['fagioli_cannellini_it', 180], ['168448', 150], ['170000', 50], ['171413', 15],
      ['prezzemolo_it', 12], ['171328', 3], ['169230', 5], ['172240', 12], ['171319', 2],
      ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Griglia zucca e cipolla finché si segnano.',
      "Prepara il chimichurri: prezzemolo e aglio tritati, origano, peperoncino, aceto e olio; lascia riposare.",
      'Scalda i fagioli nella stessa padella, impiatta tutto e versa sopra il chimichurri.',
    ],
    steps_en: [
      'Cut the squash into 1 cm slices and the onion into thick rings.',
      'Heat a pan over medium-high heat with 5 g of oil and griddle the squash and onion for 4 minutes per side, until marked and the squash is tender.',
      "Make the chimichurri: finely chop the parsley and garlic, put them in a bowl with the oregano, chilli flakes, vinegar and remaining 10 g of oil, and stir. Let it rest for 5 minutes so the garlic gives its flavour to the vinegar.",
      'Rinse and drain the white beans and warm them for 2 minutes in the same pan, picking up the cooking residues.',
      'Plate the squash, onion and beans, spoon over the chimichurri and season with salt and pepper.',
    ],
  },
  {
    name: 'Chickpeas and grilled aubergine with salsa criolla',
    name_it: 'Ceci e melanzane grigliate con salsa criolla',
    prep_min: 25, health_score: 8.0,
    ingredienti: [
      ['175206', 180], ['melanzana_it', 150], ['170457', 80], ['peperone_rosso_it', 80],
      ['cipolla_rossa_it', 50], ['171413', 15], ['172240', 10], ['171328', 2],
      ['prezzemolo_it', 8], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Prepara la salsa criolla (pomodoro, peperone, cipolla rossa a cubetti con aceto, olio, origano) e lasciala insaporire.',
      'Griglia le fette di melanzana finché morbide al centro.',
      'Scalda i ceci nella stessa padella, impiatta con le melanzane, copri con la salsa criolla e il prezzemolo.',
    ],
    steps_en: [
      'Cut the aubergine into 1.5 cm slices.',
      'Make the salsa criolla: dice the tomato, pepper and red onion into 5 mm cubes, put them in a bowl with the vinegar, 8 g of oil, oregano, salt and pepper, and leave to rest while you cook the rest. It needs at least 10 minutes to come together.',
      'Heat a pan over high heat with the remaining 7 g of oil and griddle the aubergine slices for 4 minutes per side, until well marked and soft in the middle.',
      'Rinse and drain the chickpeas and warm them for 3 minutes in the pan after the aubergine.',
      'Arrange the aubergine and chickpeas on the plate, cover with the salsa criolla and finish with parsley.',
    ],
  },
  {
    name: 'Black beans and grilled portobello with coriander chimichurri',
    name_it: 'Fagioli neri e portobello grigliati con chimichurri al coriandolo',
    prep_min: 20, health_score: 8.7,
    ingredienti: [
      ['fagioli_neri_it', 180], ['funghi_portobello_it', 150], ['171413', 15], ['coriandolo_it', 12],
      ['prezzemolo_it', 8], ['169230', 5], ['172240', 12], ['171319', 2], ['170923', 2],
      ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Griglia i portobello a fette finché ben dorati.',
      'Prepara il chimichurri al coriandolo: coriandolo, prezzemolo e aglio tritati con aceto, cumino, peperoncino e olio.',
      'Aggiungi i fagioli neri in padella, spegni, versa il chimichurri e servi subito.',
    ],
    steps_en: [
      'Clean the portobellos with a damp cloth, remove the woody stem and cut the caps into thick slices.',
      'Heat a pan over high heat with 5 g of oil and griddle the mushrooms for 4 minutes per side without moving them, until deeply golden.',
      'Make the coriander chimichurri: chop the coriander, parsley and garlic and mix with the vinegar, cumin, chilli flakes and remaining 10 g of oil.',
      'Add the rinsed black beans to the pan and heat through for 3 minutes with the mushrooms.',
      'Turn off the heat, pour the chimichurri straight into the pan off the heat, stir once and serve immediately, with salt and pepper.',
    ],
  },
  {
    name: 'Griddled tofu with chimichurri and roasted peppers',
    name_it: 'Tofu grigliato al chimichurri con peperoni arrostiti',
    prep_min: 22, health_score: 8.4,
    ingredienti: [
      ['172475', 170], ['peperone_rosso_it', 150], ['171413', 15], ['prezzemolo_it', 12],
      ['171328', 3], ['169230', 5], ['172240', 12], ['171319', 2], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Griglia le falde di peperone, poi il tofu finché non si stacca da solo dalla griglia.',
      'Prepara il chimichurri: prezzemolo e aglio tritati con origano, peperoncino, aceto e olio.',
      'Affetta i peperoni, disponi con il tofu e versa sopra il chimichurri.',
    ],
    steps_en: [
      'Press the tofu between two sheets of kitchen paper for 5 minutes, then cut it into 1.5 cm slices: the thicker they are, the less they break on the griddle.',
      'Cut the pepper into wide strips and remove the seeds and white ribs.',
      'Heat a pan over high heat with 5 g of oil, griddle the pepper strips skin-side down for 8 minutes, then remove them and griddle the tofu for 4 minutes per side, without moving it until it releases by itself.',
      'Make the chimichurri: chop the parsley and garlic, mix with the oregano, chilli flakes, vinegar and remaining 10 g of oil, and let it rest for 5 minutes.',
      'Cut the peppers into strips, arrange with the tofu and spoon over the chimichurri, with salt and pepper.',
    ],
  },
  {
    name: 'Broad beans with oregano, vinegar, carrots and red onion',
    name_it: "Fave all'origano e aceto con carote e cipolla rossa",
    prep_min: 15, health_score: 8.4,
    ingredienti: [
      ['fave_it', 180], ['170393', 120], ['cipolla_rossa_it', 50], ['171413', 15], ['172240', 12],
      ['171328', 3], ['prezzemolo_it', 10], ['169230', 4], ['171319', 1], ['173468', 1], ['pepe_nero_it', 1],
    ],
    steps: [
      'Marina la cipolla rossa in acqua e aceto per toglierle il pungente.',
      'Lessa fave e carote insieme, poi raffreddale sotto acqua corrente.',
      'Condisci tutto con aglio, origano, peperoncino, aceto, olio e prezzemolo.',
    ],
    steps_en: [
      'Slice the red onion thinly and leave it for 5 minutes in cold water with half the vinegar, so it loses its bite.',
      'Cut the carrots into thin rounds.',
      'Boil the broad beans for 4-5 minutes in lightly salted water, adding the carrots for the last 2 minutes, then drain and refresh under cold water.',
      'In a bowl mix the chopped garlic, oregano, chilli flakes, remaining vinegar and the oil.',
      'Add the broad beans, carrots and drained onion, dress, add parsley, salt and pepper and let it sit for 5 minutes before serving.',
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
  console.log(`\n${inseriti.length}/6 piatti inseriti.`);
})();
