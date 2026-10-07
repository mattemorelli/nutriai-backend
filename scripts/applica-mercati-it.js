// 2026-10-08 — Applica la migrazione dishes.mercati e popola il mercato
// 'it' secondo l'analisi in audit/solo-italiano.md (nutriai/audit, repo
// separata). Lista di id in scripts/mercati-it-ids.json (443 piatti: italia
// pulita + mediterraneo_generico pulito + le eccezioni decise a mano).
//
// Rimuove anche il mango da "Macedonia con uva e ananas": il nome e il
// vecchio testo parlano solo di uva e ananas, il mango in dish_ingredients
// era un ingrediente estraneo non raccontato da nessuna parte.
//
// Una sola transazione: se qualcosa fallisce non resta nulla a metà.
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const idsIt = JSON.parse(fs.readFileSync(path.join(__dirname, 'mercati-it-ids.json'), 'utf8'));
const MACEDONIA_ID = 'a6900001-0000-0000-0000-000000000004';
const MANGO_FOOD_ID = 'mango_it';

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('begin');

    await client.query(`
      alter table public.dishes
        add column if not exists mercati text[] not null default '{}'
    `);

    // Azzera per sicurezza (se lo script fosse rilanciato dopo un cambio
    // di lista, non deve restare ['it'] su un piatto tolto dalla lista).
    await client.query(`update public.dishes set mercati = '{}' where mercati <> '{}'`);

    const res = await client.query(
      `update public.dishes set mercati = array['it'] where id = any($1::uuid[])`,
      [idsIt]
    );
    console.log(`mercati = ['it'] su ${res.rowCount} piatti (attesi ${idsIt.length})`);
    if (res.rowCount !== idsIt.length) {
      throw new Error(`Attesi ${idsIt.length} aggiornamenti, ottenuti ${res.rowCount}: qualche id non esiste più in dishes?`);
    }

    const resMacedonia = await client.query(
      `delete from public.dish_ingredients where dish_id = $1 and food_id = $2`,
      [MACEDONIA_ID, MANGO_FOOD_ID]
    );
    console.log(`Mango tolto da "Macedonia con uva e ananas": ${resMacedonia.rowCount} riga rimossa`);
    if (resMacedonia.rowCount !== 1) {
      throw new Error(`Attesa 1 riga rimossa per il mango nella Macedonia, trovate ${resMacedonia.rowCount}`);
    }

    const { rows: conteggio } = await client.query(
      `select count(*) as n from public.dishes where mercati @> array['it']`
    );
    console.log(`Verifica: ${conteggio[0].n} piatti con mercati contenente 'it'`);

    await client.query('commit');
    console.log('Fatto (commit).');
  } catch (e) {
    await client.query('rollback');
    console.error('ERRORE, rollback:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
