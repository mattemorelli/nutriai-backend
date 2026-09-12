// germania — contorni (10)
module.exports = [
  {
    name: "Kartoffelpüree (purè di patate tedesco)",
    name_en: "Kartoffelpüree (German mashed potatoes)",
    meal_slot: "contorno", prep_min: 22,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.2,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lessa le patate intere e schiacciale con burro e latte.", "Insaporisci con noce moscata."],
    steps_en: [
      "Boil the potatoes whole and unpeeled — cut pieces soak up water and make for a thin, gluey mash.",
      "Test for doneness with a knife: it should slide in with no resistance at all.",
      "Peel them while still hot, working quickly since a cooled potato turns gummy once mashed.",
      "Mash with the butter added first, then the warm milk gradually, so both blend in smoothly rather than sitting separately.",
      "Grate the nutmeg in at the very end — its aroma fades fast once it hits the heat, so a little added late goes further.",
      "Season with salt last, once you can taste the balance with the butter and milk already in."
    ],
    ingredients: [
      { food_id: "170028", grams: 250 },
      { food_id: "burro_it", grams: 15 },
      { food_id: "latte_ps_it", grams: 40 },
      { food_id: "noce_moscata_it", grams: 1 }
    ]
  },
  {
    name: "Bratkartoffeln (patate saltate alla tedesca)",
    name_en: "Bratkartoffeln (German pan-fried potatoes)",
    meal_slot: "contorno", prep_min: 22,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lessa le patate a fette e rosolale nel burro con la cipolla.", "Cuoci finché dorate e croccanti."],
    steps_en: [
      "Boil the potatoes whole the day before if you can — cold, already-cooked potatoes slice cleanly and fry up far crisper than fresh-boiled ones.",
      "Slice them into rounds about a centimeter thick, so they have enough substance to crisp without falling apart.",
      "Melt the butter in a wide pan over medium-high heat and add the potato slices in a single layer, without crowding the pan.",
      "Let them sit undisturbed for a few minutes at a time before turning, so real color develops on each side.",
      "Add the sliced onion halfway through, once the potatoes have already started browning, so it doesn't burn before they're done.",
      "Season with salt only near the end and serve straight from the pan while still crisp."
    ],
    ingredients: [
      { food_id: "170028", grams: 280 },
      { food_id: "170000", grams: 80 },
      { food_id: "burro_it", grams: 15 }
    ]
  },
  {
    name: "Sauerkraut al cumino",
    name_en: "Sauerkraut with caraway seeds",
    meal_slot: "contorno", prep_min: 18,
    profilo: "europeo-leggero", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.5,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Scalda i crauti nell'olio con i semi di cumino.", "Cuoci 12 minuti a fuoco basso."],
    steps_en: [
      "Rinse the sauerkraut briefly under cold water if it tastes very sharp, which softens its acidity before it dominates the dish.",
      "Toast the caraway seeds in the oil for thirty seconds first, which brings out far more of their aroma than adding them raw.",
      "Add the sauerkraut and a small splash of water, then cover and cook over low heat for about 12 minutes.",
      "Stir occasionally, since sauerkraut can catch on the bottom once its own liquid cooks off.",
      "Taste before adding any salt — sauerkraut is already salty from fermentation.",
      "Serve warm alongside sausages or roasted meats, the classic German pairing."
    ],
    ingredients: [
      { food_id: "169279", grams: 250 },
      { food_id: "170923", grams: 3 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Kartoffelsalat (insalata di patate tedesca)",
    name_en: "Kartoffelsalat (German potato salad)",
    meal_slot: "contorno", prep_min: 22,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.1,
    base_amidacea: true, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Lessa le patate e affettale calde.", "Condisci con cipolla, aceto e olio."],
    steps_en: [
      "Boil the potatoes whole and unpeeled, so they hold their shape once sliced rather than falling apart.",
      "Slice them while still warm — this is the key step, since warm potato absorbs the dressing far better than cold.",
      "Whisk the vinegar and oil together with the finely diced onion while the potatoes cook, letting the onion soften slightly in the acid.",
      "Pour the dressing over the warm slices right away and toss gently so they don't break apart.",
      "Let it sit at least ten minutes before serving, so the flavors soak in fully.",
      "Serve warm or at room temperature, the traditional German way rather than chilled."
    ],
    ingredients: [
      { food_id: "170028", grams: 280 },
      { food_id: "170000", grams: 60 },
      { food_id: "173469", grams: 12 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Erbsen und Möhren (piselli e carote alla tedesca)",
    name_en: "Erbsen und Möhren (German peas and carrots)",
    meal_slot: "contorno", prep_min: 15,
    profilo: "europeo-ricco", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.6,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci le carote a cubetti nel burro.", "Aggiungi i piselli e cuoci ancora 5 minuti."],
    steps_en: [
      "Dice the carrots small so they cook through in the same short time the peas need.",
      "Cook them in the butter over medium heat for about 6 minutes, until just starting to soften.",
      "Add the peas and a splash of water, cooking a further 4 to 5 minutes so both finish together.",
      "Check the carrots are tender before taking the pan off the heat — the peas will always cook faster.",
      "Season with salt at the end, tasting to balance the natural sweetness of both vegetables.",
      "Serve warm, ideally straight from the pan while the butter is still glossy."
    ],
    ingredients: [
      { food_id: "170419", grams: 150 },
      { food_id: "170393", grams: 100 },
      { food_id: "burro_it", grams: 10 }
    ]
  },
  {
    name: "Gurkensalat (insalata di cetrioli alla tedesca)",
    name_en: "Gurkensalat (German cucumber salad)",
    meal_slot: "contorno", prep_min: 12,
    profilo: "europeo-leggero", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 9.1,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Affetta il cetriolo sottile e salalo.", "Condisci con aceto di mele e aneto."],
    steps_en: [
      "Slice the cucumber as thin as you can, using a mandoline if you have one, which is how this salad is traditionally cut.",
      "Salt the slices and let them sit for at least ten minutes, then squeeze or drain off the water this draws out — skipping this step is what makes most cucumber salads watery.",
      "Whisk the vinegar with a touch of oil into a light dressing rather than something thick.",
      "Toss the drained cucumber with the dressing just before serving.",
      "Add the dill last, tossing gently so it doesn't bruise and darken.",
      "Serve cold, as a sharp, refreshing side to richer meat dishes."
    ],
    ingredients: [
      { food_id: "168409", grams: 250 },
      { food_id: "173469", grams: 10 },
      { food_id: "aneto_it", grams: 4 }
    ]
  },
  {
    name: "Grüne-Bohnen-Salat (insalata di fagiolini alla tedesca)",
    name_en: "Grüne-Bohnen-Salat (German green bean salad)",
    meal_slot: "contorno", prep_min: 15,
    profilo: "europeo-leggero", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.9,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Sbollenta i fagiolini e raffreddali.", "Condisci con cipolla, aceto e olio."],
    steps_en: [
      "Trim the ends off the green beans and blanch them in boiling salted water for about 4 minutes, until tender but still bright green.",
      "Drain them and plunge into cold water right away, which stops the cooking and keeps the color and the bite.",
      "Slice the onion very thin, since it's eaten raw and thick pieces would overpower the beans.",
      "Whisk the vinegar and oil together, then toss with the drained beans and onion.",
      "Let it sit at least ten minutes before serving so the dressing's flavor spreads through.",
      "Serve cold or at room temperature as a crisp, tangy side."
    ],
    ingredients: [
      { food_id: "fagiolini_it", grams: 250 },
      { food_id: "170000", grams: 50 },
      { food_id: "173469", grams: 10 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Rote-Bete-Salat (insalata di barbabietola alla tedesca)",
    name_en: "Rote-Bete-Salat (German beetroot salad)",
    meal_slot: "contorno", prep_min: 20,
    profilo: "europeo-leggero", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 9.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Lessa la barbabietola, raffredda e affetta.", "Condisci con cipolla, aceto di mele e olio."],
    steps_en: [
      "Boil the beetroot whole and unpeeled, with the skin on, so its color and nutrients don't bleed out into the water.",
      "Cook until a knife slides in easily, then cool it enough to handle before peeling — the skin rubs off far easier warm than cold.",
      "Slice it into thin rounds, wearing gloves if you'd rather avoid stained hands.",
      "Whisk the vinegar and oil together with the finely diced onion, letting the onion soften slightly in the acid.",
      "Dress the beetroot just before serving, since the vinegar keeps deepening its color the longer it sits.",
      "Serve cold or at room temperature as a sharp, colorful side, the classic German way to eat beetroot."
    ],
    ingredients: [
      { food_id: "barbabietola_australiana_it", grams: 250 },
      { food_id: "170000", grams: 50 },
      { food_id: "173469", grams: 12 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Kohlrabigemüse (cavolo rapa saltato alla tedesca)",
    name_en: "Kohlrabigemüse (German sautéed kohlrabi)",
    meal_slot: "contorno", prep_min: 18,
    profilo: "europeo-ricco", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Taglia il cavolo rapa a bastoncini e cuocilo nel burro.", "Finisci con prezzemolo."],
    steps_en: [
      "Peel the kohlrabi first — its outer skin stays tough and fibrous no matter how long it cooks.",
      "Cut it into even matchsticks so it cooks through at the same rate rather than staying raw at the center of thicker pieces.",
      "Melt the butter over medium heat and add the kohlrabi, spreading it in a single layer.",
      "Cover and cook for about 10 minutes, stirring occasionally, until tender but still with a little bite.",
      "Season with salt partway through rather than at the start, so it doesn't draw out too much moisture too early.",
      "Scatter the parsley over just before serving so it stays bright and fresh."
    ],
    ingredients: [
      { food_id: "cavolo_rapa_it", grams: 250 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "prezzemolo_it", grams: 3 }
    ]
  },
  {
    name: "Möhren-Petersilie (carote al prezzemolo alla tedesca)",
    name_en: "Möhren-Petersilie (German carrots with parsley butter)",
    meal_slot: "contorno", prep_min: 15,
    profilo: "europeo-ricco", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci le carote a rondelle nel burro con poca acqua.", "Cospargi di prezzemolo tritato."],
    steps_en: [
      "Slice the carrots into even rounds so they all soften at the same rate.",
      "Cook them in the butter with a splash of water, covered, over medium-low heat for about 10 minutes.",
      "Check doneness with a fork: they should be tender but not falling apart.",
      "Uncover for the last minute if there's excess liquid left, letting it reduce into the butter.",
      "Season with salt once tender, tasting to balance the carrots' natural sweetness.",
      "Scatter the parsley over just before serving so it stays bright rather than wilting in the residual heat."
    ],
    ingredients: [
      { food_id: "170393", grams: 250 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "prezzemolo_it", grams: 4 }
    ]
  }
];
