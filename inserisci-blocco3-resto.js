// F0bis, blocco 3/4 — completamento: i 2 piatti che non erano stati
// inseriti nel run precedente (fetch fallito a meta').
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const COMUNE = {
  meal_slot: 'secondo', profilo: 'asiatico-sudest', famiglia: 'asiatica',
  paese: 'asia_generico', tecnica: 'semplice', ha_proteina: true, ha_amido: false,
  cucina: 'asiatica', occasione: 'quotidiano', base_amidacea: false,
  trasportabile: true, salsa_industriale: false,
};

const PIATTI = [
  {
    name: 'Mung beans with lime, ginger and coriander',
    name_it: 'Fagioli mung al lime, zenzero e coriandolo',
    prep_min: 18, health_score: 8.5,
    ingredienti: [
      ['fagioli_mung_cotti_it', 200], ['170393', 120], ['fagiolini_it', 100], ['cipollotto_it', 50],
      ['zenzero_it', 10], ['169230', 5], ['lime_sudam_it', 30], ['salsa_soia_it', 12],
      ['olio_arachide_it', 12], ['coriandolo_it', 12], ['menta_it', 6],
    ],
    steps: [
      'Scotta carote e fagiolini insieme, poi raffreddali sotto acqua corrente.',
      'Salta zenzero e aglio, aggiungi carote, fagiolini e fagioli mung con la salsa di soia.',
      'Spegni e condisci con lime, cipollotto, coriandolo e menta spezzettata.',
    ],
    steps_en: [
      'Cut the carrots into thin batons and the green beans into three.',
      'Blanch them together for 4 minutes in boiling water, then drain and cool under running water to stop the cooking.',
      'Heat 8 g of oil in a wok over high heat, add the chopped ginger and garlic and stir-fry for 30 seconds.',
      'Add the carrots, green beans and rinsed mung beans, raise the heat and stir-fry for 3 minutes with the soy sauce.',
      'Take off the heat and dress with lime juice, the remaining oil, sliced spring onion, coriander and hand-torn mint.',
    ],
  },
  {
    name: 'Stir-fried soybeans with peppers, lime and cashews',
    name_it: 'Soia gialla saltata al lime con peperoni e anacardi',
    prep_min: 20, health_score: 8.9,
    ingredienti: [
      ['soia_gialla_cotta_it', 180], ['peperone_rosso_it', 150], ['cipollotto_it', 50], ['anacardi_it', 30],
      ['169230', 5], ['zenzero_it', 8], ['lime_sudam_it', 30], ['salsa_soia_it', 12],
      ['olio_arachide_it', 12], ['basilico_thai_it', 8], ['peperoncino_it', 3],
    ],
    steps: [
      'Tosta gli anacardi a secco e tienili da parte.',
      'Salta aglio, zenzero e peperoncino, poi il peperone, poi la soia con la salsa di soia.',
      'Spegni e aggiungi lime, cipollotto, basilico thai e anacardi: il basilico va a fuoco spento, cotto perde il profumo.',
    ],
    steps_en: [
      'Toast the cashews in a dry pan for 3 minutes over medium heat, moving them often, and set aside.',
      'Cut the pepper into strips and the spring onion into 3 cm lengths.',
      'Heat the oil in the same wok over high heat, add the garlic, ginger and chilli and stir-fry for 30 seconds.',
      'Add the pepper and stir-fry for 3 minutes over high heat, then add the rinsed soybeans and the soy sauce and continue for 3 minutes.',
      'Take off the heat and add the lime juice, spring onion, Thai basil and toasted cashews. Thai basil goes in off the heat: cooked, it loses its aniseed scent immediately.',
    ],
  },
];

(async () => {
  const inseriti = [];
  for (const p of PIATTI) {
    const { data: dish, error } = await supabase.from('dishes').insert({
      ...COMUNE,
      name: p.name_it, name_en: p.name,
      prep_min: p.prep_min, health_score: p.health_score,
      steps: p.steps, steps_en: p.steps_en,
    }).select('id, name').single();
    if (error) throw new Error(`${p.name_it}: ${error.message}`);

    const righe = p.ingredienti.map(([food_id, grams]) => ({ dish_id: dish.id, food_id, grams }));
    const { error: e2 } = await supabase.from('dish_ingredients').insert(righe);
    if (e2) throw new Error(`${p.name_it} ingredienti: ${e2.message}`);

    inseriti.push(dish);
    console.log(`Inserito: ${dish.name} (${dish.id})`);
  }
  console.log(`\n${inseriti.length}/2 piatti inseriti.`);
})();
