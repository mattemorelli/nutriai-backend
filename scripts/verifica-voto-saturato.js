// Controllo permanente, SOLA LETTURA: segnala (non blocca) i piatti il cui
// voto salute e' rimasto esattamente al soffitto calcolato da voto-piatti.js
// (formula v3) senza mai essere calibrato a mano. Nato il 25 ottobre 2026:
// la formula e' pensata come un ALLARME (sopra una certa soglia di qualita'
// nutrizionale satura sempre a 10, senza distinguere un piatto buono da uno
// ottimo) - i voti veri si danno a mano, confrontando con piatti simili
// gia' in catalogo, nella fascia alta ma differenziata (vedi l'audit del 25
// ottobre: 18 piatti recenti, lotto delle "cene veloci" e lotto 02, erano
// rimasti bloccati esattamente a 10 o vicino, mai calibrati).
//
// Un piatto con voto=10 NON e' sempre un errore (potrebbe essere stato
// calibrato a mano a 10 di proposito), ma e' un segnale da controllare: se
// e' anche il valore che la formula calcolerebbe da sola (saturato), quasi
// certamente nessuno l'ha mai guardato a mano.
//
// Uso: node scripts/verifica-voto-saturato.js
// Esce con codice diverso da 0 solo se trova errori reali di calcolo
// (dati mancanti); i voti saturati sono sempre un AVVISO, mai un blocco -
// la calibrazione a mano e' un giudizio, non una regola automatica.
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

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
const fra = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));
const punto = (densita, soglia) => 10 - 9 * fra(densita, soglia, soglia * QUANTE_VOLTE_IL_LIMITE);
const puntoProcessata = (densita) => 10 - 9 * fra(densita, 0, SOGLIE.processata);
const KCAL_PAVIMENTO = 150;
function votoCalcolato(v, salsaIndustriale) {
  if (!v.kcal || v.kcal <= 0) return null;
  const kcalDensita = Math.max(v.kcal, KCAL_PAVIMENTO);
  const per100 = (x) => x / kcalDensita * 100;
  const dSat = per100(v.satFat), dSale = per100(v.salt), dFibra = per100(v.fibre);
  const voci = {
    sat: punto(dSat, SOGLIE.sat), sale: punto(dSale, SOGLIE.sale),
    processata: puntoProcessata(0), salse: salsaIndustriale ? 2 : 10,
  };
  const bonus = Math.min(1, dFibra / SOGLIE.fibra) * BONUS_FIBRA_MAX;
  let voto = PESI.sat * voci.sat + PESI.sale * voci.sale + PESI.processata * voci.processata + PESI.salse * voci.salse + bonus;
  const critiche = Object.entries(voci).filter(([k, p]) => p < VOCE_CRITICA && VOCI_CON_TETTO.has(k)).map(([k]) => k);
  if (critiche.length) voto = Math.min(voto, TETTO_SE_CRITICA);
  return Math.round(Math.max(1, Math.min(10, voto)) * 10) / 10;
}

async function leggiTutto(query) {
  const PAGINA = 1000;
  let risultato = [];
  for (let offset = 0; ; offset += PAGINA) {
    const { data, error } = await query.range(offset, offset + PAGINA - 1);
    if (error) throw error;
    risultato = risultato.concat(data);
    if (data.length < PAGINA) break;
  }
  return risultato;
}

(async () => {
  const piatti = await leggiTutto(supabase.from('dishes').select('id, name, health_score, salsa_industriale').contains('mercati', ['it']).order('id'));
  const ingredienti = await leggiTutto(supabase.from('dish_ingredients').select('dish_id, food_id, grams').order('dish_id').order('food_id'));
  const foodIds = [...new Set(ingredienti.map((i) => i.food_id))];
  const foods = await leggiTutto(supabase.from('foods').select('id, kcal_100g, protein_100g, fat_100g, sat_fat_100g, fibre_100g, salt_100g').in('id', foodIds).order('id'));
  const foodDi = Object.fromEntries(foods.map((f) => [f.id, f]));

  const perDish = {};
  for (const i of ingredienti) (perDish[i.dish_id] ||= []).push(i);

  const saturati = [];
  let senzaIngredienti = 0;

  for (const p of piatti) {
    const righe = perDish[p.id];
    if (!righe || !righe.length) { senzaIngredienti++; continue; }
    let kcal = 0, satFat = 0, fibre = 0, salt = 0;
    for (const r of righe) {
      const f = foodDi[r.food_id];
      if (!f) continue;
      const k = r.grams / 100;
      kcal += (Number(f.kcal_100g) || 0) * k;
      satFat += (Number(f.sat_fat_100g) || 0) * k;
      fibre += (Number(f.fibre_100g) || 0) * k;
      salt += (Number(f.salt_100g) || 0) * k;
    }
    const calcolato = votoCalcolato({ kcal, satFat, fibre, salt }, p.salsa_industriale);
    if (calcolato === 10 && Number(p.health_score) === 10) {
      saturati.push({ id: p.id, nome: p.name });
    }
  }

  console.log(`${piatti.length} piatti del mercato 'it' controllati.`);
  if (senzaIngredienti) console.log(`(${senzaIngredienti} senza dish_ingredients, saltati)`);

  if (saturati.length) {
    console.log(`\n${saturati.length} piatti con voto salute esattamente 10, uguale al voto calcolato saturato (avviso, non bloccante - probabile voto mai calibrato a mano):`);
    for (const s of saturati) console.log(`  - [${s.id}] ${s.nome}`);
  } else {
    console.log(`\nNessun piatto con voto saturato a 10 mai calibrato a mano.`);
  }
})().catch((e) => { console.error('ERRORE:', e.message); process.exitCode = 1; });
