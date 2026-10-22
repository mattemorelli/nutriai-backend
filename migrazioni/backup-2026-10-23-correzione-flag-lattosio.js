// Backup, SOLA LETTURA: salva la riga esatta prima della correzione
// 2026-10-23-correzione-flag-lattosio.sql.
// Uso: node migrazioni/backup-2026-10-23-correzione-flag-lattosio.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const ID = 'fe1eb556-ecb4-429f-9c9a-0f34a38347e5';

(async () => {
  const { data, error } = await supabase.from('dishes').select('*').eq('id', ID);
  if (error) throw new Error('lettura dishes: ' + error.message);
  if (!data.length) throw new Error(`FERMO: il piatto ${ID} non esiste - niente da correggere, controlla prima di procedere.`);
  console.log(`OK: trovata 1 riga (${data[0].name}), contiene_lattosio attuale = ${data[0].contiene_lattosio}.`);

  const file = `migrazioni/backup-2026-10-23-correzione-flag-lattosio-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify({ quando: new Date().toISOString(), dishes: data }, null, 2));
  console.log(`Backup salvato in ${file}.`);
})();
