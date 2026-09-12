// germania — primi (10) — tecnica sempre 'semplice', come nel resto del catalogo
module.exports = [
  {
    name: "Erbsensuppe (zuppa di piselli tedesca)",
    name_en: "Erbsensuppe (German split pea soup)",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 8.7,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci i piselli spezzati con patate e wurstel a fette.", "Cuoci 20 minuti e schiaccia in parte."],
    steps_en: [
      "Rinse the split peas under cold water first, since they cook directly without soaking.",
      "Add them to the pot with the diced potato and enough water to cover generously — they absorb more liquid than they look like they would.",
      "Simmer for about 18 minutes, stirring occasionally so the peas don't settle and scorch on the bottom.",
      "Add the sliced sausage only in the last 5 minutes, since it just needs to heat through, not cook from raw.",
      "Mash roughly with the back of a spoon once the peas have mostly broken down on their own, for the traditional thick texture.",
      "Season with salt at the end, tasting first since the sausage already adds some."
    ],
    ingredients: [
      { food_id: "piselli_secchi_it", grams: 130 },
      { food_id: "170028", grams: 100 },
      { food_id: "wurstel_it", grams: 60 }
    ]
  },
  {
    name: "Grünkohleintopf (stufato di cavolo riccio e patate)",
    name_en: "Grünkohleintopf (German kale and potato stew)",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 8.8,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi la cipolla, aggiungi cavolo riccio e patate con acqua.", "Cuoci 18 minuti."],
    steps_en: [
      "Strip the kale from its tough stalks and tear the leaves, since the stalks stay fibrous even after a full simmer.",
      "Soften the onion in the oil for a few minutes first, building the base flavor this humble stew relies on.",
      "Add the kale and let it wilt for a couple of minutes before adding the diced potato and water to cover.",
      "Simmer for about 18 minutes, until the potato falls apart easily when pressed and the kale is fully tender.",
      "Mash a few potato pieces against the side of the pot to thicken the broth naturally.",
      "Season with salt near the end, once the vegetables have released their own flavor into the broth."
    ],
    ingredients: [
      { food_id: "kale_it", grams: 200 },
      { food_id: "170028", grams: 150 },
      { food_id: "170000", grams: 50 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Linsensuppe (zuppa di lenticchie tedesca)",
    name_en: "Linsensuppe (German lentil soup)",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 9.1,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi carota e sedano, aggiungi le lenticchie e l'acqua.", "Cuoci 20 minuti con aceto di mele."],
    steps_en: [
      "Dice the carrot and celery small so they soften fully in the same time the lentils need.",
      "Sweat them in the oil for a few minutes before adding anything else, building sweetness at the base of the soup.",
      "Add the lentils and enough water to cover generously, then bring to a simmer.",
      "Cook uncovered for about 18 minutes, skimming any foam that rises to keep the broth clear.",
      "Stir in a splash of vinegar near the end — this sharp, sour finish is what makes a German Linsensuppe distinct from a plain lentil soup.",
      "Season with salt to taste, once the vinegar's acidity is already in the pot."
    ],
    ingredients: [
      { food_id: "172420", grams: 180 },
      { food_id: "170393", grams: 80 },
      { food_id: "sedano_it", grams: 50 },
      { food_id: "173469", grams: 10 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Bohnensuppe (zuppa di fagioli tedesca)",
    name_en: "Bohnensuppe (German bean soup)",
    meal_slot: "primo", prep_min: 20,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 9.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Soffriggi la cipolla, aggiungi fagioli e patate con acqua.", "Cuoci 15 minuti."],
    steps_en: [
      "Soften the onion in the oil for a few minutes, letting it turn sweet rather than sharp before anything else goes in.",
      "Add the drained beans and the diced potato together with water to cover.",
      "Simmer gently for about 15 minutes, until the potato is tender and starts to break down at the edges.",
      "Crush a spoonful of beans against the side of the pot and stir back in, which thickens the broth without any flour.",
      "Season with salt near the end, once the vegetables have had time to release their flavor.",
      "Serve hot, with a drizzle of raw oil on top for a rounder finish."
    ],
    ingredients: [
      { food_id: "fagioli_borlotti_it", grams: 180 },
      { food_id: "170028", grams: 120 },
      { food_id: "170000", grams: 50 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Knödel al burro e prezzemolo (canederli di pane)",
    name_en: "Knödel (German bread dumplings) with butter and parsley",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 8.0,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Ammolla il pane a cubetti nel latte con uovo.", "Forma i canederli, lessali e condisci con burro."],
    steps_en: [
      "Cut the bread into small cubes and let it sit in the warm milk for at least 10 minutes, until fully softened — dry, stale bread actually works better here than fresh, since it soaks evenly without turning to paste.",
      "Mix in the egg and a pinch of salt just until combined, working gently so the bread cubes don't break apart completely.",
      "Shape the mixture into a few compact balls with wet hands, pressing firmly enough that they hold together in the water.",
      "Lower them into gently simmering water rather than a rolling boil, which would tear them apart.",
      "Poach for about 15 minutes, until they float and feel firm rather than soft when pressed.",
      "Drain them well and toss in the melted butter with the parsley scattered over just before serving."
    ],
    ingredients: [
      { food_id: "pane_integrale_it", grams: 150 },
      { food_id: "latte_ps_it", grams: 100 },
      { food_id: "uovo_grande_it", grams: 50 },
      { food_id: "burro_it", grams: 12 },
      { food_id: "prezzemolo_it", grams: 4 }
    ]
  },
  {
    name: "Spätzle con cipolle fritte",
    name_en: "Spätzle with fried onions",
    meal_slot: "primo", prep_min: 25,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 8.0,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Prepara la pastella con farina, uova e latte e cuoci a gocce.", "Manteca con burro e cipolle fritte."],
    steps_en: [
      "Beat the flour, eggs and milk into a thick, elastic batter — the extra beating is what gives spätzle their springy bite, so don't stop too soon.",
      "Slice the onion thin for frying separately, since it needs a full 15 minutes over low-medium heat to turn deeply golden and sweet, longer than the spätzle take.",
      "Push the batter through the holes of a colander directly into simmering water, working in small batches so the pieces don't clump.",
      "The spätzle are ready the moment they float, usually within a minute — lift them out promptly with a slotted spoon.",
      "Toss the drained spätzle in the melted butter over low heat until glossy.",
      "Fold the fried onions through at the very end, off the heat, so they stay crisp rather than going limp in the steam."
    ],
    ingredients: [
      { food_id: "farina_00_it", grams: 100 },
      { food_id: "uovo_grande_it", grams: 60 },
      { food_id: "latte_ps_it", grams: 60 },
      { food_id: "burro_it", grams: 12 },
      { food_id: "170000", grams: 100 }
    ]
  },
  {
    name: "Gerstensuppe (zuppa d'orzo tedesca)",
    name_en: "Gerstensuppe (German barley soup)",
    meal_slot: "primo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 8.4,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Stufa porri e carote nell'olio, aggiungi l'orzo e l'acqua.", "Cuoci 20 minuti finché morbido."],
    steps_en: [
      "Slice the leek and carrot thin so they soften at the same rate once cooked together.",
      "Sweat them in the oil over low heat for about five minutes, until sweet but not browned.",
      "Add the pearl barley and enough water to cover generously, then bring to a simmer.",
      "Cook uncovered for about 20 minutes, stirring occasionally, until the barley is tender but still has a slight chew.",
      "Top up with a little water if it reduces too far before the barley is fully cooked.",
      "Season with salt near the end and serve hot."
    ],
    ingredients: [
      { food_id: "orzo_it", grams: 70 },
      { food_id: "porro_it", grams: 80 },
      { food_id: "170393", grams: 80 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Sauerkrautsuppe (zuppa di crauti tedesca)",
    name_en: "Sauerkrautsuppe (German sauerkraut soup)",
    meal_slot: "primo", prep_min: 22,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 8.3,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci i crauti con patate e cumino nell'acqua.", "Cuoci 18 minuti."],
    steps_en: [
      "Rinse the sauerkraut briefly under cold water if it tastes very sharp, softening its acidity before it dominates the whole pot.",
      "Toast the caraway seeds in the oil for thirty seconds before adding the sauerkraut, which brings out far more of their aroma than adding them raw.",
      "Add the sauerkraut, diced potato and water to cover, then simmer for about 18 minutes.",
      "Stir occasionally, since sauerkraut can catch on the bottom once its own liquid cooks down.",
      "Check the potato has softened enough to thicken the broth slightly when pressed against the pot.",
      "Taste before salting — sauerkraut is already salty from fermentation."
    ],
    ingredients: [
      { food_id: "169279", grams: 200 },
      { food_id: "170028", grams: 120 },
      { food_id: "170923", grams: 2 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Selleriesalat (insalata di sedano alla senape, tedesca)",
    name_en: "Selleriesalat (German celery salad with mustard)",
    meal_slot: "primo", prep_min: 15,
    profilo: "europeo-leggero", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.9,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Affetta il sedano sottile e sbollentalo 2 minuti.", "Condisci con senape, aceto e olio."],
    steps_en: [
      "Slice the celery thin on a sharp angle, which shortens its fibrous strings and makes it easier to eat raw-textured.",
      "Blanch it for just 2 minutes in boiling water, then drain and cool it quickly — this takes the rawest edge off without cooking it soft.",
      "Whisk the mustard, vinegar and oil together into a sharp dressing, the way this salad is traditionally served alongside cold cuts.",
      "Toss the celery with the dressing while it's still slightly warm, so it absorbs the flavor better than once fully cooled.",
      "Let it sit at least ten minutes before serving so the mustard's flavor spreads through.",
      "Serve cold or at room temperature as a sharp, crunchy side."
    ],
    ingredients: [
      { food_id: "sedano_it", grams: 250 },
      { food_id: "senape_it", grams: 12 },
      { food_id: "173469", grams: 10 },
      { food_id: "171413", grams: 10 }
    ]
  },
  {
    name: "Flädlesuppe (brodo con frittatine a striscioline)",
    name_en: "Flädlesuppe (German broth with pancake strips)",
    meal_slot: "primo", prep_min: 20,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci sottili crepes con farina, uova e latte.", "Taglia a striscioline e servi nel brodo caldo con erba cipollina."],
    steps_en: [
      "Whisk the flour, eggs and milk into a thin, smooth batter — much thinner than a spätzle batter, closer to a crêpe.",
      "Cook it in a hot, lightly oiled pan in thin rounds, one at a time, just until set on both sides but not browned.",
      "Stack the cooked pancakes and let them cool for a couple of minutes, which makes them far easier to slice cleanly.",
      "Roll each one up and slice it crosswise into thin strips — this is the defining step that turns a pancake into a soup garnish.",
      "Bring a light vegetable or bread-vegetable broth to a simmer while the pancakes cool.",
      "Divide the pancake strips among bowls and ladle the hot broth over just before serving, scattering the chives on top."
    ],
    ingredients: [
      { food_id: "farina_00_it", grams: 60 },
      { food_id: "uovo_grande_it", grams: 60 },
      { food_id: "latte_ps_it", grams: 80 },
      { food_id: "170393", grams: 60 },
      { food_id: "sedano_it", grams: 40 },
      { food_id: "erba_cipollina_it", grams: 3 }
    ]
  }
];
