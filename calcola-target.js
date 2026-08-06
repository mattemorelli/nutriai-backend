require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { calcolaESalvaTarget } = require('./fabbisogno');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const EMAIL = process.argv[2];

if (!EMAIL) {
  console.error('Uso: node calcola-target.js tua@email.com');
  process.exit(1);
}

async function main() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error('Elenco utenti fallito: ' + error.message);

  const utente = data.users.find(function (u) { return u.email === EMAIL; });
  if (!utente) {
    console.error('Utente non trovato:', EMAIL);
    process.exit(1);
  }

  console.log('Utente:', utente.id);

  const target = await calcolaESalvaTarget(supabase, utente.id);
  console.log('Fabbisogno calcolato:', target.kcal, 'kcal');
}

main().catch(function (e) {
  console.error('Errore:', e.message);
  process.exit(1);
});