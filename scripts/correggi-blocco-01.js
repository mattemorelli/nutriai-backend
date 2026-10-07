// Applica le correzioni di metodo al blocco 1 gia' inserito:
// - riscrive ricetta_passi per "Pasta con fave e pecorino" e "Pasta con
//   lenticchie rosse" (una sola pentola d'acqua riusata, non due)
// - inserisce ricetta_info per le ricette del blocco 1 che hanno
//   prep_anticipo (fave, baccalà)
require('dotenv').config();
const { Client } = require('pg');
const dati = require('./cook-blocco-01-dati.json');

const DA_RISCRIVERE = new Set([
  'c1000001-0000-0000-0000-000000000004', // Pasta con fave e pecorino
  'd1000001-0000-0000-0000-000000000001', // Pasta con lenticchie rosse
]);

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('begin');

    for (const dishId of DA_RISCRIVERE) {
      const ricetta = dati.ricette.find(r => r.dish_id === dishId);
      const del = await client.query('delete from ricetta_passi where dish_id = $1', [dishId]);
      console.log(`  ${ricetta.nome}: tolte ${del.rowCount} righe vecchie`);
      for (const p of ricetta.passi) {
        await client.query(
          `insert into ricetta_passi
             (dish_id, ordine, azione, testo_it, testo_en, durata_min, tipo_tempo,
              temperatura_c, forno_modalita, fuoco, tempo_da_confezione, in_parallelo, ingredienti)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`,
          [
            dishId, p.ordine, p.azione, p.testo_it, p.testo_en, p.durata_min, p.tipo_tempo,
            p.temperatura_c, p.forno_modalita, p.fuoco, p.tempo_da_confezione, p.in_parallelo,
            JSON.stringify(p.ingredienti || []),
          ]
        );
      }
      console.log(`  ${ricetta.nome}: ${ricetta.passi.length} righe nuove inserite`);
    }

    let infoScritte = 0;
    for (const ricetta of dati.ricette) {
      if (!ricetta.prep_anticipo) continue;
      const { rows: esiste } = await client.query('select 1 from ricetta_info where dish_id = $1', [ricetta.dish_id]);
      if (esiste.length) {
        console.log(`  ${ricetta.nome}: ricetta_info gia' presente, non tocco`);
        continue;
      }
      await client.query(
        'insert into ricetta_info (dish_id, prep_anticipo_it, prep_anticipo_en, ore_anticipo) values ($1,$2,$3,$4)',
        [ricetta.dish_id, ricetta.prep_anticipo.it, ricetta.prep_anticipo.en, ricetta.prep_anticipo.ore]
      );
      infoScritte++;
      console.log(`  ${ricetta.nome}: ricetta_info inserita (${ricetta.prep_anticipo.ore}h)`);
    }

    await client.query('commit');
    console.log(`\nFatto. ${infoScritte} righe ricetta_info inserite (commit).`);
  } catch (e) {
    await client.query('rollback');
    console.error('\nERRORE, transazione annullata (rollback):', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
