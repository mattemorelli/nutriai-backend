// regno_unito — contorni (10)
module.exports = [
  {
    name: "Bubble and squeak (cavolo e patate saltati)",
    name_en: "Bubble and squeak (sautéed cabbage and potato)",
    meal_slot: "contorno", prep_min: 20,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lessa patate e cavolo, schiaccia grossolanamente.", "Rosola il composto nel burro finché dorato e croccante."],
    steps_en: [
      "Boil the potatoes and shredded cabbage separately until both are tender, then drain them well.",
      "Mash them together roughly with a fork, leaving plenty of texture rather than a smooth purée — this is meant to be a chunky, rustic mash.",
      "Shape the mixture into a rough cake in a hot, buttered pan, pressing it down to cover the base.",
      "Let it sit undisturbed for several minutes so a real crust forms on the bottom — moving it too soon keeps it pale and soft.",
      "Flip it in sections rather than as one piece, then press it down again to crisp the second side.",
      "Serve it hot, straight from the pan, while the edges are still crackling and crisp."
    ],
    ingredients: [
      { food_id: "170028", grams: 200 },
      { food_id: "169975", grams: 150 },
      { food_id: "burro_it", grams: 12 }
    ]
  },
  {
    name: "Mushy peas (piselli schiacciati all'inglese)",
    name_en: "Mushy peas",
    meal_slot: "contorno", prep_min: 15,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.6,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci i piselli nell'acqua finché morbidi.", "Schiaccia grossolanamente con un filo d'olio."],
    steps_en: [
      "Simmer the peas in a little water for about 10 minutes, longer than you'd normally cook fresh peas, so they fully soften rather than staying firm.",
      "Drain them, keeping a splash of the cooking water in case the mash needs loosening.",
      "Mash them roughly with a fork or the back of a spoon — mushy peas keep some texture, they're not meant to be a smooth purée.",
      "Stir in the oil once off the heat, adding the reserved water if it's thicker than a spoon can scoop easily.",
      "Season with salt to taste, tasting first since peas are naturally sweet and need a firm hand.",
      "Serve warm, the classic accompaniment to any baked fish dish."
    ],
    ingredients: [
      { food_id: "170419", grams: 250 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Neeps and tatties (purè di rape e patate scozzese)",
    name_en: "Neeps and tatties (Scottish mashed turnip and potato)",
    meal_slot: "contorno", prep_min: 22,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.2,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lessa rape e patate separatamente.", "Schiaccia ciascuna con burro e servi insieme."],
    steps_en: [
      "Peel the turnips before cutting them — their skin can taste faintly bitter once cooked, unlike the potato's.",
      "Boil the turnip and potato in separate pots, since turnip holds more water and needs slightly different timing to mash well.",
      "Drain each well and mash them separately with butter, rather than combining them in one pot — this is the traditional Scottish way, served as two distinct mounds.",
      "Season each mash with salt to taste, since turnip's natural bitterness needs slightly more than potato alone.",
      "Grate a little nutmeg into the turnip mash at the end, which is the classic touch that balances its sharpness.",
      "Serve the two mashes side by side, still warm, the traditional Burns Night pairing."
    ],
    ingredients: [
      { food_id: "rapa_it", grams: 180 },
      { food_id: "170028", grams: 180 },
      { food_id: "burro_it", grams: 15 }
    ]
  },
  {
    name: "Cavoletti di Bruxelles al burro",
    name_en: "Buttered Brussels sprouts",
    meal_slot: "contorno", prep_min: 15,
    profilo: "europeo-ricco", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Sbollenta i cavoletti e tagliali a metà.", "Saltali nel burro finché dorati."],
    steps_en: [
      "Trim the stem end off each sprout and cut them in half, which lets them cook through evenly rather than staying raw at the center.",
      "Blanch them in boiling salted water for about 4 minutes, until just tender, then drain well.",
      "Melt the butter in a pan over medium-high heat and add the sprouts cut-side down.",
      "Let them sit undisturbed for a couple of minutes so the cut faces turn golden brown, rather than stirring constantly.",
      "Toss once to color the other side lightly, keeping the centers still with a little bite.",
      "Season with salt at the end and serve hot, while the edges are still crisp."
    ],
    ingredients: [
      { food_id: "170383", grams: 250 },
      { food_id: "burro_it", grams: 12 }
    ]
  },
  {
    name: "Piselli alla menta",
    name_en: "Minted peas",
    meal_slot: "contorno", prep_min: 10,
    profilo: "europeo-leggero", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci i piselli in poca acqua per 5 minuti.", "Manteca con burro e menta fresca."],
    steps_en: [
      "Simmer the peas in a small amount of water for only about 5 minutes — much longer and they lose their bright color and turn dull.",
      "Drain them, saving a splash of the cooking water in case the butter needs loosening.",
      "Return the peas to the warm pan off the direct heat and stir in the butter until it melts and coats them.",
      "Tear or chop the mint just before adding it, since chopped ahead of time it darkens and loses its aroma fast.",
      "Stir the mint in last, off the heat, so it stays bright and fragrant.",
      "Serve immediately, while the peas are still glossy and bright green."
    ],
    ingredients: [
      { food_id: "170419", grams: 220 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "menta_it", grams: 5 }
    ]
  },
  {
    name: "Carote glassate al miele all'inglese",
    name_en: "English honey-glazed carrots",
    meal_slot: "contorno", prep_min: 18,
    profilo: "europeo-ricco", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.5,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci le carote nel burro con poca acqua e miele.", "Fai restringere finché lucide."],
    steps_en: [
      "Cut the carrots into even sticks or rounds so they cook through at the same rate.",
      "Simmer them in the butter with a splash of water, covered, for about 10 minutes until just tender.",
      "Uncover and add the honey, then raise the heat slightly so the liquid reduces to a glaze rather than staying watery.",
      "Toss the carrots often in the last few minutes, so they get evenly coated as the glaze thickens.",
      "Watch closely once the liquid has mostly reduced — honey burns quickly if left too long over high heat.",
      "Serve immediately, while the glaze is still warm and glossy, the classic side to a Sunday roast."
    ],
    ingredients: [
      { food_id: "170393", grams: 250 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "miele_it", grams: 10 }
    ]
  },
  {
    name: "Insalata di crescione e cetriolo",
    name_en: "Watercress and cucumber salad",
    meal_slot: "contorno", prep_min: 10,
    profilo: "europeo-leggero", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 9.1,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Affetta il cetriolo sottile.", "Condisci con il crescione, limone e olio."],
    steps_en: [
      "Slice the cucumber thin and pat it dry, so it doesn't dilute the salad with extra water.",
      "Trim any tough stems from the watercress, keeping mostly the leafy sprigs, which is where its peppery bite is strongest.",
      "Whisk the lemon juice and oil together into a light dressing rather than something thick and creamy.",
      "Toss the cucumber and watercress together with the dressing just before serving.",
      "Serve immediately — watercress wilts quickly once dressed, losing its crisp bite within minutes.",
      "Eat it cold, as a sharp, refreshing side to richer meat dishes."
    ],
    ingredients: [
      { food_id: "168409", grams: 150 },
      { food_id: "crescione_it", grams: 80 },
      { food_id: "limone_it", grams: 8 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Yorkshire pudding (budino di Yorkshire)",
    name_en: "Yorkshire pudding",
    meal_slot: "contorno", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Prepara la pastella con farina, uova e latte e lasciala riposare.", "Cuoci in forno molto caldo con un filo d'olio finché gonfia e dorata."],
    steps_en: [
      "Whisk the flour, eggs and milk into a smooth, thin batter, then let it rest for at least 15 minutes — resting relaxes the gluten and is what helps the pudding rise properly.",
      "Heat a few drops of oil in each cup of a muffin tin inside a very hot oven until it's shimmering and just starting to smoke.",
      "Pour the batter into the hot oil quickly, without opening the oven any longer than necessary — losing heat here is the most common reason it fails to rise.",
      "Bake at the highest oven setting for about 20 minutes without opening the door at all, which is essential for the puff to set properly.",
      "Check it's deeply golden and well risen with a hollow center before taking it out.",
      "Serve immediately — Yorkshire puddings deflate within minutes of coming out of the oven."
    ],
    ingredients: [
      { food_id: "farina_00_it", grams: 70 },
      { food_id: "uovo_grande_it", grams: 60 },
      { food_id: "latte_ps_it", grams: 80 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Purè di patate al rafano",
    name_en: "Horseradish mashed potatoes",
    meal_slot: "contorno", prep_min: 22,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.1,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lessa le patate intere e schiacciale con burro e panna.", "Aggiungi il rafano e mescola bene."],
    steps_en: [
      "Boil the potatoes whole and unpeeled — cut pieces soak up water and make for a thin, gluey mash.",
      "Peel them while still hot, working quickly since a cooled potato turns gummy once mashed.",
      "Mash with the butter added first, then the cream gradually, so both blend in smoothly.",
      "Stir in the horseradish once the mash is smooth, tasting as you go since its heat varies a lot by brand.",
      "Season with salt last, once you can taste the balance with the horseradish already in.",
      "Serve warm, the classic pairing for roast beef."
    ],
    ingredients: [
      { food_id: "170028", grams: 250 },
      { food_id: "burro_it", grams: 12 },
      { food_id: "panna_it", grams: 30 },
      { food_id: "173472", grams: 15 }
    ]
  },
  {
    name: "Patate novelle al burro e menta",
    name_en: "New potatoes with butter and mint",
    meal_slot: "contorno", prep_min: 20,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 8.4,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lessa le patate novelle intere con la buccia.", "Condisci con burro fuso e menta tritata."],
    steps_en: [
      "Choose small, similarly-sized potatoes so they all cook through at the same time.",
      "Boil them whole with the skin on in salted water until a knife slides in easily, about 15 minutes.",
      "Drain well and let them steam-dry for a minute in the empty pot, uncovered, which keeps them from turning soggy.",
      "Toss them with the melted butter while still hot, so it coats every piece evenly.",
      "Tear or chop the mint just before mixing it in, since it darkens and loses aroma if chopped too far ahead.",
      "Season with salt at the table and serve warm, skins on."
    ],
    ingredients: [
      { food_id: "170028", grams: 280 },
      { food_id: "burro_it", grams: 12 },
      { food_id: "menta_it", grams: 5 }
    ]
  }
];
