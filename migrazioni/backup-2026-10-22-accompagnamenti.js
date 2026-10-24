// Backup, SOLA LETTURA: salva lo stato attuale (prima dell'inserimento) dei
// 9 id che la migrazione 2026-10-22-accompagnamenti-pane-patate.sql sta per
// usare - per costruzione sono nuovi, quindi il backup atteso è "nessuna
// riga trovata" (conferma che non si sta per sovrascrivere nulla).
// Uso: node migrazioni/backup-2026-10-22-accompagnamenti.js
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const ID_NUOVI = [
  '40cc7014-35fb-4703-8e72-dd0a67d7488e', '310c3710-c4ed-44eb-930d-e9de7413d218',
  '1ea88888-90e2-4b78-9e89-6c7982e21a4e', '64be79c2-797d-45be-b728-cc9896e46c73',
  '950107bb-00a2-4b6b-9983-b01e4f8c779e', '37fa37d2-1706-42bf-b2a4-c071e6e777aa',
  '8b168db5-ea79-4fda-83b6-806d773462c5', 'e58925ab-a8f7-43c3-8363-7ae436c3a878',
  '9fd0677e-228e-4b27-a33a-f96c4247cae6',
];

(async () => {
  const { data: dishesEsistenti, error: e1 } = await supabase.from('dishes').select('*').in('id', ID_NUOVI);
  if (e1) throw new Error('lettura dishes: ' + e1.message);
  const { data: ingredientiEsistenti, error: e2 } = await supabase.from('dish_ingredients').select('*').in('dish_id', ID_NUOVI);
  if (e2) throw new Error('lettura dish_ingredients: ' + e2.message);

  if (dishesEsistenti.length || ingredientiEsistenti.length) {
    console.log('ATTENZIONE: alcuni di questi id esistono già - la migrazione li salterebbe (on conflict do nothing), ma controlla prima di procedere:');
    console.log(JSON.stringify({ dishesEsistenti, ingredientiEsistenti }, null, 2));
  } else {
    console.log('OK: nessuno dei 9 id esiste già. Nessuna riga da salvare (non c\'è nulla da sovrascrivere).');
  }

  const file = `migrazioni/backup-2026-10-22-accompagnamenti-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify({ quando: new Date().toISOString(), dishesEsistenti, ingredientiEsistenti }, null, 2));
  console.log(`Backup salvato in ${file}.`);
})();
