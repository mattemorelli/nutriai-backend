require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-haiku-4-5-20251001';
const BLOCCO = 40;
const SOLO_PROVA = process.argv.includes('--prova');

const SYSTEM = fs.readFileSync('foods-prompt.txt', 'utf8');

const REPARTI_OK = ['Produce', 'Meat & fish', 'Dairy & eggs', 'Pantry'];
const UNITA_OK = ['pezzi', 'mazzo', 'barattolo', 'confezione', 'peso'];

async function arricchisci(blocco) {
  const payload = blocco.map(f => ({ id: f.id, name: f.name }));

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    }),
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);

  const dati = await res.json();
  const testo = dati.content.map(b => b.text || '').join('')
    .replace(/```json|```/g, '').trim();
  return JSON.parse(testo);
}

async function main() {
  console.log(SOLO_PROVA ? '=== PROVA (non scrive) ===\n' : '=== SCRITTURA ATTIVA ===\n');

  const { data: mancanti, error } = await supabase
    .from('foods')
    .select('id, name')
    .is('name_en', null)
    .order('id');
  if (error) throw new Error(error.message);

  console.log(`Da arricchire: ${mancanti.length}\n`);
  let ok = 0, scartati = 0;

  for (let i = 0; i < mancanti.length; i += BLOCCO) {
    const blocco = mancanti.slice(i, i + BLOCCO);
    process.stdout.write(`Blocco ${i / BLOCCO + 1} (${blocco.length})... `);

    let risposta;
    try {
      risposta = await arricchisci(blocco);
    } catch (e) {
      console.log('ERRORE:', e.message);
      continue;
    }

    for (const r of risposta) {
      // controlli: se il modello inventa, si scarta invece di scrivere sporco
      if (!r.id || !r.name_en) { scartati++; continue; }
      if (!REPARTI_OK.includes(r.reparto)) { scartati++; continue; }
      if (!UNITA_OK.includes(r.unita)) { scartati++; continue; }
      if (r.unita !== 'peso' && !(r.peso_pezzo_g > 0)) { scartati++; continue; }

      if (SOLO_PROVA) {
        console.log(`\n  ${r.id.padEnd(24)} ${String(r.name_en).padEnd(26)} ${r.unita.padEnd(11)} ${r.peso_pezzo_g ?? '-'} ${r.reparto}`);
        ok++;
        continue;
      }

      const { error: e2 } = await supabase
        .from('foods')
        .update({
          name_en: r.name_en,
          unita: r.unita,
          peso_pezzo_g: r.unita === 'peso' ? null : r.peso_pezzo_g,
          reparto: r.reparto,
        })
        .eq('id', r.id);
      if (e2) { scartati++; continue; }
      ok++;
    }
    console.log(SOLO_PROVA ? '' : 'ok');
  }

  console.log(`\nFatti: ${ok} | scartati: ${scartati}`);
}

main().catch(e => { console.error(e.message); process.exit(1); });