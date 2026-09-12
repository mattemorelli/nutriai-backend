require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

// PostgREST impone un tetto di righe per risposta (di default 1000)
// indipendente da .limit(): i "secondo" sono gia' a 800+ e crescono, quindi
// va paginato con .range() invece di fidarsi che restino sotto la soglia.
async function paginaTutto(costruisciQuery) {
  const righe = [];
  const PAGINA = 1000;
  for (let offset = 0; ; offset += PAGINA) {
    const { data: blocco, error } = await costruisciQuery(offset, offset + PAGINA - 1);
    if (error) throw new Error(error.message);
    righe.push(...(blocco || []));
    if (!blocco || blocco.length < PAGINA) break;
  }
  return righe;
}

(async () => {
  const piatti = await paginaTutto((da, a) => supabase
    .from('dishes')
    .select('id, name, meal_slot, profilo, prep_min, tecnica, health_score, contiene_glutine')
    .eq('meal_slot', 'secondo')
    .order('id')
    .range(da, a));

  const passi = [
    ['tutti i secondi',    p => true],
    ['+ senza glutine',    p => !p.contiene_glutine],
    ['+ profilo non neutro', p => p.profilo && p.profilo !== 'neutro'],
    ['+ tecnica semplice', p => (p.tecnica || 'semplice') === 'semplice'],
    ['+ entro 40 min',     p => (p.prep_min || 30) <= 40],
    ['+ salute >= 7',      p => (p.health_score || 0) >= 7],
  ];

  let correnti = piatti;
  for (const [nome, f] of passi) {
    correnti = correnti.filter(f);
    console.log(nome.padEnd(24), correnti.length);
  }

  const perProfilo = {};
  for (const p of correnti) perProfilo[p.profilo] = (perProfilo[p.profilo] || 0) + 1;
  console.log('\nSecondi per profilo dopo tutti i filtri:');
  console.log(perProfilo);
})();