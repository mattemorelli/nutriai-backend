// db.js — esegue SQL arbitrario su Supabase
require('dotenv').config();
const { Client } = require('pg');

const sql = process.argv[2];
if (!sql) {
  console.error('Uso: node db.js "SELECT ..."');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(sql);
    if (res.rows && res.rows.length) console.log(JSON.stringify(res.rows, null, 2));
    else console.log(`OK — ${res.rowCount} righe`);
  } catch (e) {
    console.error('ERRORE:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();