// regno_unito — primi (10) — tecnica sempre 'semplice'
module.exports = [
  {
    name: "Kedgeree (riso al curry con eglefino e uovo)",
    name_en: "Kedgeree (curried rice with smoked haddock and egg)",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 8.2,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Lessa il riso e l'eglefino separatamente, poi uniscili con curry e cipolla.", "Sminuzza il pesce e aggiungi l'uovo sodo a spicchi."],
    steps_en: [
      "Poach the haddock gently in barely simmering water for about 8 minutes, until it flakes easily — boiling it hard toughens the delicate flesh.",
      "Cook the rice separately in plenty of water until tender, then drain well so the finished dish isn't watery.",
      "Soften the onion in the oil with the curry powder for a couple of minutes, letting the spice bloom in the fat rather than staying raw-tasting.",
      "Flake the poached haddock into large pieces, checking carefully for any small bones.",
      "Fold the rice and flaked fish gently into the spiced onion, warming everything through without breaking the fish up further.",
      "Quarter the boiled egg and lay it over the top just before serving, rather than stirring it in, so it keeps its shape."
    ],
    ingredients: [
      { food_id: "171964", grams: 150 },
      { food_id: "168877", grams: 70 },
      { food_id: "170000", grams: 50 },
      { food_id: "curry_it", grams: 4 },
      { food_id: "uovo_grande_it", grams: 50 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Cullen skink (zuppa scozzese di eglefino e patate)",
    name_en: "Cullen skink (Scottish smoked haddock and potato soup)",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 8.4,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci porro e patate nel latte.", "Aggiungi l'eglefino e cuoci finché si sfalda."],
    steps_en: [
      "Sweat the sliced leek in a little butter for a few minutes, until soft but not browned.",
      "Add the diced potato and the milk, then simmer for about 15 minutes until the potato is tender.",
      "Mash a few potato pieces against the side of the pot to thicken the soup's base naturally.",
      "Slide the haddock into the simmering liquid whole and poach gently for about 8 minutes, rather than boiling, which would toughen it.",
      "Flake the fish apart directly in the pot once it's opaque through, checking for any small bones as you go.",
      "Season with a little salt and pepper at the end and serve hot, with the fish still in large, tender flakes."
    ],
    ingredients: [
      { food_id: "171964", grams: 180 },
      { food_id: "170028", grams: 150 },
      { food_id: "porro_it", grams: 80 },
      { food_id: "latte_ps_it", grams: 200 },
      { food_id: "burro_it", grams: 8 }
    ]
  },
  {
    name: "Cock-a-leekie (zuppa scozzese di pollo e porri)",
    name_en: "Cock-a-leekie (Scottish chicken and leek soup)",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci il pollo a pezzi con i porri nell'acqua.", "Cuoci 20 minuti finché il pollo è tenero."],
    steps_en: [
      "Cut the chicken into even pieces so they cook through at the same rate.",
      "Slice the leeks and rinse them well between the layers, where grit tends to hide.",
      "Add the chicken and leeks to a pot with water to cover, then bring to a gentle simmer.",
      "Cook uncovered for about 20 minutes, skimming any foam that rises to keep the broth clear.",
      "Check the chicken reaches 74°C at the thickest piece before taking it off the heat.",
      "Season with salt at the end, once the leeks have had time to soften and sweeten the broth."
    ],
    ingredients: [
      { food_id: "171077", grams: 200 },
      { food_id: "porro_it", grams: 150 },
      { food_id: "170917", grams: 1 }
    ]
  },
  {
    name: "Scotch broth leggero (zuppa scozzese di agnello e orzo)",
    name_en: "Light Scotch broth (Scottish lamb and barley soup)",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 8.3,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola l'agnello a cubetti con carota e sedano.", "Aggiungi l'orzo e l'acqua e cuoci 20 minuti."],
    steps_en: [
      "Trim the lamb of visible fat and cut it into small, even cubes, so it cooks through in the same time as the barley.",
      "Brown the cubes in a splash of oil with the diced carrot and celery, building the base flavor this humble soup relies on.",
      "Add the pearl barley and enough water to cover generously, then bring to a simmer.",
      "Cook uncovered for about 20 minutes, stirring occasionally, until the barley is tender and the lamb is cooked through.",
      "Check the lamb reached 63°C at the thickest piece before it came off the heat.",
      "Season with salt near the end, once the vegetables and barley have thickened the broth naturally."
    ],
    ingredients: [
      { food_id: "agnello_australiano_it", grams: 150 },
      { food_id: "170393", grams: 60 },
      { food_id: "sedano_it", grams: 50 },
      { food_id: "orzo_it", grams: 50 }
    ]
  },
  {
    name: "Pease pudding (purè di piselli spezzati all'inglese)",
    name_en: "Pease pudding (English split pea purée)",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci i piselli spezzati nell'acqua per 20 minuti.", "Schiaccia con un filo d'olio e senape."],
    steps_en: [
      "Rinse the split peas under cold water first, since they cook directly without any presoaking.",
      "Simmer them in plenty of water, uncovered, for about 20 minutes, stirring occasionally so they don't stick as they thicken.",
      "The peas are ready once they've mostly broken down on their own into a soft, thick mass.",
      "Mash them with the back of a spoon rather than blending, for the traditional coarse, rustic texture.",
      "Stir in the oil and a little mustard once off the heat, which is the classic way this is served alongside ham.",
      "Season with salt to taste and serve warm."
    ],
    ingredients: [
      { food_id: "piselli_secchi_it", grams: 200 },
      { food_id: "171413", grams: 10 },
      { food_id: "senape_it", grams: 8 }
    ]
  },
  {
    name: "Zuppa di carote e coriandolo all'inglese",
    name_en: "English carrot and coriander soup",
    meal_slot: "primo", prep_min: 22,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci le carote e la cipolla nell'acqua finché morbide.", "Frulla con il coriandolo fresco."],
    steps_en: [
      "Cut the carrots into even chunks so they cook through at the same rate as the onion.",
      "Simmer them together with the diced onion in water to cover for about 18 minutes, until both are completely soft.",
      "Blend while still hot, which is what gives this soup its classic silky texture rather than a grainy one.",
      "Add most of the coriander during blending, so its flavor spreads through the whole soup.",
      "Thin with a little of the reserved cooking water if it's thicker than a spoon can coat easily.",
      "Scatter the remaining coriander over each bowl just before serving, so it stays fresh and fragrant."
    ],
    ingredients: [
      { food_id: "170393", grams: 250 },
      { food_id: "170000", grams: 60 },
      { food_id: "coriandolo_it", grams: 8 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Vellutata di sedano e mela all'inglese",
    name_en: "English celery and apple soup",
    meal_slot: "primo", prep_min: 22,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci sedano e mela nel burro con acqua.", "Frulla fino a renderla vellutata."],
    steps_en: [
      "Slice the celery thin so its fibrous strings break down fully during simmering.",
      "Sweat it in the butter with the diced apple for a few minutes, before adding water to cover.",
      "Simmer for about 15 minutes, until the celery is completely soft and the apple has broken down.",
      "Blend while still hot, since celery's fibers purée far more smoothly hot than once the soup has cooled.",
      "Thin with a little water if it's thicker than a spoon can coat easily.",
      "Season with salt at the end, tasting to balance the apple's natural sweetness against the celery."
    ],
    ingredients: [
      { food_id: "sedano_it", grams: 200 },
      { food_id: "mela_it", grams: 100 },
      { food_id: "burro_it", grams: 12 }
    ]
  },
  {
    name: "Riso alla menta con piselli",
    name_en: "Minted pea rice",
    meal_slot: "primo", prep_min: 20,
    profilo: "europeo-erbe", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 8.5,
    base_amidacea: true, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Lessa il riso e i piselli insieme.", "Condisci con olio e menta fresca tritata."],
    steps_en: [
      "Cook the rice in plenty of salted water for about 15 minutes, until tender.",
      "Add the peas to the same pot for the final 3 minutes of cooking, so they warm through without turning grey and overcooked.",
      "Drain both together well, so the finished dish isn't watery.",
      "Toss immediately with the oil while still warm, so the rice absorbs it rather than letting it sit on the surface.",
      "Tear or chop the mint leaves just before mixing them in, since chopped ahead of time it darkens and loses aroma fast.",
      "Serve warm or at room temperature, tasting for salt once the mint is already in."
    ],
    ingredients: [
      { food_id: "168877", grams: 80 },
      { food_id: "170419", grams: 150 },
      { food_id: "171413", grams: 10 },
      { food_id: "menta_it", grams: 6 }
    ]
  },
  {
    name: "Zuppa di lenticchie rosse all'inglese",
    name_en: "English red lentil soup",
    meal_slot: "primo", prep_min: 22,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 9.1,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi cipolla e carota, aggiungi le lenticchie rosse e l'acqua.", "Cuoci 15 minuti finché morbide."],
    steps_en: [
      "Dice the carrot and onion small so they cook through in the same time the lentils need.",
      "Soften them in the oil for a few minutes, building sweetness at the base before the lentils go in.",
      "Add the red lentils and enough water to cover generously — they cook faster and break down more than brown lentils.",
      "Simmer uncovered for about 15 minutes, stirring occasionally, until the lentils have mostly dissolved into a thick soup.",
      "Blend part of the soup if you prefer it smoother, leaving some texture from the rest.",
      "Season with salt near the end and finish with a squeeze of lemon for brightness."
    ],
    ingredients: [
      { food_id: "lenticchie_rosse_it", grams: 150 },
      { food_id: "170393", grams: 70 },
      { food_id: "170000", grams: 50 },
      { food_id: "limone_it", grams: 8 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Zuppa di porri e patate all'inglese",
    name_en: "English leek and potato soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-burro", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 8.4,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Stufa i porri nel burro, aggiungi le patate e l'acqua.", "Cuoci 20 minuti e frulla in parte."],
    steps_en: [
      "Slice only the white and pale green of the leek — the dark green part stays too fibrous to soften in the cooking time.",
      "Sweat the leek in the butter over low heat with the lid on for five minutes, without browning it, so it turns sweet rather than sharp.",
      "Add the diced potato and enough water to cover, then simmer 18 minutes until the potato falls apart when pressed.",
      "Blend only half the soup, leaving the rest chunky, for some texture rather than a uniform purée.",
      "Season with salt only at the end, once the potatoes have released their starch.",
      "Serve hot with a swirl of the cooking butter left on top."
    ],
    ingredients: [
      { food_id: "170028", grams: 200 },
      { food_id: "porro_it", grams: 120 },
      { food_id: "burro_it", grams: 12 }
    ]
  }
];
