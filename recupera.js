require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const TABELLA = 'dishes';
const MODEL = 'claude-haiku-4-5-20251001';
const BLOCCO = 8;
const PAUSA_MS = 1200;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);
const API_KEY = process.env.ANTHROPIC_API_KEY;
const SYSTEM = fs.readFileSync('system-prompt.txt', 'utf8');

function listaNumeri(v) {
  return (JSON.stringify(v ?? '').match(/\d+([.,]\d+)?/g) || []).map(n => n.replace(',', '.'));
}
function numeriPersi(it, en) {
  const nEn = listaNumeri(en);
  return listaNumeri(it).some(n => !nEn.includes(n));
}

async function traduci(piatti) {
  const payload = piatti.map(p => ({ id: p.id, name: p.name, steps: p.steps }));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(payload) }]
    })
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const testo = data.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
  return JSON.parse(testo);
}

async function main() {
  if (!fs.existsSync('da-controllare.json')) {
    console.error('Manca da-controllare.json');
    process.exit(1);
  }

  const lista = JSON.parse(fs.readFileSync('da-controllare.json', 'utf8'));
  console.log(`Recupero ${lista.length} piatti.\n`);

  const ids = lista.map(x => x.id);
  const restanti = [];
  let ok = 0, erroriConsecutivi = 0;

  for (let i = 0; i < ids.length; i += BLOCCO) {
    const { data: piatti, error } = await supabase
      .from(TABELLA)
      .select('id, name, steps')
      .in('id', ids.slice(i, i + BLOCCO));

    if (error) { console.error('Errore lettura:', error.message); break; }
    if (!piatti || !piatti.length) continue;

    let tradotti;
    try {
      tradotti = await traduci(piatti);
      erroriConsecutivi = 0;
    } catch (e) {
      erroriConsecutivi++;
      console.error(`Errore blocco (${erroriConsecutivi}):`, e.message);
      if (erroriConsecutivi >= 5) { console.error('Troppi errori, mi fermo.'); break; }
      await new Promise(r => setTimeout(r, 8000));
      i -= BLOCCO; // riprova lo stesso blocco
      continue;
    }

    for (const t of tradotti) {
      const orig = piatti.find(p => p.id === t.id);
      if (!orig) continue;

      if (numeriPersi(orig.steps, t.steps_en)) {
        restanti.push({ id: t.id, nome: orig.name, motivo: 'numero italiano sparito' });
        console.log(`  [!] ${orig.name}`);
        continue;
      }

      const { error: e2 } = await supabase
        .from(TABELLA)
        .update({ name_en: t.name_en, steps_en: t.steps_en })
        .eq('id', t.id);

      if (e2) console.error(`  errore scrittura id ${t.id}:`, e2.message);
      else { ok++; console.log(`  ok  ${orig.name} -> ${t.name_en}`); }
    }

    await new Promise(r => setTimeout(r, PAUSA_MS));
  }

  console.log(`\nRecuperati: ${ok} | ancora da vedere: ${restanti.length}`);
  fs.writeFileSync('da-controllare.json', JSON.stringify(restanti, null, 2));
}

main().catch(e => { console.error('Errore fatale:', e.message); process.exit(1); });