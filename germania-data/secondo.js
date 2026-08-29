// germania — secondi (15)
module.exports = [
  {
    name: "Wiener Schnitzel di maiale impanato",
    name_en: "Breaded pork schnitzel",
    meal_slot: "secondo", prep_min: 20,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 7.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Batti la lonza sottile e impanala in farina, uovo e pangrattato.", "Friggi in olio caldo finché dorata."],
    steps_en: [
      "Pound the pork between two sheets of plastic until it's thin and even — an uneven cutlet cooks unevenly, drying out in the thin spots before the thick ones are done.",
      "Set up three shallow dishes: flour, beaten egg, and breadcrumbs, in that order, so the coating builds up in distinct layers rather than clumping.",
      "Coat the cutlet in flour first, shaking off the excess, then egg, then breadcrumbs, pressing gently so the crumbs stick evenly.",
      "Heat the oil until it shimmers before adding the cutlet — oil that isn't hot enough soaks into the crumb instead of crisping it.",
      "Fry for a couple of minutes per side, until deep golden, then check the center reaches 63°C.",
      "Rest it briefly on a rack rather than paper towels, so steam escapes from underneath and the crust stays crisp instead of going soggy."
    ],
    ingredients: [
      { food_id: "168249", grams: 180 },
      { food_id: "farina_00_it", grams: 20 },
      { food_id: "uovo_grande_it", grams: 30 },
      { food_id: "pangrattato_it", grams: 40 },
      { food_id: "olio_semi_vari_it", grams: 15 },
      { food_id: "limone_it", grams: 10 }
    ]
  },
  {
    name: "Schnitzel di pollo alla tedesca",
    name_en: "German-style breaded chicken schnitzel",
    meal_slot: "secondo", prep_min: 18,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 8.2,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Batti il petto di pollo sottile e impanalo in farina, uovo e pangrattato.", "Friggi finché dorato e cotto."],
    steps_en: [
      "Pound the chicken breast between two sheets of plastic to an even thickness, which is what keeps thin edges from drying out before the center is cooked through.",
      "Coat it in flour first, shaking off the excess, then in beaten egg, then in breadcrumbs, pressing gently so the coating holds.",
      "Heat the oil until it shimmers before the cutlet goes in — this is what crisps the crumb instead of letting it absorb oil.",
      "Fry a few minutes per side, until deep golden on both sides.",
      "Check the thickest part reaches 74°C, since chicken needs a higher temperature than pork or beef to be safe.",
      "Rest it on a rack rather than paper towels, so the underside stays crisp instead of steaming soft."
    ],
    ingredients: [
      { food_id: "171077", grams: 180 },
      { food_id: "farina_00_it", grams: 20 },
      { food_id: "uovo_grande_it", grams: 30 },
      { food_id: "pangrattato_it", grams: 40 },
      { food_id: "olio_semi_vari_it", grams: 15 },
      { food_id: "limone_it", grams: 10 }
    ]
  },
  {
    name: "Rouladen di manzo (involtini di manzo tedeschi)",
    name_en: "Rouladen (German beef rolls)",
    meal_slot: "secondo", prep_min: 45,
    profilo: "europeo-brasato", ha_amido: false, ha_proteina: true,
    tecnica: "composta", occasione: "lungo", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Spalma le fette di manzo con senape, speck e cipolla e arrotolale.", "Rosola e cuoci coperto 35 minuti con acqua e concentrato di pomodoro."],
    steps_en: [
      "Pound the beef slices thin and even, so they roll without tearing and cook through evenly once braised.",
      "Spread a thin layer of mustard over each slice first — spread it after rolling and it only ever coats the outside.",
      "Scatter the speck and finely diced onion over the mustard, then roll each slice up snugly and secure with a toothpick or tie it.",
      "Sear the rolls on all sides in a hot pan until deeply browned — this step carries most of the dish's flavor, so don't rush it.",
      "Add the tomato concentrate and enough water to come halfway up the rolls, then cover and braise on low heat for about 35 minutes.",
      "Check the beef is tender enough to cut easily with a fork before serving, and remove the toothpicks first."
    ],
    ingredients: [
      { food_id: "168726", grams: 220 },
      { food_id: "senape_it", grams: 12 },
      { food_id: "speck_it", grams: 30 },
      { food_id: "170000", grams: 60 },
      { food_id: "concentrato_pomodoro_it", grams: 15 }
    ]
  },
  {
    name: "Königsberger Klopse (polpette di vitello in salsa bianca)",
    name_en: "Königsberger Klopse (veal meatballs in white caper sauce)",
    meal_slot: "secondo", prep_min: 25,
    profilo: "europeo-panna", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 7.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Forma le polpette di vitello tritato e lessale nel brodo.", "Prepara una salsa con burro, farina, panna, limone e capperi."],
    steps_en: [
      "Mince the veal finely by hand or have it ground, then mix with a little soaked bread and egg just until combined, so the meatballs stay tender rather than dense.",
      "Shape into small, even balls and poach them gently in barely simmering water or light broth — a rolling boil would break them apart.",
      "Lift the cooked meatballs out once firm and set aside, keeping the poaching liquid for the sauce.",
      "Melt the butter in a separate pan, whisk in the flour, and cook it for a minute before slowly adding the reserved poaching liquid, which is what thickens the sauce smoothly without lumps.",
      "Stir in the cream and simmer gently until it coats a spoon, then finish with the lemon juice and capers off the heat.",
      "Return the meatballs to the sauce just to warm through, and check they reached 63°C for veal at the center before it first came off the heat."
    ],
    ingredients: [
      { food_id: "vitello_magro_it", grams: 200 },
      { food_id: "pane_integrale_it", grams: 20 },
      { food_id: "uovo_grande_it", grams: 30 },
      { food_id: "burro_it", grams: 12 },
      { food_id: "farina_00_it", grams: 12 },
      { food_id: "panna_it", grams: 50 },
      { food_id: "limone_it", grams: 10 },
      { food_id: "capperi_it", grams: 10 }
    ]
  },
  {
    name: "Frikadellen (polpette di carne tedesche)",
    name_en: "Frikadellen (German meat patties)",
    meal_slot: "secondo", prep_min: 22,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 7.8,
    base_amidacea: false, trasportabile: true, salsa_industriale: false,
    contiene_glutine: true, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Ammolla il pane nel latte e mescolalo con carne, uovo, cipolla e maggiorana.", "Forma le polpette schiacciate e rosolale in padella."],
    steps_en: [
      "Soak the bread in the milk until fully softened, then squeeze it lightly and mash it into the meat — this is what keeps the patties moist rather than dense.",
      "Mix the pork, beef, soaked bread, egg, finely diced onion and marjoram together just until combined, since overworking the mixture makes for tougher patties.",
      "Shape into flat, round patties with wet hands, a bit wider and flatter than a typical meatball, which is the traditional Frikadellen shape.",
      "Fry them in a hot pan for several minutes per side, without pressing down on them, so the juices stay inside instead of running out.",
      "Check the center reaches 74°C, since this mix includes ground beef alongside pork.",
      "Rest them a minute on a rack before serving, so the crust stays crisp rather than steaming soft underneath."
    ],
    ingredients: [
      { food_id: "maiale_macinato_magro_it", grams: 120 },
      { food_id: "171796", grams: 100 },
      { food_id: "pane_integrale_it", grams: 30 },
      { food_id: "latte_ps_it", grams: 30 },
      { food_id: "uovo_grande_it", grams: 30 },
      { food_id: "170000", grams: 50 },
      { food_id: "maggiorana_it", grams: 2 }
    ]
  },
  {
    name: "Currywurst (wurstel con salsa al curry)",
    name_en: "Currywurst (German sausage with curry sauce)",
    meal_slot: "secondo", prep_min: 12,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 6.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: true,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Griglia il wurstel a fette.", "Servi con salsa di ketchup e curry in polvere."],
    steps_en: [
      "Score the sausage lightly before cooking, which keeps the skin from splitting unevenly as it heats.",
      "Grill or pan-fry it over medium-high heat, turning often, until the skin is browned and it's heated through.",
      "Check the internal temperature reaches at least 74°C, since this is a precooked sausage that mainly needs reheating and color.",
      "Warm the ketchup gently in a small pan rather than serving it cold, which is how the sauce is traditionally kept smooth.",
      "Stir the curry powder into the warmed ketchup, tasting as you add it, since curry blends vary a lot in strength.",
      "Slice the sausage into rounds and spoon the curry sauce over generously, finishing with an extra light dusting of curry powder on top."
    ],
    ingredients: [
      { food_id: "wurstel_it", grams: 160 },
      { food_id: "168556", grams: 60 },
      { food_id: "curry_it", grams: 4 }
    ]
  },
  {
    name: "Schweinebraten (arrosto di maiale tedesco)",
    name_en: "Schweinebraten (German pork roast)",
    meal_slot: "secondo", prep_min: 40,
    profilo: "europeo-brasato", ha_amido: false, ha_proteina: true,
    tecnica: "composta", occasione: "lungo", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola la lonza intera con cipolla, carota e alloro.", "Cuoci in forno a 180°C per 30 minuti con un po' d'acqua."],
    steps_en: [
      "Sear the pork loin whole on all sides in a hot pan first — this single step does more for the final flavor than any amount of extra oven time.",
      "Transfer it to a baking dish with the roughly chopped onion, carrot and bay leaf scattered around, plus a splash of water in the bottom.",
      "Roast at 180°C for about 30 minutes, basting once halfway through with the pan juices so the surface doesn't dry out.",
      "Check the center reaches 63°C on a thermometer — pork this lean overcooks easily past that point.",
      "Rest the roast for at least five minutes before slicing, so the juices redistribute instead of running out onto the board.",
      "Strain the pan juices and vegetables into a simple gravy while the meat rests, then slice against the grain and serve with it spooned over."
    ],
    ingredients: [
      { food_id: "168249", grams: 250 },
      { food_id: "170000", grams: 60 },
      { food_id: "170393", grams: 60 },
      { food_id: "170917", grams: 1 }
    ]
  },
  {
    name: "Bratwurst alla griglia con senape",
    name_en: "Grilled Bratwurst with mustard",
    meal_slot: "secondo", prep_min: 12,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 6.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Griglia il wurstel finché dorato.", "Servi con senape a parte."],
    steps_en: [
      "Score the sausage lightly along its length, which keeps the skin from splitting unevenly on the grill.",
      "Grill it over medium heat, turning every couple of minutes, rather than high heat, which would burn the skin before the inside heats through.",
      "Cook until the skin is browned all over and the center reaches at least 74°C.",
      "Let it rest for a minute off the grill, which is enough time for the juices to settle without the skin going cold.",
      "Serve the mustard on the side rather than over the sausage, so its sharpness stays distinct in every bite.",
      "Eat it hot, straight off the grill, while the skin still has some snap."
    ],
    ingredients: [
      { food_id: "wurstel_it", grams: 160 },
      { food_id: "senape_it", grams: 15 }
    ]
  },
  {
    name: "Kasseler (lonza di maiale in crosta di paprika) con crauti",
    name_en: "Kasseler-style pork loin with paprika, and sauerkraut",
    meal_slot: "secondo", prep_min: 22,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 7.8,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Cospargi la lonza di paprika e rosolala.", "Scalda i crauti nella stessa padella e servi insieme."],
    steps_en: [
      "Pat the pork loin dry and rub it all over with the paprika — a dry surface is what lets the spice form a real crust instead of just coating wet meat.",
      "Sear it in a hot pan for a few minutes per side until the crust is deep red-brown and the pan has picked up plenty of fond.",
      "Lower the heat and finish cooking until the center reaches 63°C, then lift the pork out to rest.",
      "Add the sauerkraut directly to the same pan, off the highest heat, so it picks up the browned bits left behind.",
      "Warm the sauerkraut through for a few minutes, stirring occasionally, without letting it dry out.",
      "Slice the rested pork and serve it over the warmed sauerkraut, spooning any resting juices back over the top."
    ],
    ingredients: [
      { food_id: "168249", grams: 200 },
      { food_id: "171329", grams: 4 },
      { food_id: "169279", grams: 150 },
      { food_id: "171413", grams: 8 }
    ]
  },
  {
    name: "Labskaus (spezzatino di manzo, patate e barbabietola)",
    name_en: "Labskaus (German beef, potato and beetroot hash)",
    meal_slot: "secondo", prep_min: 25,
    profilo: "neutro", ha_amido: true, ha_proteina: true,
    tecnica: "composta", health_score: 7.6,
    base_amidacea: true, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola il manzo macinato con cipolla, aggiungi patate e barbabietola a cubetti.", "Servi con uovo fritto e aringa."],
    steps_en: [
      "Brown the ground beef in a hot pan with the diced onion, breaking it up as it cooks, until no pink remains.",
      "Add the diced potato and beetroot along with a splash of water, then cover and cook over low heat for about 15 minutes, until both vegetables are tender.",
      "Mash the mixture roughly with a fork or the back of a spoon — Labskaus is traditionally a coarse, mashed-together hash, not distinct pieces.",
      "Check the beef has reached 74°C and the vegetables have softened fully before taking it off the heat.",
      "Fry an egg separately, sunny-side up, while the hash finishes — the runny yolk is meant to be stirred through at the table.",
      "Serve the hash topped with the fried egg and the herring alongside, the traditional northern German garnish."
    ],
    ingredients: [
      { food_id: "171796", grams: 150 },
      { food_id: "170000", grams: 50 },
      { food_id: "170028", grams: 150 },
      { food_id: "barbabietola_australiana_it", grams: 80 },
      { food_id: "uovo_grande_it", grams: 50 },
      { food_id: "aringa_it", grams: 30 }
    ]
  },
  {
    name: "Rindergulasch (gulasch di manzo tedesco)",
    name_en: "Rindergulasch (German beef goulash)",
    meal_slot: "secondo", prep_min: 45,
    profilo: "europeo-brasato", ha_amido: false, ha_proteina: true,
    tecnica: "composta", occasione: "lungo", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Rosola il manzo a cubetti con le cipolle, aggiungi la paprika.", "Copri d'acqua e cuoci coperto 35 minuti finché tenero."],
    steps_en: [
      "Cut the beef into even chunks and brown them hard in batches — a crowded pan steams the meat grey instead of browning it, and browning here is most of the flavor.",
      "Once all the beef is browned, soften the sliced onions in the same pot, letting them pick up the fond left behind.",
      "Take the pot off the heat before stirring in the paprika, then return the meat and add water to almost cover — paprika scorches and turns bitter if added directly over high heat.",
      "Add the tomato concentrate, then bring to a bare simmer, cover, and lower the heat right down.",
      "Cook gently for about 35 minutes, until the beef pulls apart easily with a fork.",
      "Season with salt near the end, once the stew has reduced and the flavors have concentrated."
    ],
    ingredients: [
      { food_id: "168653", grams: 250 },
      { food_id: "170000", grams: 150 },
      { food_id: "171329", grams: 6 },
      { food_id: "concentrato_pomodoro_it", grams: 15 }
    ]
  },
  {
    name: "Jägerschnitzel (scaloppina di maiale ai funghi)",
    name_en: "Jägerschnitzel (German pork cutlet with mushroom sauce)",
    meal_slot: "secondo", prep_min: 22,
    profilo: "europeo-panna", ha_amido: false, ha_proteina: true,
    tecnica: "composta", health_score: 7.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: true, contiene_frutta_secca: false,
    steps: ["Rosola la lonza sottile e tienila da parte.", "Salta i funghi e la cipolla, sfuma con panna e rimetti la carne."],
    steps_en: [
      "Pound the pork thin and even, unlike a breaded schnitzel this one stays uncoated, so the surface needs to be dry for a real sear.",
      "Sear it in a hot pan for a couple of minutes per side until golden and just cooked through, then lift it out to rest.",
      "Sear the mushrooms in the same pan without crowding, so they brown in the meat's leftover fat instead of steaming.",
      "Add the onion once the mushrooms have colored, cooking a further couple of minutes until soft.",
      "Pour in the cream, scraping up the browned bits from the bottom, and simmer until it thickens slightly.",
      "Slide the pork back in just to warm through and check it reached 63°C before it first came off the heat."
    ],
    ingredients: [
      { food_id: "168249", grams: 180 },
      { food_id: "funghi_champignon_it", grams: 150 },
      { food_id: "170000", grams: 40 },
      { food_id: "panna_it", grams: 50 }
    ]
  },
  {
    name: "Bockwurst con crauti e senape",
    name_en: "Bockwurst with sauerkraut and mustard",
    meal_slot: "secondo", prep_min: 18,
    profilo: "europeo-aceto", ha_amido: false, ha_proteina: true,
    tecnica: "semplice", health_score: 6.9,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Scalda il wurstel di manzo in acqua calda senza bollire.", "Servi con crauti scaldati e senape."],
    steps_en: [
      "Heat a pot of water until it's steaming but not bubbling — a rolling boil is what splits a Bockwurst's delicate casing.",
      "Slide the sausage in and let it sit in the hot water for about 8 minutes, just to heat through gently.",
      "Check the internal temperature reaches at least 74°C before lifting it out, since it's a precooked sausage that mainly needs reheating.",
      "Warm the sauerkraut in a separate pan over medium heat for a few minutes while the sausage poaches.",
      "Drain the sausage well so it doesn't dilute the sauerkraut with extra water.",
      "Serve them together with the mustard on the side, so its sharpness stays distinct."
    ],
    ingredients: [
      { food_id: "173862", grams: 160 },
      { food_id: "169279", grams: 150 },
      { food_id: "senape_it", grams: 12 }
    ]
  },
  {
    name: "Leberkäse al forno con senape",
    name_en: "Baked Leberkäse with mustard",
    meal_slot: "secondo", prep_min: 40,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", occasione: "lungo", health_score: 7.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Frulla la carne finemente con uovo, maggiorana e noce moscata.", "Cuoci in forno a 180°C per 35 minuti finché compatto."],
    steps_en: [
      "Blend or process the beef and pork together until very fine and smooth — this is what gives Leberkäse its distinctive dense, uniform texture, unlike a coarser meatloaf.",
      "Mix in the egg, marjoram, nutmeg and a pinch of salt thoroughly, since the seasoning needs to spread evenly through such a fine mixture.",
      "Press it firmly into a loaf tin, smoothing the top so it bakes into a single compact block without air pockets.",
      "Bake at 180°C for about 35 minutes, until the top turns deep golden brown and slightly crackled.",
      "Check the center reaches 74°C on a thermometer before taking it out.",
      "Let it rest for at least five minutes before slicing thickly, and serve with the mustard on the side."
    ],
    ingredients: [
      { food_id: "171796", grams: 150 },
      { food_id: "maiale_macinato_magro_it", grams: 120 },
      { food_id: "uovo_grande_it", grams: 30 },
      { food_id: "maggiorana_it", grams: 2 },
      { food_id: "noce_moscata_it", grams: 1 },
      { food_id: "senape_it", grams: 10 }
    ]
  },
  {
    name: "Schweinshaxe al forno (stinco di maiale al forno)",
    name_en: "Schweinshaxe (German roasted pork knuckle)",
    meal_slot: "secondo", prep_min: 60,
    profilo: "neutro", ha_amido: false, ha_proteina: true,
    tecnica: "composta", occasione: "lungo", health_score: 7.7,
    base_amidacea: false, trasportabile: false, salsa_industriale: false,
    contiene_glutine: false, contiene_lattosio: false, contiene_frutta_secca: false,
    steps: ["Incidi la cotenna dello stinco e cospargi di cumino.", "Cuoci in forno a 160°C per 50 minuti, poi ad alta temperatura per rendere croccante."],
    steps_en: [
      "Score the skin of the knuckle in a crosshatch pattern, cutting through the fat but not into the meat — this is what lets the skin crackle instead of just turning chewy.",
      "Rub it all over with the caraway seeds and a little salt, working the seasoning into the scored cuts.",
      "Roast at 160°C with the sliced onion underneath for about 50 minutes, basting occasionally with the pan juices.",
      "Check the center reaches 63°C, then raise the oven to its highest setting for a final 10 minutes to crisp the skin.",
      "Watch closely in this last stage — the skin can go from crackling to burnt quickly at high heat.",
      "Rest for at least five minutes before serving, so the juices settle before the knuckle is cut."
    ],
    ingredients: [
      { food_id: "169157", grams: 350 },
      { food_id: "170923", grams: 3 },
      { food_id: "170000", grams: 60 }
    ]
  }
];
