// misura-swap.js — lo Swap rispetta le allergie? Misura, non scrive.
// Per ogni utente con allergia al glutine: prende il suo piano piu' recente,
// chiede le alternative per ogni piatto e controlla se contengono glutine.
// Uso: node misura-swap.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { trovaProposte } = require('./sostituisci');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

// raccoglie ogni dish id dentro il risultato, qualunque forma abbia
function idPiatti(x, acc = new Set()) {
  if (!x || typeof x !== 'object') return acc;
  if (Array.isArray(x)) { x.forEach((v) => idPiatti(v, acc)); return acc; }
  if (x.dish_id) acc.add(x.dish_id);
  else if (x.id && (x.meal_slot || x.name)) acc.add(x.id);
  Object.values(x).forEach((v) => idPiatti(v, acc));
  return acc;
}

(async () => {
  const { data: glutine } = await supabase
    .from('categorie_alimenti').select('food_id').eq('categoria', 'glutine');
  const conGlutine = new Set((glutine || []).map((r) => r.food_id));

  const { data: utenti } = await supabase
    .from('user_constraints').select('user_id')
    .eq('categoria', 'glutine').eq('kind', 'allergia');
  const ids = [...new Set((utenti || []).map((u) => u.user_id))];
  console.log(`Utenti con allergia al glutine: ${ids.length}\n`);

  let proposteTot = 0, violazioniTot = 0, provati = 0;

  for (const uid of ids) {
    const { data: piani } = await supabase
      .from('plans').select('id').eq('user_id', uid)
      .order('generated_at', { ascending: false }).limit(1);
    if (!piani || !piani.length) { console.log(`${uid}: nessun piano, salto`); continue; }

    const { data: righe } = await supabase
      .from('plan_items').select('id, slot').eq('plan_id', piani[0].id)
      .in('slot', ['primo', 'secondo']).order('id').limit(6);

    for (const r of righe || []) {
      let esito;
      try { esito = await trovaProposte(supabase, uid, r.id); }
      catch (e) { console.log(`  item ${r.id}: errore ${e.message}`); continue; }
      provati++;

      const proposte = [...idPiatti(esito)];
      if (!proposte.length) continue;
      const { data: ing } = await supabase
        .from('dish_ingredients').select('dish_id, food_id').in('dish_id', proposte);
      const sporchi = new Set((ing || []).filter((i) => conGlutine.has(i.food_id)).map((i) => i.dish_id));

      proposteTot += proposte.length;
      violazioniTot += sporchi.size;
      if (sporchi.size) {
        const { data: nomi } = await supabase.from('dishes').select('id, name').in('id', [...sporchi]);
        console.log(`  ${uid.slice(0, 8)} item ${r.id} (${r.slot}): ${sporchi.size}/${proposte.length} proposte CON GLUTINE -> ${(nomi || []).map((n) => n.name).join(', ')}`);
      }
    }
  }

  console.log(`\nPiatti su cui ho chiesto lo Swap: ${provati}`);
  console.log(`Proposte ricevute:                ${proposteTot}`);
  console.log(`Proposte con glutine:             ${violazioniTot}`);
})();
