// trova-voti-fuori-scala.js — SOLA LETTURA. Elenca i piatti con
// health_score che non sta su nessuna fascia della regola 2 di CLAUDE.md
// (verdure crude/vapore 9.0-9.4, legumi 9.0-9.4, pesce magro 8.8-9.3,
// pollame 8.5-9.1, uova 8.0-8.7, carne rossa 7.8-8.4, pane/patate 8.0-8.6,
// dolci mai sopra 7.5): un voto piatto a 10 non e' su nessuna di queste
// fasce, qualunque sia il piatto. Non assegna un voto nuovo - serve solo a
// trovarli, la scelta della fascia giusta per ciascuno resta a chi legge
// il piatto (serve sapere cosa contiene davvero, non solo il meal_slot).
//
// Uso: node trova-voti-fuori-scala.js
require('dotenv').config({ quiet: true });
const { Client } = require('pg');

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const { rows } = await c.query(`
    select d.id, d.name, d.name_en, d.meal_slot, d.paese, d.health_score,
           array_agg(f.name_en order by i.grams desc) as ingredienti
    from dishes d
    join dish_ingredients i on i.dish_id = d.id
    join foods f on f.id = i.food_id
    where d.health_score = 10
    group by d.id, d.name, d.name_en, d.meal_slot, d.paese, d.health_score
    order by d.meal_slot, d.name_en
  `);

  console.log(`${rows.length} piatti con health_score = 10\n`);
  for (const r of rows) {
    console.log(`${(r.name_en || r.name).padEnd(45)} ${String(r.meal_slot || '').padEnd(10)} ${r.ingredienti.slice(0, 4).join(', ')}`);
  }

  await c.end();
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
