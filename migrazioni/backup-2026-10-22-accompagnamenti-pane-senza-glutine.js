// Backup, SOLA LETTURA: salva lo stato attuale (prima dell'inserimento) dei
// 3 id nuovi che 2026-10-22-accompagnamenti-pane-senza-glutine.sql sta per
// usare, più le eventuali righe categorie_alimenti già presenti per gli
// stessi food_id (gallette_riso_it, 167557, polenta_it) - per costruzione
// nuovi, quindi il backup atteso è "nessuna riga trovata" su entrambi i
// fronti (conferma che non si sta per sovrascrivere nulla).
// Uso: node migrazioni/backup-2026-10-22-accompagnamenti-pane-senza-glutine.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const ID_NUOVI = [
  '9560b1b7-e1d6-40f2-9331-788dee9b6208',
  'a27106fb-e60f-44c7-86f8-faa8ac121ce4',
  '0e1b7e2e-769e-4dbb-aded-fee28989712f',
];
const FOOD_ID_TOCCATI = ['gallette_riso_it', '167557', 'polenta_it'];

(async () => {
  const { data: dishesEsistenti, error: e1 } = await supabase.from('dishes').select('*').in('id', ID_NUOVI);
  if (e1) throw new Error('lettura dishes: ' + e1.message);
  const { data: ingredientiEsistenti, error: e2 } = await supabase.from('dish_ingredients').select('*').in('dish_id', ID_NUOVI);
  if (e2) throw new Error('lettura dish_ingredients: ' + e2.message);
  const { data: categorieEsistenti, error: e3 } = await supabase.from('categorie_alimenti').select('*')
    .eq('categoria', 'pane').in('food_id', FOOD_ID_TOCCATI);
  if (e3) throw new Error('lettura categorie_alimenti: ' + e3.message);

  if (dishesEsistenti.length || ingredientiEsistenti.length || categorieEsistenti.length) {
    console.log('ATTENZIONE: qualcosa esiste già - la migrazione lo salterebbe (on conflict do nothing), ma controlla prima di procedere:');
    console.log(JSON.stringify({ dishesEsistenti, ingredientiEsistenti, categorieEsistenti }, null, 2));
  } else {
    console.log('OK: nessuno dei 3 id/righe esiste già. Nessuna riga da salvare (non c\'è nulla da sovrascrivere).');
  }

  const file = `migrazioni/backup-2026-10-22-accompagnamenti-pane-senza-glutine-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify({ quando: new Date().toISOString(), dishesEsistenti, ingredientiEsistenti, categorieEsistenti }, null, 2));
  console.log(`Backup salvato in ${file}.`);
})();
