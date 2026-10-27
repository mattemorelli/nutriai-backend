// Correzione mirata del caso trovato dall'audit, con controllo degli
// ingredienti reali, copia preventiva e transazione. Non aggiunge alimenti.
require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ID = '33333333-0001-0001-0001-000000000001';
const steps = [
  'Lava i pomodori sotto acqua corrente per rimuovere le impurità dalla superficie.',
  'Taglia i pomodori a cubetti piccoli e simili, perché cuociano in modo uniforme.',
  'Scalda l’olio in una padella a fuoco medio per 1 min, senza farlo fumare.',
  'Cuoci i pomodori nella padella per 8-10 min, finché sono morbidi e il sugo si addensa.',
  'Mentre il sugo cuoce, porta a bollore l’acqua in una pentola senza aggiungere sale: il parmigiano insaporirà il piatto.',
  'Mentre il sugo continua a cuocere, cuoci la pasta nell’acqua bollente per il tempo in min indicato sulla confezione, fino a quando è al dente.',
  'Scola la pasta appena è al dente, per evitare che continui a cuocere nell’acqua calda.',
  'Condisci la pasta con il sugo e il parmigiano fuori dal fuoco, perché il formaggio si distribuisca senza attaccarsi al fondo.',
];
const stepsEn = [
  'Wash the tomatoes under running water to remove surface impurities.',
  'Cut the tomatoes into small, similar-sized cubes so they cook evenly.',
  'Heat the oil in a pan over medium heat for 1 min, without letting it smoke.',
  'Cook the tomatoes in the pan for 8-10 min, until soft and the sauce thickens.',
  'While the sauce cooks, bring water to the boil in a pot without adding salt: the parmesan will season the dish.',
  'While the sauce continues to cook, cook the pasta in the boiling water for the time in min stated on the package, until al dente.',
  'Drain the pasta as soon as it is al dente, to stop it cooking further in the hot water.',
  'Dress the pasta with the sauce and parmesan off the heat, so the cheese spreads without sticking to the pan.',
];
async function main() {
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
  try {
    await db.connect(); await db.query('BEGIN');
    const { rows: [prima] } = await db.query('SELECT * FROM dishes WHERE id=$1 FOR UPDATE', [ID]);
    assert.equal(prima?.name, 'Pasta al pomodoro e parmigiano');
    const { rows: ingredienti } = await db.query('SELECT food_id,grams FROM dish_ingredients WHERE dish_id=$1 ORDER BY food_id FOR SHARE', [ID]);
    assert.deepEqual(ingredienti.map(r=>[r.food_id,Number(r.grams)]), [['169736',120],['170457',200],['170848',15],['171413',15]]);
    // Regola 9 AGENTS: pomodoro dominante 200g; pasta 120g supera 40g.
    // Parmigiano: 4.95g proteine su 22.358g, sotto 10g e sotto 25%.
    const nuovo = { ruolo_primario: 'verdura', ruoli_coperti: ['base_amidacea', 'verdura'], ha_proteina: false, steps, steps_en: stepsEn };
    if (!process.argv.includes('--apply')) { console.log(JSON.stringify({ id: ID, nuovo }, null, 2)); await db.query('ROLLBACK'); return; }
    const backup = process.argv.find(a=>a.startsWith('--backup='));
    assert.ok(backup, 'Specificare --backup=percorso prima della scrittura');
    assert.ok(prima.ruolo_primario == null && prima.ruoli_coperti == null, 'Il piatto è già stato classificato: controllare prima di sovrascrivere');
    fs.writeFileSync(backup.slice(9), JSON.stringify({ prima, ingredienti, nuovo }, null, 2), { flag: 'wx' });
    await db.query('UPDATE dishes SET ruolo_primario=$2,ruoli_coperti=$3,ha_proteina=$4,steps=$5::jsonb,steps_en=$6::jsonb WHERE id=$1',
      [ID, nuovo.ruolo_primario, nuovo.ruoli_coperti, nuovo.ha_proteina, JSON.stringify(steps), JSON.stringify(stepsEn)]);
    const { rows: [dopo] } = await db.query('SELECT ruolo_primario,ruoli_coperti,ha_proteina,jsonb_array_length(steps) AS it,jsonb_array_length(steps_en) AS en FROM dishes WHERE id=$1', [ID]);
    assert.equal(dopo.ruolo_primario, 'verdura'); assert.equal(dopo.ha_proteina, false); assert.equal(dopo.it, 8); assert.equal(dopo.en, 8);
    await db.query('COMMIT'); console.log('Una ricetta corretta e riletta; copia preventiva salvata.');
  } catch (e) { await db.query('ROLLBACK').catch(()=>{}); throw e; }
  finally { await db.end(); }
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
