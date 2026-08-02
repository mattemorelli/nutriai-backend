require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// I tre limiti del corpus normativo — vedi claims/crea-lg-2018.json
const LIMITI = {
  satMaxGiorno: 29,     // crea-lg-2018-c040, ~10% di 2579 kcal
  saleMaxGiorno: 5,     // crea-lg-2018-c066
  fibraMinGiorno: 25,   // efsa-drv-e010 + crea-lg-2018-c025
};

async function calcolaPiatto(dishId) {
  const { data: ingredienti, error } = await supabase
    .from('dish_ingredients')
    .select('grams, foods (id, name, kcal_100g, protein_100g, fat_100g, sat_fat_100g, fibre_100g, salt_100g)')
    .eq('dish_id', dishId);

  if (error) throw error;

  const tot = { kcal: 0, protein: 0, fat: 0, satFat: 0, fibre: 0, salt: 0 };
  for (const riga of ingredienti) {
    const f = riga.foods;
    const fattore = riga.grams / 100;
    tot.kcal    += (f.kcal_100g    || 0) * fattore;
    tot.protein += (f.protein_100g || 0) * fattore;
    tot.fat     += (f.fat_100g     || 0) * fattore;
    tot.satFat  += (f.sat_fat_100g || 0) * fattore;
    tot.fibre   += (f.fibre_100g   || 0) * fattore;
    tot.salt    += (f.salt_100g    || 0) * fattore;
  }
  return tot;
}

async function generaSettimana() {
  const { data: piatti, error } = await supabase
    .from('dishes')
    .select('id, name, meal_slot')
    .order('name');

  if (error) throw error;

  console.log(`\nTrovati ${piatti.length} piatti nel database.\n`);

  let totSettimana = { kcal: 0, satFat: 0, fibre: 0, salt: 0 };

  for (const piatto of piatti) {
    const vals = await calcolaPiatto(piatto.id);
    totSettimana.kcal    += vals.kcal;
    totSettimana.satFat  += vals.satFat;
    totSettimana.fibre   += vals.fibre;
    totSettimana.salt    += vals.salt;

    console.log(
      `${piatto.name.padEnd(40)} ` +
      `${vals.kcal.toFixed(0).padStart(5)} kcal  ` +
      `sat ${vals.satFat.toFixed(1).padStart(5)}g  ` +
      `sale ${vals.salt.toFixed(2).padStart(5)}g  ` +
      `fibra ${vals.fibre.toFixed(1).padStart(5)}g`
    );
  }

  console.log('\n--- TOTALE (tutti i piatti sommati) ---');
  console.log(`kcal:  ${totSettimana.kcal.toFixed(0)}`);
  console.log(`sat:   ${totSettimana.satFat.toFixed(1)} g`);
  console.log(`sale:  ${totSettimana.salt.toFixed(2)} g`);
  console.log(`fibra: ${totSettimana.fibre.toFixed(1)} g`);
}

generaSettimana().catch(err => {
  console.error('Errore:', err.message);
});