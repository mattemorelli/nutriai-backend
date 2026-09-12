// centro_nord_generico — primi (25)
module.exports = [
  {
    name: "Zuppa di patate e porri",
    name_en: "Potato and leek soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.4,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Stufa i porri nel burro, aggiungi le patate e l'acqua.", "Cuoci 20 minuti e frulla in parte."],
    steps_en: [
      "Slice only the white and pale green of the leek — the dark green part is too fibrous to soften in the cooking time.",
      "Sweat the leek in the butter over low heat with the lid on for five minutes, without letting it brown, so it turns sweet rather than sharp.",
      "Add the diced potatoes and just enough water to cover, then simmer 18 minutes until the potatoes fall apart when pressed.",
      "Blend only half the soup, leaving the rest chunky — this keeps some texture instead of a uniform purée.",
      "Season with salt only at the end, once the potatoes have released their starch, since salting too early slows their softening.",
      "Serve hot with a swirl of the cooking butter left on top."
    ],
    ingredients: [
      { food_id: "170028", grams: 250 },
      { food_id: "porro_it", grams: 100 },
      { food_id: "burro_it", grams: 12 }
    ]
  },
  {
    name: "Zuppa di lenticchie e carote",
    name_en: "Lentil and carrot soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.2,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi cipolla e carota, aggiungi le lenticchie e l'acqua.", "Cuoci 20 minuti fino a cottura."],
    steps_en: [
      "Dice the carrot small so it cooks through in the same time as the lentils rather than staying crunchy.",
      "Soften the onion and carrot in the oil over medium-low heat for five minutes before adding anything else, building sweetness at the base.",
      "Add the lentils and water together, since they don't need presoaking and cook directly in the simmering liquid.",
      "Simmer uncovered for about 18 minutes, skimming any foam that rises — it's released starch that would otherwise cloud the broth.",
      "Check doneness by pressing a lentil against the pot: it should give way without resistance.",
      "Season with salt only near the end — added too early it can toughen the lentils' skins."
    ],
    ingredients: [
      { food_id: "172420", grams: 150 },
      { food_id: "170393", grams: 80 },
      { food_id: "170000", grams: 50 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Zuppa di piselli spezzati e patate",
    name_en: "Split pea and potato soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 9.0,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci i piselli spezzati con le patate nell'acqua per 20 minuti.", "Frulla grossolanamente."],
    steps_en: [
      "Rinse the split peas under cold water first to remove any dust, since they cook directly without soaking.",
      "Add them to the pot with the diced potato and enough water to cover generously — they absorb a surprising amount as they cook.",
      "Simmer gently for about 20 minutes, stirring occasionally so the peas don't settle and scorch on the bottom.",
      "The soup is ready when the peas have mostly broken down into the liquid on their own, thickening it naturally.",
      "Mash roughly with the back of a spoon rather than blending smooth, so some potato pieces stay intact.",
      "Finish with a drizzle of oil over each bowl, which lifts the soup's flavor more than stirring it in."
    ],
    ingredients: [
      { food_id: "piselli_secchi_it", grams: 130 },
      { food_id: "170028", grams: 150 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Zuppa di orzo e funghi",
    name_en: "Barley and mushroom soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.3,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola i funghi, aggiungi l'orzo e l'acqua.", "Cuoci finché l'orzo è morbido."],
    steps_en: [
      "Sear the mushrooms in a hot, dry pan first, without crowding them, so they brown instead of releasing water and steaming.",
      "Add the garlic only once the mushrooms have colored, so it doesn't burn during the longer searing time.",
      "Add the pearl barley and water, then bring to a simmer — the barley needs the full cooking time to soften, unlike quicker grains.",
      "Simmer around 20 minutes, topping up with a little water if it reduces too far before the barley is tender.",
      "Taste a grain to check doneness: it should be chewy but not hard at the center.",
      "Finish with the parsley stirred in off the heat, so it stays bright green rather than dulling in the hot broth."
    ],
    ingredients: [
      { food_id: "orzo_it", grams: 70 },
      { food_id: "funghi_champignon_it", grams: 150 },
      { food_id: "169230", grams: 5 },
      { food_id: "prezzemolo_it", grams: 3 }
    ]
  },
  {
    name: "Vellutata di carote e patate",
    name_en: "Carrot and potato velouté",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.9,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci carote e patate nell'acqua finché morbide.", "Frulla con una noce di burro."],
    steps_en: [
      "Cut the carrots and potatoes into similar-sized pieces so they finish cooking at the same time.",
      "Cover them with water by about two centimeters — too much water dilutes the flavor and makes for a thin, watery purée.",
      "Simmer around 18 minutes until both vegetables are soft enough to crush easily against the pot.",
      "Blend while still hot, adding the butter partway through blending rather than at the start, so it emulsifies smoothly into the purée.",
      "Thin with a little of the reserved cooking water if the velouté is thicker than a spoon can easily coat.",
      "Season with salt only after blending, so you can judge the final concentration correctly."
    ],
    ingredients: [
      { food_id: "170393", grams: 150 },
      { food_id: "170028", grams: 150 },
      { food_id: "burro_it", grams: 10 }
    ]
  },
  {
    name: "Zuppa di cavolo verza e patate",
    name_en: "Savoy cabbage and potato soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.7,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi la cipolla, aggiungi cavolo verza e patate con acqua.", "Cuoci 20 minuti."],
    steps_en: [
      "Shred the cabbage fairly fine so it softens fully within the soup's cooking time rather than staying tough.",
      "Soften the onion in the oil for a few minutes first, building a base flavor the cabbage alone wouldn't give.",
      "Add the cabbage and diced potato together with water to cover, then bring to a gentle simmer.",
      "Cook uncovered for about 18 minutes, which lets some liquid reduce and concentrate the flavor as the cabbage softens.",
      "Check the potato for doneness rather than the cabbage, since it takes slightly longer to fully soften.",
      "Finish with a drizzle of olive oil per bowl and a crack of pepper at the table."
    ],
    ingredients: [
      { food_id: "cavolo_verza_it", grams: 150 },
      { food_id: "170028", grams: 150 },
      { food_id: "170000", grams: 50 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Zuppa di crauti e wurstel",
    name_en: "Sauerkraut and sausage soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 7.3,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci i crauti con le patate e l'acqua per 15 minuti.", "Aggiungi il wurstel a fette e scalda."],
    steps_en: [
      "Rinse the sauerkraut briefly under cold water if it tastes very sharp, to soften its acidity before it dominates the whole pot.",
      "Simmer the sauerkraut with the diced potato and water for about 15 minutes, until the potato is tender.",
      "Slice the sausage and add it only in the last five minutes — it just needs to heat through, not cook from raw.",
      "Add the caraway seeds with the sauerkraut at the start, since they need time in the liquid to release their aroma.",
      "Taste before adding salt: sauerkraut and sausage are both already salty on their own.",
      "Serve hot, with the sausage slices distributed evenly rather than settled at the bottom."
    ],
    ingredients: [
      { food_id: "169279", grams: 200 },
      { food_id: "170028", grams: 100 },
      { food_id: "wurstel_it", grams: 80 },
      { food_id: "170923", grams: 2 }
    ]
  },
  {
    name: "Minestra di fagioli borlotti e cavolo riccio",
    name_en: "Borlotti bean and kale soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.1,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi aglio e cavolo riccio, aggiungi i fagioli e l'acqua.", "Cuoci 15 minuti e schiaccia in parte."],
    steps_en: [
      "Strip the kale from its tough central stalks and tear the leaves, since the stalks stay fibrous even after simmering.",
      "Cook the garlic in the oil just until fragrant, about thirty seconds — any longer and it turns bitter before the kale even goes in.",
      "Add the kale and let it wilt for a couple of minutes before adding the beans and water, so it doesn't stay raw and stringy in the finished soup.",
      "Simmer 15 minutes, then crush about a third of the beans against the side of the pot — their starch thickens the broth without needing flour.",
      "Finish with a squeeze of lemon off the heat, which lifts the whole pot more than any amount of extra salt would.",
      "Serve with a drizzle of raw olive oil on top rather than cooked in, for a fresher finish."
    ],
    ingredients: [
      { food_id: "fagioli_borlotti_it", grams: 180 },
      { food_id: "kale_it", grams: 100 },
      { food_id: "169230", grams: 5 },
      { food_id: "171413", grams: 10 },
      { food_id: "limone_it", grams: 8 }
    ]
  },
  {
    name: "Zuppa di rape e patate",
    name_en: "Turnip and potato soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.6,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci rape e patate a tocchetti nell'acqua.", "Frulla parzialmente con la noce moscata."],
    steps_en: [
      "Peel the turnips before cutting them — their skin can taste faintly bitter once cooked, unlike the potato's.",
      "Cut both vegetables into similar-sized pieces so they finish softening together rather than one lagging behind.",
      "Simmer in water to cover for about 18 minutes, until a knife slides into the turnip with no resistance.",
      "Blend only about half the soup, mashing the rest by hand, to keep some texture rather than a completely smooth purée.",
      "Grate the nutmeg in at the very end — its aroma fades fast once it hits hot liquid, so a little added late goes further than more added early.",
      "Season with salt to taste, since turnip's natural bitterness needs slightly more than a potato soup alone."
    ],
    ingredients: [
      { food_id: "rapa_it", grams: 150 },
      { food_id: "170028", grams: 150 },
      { food_id: "noce_moscata_it", grams: 1 }
    ]
  },
  {
    name: "Zuppa di pastinaca e carote",
    name_en: "Parsnip and carrot soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-ricco", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci pastinaca e carote nell'acqua finché morbide.", "Frulla con il burro."],
    steps_en: [
      "Cut the parsnip and carrot into even chunks — parsnip's core can stay woody if the pieces are cut too thick.",
      "Simmer both together in water to cover for about 20 minutes, until a knife meets no resistance in the parsnip.",
      "Blend while still hot, since the purée turns grainy rather than silky once the vegetables cool down first.",
      "Add the butter partway through blending, not at the very end, so it fully emulsifies instead of sitting as separate droplets.",
      "Adjust the thickness with a splash of the reserved cooking water rather than plain water, to keep the flavor concentrated.",
      "Season with salt last, tasting as you go — parsnip's natural sweetness needs a firm hand with salt to balance it."
    ],
    ingredients: [
      { food_id: "pastinaca_it", grams: 150 },
      { food_id: "170393", grams: 100 },
      { food_id: "burro_it", grams: 10 }
    ]
  },
  {
    name: "Grano saraceno con funghi trifolati",
    name_en: "Buckwheat with sautéed mushrooms",
    meal_slot: "primo", prep_min: 20,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.4,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci il grano saraceno nell'acqua per 12 minuti.", "Servi con i funghi rosolati e prezzemolo."],
    steps_en: [
      "Toast the raw buckwheat groats in a dry pan for a couple of minutes before boiling — this step is what gives it a nutty depth instead of a flat, starchy taste.",
      "Simmer the toasted groats in salted water for about 12 minutes, until tender but still holding their shape.",
      "While it cooks, sear the mushrooms in a separate hot pan without crowding them, so they brown rather than steam.",
      "Add the garlic to the mushrooms only in the last thirty seconds, so it doesn't scorch during the longer searing time.",
      "Drain the buckwheat if any water remains, then fold the mushrooms through it off the heat.",
      "Scatter the parsley on top last, so it keeps its color instead of wilting into the hot grain."
    ],
    ingredients: [
      { food_id: "grano_saraceno_it", grams: 80 },
      { food_id: "funghi_champignon_it", grams: 150 },
      { food_id: "169230", grams: 5 },
      { food_id: "171413", grams: 10 },
      { food_id: "prezzemolo_it", grams: 3 }
    ]
  },
  {
    name: "Orzo perlato con funghi e prezzemolo",
    name_en: "Pearl barley with mushrooms and parsley",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.2,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci l'orzo perlato nell'acqua finché morbido.", "Mantecalo con i funghi rosolati."],
    steps_en: [
      "Simmer the pearl barley in plenty of water, uncovered, for about 20 minutes, checking a grain now and then for doneness.",
      "While it cooks, sear the mushrooms in a hot, dry pan first so they brown before adding any oil.",
      "Add the oil and garlic to the mushrooms once they've colored, cooking just until fragrant.",
      "Drain the barley when tender but still with a little bite at the center, since it keeps softening slightly off the heat.",
      "Fold the mushrooms through the drained barley while both are still hot, so the flavors bind together.",
      "Finish with the parsley stirred in at the very end, off the heat, to keep it fresh and green."
    ],
    ingredients: [
      { food_id: "orzo_it", grams: 80 },
      { food_id: "funghi_champignon_it", grams: 120 },
      { food_id: "169230", grams: 5 },
      { food_id: "171413", grams: 10 },
      { food_id: "prezzemolo_it", grams: 3 }
    ]
  },
  {
    name: "Farro con cavolo riccio e limone",
    name_en: "Farro with kale and lemon",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.6,
    base_amidacea: true, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci il farro nell'acqua per 20 minuti.", "Condiscilo con cavolo riccio saltato e limone."],
    steps_en: [
      "Simmer the farro in plenty of water for about 20 minutes, until tender but still slightly chewy at the center.",
      "Strip the kale from its stalks and tear the leaves while the farro cooks, so both are ready around the same time.",
      "Sauté the kale in the oil over medium heat for a few minutes just until it wilts and turns a deeper green.",
      "Drain the farro and toss it immediately with the warm kale, while both still have enough heat to absorb the oil's flavor.",
      "Squeeze the lemon over just before serving, not earlier, so its brightness doesn't fade while the dish sits.",
      "Serve warm or at room temperature — farro holds its texture well either way, unlike most grains."
    ],
    ingredients: [
      { food_id: "farro_perlato_it", grams: 80 },
      { food_id: "kale_it", grams: 100 },
      { food_id: "171413", grams: 12 },
      { food_id: "limone_it", grams: 10 }
    ]
  },
  {
    name: "Gnocchi di patate al burro e erba cipollina",
    name_en: "Potato gnocchi with butter and chives",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 7.9,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Impasta le patate lessate con farina e uovo.", "Forma gli gnocchi, lessali e condisci con burro."],
    steps_en: [
      "Boil the potatoes whole and unpeeled, so they don't soak up water — waterlogged potatoes make the dough sticky no matter how much flour you add.",
      "Peel and mash them while still hot, working quickly since cooled potato mash turns gluey once flour is added.",
      "Mix in the flour and egg just until a dough comes together — overworking it develops gluten and makes the gnocchi dense instead of light.",
      "Roll the dough into ropes and cut into small pieces, then press each lightly with a fork if you want ridges to catch the butter.",
      "Boil the gnocchi in batches; they're done the moment they float to the surface, usually within a couple of minutes.",
      "Toss the drained gnocchi directly in the melted butter and scatter the chives over just before serving, so they stay bright."
    ],
    ingredients: [
      { food_id: "170028", grams: 250 },
      { food_id: "farina_00_it", grams: 60 },
      { food_id: "uovo_grande_it", grams: 30 },
      { food_id: "burro_it", grams: 15 },
      { food_id: "erba_cipollina_it", grams: 3 }
    ]
  },
  {
    name: "Spätzle al burro e formaggio",
    name_en: "Spätzle with butter and cheese",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 7.4,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Prepara la pastella con farina, uova e latte.", "Cuoci a gocce nell'acqua e manteca con burro e formaggio."],
    steps_en: [
      "Whisk the flour, eggs and milk into a thick, elastic batter, beating it well — the extra beating is what gives spätzle its springy bite.",
      "Let the batter rest ten minutes before cooking, which relaxes the gluten and makes it easier to press through a colander or board.",
      "Push the batter through the holes of a colander directly into simmering water, working in small batches so the pieces don't clump together.",
      "The spätzle are done the moment they float, usually within a minute — pull them out promptly with a slotted spoon.",
      "Toss the drained spätzle in the melted butter over low heat until lightly coated and warmed through.",
      "Fold in the grated Emmental off the heat, so it melts into the spätzle without turning grainy from overheating."
    ],
    ingredients: [
      { food_id: "farina_00_it", grams: 100 },
      { food_id: "uovo_grande_it", grams: 60 },
      { food_id: "latte_ps_it", grams: 60 },
      { food_id: "burro_it", grams: 15 },
      { food_id: "emmental_it", grams: 30 }
    ]
  },
  {
    name: "Zuppa di ceci e cavolo",
    name_en: "Chickpea and cabbage soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi la cipolla, aggiungi cavolo e ceci con acqua.", "Cuoci 15 minuti."],
    steps_en: [
      "Shred the cabbage fairly fine so it breaks down within the soup's cooking time rather than staying tough and raw-tasting.",
      "Soften the onion in the oil for a few minutes first, so the base of the soup has real depth before the other vegetables go in.",
      "Add the cabbage and cook a few minutes until it wilts, then add the drained chickpeas and water to cover.",
      "Simmer gently for about 15 minutes, just long enough for the flavors to come together without the chickpeas turning mushy.",
      "Crush a spoonful of chickpeas against the side of the pot and stir back in, which thickens the broth a little without any flour.",
      "Finish with a drizzle of raw olive oil per bowl for a rounder flavor than cooking it in."
    ],
    ingredients: [
      { food_id: "175206", grams: 180 },
      { food_id: "169975", grams: 150 },
      { food_id: "170000", grams: 50 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Zuppa di barbabietola e patate",
    name_en: "Beetroot and potato soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.5,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci barbabietola e patate a tocchetti nell'acqua.", "Frulla con un goccio di aceto di mele."],
    steps_en: [
      "Peel the beetroot with gloves on, unless you don't mind pink-stained hands for the rest of the day.",
      "Cut both the beetroot and potato into similar-sized pieces so they cook through together.",
      "Simmer in water to cover for about 20 minutes, until a knife slides into the beetroot easily.",
      "Blend while hot until smooth — beetroot's fibrous texture doesn't break down as easily once the soup cools first.",
      "Stir in the vinegar right at the end: added during cooking, its acidity would dull the beetroot's color rather than sharpen its flavor.",
      "Serve with a spoonful of yogurt swirled on top if you like, though the soup stands on its own without it."
    ],
    ingredients: [
      { food_id: "barbabietola_australiana_it", grams: 150 },
      { food_id: "170028", grams: 120 },
      { food_id: "173469", grams: 8 }
    ]
  },
  {
    name: "Minestra di lenticchie e cavolo rapa",
    name_en: "Lentil and kohlrabi soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.1,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi il cavolo rapa a cubetti, aggiungi le lenticchie e l'acqua.", "Cuoci 20 minuti."],
    steps_en: [
      "Peel the kohlrabi before dicing it — the outer layer stays tough even after a full simmer.",
      "Soften the diced kohlrabi in the oil for a few minutes first, so it starts breaking down before the liquid goes in.",
      "Add the lentils and water together, since lentils need no presoaking and cook directly in the simmering broth.",
      "Simmer about 18 minutes, skimming any foam that rises to keep the broth clear.",
      "Check a lentil for doneness by pressing it: it should give way without resistance.",
      "Season with salt near the end, and finish with a crack of pepper at the table."
    ],
    ingredients: [
      { food_id: "172420", grams: 150 },
      { food_id: "cavolo_rapa_it", grams: 100 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Vellutata di sedano e patate",
    name_en: "Celery and potato velouté",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.5,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci sedano e patate nell'acqua finché morbidi.", "Frulla con un cucchiaio di panna."],
    steps_en: [
      "Slice the celery thin so its fibrous strings break down fully during simmering rather than staying stringy in the finished purée.",
      "Cook it together with the diced potato in water to cover for about 18 minutes, until both are completely soft.",
      "Blend while still hot and steaming — celery's fibers purée far more smoothly hot than once the soup has cooled.",
      "Add the cream at the very end of blending, off the heat, so it doesn't separate from prolonged simmering.",
      "Thin with a little of the reserved cooking water if it's thicker than a spoon can coat easily.",
      "Season with salt last, tasting after the cream is in, since it changes the balance noticeably."
    ],
    ingredients: [
      { food_id: "sedano_it", grams: 120 },
      { food_id: "170028", grams: 150 },
      { food_id: "panna_it", grams: 30 }
    ]
  },
  {
    name: "Zuppa di piselli e erba cipollina",
    name_en: "Pea soup with chives",
    meal_slot: "primo", prep_min: 20,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "composta", health_score: 8.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci i piselli nell'acqua per 8 minuti e frulla.", "Cospargi di erba cipollina."],
    steps_en: [
      "Simmer the peas in a small amount of water for only about 8 minutes — cooked much longer, fresh or frozen peas lose their bright color and turn a dull olive.",
      "Blend them while still hot with some of their cooking liquid, adding it gradually to reach a soup consistency rather than a thick purée.",
      "Push the blended soup through a sieve if you want a silkier texture, pressing the skins through with the back of a spoon.",
      "Taste before seasoning: peas are naturally sweet, so it takes a fairly firm hand with salt to balance them properly.",
      "Snip the chives with scissors directly over each bowl just before serving, so they keep their color and snap.",
      "Serve hot, since this soup thickens quickly and loses its light texture as it cools."
    ],
    ingredients: [
      { food_id: "170419", grams: 250 },
      { food_id: "erba_cipollina_it", grams: 5 }
    ]
  },
  {
    name: "Orzo con carote e porri",
    name_en: "Barley with carrots and leeks",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.3,
    base_amidacea: true, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Stufa porri e carote nel burro.", "Aggiungi l'orzo lessato e manteca."],
    steps_en: [
      "Slice the leek and carrot thin so they soften at roughly the same rate once cooked together.",
      "Sweat them in the butter over low heat with the lid on for about eight minutes, until sweet and tender but not browned.",
      "Meanwhile boil the barley separately in plenty of water for about 20 minutes, until tender with a slight chew.",
      "Drain the barley well and fold it into the vegetables while both are still hot, so the flavors bind together properly.",
      "Let it sit off the heat for a minute before serving, which allows the barley to absorb the last of the butter.",
      "Season with salt and a crack of pepper at the table rather than during cooking."
    ],
    ingredients: [
      { food_id: "orzo_it", grams: 80 },
      { food_id: "170393", grams: 80 },
      { food_id: "porro_it", grams: 80 },
      { food_id: "burro_it", grams: 12 }
    ]
  },
  {
    name: "Zuppa di funghi porcini e patate",
    name_en: "Porcini mushroom and potato soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.4,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola i funghi porcini, aggiungi le patate e l'acqua.", "Cuoci 18 minuti e cospargi di prezzemolo."],
    steps_en: [
      "Sear the porcini in a hot, dry pan first, without crowding the pan, so they brown deeply instead of releasing water and steaming.",
      "Add the oil and garlic once the mushrooms have colored, cooking just until fragrant, about thirty seconds.",
      "Add the diced potato and water to cover, then bring to a simmer.",
      "Cook uncovered for about 18 minutes, until the potato is tender enough to fall apart when pressed against the pot.",
      "Mash a few potato pieces against the side of the pot to naturally thicken the broth without adding flour.",
      "Finish with the parsley stirred in off the heat, so it stays bright rather than wilting from the residual heat."
    ],
    ingredients: [
      { food_id: "funghi_porcini_it", grams: 100 },
      { food_id: "170028", grams: 150 },
      { food_id: "169230", grams: 5 },
      { food_id: "171413", grams: 10 },
      { food_id: "prezzemolo_it", grams: 3 }
    ]
  },
  {
    name: "Farro con piselli e limone",
    name_en: "Farro with peas and lemon",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.7,
    base_amidacea: true, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci il farro nell'acqua per 20 minuti.", "Aggiungi i piselli, l'olio e il limone."],
    steps_en: [
      "Simmer the farro in plenty of water for about 20 minutes, until tender but still slightly chewy.",
      "Add the peas to the same pot for the final 4 minutes of cooking, so they warm through without turning grey and overcooked.",
      "Drain both together and toss immediately with the oil while still warm, so the grains absorb it rather than letting it sit on the surface.",
      "Squeeze the lemon juice over just before serving, not earlier, to keep its brightness from fading.",
      "Taste and season with salt at the end, since farro's own flavor is fairly mild and needs a firm hand.",
      "Serve warm or at room temperature; it holds well either way, unlike more delicate grains."
    ],
    ingredients: [
      { food_id: "farro_perlato_it", grams: 80 },
      { food_id: "170419", grams: 100 },
      { food_id: "171413", grams: 12 },
      { food_id: "limone_it", grams: 10 }
    ]
  },
  {
    name: "Zuppa di fagioli cannellini e porro",
    name_en: "Cannellini bean and leek soup",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 9.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Stufa il porro nell'olio, aggiungi i fagioli e l'acqua.", "Cuoci 15 minuti e schiaccia in parte."],
    steps_en: [
      "Slice only the white and pale green part of the leek, which softens sweetly, unlike the tougher dark green top.",
      "Sweat it in the oil over low heat for about five minutes with the lid on, until soft but not browned.",
      "Add the drained beans and water to cover, then bring to a gentle simmer for about 15 minutes.",
      "Crush roughly a third of the beans against the side of the pot to thicken the broth naturally.",
      "Season with salt only near the end, so you can judge the right amount once the beans have released their own starch.",
      "Finish with a drizzle of raw olive oil per bowl for a rounder flavor than if it's cooked in from the start."
    ],
    ingredients: [
      { food_id: "fagioli_cannellini_it", grams: 180 },
      { food_id: "porro_it", grams: 100 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Grano saraceno con cipolle caramellate",
    name_en: "Buckwheat with caramelized onions",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.2,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci le cipolle nel burro finché dorate.", "Uniscile al grano saraceno lessato."],
    steps_en: [
      "Slice the onions thin and cook them in the butter over low heat, stirring occasionally, for a full 15 minutes — there's no way to rush real caramelization without burning the onion instead.",
      "Toast the raw buckwheat groats in a dry pan for a couple of minutes before boiling, which deepens their flavor past plain and starchy.",
      "Simmer the toasted groats in salted water for about 12 minutes, until tender but still holding their shape.",
      "Drain the buckwheat and fold the caramelized onions through while both are still warm, so the onions' sweetness coats every grain.",
      "Scrape up any browned bits from the onion pan with a spoonful of the buckwheat's cooking water, and stir that back in for extra flavor.",
      "Season with salt at the end, since the onions concentrate quite a bit of natural sweetness that needs balancing."
    ],
    ingredients: [
      { food_id: "grano_saraceno_it", grams: 80 },
      { food_id: "170000", grams: 150 },
      { food_id: "burro_it", grams: 15 }
    ]
  }
];
