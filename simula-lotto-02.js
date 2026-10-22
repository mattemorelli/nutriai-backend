// SOLA LETTURA: client finto che inietta nelle risposte di 'dishes' e
// 'dish_ingredients' i 20 piatti del lotto 02 (scripts/lotto-02-piatti.json),
// SENZA scrivere nulla nel database vero - serve solo per misurare/testare
// prima che lo script di inserimento venga lanciato. Si appoggia a
// clienteConAccompagnamenti (pane/patate di stanotte), stesso schema di
// quel file. Nessun alimento nuovo: tutti i food_id dei 20 piatti sono già
// in foods, presi dal database reale tramite 'reale', non da qui.
const { clienteConAccompagnamenti } = require('./simula-accompagnamenti-pane-patate.js');
const PIATTI_LOTTO_02 = require('./scripts/lotto-02-piatti.json').piatti;

function dishesFinte() {
  return PIATTI_LOTTO_02.map((p) => ({
    id: p.id, name: p.name, name_en: p.name_en, meal_slot: p.meal_slot,
    prep_min: p.prep_min, cucina: p.cucina, profilo: p.profilo, famiglia: p.famiglia,
    ha_amido: p.ha_amido, ha_proteina: p.ha_proteina, occasione: p.occasione, tecnica: p.tecnica,
    health_score: p.health_score, salsa_industriale: p.salsa_industriale, base_amidacea: p.base_amidacea,
    trasportabile: p.trasportabile, contiene_glutine: p.contiene_glutine, contiene_lattosio: p.contiene_lattosio,
    contiene_frutta_secca: p.contiene_frutta_secca, paese: p.paese, ruolo_primario: p.ruolo_primario,
    ruoli_coperti: p.ruoli_coperti, mercati: p.mercati, steps: p.steps, steps_en: p.steps_en,
    _lotto02_ingredienti: p.ingredienti,
  }));
}

function clienteConLotto02(reale) {
  const base = clienteConAccompagnamenti(reale);
  const DISHES_FINTE = dishesFinte();
  const IDS_FINTI = new Set(DISHES_FINTE.map((d) => d.id));

  return {
    from(tabella) {
      if (tabella === 'dishes') {
        let real = base.from(tabella);
        const finto = { select(cols) { real = real.select(cols); return finto; } };
        const metodiPassthrough = ['contains', 'not', 'in', 'order', 'eq', 'gte', 'or'];
        for (const m of metodiPassthrough) finto[m] = (...args) => { real = real[m](...args); return finto; };
        finto.range = async (offset, fine) => {
          const risposta = await real.range(offset, fine);
          if (risposta.error || offset !== 0) return risposta;
          return { ...risposta, data: [...risposta.data, ...DISHES_FINTE] };
        };
        return finto;
      }

      if (tabella === 'dish_ingredients') {
        const real = base.from(tabella);
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
                const foodIdsServiti = [...new Set(
                  DISHES_FINTE.filter((d) => idsFinti.includes(d.id)).flatMap((d) => d._lotto02_ingredienti.map(([fid]) => fid))
                )];
                const { data: foodsReali, error: eFoods } = await reale.from('foods')
                  .select('name, kcal_100g, protein_100g, fat_100g, sat_fat_100g, fibre_100g, salt_100g, stato, categoria_impatto, id')
                  .in('id', foodIdsServiti);
                if (eFoods) { resolve({ data: null, error: eFoods }); return; }
                const foodsDi = {};
                for (const f of foodsReali) foodsDi[f.id] = f;
                for (const d of DISHES_FINTE) {
                  if (!idsFinti.includes(d.id)) continue;
                  for (const [foodId, grams] of d._lotto02_ingredienti) {
                    righeFinte.push({ dish_id: d.id, food_id: foodId, grams, foods: foodsDi[foodId] });
                  }
                }
              }
              resolve({ data: [...(risposta.data || []), ...righeFinte], error: null });
            })().catch(reject);
          },
        };
        return finto;
      }

      return base.from(tabella);
    },
  };
}

module.exports = { clienteConLotto02, PIATTI_LOTTO_02 };
