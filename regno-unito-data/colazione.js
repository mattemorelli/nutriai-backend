// regno_unito — colazioni (5)
module.exports = [
  {
    name: "Porridge scozzese al sale",
    name_en: "Scottish salted porridge",
    meal_slot: "colazione", prep_min: 10,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 8.5,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci i fiocchi d'avena nel latte con un pizzico di sale.", "Servi caldo senza zucchero, alla scozzese."],
    steps_en: [
      "Bring the milk to a bare simmer before adding the oats, so they start cooking evenly instead of clumping in cold liquid.",
      "Stir in a pinch of salt now, not at the end — this is the traditional Scottish way, savoury rather than sweet from the start.",
      "Simmer gently, stirring often, for about 6 minutes: oats scorch fast on the bottom once the liquid reduces.",
      "Take it off the heat once it coats the spoon thickly — it thickens further as it sits for a minute.",
      "Serve it plain, without sugar or fruit, the way it's eaten across Scotland — the salt is the whole point.",
      "Eat it while still hot; it stiffens noticeably within a few minutes of cooling."
    ],
    ingredients: [
      { food_id: "avena_it", grams: 45 },
      { food_id: "latte_ps_it", grams: 220 }
    ]
  },
  {
    name: "Uova strapazzate con crescione su pane tostato",
    name_en: "Scrambled eggs with watercress on toast",
    meal_slot: "colazione", prep_min: 8,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Sbatti le uova e cuocile nel burro a fuoco basso.", "Servi su pane tostato con il crescione."],
    steps_en: [
      "Beat the eggs just until the yolks and whites are combined — overbeating adds air that makes the curds tougher, not fluffier.",
      "Melt the butter over low heat first; it should coat the pan without browning before the eggs go in.",
      "Pour in the eggs and stir slowly and constantly, pulling the curds from the edges toward the center as they set.",
      "Take the pan off the heat while the eggs still look slightly underdone — residual heat finishes them, which is what keeps them creamy instead of dry.",
      "Toast the bread while the eggs cook so both are ready at the same moment.",
      "Pile the eggs onto the toast and scatter the watercress over raw, right at the end, so its peppery bite stays sharp."
    ],
    ingredients: [
      { food_id: "uovo_grande_it", grams: 100 },
      { food_id: "burro_it", grams: 8 },
      { food_id: "pane_integrale_it", grams: 50 },
      { food_id: "crescione_it", grams: 20 }
    ]
  },
  {
    name: "Pane tostato con marmellata d'arance",
    name_en: "Toast with orange marmalade",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 7.1,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Tosta il pane e spalma il burro.", "Aggiungi la marmellata sopra."],
    steps_en: [
      "Toast the bread until golden and firm — this classic British breakfast relies on a real crunch under the marmalade.",
      "Spread the butter while the toast is still hot, right to the edges, so it melts in and forms a barrier under the jam.",
      "Spoon the marmalade over the butter rather than mixing them, so its bittersweet orange flavor stays distinct.",
      "Use a light hand: a thin, even layer lets the toast's crunch come through in every bite.",
      "Eat within a couple of minutes of assembling, before the marmalade's moisture starts to soften the crust."
    ],
    ingredients: [
      { food_id: "pane_integrale_it", grams: 60 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "marmellata_it", grams: 20 }
    ]
  },
  {
    name: "Fagioli in salsa di pomodoro su pane tostato",
    name_en: "Beans on toast",
    meal_slot: "colazione", prep_min: 15,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 8.1,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cuoci i fagioli nella passata di pomodoro per 10 minuti.", "Servi caldi sul pane tostato."],
    steps_en: [
      "Drain and rinse the beans well, then simmer them in the tomato passata over medium-low heat for about 10 minutes.",
      "Stir occasionally, mashing a few beans against the side of the pan to thicken the sauce naturally.",
      "Season with a little salt near the end, once the tomato has reduced and concentrated in flavor.",
      "Toast the bread while the beans finish simmering, so both are hot at the same time.",
      "Spoon the beans generously over the toast rather than beside it, letting the sauce soak in slightly.",
      "Eat right away, while the toast is still crisp under the warm sauce."
    ],
    ingredients: [
      { food_id: "fagioli_cannellini_it", grams: 180 },
      { food_id: "passata_pomodoro_it", grams: 120 },
      { food_id: "pane_integrale_it", grams: 50 }
    ]
  },
  {
    name: "Uovo alla coque con soldatini di pane tostato",
    name_en: "Soft-boiled egg with toast soldiers",
    meal_slot: "colazione", prep_min: 8,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci l'uovo in acqua bollente per 6 minuti.", "Taglia il pane tostato a listarelle e servi come soldatini."],
    steps_en: [
      "Lower the egg gently into already-simmering water, so the shell doesn't crack from a sudden change in temperature.",
      "Cook for exactly 6 minutes for a white fully set around a yolk still liquid at the center — this is the whole point of the dish.",
      "Toast the bread while the egg cooks and butter it right away, while still hot, so it melts in fully.",
      "Cut the buttered toast into narrow strips — the 'soldiers' that are dipped into the yolk.",
      "Place the egg upright in an egg cup and tap around the top with a spoon to crack it open.",
      "Dip the toast strips straight into the runny yolk and eat immediately, before it starts to firm up."
    ],
    ingredients: [
      { food_id: "uovo_grande_it", grams: 50 },
      { food_id: "pane_integrale_it", grams: 50 },
      { food_id: "burro_it", grams: 8 }
    ]
  }
];
