// Importa dati/rilevazioni-prezzi-2026-09.csv in rilevazioni_prezzi.
// Query parametrizzata (non SQL scritto a mano): alcuni nomi prodotto hanno
// apostrofi ("Tonno all'olio", "Filetti merluzzo d'Alaska") che romperebbero
// un INSERT costruito a mano per concatenazione di stringhe.
// Idempotente per il vincolo unique(catena, categoria, data): rilanciarlo
// con lo stesso file aggiorna le righe invece di duplicarle.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const FILE_CSV = process.argv[2] || path.join(__dirname, 'dati', 'rilevazioni-prezzi-2026-09.csv');

function leggiCsv(percorso) {
  const testo = fs.readFileSync(percorso, 'utf8').replace(/\r\n/g, '\n').trim();
  const [intestazione, ...righe] = testo.split('\n');
  const colonne = intestazione.split(',');
  return righe.map((riga) => {
    // Nessun campo del nostro CSV contiene virgole tra virgolette: split
    // semplice, coerente con come e' stato scritto.
    const valori = riga.split(',');
    const record = {};
    colonne.forEach((c, i) => { record[c] = valori[i] === '' ? null : valori[i]; });
    return record;
  });
}

(async () => {
  const righe = leggiCsv(FILE_CSV);
  console.log(`${righe.length} righe lette da ${FILE_CSV}`);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    let scritte = 0;
    for (const r of righe) {
      await client.query(
        `insert into public.rilevazioni_prezzi
           (catena, categoria, prodotto, formato, prezzo, prezzo_unitario, unita, note, fonte, data, cap)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         on conflict (catena, categoria, data) do update set
           prodotto = excluded.prodotto, formato = excluded.formato,
           prezzo = excluded.prezzo, prezzo_unitario = excluded.prezzo_unitario,
           unita = excluded.unita, note = excluded.note, fonte = excluded.fonte,
           cap = excluded.cap`,
        [r.catena, r.categoria, r.prodotto, r.formato, r.prezzo, r.prezzo_unitario,
          r.unita, r.note, r.fonte, r.data, r.cap]
      );
      scritte++;
    }
    console.log(`${scritte} righe scritte/aggiornate in rilevazioni_prezzi`);
  } finally {
    await client.end();
  }
})().catch((e) => { console.error('ERRORE:', e.message); process.exit(1); });
