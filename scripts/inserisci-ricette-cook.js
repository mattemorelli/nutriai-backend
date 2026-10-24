// Inserisce le ricette di un file dati (default cook-prova-dati.json, o
// passato come argomento) in ricetta_passi.
// Uso: node scripts/inserisci-ricette-cook.js [file.json]
// Non cancella mai righe esistenti: se un dish_id ha gia' dei passi, si
// ferma e lo segnala, cosi' lo stesso script serve anche per i blocchi
// successivi del gruppo A senza rischiare doppioni.
require('dotenv').config({ quiet: true });
const path = require('path');
const { Client } = require('pg');
const file = process.argv[2] || './cook-prova-dati.json';
const dati = require(path.resolve(__dirname, file));

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('begin');

    let scritti = 0;
    for (const ricetta of dati.ricette) {
      const { rows: esiste } = await client.query(
        'select 1 from ricetta_passi where dish_id = $1 limit 1',
        [ricetta.dish_id]
      );
      if (esiste.length) {
        throw new Error(`${ricetta.nome} (${ricetta.dish_id}): ha gia' dei passi in ricetta_passi - aborto, non sovrascrivo`);
      }
      for (const p of ricetta.passi) {
        await client.query(
          `insert into ricetta_passi
             (dish_id, ordine, azione, testo_it, testo_en, durata_min, tipo_tempo,
              temperatura_c, forno_modalita, fuoco, tempo_da_confezione, in_parallelo, ingredienti)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`,
          [
            ricetta.dish_id, p.ordine, p.azione, p.testo_it, p.testo_en, p.durata_min, p.tipo_tempo,
            p.temperatura_c, p.forno_modalita, p.fuoco, p.tempo_da_confezione, p.in_parallelo,
            JSON.stringify(p.ingredienti || []),
          ]
        );
        scritti++;
      }
      console.log(`  ${ricetta.nome}: ${ricetta.passi.length} passi inseriti`);
    }

    await client.query('commit');
    console.log(`\nFatto. ${scritti} righe inserite in ricetta_passi (commit).`);
  } catch (e) {
    await client.query('rollback');
    console.error('\nERRORE, transazione annullata (rollback):', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
