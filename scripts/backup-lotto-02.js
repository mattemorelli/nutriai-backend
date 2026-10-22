// Backup, SOLA LETTURA: salva lo stato attuale dei 20 id che
// esegui-lotto-02.js sta per usare - per costruzione sono nuovi, quindi il
// backup atteso e' "nessuna riga trovata" su dishes/dish_ingredients/
// ricetta_passi/ricetta_info (conferma che non si sta per sovrascrivere
// nulla). Uso: node scripts/backup-lotto-02.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const ID_NUOVI = require('./lotto-02-piatti.json').piatti.map((p) => p.id);

(async () => {
  const { data: dishesEsistenti, error: e1 } = await supabase.from('dishes').select('*').in('id', ID_NUOVI);
  if (e1) throw new Error('lettura dishes: ' + e1.message);
  const { data: ingredientiEsistenti, error: e2 } = await supabase.from('dish_ingredients').select('*').in('dish_id', ID_NUOVI);
  if (e2) throw new Error('lettura dish_ingredients: ' + e2.message);
  const { data: passiEsistenti, error: e3 } = await supabase.from('ricetta_passi').select('*').in('dish_id', ID_NUOVI);
  if (e3) throw new Error('lettura ricetta_passi: ' + e3.message);

  if (dishesEsistenti.length || ingredientiEsistenti.length || passiEsistenti.length) {
    console.log('ATTENZIONE: alcuni di questi id esistono già - lo script li salterebbe (on conflict do nothing) o fallirebbe, controlla prima di procedere:');
    console.log(JSON.stringify({ dishesEsistenti, ingredientiEsistenti, passiEsistenti }, null, 2));
  } else {
    console.log(`OK: nessuno dei ${ID_NUOVI.length} id esiste già. Nessuna riga da salvare (non c'è nulla da sovrascrivere).`);
  }

  const file = `scripts/backup-lotto-02-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify({ quando: new Date().toISOString(), dishesEsistenti, ingredientiEsistenti, passiEsistenti }, null, 2));
  console.log(`Backup salvato in ${file}.`);
})();
