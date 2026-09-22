// f4-audit-foodid.js — SOLO LETTURA.
//
// Perche' esiste: dish_ingredients.food_id ha due formati mescolati (id
// numerici USDA e slug italiani). Il problema non e' l'estetica: categorie_alimenti
// e' popolata sugli slug, quindi ogni riga con id numerico non combacia con
// nessuna categoria e viene ignorata IN SILENZIO da due cose che non possono
// sbagliare — il filtro allergie/dieta e (dal punto 3) il gruppo proteico.
// Un pescetariano puo' ricevere un piatto con un ingrediente di carne
// registrato con id numerico senza che nessun controllo se ne accorga.
//
// Questo script non scrive niente. Fotografa i due formati, propone per ogni
// id non-slug un'azione (unire a uno slug esistente, o rinominare l'id
// mantenendo l'alimento) e salva la proposta in f4-foodid-proposta.json.
// La proposta va letta e corretta a mano prima di f4-unifica-foodid.js.

require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

// Le quattro tabelle che puntano a foods.id. Se ne nasce una quinta va
// aggiunta qui, altrimenti la migrazione lascia indietro righe orfane.
const TABELLE_COLLEGATE = [
  { tabella: 'dish_ingredients',   chiave: ['dish_id', 'food_id'] },
  { tabella: 'categorie_alimenti', chiave: ['categoria', 'food_id'] },
  { tabella: 'tag_nutrizionali',   chiave: ['tag', 'food_id'] },
  { tabella: 'pantry_items',       chiave: ['user_id', 'food_id'] },
];

// Uno slug e' minuscolo, senza spazi, e non e' un numero puro. Tutto il resto
// (id numerici USDA, id con maiuscole o spazi) e' da unificare.
const isSlug = (id) => /^[a-z0-9]+(_[a-z0-9]+)*$/.test(String(id)) && !/^\d+$/.test(String(id));

function senzaAccenti(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizza(s) {
  return senzaAccenti(String(s || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugDa(s) {
  return senzaAccenti(String(s || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

// Paginazione esplicita e ordinata: PostgREST taglia a 1000 righe e senza
// ORDER BY la pagina successiva puo' ripetere o saltare righe.
async function tutte(tabella, colonne, ordine) {
  let fuori = [];
  let da = 0;
  for (;;) {
    let q = supabase.from(tabella).select(colonne);
    for (const c of ordine) q = q.order(c);
    const { data, error } = await q.range(da, da + 999);
    if (error) throw new Error(`${tabella}: ${error.message}`);
    if (!data || !data.length) break;
    fuori = fuori.concat(data);
    if (data.length < 1000) break;
    da += 1000;
  }
  return fuori;
}

// Distanza nutrizionale per 100 g. Serve da rete di sicurezza: due alimenti
// con lo stesso nome ma profili diversi (crudo vs cotto, intero vs scremato)
// non vanno uniti alla leggera.
function distanzaNutrizionale(a, b) {
  const campi = ['kcal_100g', 'protein_100g', 'carb_100g', 'fat_100g'];
  const scale = { kcal_100g: 120, protein_100g: 6, carb_100g: 12, fat_100g: 6 };
  let somma = 0;
  let contati = 0;
  for (const c of campi) {
    const va = a[c], vb = b[c];
    if (va == null || vb == null) continue;
    somma += Math.abs(Number(va) - Number(vb)) / scale[c];
    contati++;
  }
  if (!contati) return null;
  return Number((somma / contati).toFixed(3));
}

function nomiDi(f) {
  return [f.name_it, f.name].filter(Boolean).map(normalizza).filter(Boolean);
}

// Punteggio di somiglianza fra due alimenti, 0-1, sui soli nomi.
function somiglianzaNome(a, b) {
  const na = nomiDi(a), nb = nomiDi(b);
  let migliore = 0;
  for (const x of na) {
    for (const y of nb) {
      if (x === y) { migliore = Math.max(migliore, 1); continue; }
      const tx = new Set(x.split(' ').filter(t => t.length > 2));
      const ty = new Set(y.split(' ').filter(t => t.length > 2));
      if (!tx.size || !ty.size) continue;
      let comuni = 0;
      for (const t of tx) if (ty.has(t)) comuni++;
      const jac = comuni / (tx.size + ty.size - comuni);
      migliore = Math.max(migliore, jac);
    }
  }
  return Number(migliore.toFixed(3));
}

(async () => {
  console.log('=== f4: audit dei formati di food_id (sola lettura) ===\n');

  const foods = await tutte(
    'foods',
    'id, name, name_it, source, stato, kcal_100g, protein_100g, carb_100g, fat_100g, sat_fat_100g, fibre_100g, salt_100g',
    ['id']
  );
  console.log(`foods: ${foods.length} righe`);

  const perId = new Map(foods.map(f => [String(f.id), f]));
  const slugFoods = foods.filter(f => isSlug(f.id));
  const nonSlugFoods = foods.filter(f => !isSlug(f.id));
  console.log(`  con id slug:     ${slugFoods.length}`);
  console.log(`  con id da unire: ${nonSlugFoods.length}\n`);

  // Chi usa cosa, tabella per tabella.
  const usoPerId = new Map();   // food_id -> { tabella -> righe }
  const righePerTabella = {};
  for (const { tabella } of TABELLE_COLLEGATE) {
    let righe;
    try {
      righe = await tutte(tabella, '*', ['food_id']);
    } catch (e) {
      console.log(`  (${tabella} non leggibile: ${e.message}) — la salto`);
      continue;
    }
    righePerTabella[tabella] = righe;
    for (const r of righe) {
      const k = String(r.food_id);
      if (!usoPerId.has(k)) usoPerId.set(k, {});
      usoPerId.get(k)[tabella] = (usoPerId.get(k)[tabella] || 0) + 1;
    }
    const daUnire = righe.filter(r => !isSlug(r.food_id));
    const orfane = righe.filter(r => !perId.has(String(r.food_id)));
    console.log(`${tabella}: ${righe.length} righe · ${daUnire.length} con id da unire · ${orfane.length} orfane (food_id inesistente in foods)`);
    if (orfane.length) {
      const ids = [...new Set(orfane.map(r => String(r.food_id)))];
      console.log(`  id orfani: ${ids.slice(0, 20).join(', ')}${ids.length > 20 ? ` … (+${ids.length - 20})` : ''}`);
    }
  }
  console.log('');

  // Gli id da unificare: quelli non-slug presenti in foods, piu' quelli
  // usati nelle tabelle collegate anche se in foods non ci sono (orfani).
  const daUnificare = new Set(nonSlugFoods.map(f => String(f.id)));
  for (const [id] of usoPerId) if (!isSlug(id)) daUnificare.add(id);

  console.log(`=== id da unificare: ${daUnificare.size} ===\n`);

  const proposte = [];
  const slugPresi = new Set(slugFoods.map(f => String(f.id)));

  for (const id of [...daUnificare].sort()) {
    const f = perId.get(id) || null;
    const uso = usoPerId.get(id) || {};

    if (!f) {
      proposte.push({
        id_vecchio: id,
        esiste_in_foods: false,
        nome: null,
        uso,
        azione: 'DA_DECIDERE',
        motivo: 'usato nei piatti ma assente da foods: va inserito in foods o corretto a mano',
        candidati: [],
        sicuro: false,
      });
      continue;
    }

    // Candidati: gli slug piu' somiglianti per nome, con la distanza
    // nutrizionale accanto come controllo indipendente.
    const candidati = slugFoods
      .map(s => ({
        id: String(s.id),
        nome: s.name_it || s.name,
        stato: s.stato,
        somiglianza: somiglianzaNome(f, s),
        distanza_nutrizionale: distanzaNutrizionale(f, s),
      }))
      .filter(c => c.somiglianza > 0.3)
      .sort((a, b) => b.somiglianza - a.somiglianza ||
        (a.distanza_nutrizionale ?? 9) - (b.distanza_nutrizionale ?? 9))
      .slice(0, 3);

    const primo = candidati[0];
    // "Sicuro" solo se il nome combacia davvero E i valori nutrizionali sono
    // compatibili: il nome da solo unisce il latte intero con lo scremato.
    const sicuro = !!primo &&
      primo.somiglianza >= 0.85 &&
      primo.distanza_nutrizionale != null &&
      primo.distanza_nutrizionale <= 0.25;

    if (sicuro) {
      proposte.push({
        id_vecchio: id,
        esiste_in_foods: true,
        nome: f.name_it || f.name,
        uso,
        azione: 'UNISCI',
        id_nuovo: primo.id,
        motivo: `stesso alimento di ${primo.id} (somiglianza ${primo.somiglianza}, distanza nutrizionale ${primo.distanza_nutrizionale})`,
        candidati,
        sicuro: true,
      });
    } else {
      // Nessun gemello credibile: l'alimento e' suo, gli si da' uno slug.
      let slug = slugDa(f.name_it || f.name);
      if (!slug) slug = `food_${id}`;
      if (!/_[a-z]{2}$/.test(slug)) slug = `${slug}_it`;
      let finale = slug, n = 2;
      while (slugPresi.has(finale)) finale = `${slug}_${n++}`;
      slugPresi.add(finale);

      proposte.push({
        id_vecchio: id,
        esiste_in_foods: true,
        nome: f.name_it || f.name,
        uso,
        azione: 'RINOMINA',
        id_nuovo: finale,
        motivo: primo
          ? `nessun gemello sicuro (migliore: ${primo.id}, somiglianza ${primo.somiglianza}, distanza ${primo.distanza_nutrizionale}) — l'alimento resta, cambia solo l'id`
          : 'nessun candidato: alimento senza gemelli, cambia solo l\'id',
        candidati,
        sicuro: false,
      });
    }
  }

  // Conflitti di unione: se due righe dello stesso piatto puntano allo stesso
  // alimento dopo l'unione, la migrazione deve sommare i grammi, non
  // inserire un duplicato. Li elenco qui perche' vanno visti prima.
  const mappa = new Map(proposte.filter(p => p.id_nuovo).map(p => [p.id_vecchio, p.id_nuovo]));
  const conflitti = [];
  for (const { tabella, chiave } of TABELLE_COLLEGATE) {
    const righe = righePerTabella[tabella] || [];
    const visti = new Map();
    for (const r of righe) {
      const nuovo = mappa.get(String(r.food_id)) || String(r.food_id);
      const k = chiave.map(c => (c === 'food_id' ? nuovo : String(r[c]))).join('||');
      if (visti.has(k)) conflitti.push({ tabella, chiave: k, righe: [visti.get(k), r] });
      else visti.set(k, r);
    }
  }

  const perAzione = proposte.reduce((a, p) => ((a[p.azione] = (a[p.azione] || 0) + 1), a), {});
  console.log('proposte per azione:', perAzione);
  console.log(`sicure (unione automatica): ${proposte.filter(p => p.sicuro).length}`);
  console.log(`da guardare a mano:         ${proposte.filter(p => !p.sicuro).length}`);
  console.log(`conflitti di unione:        ${conflitti.length}\n`);

  for (const p of proposte) {
    const u = Object.entries(p.uso).map(([t, n]) => `${t}:${n}`).join(' ') || 'non usato';
    console.log(`${p.azione.padEnd(12)} ${String(p.id_vecchio).padEnd(10)} ${String(p.nome || '?').slice(0, 34).padEnd(36)} → ${p.id_nuovo || '???'}   [${u}]`);
    if (!p.sicuro) console.log(`             ${p.motivo}`);
  }

  if (conflitti.length) {
    console.log('\n=== conflitti (la migrazione somma i grammi / tiene una riga sola) ===');
    for (const c of conflitti.slice(0, 30)) console.log(` ${c.tabella}  ${c.chiave}`);
    if (conflitti.length > 30) console.log(` … (+${conflitti.length - 30})`);
  }

  fs.writeFileSync(
    'f4-foodid-proposta.json',
    JSON.stringify({ generato: new Date().toISOString(), proposte, conflitti }, null, 2)
  );
  console.log('\nScritto f4-foodid-proposta.json.');
  console.log('Da correggere a mano le righe DA_DECIDERE e quelle con "sicuro": false,');
  console.log('poi: node f4-unifica-foodid.js  (prova a vuoto)  e  node f4-unifica-foodid.js --scrivi');
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
