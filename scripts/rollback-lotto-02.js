// Rollback di esegui-lotto-02.js. NON ESEGUITO. Cancella solo i 20 id nuovi
// (ricetta_passi e dish_ingredients prima, per la foreign key verso dishes,
// poi dishes - cancellare dishes farebbe comunque sparire le righe
// collegate per ON DELETE CASCADE dove presente, ma l'ordine esplicito
// resta più chiaro da leggere e funziona anche senza quel vincolo).
// Uso: node scripts/rollback-lotto-02.js
require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const ID_NUOVI = require('./lotto-02-piatti.json').piatti.map((p) => p.id);

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('begin');
    const r1 = await client.query('delete from ricetta_passi where dish_id = any($1)', [ID_NUOVI]);
    const r2 = await client.query('delete from ricetta_info where dish_id = any($1)', [ID_NUOVI]);
    const r3 = await client.query('delete from dish_ingredients where dish_id = any($1)', [ID_NUOVI]);
    const r4 = await client.query('delete from dishes where id = any($1)', [ID_NUOVI]);
    console.log(`ricetta_passi: ${r1.rowCount} righe · ricetta_info: ${r2.rowCount} · dish_ingredients: ${r3.rowCount} · dishes: ${r4.rowCount}`);
    await client.query('commit');
    console.log('Fatto (commit del rollback).');
  } catch (e) {
    await client.query('rollback');
    console.error('ERRORE, rollback del rollback:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
