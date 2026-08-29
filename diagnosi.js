require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

(async () => {
  const { data: piatti } = await supabase
    .from('dishes')
    .select('id, name, meal_slot, profilo, prep_min, tecnica, health_score, contiene_glutine')
    .eq('meal_slot', 'secondo');

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