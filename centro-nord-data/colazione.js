// centro_nord_generico — colazioni (40)
module.exports = [
  {
    name: "Pane di segale con burro e miele",
    name_en: "Rye bread with butter and honey",
    meal_slot: "colazione", prep_min: 4,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 7.3,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Spalma il burro sul pane di segale.", "Versa il miele sopra a filo."],
    steps_en: [
      "Slice the rye bread while still cool from the fridge, so the dense crumb doesn't tear under the knife.",
      "Spread the butter first, right to the edges — it seals the crumb so the honey sits on top instead of soaking straight through.",
      "Drizzle the honey over the butter in a thin ribbon rather than a pool, so every bite gets some.",
      "Let it sit two minutes before eating: the butter softens fully and the honey settles into it.",
      "Eat the slice whole rather than pre-cut into pieces, since rye crumbles less that way."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 60 },
      { food_id: "burro_it", grams: 10 },
      { food_id: "miele_it", grams: 15 }
    ]
  },
  {
    name: "Pane di segale con formaggio fresco e ravanelli",
    name_en: "Rye bread with fresh cheese and radishes",
    meal_slot: "colazione", prep_min: 6,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.8,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Spalma il formaggio fresco sul pane.", "Affetta i ravanelli sottili e distribuiscili sopra."],
    steps_en: [
      "Slice the radishes paper-thin — thick rounds stay too sharp and overpower the mild cheese.",
      "Spread the fresh cheese generously on the rye bread; its acidity is what balances the radish bite.",
      "Lay the radish slices over the cheese in a single layer so each one shows.",
      "Season with a pinch of salt only on the radishes, right before serving, or they weep water and go limp.",
      "Serve immediately: the cheese layer keeps the bread from softening while you eat."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 60 },
      { food_id: "formaggio_fresco_it", grams: 60 },
      { food_id: "ravanelli_it", grams: 40 }
    ]
  },
  {
    name: "Pane di segale con salmone affumicato",
    name_en: "Rye bread with smoked salmon",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 8.3,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Disponi il salmone affumicato sul pane di segale.", "Spremi qualche goccia di limone sopra."],
    steps_en: [
      "Toast the rye bread lightly if you like a firmer base — the salmon is already fully cured, so no heat is needed on it.",
      "Lay the smoked salmon in loose folds rather than flat: it stays tender and doesn't turn rubbery from being pressed.",
      "Squeeze the lemon over just before eating, not earlier — the acid starts to firm the fish's texture on contact.",
      "Skip added salt: the curing salt in the salmon is already enough.",
      "Eat it open-faced so the salmon's texture stays the star, rather than folding the bread over it."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 50 },
      { food_id: "salmone_affumicato_it", grams: 50 },
      { food_id: "limone_it", grams: 5 }
    ]
  },
  {
    name: "Pane di segale con emmental",
    name_en: "Rye bread with Emmental",
    meal_slot: "colazione", prep_min: 3,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.4,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Affetta l'emmental sottile.", "Adagialo sul pane di segale."],
    steps_en: [
      "Slice the Emmental thin rather than in a thick wedge, so it softens against the bread instead of sitting stiff on top.",
      "Lay it over the rye bread while the bread is at room temperature — cold bread keeps the cheese from settling in.",
      "Leave it uncovered for a minute before eating, which lets the cheese's holes release their aroma.",
      "Skip butter underneath: Emmental's own fat is enough to keep the bite from tasting dry.",
      "Cut into two pieces rather than quarters, so the cheese doesn't crack off the edges."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 60 },
      { food_id: "emmental_it", grams: 40 }
    ]
  },
  {
    name: "Pane di segale con gouda e cetriolo",
    name_en: "Rye bread with Gouda and cucumber",
    meal_slot: "colazione", prep_min: 5,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.6,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Affetta il cetriolo sottile.", "Componi il pane con gouda e cetriolo."],
    steps_en: [
      "Slice the cucumber thin and pat it dry with a cloth, or its water will make the bread soggy within minutes.",
      "Lay the Gouda directly on the bread first: its firmness gives the cucumber something to sit on without sliding off.",
      "Arrange the cucumber slices slightly overlapping, like shingles, so every bite gets some.",
      "Season with a light pinch of salt on the cucumber only, right before serving.",
      "Serve at once — this combination is built to be eaten fresh, not held."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 55 },
      { food_id: "171241", grams: 35 },
      { food_id: "168409", grams: 50 }
    ]
  },
  {
    name: "Pane di segale con marmellata di prugne",
    name_en: "Rye bread with plum jam",
    meal_slot: "colazione", prep_min: 3,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 7.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Spalma il burro sul pane.", "Aggiungi la marmellata sopra."],
    steps_en: [
      "Spread the butter edge to edge before the jam — it forms a barrier so the bread stays crisp underneath.",
      "Spoon the jam over the butter rather than mixing them, so you still taste the fruit distinctly.",
      "Use a light hand with the jam: too thick a layer masks the rye's own sourness, which is the point of choosing it.",
      "Let it sit briefly so the jam warms slightly against the butter and spreads more easily.",
      "Eat within a few minutes of assembling, before the jam's moisture starts to soften the crust."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 55 },
      { food_id: "marmellata_it", grams: 25 },
      { food_id: "burro_it", grams: 8 }
    ]
  },
  {
    name: "Pane di segale con uovo sodo ed erba cipollina",
    name_en: "Rye bread with boiled egg and chives",
    meal_slot: "colazione", prep_min: 10,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.9,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Bollisci l'uovo per 9 minuti e raffredda.", "Affettalo sul pane e cospargi di erba cipollina."],
    steps_en: [
      "Lower the egg into simmering water and cook 9 minutes for a fully set yolk that still slices cleanly.",
      "Cool it under running water right away — this stops the cooking and keeps a green ring from forming around the yolk.",
      "Peel it under a little water, working from the wider end where the air pocket makes the shell lift off easier.",
      "Slice the egg rather than mash it, so its texture stays distinct against the soft bread.",
      "Snip the chives directly over the top with scissors, not a knife, so they don't bruise and darken.",
      "Season with a pinch of salt only on the egg, since the bread and chives already carry flavor."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 55 },
      { food_id: "uovo_grande_it", grams: 50 },
      { food_id: "erba_cipollina_it", grams: 3 }
    ]
  },
  {
    name: "Pane integrale con burro e mela",
    name_en: "Wholegrain bread with butter and apple",
    meal_slot: "colazione", prep_min: 5,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 7.6,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Spalma il burro sul pane integrale.", "Affetta la mela sottile e disponila sopra."],
    steps_en: [
      "Core the apple and slice it thin, cutting just before serving so the flesh doesn't brown.",
      "Spread the butter on the wholegrain bread first — its fat keeps the apple's moisture from soaking into the crumb.",
      "Fan the apple slices slightly overlapping so the bread is covered edge to edge.",
      "Leave the peel on: it holds the slice's shape and adds the fibre this bread's whole grain is chosen for.",
      "Eat right away, while the apple is still crisp against the soft butter."
    ],
    ingredients: [
      { food_id: "pane_integrale_it", grams: 55 },
      { food_id: "burro_it", grams: 8 },
      { food_id: "mela_it", grams: 100 }
    ]
  },
  {
    name: "Fiocchi d'avena con mela e cannella",
    name_en: "Oat porridge with apple and cinnamon",
    meal_slot: "colazione", prep_min: 8,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.6,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci i fiocchi d'avena nel latte per 5 minuti.", "Aggiungi la mela a cubetti e la cannella."],
    steps_en: [
      "Dice the apple small so it softens fully in the short cooking time rather than staying raw at the center.",
      "Bring the milk to a bare simmer before adding the oats, so they start cooking evenly instead of clumping in cold liquid.",
      "Stir in the apple and cinnamon partway through, not at the start, so the apple keeps some bite rather than turning to mush.",
      "Simmer gently, stirring often: oats scorch fast on the bottom once the liquid reduces.",
      "Take it off the heat once it coats the spoon thickly — it thickens further as it sits.",
      "Let it rest a minute before eating; the porridge is scalding straight off the stove."
    ],
    ingredients: [
      { food_id: "avena_it", grams: 45 },
      { food_id: "latte_ps_it", grams: 200 },
      { food_id: "mela_it", grams: 100 },
      { food_id: "cannella_it", grams: 1 }
    ]
  },
  {
    name: "Fiocchi d'avena con mirtilli e miele",
    name_en: "Oat porridge with blueberries and honey",
    meal_slot: "colazione", prep_min: 8,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.7,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci i fiocchi d'avena nel latte per 5 minuti.", "Versa sopra i mirtilli e il miele."],
    steps_en: [
      "Simmer the oats in the milk over low heat, stirring often so they don't stick as the liquid is absorbed.",
      "Cook just until the porridge is thick but still falls from the spoon — it firms up more as it cools.",
      "Scatter most of the blueberries in whole at the end of cooking so their skins stay intact and don't bleed color through the whole bowl.",
      "Crush a few of the remaining berries on top instead, to release a little juice that runs through as you eat.",
      "Drizzle the honey last, over the berries rather than into the hot porridge, so its flavor stays bright instead of dulling with heat."
    ],
    ingredients: [
      { food_id: "avena_it", grams: 45 },
      { food_id: "latte_ps_it", grams: 200 },
      { food_id: "mirtilli_it", grams: 80 },
      { food_id: "miele_it", grams: 10 }
    ]
  },
  {
    name: "Fiocchi d'avena con prugne secche e noci",
    name_en: "Oat porridge with prunes and walnuts",
    meal_slot: "colazione", prep_min: 10,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 8.3,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: true,
    steps: ["Cuoci i fiocchi d'avena nel latte con le prugne tritate.", "Servi con le noci sopra."],
    steps_en: [
      "Chop the prunes before cooking, not after — added whole they stay tough, while chopped they soften and sweeten the whole pot.",
      "Add them to the milk with the oats from the start, so they have the full simmering time to plump up.",
      "Stir regularly over low heat until the oats thicken; the prunes' sugar makes the bottom scorch faster than plain porridge.",
      "Toast the walnuts briefly in a dry pan while the porridge cooks — a minute of heat brings out an aroma raw nuts don't have.",
      "Scatter the toasted walnuts over the top just before serving so they stay crunchy against the soft oats."
    ],
    ingredients: [
      { food_id: "avena_it", grams: 45 },
      { food_id: "latte_ps_it", grams: 180 },
      { food_id: "168162", grams: 30 },
      { food_id: "noci_it", grams: 15 }
    ]
  },
  {
    name: "Muesli con yogurt e pera",
    name_en: "Muesli with yogurt and pear",
    meal_slot: "colazione", prep_min: 5,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 8.5,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lascia i fiocchi d'avena nello yogurt qualche minuto.", "Aggiungi la pera a cubetti e i semi di lino."],
    steps_en: [
      "Stir the oats into the yogurt and let them sit at least five minutes — this is what softens them without any cooking, the whole point of a muesli.",
      "Dice the pear with its skin on, which is where most of its fibre and flavor sit.",
      "Fold the pear through the softened oats rather than piling it on top, so every spoonful gets some.",
      "Stir in the flax seeds last; they don't need soaking time and stay crunchy longest this way.",
      "Eat within the hour — left much longer, the oats keep absorbing liquid and turn the texture pasty."
    ],
    ingredients: [
      { food_id: "avena_it", grams: 40 },
      { food_id: "171284", grams: 150 },
      { food_id: "pera_it", grams: 100 },
      { food_id: "semi_lino_it", grams: 10 }
    ]
  },
  {
    name: "Grano saraceno al latte con miele",
    name_en: "Buckwheat porridge with honey",
    meal_slot: "colazione", prep_min: 15,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci il grano saraceno nel latte per 12 minuti.", "Servi con il miele a filo."],
    steps_en: [
      "Rinse the buckwheat briefly under cold water first — it washes off surface starch that would otherwise make the porridge gluey.",
      "Bring the milk to a simmer before adding the grain, then lower the heat right away so it doesn't boil over.",
      "Cook uncovered, stirring every couple of minutes, for about 12 minutes until the grains are tender but still hold their shape.",
      "Take it off the heat once most of the milk is absorbed; it will thicken further as it sits for a minute.",
      "Drizzle the honey over individual portions rather than into the pot, so you can adjust sweetness per bowl."
    ],
    ingredients: [
      { food_id: "grano_saraceno_it", grams: 45 },
      { food_id: "latte_ps_it", grams: 200 },
      { food_id: "miele_it", grams: 12 }
    ]
  },
  {
    name: "Porridge d'avena con semi di lino e mirtilli rossi",
    name_en: "Oat porridge with flax seeds and dried cranberries",
    meal_slot: "colazione", prep_min: 8,
    profilo: "neutro", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 8.4,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci i fiocchi d'avena nel latte per 5 minuti.", "Aggiungi semi di lino e mirtilli rossi secchi."],
    steps_en: [
      "Simmer the oats in the milk over low heat, stirring so they thicken evenly instead of catching at the bottom.",
      "Grind the flax seeds coarsely just before using, if you can — whole seeds pass through mostly undigested, so cracking them is what makes them count.",
      "Stir the ground flax into the porridge once it's off the heat; cooking it further does nothing for its nutrients and only stiffens the texture.",
      "Scatter the dried cranberries over the top rather than stirring them in, so their tartness stays concentrated in each bite.",
      "Serve while still warm — the porridge stiffens noticeably within a few minutes of cooling."
    ],
    ingredients: [
      { food_id: "avena_it", grams: 45 },
      { food_id: "latte_ps_it", grams: 180 },
      { food_id: "semi_lino_it", grams: 10 },
      { food_id: "171723", grams: 20 }
    ]
  },
  {
    name: "Yogurt greco con mirtilli e semi di zucca",
    name_en: "Greek yogurt with blueberries and pumpkin seeds",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 9.0,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Versa lo yogurt greco in una ciotola.", "Aggiungi i mirtilli e i semi di zucca."],
    steps_en: [
      "Spoon the yogurt into a bowl and level it, so the toppings sit on an even surface instead of sliding to one side.",
      "Scatter the blueberries over whole rather than crushed, so their skins stay intact and the yogurt stays white rather than streaked.",
      "Toast the pumpkin seeds briefly in a dry pan if you have a spare minute — it deepens their flavor past raw and grassy.",
      "Add the seeds last, right before eating, so they stay crisp against the cold, soft yogurt.",
      "Eat immediately: yogurt this thick starts to loosen once fruit sits in it for more than a few minutes."
    ],
    ingredients: [
      { food_id: "171304", grams: 180 },
      { food_id: "mirtilli_it", grams: 100 },
      { food_id: "semi_zucca_it", grams: 15 }
    ]
  },
  {
    name: "Yogurt magro con pera e noci",
    name_en: "Low-fat yogurt with pear and walnuts",
    meal_slot: "colazione", prep_min: 5,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.4,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: true,
    steps: ["Taglia la pera a cubetti.", "Uniscila allo yogurt magro con le noci."],
    steps_en: [
      "Dice the pear with the skin on and cut it just before serving, since pear browns faster than apple once exposed to air.",
      "Fold it through the yogurt gently rather than stirring hard, so the cubes keep their shape instead of turning to mush.",
      "Break the walnuts into rough pieces by hand instead of chopping them fine — bigger pieces keep their crunch longer against the moist yogurt.",
      "Scatter the walnuts on top last, so they don't soften from contact with the yogurt before you eat.",
      "Serve at once: pear releases juice quickly and thins the yogurt if left standing."
    ],
    ingredients: [
      { food_id: "yogurt_magro_it", grams: 180 },
      { food_id: "pera_it", grams: 100 },
      { food_id: "noci_it", grams: 15 }
    ]
  },
  {
    name: "Kefir con mela e cannella",
    name_en: "Kefir with apple and cinnamon",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.6,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Versa il kefir in un bicchiere.", "Aggiungi la mela a cubetti e la cannella."],
    steps_en: [
      "Dice the apple small so it can be drunk-and-chewed straight from the glass along with the kefir.",
      "Pour the kefir over the apple rather than the other way round, so the fruit doesn't clump at the bottom.",
      "Dust the cinnamon on top rather than stirring it in fully — a visible layer means you taste it in the first sip.",
      "Give it one gentle stir just before drinking, enough to distribute the apple without deflating the kefir's natural fizz.",
      "Drink it fresh: kefir's tang grows stronger the longer it sits at room temperature."
    ],
    ingredients: [
      { food_id: "kefir_it", grams: 200 },
      { food_id: "mela_it", grams: 100 },
      { food_id: "cannella_it", grams: 1 }
    ]
  },
  {
    name: "Kefir con prugne secche",
    name_en: "Kefir with prunes",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.5,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Trita grossolanamente le prugne secche.", "Uniscile al kefir."],
    steps_en: [
      "Chop the prunes into small pieces so they distribute through the kefir instead of sinking as whole lumps.",
      "Let them sit in the kefir a few minutes before drinking — the prunes soften slightly and release a little sweetness into it.",
      "Stir once before serving, since the pieces settle quickly given the kefir's thin consistency.",
      "Serve cold, straight from the fridge: kefir's flavor turns notably sourer as it warms.",
      "Drink it slowly enough to chew the softened prune pieces rather than swallowing them whole."
    ],
    ingredients: [
      { food_id: "kefir_it", grams: 200 },
      { food_id: "168162", grams: 30 }
    ]
  },
  {
    name: "Latticello con mirtilli",
    name_en: "Buttermilk with blueberries",
    meal_slot: "colazione", prep_min: 3,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Versa il latticello in una ciotola.", "Aggiungi i mirtilli."],
    steps_en: [
      "Shake or stir the buttermilk before pouring, since its solids settle at the bottom of the container.",
      "Pour it into a bowl rather than a glass if you want to eat the blueberries with a spoon instead of drinking around them.",
      "Add the blueberries whole and unwashed-dry so their skins don't split and bleed into the buttermilk.",
      "Serve immediately after adding the fruit — buttermilk's tang is sharpest right after pouring, before it warms.",
      "Skip added sugar: the natural sweetness of ripe blueberries is enough against buttermilk's sourness."
    ],
    ingredients: [
      { food_id: "latticello_it", grams: 200 },
      { food_id: "mirtilli_it", grams: 100 }
    ]
  },
  {
    name: "Latticello con miele e semi di lino",
    name_en: "Buttermilk with honey and flax seeds",
    meal_slot: "colazione", prep_min: 3,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.3,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Versa il latticello in un bicchiere.", "Aggiungi miele e semi di lino."],
    steps_en: [
      "Grind the flax seeds coarsely before adding them, so they mix into the drink instead of floating whole on top.",
      "Stir the honey into the buttermilk while it's still fairly liquid, since honey dissolves slowly once buttermilk cools further.",
      "Add the ground flax last and stir again just before drinking, or it settles into a layer at the bottom.",
      "Drink it soon after mixing: the flax starts to thicken the liquid slightly the longer it sits.",
      "Serve chilled — buttermilk's flavor turns flat rather than refreshing once it reaches room temperature."
    ],
    ingredients: [
      { food_id: "latticello_it", grams: 200 },
      { food_id: "miele_it", grams: 12 },
      { food_id: "semi_lino_it", grams: 10 }
    ]
  },
  {
    name: "Formaggio fresco con miele e nocciole",
    name_en: "Fresh cheese with honey and hazelnuts",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: true,
    steps: ["Versa il formaggio fresco in una ciotola.", "Aggiungi miele e nocciole."],
    steps_en: [
      "Spoon the fresh cheese into a bowl and smooth the top, so the honey doesn't pool unevenly to one side.",
      "Toast the hazelnuts in a dry pan for a couple of minutes if you can — raw hazelnuts taste flat next to this cheese's tang.",
      "Chop the toasted hazelnuts roughly rather than leaving them whole, so a bit of their oil coats each piece.",
      "Drizzle the honey over the cheese first, then scatter the hazelnuts on top so they don't sink and lose their crunch.",
      "Eat right away, while the hazelnuts are still warm from toasting and the contrast with the cold cheese is sharpest."
    ],
    ingredients: [
      { food_id: "formaggio_fresco_it", grams: 150 },
      { food_id: "miele_it", grams: 12 },
      { food_id: "nocciole_it", grams: 15 }
    ]
  },
  {
    name: "Formaggio fresco con mirtilli e semi di girasole",
    name_en: "Fresh cheese with blueberries and sunflower seeds",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.1,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Versa il formaggio fresco in una ciotola.", "Aggiungi mirtilli e semi di girasole."],
    steps_en: [
      "Spoon the fresh cheese into a bowl, keeping the surface loose rather than packed, so the fruit doesn't just sit on a flat wall of cheese.",
      "Scatter the blueberries in whole, pressing a few gently so they sink slightly and release a little juice into the cheese.",
      "Toast the sunflower seeds briefly in a dry pan for extra aroma, then let them cool before adding — hot seeds would soften the cheese underneath.",
      "Add the seeds last, just before eating, so they keep their crunch.",
      "Serve cold: this combination is meant to be eaten straight from the fridge, not warmed."
    ],
    ingredients: [
      { food_id: "formaggio_fresco_it", grams: 150 },
      { food_id: "mirtilli_it", grams: 80 },
      { food_id: "semi_girasole_it", grams: 15 }
    ]
  },
  {
    name: "Uova sode con pane di segale e erba cipollina",
    name_en: "Boiled eggs with rye bread and chives",
    meal_slot: "colazione", prep_min: 10,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.8,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Bollisci le uova per 9 minuti.", "Affettale sul pane con l'erba cipollina."],
    steps_en: [
      "Start the eggs in already-simmering water, not cold water, so you can time them precisely from the moment they go in.",
      "Cook 9 minutes for a yolk set through but still pale and moist at the very center.",
      "Cool the eggs under running water immediately — this is what keeps the yolk from turning greenish at the edge.",
      "Peel and slice them rather than chopping, so the yolk stays visible in cross-section on the bread.",
      "Snip the chives with scissors directly over the top, which bruises them less than chopping with a knife.",
      "Season with salt only at the table, since the amount people want varies more here than with most toppings."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 55 },
      { food_id: "uovo_grande_it", grams: 100 },
      { food_id: "erba_cipollina_it", grams: 3 }
    ]
  },
  {
    name: "Uova strapazzate con erba cipollina su pane integrale",
    name_en: "Scrambled eggs with chives on wholegrain bread",
    meal_slot: "colazione", prep_min: 8,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.6,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Sbatti le uova e cuocile nel burro a fuoco basso.", "Servi su pane integrale con erba cipollina."],
    steps_en: [
      "Beat the eggs just until the yolks and whites are combined — overbeating adds air that makes the curds tougher, not fluffier.",
      "Melt the butter over low heat first; it should coat the pan without browning before the eggs go in.",
      "Pour in the eggs and stir slowly and constantly, pulling the curds from the edges toward the center as they set.",
      "Take the pan off the heat while the eggs still look slightly underdone — residual heat finishes them, and this is what keeps them creamy instead of dry.",
      "Toast the wholegrain bread while the eggs cook so both are ready at the same moment.",
      "Spoon the eggs onto the toast and scatter the chives last, off the heat, so they keep their color and bite."
    ],
    ingredients: [
      { food_id: "uovo_grande_it", grams: 100 },
      { food_id: "burro_it", grams: 8 },
      { food_id: "erba_cipollina_it", grams: 3 },
      { food_id: "pane_integrale_it", grams: 50 }
    ]
  },
  {
    name: "Frittata semplice con erba cipollina e pane di segale",
    name_en: "Simple chive omelette with rye bread",
    meal_slot: "colazione", prep_min: 8,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.5,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Sbatti le uova con un goccio di latte.", "Cuoci in padella con burro e servi con pane."],
    steps_en: [
      "Whisk the eggs with the milk until just blended — the milk is what keeps the omelette tender rather than rubbery.",
      "Heat the butter in a small pan over medium-low heat until it foams but doesn't brown.",
      "Pour in the eggs and let the edges set before tilting the pan to let uncooked egg run underneath.",
      "Scatter the chives over the surface once the top is mostly set, not at the start, so they don't overcook and lose color.",
      "Fold the omelette in half once the center is just barely set — it keeps cooking from residual heat as it rests.",
      "Serve alongside the rye bread rather than on it, so the bread stays crisp instead of steaming under the warm eggs."
    ],
    ingredients: [
      { food_id: "uovo_grande_it", grams: 100 },
      { food_id: "latte_ps_it", grams: 20 },
      { food_id: "burro_it", grams: 5 },
      { food_id: "erba_cipollina_it", grams: 3 },
      { food_id: "pane_segale_it", grams: 40 }
    ]
  },
  {
    name: "Aringa marinata con pane di segale e cipolla",
    name_en: "Marinated herring with rye bread and onion",
    meal_slot: "colazione", prep_min: 8,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.9,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Marina l'aringa nell'aceto di mele con la cipolla per qualche minuto.", "Servi sul pane di segale."],
    steps_en: [
      "Slice the red onion very thin, since it's eaten raw here and thick pieces would dominate the fish's flavor.",
      "Toss the herring and onion with the apple vinegar and let them sit at least five minutes — this is what takes the raw edge off the onion.",
      "Lift the herring out of the marinade rather than pouring everything onto the bread, so the rye doesn't turn soggy.",
      "Lay the marinated onion over the fish rather than under it, so its sharper flavor is the first thing you taste.",
      "Serve cold: this dish is traditionally eaten straight from the fridge, not brought to room temperature first."
    ],
    ingredients: [
      { food_id: "aringa_it", grams: 70 },
      { food_id: "pane_segale_it", grams: 50 },
      { food_id: "cipolla_rossa_it", grams: 20 },
      { food_id: "173469", grams: 5 }
    ]
  },
  {
    name: "Salmone affumicato con uovo sodo e cetriolo",
    name_en: "Smoked salmon with boiled egg and cucumber",
    meal_slot: "colazione", prep_min: 10,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.6,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Bollisci l'uovo per 9 minuti.", "Componi con salmone affumicato e cetriolo a fette."],
    steps_en: [
      "Boil the egg for 9 minutes, then cool it under running water so the yolk sets fully without a green edge.",
      "Slice the cucumber thin and pat the slices dry, so they don't dilute the plate with extra water.",
      "Arrange the smoked salmon in loose folds rather than flat, keeping its texture tender instead of pressed.",
      "Slice the peeled egg and place it alongside rather than on top of the salmon, so its texture stays distinct.",
      "Serve cold, without added salt: the curing salt in the salmon already seasons the whole plate."
    ],
    ingredients: [
      { food_id: "salmone_affumicato_it", grams: 60 },
      { food_id: "uovo_grande_it", grams: 50 },
      { food_id: "168409", grams: 60 }
    ]
  },
  {
    name: "Frittelle di patate con composta di mela",
    name_en: "Potato pancakes with apple compote",
    meal_slot: "colazione", prep_min: 22,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 7.1,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Grattugia le patate e mescola con uovo e farina.", "Friggi le frittelle e servi con la composta di mela."],
    steps_en: [
      "Grate the potatoes and squeeze the shreds hard in a cloth to remove as much water as possible — this is what makes the pancakes crisp instead of steaming soggy in the pan.",
      "Mix the squeezed potato with the egg and flour just until combined, so the batter holds together without turning gluey.",
      "Cook the apple with a splash of water and the cinnamon over low heat until it breaks down into a soft compote, about 10 minutes.",
      "Heat the oil until it shimmers before adding the potato mixture — a pan that isn't hot enough lets the pancakes absorb oil instead of frying.",
      "Flatten each spoonful thin in the pan and fry a few minutes per side until the edges turn deep golden and lacy.",
      "Serve hot, with the warm apple compote spooned alongside rather than mixed in, so the pancakes stay crisp."
    ],
    ingredients: [
      { food_id: "170028", grams: 200 },
      { food_id: "uovo_grande_it", grams: 30 },
      { food_id: "farina_00_it", grams: 15 },
      { food_id: "mela_it", grams: 100 },
      { food_id: "cannella_it", grams: 1 },
      { food_id: "olio_semi_vari_it", grams: 10 }
    ]
  },
  {
    name: "Mela a fette con miele e cannella",
    name_en: "Sliced apple with honey and cinnamon",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.8,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Affetta la mela.", "Condisci con miele e cannella."],
    steps_en: [
      "Core the apple and slice it into even wedges, cutting close to serving time so the flesh doesn't brown.",
      "Fan the slices out on a plate rather than stacking them, so the honey reaches every piece.",
      "Warm the honey for a few seconds if it's stiff from the fridge, so it drizzles thin instead of clumping.",
      "Dust the cinnamon over the top last, from a height, so it settles as an even layer rather than a few dark spots.",
      "Eat soon after cutting, while the apple is still crisp and the honey hasn't fully soaked in."
    ],
    ingredients: [
      { food_id: "mela_it", grams: 150 },
      { food_id: "miele_it", grams: 10 },
      { food_id: "cannella_it", grams: 1 }
    ]
  },
  {
    name: "Pera con noci e miele",
    name_en: "Pear with walnuts and honey",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.6,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: true,
    steps: ["Affetta la pera.", "Aggiungi noci spezzettate e miele."],
    steps_en: [
      "Slice the pear into wedges just before eating, since it browns faster than apple once cut.",
      "Break the walnuts by hand into rough pieces instead of chopping — uneven pieces give a better bite than a fine chop.",
      "Scatter the walnuts over the pear rather than mixing them in, so their crunch stays separate from the pear's softness.",
      "Drizzle the honey last, in a thin stream, so it doesn't pool at the bottom of the plate.",
      "Serve right away: pear releases juice quickly once cut, which thins the honey if it sits too long."
    ],
    ingredients: [
      { food_id: "pera_it", grams: 150 },
      { food_id: "noci_it", grams: 15 },
      { food_id: "miele_it", grams: 10 }
    ]
  },
  {
    name: "Macedonia di mele e pere con noci",
    name_en: "Apple and pear salad with walnuts",
    meal_slot: "colazione", prep_min: 6,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.9,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: true,
    steps: ["Taglia mele e pere a cubetti e condisci con limone.", "Aggiungi le noci."],
    steps_en: [
      "Dice the apple and pear into similar-sized cubes so they mix evenly and cook down at the same rate if you warm them later.",
      "Toss the cubes with the lemon juice right away — this is what keeps both fruits from browning while you finish the rest.",
      "Let it sit a couple of minutes so the lemon coats every piece rather than just the top layer.",
      "Break the walnuts into rough pieces by hand and fold them in last, so they don't turn soft from the fruits' moisture.",
      "Serve within the hour, while the apple still has its crunch against the softer pear."
    ],
    ingredients: [
      { food_id: "mela_it", grams: 100 },
      { food_id: "pera_it", grams: 100 },
      { food_id: "noci_it", grams: 15 },
      { food_id: "limone_it", grams: 5 }
    ]
  },
  {
    name: "Composta di mele e cannella con yogurt",
    name_en: "Apple and cinnamon compote with yogurt",
    meal_slot: "colazione", prep_min: 15,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.4,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Cuoci la mela a cubetti con la cannella finché morbida.", "Servi tiepida sopra lo yogurt."],
    steps_en: [
      "Dice the apple and cook it in a small pot with a splash of water over low heat, so it softens gently instead of catching on high heat.",
      "Add the cinnamon halfway through cooking rather than at the start — added too early it can turn slightly bitter.",
      "Cook until the apple breaks down into a soft, chunky compote, about 10 minutes, stirring occasionally.",
      "Let the compote cool to just warm, not hot, before serving — straight off the stove it would curdle the cold yogurt's surface.",
      "Spoon the warm compote over the cold yogurt rather than mixing them together, so both temperatures and textures stay distinct in each bite."
    ],
    ingredients: [
      { food_id: "mela_it", grams: 150 },
      { food_id: "cannella_it", grams: 1 },
      { food_id: "171284", grams: 150 }
    ]
  },
  {
    name: "Prugne secche con yogurt greco e nocciole",
    name_en: "Prunes with Greek yogurt and hazelnuts",
    meal_slot: "colazione", prep_min: 5,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.5,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: true,
    steps: ["Trita le prugne secche e uniscile allo yogurt greco.", "Aggiungi le nocciole."],
    steps_en: [
      "Chop the prunes into small pieces so their sweetness spreads through the yogurt instead of staying in a few concentrated bites.",
      "Fold them into the Greek yogurt and let it sit a couple of minutes — the yogurt softens the prunes slightly and picks up some of their flavor.",
      "Toast the hazelnuts briefly in a dry pan if you have the time; it makes a real difference against yogurt this thick and plain.",
      "Chop the toasted hazelnuts roughly and scatter them on top last, so they keep their crunch.",
      "Serve straight away, while the hazelnuts are still slightly warm against the cold yogurt."
    ],
    ingredients: [
      { food_id: "168162", grams: 30 },
      { food_id: "171304", grams: 150 },
      { food_id: "nocciole_it", grams: 15 }
    ]
  },
  {
    name: "Yogurt con mirtilli rossi secchi e semi di zucca",
    name_en: "Yogurt with dried cranberries and pumpkin seeds",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.3,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Versa lo yogurt in una ciotola.", "Aggiungi mirtilli rossi secchi e semi di zucca."],
    steps_en: [
      "Spoon the yogurt into a bowl and smooth the surface so the toppings don't slide off to one side.",
      "Scatter the dried cranberries evenly rather than in a pile, since their tartness is stronger than fresh berries and a little goes far.",
      "Toast the pumpkin seeds in a dry pan for extra crunch and flavor, then let them cool before adding.",
      "Add the seeds last, right before eating, so the cold yogurt doesn't soften them.",
      "Eat within a few minutes: the dried cranberries slowly absorb moisture from the yogurt and soften over time."
    ],
    ingredients: [
      { food_id: "171284", grams: 180 },
      { food_id: "171723", grams: 20 },
      { food_id: "semi_zucca_it", grams: 15 }
    ]
  },
  {
    name: "Pane di segale con formaggio fresco e miele",
    name_en: "Rye bread with fresh cheese and honey",
    meal_slot: "colazione", prep_min: 4,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.7,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Spalma il formaggio fresco sul pane.", "Versa il miele sopra."],
    steps_en: [
      "Spread the fresh cheese thickly on the rye bread — it needs the volume to balance the bread's dense, sour crumb.",
      "Smooth the surface with the back of the spoon so the honey doesn't just run off to one side.",
      "Warm the honey briefly if it's thick, so it drizzles rather than clumps on the cheese.",
      "Drizzle it in a thin zigzag rather than a puddle, so no single bite is overly sweet.",
      "Eat soon after assembling, while the cheese is still cold and the honey hasn't fully soaked in."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 55 },
      { food_id: "formaggio_fresco_it", grams: 50 },
      { food_id: "miele_it", grams: 10 }
    ]
  },
  {
    name: "Pane integrale con gouda e pera",
    name_en: "Wholegrain bread with Gouda and pear",
    meal_slot: "colazione", prep_min: 5,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.6,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Affetta la pera sottile.", "Componi il pane con gouda e pera."],
    steps_en: [
      "Slice the pear thin and cut it just before assembling, since it browns fast once exposed to air.",
      "Lay the Gouda on the bread first so it acts as a base the pear won't slide off of.",
      "Fan the pear slices over the cheese, overlapping slightly so every bite has both.",
      "Skip any spread underneath — the cheese and pear together already give enough moisture and fat.",
      "Serve at once: pear's juice starts to seep into the bread within a few minutes of cutting."
    ],
    ingredients: [
      { food_id: "pane_integrale_it", grams: 55 },
      { food_id: "171241", grams: 35 },
      { food_id: "pera_it", grams: 80 }
    ]
  },
  {
    name: "Pane di segale con burro e cetriolo",
    name_en: "Rye bread with butter and cucumber",
    meal_slot: "colazione", prep_min: 5,
    profilo: "europeo-ricco", ha_amido: true, ha_proteina: false,
    tecnica: "semplice", health_score: 7.4,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Spalma il burro sul pane.", "Aggiungi il cetriolo a fette."],
    steps_en: [
      "Slice the cucumber thin and blot the rounds dry with a cloth — this single step is what keeps the bread from turning soggy.",
      "Spread the butter to the edges of the rye bread first; it forms a barrier between the bread and the cucumber's moisture.",
      "Lay the cucumber slices slightly overlapping so the whole surface is covered.",
      "Season with a light pinch of salt directly on the cucumber, right before serving.",
      "Eat immediately — this is a fresh, unstable combination that doesn't hold well even for ten minutes."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 55 },
      { food_id: "burro_it", grams: 8 },
      { food_id: "168409", grams: 60 }
    ]
  },
  {
    name: "Pane nero con salmone affumicato e erba cipollina",
    name_en: "Dark bread with smoked salmon and chives",
    meal_slot: "colazione", prep_min: 5,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 8.2,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Componi il pane con il salmone affumicato.", "Cospargi di erba cipollina e limone."],
    steps_en: [
      "Lay the smoked salmon over the dark bread in loose folds rather than flattened, so it stays tender rather than compressed.",
      "Squeeze a little lemon juice over it just before serving, which brightens the fish without needing any added salt.",
      "Snip the chives with scissors directly onto the salmon, which bruises them less than chopping with a knife.",
      "Skip any spread underneath: the bread's dense crumb and the salmon's own fat are enough together.",
      "Serve cold and eat soon — the lemon starts to firm the salmon's texture the longer it sits."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 50 },
      { food_id: "salmone_affumicato_it", grams: 45 },
      { food_id: "erba_cipollina_it", grams: 3 },
      { food_id: "limone_it", grams: 5 }
    ]
  },
  {
    name: "Panino con uovo e senape",
    name_en: "Egg sandwich with mustard",
    meal_slot: "colazione", prep_min: 10,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.7,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Bollisci l'uovo per 9 minuti e affettalo.", "Componi il panino con senape."],
    steps_en: [
      "Boil the egg 9 minutes, then cool it under running water so the yolk sets fully without darkening at the edge.",
      "Peel and slice the egg rather than mashing it, so its shape stays visible once assembled.",
      "Spread the mustard thinly on the bread first — too much overwhelms the egg's mild flavor rather than lifting it.",
      "Lay the egg slices over the mustard in a single layer so they don't slide out when the sandwich is closed.",
      "Close the sandwich gently and eat soon, before the mustard's moisture starts to soften the bread underneath."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 55 },
      { food_id: "uovo_grande_it", grams: 50 },
      { food_id: "172234", grams: 5 }
    ]
  },
  {
    name: "Toast di segale con funghi trifolati",
    name_en: "Rye toast with sautéed mushrooms",
    meal_slot: "colazione", prep_min: 15,
    profilo: "europeo-leggero", ha_amido: true, ha_proteina: false,
    tecnica: "composta", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Rosola i funghi nel burro con aglio.", "Servi sul pane di segale tostato con prezzemolo."],
    steps_en: [
      "Slice the mushrooms evenly so they cook at the same rate and don't leave some pieces raw while others turn dry.",
      "Heat the butter until it foams before adding the mushrooms — a pan that's not hot enough makes them steam and release water instead of browning.",
      "Cook them undisturbed for the first couple of minutes so they get real color, then stir and add the garlic for the last thirty seconds so it doesn't burn.",
      "Season with salt only once the mushrooms have browned, since salting raw mushrooms draws out water too early and stalls the browning.",
      "Toast the rye bread while the mushrooms finish cooking, so both are hot at the same time.",
      "Spoon the mushrooms onto the toast and scatter the parsley over the top last, so it stays bright rather than wilting from the heat."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 50 },
      { food_id: "funghi_champignon_it", grams: 100 },
      { food_id: "burro_it", grams: 8 },
      { food_id: "prezzemolo_it", grams: 2 },
      { food_id: "169230", grams: 3 }
    ]
  }
];
