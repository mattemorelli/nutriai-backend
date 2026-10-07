// Correzione dati per la modalita' Cook (prova su 10 ricette, vedi
// ~/Progetti/nutriai/audit/cook-prova.md): due piatti del gruppo A avevano
// il nome che prometteva un ingrediente mai registrato in dish_ingredients
// (stesso schema del miele/cannella gia' corretto in precedenza).
//
// - "Friselle con pomodoro e origano": mancava l'origano. Aggiunto
//   171328 "Origano secco", 1g.
// - "Pasta con broccoli e peperoncino": mancava il peperoncino. Aggiunto
//   "peperoncino_it" "Peperoncino fresco", 1g.
//
// Ricalcolo ruolo_primario/ruoli_coperti verificato a mano prima di
// scrivere: 1g di condimento in piu' non supera la soglia di copertura in
// nessuno dei due piatti (resta sotto min(40, 20% del peso totale) in
// entrambi i casi), quindi i ruoli non cambiano - nessun update su quei
// campi in questo script.
//
// Non tocca dishes.steps/steps_en, plans, plan_items, meal_outcomes.

require('dotenv').config();
const { Client } = require('pg');

const AGGIUNTE = [
  {
    dish_id: 'd1000001-0000-0000-0000-000000000013',
    nome: 'Friselle con pomodoro e origano',
    food_id: '171328',
    grams: 1,
  },
  {
    dish_id: 'e1111111-0000-0000-0000-000000000005',
    nome: 'Pasta con broccoli e peperoncino',
    food_id: 'peperoncino_it',
    grams: 1,
  },
];

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('begin');

    for (const a of AGGIUNTE) {
      const { rows: esiste } = await client.query(
        'select 1 from dish_ingredients where dish_id = $1 and food_id = $2',
        [a.dish_id, a.food_id]
      );
      if (esiste.length) {
        throw new Error(`${a.nome}: ha gia' una riga per ${a.food_id} - aborto, controllare a mano`);
      }
      await client.query(
        'insert into dish_ingredients (dish_id, food_id, grams) values ($1, $2, $3)',
        [a.dish_id, a.food_id, a.grams]
      );
      console.log(`  ${a.nome}: aggiunto ${a.food_id} (${a.grams}g)`);
    }

    await client.query('commit');
    console.log('\nFatto. Transazione confermata (commit).');
  } catch (e) {
    await client.query('rollback');
    console.error('\nERRORE, transazione annullata (rollback):', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
