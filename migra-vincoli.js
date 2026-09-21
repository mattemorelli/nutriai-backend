// migra-vincoli.js — riempie food_id / categoria sui vincoli gia' dichiarati.
// Senza argomenti mostra soltanto cosa farebbe. Con --applica scrive.
// Uso: node migra-vincoli.js [--applica]

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { trovaCategoria } = require('./genera.js');
const crypto = require('crypto');

const APPLICA = process.argv.includes('--applica');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const norm = (s) => (s || '').toString().trim().toLowerCase();
const radice = (s) => norm(s).replace(/[aeio]$/, '').replace(/[aeio]$/, '');

// Nome di base: lo stesso alimento crudo, cotto o secco e' lo stesso alimento.
// "Lenticchie cotte" -> "lenticchie". "Farina di ceci" resta "farina di ceci".
const base = (s) =>
  norm(s)
    .replace(/\b(cotti|cotte|cotto|cotta|crudi|crude|crudo|cruda|secchi|secche|secco|secca|in scatola|surgelati|surgelate)\b/g, '')
    .replace(/[,\s]+/g, ' ')
    .trim();

(async () => {
  const { data: vincoli } = await supabase
    .from('user_constraints')
    .select('id, user_id, kind, subject, severity, declared_at, food_id, categoria');

  const { data: aliasRighe } = await supabase.from('alias_categoria').select('alias, codice');
  const mappaAlias = new Map((aliasRighe || []).map((r) => [r.alias, r.codice]));

  const { data: foods } = await supabase.from('foods').select('id, name, name_it, stato');

  const nomeDi = (f) => f.name_it || f.name;

  const piano = [];

  for (const v of vincoli || []) {
    // Gia' risolta da un passaggio precedente: non si rimatcha, non si duplica.
    if (v.food_id || v.categoria) {
      piano.push({ vincolo: v, tipo: 'gia_risolto' });
      continue;
    }

    const s = (v.subject || '').trim();

    let trovati = (foods || []).filter(
      (f) => norm(f.name_it) === norm(s) || norm(f.name) === norm(s)
    );
    let via = 'nome esatto';

    if (!trovati.length) {
      const r = radice(s);
      if (r.length >= 4) {
        trovati = (foods || []).filter(
          (f) => radice(f.name_it).startsWith(r) || radice(f.name).startsWith(r)
        );
        via = 'singolare/plurale';
      }
    }

    if (!trovati.length) {
      trovati = (foods || []).filter(
        (f) => norm(f.name_it).includes(norm(s)) || norm(f.name).includes(norm(s))
      );
      via = 'sottostringa';
    }

    // Allarga alle varianti crudo/cotto/secco dello stesso alimento.
    if (trovati.length) {
      const basi = new Set(trovati.map((f) => base(nomeDi(f))));
      const allargato = (foods || []).filter((f) => basi.has(base(nomeDi(f))));
      const aggiunti = allargato.length - trovati.length;
      trovati = allargato;
      piano.push({ vincolo: v, tipo: 'alimenti', via, aggiunti, alimenti: trovati });
      continue;
    }

    const cat = trovaCategoria(s, mappaAlias);
    if (cat) {
      piano.push({ vincolo: v, tipo: 'categoria', via: 'categoria', categoria: cat.codice });
      continue;
    }

    piano.push({ vincolo: v, tipo: 'irrisolto', via: 'nessuna corrispondenza' });
  }

  console.log(APPLICA ? '=== APPLICO ===\n' : '=== PROVA: non scrivo niente ===\n');

  let nuoveRighe = 0, aggiornate = 0, irrisolti = 0, risolti = 0;

  for (const p of piano) {
    const v = p.vincolo;
    const testa = `"${v.subject}" [${v.kind}/${v.severity}]`;
    if (p.tipo === 'gia_risolto') { risolti++; continue; }
    if (p.tipo === 'alimenti') {
      const nomi = p.alimenti.map(nomeDi).join(', ');
      const coda = p.aggiunti ? `  (+${p.aggiunti} varianti)` : '';
      console.log(`${testa}\n   -> ${p.alimenti.length} alimento/i (${p.via})${coda}: ${nomi}`);
      aggiornate++;
      nuoveRighe += p.alimenti.length - 1;
    } else if (p.tipo === 'categoria') {
      console.log(`${testa}\n   -> categoria "${p.categoria}"`);
      aggiornate++;
    } else {
      console.log(`${testa}\n   -> IRRISOLTO: resta da far scegliere all'utente`);
      irrisolti++;
    }
  }

  console.log(`\nrighe aggiornate: ${aggiornate}`);
  console.log(`righe nuove da creare: ${nuoveRighe}`);
  console.log(`righe gia' risolte, saltate: ${risolti}`);
  console.log(`vincoli irrisolti: ${irrisolti}`);

  if (!APPLICA) {
    console.log('\nNiente e\' stato scritto. Rilancia con --applica per eseguire.');
    return;
  }

  for (const p of piano) {
    const v = p.vincolo;

    if (p.tipo === 'alimenti') {
      const [primo, ...altri] = p.alimenti;
      const { error } = await supabase
        .from('user_constraints')
        .update({ food_id: primo.id, categoria: null })
        .eq('id', v.id);
      if (error) { console.error(`FERMO su ${v.id}: ${error.message}`); process.exit(1); }

      for (const f of altri) {
        const { error: e2 } = await supabase.from('user_constraints').insert({
          id: crypto.randomUUID(),
          user_id: v.user_id,
          kind: v.kind,
          subject: v.subject,
          severity: v.severity,
          declared_at: v.declared_at,
          food_id: f.id,
          categoria: null
        });
        if (e2) { console.error(`FERMO inserendo ${f.id}: ${e2.message}`); process.exit(1); }
      }
    } else if (p.tipo === 'categoria') {
      const { error } = await supabase
        .from('user_constraints')
        .update({ categoria: p.categoria, food_id: null })
        .eq('id', v.id);
      if (error) { console.error(`FERMO su ${v.id}: ${error.message}`); process.exit(1); }
    }
  }

  console.log('\nFatto.');
})();
