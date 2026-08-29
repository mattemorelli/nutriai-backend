require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { saltaPasto } = require('./sostituisci');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const ITEM_ID = '7047a92e-b334-4e2e-9007-21ea64045855';

(async () => {
  try {
    console.log('Salto:', await saltaPasto(supabase, USER_ID, ITEM_ID));
    console.log('Annullo:', await saltaPasto(supabase, USER_ID, ITEM_ID, true));
  } catch (e) {
    console.error('ERRORE:', e.message);
  }
})();