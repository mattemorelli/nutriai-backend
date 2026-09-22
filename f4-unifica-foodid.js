// f4-unifica-foodid.js — applica f4-foodid-proposta.json.
//
// Senza --scrivi non tocca niente: stampa esattamente cosa farebbe.
// Con --scrivi esegue, in quest'ordine (l'ordine conta):
//   1. RINOMINA: inserisce la nuova riga in foods con lo slug, prima di
//      spostare i riferimenti — altrimenti la foreign key rifiuta.
//   2. sposta i riferimenti nelle quattro tabelle collegate, sommando i
//      grammi quando due righe dello stesso piatto finiscono sullo stesso
//      alimento (dish_ingredients) e tenendo una riga sola negli altri casi.
//   3. cancella le righe foods vecchie, solo se non le punta piu' nessuno.
//
// Idempotente: rilanciato a cose fatte non trova piu' niente da spostare.

require('dotenv').config();
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const SCRIVI = process.argv.includes('--scrivi');

const TABELLE_COLLEGATE = [
  { tabella: 'dish_ingredients',   chiave: ['dish_id', 'food_id'],  somma: 'grams' },
  { tabella: 'categorie_alimenti', chiave: ['categoria', 'food_id'] },
  { tabella: 'tag_nutrizionali',   chiave: ['tag', 'food_id'] },
  { tabella: 'pantry_items',       chiave: ['user_id', 'food_id'] },
];

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

(async () => {
  if (!fs.existsSync('f4-foodid-proposta.json')) {
    console.error('Manca f4-foodid-proposta.json: lancia prima node f4-audit-foodid.js');
    process.exit(1);
  }
  const { proposte } = JSON.parse(fs.readFileSync('f4-foodid-proposta.json', 'utf8'));

  const aperte = proposte.filter(p => p.azione === 'DA_DECIDERE' || !p.id_nuovo);
  if (aperte.length) {
    console.error(`Ci sono ${aperte.length} righe ancora da decidere nella proposta:`);
    aperte.forEach(p => console.error(`  ${p.id_vecchio} (${p.nome || 'assente da foods'}) — ${p.motivo}`));
    console.error('Vanno chiuse a mano prima di procedere: un id lasciato aperto resta invisibile ai controlli.');
    process.exit(1);
  }

  const mappa = new Map(proposte.map(p => [String(p.id_vecchio), String(p.id_nuovo)]));
  console.log(`${SCRIVI ? '*** SCRITTURA ***' : 'prova a vuoto (aggiungi --scrivi per eseguire)'}`);
  console.log(`${mappa.size} id da unificare\n`);

  // --- 1. RINOMINA: la riga foods nuova va creata prima di spostare i riferimenti ---
  const daRinominare = proposte.filter(p => p.azione === 'RINOMINA');
  if (daRinominare.length) {
    const foods = await tutte('foods', '*', ['id']);
    const perId = new Map(foods.map(f => [String(f.id), f]));

    for (const p of daRinominare) {
      const vecchia = perId.get(String(p.id_vecchio));
      if (!vecchia) { console.log(`RINOMINA ${p.id_vecchio}: gia' fatta (assente da foods)`); continue; }
      if (perId.has(String(p.id_nuovo))) { console.log(`RINOMINA ${p.id_vecchio} → ${p.id_nuovo}: destinazione gia' presente, la riuso`); continue; }

      const nuova = { ...vecchia, id: p.id_nuovo };
      console.log(`RINOMINA ${p.id_vecchio} → ${p.id_nuovo}  (${vecchia.name_it || vecchia.name})`);
      if (SCRIVI) {
        const { error } = await supabase.from('foods').insert([nuova]);
        if (error) throw new Error(`insert foods ${p.id_nuovo}: ${error.message}`);
      }
    }
    console.log('');
  }

  // --- 2. sposta i riferimenti ---
  for (const { tabella, chiave, somma } of TABELLE_COLLEGATE) {
    let righe;
    try {
      righe = await tutte(tabella, '*', ['food_id']);
    } catch (e) {
      console.log(`${tabella}: non leggibile (${e.message}) — salto\n`);
      continue;
    }

    const daSpostare = righe.filter(r => mappa.has(String(r.food_id)));
    if (!daSpostare.length) { console.log(`${tabella}: niente da spostare\n`); continue; }

    // Indice delle righe di destinazione gia' esistenti, per capire quali
    // spostamenti diventano un duplicato.
    const chiaveDi = (r, foodId) =>
      chiave.map(c => (c === 'food_id' ? String(foodId) : String(r[c]))).join('||');
    const esistenti = new Map();
    for (const r of righe) {
      if (mappa.has(String(r.food_id))) continue;
      esistenti.set(chiaveDi(r, r.food_id), r);
    }

    let spostate = 0, fuse = 0;
    for (const r of daSpostare) {
      const nuovo = mappa.get(String(r.food_id));
      const k = chiaveDi(r, nuovo);
      const gemella = esistenti.get(k);

      if (gemella) {
        // Duplicato: fondo. Su dish_ingredients i grammi si sommano (le due
        // righe erano lo stesso ingrediente scritto due volte), altrove
        // basta tenere la riga che c'e' gia'.
        fuse++;
        if (somma) {
          const totale = Number(gemella[somma] || 0) + Number(r[somma] || 0);
          console.log(`FONDI  ${tabella}  ${k}  ${somma}: ${gemella[somma]} + ${r[somma]} = ${totale}`);
          if (SCRIVI) {
            let q = supabase.from(tabella).update({ [somma]: totale });
            for (const c of chiave) q = q.eq(c, c === 'food_id' ? nuovo : gemella[c]);
            const { error } = await q;
            if (error) throw new Error(`update ${tabella}: ${error.message}`);
            gemella[somma] = totale;
          }
        } else {
          console.log(`SCARTA ${tabella}  ${k}  (riga gia' presente)`);
        }
        if (SCRIVI) {
          let q = supabase.from(tabella).delete();
          for (const c of chiave) q = q.eq(c, r[c]);
          const { error } = await q;
          if (error) throw new Error(`delete ${tabella}: ${error.message}`);
        }
      } else {
        spostate++;
        console.log(`SPOSTA ${tabella}  ${chiave.filter(c => c !== 'food_id').map(c => r[c]).join('/')}  ${r.food_id} → ${nuovo}`);
        if (SCRIVI) {
          let q = supabase.from(tabella).update({ food_id: nuovo });
          for (const c of chiave) q = q.eq(c, r[c]);
          const { error } = await q;
          if (error) throw new Error(`update ${tabella}: ${error.message}`);
        }
        esistenti.set(k, { ...r, food_id: nuovo });
      }
    }
    console.log(`${tabella}: ${spostate} spostate, ${fuse} fuse\n`);
  }

  // --- 3. cancella le foods vecchie, solo se non le punta piu' nessuno ---
  console.log('=== pulizia foods ===');
  for (const [vecchio, nuovo] of mappa) {
    if (vecchio === nuovo) continue;
    let ancora = 0;
    for (const { tabella } of TABELLE_COLLEGATE) {
      const { count, error } = await supabase
        .from(tabella)
        .select('food_id', { count: 'exact', head: true })
        .eq('food_id', vecchio);
      if (error) continue;
      ancora += count || 0;
    }
    if (ancora) {
      console.log(`TENGO   ${vecchio}: ancora ${ancora} riferimenti (qualcosa non e' stato spostato) — non la cancello`);
      continue;
    }
    console.log(`CANCELLO foods ${vecchio}`);
    if (SCRIVI) {
      const { error } = await supabase.from('foods').delete().eq('id', vecchio);
      if (error) console.log(`  non cancellata: ${error.message}`);
    }
  }

  console.log(`\n${SCRIVI ? 'Fatto.' : 'Niente scritto. Rilancia con --scrivi quando la prova a vuoto ti convince.'}`);
  console.log('Dopo la scrittura, rilancia node f4-audit-foodid.js: deve dire "id da unificare: 0".');
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
