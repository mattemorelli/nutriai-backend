require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva } = require('./genera');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const USER_ID = 'c71e30a7-049a-48aa-96fb-b9d29b7d41ab';

(async () => {
  try {
    const r = await generaESalva(supabase, USER_ID);
    console.log('Fatto:', r && r.plan_id ? r.plan_id : r);
  } catch (e) {
    console.error('ERRORE:', e.message);
  }
  process.exit(0);
})();