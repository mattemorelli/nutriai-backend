// centro_nord_generico — spuntini (25)
module.exports = [
  {
    name: "Mela con formaggio fresco",
    name_en: "Apple with fresh cheese",
    meal_slot: "spuntino", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.3,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Taglia la mela a spicchi.", "Servi con il formaggio fresco a parte."],
    steps_en: [
      "Core the apple and cut it into wedges just before eating, so the flesh doesn't have time to brown.",
      "Spoon the fresh cheese into a small container alongside rather than spreading it on the apple, so the wedges stay crisp until dipped.",
      "Dip each wedge just before biting, since the cheese doesn't cling well if left sitting on the fruit.",
      "Pack it in two separate containers if taking it on the go, for the same reason.",
      "Eat within an hour of cutting, while the apple still has its full crunch."
    ],
    ingredients: [
      { food_id: "mela_it", grams: 150 },
      { food_id: "formaggio_fresco_it", grams: 60 }
    ]
  },
  {
    name: "Pera con gouda a cubetti",
    name_en: "Pear with Gouda cubes",
    meal_slot: "spuntino", prep_min: 5,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 7.6,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Taglia la pera e il gouda a cubetti.", "Servili insieme."],
    steps_en: [
      "Cut the pear into cubes just before eating, since it browns faster than apple once exposed to air.",
      "Cut the Gouda into cubes of a similar size, so each bite has a balance of both.",
      "Alternate a piece of pear with a piece of cheese rather than eating them separately, for the classic sweet-savory pairing.",
      "Pack them in one container if it's for later — unlike apple, pear cut this size holds up reasonably well for an hour or two.",
      "Eat at room temperature rather than icy cold, which is when the cheese's flavor comes through best."
    ],
    ingredients: [
      { food_id: "pera_it", grams: 120 },
      { food_id: "171241", grams: 40 }
    ]
  },
  {
    name: "Carote e sedano con yogurt",
    name_en: "Carrot and celery sticks with yogurt",
    meal_slot: "spuntino", prep_min: 8,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.7,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Taglia carote e sedano a bastoncini.", "Servili con lo yogurt come salsa."],
    steps_en: [
      "Cut the carrot and celery into even sticks of finger length, thick enough to hold up to dipping without snapping.",
      "Stir a small pinch of salt into the yogurt, which brings out its flavor far more than dipping into it plain.",
      "Keep the yogurt in a small separate container so the sticks stay crisp instead of getting soggy sitting in it.",
      "Dip each stick just before eating rather than coating them all in advance.",
      "Pack it this way if taking it out, and it holds well for several hours."
    ],
    ingredients: [
      { food_id: "170393", grams: 100 },
      { food_id: "sedano_it", grams: 80 },
      { food_id: "171284", grams: 60 }
    ]
  },
  {
    name: "Cetriolo con formaggio fresco",
    name_en: "Cucumber with fresh cheese",
    meal_slot: "spuntino", prep_min: 5,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.2,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Taglia il cetriolo a bastoncini.", "Servi con il formaggio fresco per intingere."],
    steps_en: [
      "Cut the cucumber into thick sticks, sturdy enough to scoop up the cheese without bending.",
      "Season the fresh cheese with a small pinch of salt, which makes a real difference against the cucumber's mild flavor.",
      "Keep the cheese in a separate small container so the cucumber sticks don't sit in moisture and turn soft.",
      "Dip each stick just before eating for the best contrast between crisp and creamy.",
      "Eat within a couple of hours of cutting, while the cucumber is still fully crisp."
    ],
    ingredients: [
      { food_id: "168409", grams: 150 },
      { food_id: "formaggio_fresco_it", grams: 50 }
    ]
  },
  {
    name: "Ravanelli con burro e sale",
    name_en: "Radishes with butter and salt",
    meal_slot: "spuntino", prep_min: 4,
    profilo: "europeo-burro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 7.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Lascia il burro ammorbidire a temperatura ambiente.", "Intingi i ravanelli nel burro e nel sale."],
    steps_en: [
      "Let the butter soften at room temperature first — cold, hard butter won't coat the radishes properly.",
      "Trim the radishes but leave a little stem on each, which gives something to hold onto while dipping.",
      "Spread a thin layer of butter on each radish rather than dunking it whole, so it doesn't end up with an uneven, thick coating.",
      "Sprinkle a little salt directly onto the buttered radish just before biting, since it doesn't cling well once sitting for long.",
      "Eat immediately after buttering — this is a fresh, simple snack that doesn't keep well made ahead."
    ],
    ingredients: [
      { food_id: "ravanelli_it", grams: 150 },
      { food_id: "burro_it", grams: 15 }
    ]
  },
  {
    name: "Noci e miele",
    name_en: "Walnuts and honey",
    meal_slot: "spuntino", prep_min: 3,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 7.9,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: true,
    steps: ["Metti le noci in una ciotola.", "Versa il miele sopra."],
    steps_en: [
      "Break the walnuts into rough halves by hand rather than leaving them whole, so the honey has more surface to cling to.",
      "Warm the honey for a few seconds if it's thick and cold, so it drizzles rather than clumps.",
      "Drizzle it over the walnuts in a thin stream, tossing gently so every piece gets some.",
      "Let it sit a minute so the honey settles into the walnuts' crevices before eating.",
      "Eat soon after mixing; left too long, the honey pools at the bottom rather than staying on the nuts."
    ],
    ingredients: [
      { food_id: "noci_it", grams: 30 },
      { food_id: "miele_it", grams: 10 }
    ]
  },
  {
    name: "Nocciole tostate",
    name_en: "Roasted hazelnuts",
    meal_slot: "spuntino", prep_min: 10,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 7.8,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: true,
    steps: ["Tosta le nocciole in padella o forno.", "Lasciale raffreddare prima di servire."],
    steps_en: [
      "Spread the hazelnuts in a single layer in a dry pan or on a tray, so heat reaches all of them evenly.",
      "Toast over medium heat, or in the oven at 180°C, for about 8 minutes, shaking or stirring halfway through.",
      "Watch closely near the end — hazelnuts go from perfectly toasted to burnt within a minute once they start browning.",
      "They're ready when the skins start to crack and the smell turns noticeably nuttier.",
      "Let them cool fully before eating; they're much crunchier once cooled than straight out of the pan.",
      "Rub them in a cloth if you want to remove the loose, bitter skins, though it's not essential."
    ],
    ingredients: [
      { food_id: "nocciole_it", grams: 30 }
    ]
  },
  {
    name: "Semi di zucca tostati",
    name_en: "Roasted pumpkin seeds",
    meal_slot: "spuntino", prep_min: 10,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.1,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Tosta i semi di zucca in padella a secco.", "Lasciali raffreddare."],
    steps_en: [
      "Spread the pumpkin seeds in a single layer in a dry pan, without any oil.",
      "Toast over medium heat, shaking the pan often, for about 5 minutes, until they start to pop and turn golden.",
      "Watch them closely once they start popping — this is the point they can burn quickly if left unattended.",
      "Season with a small pinch of salt while still warm, so it sticks to the surface.",
      "Let them cool fully before eating, since they crisp up further as they cool.",
      "Store any leftovers in a sealed container, where they stay crunchy for a few days."
    ],
    ingredients: [
      { food_id: "semi_zucca_it", grams: 30 }
    ]
  },
  {
    name: "Prugne secche e noci",
    name_en: "Prunes and walnuts",
    meal_slot: "spuntino", prep_min: 3,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 7.9,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: true,
    steps: ["Metti le prugne secche e le noci in una ciotola.", "Servi insieme."],
    steps_en: [
      "Leave the prunes whole rather than chopping them, so they stay chewy against the crunch of the walnuts.",
      "Break the walnuts into rough pieces by hand for a better contrast in size against the prunes.",
      "Mix them in a small bowl or container just before eating.",
      "This combination travels well, since neither ingredient needs refrigeration for a few hours.",
      "Eat slowly — the prunes are dense and filling in a small portion."
    ],
    ingredients: [
      { food_id: "168162", grams: 40 },
      { food_id: "noci_it", grams: 20 }
    ]
  },
  {
    name: "Mirtilli rossi secchi e semi di girasole",
    name_en: "Dried cranberries and sunflower seeds",
    meal_slot: "spuntino", prep_min: 3,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 7.7,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Mescola i mirtilli rossi secchi con i semi di girasole.", "Servi in una ciotolina."],
    steps_en: [
      "Toast the sunflower seeds briefly in a dry pan if you have a spare minute, which improves their flavor noticeably over raw.",
      "Let the seeds cool fully before mixing them with the dried cranberries, or the warmth softens the fruit slightly.",
      "Combine them in a small bowl or container in roughly equal parts by volume.",
      "This mix keeps well for several days in a sealed container, unlike fresh fruit snacks.",
      "Eat it in small handfuls — dried fruit is concentrated in sugar, so a little goes a long way."
    ],
    ingredients: [
      { food_id: "171723", grams: 30 },
      { food_id: "semi_girasole_it", grams: 20 }
    ]
  },
  {
    name: "Yogurt greco con miele",
    name_en: "Greek yogurt with honey",
    meal_slot: "spuntino", prep_min: 3,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.5,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Versa lo yogurt greco in una ciotola.", "Aggiungi il miele a filo."],
    steps_en: [
      "Spoon the yogurt into a bowl and smooth the surface, so the honey doesn't run off unevenly to one side.",
      "Warm the honey briefly if it's thick from the fridge, so it drizzles in a thin ribbon rather than clumping.",
      "Pour it over in a zigzag rather than a puddle, so no single spoonful is overly sweet.",
      "Let it sit a minute before eating, so the honey settles slightly into the yogurt's surface.",
      "Eat soon after preparing — this snack isn't meant to be stored once assembled."
    ],
    ingredients: [
      { food_id: "171304", grams: 150 },
      { food_id: "miele_it", grams: 12 }
    ]
  },
  {
    name: "Kefir con cannella",
    name_en: "Kefir with cinnamon",
    meal_slot: "spuntino", prep_min: 3,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.5,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Versa il kefir in un bicchiere.", "Cospargi di cannella."],
    steps_en: [
      "Give the kefir a quick stir or shake before pouring, since its solids tend to settle at the bottom of the container.",
      "Pour it into a glass rather than a bowl, since it's thin enough to drink straight.",
      "Dust the cinnamon over the top from a height, so it settles in an even layer rather than a few dark clumps.",
      "Stir once, gently, just enough to distribute the cinnamon without losing the kefir's natural fizz.",
      "Drink it soon after pouring — kefir's tang grows sharper the longer it sits at room temperature."
    ],
    ingredients: [
      { food_id: "kefir_it", grams: 200 },
      { food_id: "cannella_it", grams: 1 }
    ]
  },
  {
    name: "Bicchiere di latticello con mirtilli rossi secchi",
    name_en: "Buttermilk with dried cranberries",
    meal_slot: "spuntino", prep_min: 3,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.1,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Versa il latticello in un bicchiere.", "Aggiungi i mirtilli rossi secchi."],
    steps_en: [
      "Shake or stir the buttermilk before pouring, since its solids settle at the bottom of the container.",
      "Pour it into a glass and add the dried cranberries, which sink slowly and can be eaten with a spoon at the end.",
      "Let it sit a minute so the cranberries soften slightly in the buttermilk before drinking.",
      "Give it one more stir just before drinking, to distribute the fruit through the liquid.",
      "Drink chilled — buttermilk's refreshing tang fades once it warms to room temperature."
    ],
    ingredients: [
      { food_id: "latticello_it", grams: 200 },
      { food_id: "171723", grams: 20 }
    ]
  },
  {
    name: "Uovo sodo con sale",
    name_en: "Boiled egg with salt",
    meal_slot: "spuntino", prep_min: 10,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 7.8,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Bollisci l'uovo per 9 minuti.", "Sbucciato, servi con un pizzico di sale."],
    steps_en: [
      "Lower the egg into already-simmering water so you can time it precisely from the moment it goes in.",
      "Cook for 9 minutes for a yolk that's fully set but still moist, not chalky, at the center.",
      "Cool it immediately under running water, which stops the cooking and prevents a green ring forming around the yolk.",
      "Peel it starting from the wider end, where the air pocket makes the shell come away more easily.",
      "Season with a small pinch of salt just before eating, since salt sprinkled ahead doesn't stick as evenly.",
      "This snack travels well shelled or unshelled and needs no refrigeration for a few hours."
    ],
    ingredients: [
      { food_id: "uovo_grande_it", grams: 50 }
    ]
  },
  {
    name: "Cubetti di pane di segale ed emmental",
    name_en: "Rye bread and Emmental bites",
    meal_slot: "spuntino", prep_min: 5,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "semplice", health_score: 7.3,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Taglia pane e emmental a cubetti.", "Servili insieme, magari infilzati su uno stuzzicadenti."],
    steps_en: [
      "Cut the rye bread into small, bite-sized cubes rather than slices, so it can be eaten alongside the cheese in one go.",
      "Cut the Emmental into cubes of a similar size, so the proportion of bread to cheese stays balanced in each bite.",
      "Skewer a piece of each onto a toothpick if serving to others, which also keeps the bread from drying out as fast.",
      "Pack them in a sealed container if taking them out, keeping the bread and cheese touching so the cheese doesn't dry at the edges.",
      "Eat within a few hours for the best texture on the bread."
    ],
    ingredients: [
      { food_id: "pane_segale_it", grams: 40 },
      { food_id: "emmental_it", grams: 40 }
    ]
  },
  {
    name: "Gouda a cubetti con noci",
    name_en: "Gouda cubes with walnuts",
    meal_slot: "spuntino", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 7.4,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: true,
    steps: ["Taglia il gouda a cubetti.", "Servi con le noci."],
    steps_en: [
      "Cut the Gouda into even cubes, small enough to eat in one bite alongside a walnut half.",
      "Break the walnuts into halves or large pieces by hand rather than chopping them small.",
      "Arrange the cheese and walnuts together in a small bowl or container.",
      "This snack keeps well for a few hours without refrigeration, unlike softer cheeses.",
      "Eat them together, alternating a piece of cheese with a walnut, for the classic pairing."
    ],
    ingredients: [
      { food_id: "171241", grams: 50 },
      { food_id: "noci_it", grams: 20 }
    ]
  },
  {
    name: "Bastoncini di cetriolo e carota con formaggio fresco",
    name_en: "Cucumber and carrot sticks with fresh cheese",
    meal_slot: "spuntino", prep_min: 8,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.4,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Taglia cetriolo e carota a bastoncini.", "Servili con il formaggio fresco per intingere."],
    steps_en: [
      "Cut the cucumber and carrot into sticks of similar length and thickness, sturdy enough to scoop up the cheese.",
      "Season the fresh cheese with a small pinch of salt, which makes it far more interesting as a dip.",
      "Keep the cheese in its own small container, separate from the vegetable sticks, so they stay crisp.",
      "Dip each stick just before eating rather than coating them all ahead of time.",
      "This combination packs well for a few hours away from the fridge, as long as the dip stays covered."
    ],
    ingredients: [
      { food_id: "168409", grams: 100 },
      { food_id: "170393", grams: 80 },
      { food_id: "formaggio_fresco_it", grams: 50 }
    ]
  },
  {
    name: "Formaggio fresco con erba cipollina",
    name_en: "Fresh cheese with chives",
    meal_slot: "spuntino", prep_min: 4,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Mescola il formaggio fresco con l'erba cipollina.", "Servi in una ciotolina."],
    steps_en: [
      "Snip the chives with scissors rather than chopping with a knife, which bruises them less and keeps their color.",
      "Stir them into the fresh cheese along with a small pinch of salt, mixing just enough to distribute evenly.",
      "Let it sit a couple of minutes before eating, so the chives' flavor spreads through the cheese.",
      "Serve in a small bowl on its own, or alongside a few vegetable sticks if you have them.",
      "Eat the same day it's mixed, since the chives lose their brightness after a day in the fridge."
    ],
    ingredients: [
      { food_id: "formaggio_fresco_it", grams: 100 },
      { food_id: "erba_cipollina_it", grams: 5 }
    ]
  },
  {
    name: "Mela a fette con cannella",
    name_en: "Sliced apple with cinnamon",
    meal_slot: "spuntino", prep_min: 3,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.9,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Affetta la mela.", "Cospargi di cannella."],
    steps_en: [
      "Core the apple and slice it into even wedges, cutting close to the time you'll eat it so it doesn't brown.",
      "Fan the slices out rather than stacking them, so the cinnamon reaches every piece.",
      "Dust the cinnamon over from a height, letting it settle as an even layer rather than a few dark spots.",
      "Eat soon after cutting, while the apple still has its full crunch.",
      "Pack it with a squeeze of lemon tossed through if preparing ahead, to slow the browning."
    ],
    ingredients: [
      { food_id: "mela_it", grams: 150 },
      { food_id: "cannella_it", grams: 1 }
    ]
  },
  {
    name: "Pera e noci",
    name_en: "Pear and walnuts",
    meal_slot: "spuntino", prep_min: 3,
    profilo: "neutro", ha_amido: false, ha_proteina: false,
    tecnica: "semplice", health_score: 8.5,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: true,
    steps: ["Affetta la pera.", "Servi con le noci."],
    steps_en: [
      "Slice the pear into wedges just before eating, since it browns faster than apple once cut.",
      "Break the walnuts by hand into rough pieces instead of chopping them.",
      "Arrange them together in a small container, keeping the pear slices from touching each other too much to slow browning.",
      "Eat within the hour for the best texture on the pear.",
      "This is a good pairing to take along, since walnuts need no special handling."
    ],
    ingredients: [
      { food_id: "pera_it", grams: 150 },
      { food_id: "noci_it", grams: 20 }
    ]
  },
  {
    name: "Semi di zucca e semi di girasole tostati",
    name_en: "Roasted pumpkin and sunflower seed mix",
    meal_slot: "spuntino", prep_min: 10,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Tosta i semi insieme in padella a secco.", "Lasciali raffreddare."],
    steps_en: [
      "Spread both types of seeds together in a single layer in a dry pan, without any oil.",
      "Toast over medium heat, shaking the pan often, for about 5 minutes until the pumpkin seeds start to pop.",
      "Watch closely once they start popping, since both seeds can go from toasted to burnt within a minute.",
      "Season with a small pinch of salt while still warm, so it sticks to the surface.",
      "Let them cool fully before eating — they crisp up further as they cool.",
      "Store any extra in a sealed container, where the mix stays crunchy for several days."
    ],
    ingredients: [
      { food_id: "semi_zucca_it", grams: 20 },
      { food_id: "semi_girasole_it", grams: 20 }
    ]
  },
  {
    name: "Yogurt magro con semi di lino",
    name_en: "Low-fat yogurt with flax seeds",
    meal_slot: "spuntino", prep_min: 3,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.4,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Versa lo yogurt magro in una ciotola.", "Aggiungi i semi di lino."],
    steps_en: [
      "Grind the flax seeds coarsely before adding them, if you can — whole seeds pass through mostly undigested, so cracking them is what makes them count.",
      "Spoon the yogurt into a bowl and smooth the surface first.",
      "Stir the ground flax through evenly, rather than just sprinkling it on top, so every spoonful gets some.",
      "Let it sit a minute before eating, since the flax slightly thickens the yogurt as it absorbs a little moisture.",
      "Eat soon after mixing, since the texture keeps changing the longer it sits."
    ],
    ingredients: [
      { food_id: "yogurt_magro_it", grams: 150 },
      { food_id: "semi_lino_it", grams: 10 }
    ]
  },
  {
    name: "Formaggio fresco con ravanelli e erba cipollina",
    name_en: "Fresh cheese with radishes and chives",
    meal_slot: "spuntino", prep_min: 6,
    profilo: "europeo-erbe", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.0,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Affetta i ravanelli sottili.", "Mescolali al formaggio fresco con l'erba cipollina."],
    steps_en: [
      "Slice the radishes thin, since thick pieces stay too sharp against the mild cheese.",
      "Snip the chives with scissors directly into the cheese, which bruises them less than chopping with a knife.",
      "Stir the radishes and chives into the fresh cheese along with a small pinch of salt.",
      "Let it sit a couple of minutes so the flavors start to blend before eating.",
      "Eat the same day it's mixed — the radish releases water over time and thins the cheese out."
    ],
    ingredients: [
      { food_id: "formaggio_fresco_it", grams: 100 },
      { food_id: "ravanelli_it", grams: 50 },
      { food_id: "erba_cipollina_it", grams: 4 }
    ]
  },
  {
    name: "Uovo sodo con senape",
    name_en: "Boiled egg with mustard",
    meal_slot: "spuntino", prep_min: 10,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 7.7,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Bollisci l'uovo per 9 minuti e sbuccialo.", "Servi con un filo di senape."],
    steps_en: [
      "Lower the egg into simmering water and cook for 9 minutes for a fully set yolk that still slices cleanly.",
      "Cool it immediately under running water, which stops the cooking and keeps the yolk from darkening at the edge.",
      "Peel it starting from the wider end, where the air pocket helps the shell lift away.",
      "Halve the egg and spoon a small amount of mustard directly onto the yolk, rather than mixing it in.",
      "Eat right away, while the mustard is still sharp rather than having soaked into the egg."
    ],
    ingredients: [
      { food_id: "uovo_grande_it", grams: 50 },
      { food_id: "senape_it", grams: 8 }
    ]
  },
  {
    name: "Prugne secche con yogurt magro",
    name_en: "Prunes with low-fat yogurt",
    meal_slot: "spuntino", prep_min: 4,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 8.3,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Trita grossolanamente le prugne secche.", "Uniscile allo yogurt magro."],
    steps_en: [
      "Chop the prunes into small pieces so their sweetness spreads through the yogurt rather than staying in a few concentrated bites.",
      "Fold them into the yogurt and let it sit a couple of minutes, so the yogurt softens the prunes slightly.",
      "Stir once more just before eating, since the prunes tend to sink toward the bottom.",
      "Eat within an hour of mixing, while the contrast between the soft prune and the cool yogurt is still clear.",
      "Skip any added sugar — the prunes are naturally sweet enough on their own."
    ],
    ingredients: [
      { food_id: "168162", grams: 35 },
      { food_id: "yogurt_magro_it", grams: 150 }
    ]
  }
];
