require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);
const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-haiku-4-5-20251001';
const QUANTI = 12; // quanti casi esaminare

const SYSTEM = fs.existsSync('system-prompt.txt')
  ? fs.readFileSync('system-prompt.txt', 'utf8')
  : null;

function numeri(v) {
  return (JSON.stringify(v ?? '').match(/\d+([.,]\d+)?/g) || []).sort((a,b)=>a-b);
}

async function traduci(piatti) {
  const payload = piatti.map(p => ({ id: p.id, name: p.name, steps: p.steps }));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM || require('./traduci-db-system.js'),
      messages: [{ role: 'user', content: JSON.stringify(payload) }]
    })
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const testo = data.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
  return JSON.parse(testo);
}

async function main() {
  const lista = JSON.parse(fs.readFileSync('da-controllare.json', 'utf8'));
  console.log(`Totale da controllare: ${lista.length}. Ne esamino ${QUANTI}.\n`);

  const ids = lista.slice(0, QUANTI).map(x => x.id);
  const { data: piatti, error } = await supabase
    .from('dishes').select('id, name, steps').in('id', ids);
  if (error) throw new Error(error.message);

  for (let i = 0; i < piatti.length; i += 6) {
    const blocco = piatti.slice(i, i + 6);
    const tradotti = await traduci(blocco);

    for (const t of tradotti) {
      const orig = blocco.find(p => p.id === t.id);
      if (!orig) continue;
      const nIt = numeri(orig.steps);
      const nEn = numeri(t.steps_en);
      if (nIt.join(',') === nEn.join(',')) { console.log(`OK ora: ${orig.name}\n`); continue; }

      console.log(`=== ${orig.name} (id ${orig.id})`);
      console.log(`  numeri IT: ${nIt.join(', ')}`);
      console.log(`  numeri EN: ${nEn.join(', ')}`);
      const soloIt = nIt.filter(x => !nEn.includes(x));
      const soloEn = nEn.filter(x => !nIt.includes(x));
      if (soloIt.length) console.log(`  spariti:  ${soloIt.join(', ')}`);
      if (soloEn.length) console.log(`  comparsi: ${soloEn.join(', ')}`);
      console.log(`  IT: ${JSON.stringify(orig.steps)}`);
      console.log(`  EN: ${JSON.stringify(t.steps_en)}\n`);
    }
    await new Promise(r => setTimeout(r, 1200));
  }
}

main().catch(e => { console.error('Errore:', e.message); process.exit(1); });