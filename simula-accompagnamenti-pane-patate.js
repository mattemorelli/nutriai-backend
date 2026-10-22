// SOLA LETTURA: inietta nelle risposte di 'dishes' e 'dish_ingredients' gli
// accompagnamenti "pane"/"patate" sempre disponibili proposti oggi (non un
// piatto dedicato, una porzione standard di un alimento già presente in
// foods). Si appoggia a simula-categorie-pane-patate.js per le categorie
// vere (senza quelle, questi stessi alimenti non verrebbero riconosciuti
// come 'pane'/'patate' nemmeno qui). Nessuna scrittura reale.
const { clienteConCategoriePanePatate } = require('./simula-categorie-pane-patate.js');

// Porzioni e tecniche da cucina di casa italiana quotidiana (CREA: pane
// 50-80g a pasto, patate 200-250g come contorno). Nessun grasso aggiunto
// per il purè/la padella: resta un contorno "semplice", niente lattosio.
const ACCOMPAGNAMENTI = [
  { id: 'v4-pane-comune', nome: 'Pane', food_id: 'pane_comune_crea', grammi: 60, glutine: true,
    steps: ['Taglia il pane a fette.'], steps_en: ['Slice the bread.'], prep_min: 1 },
  { id: 'v4-pane-integrale', nome: 'Pane integrale', food_id: 'pane_integrale_it', grammi: 60, glutine: true,
    steps: ['Taglia il pane integrale a fette.'], steps_en: ['Slice the whole-wheat bread.'], prep_min: 1 },
  { id: 'v4-pane-segale', nome: 'Pane di segale', food_id: 'pane_segale_it', grammi: 50, glutine: true,
    steps: ['Taglia il pane di segale a fette sottili.'], steps_en: ['Thinly slice the rye bread.'], prep_min: 1 },
  { id: 'v4-pane-carasau', nome: 'Pane carasau', food_id: 'pane_carasau_it', grammi: 30, glutine: true,
    steps: ['Rompi il pane carasau in pezzi.'], steps_en: ['Break the carasau bread into pieces.'], prep_min: 1 },
  { id: 'v4-pane-senza-glutine', nome: 'Pane senza glutine', food_id: 'pane_senza_glutine_it', grammi: 60, glutine: false,
    steps: ['Taglia il pane senza glutine a fette.'], steps_en: ['Slice the gluten-free bread.'], prep_min: 1 },
  { id: 'v4-patate-lesse', nome: 'Patate lesse', food_id: '170028', grammi: 250, glutine: false, tecnica: 'bollitura',
    steps: ['Lava le patate e lessale intere in acqua salata per 25-30 minuti, finché sono morbide al centro.', 'Scola, lascia intiepidire e pela, poi taglia a tocchi.'],
    steps_en: ['Wash the potatoes and boil them whole in salted water for 25-30 minutes until tender in the centre.', 'Drain, let cool slightly and peel, then cut into chunks.'], prep_min: 30 },
  { id: 'v4-patate-forno', nome: 'Patate al forno', food_id: '170028', grammi: 250, glutine: false, tecnica: 'forno',
    steps: ['Taglia le patate a tocchi e condiscile con un filo d\'olio e sale.', 'Cuoci in forno a 200°C per 30-35 minuti, girandole a metà cottura, finché sono dorate.'],
    steps_en: ['Cut the potatoes into chunks and toss with a little oil and salt.', 'Bake at 200°C for 30-35 minutes, turning halfway, until golden.'], prep_min: 35 },
  { id: 'v4-pure-patate', nome: 'Purè di patate leggero', food_id: '170028', grammi: 220, glutine: false, tecnica: 'bollitura',
    steps: ['Lessa le patate intere in acqua salata per 25-30 minuti finché sono morbide.', 'Scola, pela e schiaccia con uno schiacciapatate, aggiungendo un filo d\'olio.'],
    steps_en: ['Boil the potatoes whole in salted water for 25-30 minutes until tender.', 'Drain, peel and mash with a potato masher, adding a drizzle of oil.'], prep_min: 30 },
  { id: 'v4-patate-padella', nome: 'Patate in padella', food_id: '170028', grammi: 220, glutine: false, tecnica: 'padella',
    steps: ['Taglia le patate a cubetti piccoli.', 'Cuocile in padella con un filo d\'olio per 15-18 minuti, mescolando, finché sono dorate e morbide.'],
    steps_en: ['Cut the potatoes into small cubes.', 'Cook in a pan with a little oil for 15-18 minutes, stirring, until golden and tender.'], prep_min: 18 },
];

function dishesFinte() {
  return ACCOMPAGNAMENTI.map((a) => ({
    id: a.id,
    name: a.nome,
    name_en: a.nome,
    meal_slot: 'contorno',
    cucina: 'europea',
    profilo: 'neutro',
    famiglia: null,
    ha_amido: true,
    ha_proteina: false,
    prep_min: a.prep_min,
    occasione: 'quotidiano',
    tecnica: a.tecnica || 'semplice',
    // Voto conservativo (pane/patate semplici, nessun fritto, nessun grasso
    // aggiunto oltre un filo d'olio): tutti sopra 7, non diventano loro
    // stessi un nuovo collo di bottiglia su nessun gradino.
    health_score: a.food_id === '170028' ? 8 : (a.glutine ? 7.5 : 7),
    salsa_industriale: false,
    base_amidacea: true,
    trasportabile: true,
    contiene_glutine: a.glutine,
    contiene_lattosio: false,
    contiene_frutta_secca: false,
    paese: 'italia',
    ruolo_primario: null,
    ruoli_coperti: [],
    mercati: ['it'],
    steps: a.steps,
    steps_en: a.steps_en,
    _v4_food_id: a.food_id,
    _v4_grammi: a.grammi,
  }));
}

function clienteConAccompagnamenti(reale) {
  const conCategorie = clienteConCategoriePanePatate(reale);
  const DISHES_FINTE = dishesFinte();
  const IDS_FINTI = new Set(DISHES_FINTE.map((d) => d.id));

  return {
    from(tabella) {
      if (tabella === 'dishes') {
        let real = conCategorie.from(tabella);
        let selectCols = null;
        const metodiPassthrough = ['contains', 'not', 'in', 'order', 'eq'];
        const finto = { select(cols) { selectCols = cols; real = real.select(cols); return finto; } };
        for (const m of metodiPassthrough) finto[m] = (...args) => { real = real[m](...args); return finto; };
        finto.gte = (...args) => { real = real.gte(...args); return finto; };
        finto.or = (...args) => { real = real.or(...args); return finto; };
        finto.range = async (offset, fine) => {
          const risposta = await real.range(offset, fine);
          if (risposta.error || offset !== 0) return risposta;
          return { ...risposta, data: [...risposta.data, ...DISHES_FINTE] };
        };
        return finto;
      }

      if (tabella === 'dish_ingredients') {
        const real = conCategorie.from(tabella);
        let dishIdsRichiesti = null;
        const finto = {
          select() { return finto; },
          in(campo, vals) { if (campo === 'dish_id') dishIdsRichiesti = vals; return finto; },
          then(resolve, reject) {
            (async () => {
              const idsReali = (dishIdsRichiesti || []).filter((id) => !IDS_FINTI.has(id));
              const idsFinti = (dishIdsRichiesti || []).filter((id) => IDS_FINTI.has(id));
              let risposta = { data: [], error: null };
              if (idsReali.length) {
                risposta = await real.select('dish_id, food_id, grams, foods (name, kcal_100g, protein_100g, fat_100g, sat_fat_100g, fibre_100g, salt_100g, stato, categoria_impatto)').in('dish_id', idsReali);
                if (risposta.error) { resolve(risposta); return; }
              }
              let righeFinte = [];
              if (idsFinti.length) {
                const foodIdsServiti = [...new Set(DISHES_FINTE.filter((d) => idsFinti.includes(d.id)).map((d) => d._v4_food_id))];
                const { data: foodsReali, error: eFoods } = await reale.from('foods')
                  .select('name, kcal_100g, protein_100g, fat_100g, sat_fat_100g, fibre_100g, salt_100g, stato, categoria_impatto, id')
                  .in('id', foodIdsServiti);
                if (eFoods) { resolve({ data: null, error: eFoods }); return; }
                const foodsDi = {};
                for (const f of foodsReali) foodsDi[f.id] = f;
                righeFinte = DISHES_FINTE.filter((d) => idsFinti.includes(d.id)).map((d) => ({
                  dish_id: d.id, food_id: d._v4_food_id, grams: d._v4_grammi, foods: foodsDi[d._v4_food_id],
                }));
              }
              resolve({ data: [...(risposta.data || []), ...righeFinte], error: null });
            })().catch(reject);
          },
        };
        return finto;
      }

      return conCategorie.from(tabella);
    },
  };
}

module.exports = { clienteConAccompagnamenti, ACCOMPAGNAMENTI };
