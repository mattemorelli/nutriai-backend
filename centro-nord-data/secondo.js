// centro_nord_generico — secondi (45)
module.exports = [
  {
    name: "Merluzzo al forno con senape e pane di segale",
    name_en: "Baked cod with mustard and rye breadcrumbs",
    meal_slot: "secondo", prep_min: 20,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Spennella il merluzzo con senape e copri di pane sbriciolato.", "Inforna a 200°C per 15 minuti."],
    steps_en: [
      "Pat the cod fillets completely dry — any surface moisture stops the mustard from clinging and the crumbs from crisping.",
      "Spread a thin layer of mustard over each fillet; it acts as glue for the crumbs as much as it adds flavor.",
      "Tear the rye bread into rough crumbs by hand rather than blitzing it fine, so the topping stays crunchy instead of turning to dust.",
      "Press the crumbs onto the mustard firmly enough that they hold through baking.",
      "Bake at 200°C for about 15 minutes, until the crust is golden and the fish flakes easily with a fork.",
      "Rest it a minute before serving — cod continues cooking briefly from residual heat and firms up if rushed straight from the oven."
    ],
    ingredients: [
      { food_id: "173713", grams: 180 },
      { food_id: "172234", grams: 12 },
      { food_id: "pane_segale_it", grams: 30 }
    ]
  },
  {
    name: "Salmone al forno con aneto e limone",
    name_en: "Baked salmon with dill and lemon",
    meal_slot: "secondo", prep_min: 18,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Disponi il salmone con aneto e limone.", "Inforna a 200°C per 12 minuti."],
    steps_en: [
      "Lay the salmon skin-side down on a lined tray so the skin protects the flesh from direct heat.",
      "Scatter the dill over first, then the lemon slices on top — the dill's oils release better under the citrus's weight.",
      "Drizzle with a little oil so the fish doesn't dry out at the edges during roasting.",
      "Bake at 200°C for about 12 minutes; salmon is done when it turns opaque and just barely flakes, not when it's fully dry inside.",
      "Pull it out while the very center still looks slightly translucent — it keeps cooking a minute more once out of the oven.",
      "Serve immediately with the pan juices spooned back over the top."
    ],
    ingredients: [
      { food_id: "173686", grams: 180 },
      { food_id: "aneto_it", grams: 5 },
      { food_id: "limone_it", grams: 15 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Sgombro alla griglia con senape",
    name_en: "Grilled mackerel with mustard",
    meal_slot: "secondo", prep_min: 15,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.5,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Spennella lo sgombro con senape.", "Griglia 4 minuti per lato."],
    steps_en: [
      "Score the mackerel's skin lightly with a few shallow cuts — this lets the heat reach the thicker flesh faster and keeps the skin from curling.",
      "Brush the mustard over both sides just before grilling, not earlier, or its acidity starts to firm the flesh prematurely.",
      "Grill over medium-high heat, starting skin-side down, without moving it for the first few minutes so the skin releases cleanly.",
      "Flip once and cook the second side for about the same time — mackerel's high fat content forgives a slightly longer cook better than lean fish would.",
      "Check doneness by pressing gently: the flesh should flake but still look moist, not dry.",
      "Serve right off the grill, while the skin is still crisp."
    ],
    ingredients: [
      { food_id: "sgombro_it", grams: 180 },
      { food_id: "senape_it", grams: 12 }
    ]
  },
  {
    name: "Trota al forno con porri",
    name_en: "Baked trout with leeks",
    meal_slot: "secondo", prep_min: 22,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Stufa i porri nel burro e disponili sotto la trota.", "Inforna a 200°C per 15 minuti."],
    steps_en: [
      "Slice the leek thin and sweat it in the butter over low heat for about five minutes, until soft but not browned.",
      "Spread the softened leek in a baking dish as a bed — it keeps the trout from sitting directly on the hot metal and steams it gently instead.",
      "Lay the trout on top and season lightly; the leek underneath already carries plenty of flavor.",
      "Bake at 200°C for about 15 minutes, until the fish is opaque through and flakes easily.",
      "Check the thickest part near the head for doneness, since it cooks slower than the tail.",
      "Serve the trout over the braised leeks so their buttery juices soak into the fish at the table."
    ],
    ingredients: [
      { food_id: "175154", grams: 200 },
      { food_id: "porro_it", grams: 100 },
      { food_id: "burro_it", grams: 12 }
    ]
  },
  {
    name: "Aringa alla griglia con purè di patate",
    name_en: "Grilled herring with mashed potatoes",
    meal_slot: "secondo", prep_min: 22,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 8.1,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Griglia l'aringa qualche minuto per lato.", "Servi con purè di patate al burro."],
    steps_en: [
      "Boil the potatoes whole and unpeeled so they don't waterlog, then peel and mash them while still hot with the butter for a smooth purée.",
      "Score the herring's skin lightly so it doesn't curl and cooks evenly on the grill.",
      "Grill it over medium-high heat for a few minutes per side, without moving it too soon, so the skin crisps rather than tears.",
      "Check doneness by the flesh separating easily from the bone at the thickest point.",
      "Season the mash with salt at the end, once the butter's already worked in, so you can judge the right amount.",
      "Serve the herring straight from the grill, with the warm mash alongside rather than under it, so the fish stays crisp."
    ],
    ingredients: [
      { food_id: "aringa_it", grams: 160 },
      { food_id: "170028", grams: 200 },
      { food_id: "burro_it", grams: 12 }
    ]
  },
  {
    name: "Merluzzo in umido con cavolo verza",
    name_en: "Braised cod with savoy cabbage",
    meal_slot: "secondo", prep_min: 20,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Stufa il cavolo verza nell'olio con la cipolla.", "Adagia il merluzzo sopra e cuoci coperto 10 minuti."],
    steps_en: [
      "Shred the cabbage fairly fine so it braises down to tender within the fish's short cooking time.",
      "Soften the onion in the oil for a couple of minutes before adding the cabbage, then cook covered for about 8 minutes until wilted.",
      "Season the cabbage lightly, then nestle the cod fillets on top rather than stirring them in, so they steam gently rather than break apart.",
      "Cover and cook on low heat for about 10 minutes — the moisture from the cabbage is what poaches the fish without any extra liquid.",
      "Check the fish flakes easily with a fork before serving; if not, give it another couple of minutes covered.",
      "Serve the cod over the braised cabbage with its juices spooned on top."
    ],
    ingredients: [
      { food_id: "173713", grams: 180 },
      { food_id: "cavolo_verza_it", grams: 150 },
      { food_id: "170000", grams: 40 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Salmone scottato con crema di cetrioli e aneto",
    name_en: "Seared salmon with cucumber-dill cream",
    meal_slot: "secondo", prep_min: 18,
    profilo: "europeo-panna", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.4,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Scotta il salmone in padella dalla parte della pelle.", "Servi con crema di yogurt, cetriolo e aneto."],
    steps_en: [
      "Pat the salmon dry and score the skin lightly, which keeps it from curling and helps it crisp evenly.",
      "Sear it skin-side down in a hot pan and leave it untouched for most of the cooking time, so the skin releases on its own instead of tearing.",
      "Flip only once, for the last minute, to finish the flesh side without overcooking it.",
      "While the fish cooks, grate the cucumber and squeeze out its liquid, or the sauce turns watery instead of creamy.",
      "Stir the grated cucumber and dill into the yogurt just before serving, so the dill keeps its color and the cucumber stays fresh rather than releasing more water.",
      "Serve the salmon skin-side up so the crisp skin doesn't steam soft under the sauce."
    ],
    ingredients: [
      { food_id: "173686", grams: 180 },
      { food_id: "171304", grams: 80 },
      { food_id: "168409", grams: 60 },
      { food_id: "aneto_it", grams: 4 }
    ]
  },
  {
    name: "Gamberetti saltati con aglio e prezzemolo",
    name_en: "Sautéed shrimp with garlic and parsley",
    meal_slot: "secondo", prep_min: 10,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Salta i gamberetti nell'olio con aglio.", "Cospargi di prezzemolo e limone."],
    steps_en: [
      "Pat the shrimp dry before cooking, since wet shrimp steam in the pan instead of searing.",
      "Heat the oil until it shimmers, then add the garlic for only thirty seconds before the shrimp go in, so it doesn't burn during the longer cooking of the shrimp.",
      "Cook the shrimp in a single layer without crowding the pan, so they brown rather than stew in their own liquid.",
      "Turn them once they curl into a loose C shape and turn pink — a tight, tense curl means they've gone too far.",
      "Take them off the heat the moment they're opaque through, since shrimp keep cooking for a few seconds even off the flame.",
      "Finish with the parsley and a squeeze of lemon stirred in off the heat, so the parsley stays bright."
    ],
    ingredients: [
      { food_id: "gamberetti_it", grams: 200 },
      { food_id: "169230", grams: 5 },
      { food_id: "171413", grams: 10 },
      { food_id: "prezzemolo_it", grams: 4 },
      { food_id: "limone_it", grams: 8 }
    ]
  },
  {
    name: "Trota in padella con salsa allo yogurt e aneto",
    name_en: "Pan-fried trout with yogurt-dill sauce",
    meal_slot: "secondo", prep_min: 18,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.6,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci la trota in padella con un filo d'olio.", "Servi con salsa di yogurt e aneto."],
    steps_en: [
      "Pat the trout dry and season it just before it hits the pan, so the surface stays dry enough to brown rather than steam.",
      "Cook it in hot oil for a few minutes per side, pressing gently at first so the flesh doesn't curl away from the pan.",
      "Turn it only once the first side releases cleanly, which usually takes a few minutes and shouldn't be rushed.",
      "While the fish rests briefly, stir the yogurt and dill together with a pinch of salt — mixing it ahead lets the dill's flavor spread through evenly.",
      "Check the trout is done by seeing the flesh turn opaque and separate easily along the center bone line.",
      "Spoon the yogurt sauce alongside rather than over the fish, so its skin stays crisp until the last bite."
    ],
    ingredients: [
      { food_id: "175154", grams: 200 },
      { food_id: "171413", grams: 10 },
      { food_id: "171304", grams: 60 },
      { food_id: "aneto_it", grams: 4 }
    ]
  },
  {
    name: "Merluzzo con crosta di pane e erbe",
    name_en: "Cod with herbed breadcrumb crust",
    meal_slot: "secondo", prep_min: 20,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Copri il merluzzo con pane, burro fuso e erbe.", "Inforna a 200°C per 15 minuti."],
    steps_en: [
      "Tear the bread into coarse crumbs by hand, since fine crumbs pack too densely and turn hard rather than crisp in the oven.",
      "Toss the crumbs with the melted butter and chopped parsley so every piece is coated evenly before it goes on the fish.",
      "Pat the cod dry first — moisture on the surface stops the crumb topping from sticking properly.",
      "Press the buttered crumbs firmly onto the fillets so they hold together through baking rather than falling off.",
      "Bake at 200°C for about 15 minutes, until the crust turns deep golden and the fish flakes easily underneath.",
      "Let it rest a minute before serving so the crust sets and stays crisp when cut."
    ],
    ingredients: [
      { food_id: "173713", grams: 180 },
      { food_id: "pane_integrale_it", grams: 30 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "prezzemolo_it", grams: 4 }
    ]
  },
  {
    name: "Gamberetti al burro con aneto e limone",
    name_en: "Buttered shrimp with dill and lemon",
    meal_slot: "secondo", prep_min: 10,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.6,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Salta i gamberetti nel burro.", "Aggiungi aneto e limone a fine cottura."],
    steps_en: [
      "Pat the shrimp fully dry, since any surface water keeps the butter from browning properly around them.",
      "Melt the butter over medium-high heat until it just starts to foam, then add the shrimp in a single layer.",
      "Cook without stirring for the first minute so they pick up some color, then turn once they curl and turn pink.",
      "Pull the pan off the heat the moment they're opaque — carryover heat finishes them in the seconds after.",
      "Stir in the dill and a squeeze of lemon off the heat, so the dill keeps its color and the lemon its brightness.",
      "Serve immediately, spooning the browned butter from the pan over the top."
    ],
    ingredients: [
      { food_id: "gamberetti_it", grams: 200 },
      { food_id: "burro_it", grams: 12 },
      { food_id: "aneto_it", grams: 4 },
      { food_id: "limone_it", grams: 8 }
    ]
  },
  {
    name: "Petto di pollo al forno con senape e miele",
    name_en: "Baked chicken breast with mustard and honey",
    meal_slot: "secondo", prep_min: 22,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Spennella il pollo con senape e miele.", "Inforna a 200°C per 18 minuti."],
    steps_en: [
      "Mix the mustard and honey together first, so the sweetness is distributed evenly rather than pooling in patches on the chicken.",
      "Brush it over the chicken breasts on all sides, working it slightly into any cuts for deeper flavor.",
      "Roast at 200°C for about 18 minutes, checking the thickest part reaches 74°C — chicken breast dries out fast past that point.",
      "Baste once halfway through with the pan juices, which keeps the glaze from burning before the chicken is cooked through.",
      "Rest the chicken for a few minutes before slicing, so the juices redistribute instead of running out onto the board.",
      "Slice against the grain for the most tender bite."
    ],
    ingredients: [
      { food_id: "171077", grams: 200 },
      { food_id: "172234", grams: 15 },
      { food_id: "miele_it", grams: 10 }
    ]
  },
  {
    name: "Coscia di pollo brasata con crauti e mele",
    name_en: "Braised chicken thigh with sauerkraut and apple",
    meal_slot: "secondo", prep_min: 25,
    profilo: "europeo-brasato", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.2,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola la coscia di pollo, aggiungi crauti e mela e cuoci coperto.", "Cuoci 20 minuti finché tenero."],
    steps_en: [
      "Brown the chicken thigh skin-side down first in a hot pan, without moving it, so the skin renders and crisps before anything else goes in.",
      "Lift the chicken out once browned and add the sauerkraut and diced apple to the same pan, so they pick up the rendered fat's flavor.",
      "Nestle the chicken back on top of the sauerkraut and apple, cover, and lower the heat to a gentle simmer.",
      "Braise for about 20 minutes, until the chicken reaches 74°C at the thickest part and pulls easily from the bone.",
      "Check the sauerkraut hasn't dried out partway through — add a splash of water if the pan looks dry.",
      "Serve the chicken over the braised sauerkraut and apple, spooning the pan juices on top."
    ],
    ingredients: [
      { food_id: "pollo_coscia_it", grams: 220 },
      { food_id: "169279", grams: 150 },
      { food_id: "mela_it", grams: 80 }
    ]
  },
  {
    name: "Sovracoscia di pollo al forno con patate e rosmarino",
    name_en: "Baked chicken thigh with potatoes",
    meal_slot: "secondo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Disponi pollo e patate in teglia con olio.", "Inforna a 200°C per 25 minuti."],
    steps_en: [
      "Cut the potatoes into wedges roughly the same size as each other, so they roast evenly alongside the chicken.",
      "Toss the potatoes with the oil and salt first, then spread them out with space between pieces — crowding steams them instead of letting them crisp.",
      "Nestle the chicken thighs skin-side up among the potatoes, so the rendering fat drips down and flavors them as they roast.",
      "Roast at 200°C for about 25 minutes, until the chicken skin is deep golden and reaches 74°C at the thickest point.",
      "Turn the potatoes once halfway through so they brown on more than one side.",
      "Rest the chicken briefly before serving, letting the potatoes finish absorbing the last of the pan juices."
    ],
    ingredients: [
      { food_id: "172385", grams: 220 },
      { food_id: "170028", grams: 200 },
      { food_id: "171413", grams: 12 }
    ]
  },
  {
    name: "Petto di tacchino in padella con funghi e panna",
    name_en: "Pan-fried turkey breast with mushrooms and cream",
    meal_slot: "secondo", prep_min: 20,
    profilo: "europeo-panna", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.1,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Rosola il tacchino e tienilo da parte.", "Salta i funghi, sfuma con panna e rimetti il tacchino."],
    steps_en: [
      "Pound the turkey breast to an even thickness first, so it cooks through at the same rate rather than drying at the thin end before the thick end is done.",
      "Sear it in a hot pan for a few minutes per side until just cooked through, then lift it out and let it rest while you build the sauce.",
      "Sear the mushrooms in the same pan without crowding, so they brown in the meat's leftover fat instead of steaming.",
      "Pour in the cream once the mushrooms have colored, scraping up the browned bits from the bottom, which is where most of the flavor is sitting.",
      "Simmer the cream for a minute until it thickens slightly, then slide the turkey back in just to warm through.",
      "Serve straight away — cream sauces separate if kept over heat too long once the meat is back in."
    ],
    ingredients: [
      { food_id: "171098", grams: 200 },
      { food_id: "funghi_champignon_it", grams: 120 },
      { food_id: "panna_it", grams: 60 }
    ]
  },
  {
    name: "Petto di pollo con porri e senape",
    name_en: "Chicken breast with leeks and mustard",
    meal_slot: "secondo", prep_min: 22,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.6,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola il pollo e tienilo da parte.", "Stufa i porri, aggiungi senape e rimetti il pollo."],
    steps_en: [
      "Sear the chicken breast in a hot pan for a few minutes per side until golden, then lift it out — it will finish cooking later with the leeks.",
      "Lower the heat and add the sliced leek to the same pan, sweating it in the leftover fat for about five minutes until soft.",
      "Stir the mustard into the softened leek along with a splash of water, scraping up the browned bits from searing the chicken.",
      "Slide the chicken back into the pan, nestled into the leeks, and cover to finish cooking gently.",
      "Cook a further 6 to 8 minutes, until the chicken reaches 74°C at the thickest part.",
      "Serve the chicken sliced over the mustard-leek mixture, with the pan juices spooned on top."
    ],
    ingredients: [
      { food_id: "171077", grams: 200 },
      { food_id: "porro_it", grams: 100 },
      { food_id: "172234", grams: 12 }
    ]
  },
  {
    name: "Spezzatino di pollo con carote e sedano",
    name_en: "Chicken stew with carrots and celery",
    meal_slot: "secondo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.5,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola il pollo a pezzi con carote e sedano.", "Cuoci in umido 20 minuti con un po' d'acqua."],
    steps_en: [
      "Cut the chicken into even pieces so they all finish cooking at the same time rather than some drying out before others are done.",
      "Brown the pieces in the oil first, in batches if needed, since crowding the pan makes them steam instead of color.",
      "Add the diced carrot and celery once the chicken has browned, letting them soften for a couple of minutes in the same fat.",
      "Pour in enough water to come halfway up the ingredients, then cover and simmer gently for about 20 minutes.",
      "Check the chicken reaches 74°C at the thickest piece before serving, and the vegetables are tender but not falling apart.",
      "Season at the end, once the stew has reduced slightly and the flavors have concentrated."
    ],
    ingredients: [
      { food_id: "171077", grams: 200 },
      { food_id: "170393", grams: 100 },
      { food_id: "sedano_it", grams: 60 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Petto di tacchino con salsa allo yogurt e aneto",
    name_en: "Turkey breast with yogurt-dill sauce",
    meal_slot: "secondo", prep_min: 18,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.5,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci il tacchino in padella.", "Servi con salsa di yogurt e aneto."],
    steps_en: [
      "Pound the turkey breast to an even thickness so the whole piece cooks through together rather than drying at the thin edges.",
      "Sear it in the oil over medium-high heat for a few minutes per side, until golden and cooked through.",
      "Rest the meat for a few minutes off the heat before slicing, so the juices stay inside instead of running onto the board.",
      "While it rests, stir the yogurt and dill together with a pinch of salt so the flavor spreads evenly.",
      "Slice the turkey against the grain for the most tender bite.",
      "Serve the sauce alongside rather than poured over, so the meat's seared surface stays visible and slightly crisp."
    ],
    ingredients: [
      { food_id: "171098", grams: 200 },
      { food_id: "171413", grams: 8 },
      { food_id: "171304", grams: 60 },
      { food_id: "aneto_it", grams: 4 }
    ]
  },
  {
    name: "Coscia di pollo al forno con mele e cipolle",
    name_en: "Baked chicken thigh with apples and onions",
    meal_slot: "secondo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.3,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Disponi coscia, mele e cipolle in teglia.", "Inforna a 200°C per 25 minuti."],
    steps_en: [
      "Cut the apples and onions into wedges of a similar size, so they roast at the same rate as each other.",
      "Toss them with a little oil and spread them under and around the chicken thighs, so they catch the fat that renders as it roasts.",
      "Roast skin-side up at 200°C for about 25 minutes, without turning, so the skin stays crisp on top the whole time.",
      "Check the chicken reaches 74°C at the thickest part; the apples and onions should be soft and lightly caramelized by then.",
      "Baste once partway through with the pan juices if the apples look like they're drying out.",
      "Rest a few minutes before serving, letting the apples and onions finish soaking up the last of the drippings."
    ],
    ingredients: [
      { food_id: "pollo_coscia_it", grams: 220 },
      { food_id: "mela_it", grams: 100 },
      { food_id: "170000", grams: 80 }
    ]
  },
  {
    name: "Pollo in umido con piselli e carote",
    name_en: "Chicken stew with peas and carrots",
    meal_slot: "secondo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.6,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola il pollo con le carote.", "Aggiungi acqua e cuoci 15 minuti, unendo i piselli alla fine."],
    steps_en: [
      "Cut the chicken into even pieces and brown them well in the oil, which builds the base flavor for the whole stew.",
      "Add the diced carrots once the chicken has colored, letting them soften in the same fat for a couple of minutes.",
      "Pour in enough water to come halfway up the ingredients, cover, and simmer gently for about 15 minutes.",
      "Add the peas only in the last 4 minutes of cooking — added earlier, they turn grey and lose their sweetness.",
      "Check the chicken reaches 74°C at the thickest piece and the carrots are tender before serving.",
      "Season at the end, once the liquid has reduced and concentrated in flavor."
    ],
    ingredients: [
      { food_id: "171077", grams: 200 },
      { food_id: "170393", grams: 80 },
      { food_id: "170419", grams: 100 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Lonza di maiale al forno con mele e cipolle",
    name_en: "Baked pork loin with apples and onions",
    meal_slot: "secondo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Disponi la lonza con mele e cipolle in teglia.", "Inforna a 200°C per 22 minuti."],
    steps_en: [
      "Sear the pork loin briefly on all sides in a hot pan before it goes in the oven — this single step does more for flavor than any amount of extra roasting time.",
      "Cut the apples and onions into wedges and spread them around the seared pork in the baking dish.",
      "Roast at 200°C for about 20 minutes, until the pork reaches 63°C at the center on a thermometer.",
      "Baste once halfway through with the pan juices, so the apples don't dry out before the pork is done.",
      "Rest the pork for five minutes before slicing — cutting straight from the oven lets the juices run out onto the board instead of staying in the meat.",
      "Slice against the grain and serve with the roasted apples and onions and their juices."
    ],
    ingredients: [
      { food_id: "168249", grams: 200 },
      { food_id: "mela_it", grams: 100 },
      { food_id: "170000", grams: 80 }
    ]
  },
  {
    name: "Lonza di maiale in padella con crauti",
    name_en: "Pan-fried pork loin with sauerkraut",
    meal_slot: "secondo", prep_min: 22,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola la lonza e tienila da parte.", "Scalda i crauti nella stessa padella e rimetti la carne."],
    steps_en: [
      "Sear the pork loin in a hot pan for a few minutes per side until well browned, then lift it out to rest.",
      "Add the sauerkraut directly to the same pan, off the highest heat, so it picks up the browned bits left from the pork.",
      "Warm the sauerkraut through for a few minutes, stirring occasionally, without letting it dry out or fry.",
      "Slice the rested pork and nestle it into the warmed sauerkraut to finish absorbing its juices.",
      "Check the pork reached 63°C at the center before it came off the heat — it continues rising a couple of degrees as it rests.",
      "Serve hot, with the sauerkraut's tang cutting through the richness of the pork."
    ],
    ingredients: [
      { food_id: "168249", grams: 200 },
      { food_id: "169279", grams: 150 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Spezzatino di maiale con patate e cumino",
    name_en: "Pork stew with potatoes and caraway",
    meal_slot: "secondo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola il maiale a cubetti con cipolla.", "Aggiungi patate, cumino e acqua e cuoci 20 minuti."],
    steps_en: [
      "Cut the pork into even cubes and brown them well in batches — crowding the pan stops any real color from forming.",
      "Soften the onion in the same fat once the pork is browned, building on the flavor left behind.",
      "Add the diced potatoes, caraway seeds and enough water to come halfway up the ingredients.",
      "Cover and simmer gently for about 20 minutes, until the pork is tender and the potatoes have started to break down slightly, thickening the stew.",
      "Check the pork reaches 63°C at the thickest pieces, though the longer simmer generally takes it well past that for tenderness.",
      "Season at the end, once the stew has reduced and the caraway's flavor has had time to spread through."
    ],
    ingredients: [
      { food_id: "168249", grams: 200 },
      { food_id: "170000", grams: 60 },
      { food_id: "170028", grams: 150 },
      { food_id: "170923", grams: 3 }
    ]
  },
  {
    name: "Maiale saltato con cavolo e semi di cumino",
    name_en: "Sautéed pork with cabbage and caraway",
    meal_slot: "secondo", prep_min: 20,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola il maiale a striscioline.", "Salta il cavolo con i semi di cumino e rimetti la carne."],
    steps_en: [
      "Cut the pork into thin strips so it cooks through quickly over high heat, rather than needing a long simmer.",
      "Sear the strips in a hot pan in batches, without crowding, so they brown rather than stew in their own juices.",
      "Lift the pork out once browned and add the shredded cabbage to the same pan with the caraway seeds.",
      "Cook the cabbage over medium-high heat, stirring often, for about 6 minutes until wilted but still with a little bite.",
      "Slide the pork back in for the last minute, just to reheat it through without overcooking.",
      "Check the pork reached 63°C before it first came off the heat, and serve immediately while the cabbage still has some crunch."
    ],
    ingredients: [
      { food_id: "168249", grams: 200 },
      { food_id: "169975", grams: 200 },
      { food_id: "170923", grams: 2 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Polpette di maiale al forno con salsa di senape",
    name_en: "Baked pork meatballs with mustard sauce",
    meal_slot: "secondo", prep_min: 25,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 7.8,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Forma le polpette con maiale, pane e uovo.", "Inforna a 200°C per 18 minuti e servi con salsa di senape."],
    steps_en: [
      "Soak the bread in a splash of milk before mixing it into the meat — this is what keeps the meatballs moist rather than dense and dry.",
      "Mix the pork, soaked bread and egg together just until combined; overworking the mixture makes for tougher meatballs.",
      "Shape into even, walnut-sized balls with wet hands, which keeps the mixture from sticking as you roll.",
      "Space them apart on a lined tray so hot air circulates and browns them on all sides rather than steaming where they touch.",
      "Bake at 200°C for about 18 minutes, until they reach 63°C at the center.",
      "Whisk the mustard with a splash of the cooking milk while the meatballs bake, and serve it alongside once they're out."
    ],
    ingredients: [
      { food_id: "maiale_macinato_magro_it", grams: 200 },
      { food_id: "pane_integrale_it", grams: 30 },
      { food_id: "uovo_grande_it", grams: 30 },
      { food_id: "latte_ps_it", grams: 30 },
      { food_id: "172234", grams: 12 }
    ]
  },
  {
    name: "Lonza di maiale con salsa alla senape e erba cipollina",
    name_en: "Pork loin with mustard-chive sauce",
    meal_slot: "secondo", prep_min: 20,
    profilo: "europeo-panna", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Rosola la lonza e affettala.", "Sfuma con panna e senape e cospargi di erba cipollina."],
    steps_en: [
      "Sear the pork loin whole in a hot pan on all sides until well browned, then lower the heat to finish cooking through.",
      "Check the center reaches 63°C on a thermometer, then lift it out to rest while you build the sauce in the same pan.",
      "Pour the cream into the pan off the highest heat, scraping up the browned bits, which carry most of the pan's flavor.",
      "Whisk in the mustard once the cream is warm, not boiling, so it doesn't separate or turn bitter.",
      "Slice the rested pork and return any juices from the board into the sauce.",
      "Scatter the chives over just before serving, spooning the sauce over the sliced pork."
    ],
    ingredients: [
      { food_id: "168249", grams: 200 },
      { food_id: "panna_it", grams: 50 },
      { food_id: "172234", grams: 10 },
      { food_id: "erba_cipollina_it", grams: 3 }
    ]
  },
  {
    name: "Involtini di cavolo con carne macinata e riso",
    name_en: "Stuffed cabbage rolls with rice and meat",
    meal_slot: "secondo", prep_min: 25,
    profilo: "europeo-brasato", ha_amido: true, ha_proteina: true,
    tecnica: "composta", occasione: "lungo", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Sbollenta le foglie di cavolo e farciscile con carne e riso.", "Cuoci gli involtini in umido con la passata per 25 minuti."],
    steps_en: [
      "Blanch the whole cabbage leaves for a couple of minutes until pliable — raw leaves crack and split the moment you try to roll them.",
      "Mix the raw minced meat with the par-cooked rice and a little onion, seasoning it well since it needs to carry flavor through the braise.",
      "Spoon the filling onto each leaf and roll it up tucking in the sides, snug enough to hold together but not so tight it can't expand as the rice finishes cooking.",
      "Arrange the rolls seam-side down in a pan so they don't unravel while cooking.",
      "Cover with the tomato passata and a little water, then simmer gently for about 25 minutes with the lid on.",
      "Check one roll is cooked through — the meat should reach 74°C and the rice inside should be fully tender, not chalky."
    ],
    ingredients: [
      { food_id: "169975", grams: 250 },
      { food_id: "171796", grams: 150 },
      { food_id: "168877", grams: 50 },
      { food_id: "passata_pomodoro_it", grams: 150 },
      { food_id: "170000", grams: 40 }
    ]
  },
  {
    name: "Polpette di manzo al forno con salsa di senape",
    name_en: "Baked beef meatballs with mustard sauce",
    meal_slot: "secondo", prep_min: 25,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 7.9,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Forma le polpette con manzo, pane e uovo.", "Inforna a 200°C per 18 minuti e servi con salsa di senape."],
    steps_en: [
      "Soak the bread in a splash of milk before mixing it with the beef, which is what keeps the meatballs from turning dense once baked.",
      "Mix the beef, soaked bread and egg together just until combined, without overworking the mixture.",
      "Shape into even balls with wet hands, spacing them apart on a lined tray so they brown on all sides.",
      "Bake at 200°C for about 18 minutes, until they reach 74°C at the center for ground beef.",
      "Whisk the mustard with a splash of the reserved milk while they bake, thinning it to a pourable consistency.",
      "Serve the meatballs hot with the mustard sauce spooned over or alongside."
    ],
    ingredients: [
      { food_id: "171796", grams: 200 },
      { food_id: "pane_integrale_it", grams: 30 },
      { food_id: "uovo_grande_it", grams: 30 },
      { food_id: "latte_ps_it", grams: 30 },
      { food_id: "172234", grams: 12 }
    ]
  },
  {
    name: "Manzo brasato con cipolle",
    name_en: "Braised beef with onions",
    meal_slot: "secondo", prep_min: 45,
    profilo: "europeo-brasato", ha_amido: false, ha_proteina: true,
    tecnica: "composta", occasione: "lungo", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola il manzo a pezzi con le cipolle.", "Copri d'acqua e cuoci coperto 40 minuti finché tenero."],
    steps_en: [
      "Cut the beef into large chunks and brown them hard in batches — this browning is the main source of flavor in a braise this simple, so don't rush it.",
      "Add the sliced onions to the same pot once the meat is browned, letting them soften and pick up the fond left behind.",
      "Return the beef to the pot with enough water to almost cover everything, then bring to a bare simmer.",
      "Cover and cook low and slow for about 40 minutes — beef cuts suited to braising need this time for their connective tissue to break down into tenderness.",
      "Check for doneness by pulling a piece apart with a fork: it should come apart with little resistance, well past the 52°C of a rare steak.",
      "Let it rest a few minutes off the heat before serving, which lets the sauce settle and thicken slightly."
    ],
    ingredients: [
      { food_id: "168653", grams: 250 },
      { food_id: "170000", grams: 150 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Involtini di manzo con senape e erba cipollina",
    name_en: "Beef rolls with mustard and chives",
    meal_slot: "secondo", prep_min: 25,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Spalma le fette di manzo con senape e arrotolale.", "Rosola gli involtini e cuoci coperto 15 minuti."],
    steps_en: [
      "Pound the beef slices thin and even, so they roll without tearing and cook through quickly once in the pan.",
      "Spread a thin layer of mustard over each slice before rolling — spread it after rolling and it only coats the outside.",
      "Roll them up snugly and secure with a toothpick, or tie them, so they hold their shape while browning.",
      "Sear the rolls on all sides in a hot pan until deeply browned, which is most of their flavor in a dish this quick.",
      "Add a splash of water, cover, and cook on low heat for about 15 minutes more, until the beef is tender enough to cut easily.",
      "Scatter the chives over just before serving, and remove the toothpicks first."
    ],
    ingredients: [
      { food_id: "168726", grams: 220 },
      { food_id: "172234", grams: 12 },
      { food_id: "erba_cipollina_it", grams: 3 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Polpettone di manzo al forno",
    name_en: "Baked beef meatloaf",
    meal_slot: "secondo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 7.8,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Mescola manzo, pane ammollato e uovo.", "Forma il polpettone e inforna a 190°C per 40 minuti."],
    steps_en: [
      "Soak the bread in the milk until fully softened, then mash it into the meat rather than adding it dry — this is what keeps a meatloaf from turning dense.",
      "Mix the beef, soaked bread, egg and onion together just until evenly combined, since overmixing packs the loaf too tight to stay tender.",
      "Shape it into a compact loaf on a lined tray rather than in a tight pan, so heat reaches it from all sides and it browns rather than steams.",
      "Bake at 190°C for about 35 to 40 minutes, until the center reaches 74°C on a thermometer.",
      "Let it rest at least five minutes before slicing — cut too soon and it falls apart instead of holding together.",
      "Slice thickly and serve with the pan juices spooned over."
    ],
    ingredients: [
      { food_id: "171796", grams: 250 },
      { food_id: "pane_integrale_it", grams: 40 },
      { food_id: "latte_ps_it", grams: 40 },
      { food_id: "uovo_grande_it", grams: 30 },
      { food_id: "170000", grams: 50 }
    ]
  },
  {
    name: "Manzo in umido con rape e carote",
    name_en: "Beef stew with turnips and carrots",
    meal_slot: "secondo", prep_min: 45,
    profilo: "europeo-brasato", ha_amido: false, ha_proteina: true,
    tecnica: "composta", occasione: "lungo", health_score: 8.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola il manzo a cubetti.", "Aggiungi rape, carote e acqua e cuoci coperto 40 minuti."],
    steps_en: [
      "Cut the beef into even chunks and brown them hard in batches in the oil — a crowded pan steams the meat grey instead of browning it.",
      "Once all the beef is browned, return it to the pot with the diced turnip and carrot.",
      "Add water to almost cover everything, bring to a bare simmer, then cover and lower the heat right down.",
      "Cook gently for about 40 minutes — this cut of beef needs the long, slow time to turn tender rather than staying chewy.",
      "Check the vegetables are soft and the meat pulls apart easily with a fork before serving.",
      "Season at the end, once the stew has reduced and concentrated in flavor."
    ],
    ingredients: [
      { food_id: "168653", grams: 250 },
      { food_id: "rapa_it", grams: 120 },
      { food_id: "170393", grams: 100 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Bistecca di manzo con cipolle caramellate",
    name_en: "Beef steak with caramelized onions",
    meal_slot: "secondo", prep_min: 22,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci le cipolle nel burro finché dorate.", "Griglia la bistecca al punto desiderato."],
    steps_en: [
      "Slice the onions thin and cook them in the butter over low heat, stirring occasionally, for a full 15 minutes — there's no shortcut to real caramelization without burning them instead.",
      "Pat the steak dry and season it just before cooking, so the surface stays dry enough to sear rather than steam.",
      "Sear it in a very hot pan for a few minutes per side, without moving it, so a real crust forms.",
      "Check the internal temperature with a thermometer: about 52°C for rare, higher if preferred, keeping in mind it climbs a few more degrees while resting.",
      "Rest the steak for five minutes before slicing, tented loosely, so the juices redistribute through the meat.",
      "Slice against the grain and serve over the caramelized onions."
    ],
    ingredients: [
      { food_id: "168726", grams: 220 },
      { food_id: "170000", grams: 150 },
      { food_id: "burro_it", grams: 12 }
    ]
  },
  {
    name: "Wurstel con crauti e senape",
    name_en: "Sausages with sauerkraut and mustard",
    meal_slot: "secondo", prep_min: 15,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 6.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Scalda i crauti in padella.", "Scotta il wurstel e servi con senape."],
    steps_en: [
      "Warm the sauerkraut in a pan over medium heat, stirring occasionally, for about 8 minutes so it heats through without frying dry.",
      "Score the sausages lightly before cooking, which keeps the skins from splitting unevenly as they heat.",
      "Sear them in a separate hot pan, turning often, until the skins are browned and the sausages are heated through.",
      "Check the internal temperature reaches at least 74°C, since these are precooked sausages that mainly need reheating and color.",
      "Serve the sausages over the warm sauerkraut with the mustard on the side rather than mixed in, so its sharpness stays distinct.",
      "Eat immediately, while the sausages are still hot and the skins still have some snap."
    ],
    ingredients: [
      { food_id: "wurstel_it", grams: 150 },
      { food_id: "169279", grams: 150 },
      { food_id: "senape_it", grams: 12 }
    ]
  },
  {
    name: "Würstel di manzo con purè di patate",
    name_en: "Beef sausages with mashed potatoes",
    meal_slot: "secondo", prep_min: 22,
    profilo: "europeo-burro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 7.0,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lessa le patate e riducile in purè con il burro.", "Scotta i würstel e servi insieme."],
    steps_en: [
      "Boil the potatoes whole and unpeeled so they don't take on excess water, then peel and mash them hot with the butter.",
      "Score the sausages lightly so the skins don't split unevenly as they heat through.",
      "Sear them in a hot pan, turning often, until browned on the outside and heated through to at least 74°C.",
      "Mash the potatoes until smooth, adding a splash of the potato cooking water if they're stiffer than a spoon can spread easily.",
      "Season the mash with salt at the end, once the butter is fully worked in, so you can judge the right amount.",
      "Serve the sausages over the warm mash, sliced or whole."
    ],
    ingredients: [
      { food_id: "173862", grams: 150 },
      { food_id: "170028", grams: 220 },
      { food_id: "burro_it", grams: 15 }
    ]
  },
  {
    name: "Lenticchie stufate con carote e sedano",
    name_en: "Braised lentils with carrots and celery",
    meal_slot: "secondo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.2,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi carota e sedano, aggiungi le lenticchie e l'acqua.", "Cuoci 20 minuti."],
    steps_en: [
      "Dice the carrot and celery small so they soften fully in the same time it takes the lentils to cook.",
      "Sweat them in the oil over medium-low heat for about five minutes, building a sweet base before the lentils go in.",
      "Add the lentils and enough water to cover generously, then bring to a simmer.",
      "Cook uncovered for about 20 minutes, stirring occasionally, until the lentils are tender but still hold their shape.",
      "Check a lentil by pressing it: it should give way easily without turning to mush.",
      "Season with salt near the end and finish with a drizzle of raw olive oil."
    ],
    ingredients: [
      { food_id: "172420", grams: 180 },
      { food_id: "170393", grams: 80 },
      { food_id: "sedano_it", grams: 50 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Fagioli borlotti in umido con pomodoro",
    name_en: "Braised borlotti beans with tomato",
    meal_slot: "secondo", prep_min: 20,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.1,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi la cipolla, aggiungi pomodoro e fagioli.", "Cuoci 15 minuti a fuoco basso."],
    steps_en: [
      "Soften the onion in the oil over medium-low heat for a few minutes, so it turns sweet rather than sharp before the tomato goes in.",
      "Add the diced tomato and cook it down for a few minutes until it starts to break apart and release its juices.",
      "Stir in the drained beans and a splash of water, then simmer gently for about 15 minutes so the flavors meld.",
      "Crush a spoonful of beans against the side of the pan and stir back in, thickening the sauce naturally.",
      "Season with salt near the end, once the tomato has reduced and concentrated.",
      "Finish with a drizzle of raw olive oil for a rounder flavor than if it's cooked in from the start."
    ],
    ingredients: [
      { food_id: "fagioli_borlotti_it", grams: 200 },
      { food_id: "170457", grams: 150 },
      { food_id: "170000", grams: 50 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Ceci saltati con cavolo riccio e limone",
    name_en: "Sautéed chickpeas with kale and lemon",
    meal_slot: "secondo", prep_min: 15,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Salta i ceci scolati con aglio.", "Aggiungi il cavolo riccio e il limone."],
    steps_en: [
      "Drain and rinse the chickpeas well, then pat them dry — wetter chickpeas steam in the pan instead of taking on any color.",
      "Sauté them in the oil over medium-high heat for a few minutes until lightly golden and slightly crisp at the edges.",
      "Add the garlic only in the last thirty seconds, so it doesn't burn during the chickpeas' longer cooking time.",
      "Strip the kale from its stalks, tear the leaves, and add them to the pan, cooking just until wilted, a couple of minutes.",
      "Take the pan off the heat and squeeze the lemon over immediately, so its brightness doesn't cook off.",
      "Serve warm, while the chickpeas still have some of their crispness."
    ],
    ingredients: [
      { food_id: "175206", grams: 220 },
      { food_id: "kale_it", grams: 100 },
      { food_id: "169230", grams: 5 },
      { food_id: "171413", grams: 10 },
      { food_id: "limone_it", grams: 10 }
    ]
  },
  {
    name: "Piselli e carote in padella con aneto",
    name_en: "Sautéed peas and carrots with dill",
    meal_slot: "secondo", prep_min: 15,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Salta le carote nel burro qualche minuto.", "Aggiungi i piselli e l'aneto a fine cottura."],
    steps_en: [
      "Cut the carrots into small, even dice so they cook through in the same time the peas need.",
      "Sauté them in the butter over medium heat for about five minutes, until just starting to soften.",
      "Add the peas and a splash of water, cooking only 3 to 4 more minutes — much longer and they turn dull and lose their sweetness.",
      "Take the pan off the heat once the peas are bright green and just tender.",
      "Stir in the dill off the heat, so it keeps its color and fresh aroma instead of wilting in the residual warmth.",
      "Season with salt at the end and serve immediately while still bright."
    ],
    ingredients: [
      { food_id: "170419", grams: 200 },
      { food_id: "170393", grams: 80 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "aneto_it", grams: 4 }
    ]
  },
  {
    name: "Fagioli cannellini con porro e salvia",
    name_en: "Cannellini beans with leek and sage",
    meal_slot: "secondo", prep_min: 18,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Stufa il porro nell'olio con la salvia.", "Aggiungi i fagioli e scalda bene."],
    steps_en: [
      "Slice the leek thin, using only the white and pale green part, which softens sweetly rather than turning fibrous.",
      "Sweat it in the oil over low heat with the sage leaves for about five minutes, until soft and fragrant, letting the sage infuse the oil.",
      "Remove the sage leaves once their aroma has come through, so their flavor doesn't turn bitter from overcooking.",
      "Add the drained beans and a splash of water, warming everything through gently for a few minutes.",
      "Crush a few beans against the side of the pan to thicken the mixture slightly.",
      "Season with salt at the end and finish with a drizzle of raw olive oil."
    ],
    ingredients: [
      { food_id: "fagioli_cannellini_it", grams: 220 },
      { food_id: "porro_it", grams: 100 },
      { food_id: "salvia_it", grams: 2 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Lenticchie con cavolo rapa e cumino",
    name_en: "Lentils with kohlrabi and caraway",
    meal_slot: "secondo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.1,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi il cavolo rapa a cubetti con i semi di cumino.", "Aggiungi le lenticchie e l'acqua e cuoci 20 minuti."],
    steps_en: [
      "Peel the kohlrabi before dicing it small — its outer skin stays tough even after a full simmer.",
      "Sauté the diced kohlrabi in the oil with the caraway seeds for a few minutes, letting the seeds toast slightly and release more aroma.",
      "Add the lentils and enough water to cover generously, then bring to a simmer.",
      "Cook uncovered for about 20 minutes, until the lentils are tender and the kohlrabi has softened but keeps some bite.",
      "Check a lentil by pressing it against the side of the pan: it should give way easily.",
      "Season with salt near the end, once most of the liquid has been absorbed."
    ],
    ingredients: [
      { food_id: "172420", grams: 180 },
      { food_id: "cavolo_rapa_it", grams: 100 },
      { food_id: "170923", grams: 2 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Ceci in umido con carote e alloro",
    name_en: "Braised chickpeas with carrots and bay leaf",
    meal_slot: "secondo", prep_min: 20,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi le carote con l'alloro, aggiungi i ceci e l'acqua.", "Cuoci 15 minuti a fuoco basso."],
    steps_en: [
      "Dice the carrots small so they soften within the shorter time chickpeas that are already cooked need.",
      "Sauté them in the oil with the bay leaf for a few minutes, letting the leaf infuse the oil before the other ingredients go in.",
      "Add the drained chickpeas and a splash of water, then simmer gently for about 15 minutes.",
      "Crush a few chickpeas against the side of the pan to thicken the liquid slightly.",
      "Remove the bay leaf before serving — it's there to flavor the dish, not to be eaten.",
      "Season with salt at the end and finish with a drizzle of raw olive oil."
    ],
    ingredients: [
      { food_id: "175206", grams: 220 },
      { food_id: "170393", grams: 80 },
      { food_id: "170917", grams: 1 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Frittata di patate e cipolle",
    name_en: "Potato and onion frittata",
    meal_slot: "secondo", prep_min: 22,
    profilo: "europeo-burro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 7.8,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci patate e cipolle a fette nel burro.", "Versa le uova sbattute e cuoci coperto a fuoco basso."],
    steps_en: [
      "Slice the potatoes thin so they cook through in the pan without needing to be boiled first.",
      "Cook them slowly in the butter with the sliced onion over medium-low heat, turning occasionally, for about 12 minutes until tender and lightly golden.",
      "Beat the eggs with a pinch of salt and pour them over the potatoes once they're fully soft, tilting the pan so the egg reaches every gap.",
      "Cover and cook on low heat for several minutes, until the edges set and only the very center looks slightly loose.",
      "Finish it under a hot grill for a minute if the top needs setting, rather than flipping it, which risks breaking it apart.",
      "Let it rest a few minutes before slicing, so it holds together cleanly."
    ],
    ingredients: [
      { food_id: "170028", grams: 200 },
      { food_id: "170000", grams: 80 },
      { food_id: "burro_it", grams: 12 },
      { food_id: "uovo_grande_it", grams: 150 }
    ]
  },
  {
    name: "Uova in camicia su spinaci saltati",
    name_en: "Poached eggs over sautéed spinach",
    meal_slot: "secondo", prep_min: 15,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.3,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Salta gli spinaci nel burro.", "Cuoci le uova in camicia e adagiale sopra."],
    steps_en: [
      "Wilt the spinach in the butter over medium heat for just a couple of minutes — much longer and it turns watery and loses its color.",
      "Bring a pot of water to a bare simmer, not a rolling boil, since vigorous bubbles break the eggs apart as they poach.",
      "Crack each egg into a small cup first, then slide it gently into the water — this avoids breaking the yolk, which happens easily cracking straight into the pot.",
      "Poach for about 3 minutes, until the white is fully set but the yolk still moves when the egg is nudged.",
      "Lift each egg out with a slotted spoon and rest it briefly on a cloth to drain the excess water.",
      "Place the eggs over the warm spinach and season with a little salt right at the table, letting the yolk run into the greens when cut."
    ],
    ingredients: [
      { food_id: "spinaci_it", grams: 200 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "uovo_grande_it", grams: 100 }
    ]
  },
  {
    name: "Uova strapazzate con funghi porcini",
    name_en: "Scrambled eggs with porcini mushrooms",
    meal_slot: "secondo", prep_min: 15,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Rosola i funghi porcini nel burro.", "Aggiungi le uova sbattute e cuoci mescolando a fuoco basso."],
    steps_en: [
      "Sear the porcini in a hot, dry pan first, without crowding them, so they brown rather than release water and steam.",
      "Add the butter once they've colored, letting it melt around the mushrooms and pick up their flavor.",
      "Beat the eggs just until combined and pour them into the pan, lowering the heat right away.",
      "Stir slowly and constantly, pulling the curds from the edges toward the center as they set.",
      "Take the pan off the heat while the eggs still look slightly underdone — residual heat finishes them, keeping the texture creamy rather than dry.",
      "Finish with the parsley stirred in off the heat and serve immediately."
    ],
    ingredients: [
      { food_id: "funghi_porcini_it", grams: 120 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "uovo_grande_it", grams: 150 },
      { food_id: "prezzemolo_it", grams: 3 }
    ]
  }
];
