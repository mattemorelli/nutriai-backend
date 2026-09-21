// misura-colli.js — dove si svuota il serbatoio dei secondi.
// Sola lettura: nessuna scrittura, nessuna generazione.
// Uso: node misura-colli.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { caricaPiatti, gruppoDa, QUOTE } = require('./genera.js');

const FAMIGLIE = ['mediterranea', 'neutra', 'latina', 'asiatica', 'americana'];

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const GRUPPI = [...Object.keys(QUOTE), '(senza gruppo)'];

function gruppoDi(p) {
  if (p.gruppo) return p.gruppo;
  try {
    return gruppoDa(p) || '(senza gruppo)';
  } catch {
    return '(senza gruppo)';
  }
}

function tabella(intestazioni, righe) {
  const larghezze = intestazioni.map((h, i) =>
    Math.max(String(h).length, ...righe.map((r) => String(r[i]).length))
  );
  const linea = (celle) =>
    '  ' + celle.map((c, i) => String(c).padEnd(larghezze[i])).join('  ');
  return [linea(intestazioni), linea(larghezze.map((l) => '-'.repeat(l))), ...righe.map(linea)].join('\n');
}

(async () => {
  const senzaSoglia = await caricaPiatti(supabase, FAMIGLIE, 0);
  const conSoglia = await caricaPiatti(supabase, FAMIGLIE, 7);

  const sec0 = senzaSoglia.filter((p) => p.meal_slot === 'secondo');
  const sec7 = conSoglia.filter((p) => p.meal_slot === 'secondo');

  console.log(`Secondi a soglia 0: ${sec0.length}`);
  console.log(`Secondi a soglia 7: ${sec7.length}`);
  if (sec7.length < 600 || sec7.length > 820) {
    console.log('\nATTENZIONE: il totale a soglia 7 non somiglia ai 710 misurati in A4.');
    console.log('Fermati e chiedi invece di interpretare i numeri sotto.\n');
  }

  // --- 1. quanto costa la soglia salute, gruppo per gruppo ---
  console.log('\n=== 1. Costo della soglia salute 7 ===\n');
  const conta = (lista) =>
    lista.reduce((acc, p) => {
      const g = gruppoDi(p);
      acc[g] = (acc[g] || 0) + 1;
      return acc;
    }, {});
  const c0 = conta(sec0);
  const c7 = conta(sec7);

  console.log(
    tabella(
      ['gruppo', 'soglia 0', 'soglia 7', 'persi', '% persa'],
      GRUPPI.map((g) => {
        const a = c0[g] || 0;
        const b = c7[g] || 0;
        return [g, a, b, a - b, a ? `${(((a - b) / a) * 100).toFixed(0)}%` : '-'];
      })
    )
  );

  // --- 2. incrocio profilo di sapore x gruppo proteico, a soglia 7 ---
  console.log('\n=== 2. Profilo del giorno x gruppo proteico (soglia 7) ===\n');
  const profili = [...new Set(sec7.map((p) => p.profilo || '(nessun profilo)'))].sort();
  const righe = profili.map((prof) => {
    const dentro = sec7.filter((p) => (p.profilo || '(nessun profilo)') === prof);
    const perGruppo = conta(dentro);
    return [prof, dentro.length, ...GRUPPI.map((g) => perGruppo[g] || 0)];
  });
  console.log(tabella(['profilo', 'tot', ...GRUPPI], righe));

  // --- 3. i buchi: profilo x gruppo di QUOTE senza nemmeno un piatto ---
  console.log('\n=== 3. Caselle vuote (profilo senza nessun secondo di quel gruppo) ===\n');
  const buchi = [];
  for (const prof of profili) {
    const dentro = sec7.filter((p) => (p.profilo || '(nessun profilo)') === prof);
    const perGruppo = conta(dentro);
    for (const g of Object.keys(QUOTE)) {
      if (!(perGruppo[g] > 0)) buchi.push([prof, g, dentro.length]);
    }
  }
  if (!buchi.length) {
    console.log('  Nessuna: ogni profilo ha almeno un secondo per ogni gruppo di QUOTE.');
  } else {
    console.log(tabella(['profilo', 'gruppo assente', 'secondi del profilo'], buchi));
    console.log(`\n  Totale caselle vuote: ${buchi.length} su ${profili.length * Object.keys(QUOTE).length}`);
  }

  console.log('');
})();
