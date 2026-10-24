// Backup, SOLA LETTURA: salva lo stato attuale delle due tabelle toccate
// dalla migrazione 2026-10-22-categorie-pane-patate.sql, prima di lanciarla.
// Uso: node migrazioni/backup-2026-10-22-categorie-pane-patate.js
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

(async () => {
  const { data: categorie, error: e1 } = await supabase.from('categorie').select('*');
  if (e1) throw new Error('lettura categorie: ' + e1.message);
  const { data: categorieAlimenti, error: e2 } = await supabase.from('categorie_alimenti').select('*');
  if (e2) throw new Error('lettura categorie_alimenti: ' + e2.message);

  const dump = { quando: new Date().toISOString(), categorie, categorie_alimenti: categorieAlimenti };
  const file = `migrazioni/backup-2026-10-22-categorie-pane-patate-${Date.now()}.json`;
  fs.writeFileSync(file, JSON.stringify(dump, null, 2));
  console.log(`Backup salvato in ${file}: ${categorie.length} righe categorie, ${categorieAlimenti.length} righe categorie_alimenti.`);
})();
