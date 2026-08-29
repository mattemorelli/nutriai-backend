require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva } = require('./genera');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';

(async () => {
  const t0 = Date.now();
  try {
    const r = await generaESalva(supabase, USER_ID);
    console.log('OK in', ((Date.now() - t0) / 1000).toFixed(1), 's');
    console.log(r);
  } catch (e) {
    console.error('ERRORE dopo', ((Date.now() - t0) / 1000).toFixed(1), 's:', e.message);
  }
})();