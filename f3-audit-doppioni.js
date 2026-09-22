// f3-audit-doppioni.js — SOLA LETTURA, non scrive/corregge niente.
// Per ognuno dei 34 gruppi nome+paese duplicati: id, nome, meal_slot,
// paese, health_score e la lista ingredienti+grammi di ciascuna riga.
// Classifica ogni gruppo come "IDENTICI" (stessi food_id in entrambe le
// righe) o "DIVERSI" (da guardare - puo' essere il difetto di "Trota alle
// mandorle": una riga corretta, una a cui manca l'ingrediente del nome).
// In coda, gli stessi dati per i 5 piatti gia' trovati senza l'ingrediente
// del nome (non duplicati, ma stesso difetto).
require('dotenv').config();
const { Client } = require('pg');

const NOMI_GIA_TROVATI = [
  'Lenticchie alla francese', 'Lenticchie alla spagnola', 'Zuppa di lenticchie',
  'Insalata di lenticchie e caprino', 'Seppie in umido',
];

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  try {
    const { rows: gruppi } = await c.query(`
      select name, paese, array_agg(id order by id) as ids
      from dishes group by name, paese having count(*) > 1 order by name
    `);

    const tuttiGliId = [...gruppi.flatMap(g => g.ids), ...(await c.query(
      `select id from dishes where name = any($1::text[])`, [NOMI_GIA_TROVATI]
    )).rows.map(r => r.id)];

    const { rows: piattiInfo } = await c.query(
      `select id, name, meal_slot, paese, health_score from dishes where id = any($1::uuid[])`,
      [tuttiGliId]
    );
    const infoDi = Object.fromEntries(piattiInfo.map(p => [p.id, p]));

    const { rows: ing } = await c.query(
      `select i.dish_id, i.food_id, i.grams, f.name_it, f.name
         from dish_ingredients i join foods f on f.id = i.food_id
        where i.dish_id = any($1::uuid[])
        order by i.dish_id, i.grams desc`,
      [tuttiGliId]
    );
    const ingredientiDi = {};
    for (const r of ing) (ingredientiDi[r.dish_id] ||= []).push({ food_id: r.food_id, nome: r.name_it || r.name, grams: Number(r.grams) });

    const stampaRiga = (id) => {
      const p = infoDi[id];
      console.log(`  [${id}] slot=${p.meal_slot} paese=${p.paese} salute=${p.health_score}`);
      for (const i of (ingredientiDi[id] || [])) console.log(`      ${i.nome.padEnd(35)} ${i.grams}g  (${i.food_id})`);
    };

    let identici = 0, diversi = 0;
    console.log(`=== ${gruppi.length} gruppi duplicati (nome+paese) ===\n`);
    for (const g of gruppi) {
      const setPerRiga = g.ids.map(id => new Set((ingredientiDi[id] || []).map(i => i.food_id)));
      let tutteUguali = true;
      for (let i = 1; i < setPerRiga.length; i++) {
        if (setPerRiga[i].size !== setPerRiga[0].size || [...setPerRiga[0]].some(x => !setPerRiga[i].has(x))) tutteUguali = false;
      }
      if (tutteUguali) identici++; else diversi++;

      console.log(`--- "${g.name}" (${g.paese}) — ${g.ids.length} righe — ${tutteUguali ? 'IDENTICI' : 'DIVERSI (guardare)'} ---`);
      for (const id of g.ids) stampaRiga(id);
      console.log('');
    }

    console.log(`\n=== Riepilogo duplicati: ${identici} gruppi con ingredienti identici, ${diversi} con ingredienti diversi (da guardare) ===\n`);

    console.log(`=== I 5 piatti gia' trovati senza l'ingrediente del nome (non duplicati) ===\n`);
    for (const nome of NOMI_GIA_TROVATI) {
      const id = piattiInfo.find(p => p.name === nome)?.id;
      if (!id) { console.log(`  "${nome}": NON TROVATO`); continue; }
      console.log(`--- "${nome}" ---`);
      stampaRiga(id);
      console.log('');
    }
  } finally {
    await c.end();
  }
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
