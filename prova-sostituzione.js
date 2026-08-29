require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { trovaProposte, applicaSostituzione } = require('./sostituisci');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const USER_ID = 'b8b2e50e-508d-4591-83ba-aea7b88fe27b';
const ITEM_ID = '7047a92e-b334-4e2e-9007-21ea64045855';

(async () => {
  try {
    const r = await trovaProposte(supabase, USER_ID, ITEM_ID);
    console.log('\nDa sostituire:', r.originale, '\n');
    for (const p of r.proposte) {
      console.log(
        (p.nome || '').padEnd(46),
        String(p.minuti || '?').padStart(3) + ' min',
        ' voto ' + p.voto,
        ' ' + p.portion_g + ' g'
      );
    }

    // applica la prima proposta
    const scelta = r.proposte[0];
    const esito = await applicaSostituzione(
      supabase, USER_ID, ITEM_ID, scelta.dish_id, scelta.portion_g
    );
    console.log('\nApplicata:', scelta.nome, '->', esito.ok);
  } catch (e) {
    console.error('ERRORE:', e.message);
  }
})();