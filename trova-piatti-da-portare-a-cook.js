// trova-piatti-da-portare-a-cook.js — SOLA LETTURA. Elenca i piatti con 3
// o 4 passaggi (ne' il minimo di scarto - 1-2 passi, troppo lontani dal
// formato per entrare in un blocco di riscrittura mirato - ne' gia' nel
// formato Cook): la fascia "quasi pronta" da cui ha senso ripartire prima
// di affrontare i piatti a 1-2 passaggi, molto piu' numerosi (283 a 1
// passo, 949 a 2 - vedi la distribuzione completa stampata sotto).
//
// Il formato bersaglio e' la regola 6 di CLAUDE.md: steps e steps_en
// completi in entrambe le lingue, STESSO numero di passaggi, 5-8, tempi
// sempre "X min"/"X-Y min" (mai "qualche minuto"/secondi/ore isolati), un
// passaggio = una sola azione, "Mentre/While" per le azioni in parallelo.
// Dopo la riscrittura, far passare il blocco da valida-ricette-cook.js
// prima di considerarlo fatto.
//
// Uso: node trova-piatti-da-portare-a-cook.js
require('dotenv').config({ quiet: true });
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const { rows: distribuzione } = await c.query(`
    select jsonb_array_length(steps) as n_passi, count(*) from dishes group by 1 order by 1
  `);
  console.log('Distribuzione passaggi (IT) su tutto il catalogo:');
  for (const r of distribuzione) console.log(`  ${r.n_passi} passi: ${r.count} piatti`);

  const { rows } = await c.query(`
    select d.id, d.name, d.name_en, d.meal_slot, d.paese,
           jsonb_array_length(d.steps) as n_it,
           jsonb_array_length(d.steps_en) as n_en
    from dishes d
    where jsonb_array_length(d.steps) in (3, 4)
    order by d.paese, d.meal_slot, d.name_en
  `);
  console.log(`\n${rows.length} piatti con 3-4 passaggi (candidati a questo blocco).\n`);

  const perPaese = new Map();
  for (const r of rows) perPaese.set(r.paese, (perPaese.get(r.paese) || 0) + 1);
  console.log('Per paese:');
  [...perPaese.entries()].sort((a, b) => b[1] - a[1]).forEach(([p, n]) => console.log(`  ${n}  ${p}`));

  require('fs').writeFileSync('piatti-3-4-passaggi.json', JSON.stringify(rows, null, 1));
  console.log('\nElenco completo in piatti-3-4-passaggi.json.');

  await c.end();
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
