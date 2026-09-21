// misura-vincoli.js — cosa risolve davvero ogni vincolo dichiarato.
// Sola lettura: nessuna scrittura, nessuna generazione.
// Uso: node misura-vincoli.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { trovaCategoria, CONTENUTE_IN } = require('./genera.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

(async () => {
  const { data: vincoli } = await supabase
    .from('user_constraints')
    .select('user_id, kind, subject, severity')
    .order('subject');

  const { data: aliasRighe } = await supabase.from('alias_categoria').select('alias, codice');
  const mappaAlias = new Map((aliasRighe || []).map((r) => [r.alias, r.codice]));

  const { data: tuttiFoods } = await supabase.from('foods').select('id, name, name_it, sinonimi');

  console.log(`Vincoli dichiarati: ${(vincoli || []).length}`);
  console.log(`Alimenti in foods:  ${(tuttiFoods || []).length}\n`);

  const sospetti = [];

  for (const v of vincoli || []) {
    const s = (v.subject || '').trim();
    const cat = trovaCategoria(s, mappaAlias);

    console.log('─'.repeat(72));
    console.log(`subject: "${s}"   kind: ${v.kind}   severity: ${v.severity}`);
    console.log(`utente:  ${v.user_id}`);

    if (cat) {
      const codici = [cat.codice, ...(CONTENUTE_IN[cat.codice] || [])];
      const trovati = new Set();
      for (const codice of codici) {
        const { data: righe } = await supabase
          .from('categorie_alimenti')
          .select('food_id')
          .eq('categoria', codice);
        for (const r of righe || []) trovati.add(r.food_id);
      }
      console.log(`  via CATEGORIA -> ${cat.codice}  (piu': ${(CONTENUTE_IN[cat.codice] || []).join(', ') || 'nessuna'})`);
      console.log(`  alimenti esclusi: ${trovati.size}`);
      if (trovati.size === 0) sospetti.push([s, v.severity, 'categoria risolta ma 0 alimenti']);
    } else {
      const { data: cibi } = await supabase
        .from('foods')
        .select('id, name, name_it')
        .or(`name.ilike.%${s}%,name_it.ilike.%${s}%`);
      const n = (cibi || []).length;
      console.log(`  via SOTTOSTRINGA su name / name_it`);
      console.log(`  alimenti esclusi: ${n}`);
      if (n) {
        console.log('  esempi: ' + (cibi || []).slice(0, 6).map((c) => `${c.name_it || c.name}`).join(', '));
      }
      if (n === 0) sospetti.push([s, v.severity, 'NESSUN alimento: il vincolo non esclude niente']);

      // quanto guadagneremmo guardando anche i sinonimi
      const ago = s.toLowerCase();
      const inSinonimi = (tuttiFoods || []).filter((f) => {
        const sin = f.sinonimi;
        const testo = Array.isArray(sin) ? sin.join(' ') : String(sin || '');
        return testo.toLowerCase().includes(ago);
      });
      const nuovi = inSinonimi.filter((f) => !(cibi || []).some((c) => c.id === f.id));
      console.log(`  in piu' se si guardassero i sinonimi: ${nuovi.length}`);
      if (nuovi.length) {
        console.log('  esempi: ' + nuovi.slice(0, 6).map((f) => f.name_it || f.name).join(', '));
      }
    }
  }

  console.log('\n' + '='.repeat(72));
  console.log('VINCOLI SOSPETTI\n');
  if (!sospetti.length) {
    console.log('  nessuno: ogni vincolo risolve ad almeno un alimento.');
  } else {
    for (const [s, sev, motivo] of sospetti) {
      console.log(`  "${s}"  [${sev}]  ->  ${motivo}`);
    }
  }
  console.log('');
})();
