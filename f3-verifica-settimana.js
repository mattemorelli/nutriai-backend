// Fase 3 - genera una settimana vera con generaESalva (non una
// reimplementazione) e controlla che i gruppi proteici dei secondi
// rispettino QUOTE. Sola lettura sul risultato, una sola scrittura vera:
// il piano stesso, sull'utente di test condiviso gia' usato in sessione.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { generaESalva, QUOTE } = require('./genera.js');

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const { assertUtenteDiTest } = require('./test-users');
assertUtenteDiTest(USER_ID);

(async () => {
  await supabase.from('users').update({
    diet: 'onnivoro', paesi: ['italia'], cook_days: [1, 2, 3, 4, 5, 6, 7],
    lunch_away: false, evening_minutes: 45, household_size: 2,
  }).eq('id', USER_ID);
  await supabase.from('user_cuisine_preferences').delete().eq('user_id', USER_ID);
  await supabase.from('user_cuisine_preferences').insert([{ user_id: USER_ID, cucina: 'europea', rank: 1 }]);

  const r = await generaESalva(supabase, USER_ID, 950001);
  console.log(`Generata: gradino ${r.gradino}, concessioni ${r.concessioni.length}, plan_id ${r.plan_id}`);

  const { data: righe } = await supabase
    .from('plan_items')
    .select('day_of_week, meal, slot, dish_id, dishes(name)')
    .eq('plan_id', r.plan_id)
    .eq('slot', 'secondo')
    .order('day_of_week');

  // Ricalcolo il gruppo con la stessa logica category-first di genera.js,
  // sola lettura, per vedere cosa la settimana ha davvero scelto.
  const { Client } = require('pg');
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const { rows: cats } = await c.query('select food_id, categoria from categorie_alimenti');
  const categorieDi = {};
  for (const row of cats) (categorieDi[row.food_id] ||= new Set()).add(row.categoria);

  const ids = righe.map(r => r.dish_id);
  const { rows: ing } = await c.query(
    `select i.dish_id, i.food_id, i.grams, f.name, f.protein_100g
       from dish_ingredients i join foods f on f.id = i.food_id
      where i.dish_id = any($1::uuid[])`,
    [ids]
  );
  await c.end();

  const ingredientiPer = {};
  for (const r2 of ing) (ingredientiPer[r2.dish_id] ||= []).push({ food_id: r2.food_id, grams: Number(r2.grams), protein_100g: Number(r2.protein_100g || 0), nome: r2.name });

  const GRUPPO_DA_CATEGORIA = [
    ['pesce', ['pesce', 'crostacei', 'molluschi']],
    ['carne_rossa', ['carne_rossa', 'maiale']],
    ['carne_bianca', ['carne_bianca']],
    ['uova', ['uova']],
    ['legumi', ['legumi', 'soia']],
    ['formaggio', ['latticini']],
  ];
  function ancoraProteica(ingredienti) {
    const con = ingredienti.map(i => ({ ...i, proteina: (i.protein_100g || 0) * i.grams / 100 })).filter(i => i.proteina > 0).sort((a, b) => b.proteina - a.proteina);
    if (!con.length) return null;
    const tot = con.reduce((s, i) => s + i.proteina, 0);
    const p = con[0];
    if (p.proteina >= 10 || (tot > 0 && p.proteina / tot >= 0.25)) return p;
    return null;
  }
  function gruppoCategoria(ingredienti) {
    const a = ancoraProteica(ingredienti);
    if (!a) return null;
    const cat = categorieDi[a.food_id];
    if (!cat) return null;
    for (const [g, cs] of GRUPPO_DA_CATEGORIA) if (cs.some(x => cat.has(x))) return g;
    return null;
  }

  console.log('\n=== secondi della settimana generata ===');
  const conteggio = {};
  for (const r3 of righe) {
    const g = gruppoCategoria(ingredientiPer[r3.dish_id] || []) || 'nessuno';
    conteggio[g] = (conteggio[g] || 0) + 1;
    console.log(`  giorno ${r3.day_of_week} ${r3.meal.padEnd(8)} ${(r3.dishes && r3.dishes.name || '').slice(0, 45).padEnd(47)} gruppo: ${g}`);
  }

  console.log('\n=== conteggio per gruppo vs QUOTE ===');
  for (const [g, q] of Object.entries(QUOTE)) {
    const n = conteggio[g] || 0;
    const ok = n >= q.min && n <= q.max;
    console.log(`  ${g.padEnd(14)} trovati=${n}  QUOTE min=${q.min} max=${q.max}  ${ok ? 'OK' : 'FUORI QUOTA'}`);
  }
  if (conteggio['nessuno']) console.log(`  (senza gruppo: ${conteggio['nessuno']})`);
})();
