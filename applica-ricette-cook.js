// applica-ricette-cook.js — Scrive steps e steps_en di un blocco di ricette
// riviste per la modalità Cook. Aggiorna SOLO steps e steps_en (mai ingredienti,
// grammi, prep_min, health_score o altre colonne: quelle si cambiano a parte,
// con decisioni esplicite, non da questo script).
//
// Uso: node applica-ricette-cook.js ricette-cook-blocco1.json

require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const fs = require('fs');

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('Uso: node applica-ricette-cook.js <blocco.json>'); process.exit(1); }
  const blocco = JSON.parse(fs.readFileSync(file));

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let aggiornati = 0;
  try {
    for (const d of blocco) {
      const res = await client.query(
        `update dishes set steps = $1::jsonb, steps_en = $2::jsonb, steps_detailed_at = now() where id = $3::uuid returning id`,
        [JSON.stringify(d.steps), JSON.stringify(d.steps_en), d.id]
      );
      if (res.rowCount === 1) {
        aggiornati++;
        console.log(`OK   ${d.name}`);
      } else {
        console.log(`MANCA ${d.name} (${d.id}) — nessuna riga aggiornata`);
      }
    }
  } finally {
    await client.end();
  }
  console.log(`\nAggiornati ${aggiornati}/${blocco.length} piatti.`);
}

main().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
