// MIGRAZIONE DATI - da applicare al database vero solo dopo l'ok dell'utente.
// Parte del problema A (audit/analisi-generatore.md): via la "base" di amido
// scondito a cena, al suo posto pane o patate. Le patate esistono gia' come
// contorni base_amidacea=true (Patate lesse, al forno, schiacciate...). Il
// pane invece aveva un bug e una lacuna:
//  - "Pane (contorno)" esisteva gia' (food pane_comune_crea, 50g) ma con
//    base_amidacea=false per errore - lo stesso ruolo di "Pane integrale"
//    (base_amidacea=true), solo taggato diversamente senza motivo.
//  - Non esisteva nessun "pane" senza glutine come contorno (solo come
//    colazione, "Pane senza glutine tostato con marmellata"): chi ha un
//    vincolo sul glutine non aveva un pane da affiancare al secondo.
//  - I tre piatti di pane avevano health_score 6.1-6.8, sotto la soglia 7
//    che il generatore usa a quasi tutti i gradini (0-4b): li rendeva
//    PRATICAMENTE INVISIBILI alla ricerca, trovato testando il codice.
//    CLAUDE.md regola 2 dice "piatti con pane o patate come base 8.0-8.6" e
//    ogni altro contorno base_amidacea del catalogo (patate, farro, pasta,
//    legumi...) e' infatti sopra 7.8 - solo il pane era fuori standard.
//    Corretto in linea con la regola e con gli altri contorni della stessa
//    famiglia (base_amidacea=true).
//
// Uso locale:  node migrazioni/2026-10-09-pane-accompagnamento.js
// Uso su prod: DATABASE_URL=... node migrazioni/2026-10-09-pane-accompagnamento.js
const { Client } = require('pg');

const NUOVO_ID = '6a7a9b1e-7c3d-4b8a-9e2a-5f1d8c0a3b6e';

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgres://matte@localhost:5432/quadrio_local';
  const client = new Client({ connectionString });
  await client.connect();

  await client.query('begin');
  try {
    const { rowCount } = await client.query(
      `update dishes set base_amidacea = true where id = 'bbbbbbbb-0000-0000-0000-000000000001' and base_amidacea = false`
    );
    console.log(`"Pane (contorno)": base_amidacea corretto a true (${rowCount} riga aggiornata).`);

    const { rowCount: rPaneComune } = await client.query(
      `update dishes set health_score = 8.0 where id = 'bbbbbbbb-0000-0000-0000-000000000001'`
    );
    const { rowCount: rPaneIntegrale } = await client.query(
      `update dishes set health_score = 8.3 where name = 'Pane integrale' and meal_slot = 'contorno'`
    );
    console.log(`health_score corretto: "Pane (contorno)"=8.0 (${rPaneComune} riga), "Pane integrale"=8.3 (${rPaneIntegrale} riga).`);

    const { rows: esiste } = await client.query('select 1 from dishes where id = $1', [NUOVO_ID]);
    if (esiste.length) {
      await client.query(`update dishes set health_score = 8.1 where id = $1`, [NUOVO_ID]);
      console.log('"Pane senza glutine" (contorno) gia\' presente: health_score corretto a 8.1.');
    } else {
      await client.query(
        `insert into dishes (
           id, name, name_en, meal_slot, prep_min, steps, steps_en, cucina, profilo, ha_amido,
           ha_proteina, famiglia, occasione, tecnica, health_score, salsa_industriale, base_amidacea,
           trasportabile, contiene_glutine, contiene_lattosio, contiene_frutta_secca, paese,
           ruolo_primario, ruoli_coperti, mercati
         ) values (
           $1, 'Pane senza glutine', 'Gluten-free bread', 'contorno', 1,
           $2::jsonb, $3::jsonb, 'europea', 'neutro', true,
           false, 'neutra', 'quotidiano', 'semplice', 8.1, false, true,
           true, false, false, false, 'mediterraneo_generico',
           'base_amidacea', ARRAY['base_amidacea'], ARRAY['it']
         )`,
        [
          NUOVO_ID,
          JSON.stringify(['Taglia il pane a fette.', 'Servi a parte.']),
          JSON.stringify(['Slice the bread.', 'Serve alongside.']),
        ]
      );
      await client.query(
        `insert into dish_ingredients (dish_id, food_id, grams) values ($1, 'pane_senza_glutine_it', 60)`,
        [NUOVO_ID]
      );
      console.log('"Pane senza glutine" (contorno) creato, 60 g, id', NUOVO_ID);
    }

    await client.query('commit');
  } catch (e) {
    await client.query('rollback');
    throw e;
  }
  await client.end();
}

main().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
