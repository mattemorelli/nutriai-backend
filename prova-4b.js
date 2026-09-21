// prova-4b.js — collaudo del gradino 4b: le preferenze cedono, le allergie no.
// Mette cinque preferenze impossibili sull'utente di test, misura, e le toglie.
// Uso: node prova-4b.js <USER_ID di test>

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generaESalva } = require('./genera.js');
const crypto = require('crypto');

const USER_ID = process.argv[2];
if (!USER_ID) { console.error('Uso: node prova-4b.js <USER_ID di test>'); process.exit(1); }

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const MARCHIO = 'PROVA4B';
const CATEGORIE = ['pesce', 'crostacei', 'molluschi', 'carne_rossa',
                   'carne_bianca', 'legumi', 'soia', 'uova'];

async function pulisci() {
  const { data, error } = await supabase
    .from('user_constraints')
    .delete()
    .eq('user_id', USER_ID)
    .like('subject', `${MARCHIO}%`)
    .select('id');
  if (error) { console.error(`PULIZIA FALLITA: ${error.message}`); return; }
  console.log(`\nPulizia: ${(data || []).length} righe di prova rimosse.`);
}

(async () => {
  // Se un giro precedente si e' interrotto, si riparte pulito.
  await pulisci();

  const righe = CATEGORIE.map((c) => ({
    id: crypto.randomUUID(),
    user_id: USER_ID,
    kind: 'non_gradito',
    severity: 'preferibile',
    subject: `${MARCHIO} ${c}`,
    categoria: c,
    food_id: null,
    declared_at: new Date().toISOString()
  }));

  const { error } = await supabase.from('user_constraints').insert(righe);
  if (error) { console.error(`FERMO: inserimento fallito — ${error.message}`); process.exit(1); }
  console.log(`Inserite ${righe.length} preferenze di prova: ${CATEGORIE.join(', ')}\n`);

  try {
    for (const seed of [1, 2, 3]) {
      console.log(`--- seed ${seed} ---`);
      try {
        const esito = await generaESalva(supabase, USER_ID, seed, { salva: false });

        if (esito.plan_id) {
          console.error(`FERMO: ha scritto il piano ${esito.plan_id} in modo prova.`);
          break;
        }

        const preferenze = (esito.concessioni || []).filter(
          (c) => c.vincolo === 'preferenza_non_gradita'
        );

        console.log(`  gradino raggiunto: ${esito.gradino}`);
        console.log(`  giorni conformi:   ${esito.giorni_conformi}`);
        console.log(`  gruppi usati:      ${JSON.stringify(esito.uso_gruppi)}`);
        console.log(`  concessioni 'preferenza_non_gradita': ${preferenze.length}`);
        for (const c of preferenze.slice(0, 7)) {
          console.log(`    ${c.prima} -> ${c.dopo}${c.giorno != null ? ` (giorno ${c.giorno})` : ''}`);
        }
        const altre = (esito.concessioni || []).filter((c) => c.vincolo !== 'preferenza_non_gradita');
        console.log(`  altre concessioni: ${altre.length ? altre.map((c) => c.vincolo).join(', ') : 'nessuna'}`);
      } catch (e) {
        console.error(`  ERRORE: ${e.message}`);
      }
    }
  } finally {
    await pulisci();
  }
})();
