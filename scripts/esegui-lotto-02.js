// Lotto 02 — NON ESEGUITO. Esegue in una sola transazione (richiede
// DATABASE_URL raggiungibile): 20 piatti nuovi (dishes + dish_ingredients),
// tutti vegetariani o vegani, pensati sugli ingredienti che il generatore
// oggi vede con un solo piatto disponibile (zucca, cavolo verza, finocchi,
// carote, piselli, fagioli, ceci, lenticchie, cavolfiore, broccoli,
// melanzane, uova, formaggi), più ricetta_passi (passi dettagliati,
// bilingue, con tempi e indicazione di quando è cotto).
//
// Nessun alimento nuovo in foods: tutti e 20 i piatti usano solo
// ingredienti già presenti nel catalogo (vedi scripts/genera-lotto-02.js
// per l'elenco food_id/grammi usato per ciascuno).
//
// ORDINE DI LANCIO:
//   1. node scripts/backup-lotto-02.js
//   2. questo file
//   3. verifica a mano con la query sotto, o node voto-piatti.js
//   4. se qualcosa non va: node scripts/rollback-lotto-02.js
require('dotenv').config();
const { Client } = require('pg');
const piattiData = require('./lotto-02-piatti.json').piatti;
const ricetteData = require('./lotto-02-ricette.json').ricette;

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('begin');

    for (const p of piattiData) {
      await client.query(
        `insert into dishes (id, name, name_en, meal_slot, prep_min, steps, steps_en, cucina, profilo, famiglia,
           occasione, tecnica, health_score, salsa_industriale, base_amidacea, trasportabile, contiene_glutine,
           contiene_lattosio, contiene_frutta_secca, ha_amido, ha_proteina, paese, ruolo_primario, ruoli_coperti, mercati)
         values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
        [p.id, p.name, p.name_en, p.meal_slot, p.prep_min, JSON.stringify(p.steps), JSON.stringify(p.steps_en), p.cucina, p.profilo, p.famiglia,
         p.occasione, p.tecnica, p.health_score, p.salsa_industriale, p.base_amidacea, p.trasportabile, p.contiene_glutine,
         p.contiene_lattosio, p.contiene_frutta_secca, p.ha_amido, p.ha_proteina, p.paese, p.ruolo_primario, p.ruoli_coperti, p.mercati]
      );
      for (const [foodId, grams] of p.ingredienti) {
        await client.query(`insert into dish_ingredients (dish_id, food_id, grams) values ($1,$2,$3)`, [p.id, foodId, grams]);
      }
      console.log(`  piatto nuovo: ${p.name} (${p.meal_slot}, ${p.ingredienti.length} ingredienti, voto ${p.health_score})`);
    }

    let passiScritti = 0;
    for (const ricetta of ricetteData) {
      for (const pa of ricetta.passi) {
        await client.query(
          `insert into ricetta_passi
             (dish_id, ordine, azione, testo_it, testo_en, durata_min, tipo_tempo,
              temperatura_c, forno_modalita, fuoco, tempo_da_confezione, in_parallelo, ingredienti)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`,
          [ricetta.dish_id, pa.ordine, pa.azione, pa.testo_it, pa.testo_en, pa.durata_min, pa.tipo_tempo,
           pa.temperatura_c, pa.forno_modalita, pa.fuoco, pa.tempo_da_confezione, pa.in_parallelo,
           JSON.stringify(pa.ingredienti || [])]
        );
        passiScritti++;
      }
    }

    console.log(`\nTotale: ${piattiData.length} piatti nuovi, ${passiScritti} passi ricetta_passi.`);
    await client.query('commit');
    console.log('Fatto (commit).');
  } catch (e) {
    await client.query('rollback');
    console.error('\nERRORE, transazione annullata (rollback):', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
