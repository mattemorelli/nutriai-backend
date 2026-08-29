require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { votoAlimento } = require('./voto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const CASI = [
  ['Uova marca X (gabbia)',        'uovo_grande_it', ['uova_codice_3']],
  ['Uova marca Y (a terra)',       'uovo_grande_it', ['uova_codice_2']],
  ['Uova marca Z (all\'aperto)',   'uovo_grande_it', ['uova_codice_1']],
  ['Uova marca W (bio)',           'uovo_grande_it', ['uova_codice_0', 'bio_ue', 'bio_ue_animale']],
  ['Uova sfuse, marca ignota',     'uovo_grande_it', []],
];

(async () => {
  for (const [etichetta, foodId, mods] of CASI) {
    try {
      const r = await votoAlimento(supabase, foodId, mods);
      console.log(
        '\n' + etichetta.padEnd(30),
        r.voto, ' ' + String(r.punteggio).padStart(3) + '/100',
        ' confidenza: ' + r.confidenza
      );
      for (const d of r.dettaglio) {
        const extra = d.modificatori.map(m =>
          `${m.punti > 0 ? '+' : ''}${m.punti} ${m.codice}`).join(', ');
        console.log(
          '   ' + d.componente.padEnd(14),
          (d.delta > 0 ? '+' : '') + String(d.delta).padStart(3),
          `(peso ${d.peso})`.padEnd(11),
          extra
        );
      }
    } catch (e) {
      console.error(etichetta, '-> ERRORE:', e.message);
    }
  }
})();