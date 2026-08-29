// centro_nord_generico — contorni (45)
module.exports = [
  {
    name: "Purè di patate al burro",
    name_en: "Mashed potatoes with butter",
    meal_slot: "contorno", prep_min: 22,
    profilo: "europeo-burro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.2,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lessa le patate intere e schiacciale con il burro.", "Regola di sale."],
    steps_en: [
      "Boil the potatoes whole and unpeeled — cut pieces soak up water and make for a watery, gluey mash.",
      "Test doneness with a knife: it should slide in with no resistance at all.",
      "Peel them while still hot, working quickly since cooled potatoes turn gummy once mashed.",
      "Mash with the butter added gradually, so it melts in fully rather than sitting in separate pools.",
      "Add a splash of the potato cooking water if the mash is stiffer than a spoon can spread easily.",
      "Season with salt at the very end, once you can taste the balance with the butter already in."
    ],
    ingredients: [
      { food_id: "170028", grams: 250 },
      { food_id: "burro_it", grams: 15 }
    ]
  },
  {
    name: "Patate al forno con rosmarino",
    name_en: "Roasted potatoes with rosemary",
    meal_slot: "contorno", prep_min: 25,
    profilo: "europeo-erbe", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.1,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Taglia le patate a spicchi e condisci con olio e rosmarino.", "Inforna a 200°C per 25 minuti."],
    steps_en: [
      "Cut the potatoes into even wedges so they roast at the same rate rather than some burning while others stay raw.",
      "Toss them with the oil and rosemary while still slightly damp — the moisture helps the seasoning cling.",
      "Spread them on the tray with space between pieces; crowding traps steam and keeps them from browning.",
      "Roast at 200°C for about 25 minutes, turning once halfway through so more than one side crisps.",
      "Check doneness with a fork: it should pierce easily while the outside stays crisp.",
      "Season with salt right when they come out of the oven, while the surface is still hot enough for it to stick."
    ],
    ingredients: [
      { food_id: "170028", grams: 250 },
      { food_id: "171413", grams: 12 },
      { food_id: "rosmarino_it", grams: 3 }
    ]
  },
  {
    name: "Patate lesse con erba cipollina",
    name_en: "Boiled potatoes with chives",
    meal_slot: "contorno", prep_min: 20,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 8.3,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Lessa le patate piccole intere.", "Condisci con olio e erba cipollina."],
    steps_en: [
      "Choose potatoes of similar small size so they all cook through at the same time.",
      "Boil them whole and unpeeled in salted water until a knife slides in easily, about 18 minutes.",
      "Drain well and let them steam-dry for a minute in the empty pot, uncovered, which stops them turning soggy.",
      "Toss them with the oil while still hot, so it coats every piece evenly.",
      "Snip the chives with scissors directly over the potatoes just before serving, so they keep their color.",
      "Season with salt at the table, since preferences vary more here than with most dishes."
    ],
    ingredients: [
      { food_id: "170028", grams: 250 },
      { food_id: "171413", grams: 10 },
      { food_id: "erba_cipollina_it", grams: 4 }
    ]
  },
  {
    name: "Patate saltate con cipolle",
    name_en: "Sautéed potatoes with onions",
    meal_slot: "contorno", prep_min: 20,
    profilo: "europeo-burro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci le patate a fette nel burro con le cipolle.", "Rosola finché dorate."],
    steps_en: [
      "Boil or steam the potato slices for about 5 minutes first, just until they start to soften — this shortcut keeps them from burning outside before cooking through in the pan.",
      "Slice the onion thin so it softens and browns at roughly the same rate as the potatoes.",
      "Melt the butter over medium heat and add both together, spreading them in a single layer.",
      "Let them sit undisturbed for a couple of minutes at a time before turning, so real color develops instead of steaming.",
      "Cook a total of about 12 minutes, turning occasionally, until both are golden at the edges.",
      "Season with salt only near the end, since salting raw potato too early can make it stick to the pan."
    ],
    ingredients: [
      { food_id: "170028", grams: 250 },
      { food_id: "170000", grams: 80 },
      { food_id: "burro_it", grams: 12 }
    ]
  },
  {
    name: "Patate arrosto con semi di cumino",
    name_en: "Roasted potatoes with caraway seeds",
    meal_slot: "contorno", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Taglia le patate a cubetti e condisci con olio e cumino.", "Inforna a 200°C per 22 minuti."],
    steps_en: [
      "Cut the potatoes into even cubes so they roast at the same rate.",
      "Toss them with the oil and caraway seeds, making sure the seeds are distributed rather than clumped in one spot.",
      "Spread them in a single layer with space between pieces, so hot air can crisp all sides rather than steaming them.",
      "Roast at 200°C for about 22 minutes, turning once halfway through.",
      "Check for doneness by piercing a cube — it should be soft inside with a crisp, browned surface.",
      "Season with salt right out of the oven, while the surface is still hot enough to hold it."
    ],
    ingredients: [
      { food_id: "170028", grams: 250 },
      { food_id: "171413", grams: 10 },
      { food_id: "170923", grams: 3 }
    ]
  },
  {
    name: "Patate al forno con paprika",
    name_en: "Roasted potatoes with paprika",
    meal_slot: "contorno", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Taglia le patate a spicchi e condisci con olio e paprika.", "Inforna a 200°C per 25 minuti."],
    steps_en: [
      "Cut the potatoes into even wedges so every piece roasts at the same rate.",
      "Toss them with the oil first, then the paprika — coating them in oil first helps the spice stick rather than clumping in dry patches.",
      "Spread them out with space between the pieces, since crowding traps steam and stops proper browning.",
      "Roast at 200°C for about 25 minutes, turning once so more than one side crisps.",
      "Check doneness with a fork; the inside should be soft while the surface stays crisp.",
      "Season with salt as soon as they come out, while still hot enough for it to cling."
    ],
    ingredients: [
      { food_id: "170028", grams: 250 },
      { food_id: "171413", grams: 12 },
      { food_id: "171329", grams: 3 }
    ]
  },
  {
    name: "Insalata di patate tiepida",
    name_en: "Warm potato salad",
    meal_slot: "contorno", prep_min: 22,
    profilo: "europeo-aceto", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.2,
    base_amidacea: true, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Lessa le patate e tagliale a fette calde.", "Condisci con cipolla, aceto e olio."],
    steps_en: [
      "Boil the potatoes whole and unpeeled, so they hold their shape once sliced rather than falling apart.",
      "Slice them while still warm — warm potato absorbs the dressing far better than cold, which is the whole point of this salad.",
      "Whisk the vinegar and oil together with the finely diced onion while the potatoes cook, so the onion softens slightly in the acid.",
      "Pour the dressing over the warm potato slices right away and toss gently, so they don't break apart.",
      "Let it sit at least five minutes before serving, so the flavors have time to soak in.",
      "Serve warm or at room temperature, not chilled — the cold dulls the dressing's flavor noticeably."
    ],
    ingredients: [
      { food_id: "170028", grams: 250 },
      { food_id: "170000", grams: 50 },
      { food_id: "173469", grams: 12 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Cavolo verza saltato con burro",
    name_en: "Sautéed savoy cabbage with butter",
    meal_slot: "contorno", prep_min: 15,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Salta il cavolo verza nel burro.", "Cuoci fino a farlo appassire."],
    steps_en: [
      "Shred the cabbage fairly fine so it wilts through evenly in the short cooking time.",
      "Melt the butter over medium heat until it foams, then add the cabbage in batches if the pan is small.",
      "Cook, stirring often, for about 7 minutes until it's wilted and lightly golden at the edges, not mushy throughout.",
      "Keep the heat at medium rather than high — cabbage this thin can scorch before it's tender if the pan is too hot.",
      "Season with salt only near the end of cooking, since salting early draws out water and slows the browning.",
      "Serve immediately, while the edges still have a little bite."
    ],
    ingredients: [
      { food_id: "cavolo_verza_it", grams: 250 },
      { food_id: "burro_it", grams: 12 }
    ]
  },
  {
    name: "Cavolo verza brasato con semi di cumino",
    name_en: "Braised savoy cabbage with caraway",
    meal_slot: "contorno", prep_min: 20,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.8,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Stufa il cavolo verza nell'olio con i semi di cumino.", "Cuoci coperto 15 minuti con poca acqua."],
    steps_en: [
      "Shred the cabbage and toast the caraway seeds in the oil for thirty seconds before adding it, which brings out far more of their aroma than adding them raw.",
      "Add the cabbage and a splash of water, then cover the pan right away to trap the steam that braises it.",
      "Cook on low heat for about 15 minutes, stirring occasionally, until the cabbage is fully tender rather than just wilted.",
      "Check the liquid hasn't dried out partway through — add another splash of water if the pan looks dry.",
      "Season with salt near the end, once the cabbage has had time to soften and take on the caraway's flavor.",
      "Serve warm; this cabbage also holds well and can be reheated without losing much texture."
    ],
    ingredients: [
      { food_id: "cavolo_verza_it", grams: 250 },
      { food_id: "170923", grams: 3 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Cavolo riccio saltato con aglio",
    name_en: "Sautéed kale with garlic",
    meal_slot: "contorno", prep_min: 12,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 9.2,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Strappa il cavolo riccio dai gambi e saltalo con aglio.", "Cuoci finché appassito."],
    steps_en: [
      "Strip the kale from its tough central stalks and tear the leaves into pieces — the stalks stay fibrous however long you cook them.",
      "Heat the oil until shimmering, then add the garlic for just thirty seconds, before it has any chance to burn.",
      "Add the kale in batches if needed and cook over medium-high heat, stirring often, for about 5 minutes.",
      "The kale is ready once it's wilted and deep green, with the edges just starting to crisp slightly.",
      "Squeeze the lemon over right at the end, off the heat, so its brightness doesn't cook away.",
      "Serve immediately, while it's still hot and the edges retain some texture."
    ],
    ingredients: [
      { food_id: "kale_it", grams: 220 },
      { food_id: "169230", grams: 5 },
      { food_id: "171413", grams: 10 },
      { food_id: "limone_it", grams: 8 }
    ]
  },
  {
    name: "Cavolo riccio croccante al forno",
    name_en: "Crispy baked kale",
    meal_slot: "contorno", prep_min: 15,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.9,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Condisci il cavolo riccio con olio.", "Inforna a 160°C per 12 minuti finché croccante."],
    steps_en: [
      "Strip the kale from its stalks and tear the leaves into even, palm-sized pieces so they crisp uniformly.",
      "Dry the leaves thoroughly first — any leftover water steams the kale instead of letting it crisp in the oven.",
      "Toss with just enough oil to coat lightly; too much oil makes the leaves soggy rather than crisp.",
      "Spread them in a single layer without overlapping, so hot air reaches every leaf.",
      "Bake at 160°C for about 12 minutes, checking from the 8-minute mark, since kale can go from crisp to burnt quickly.",
      "Season with salt right after baking and let cool slightly — the leaves crisp further as they cool."
    ],
    ingredients: [
      { food_id: "kale_it", grams: 200 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Crauti stufati con mela",
    name_en: "Braised sauerkraut with apple",
    meal_slot: "contorno", prep_min: 20,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.4,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci i crauti con la mela a cubetti e un filo d'olio.", "Cuoci coperto 15 minuti."],
    steps_en: [
      "Rinse the sauerkraut briefly if it tastes very sharp, which softens its acidity before it dominates the dish.",
      "Dice the apple with its skin on, which holds its shape better than peeled apple through the cooking time.",
      "Cook the sauerkraut and apple together in the oil over low heat, covered, for about 15 minutes.",
      "Stir occasionally, adding a splash of water if the pan looks dry, since sauerkraut can catch on the bottom once its own liquid cooks off.",
      "The apple should soften but still hold some shape — check by pressing a piece with a spoon.",
      "Taste before adding salt: sauerkraut is already salty on its own from fermentation."
    ],
    ingredients: [
      { food_id: "169279", grams: 220 },
      { food_id: "mela_it", grams: 80 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Insalata di crauti e mela",
    name_en: "Sauerkraut and apple salad",
    meal_slot: "contorno", prep_min: 10,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.7,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Scola i crauti e uniscili alla mela a fette.", "Condisci con olio."],
    steps_en: [
      "Drain the sauerkraut well, pressing out excess liquid so the salad isn't watery.",
      "Cut the apple into thin matchsticks rather than cubes, so it mixes evenly through the shredded sauerkraut.",
      "Toss the apple with a squeeze of lemon if you have it handy, to keep it from browning while you finish.",
      "Combine the sauerkraut and apple in a bowl, tossing gently rather than stirring hard, to keep the apple's crunch.",
      "Dress with the oil just before serving, since the salad loses its crispness the longer it sits dressed.",
      "Serve cold, straight from the fridge, as this salad is meant to be refreshing rather than warmed."
    ],
    ingredients: [
      { food_id: "169279", grams: 200 },
      { food_id: "mela_it", grams: 100 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Cavolo rapa saltato con burro",
    name_en: "Sautéed kohlrabi with butter",
    meal_slot: "contorno", prep_min: 15,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Taglia il cavolo rapa a bastoncini e saltalo nel burro.", "Cuoci finché tenero."],
    steps_en: [
      "Peel the kohlrabi first — its outer skin stays tough and fibrous no matter how long it cooks.",
      "Cut it into even matchsticks so it cooks through quickly rather than staying raw at the center of thicker pieces.",
      "Melt the butter over medium heat and add the kohlrabi, spreading it in a single layer.",
      "Cook, stirring occasionally, for about 8 minutes until tender with a little bite left, not fully soft.",
      "Season with salt partway through rather than at the start, so it doesn't draw out too much moisture too early.",
      "Serve while still slightly firm — kohlrabi turns watery if pushed past this point."
    ],
    ingredients: [
      { food_id: "cavolo_rapa_it", grams: 220 },
      { food_id: "burro_it", grams: 10 }
    ]
  },
  {
    name: "Cavolo rapa in insalata con limone",
    name_en: "Kohlrabi salad with lemon",
    meal_slot: "contorno", prep_min: 10,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 9.1,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Taglia il cavolo rapa a julienne sottile.", "Condisci con limone e olio."],
    steps_en: [
      "Peel the kohlrabi and cut it into thin matchsticks — cut too thick, it stays crunchy in a way that's hard to eat raw.",
      "Salt the matchsticks lightly and let them sit five minutes, which draws out a little water and softens the raw bite slightly.",
      "Pat them dry before dressing, or the salad turns watery once the lemon and oil are added.",
      "Whisk the lemon juice and oil together first, so the dressing is emulsified rather than separated when it hits the kohlrabi.",
      "Toss just before serving, since the lemon continues to soften the kohlrabi the longer it sits.",
      "Serve cold as a crisp, sharp side to richer dishes."
    ],
    ingredients: [
      { food_id: "cavolo_rapa_it", grams: 200 },
      { food_id: "limone_it", grams: 12 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Carote glassate al miele",
    name_en: "Honey-glazed carrots",
    meal_slot: "contorno", prep_min: 18,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.5,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci le carote nel burro con poca acqua e miele.", "Fai restringere finché lucide."],
    steps_en: [
      "Cut the carrots into even sticks or rounds so they cook through at the same rate.",
      "Simmer them in the butter with a splash of water, covered, for about 10 minutes until just tender.",
      "Uncover and add the honey, then raise the heat slightly so the liquid reduces to a glaze rather than staying watery.",
      "Toss the carrots often in the last few minutes, so they get evenly coated as the glaze thickens and turns glossy.",
      "Watch closely once the liquid has mostly reduced — honey burns quickly if left too long over high heat.",
      "Serve immediately, while the glaze is still warm and shiny."
    ],
    ingredients: [
      { food_id: "170393", grams: 250 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "miele_it", grams: 10 }
    ]
  },
  {
    name: "Carote al burro con prezzemolo",
    name_en: "Buttered carrots with parsley",
    meal_slot: "contorno", prep_min: 15,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci le carote a rondelle nel burro con poca acqua.", "Cospargi di prezzemolo."],
    steps_en: [
      "Slice the carrots into even rounds so they all soften at the same rate.",
      "Cook them in the butter with a splash of water, covered, over medium-low heat for about 10 minutes.",
      "Check doneness with a fork: they should be tender but not falling apart.",
      "Uncover for the last minute or two if there's excess liquid left, letting it reduce into the butter.",
      "Season with salt once tender, tasting to balance the carrots' natural sweetness.",
      "Scatter the parsley over just before serving so it stays bright rather than wilting in the residual heat."
    ],
    ingredients: [
      { food_id: "170393", grams: 250 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "prezzemolo_it", grams: 3 }
    ]
  },
  {
    name: "Carote e pastinaca al forno",
    name_en: "Roasted carrots and parsnips",
    meal_slot: "contorno", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.6,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Taglia carote e pastinaca a bastoncini e condisci con olio.", "Inforna a 200°C per 22 minuti."],
    steps_en: [
      "Cut the carrots and parsnips into sticks of a similar thickness so they roast at the same rate.",
      "Toss them with the oil, making sure every piece is lightly coated rather than pooling oil at the bottom of the bowl.",
      "Spread them on the tray in a single layer with space between pieces, so they roast rather than steam.",
      "Roast at 200°C for about 22 minutes, turning once halfway through for even browning.",
      "Check the parsnip especially — its woody core needs full roasting time to turn soft.",
      "Season with salt right when they come out, while still hot."
    ],
    ingredients: [
      { food_id: "170393", grams: 150 },
      { food_id: "pastinaca_it", grams: 150 },
      { food_id: "171413", grams: 12 }
    ]
  },
  {
    name: "Rape e carote saltate al burro",
    name_en: "Sautéed turnips and carrots with butter",
    meal_slot: "contorno", prep_min: 18,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.6,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Taglia rape e carote a cubetti e saltale nel burro.", "Cuoci coperto finché tenere."],
    steps_en: [
      "Peel the turnips before cutting — their skin can carry a faint bitterness the flesh doesn't have.",
      "Cut both vegetables into cubes of similar size so they cook through together rather than one lagging behind.",
      "Melt the butter over medium heat, add the vegetables, and cook uncovered for a couple of minutes to pick up some color.",
      "Cover and lower the heat, letting them steam in their own moisture for about 10 minutes until fully tender.",
      "Check with a fork: both should give way easily with no resistance.",
      "Season with salt at the end and serve while still warm."
    ],
    ingredients: [
      { food_id: "rapa_it", grams: 150 },
      { food_id: "170393", grams: 100 },
      { food_id: "burro_it", grams: 10 }
    ]
  },
  {
    name: "Rape al forno con timo",
    name_en: "Roasted turnips with thyme",
    meal_slot: "contorno", prep_min: 25,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.5,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Taglia le rape a spicchi e condisci con olio e timo.", "Inforna a 200°C per 22 minuti."],
    steps_en: [
      "Peel the turnips and cut them into even wedges, so they roast through at the same rate.",
      "Toss with the oil and thyme, pressing the leaves gently into the surface so they don't just fall off in the oven.",
      "Spread in a single layer with space between pieces, letting hot air brown the cut sides properly.",
      "Roast at 200°C for about 22 minutes, turning once so more than one side gets color.",
      "Check doneness with a knife — it should slide in without resistance.",
      "Season with salt right out of the oven, when the surface is still hot enough for it to stick."
    ],
    ingredients: [
      { food_id: "rapa_it", grams: 250 },
      { food_id: "171413", grams: 10 },
      { food_id: "timo_it", grams: 2 }
    ]
  },
  {
    name: "Pastinaca al forno con miele",
    name_en: "Roasted parsnips with honey",
    meal_slot: "contorno", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.3,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Taglia la pastinaca a bastoncini e condisci con olio.", "Inforna a 200°C e aggiungi il miele negli ultimi 5 minuti."],
    steps_en: [
      "Cut the parsnips into even sticks — the woody core near the top needs the same thickness as the rest to cook through.",
      "Toss them with the oil and spread in a single layer, giving each piece room to brown rather than steam.",
      "Roast at 200°C for about 18 minutes, until mostly tender when pierced with a knife.",
      "Drizzle the honey over and toss gently, then return to the oven for a final 5 minutes so it caramelizes rather than just melts.",
      "Watch closely in these last minutes — honey can burn quickly once the oven's heat concentrates on it.",
      "Serve hot, while the glaze is still glossy."
    ],
    ingredients: [
      { food_id: "pastinaca_it", grams: 250 },
      { food_id: "171413", grams: 10 },
      { food_id: "miele_it", grams: 10 }
    ]
  },
  {
    name: "Purè di rape e patate",
    name_en: "Turnip and potato mash",
    meal_slot: "contorno", prep_min: 22,
    profilo: "europeo-burro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.3,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lessa rape e patate insieme.", "Schiaccia con il burro."],
    steps_en: [
      "Cut the turnips and potatoes into similar-sized pieces so they finish cooking at the same time.",
      "Boil them together in salted water until both are completely soft, about 18 minutes.",
      "Drain well and let them sit uncovered for a minute so excess steam escapes before mashing.",
      "Mash with the butter added gradually, so it melts in fully rather than sitting in pools.",
      "The mash will be slightly looser than an all-potato version, since turnip holds more water — that's expected.",
      "Season with salt at the end, tasting to balance the turnip's natural bitterness."
    ],
    ingredients: [
      { food_id: "rapa_it", grams: 150 },
      { food_id: "170028", grams: 150 },
      { food_id: "burro_it", grams: 12 }
    ]
  },
  {
    name: "Porri al burro gratinati",
    name_en: "Gratinéed leeks with butter and cheese",
    meal_slot: "contorno", prep_min: 25,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Stufa i porri nel burro e disponili in teglia con emmental.", "Gratina in forno finché dorato."],
    steps_en: [
      "Slice the leeks lengthwise and rinse well between the layers, where grit tends to hide.",
      "Sweat them in the butter over low heat, covered, for about 10 minutes, until fully soft but not browned.",
      "Arrange the softened leeks in a single layer in a baking dish, so the cheese covers them evenly rather than sliding to one side.",
      "Scatter the grated Emmental over the top, covering the leeks completely so they don't dry out under the grill.",
      "Grill or bake at high heat for about 5 minutes, until the cheese is melted and golden in spots.",
      "Let it sit a minute before serving, so the cheese sets slightly rather than running everywhere."
    ],
    ingredients: [
      { food_id: "porro_it", grams: 250 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "emmental_it", grams: 40 }
    ]
  },
  {
    name: "Porri brasati al limone",
    name_en: "Braised leeks with lemon",
    meal_slot: "contorno", prep_min: 18,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.8,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Stufa i porri nell'olio con poca acqua.", "Finisci con succo di limone."],
    steps_en: [
      "Slice the leeks lengthwise and rinse well between the layers to remove any trapped grit.",
      "Cut them into short lengths and cook in the oil over low heat with a splash of water, covered, for about 12 minutes.",
      "Check they've turned fully soft and slightly translucent, not just wilted at the edges.",
      "Uncover for the last couple of minutes if there's still visible liquid, letting it reduce down.",
      "Squeeze the lemon juice over right at the end, off the heat, so its brightness stays sharp rather than cooking away.",
      "Serve warm, spooning any pan juices over the top."
    ],
    ingredients: [
      { food_id: "porro_it", grams: 250 },
      { food_id: "171413", grams: 10 },
      { food_id: "limone_it", grams: 10 }
    ]
  },
  {
    name: "Porri saltati con noci",
    name_en: "Sautéed leeks with walnuts",
    meal_slot: "contorno", prep_min: 15,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.5,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: true,
    steps: ["Salta i porri nel burro finché teneri.", "Aggiungi le noci tostate."],
    steps_en: [
      "Slice the leeks into rounds and rinse well, since dirt often hides between the inner layers.",
      "Melt the butter over medium heat and add the leeks, cooking gently for about 8 minutes until soft and just starting to color.",
      "Toast the walnuts separately in a dry pan for a couple of minutes while the leeks cook, which brings out an aroma raw walnuts don't have.",
      "Break the toasted walnuts into rough pieces by hand rather than chopping fine, so they keep some crunch.",
      "Fold the walnuts through the leeks off the heat, right before serving, so they don't soften.",
      "Season with salt at the end and serve warm."
    ],
    ingredients: [
      { food_id: "porro_it", grams: 250 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "noci_it", grams: 15 }
    ]
  },
  {
    name: "Barbabietola in insalata con aceto di mele",
    name_en: "Beetroot salad with apple vinegar",
    meal_slot: "contorno", prep_min: 20,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 9.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Lessa la barbabietola, raffredda e affetta.", "Condisci con aceto di mele e olio."],
    steps_en: [
      "Boil the beetroot whole and unpeeled, with the skin on, so its color and nutrients don't bleed out into the water.",
      "Cook until a knife slides in easily, then cool it enough to handle before peeling — the skin rubs off far easier warm than cold.",
      "Slice it into even rounds, wearing gloves if you'd rather not stain your hands.",
      "Whisk the vinegar and oil together separately, so the dressing is emulsified before it touches the beetroot.",
      "Dress the beetroot just before serving, since the vinegar keeps deepening its color the longer it sits.",
      "Serve cold or at room temperature as a sharp, colorful side."
    ],
    ingredients: [
      { food_id: "barbabietola_australiana_it", grams: 250 },
      { food_id: "173469", grams: 12 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Barbabietola al forno con aneto",
    name_en: "Roasted beetroot with dill",
    meal_slot: "contorno", prep_min: 25,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.9,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Avvolgi la barbabietola nella carta forno e cuoci a 200°C per 20 minuti.", "Affetta e condisci con olio e aneto."],
    steps_en: [
      "Wrap the whole, unpeeled beetroot loosely in baking paper — roasting it wrapped keeps it from drying out over the longer cooking time.",
      "Roast at 200°C for about 20 minutes for smaller beetroots, checking with a knife through the paper for tenderness.",
      "Let it cool enough to handle, then peel — the skin slips off far more easily once roasted than raw.",
      "Cut into wedges rather than thin slices, which suits the denser texture roasting gives it.",
      "Toss with the oil while still slightly warm, so it absorbs the flavor better than once fully cooled.",
      "Scatter the dill over just before serving so it stays fresh and doesn't wilt from residual heat."
    ],
    ingredients: [
      { food_id: "barbabietola_australiana_it", grams: 250 },
      { food_id: "171413", grams: 10 },
      { food_id: "aneto_it", grams: 4 }
    ]
  },
  {
    name: "Barbabietola e cetriolo in insalata",
    name_en: "Beetroot and cucumber salad",
    meal_slot: "contorno", prep_min: 15,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 9.1,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Lessa la barbabietola e taglia a cubetti con il cetriolo.", "Condisci con olio e limone."],
    steps_en: [
      "Boil the beetroot whole and unpeeled so its color stays inside rather than leaching into the water.",
      "Cool it enough to peel comfortably, then dice it along with the raw cucumber into similar-sized cubes.",
      "Keep the beetroot and cucumber separate until just before dressing, since beetroot's juice will otherwise stain the cucumber deep pink.",
      "Whisk the lemon juice and oil together, then toss both vegetables together with the dressing right before serving.",
      "Serve immediately for the cleanest contrast between the beetroot's earthiness and the cucumber's crunch.",
      "If made ahead, keep the components separate and combine only at the table."
    ],
    ingredients: [
      { food_id: "barbabietola_australiana_it", grams: 150 },
      { food_id: "168409", grams: 120 },
      { food_id: "171413", grams: 10 },
      { food_id: "limone_it", grams: 8 }
    ]
  },
  {
    name: "Insalata di cetrioli allo yogurt",
    name_en: "Cucumber salad with yogurt",
    meal_slot: "contorno", prep_min: 10,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Affetta il cetriolo sottile e mescola con lo yogurt.", "Aggiungi aneto e sale."],
    steps_en: [
      "Slice the cucumber thin, then salt the slices lightly and let them sit five minutes to draw out their water.",
      "Pat the slices dry afterward — skipping this step is what makes this salad turn watery within minutes.",
      "Stir the yogurt with a small pinch of salt first, so it's already seasoned before the cucumber goes in.",
      "Fold the dried cucumber into the yogurt gently, keeping the slices mostly intact rather than crushing them.",
      "Scatter the dill over the top just before serving, so it stays bright rather than sinking in and darkening.",
      "Serve cold, and eat soon after mixing — the cucumber releases more water again over time."
    ],
    ingredients: [
      { food_id: "168409", grams: 200 },
      { food_id: "171284", grams: 80 },
      { food_id: "aneto_it", grams: 4 }
    ]
  },
  {
    name: "Insalata di cetrioli e aneto",
    name_en: "Cucumber and dill salad",
    meal_slot: "contorno", prep_min: 10,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 9.2,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Affetta il cetriolo sottile e condisci con aceto di mele.", "Aggiungi l'aneto."],
    steps_en: [
      "Slice the cucumber into thin rounds, using a mandoline if you have one for even thickness.",
      "Salt the slices lightly and let them sit for five minutes, then drain off the water that collects — this keeps the final salad crisp instead of diluted.",
      "Whisk the vinegar with a touch of oil if you like, then toss it with the drained cucumber.",
      "Add the dill last, tossing gently so it doesn't bruise and darken.",
      "Let it sit a couple of minutes before serving so the vinegar's flavor comes through, but not so long that the cucumber turns limp.",
      "Serve cold, as a sharp counterpoint to richer dishes."
    ],
    ingredients: [
      { food_id: "168409", grams: 220 },
      { food_id: "173469", grams: 10 },
      { food_id: "aneto_it", grams: 4 }
    ]
  },
  {
    name: "Insalata di cavolo cappuccio e carote",
    name_en: "Cabbage and carrot slaw",
    meal_slot: "contorno", prep_min: 15,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 9.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Taglia cavolo e carota a julienne sottile.", "Condisci con aceto di mele e olio."],
    steps_en: [
      "Shred the cabbage and carrot as thin as you can, since thicker pieces stay tough to chew raw.",
      "Salt the shredded cabbage lightly and let it sit for ten minutes, then squeeze out the water this draws — it keeps the slaw crisp instead of watery.",
      "Whisk the vinegar and oil together into a light dressing rather than something thick and creamy.",
      "Toss the cabbage and carrot together with the dressing, mixing thoroughly so every strand gets some.",
      "Let it rest at least ten minutes before serving, which softens the raw edge of the cabbage slightly.",
      "Serve cold; this slaw actually improves after an hour or two in the fridge as the flavors settle."
    ],
    ingredients: [
      { food_id: "cavolo_cappuccio_it", grams: 200 },
      { food_id: "170393", grams: 80 },
      { food_id: "173469", grams: 10 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Piselli al burro con aneto",
    name_en: "Buttered peas with dill",
    meal_slot: "contorno", prep_min: 10,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci i piselli in poca acqua per 5 minuti.", "Manteca con burro e aneto."],
    steps_en: [
      "Simmer the peas in a small amount of water for only about 5 minutes — much longer and they lose their bright color and turn dull.",
      "Drain them, saving a splash of the cooking water in case the butter needs loosening.",
      "Return the peas to the warm pan off the direct heat and stir in the butter until it melts and coats them.",
      "Add a splash of the reserved water if the butter looks like it's separating rather than emulsifying.",
      "Stir in the dill last, once the butter is fully incorporated, so it keeps its color.",
      "Serve immediately, while the peas are still bright green and the butter glossy."
    ],
    ingredients: [
      { food_id: "170419", grams: 220 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "aneto_it", grams: 3 }
    ]
  },
  {
    name: "Piselli e carote al burro",
    name_en: "Peas and carrots with butter",
    meal_slot: "contorno", prep_min: 15,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.6,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci le carote a cubetti nel burro qualche minuto.", "Aggiungi i piselli e cuoci ancora 5 minuti."],
    steps_en: [
      "Dice the carrots small so they can cook through in the same short time the peas need.",
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
    name: "Purè di piselli con erba cipollina",
    name_en: "Pea purée with chives",
    meal_slot: "contorno", prep_min: 12,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci i piselli in poca acqua per 6 minuti e frulla.", "Cospargi di erba cipollina."],
    steps_en: [
      "Simmer the peas briefly, about 6 minutes, in just enough water to cover — cooking them longer dulls their bright color.",
      "Blend them while still hot with a splash of their cooking water, adding it gradually to control the final thickness.",
      "Push the purée through a sieve if you want it silky rather than slightly grainy, pressing the skins through with a spoon.",
      "Taste before seasoning — peas are naturally sweet and need a firm hand with salt to balance properly.",
      "Snip the chives with scissors directly over the purée just before serving, so they keep their color and snap.",
      "Serve warm; the purée thickens and dulls in color as it cools, so it's best made close to serving."
    ],
    ingredients: [
      { food_id: "170419", grams: 220 },
      { food_id: "erba_cipollina_it", grams: 4 }
    ]
  },
  {
    name: "Purè di piselli spezzati",
    name_en: "Split pea purée",
    meal_slot: "contorno", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci i piselli spezzati nell'acqua per 20 minuti.", "Schiaccia con un filo d'olio."],
    steps_en: [
      "Rinse the split peas under cold water first, since they cook directly without any presoaking.",
      "Simmer them in plenty of water, uncovered, for about 20 minutes, stirring occasionally so they don't stick as they thicken.",
      "The peas are done once they've mostly broken down on their own into a soft mass.",
      "Mash them roughly with the back of a spoon rather than blending, for a more rustic, textured purée.",
      "Stir in the oil once off the heat, so it stays glossy on the surface rather than fully absorbing.",
      "Season with salt near the end and serve warm."
    ],
    ingredients: [
      { food_id: "piselli_secchi_it", grams: 200 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Funghi trifolati con prezzemolo",
    name_en: "Sautéed mushrooms with parsley",
    meal_slot: "contorno", prep_min: 12,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola i funghi nell'olio con aglio.", "Cospargi di prezzemolo."],
    steps_en: [
      "Slice the mushrooms evenly so they cook through at the same rate.",
      "Heat the oil until it shimmers, then add the mushrooms in a single layer without crowding the pan.",
      "Let them sit undisturbed for a couple of minutes so they brown before stirring — moving them too soon keeps them pale and makes them release water instead.",
      "Add the garlic only in the last thirty seconds of cooking, so it doesn't burn.",
      "Season with salt once they've browned, not before, since early salting draws out water and stalls the browning.",
      "Finish with the parsley stirred in off the heat, keeping it bright and fresh."
    ],
    ingredients: [
      { food_id: "funghi_it", grams: 250 },
      { food_id: "169230", grams: 5 },
      { food_id: "171413", grams: 10 },
      { food_id: "prezzemolo_it", grams: 4 }
    ]
  },
  {
    name: "Funghi champignon al limone",
    name_en: "Sautéed champignon mushrooms with lemon",
    meal_slot: "contorno", prep_min: 12,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola i funghi champignon nell'olio.", "Finisci con succo di limone."],
    steps_en: [
      "Quarter the mushrooms rather than slicing them, so they hold their shape better through the higher heat needed to brown them.",
      "Heat the oil until it shimmers and add the mushrooms in a single layer, resisting the urge to stir right away.",
      "Let them cook undisturbed for a couple of minutes to develop real color before turning them.",
      "Cook a total of about 6 minutes, until deeply golden on at least two sides.",
      "Take the pan off the heat and squeeze the lemon over immediately, so its brightness doesn't cook away.",
      "Season with salt at this point too, and serve right away while still hot."
    ],
    ingredients: [
      { food_id: "funghi_champignon_it", grams: 250 },
      { food_id: "171413", grams: 10 },
      { food_id: "limone_it", grams: 8 }
    ]
  },
  {
    name: "Cipolle caramellate",
    name_en: "Caramelized onions",
    meal_slot: "contorno", prep_min: 20,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.4,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci le cipolle nel burro a fuoco basso per 18 minuti.", "Mescola spesso finché dorate."],
    steps_en: [
      "Slice the onions thin and evenly, so they cook down at the same rate rather than some burning before others soften.",
      "Cook them in the butter over low heat, not medium — real caramelization needs slow, gentle heat, and rushing it just browns the outside while the inside stays raw.",
      "Stir every few minutes rather than constantly, letting the onions sit long enough between stirs to actually develop color.",
      "If they start sticking or catching, add a small splash of water to loosen the pan rather than raising the heat.",
      "Cook a full 18 minutes or more, until deeply golden brown and soft enough to fall apart.",
      "Season with salt at the end, once the onions' natural sweetness has fully developed."
    ],
    ingredients: [
      { food_id: "170000", grams: 250 },
      { food_id: "burro_it", grams: 15 }
    ]
  },
  {
    name: "Fagiolini al burro",
    name_en: "Green beans with butter",
    meal_slot: "contorno", prep_min: 12,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Sbollenta i fagiolini.", "Saltali nel burro."],
    steps_en: [
      "Trim the ends off the green beans and blanch them in boiling salted water for about 4 minutes, until tender but still bright green.",
      "Drain them and, if not serving right away, plunge them into cold water to stop the cooking and lock in the color.",
      "Melt the butter in a pan over medium heat until it foams, then add the drained beans.",
      "Toss them in the butter for a minute or two, just to coat and warm through, not to cook further.",
      "Season with salt at this final stage, since the beans are already nearly done from blanching.",
      "Serve immediately, while the beans are still bright and the butter glossy."
    ],
    ingredients: [
      { food_id: "fagiolini_it", grams: 250 },
      { food_id: "burro_it", grams: 10 }
    ]
  },
  {
    name: "Insalata di ravanelli e cetrioli",
    name_en: "Radish and cucumber salad",
    meal_slot: "contorno", prep_min: 10,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 9.2,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Affetta ravanelli e cetriolo sottili.", "Condisci con olio e limone."],
    steps_en: [
      "Slice the radishes and cucumber as thin as you can, since both are eaten completely raw here.",
      "Salt the cucumber lightly and let it sit five minutes to draw out some water, then pat it dry.",
      "Whisk the lemon juice and oil together separately, so the dressing is smooth before it touches the vegetables.",
      "Combine the radishes and cucumber in a bowl, tossing gently so the radish slices don't break.",
      "Dress just before serving, since both vegetables release more water the longer they sit dressed.",
      "Serve cold, as a sharp, crunchy side to richer dishes."
    ],
    ingredients: [
      { food_id: "ravanelli_it", grams: 150 },
      { food_id: "168409", grams: 150 },
      { food_id: "171413", grams: 8 },
      { food_id: "limone_it", grams: 8 }
    ]
  },
  {
    name: "Lenticchie in insalata con carote",
    name_en: "Lentil salad with carrots",
    meal_slot: "contorno", prep_min: 20,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.2,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Lessa le lenticchie con la carota.", "Condisci con olio e limone da fredde."],
    steps_en: [
      "Simmer the lentils together with the diced carrot in plenty of water for about 18 minutes, until both are tender.",
      "Drain well and spread them out on a tray to cool faster and more evenly than left in a pot.",
      "Whisk the lemon juice and oil together into a light dressing while the lentils cool.",
      "Toss the cooled lentils and carrot with the dressing, so the flavors are absorbed while the salad is still fresh.",
      "Let it sit at least ten minutes before serving so the dressing has time to soak in.",
      "Serve cold or at room temperature, since lentils hold their shape and flavor well either way."
    ],
    ingredients: [
      { food_id: "172420", grams: 180 },
      { food_id: "170393", grams: 80 },
      { food_id: "171413", grams: 10 },
      { food_id: "limone_it", grams: 8 }
    ]
  },
  {
    name: "Fagioli borlotti in insalata con cipolla rossa",
    name_en: "Borlotti bean salad with red onion",
    meal_slot: "contorno", prep_min: 12,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 9.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Scola i fagioli e uniscili alla cipolla rossa affettata.", "Condisci con aceto di mele e olio."],
    steps_en: [
      "Slice the red onion very thin, since it's eaten raw here and thick pieces would dominate the beans' mild flavor.",
      "Toss the sliced onion with the vinegar first and let it sit five minutes — this takes the raw sharpness off before it meets the beans.",
      "Drain and rinse the beans well, then pat them dry so the salad isn't diluted with extra liquid.",
      "Combine the beans with the marinated onion, oil, and any leftover vinegar from soaking.",
      "Let it sit at least ten minutes before serving so the flavors have time to meld together.",
      "Serve cold or at room temperature."
    ],
    ingredients: [
      { food_id: "fagioli_borlotti_it", grams: 220 },
      { food_id: "cipolla_rossa_it", grams: 60 },
      { food_id: "173469", grams: 10 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Insalata di carote e semi di zucca",
    name_en: "Carrot salad with pumpkin seeds",
    meal_slot: "contorno", prep_min: 12,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 9.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Taglia le carote a julienne sottile.", "Condisci con limone e semi di zucca."],
    steps_en: [
      "Grate or cut the carrots into thin matchsticks, so they're easy to eat raw without much chewing resistance.",
      "Whisk the lemon juice and oil together into a light dressing rather than something thick.",
      "Toss the carrots with the dressing, making sure it's distributed through the pile rather than pooling at the bottom.",
      "Toast the pumpkin seeds briefly in a dry pan for extra flavor, then let them cool before adding.",
      "Scatter the seeds over the top just before serving, so they stay crisp against the softer carrot.",
      "Serve cold; this salad holds well for a few hours if kept covered in the fridge."
    ],
    ingredients: [
      { food_id: "170393", grams: 200 },
      { food_id: "limone_it", grams: 10 },
      { food_id: "171413", grams: 8 },
      { food_id: "semi_zucca_it", grams: 15 }
    ]
  },
  {
    name: "Purè di sedano e patate",
    name_en: "Celery and potato mash",
    meal_slot: "contorno", prep_min: 22,
    profilo: "europeo-panna", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.2,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lessa sedano e patate insieme.", "Schiaccia con panna."],
    steps_en: [
      "Slice the celery thin so its fibrous strings break down fully during the boiling time.",
      "Cook it together with the diced potato in salted water until both are completely soft, about 18 minutes.",
      "Drain well and let them sit uncovered for a minute so excess steam escapes before mashing.",
      "Mash with the cream added gradually, so it blends in smoothly rather than sitting separately on top.",
      "Push the mash through a sieve if you want it perfectly smooth, since celery's fibers can leave some texture otherwise.",
      "Season with salt at the end and serve warm."
    ],
    ingredients: [
      { food_id: "sedano_it", grams: 150 },
      { food_id: "170028", grams: 150 },
      { food_id: "panna_it", grams: 30 }
    ]
  },
  {
    name: "Sedano brasato con limone",
    name_en: "Braised celery with lemon",
    meal_slot: "contorno", prep_min: 18,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.7,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Taglia il sedano a tocchetti e stufalo nell'olio con poca acqua.", "Finisci con succo di limone."],
    steps_en: [
      "Cut the celery into short lengths, which cook down more evenly than long stalks left whole.",
      "Cook it in the oil with a splash of water, covered, over low heat for about 12 minutes.",
      "Check it's turned tender and slightly translucent, not just softened at the surface.",
      "Uncover for the last couple of minutes if liquid remains, letting it reduce down into the celery.",
      "Squeeze the lemon juice over right at the end, off the heat, so its brightness stays sharp.",
      "Serve warm, as a light side that pairs well with richer meat or fish dishes."
    ],
    ingredients: [
      { food_id: "sedano_it", grams: 250 },
      { food_id: "171413", grams: 10 },
      { food_id: "limone_it", grams: 10 }
    ]
  }
];
