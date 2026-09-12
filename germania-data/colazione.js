// germania — colazioni (5)
module.exports = [
  {
    name: "Brötchen con burro e marmellata",
    name_en: "Brötchen (German bread roll) with butter and jam",
    meal_slot: "colazione", prep_min: 4,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 7.2,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Taglia il Brötchen a metà e spalma il burro.", "Aggiungi la marmellata sopra."],
    steps_en: [
      "Split the bread roll horizontally rather than cutting it into slices, which is how a Brötchen is meant to be eaten in Germany.",
      "Spread the butter on both cut halves right to the edges — it seals the crumb so the jam doesn't soak straight through.",
      "Spoon the jam over one half only, keeping it thick enough to taste but not so much it drips out the sides.",
      "Close the roll or leave it open-faced, whichever holds together better with how much jam you used.",
      "Eat soon after assembling, while the roll's crust is still slightly crisp rather than softened by the jam."
    ],
    ingredients: [
      { food_id: "174924", grams: 70 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "marmellata_it", grams: 20 }
    ]
  },
  {
    name: "Müsli alla tedesca con mele e nocciole",
    name_en: "German-style muesli with apple and hazelnuts",
    meal_slot: "colazione", prep_min: 8,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 8.6,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: true,
    steps: ["Lascia i fiocchi d'avena nel latte qualche minuto.", "Aggiungi mela grattugiata e nocciole."],
    steps_en: [
      "Stir the oats into the milk and let them sit at least five minutes — this is the Swiss-German Müsli method, softening the oats without any cooking.",
      "Grate the apple with its skin on, rather than dicing it, which is the traditional way it's mixed into this breakfast.",
      "Fold the grated apple through the softened oats right away, before it has time to brown.",
      "Toast the hazelnuts briefly in a dry pan if you have a spare minute, then chop them roughly.",
      "Scatter the hazelnuts over the top last, so they keep their crunch against the soft oats and apple.",
      "Eat within the hour, while the apple is still fresh and the hazelnuts still crisp."
    ],
    ingredients: [
      { food_id: "avena_it", grams: 45 },
      { food_id: "latte_ps_it", grams: 150 },
      { food_id: "mela_it", grams: 100 },
      { food_id: "nocciole_it", grams: 15 }
    ]
  },
  {
    name: "Schwarzbrot con formaggio e cetriolo",
    name_en: "Schwarzbrot (German dark bread) with cheese and cucumber",
    meal_slot: "colazione", prep_min: 5,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.6,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Affetta il cetriolo sottile.", "Componi il pane nero con emmental e cetriolo."],
    steps_en: [
      "Slice the cucumber thin and pat it dry, so it doesn't turn the dense, dark bread soggy underneath.",
      "Lay the Emmental directly on the bread first, since its firmness gives the cucumber slices something to sit on without sliding off.",
      "Arrange the cucumber slightly overlapping so the whole surface is covered evenly.",
      "Season with a light pinch of salt on the cucumber only, right before eating.",
      "Eat soon after assembling — Schwarzbrot's dense crumb holds up well, but the fresh cucumber doesn't."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 60 },
      { food_id: "emmental_it", grams: 35 },
      { food_id: "168409", grams: 50 }
    ]
  },
  {
    name: "Quark con miele e semi di lino",
    name_en: "Quark with honey and flax seeds",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Versa il quark in una ciotola.", "Aggiungi miele e semi di lino."],
    steps_en: [
      "Spoon the quark into a bowl and smooth the surface, so the honey doesn't run off unevenly to one side.",
      "Grind the flax seeds coarsely first, if you can — whole seeds pass through mostly undigested, so cracking them is what makes them count.",
      "Warm the honey briefly if it's stiff from the fridge, so it drizzles thin rather than clumping.",
      "Stir the ground flax through evenly, rather than only sprinkling it on top, so every spoonful gets some.",
      "Eat soon after mixing, while the quark is still cold and thick."
    ],
    ingredients: [
      { food_id: "formaggio_fresco_it", grams: 150 },
      { food_id: "miele_it", grams: 12 },
      { food_id: "semi_lino_it", grams: 10 }
    ]
  },
  {
    name: "Uovo alla coque con Brötchen e erba cipollina",
    name_en: "Soft-boiled egg with Brötchen and chives",
    meal_slot: "colazione", prep_min: 8,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci l'uovo in acqua bollente per 6 minuti.", "Servi nel portauovo con il Brötchen ed erba cipollina."],
    steps_en: [
      "Lower the egg gently into already-simmering water, so the shell doesn't crack from a sudden temperature change.",
      "Cook for exactly 6 minutes for the classic German soft-boil: a fully set white around a yolk that's still liquid at the center.",
      "Lift it out and place it straight into an egg cup, point up, rather than cooling it under water — this egg is meant to be eaten warm.",
      "Tap around the top with a spoon to crack it open, then scoop directly from the shell.",
      "Snip the chives over the egg and alongside the split Brötchen just before eating, so they stay bright.",
      "Eat immediately — the soft yolk firms up within minutes once the egg is out of its shell."
    ],
    ingredients: [
      { food_id: "uovo_grande_it", grams: 50 },
      { food_id: "174924", grams: 60 },
      { food_id: "erba_cipollina_it", grams: 3 }
    ]
  }
];
