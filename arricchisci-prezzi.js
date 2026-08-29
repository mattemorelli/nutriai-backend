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

const SYSTEM = fs.readFileSync('foods-prezzi-prompt.txt', 'utf8');

async function chiedi(blocco) {
  const payload = blocco.map(f => ({
    id: f.id, name_it: f.name_it, reparto: f.reparto, unita: f.unita,
  }));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL, max_tokens: 8000, system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(payload) }],
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const d = await res.json();
  const testo = d.content.map(b => b.text || '').join('')
    .replace(/```json|```/g, '').trim();
  return JSON.parse(testo);
}

(async () => {
  console.log(SOLO_PROVA ? '=== PROVA ===\n' : '=== SCRITTURA ATTIVA ===\n');

  const { data: mancanti, error } = await supabase
    .from('foods').select('id, name_it, reparto, unita')
    .is('prezzo_kg', null).order('id');
  if (error) throw new Error(error.message);

  console.log(`Da stimare: ${mancanti.length}\n`);
  let ok = 0, scartati = 0;

  for (let i = 0; i < mancanti.length; i += BLOCCO) {
    const blocco = mancanti.slice(i, i + BLOCCO);
    process.stdout.write(`Blocco ${Math.floor(i / BLOCCO) + 1} (${blocco.length})... `);

    let risposta;
    try { risposta = await chiedi(blocco); }
    catch (e) { console.log('ERRORE:', e.message); continue; }

    for (const r of risposta) {
      const p = Number(r.prezzo_kg);
      // scarto i valori assurdi invece di scriverli
      if (!r.id || !(p > 0) || p > 5000) { scartati++; continue; }

      if (SOLO_PROVA) {
        const f = blocco.find(x => x.id === r.id);
        console.log(`\n  ${String(f?.name_it || r.id).padEnd(28)} € ${p.toFixed(2).padStart(8)} /kg   ${r.confidenza}`);
        ok++; continue;
      }

      const { error: e2 } = await supabase.from('foods')
        .update({
          prezzo_kg: p,
          prezzo_fonte: r.confidenza === 'alta' ? 'stima' : 'stima_debole',
          prezzo_aggiornato: new Date().toISOString().slice(0, 10),
        })
        .eq('id', r.id);
      if (e2) { scartati++; continue; }
      ok++;
    }
    console.log(SOLO_PROVA ? '' : 'ok');
  }
  console.log(`\nFatti: ${ok} | scartati: ${scartati}`);
})();