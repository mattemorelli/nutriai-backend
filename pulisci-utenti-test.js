// Cancella tutti i piani (e i plan_items a cascata) dei 4 utenti di test
// dedicati. Da lanciare a inizio/fine sessione di prove, cosi' non si
// riaccumula il pantano di 13.270 piani visto il 2026-09-17.
require('dotenv').config();
const { Client } = require('pg');
const { TEST_USERS } = require('./test-users');
const commit = process.argv[2] === '--commit';

const ID = Object.values(TEST_USERS).map(u => u.id).filter(Boolean);

(async () => {
  if (!ID.length) throw new Error('test-users.js non ha id popolati');
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const { rows: prima } = await c.query(
      `select count(*) from plans where user_id = any($1::uuid[])`, [ID]
    );
    console.log(`Piani prima: ${prima[0].count}`);

    await c.query('BEGIN');
    const { rows: cancellati } = await c.query(
      `delete from plans where user_id = any($1::uuid[]) returning id`, [ID]
    );
    console.log(`Piani cancellati in questa esecuzione: ${cancellati.length}`);

    if (commit) {
      await c.query('COMMIT');
      const { rows: dopo } = await c.query(
        `select count(*) from plans where user_id = any($1::uuid[])`, [ID]
      );
      console.log(`Piani dopo: ${dopo[0].count}`);
      console.log('COMMIT eseguito.');
    } else {
      await c.query('ROLLBACK');
      console.log('PROVA A VUOTO: ROLLBACK eseguito.');
    }
  } catch (e) {
    await c.query('ROLLBACK'); console.error('ERRORE, ROLLBACK:', e.message); process.exitCode = 1;
  } finally { await c.end(); }
})();
