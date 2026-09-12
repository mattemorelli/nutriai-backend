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
const TUTTI = process.argv.includes('--tutti');

const SYSTEM = fs.readFileSync('foods-it-prompt.txt', 'utf8');

async function chiedi(blocco) {
  const payload = blocco.map(f => ({ id: f.id, name: f.name, name_en: f.name_en }));
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

// PostgREST impone un tetto di righe per risposta (di default 1000)
// indipendente da .limit(): con --tutti si legge l'intera tabella foods,
// che puo' crescere oltre la soglia, quindi va paginato con .range().
async function paginaTutto(costruisciQuery) {
  const righe = [];
  const PAGINA = 1000;
  for (let offset = 0; ; offset += PAGINA) {
    const { data: blocco, error } = await costruisciQuery(offset, offset + PAGINA - 1);
    if (error) throw new Error(error.message);
    righe.push(...(blocco || []));
    if (!blocco || blocco.length < PAGINA) break;
  }
  return righe;
}

(async () => {
  console.log(SOLO_PROVA ? '=== PROVA ===\n' : '=== SCRITTURA ATTIVA ===\n');

  // --tutti rigenera anche i sinonimi di chi ha già il nome italiano
  const mancanti = await paginaTutto((da, a) => {
    let q = supabase.from('foods').select('id, name, name_en').order('id').range(da, a);
    if (!TUTTI) q = q.is('name_it', null);
    return q;
  });

  console.log(`Da elaborare: ${mancanti.length}\n`);
  let ok = 0, scartati = 0;

  for (let i = 0; i < mancanti.length; i += BLOCCO) {
    const blocco = mancanti.slice(i, i + BLOCCO);
    process.stdout.write(`Blocco ${Math.floor(i / BLOCCO) + 1} (${blocco.length})... `);

    let risposta;
    try { risposta = await chiedi(blocco); }
    catch (e) { console.log('ERRORE:', e.message); continue; }

    for (const r of risposta) {
      if (!r.id || !r.name_it) { scartati++; continue; }
      // scarta parole troppo corte: agganciano di tutto
      const sin = (r.sinonimi || [])
        .map(s => String(s).toLowerCase().trim())
        .filter(s => s.length >= 4)
        .slice(0, 6);

      if (SOLO_PROVA) {
        console.log(`\n  ${r.id.padEnd(22)} ${String(r.name_it).padEnd(24)} [${sin.join(', ')}]`);
        ok++; continue;
      }

      const { error: e2 } = await supabase.from('foods')
        .update({ name_it: r.name_it, sinonimi: sin })
        .eq('id', r.id);
      if (e2) { scartati++; continue; }
      ok++;
    }
    console.log(SOLO_PROVA ? '' : 'ok');
  }
  console.log(`\nFatti: ${ok} | scartati: ${scartati}`);
})();