require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { ritratto, carbonioSettimanale, mappaPaesi } = require('./tu');

const CHIAVE = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(process.env.SUPABASE_URL, CHIAVE);

const userId = process.argv[2];
const isPro = process.argv[3] !== 'false';

(async () => {
  console.log('--- ritratto (pro=' + isPro + ') ---');
  console.log(JSON.stringify(await ritratto(supabase, userId, isPro), null, 2));
  console.log('--- carbonioSettimanale ---');
  console.log(JSON.stringify(await carbonioSettimanale(supabase, userId), null, 2));
  console.log('--- mappaPaesi ---');
  console.log(JSON.stringify(await mappaPaesi(supabase, userId), null, 2));
})().catch(e => { console.error('ERRORE:', e); process.exit(1); });
