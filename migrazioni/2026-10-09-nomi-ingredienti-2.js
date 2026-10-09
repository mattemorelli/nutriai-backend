// MIGRAZIONE DATI - da applicare al database vero solo dopo l'ok dell'utente.
// Trovato durante la verifica delle correzioni precedenti (vedi messaggio
// utente 2026-10-09, punto 6): diversi piatti nominano un legume che non è
// quello davvero usato - "174285 Fagioli rossi" compare come ingrediente in
// 5 piatti il cui nome dice "ceci" o "lenticchie". Allineati ingrediente e
// nome (non il nome all'ingrediente: il nome descrive la ricetta intesa).
// Più: "Salmone e fagiolini in padella" non ha fagiolini (ha broccoli) -
// qui il nome è quello sbagliato, rinominato. "Pane (contorno)" rinominato
// semplicemente "Pane" (il "(contorno)" era un'etichetta tecnica interna).
//
// Uso locale:  node migrazioni/2026-10-09-nomi-ingredienti-2.js
// Uso su prod: DATABASE_URL=... node migrazioni/2026-10-09-nomi-ingredienti-2.js
const { Client } = require('pg');

const SWAP_INGREDIENTE = [
  // [dish_id, food_id_vecchio, food_id_nuovo]
  ['1c7fce71-8b53-4e58-83aa-3ac4d12e7317', '174285', 'lenticchie_cotte_it'], // Lenticchie in umido veloci
  ['ecddb9b8-6aaf-44de-aebc-fee009e7a509', '174285', 'lenticchie_cotte_it'], // Lenticchie e spinaci in padella
  ['c1000001-0000-0000-0000-000000000033', '175206', 'lenticchie_cotte_it'], // Zuppa di lenticchie americana
  ['7a7fdbe0-9e8e-4d6d-88de-e27a69d5b686', '174285', 'ceci_rossi_it'], // Ceci e spinaci in padella
  ['5a7b2d90-c4b0-4c1e-85e1-8676c9412e37', '174285', 'ceci_rossi_it'], // Insalata di ceci e verdure
  ['e4a824ac-f7b4-4eb1-86e3-3d2b21694260', '174285', 'ceci_rossi_it'], // Insalata di ceci e tonno
];

const RINOMINA = [
  { id: 'bbbbbbbb-0000-0000-0000-000000000001', name: 'Pane', name_en: 'Bread' },
  { id: '2604c197-d6c3-47ce-a6d9-41e6094b0062', name: 'Salmone e broccoli in padella', name_en: 'Pan-seared salmon with broccoli' },
];

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgres://matte@localhost:5432/quadrio_local';
  const client = new Client({ connectionString });
  await client.connect();

  await client.query('begin');
  try {
    for (const [dishId, vecchio, nuovo] of SWAP_INGREDIENTE) {
      const { rowCount } = await client.query(
        `update dish_ingredients set food_id = $3 where dish_id = $1 and food_id = $2`,
        [dishId, vecchio, nuovo]
      );
      console.log(`${dishId}: ${vecchio} -> ${nuovo} (${rowCount} riga).`);
    }
    for (const d of RINOMINA) {
      const { rowCount } = await client.query(`update dishes set name = $2, name_en = $3 where id = $1`, [d.id, d.name, d.name_en]);
      console.log(`Rinominato ${d.id}: "${d.name}" (${rowCount} riga).`);
    }
    await client.query('commit');
  } catch (e) {
    await client.query('rollback');
    throw e;
  }
  await client.end();
}

main().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
