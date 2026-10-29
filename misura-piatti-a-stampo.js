// misura-piatti-a-stampo.js — SOLA LETTURA. Nessuna scrittura sul database.
// Misura quanti piatti nel catalogo sono "combinazioni a stampo": nomi costruiti
// come "<base> con <proteina> e <verdura>" che si ripetono con la stessa base
// (es. "Mais dolce con...", "Patate al forno con...").
require('dotenv').config({ quiet: true });
const { Client } = require('pg');

const SOGLIA_RIPETIZIONI = 3; // una base conta come "a stampo" solo se ricorre almeno 3 volte

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows: dishes } = await client.query(`
    select d.id, d.name, d.meal_slot, d.prep_min, d.paese,
           (select count(*) from plan_items pi where pi.dish_id = d.id) as volte_in_piani
    from dishes d
    where d.health_score is not null
  `);

  // estrae la "base" come il testo prima del primo " con " nel nome
  const basePerDish = new Map();
  for (const d of dishes) {
    const m = d.name.match(/^(.+?)\s+con\s+/i);
    if (m) basePerDish.set(d.id, m[1].trim());
  }

  const gruppi = new Map(); // base -> [dishes]
  for (const d of dishes) {
    const base = basePerDish.get(d.id);
    if (!base) continue;
    if (!gruppi.has(base)) gruppi.set(base, []);
    gruppi.get(base).push(d);
  }

  const basiAStampo = [...gruppi.entries()].filter(([, lista]) => lista.length >= SOGLIA_RIPETIZIONI);
  basiAStampo.sort((a, b) => b[1].length - a[1].length);

  // quick dishes per paese (per calcolare la quota): prep_min <= 25, su TUTTO il catalogo
  const { rows: tuttiVeloci } = await client.query(`
    select paese, count(*) as n from dishes where health_score is not null and prep_min <= 25 group by paese
  `);
  const velociPerPaese = new Map(tuttiVeloci.map(r => [r.paese, Number(r.n)]));

  console.log('='.repeat(78));
  console.log(`PIATTI "A STAMPO" NEL CATALOGO (base ricorrente >= ${SOGLIA_RIPETIZIONI} volte)`);
  console.log('='.repeat(78));

  let totalePiattiAStampo = 0;
  const risultatoPerBase = [];

  for (const [base, lista] of basiAStampo) {
    totalePiattiAStampo += lista.length;
    const inPiani = lista.filter(d => d.volte_in_piani > 0).length;
    const veloci = lista.filter(d => Number(d.prep_min) <= 25);
    const perPaese = new Map();
    for (const d of veloci) {
      perPaese.set(d.paese, (perPaese.get(d.paese) || 0) + 1);
    }
    const quotePerPaese = [...perPaese.entries()].map(([paese, n]) => {
      const totaleVelociPaese = velociPerPaese.get(paese) || 0;
      const quota = totaleVelociPaese ? (100 * n / totaleVelociPaese) : 0;
      return { paese, n, totaleVelociPaese, quota };
    }).sort((a, b) => b.quota - a.quota);

    risultatoPerBase.push({ base, totale: lista.length, inPiani, veloci: veloci.length, quotePerPaese });

    console.log(`\n### "${base} con ..." — ${lista.length} piatti`);
    console.log(`  in plan_items (almeno una volta): ${inPiani}/${lista.length}`);
    console.log(`  veloci (prep_min <= 25): ${veloci.length}/${lista.length}`);
    if (quotePerPaese.length) {
      console.log('  quota sui piatti veloci per paese:');
      for (const q of quotePerPaese) {
        console.log(`    ${(q.paese || '(nessun paese)').padEnd(20)} ${q.n}/${q.totaleVelociPaese} piatti veloci del paese (${q.quota.toFixed(1)}%)`);
      }
    }
  }

  console.log('\n' + '='.repeat(78));
  console.log('RIEPILOGO');
  console.log('='.repeat(78));
  console.log(`Basi a stampo trovate: ${basiAStampo.length}`);
  console.log(`Piatti totali coinvolti: ${totalePiattiAStampo} su ${dishes.length} piatti utilizzabili (${(100 * totalePiattiAStampo / dishes.length).toFixed(1)}%)`);

  require('fs').writeFileSync('misura-piatti-a-stampo.json', JSON.stringify(risultatoPerBase, null, 2));
  console.log('\nSalvato in misura-piatti-a-stampo.json');

  await client.end();
}

main().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
