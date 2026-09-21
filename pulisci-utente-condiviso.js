// Cancella i piani accumulati sull'utente di test condiviso storico
// (b8b2e50e), debito di settimane di verifiche precedenti - non piani di
// oggi. Uso singolo, non un comando ricorrente come pulisci-utenti-test.js.
require('dotenv').config();
const { Client } = require('pg');
const commit = process.argv[2] === '--commit';
const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  try {
    const { rows: prima } = await c.query(`select count(*) from plans where user_id = $1`, [USER_ID]);
    const { rows: primaItems } = await c.query(
      `select count(*) from plan_items pi join plans p on p.id = pi.plan_id where p.user_id = $1`, [USER_ID]
    );
    console.log(`Prima: ${prima[0].count} piani, ${primaItems[0].count} plan_items`);

    if (!commit) {
      await c.query('BEGIN');
      const { rows: cancellati } = await c.query(`delete from plans where user_id = $1 returning id`, [USER_ID]);
      console.log(`PROVA A VUOTO: cancellerebbe ${cancellati.length} piani.`);
      await c.query('ROLLBACK');
      console.log('ROLLBACK eseguito.');
      return;
    }

    // Il delete in un colpo solo (13270 piani, 709341 plan_items a cascata)
    // supera lo statement_timeout di Postgres: a lotti, una transazione per
    // lotto, cosi' un timeout su un lotto non annulla quelli gia' fatti.
    const LOTTO = 500;
    let totCancellati = 0;
    for (;;) {
      const { rows: idLotto } = await c.query(
        `select id from plans where user_id = $1 limit $2`, [USER_ID, LOTTO]
      );
      if (!idLotto.length) break;
      const ids = idLotto.map(r => r.id);
      await c.query('BEGIN');
      await c.query(`delete from plans where id = any($1::uuid[])`, [ids]);
      await c.query('COMMIT');
      totCancellati += ids.length;
      console.log(`  cancellati finora: ${totCancellati}`);
    }
    const { rows: dopo } = await c.query(`select count(*) from plans where user_id = $1`, [USER_ID]);
    console.log(`Totale cancellati: ${totCancellati}. Dopo: ${dopo[0].count} piani.`);
    console.log('COMMIT eseguito (a lotti).');
  } catch (e) {
    try { await c.query('ROLLBACK'); } catch (_) {}
    console.error('ERRORE:', e.message); process.exitCode = 1;
  } finally { await c.end(); }
})();
