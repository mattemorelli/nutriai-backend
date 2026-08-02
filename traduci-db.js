require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// ---------- CONFIGURAZIONE ----------
const TABELLA = 'dishes';
const COL_NOME = 'name';
const COL_STEPS = 'steps';
const COL_NOME_EN = 'name_en';
const COL_STEPS_EN = 'steps_en';

const MODEL = 'claude-haiku-4-5-20251001';
const BLOCCO = 8;
const PAUSA_MS = 1200;
const SOLO_PROVA = process.argv.includes('--prova');
// ------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Manca SUPABASE_URL o la chiave Supabase nel .env');
  process.exit(1);
}
if (!API_KEY) {
  console.error('Manca ANTHROPIC_API_KEY nel .env');
  process.exit(1);
}
if (!fs.existsSync('system-prompt.txt')) {
  console.error('Manca il file system-prompt.txt');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SYSTEM = fs.readFileSync('system-prompt.txt', 'utf8');

// Estrae i numeri come lista, normalizzando la virgola decimale.
function listaNumeri(v) {
  return (JSON.stringify(v ?? '').match(/\d+([.,]\d+)?/g) || []).map(n => n.replace(',', '.'));
}

// true = problema. Blocca SOLO se un numero italiano e' sparito nella traduzione.
// I numeri che compaiono solo in inglese sono legittimi ("dieci minuti" -> "10 minutes").
function numeriPersi(it, en) {
  const nEn = listaNumeri(en);
  return listaNumeri(it).some(n => !nEn.includes(n));
}

async function traduciBlocco(piatti) {
  const payload = piatti.map(p => ({ id: p.id, name: p[COL_NOME], steps: p[COL_STEPS] }));

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
  console.log(SOLO_PROVA ? '=== PROVA (non scrive sul database) ===\n' : '=== TRADUZIONE ATTIVA ===\n');

  const { count } = await supabase
    .from(TABELLA)
    .select('id', { count: 'exact', head: true })
    .is(COL_NOME_EN, null);
  console.log(`Piatti da tradurre: ${count}\n`);

  const daControllare = [];
  let fatti = 0, saltati = 0, erroriConsecutivi = 0;

  while (true) {
    const { data: piatti, error } = await supabase
      .from(TABELLA)
      .select(`id, ${COL_NOME}, ${COL_STEPS}`)
      .is(COL_NOME_EN, null)
      .order('id')
      .limit(BLOCCO);

    if (error) { console.error('Errore lettura:', error.message); break; }
    if (!piatti || piatti.length === 0) { console.log('\nFinito: nessun piatto rimasto.'); break; }

    let tradotti;
    try {
      tradotti = await traduciBlocco(piatti);
      erroriConsecutivi = 0;
    } catch (e) {
      erroriConsecutivi++;
      console.error(`Errore blocco (${erroriConsecutivi}):`, e.message);
      if (erroriConsecutivi >= 5) { console.error('Troppi errori di fila, mi fermo.'); break; }
      await new Promise(r => setTimeout(r, 10000));
      continue;
    }

    for (const t of tradotti) {
      const orig = piatti.find(p => p.id === t.id);
      if (!orig) continue;

      if (numeriPersi(orig[COL_STEPS], t.steps_en)) {
        daControllare.push({ id: t.id, nome: orig[COL_NOME], motivo: 'numero italiano sparito' });
        saltati++;
        console.log(`  [!] ${orig[COL_NOME]} - numero sparito, messo da parte`);
        if (!SOLO_PROVA) {
          await supabase.from(TABELLA)
            .update({ [COL_NOME_EN]: t.name_en, [COL_STEPS_EN]: null })
            .eq('id', t.id);
        }
        continue;
      }

      if (SOLO_PROVA) {
        console.log(`  ${orig[COL_NOME]}  ->  ${t.name_en}`);
        console.log(`     ${JSON.stringify(t.steps_en).slice(0, 150)}...\n`);
      } else {
        const { error: errUp } = await supabase
          .from(TABELLA)
          .update({ [COL_NOME_EN]: t.name_en, [COL_STEPS_EN]: t.steps_en })
          .eq('id', t.id);
        if (errUp) console.error(`  Errore scrittura id ${t.id}:`, errUp.message);
        else { fatti++; console.log(`  ok  ${orig[COL_NOME]} -> ${t.name_en}`); }
      }
    }

    if (SOLO_PROVA) break;
    console.log(`--- tradotti: ${fatti} | da controllare: ${saltati} ---`);
    await new Promise(r => setTimeout(r, PAUSA_MS));
  }

  if (daControllare.length) {
    fs.writeFileSync('da-controllare.json', JSON.stringify(daControllare, null, 2));
    console.log(`\n${daControllare.length} piatti salvati in da-controllare.json.`);
  }
}

main().catch(e => { console.error('\nErrore fatale:', e.message); process.exit(1); });