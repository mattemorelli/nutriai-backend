// scratch-voto-dish.js — SOLA LETTURA. Riusa la formula esatta di voto-piatti.js
// per calcolare il voto di uno o piu' piatti specifici (prima/dopo un cambio ingredienti).
require('dotenv').config({ quiet: true });
const { Client } = require('pg');

const LIMITI_GIORNO = { satMax: 29, saleMax: 5, fibraMin: 25 };
const KCAL_RIFERIMENTO = 2300;
const CARNE_PROCESSATA_GIORNO = 50;
const SOGLIE = {
  sat: LIMITI_GIORNO.satMax / KCAL_RIFERIMENTO * 100,
  sale: LIMITI_GIORNO.saleMax / KCAL_RIFERIMENTO * 100,
  fibra: LIMITI_GIORNO.fibraMin / KCAL_RIFERIMENTO * 100,
  processata: CARNE_PROCESSATA_GIORNO / KCAL_RIFERIMENTO * 100,
};
const PESI = { sat: 0.30, sale: 0.30, processata: 0.25, salse: 0.15 };
const BONUS_FIBRA_MAX = 1.0;
const QUANTE_VOLTE_IL_LIMITE = 4;
const VOCE_CRITICA = 3;
const TETTO_SE_CRITICA = 6.5;
const VOCI_CON_TETTO = new Set(['sat', 'sale', 'processata']);
const KCAL_PAVIMENTO = 150;

const fra = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));
const punto = (densita, soglia) => 10 - 9 * fra(densita, soglia, soglia * QUANTE_VOLTE_IL_LIMITE);
const puntoProcessata = (densita) => 10 - 9 * fra(densita, 0, SOGLIE.processata);

function votoCalcolato(v, salsaIndustriale) {
  if (!v.kcal || v.kcal <= 0) return null;
  const kcalDensita = Math.max(v.kcal, KCAL_PAVIMENTO);
  const per100 = (x) => x / kcalDensita * 100;
  const dSat = per100(v.satFat), dSale = per100(v.salt);
  const dFibra = per100(v.fibre), dProc = per100(v.grammiProcessata);
  const voci = {
    sat: punto(dSat, SOGLIE.sat),
    sale: punto(dSale, SOGLIE.sale),
    processata: puntoProcessata(dProc),
    salse: salsaIndustriale ? 2 : 10,
  };
  const bonus = Math.min(1, dFibra / SOGLIE.fibra) * BONUS_FIBRA_MAX;
  let voto = PESI.sat * voci.sat + PESI.sale * voci.sale + PESI.processata * voci.processata + PESI.salse * voci.salse + bonus;
  const critiche = Object.entries(voci).filter(([k, p]) => p < VOCE_CRITICA && VOCI_CON_TETTO.has(k)).map(([k]) => k);
  if (critiche.length) voto = Math.min(voto, TETTO_SE_CRITICA);
  return { voto: Math.round(Math.max(1, Math.min(10, voto)) * 10) / 10, critiche };
}

async function main() {
  const ids = process.argv.slice(2);
  if (!ids.length) { console.error('Uso: node scratch-voto-dish.js <dish_id> [dish_id...]'); process.exit(1); }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows: catRighe } = await client.query("select food_id from categorie_alimenti where categoria = 'carne_processata'");
  const processata = new Set(catRighe.map(r => String(r.food_id)));

  const { rows } = await client.query(`
    select d.id, d.name, d.salsa_industriale,
           i.food_id, i.grams, f.kcal_100g, f.sat_fat_100g, f.fibre_100g, f.salt_100g
    from dishes d join dish_ingredients i on i.dish_id = d.id join foods f on f.id = i.food_id
    where d.id = ANY($1::uuid[])
  `, [ids]);

  const piatti = new Map();
  for (const r of rows) {
    if (!piatti.has(r.id)) piatti.set(r.id, { id: r.id, nome: r.name, salsa: r.salsa_industriale, v: { kcal: 0, satFat: 0, fibre: 0, salt: 0, grammiProcessata: 0 } });
    const p = piatti.get(r.id);
    const g = Number(r.grams);
    const k = g / 100;
    p.v.kcal += Number(r.kcal_100g || 0) * k;
    p.v.satFat += Number(r.sat_fat_100g || 0) * k;
    p.v.fibre += Number(r.fibre_100g || 0) * k;
    p.v.salt += Number(r.salt_100g || 0) * k;
    if (processata.has(String(r.food_id))) p.v.grammiProcessata += g;
  }

  for (const p of piatti.values()) {
    const calc = votoCalcolato(p.v, p.salsa);
    console.log(`${p.nome} (${p.id}): voto calcolato = ${calc ? calc.voto : 'n/d'}${calc && calc.critiche.length ? ' [tetto: ' + calc.critiche.join(',') + ']' : ''}`);
  }
  await client.end();
}
main().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
