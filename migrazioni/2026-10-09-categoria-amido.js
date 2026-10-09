// MIGRAZIONE DATI - da applicare al database vero solo dopo l'ok dell'utente.
// Aggiunge la categoria 'amido' a categorie_alimenti per gli alimenti che
// sono pasta, riso, couscous, orzo, farro, miglio, grano saraceno, polenta,
// patate o pane - la stessa identita' di "amido" che il generatore usa per
// il doppio amido (accompagnaBene) e per decidere pane/patate a cena
// (vedi audit/analisi-generatore.md, problema E). Lista curata a mano da un
// giro sul catalogo (categoria_impatto='cereali' si e' rivelata troppo
// rumorosa per essere usata direttamente: include aceto, vino, miele, salse,
// zucchero... non solo amidi - vedi scripts/_tmp-investiga-amido.js).
//
// Uso locale:  node migrazioni/2026-10-09-categoria-amido.js
// Uso su prod: DATABASE_URL=... node migrazioni/2026-10-09-categoria-amido.js
const { Client } = require('pg');

const FOOD_IDS_AMIDO = [
  'riso_venere_it', 'farina_riso_glutinoso_it', 'farina_riso_it', 'riso_basmati_it',
  'couscous_integrale_it', 'farro_perlato_it', 'grano_saraceno_it', 'pane_carasau_it',
  'pane_comune_crea', 'pane_segale_it', 'pasta_integrale_it', 'pane_senza_glutine_it',
  'polenta_it', 'farina_mais_it', 'farro_integrale_it', 'miglio_it', 'crema_riso_it',
  'gallette_riso_it', 'farina_mais_bianca_it', 'pane_integrale_it', 'polenta_taragna_it',
  'riso_integrale_cotto_it', 'riso_jasmine_cotto_it', 'soba_it', 'riso_jasmine_it',
  '167557', '168877', '169703', 'orzo_it', '169699', '169736', '174915', '174924',
  '170028', 'polenta_cruda_it', 'spaghetti_riso_it', 'pasta_it',
  // Aggiunto dopo aver trovato "Farinata di ceci" (una torta/piadina di
  // farina di ceci, la stessa famiglia della polenta - farina come base,
  // non un contorno di legumi) servita CON pane in una settimana campione:
  // mancava perche' "ceci" non e' nella lista di parole del problema E,
  // ma e' lo stesso tipo di piatto, non va trattato diversamente.
  'farina_ceci_it',
];

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgres://matte@localhost:5432/quadrio_local';
  const client = new Client({ connectionString });
  await client.connect();

  const { rows: mancanti } = await client.query(
    `select f.id from unnest($1::text[]) as f(id) where not exists (select 1 from foods where id = f.id)`,
    [FOOD_IDS_AMIDO]
  );
  if (mancanti.length) {
    console.error('ATTENZIONE: food_id non trovati in foods, migrazione interrotta:', mancanti.map(r => r.id));
    process.exitCode = 1;
    await client.end();
    return;
  }

  await client.query(
    `insert into categorie (codice, nome_it, nome_en, tipo, sinonimi)
     values ('amido', 'Amido', 'Starch', 'gruppo', '{pasta,riso,rice,pane,bread,patate,potato,couscous,orzo,farro,polenta}')
     on conflict (codice) do nothing`
  );

  let inseriti = 0;
  for (const foodId of FOOD_IDS_AMIDO) {
    const { rowCount } = await client.query(
      `insert into categorie_alimenti (food_id, categoria) values ($1, 'amido')
       on conflict (food_id, categoria) do nothing`,
      [foodId]
    );
    inseriti += rowCount;
  }
  console.log(`Categoria 'amido': ${inseriti} righe nuove inserite su ${FOOD_IDS_AMIDO.length} food_id (le altre gia' presenti).`);
  await client.end();
}

main().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
