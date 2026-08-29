// Inserisce un blocco di piatti per il paese 'centro_nord_generico'.
// Uso: node centro-nord-data/insert.js centro-nord-data/colazione.js
require('dotenv').config();
const { Client } = require('pg');
const path = require('path');

const file = process.argv[2];
if (!file) {
  console.error('Uso: node insert.js <path-al-file-dati.js>');
  process.exit(1);
}
const dishes = require(path.resolve(file));

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    // 1. verifica food_id
    const allFoodIds = [...new Set(dishes.flatMap(d => d.ingredients.map(i => i.food_id)))];
    const foundRes = await client.query('select id from foods where id = any($1::text[])', [allFoodIds]);
    const found = new Set(foundRes.rows.map(r => r.id));
    const missing = allFoodIds.filter(id => !found.has(id));
    if (missing.length) {
      console.error('food_id mancanti in foods:', missing);
      process.exit(1);
    }

    // 2. verifica duplicati (stesso nome, stesso paese)
    const names = dishes.map(d => d.name);
    const dupSet = names.filter((n, i) => names.indexOf(n) !== i);
    if (dupSet.length) {
      console.error('Nomi duplicati nel blocco:', dupSet);
      process.exit(1);
    }
    const existingRes = await client.query(
      "select name from dishes where paese = 'centro_nord_generico' and name = any($1::text[])",
      [names]
    );
    if (existingRes.rows.length) {
      console.error('Piatti già presenti nel db:', existingRes.rows.map(r => r.name));
      process.exit(1);
    }

    // 3. inserimento in transazione
    await client.query('begin');
    for (const d of dishes) {
      const res = await client.query(
        `insert into dishes
          (name, name_en, meal_slot, prep_min, steps, cucina, steps_en, profilo,
           ha_amido, ha_proteina, famiglia, occasione, tecnica, health_score,
           salsa_industriale, base_amidacea, trasportabile,
           contiene_glutine, contiene_lattosio, contiene_frutta_secca, paese)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         returning id, name`,
        [
          d.name, d.name_en, d.meal_slot, d.prep_min, JSON.stringify(d.steps), d.cucina || 'europea',
          JSON.stringify(d.steps_en), d.profilo, d.ha_amido, d.ha_proteina, d.famiglia || 'neutra',
          d.occasione || 'quotidiano', d.tecnica || 'semplice', d.health_score,
          d.salsa_industriale || false, d.base_amidacea || false, d.trasportabile || false,
          d.contiene_glutine || false, d.contiene_lattosio || false, d.contiene_frutta_secca || false,
          'centro_nord_generico'
        ]
      );
      const dishId = res.rows[0].id;
      for (const ing of d.ingredients) {
        await client.query(
          'insert into dish_ingredients (dish_id, food_id, grams) values ($1,$2,$3)',
          [dishId, ing.food_id, ing.grams]
        );
      }
      console.log('OK:', res.rows[0].name);
    }
    await client.query('commit');
    console.log(`Inseriti ${dishes.length} piatti.`);
  } catch (e) {
    await client.query('rollback');
    console.error('ERRORE, rollback eseguito:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
