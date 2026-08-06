require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);
const API_KEY = process.env.ANTHROPIC_API_KEY;

// node arricchisci.js --prova            -> 6 piatti, non scrive
// node arricchisci.js --prova --sonnet   -> confronto qualita'
// node arricchisci.js                    -> tutto il database
const SOLO_PROVA = process.argv.includes('--prova');
const MODEL = process.argv.includes('--sonnet')
  ? 'claude-sonnet-5'
  : 'claude-haiku-4-5-20251001';

const BLOCCO = 4;
const PAUSA_MS = 1500;

const SYSTEM = `Sei uno chef che scrive ricette per persone che cucinano a casa dopo il lavoro.

Ricevi piatti con: nome, tempo di preparazione dichiarato, ingredienti con i grammi esatti, e i passaggi attuali (troppo scarni).
Devi riscrivere i passaggi in una versione DETTAGLIATA e realmente eseguibile, IN INGLESE.

REGOLE:
1. Da 5 a 9 passaggi. Ogni passaggio una sola azione principale, in imperativo.
2. Usa le quantita' esatte degli ingredienti forniti, in grammi. Non inventare ingredienti nuovi, tranne quelli di base sempre ammessi: acqua, sale, pepe, olio d'oliva (indicane la quantita' in cucchiai).
3. Il tempo totale dei passaggi deve essere coerente con il tempo di preparazione dichiarato. Non superarlo.
4. Includi i dettagli che fanno la differenza per chi non sa cucinare: temperatura del fuoco, dimensione del taglio, come capire che una cosa e' pronta ("until the edges turn golden", "until a knife slides in easily").
5. Preserva la tecnica originale: se il piatto era in padella non trasformarlo in forno.
6. Terminologia inglese standard: saute, brown, blanch, simmer, fold, drain, season to taste.
7. Niente introduzioni, niente commenti, niente elenco ingredienti: solo i passaggi.

FORMATO: solo un array JSON valido, nessun testo prima o dopo, nessun backtick.
[{"id": <id ricevuto>, "steps_en": ["passaggio 1", "passaggio 2", ...]}]`;

async function ingredientiDi(ids) {
  const { data, error } = await supabase
    .from('dish_ingredients')
    .select('dish_id, grams, foods (name)')
    .in('dish_id', ids);
  if (error) throw new Error(error.message);

  const mappa = {};
  for (const r of data) {
    if (!mappa[r.dish_id]) mappa[r.dish_id] = [];
    mappa[r.dish_id].push({ nome: r.foods?.name || '?', grammi: r.grams });
  }
  return mappa;
}

async function riscrivi(piatti, ingredienti) {
  const payload = piatti.map(p => ({
    id: p.id,
    name: p.name_en || p.name,
    prep_min: p.prep_min,
    ingredients: ingredienti[p.id] || [],
    current_steps: p.steps_en || p.steps,
  }));

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
  const data = await res.json();
  const testo = data.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
  return JSON.parse(testo);
}

function valida(steps) {
  if (!Array.isArray(steps)) return 'non e un array';
  if (steps.length < 4) return `solo ${steps.length} passaggi`;
  if (steps.length > 12) return `troppi passaggi (${steps.length})`;
  if (steps.some(s => typeof s !== 'string' || s.length < 15)) return 'passaggio troppo corto';
  return null;
}

async function main() {
  console.log(`Modello: ${MODEL}`);
  console.log(SOLO_PROVA ? '=== PROVA (non scrive) ===\n' : '=== RISCRITTURA ATTIVA ===\n');

  const { count } = await supabase
    .from('dishes')
    .select('id', { count: 'exact', head: true })
    .is('steps_detailed_at', null)
    .not('steps_en', 'is', null);
  console.log(`Piatti da arricchire: ${count}\n`);

  const problemi = [];
  let fatti = 0, erroriConsecutivi = 0;

  while (true) {
    const { data: piatti, error } = await supabase
      .from('dishes')
      .select('id, name, name_en, prep_min, steps, steps_en, cucina')
      .is('steps_detailed_at', null)
      .not('steps_en', 'is', null)
      .order('id')
      .limit(BLOCCO);

    if (error) { console.error('Errore lettura:', error.message); break; }
    if (!piatti?.length) { console.log('\nFinito.'); break; }

    let ingredienti, risultati;
    try {
      ingredienti = await ingredientiDi(piatti.map(p => p.id));
      risultati = await riscrivi(piatti, ingredienti);
      erroriConsecutivi = 0;
    } catch (e) {
      erroriConsecutivi++;
      console.error(`Errore blocco (${erroriConsecutivi}):`, e.message);
      if (erroriConsecutivi >= 5) break;
      await new Promise(r => setTimeout(r, 10000));
      continue;
    }

    for (const r of risultati) {
      const orig = piatti.find(p => p.id === r.id);
      if (!orig) continue;

      const problema = valida(r.steps_en);
      if (problema) {
        problemi.push({ id: r.id, nome: orig.name_en || orig.name, motivo: problema });
        console.log(`  [!] ${orig.name_en || orig.name} - ${problema}`);
        continue;
      }

      if (SOLO_PROVA) {
        console.log(`\n--- ${orig.name_en || orig.name}  (${orig.prep_min} min, ${orig.cucina})`);
        console.log(`    ingredienti: ${(ingredienti[r.id] || []).map(i => `${i.grammi}g ${i.nome}`).join(', ')}`);
        console.log(`    PRIMA: ${JSON.stringify(orig.steps_en)}`);
        console.log('    DOPO:');
        r.steps_en.forEach((s, i) => console.log(`      ${i + 1}. ${s}`));
      } else {
        const { error: e2 } = await supabase
          .from('dishes')
          .update({ steps_en: r.steps_en, steps_detailed_at: new Date().toISOString() })
          .eq('id', r.id);
        if (e2) console.error(`  errore scrittura ${r.id}:`, e2.message);
        else { fatti++; console.log(`  ok  ${orig.name_en || orig.name} (${r.steps_en.length} passaggi)`); }
      }
    }

    if (SOLO_PROVA) break;
    console.log(`--- arricchiti: ${fatti} | da rivedere: ${problemi.length} ---`);
    await new Promise(r => setTimeout(r, PAUSA_MS));
  }

  if (problemi.length) {
    fs.writeFileSync('ricette-da-rivedere.json', JSON.stringify(problemi, null, 2));
    console.log(`\n${problemi.length} piatti in ricette-da-rivedere.json`);
  }
}

main().catch(e => { console.error('Errore fatale:', e.message); process.exit(1); });