// F2 - soglia di copertura per proteina_principale: quanto deve pesare in
// PROTEINE REALI (non grammi di alimento) l'ingrediente proteico perche' il
// piatto "copra" davvero il ruolo proteina_principale, invece che una traccia
// (es. una spolverata di parmigiano su un contorno di verdure).
//
// MISURA, non applica: stampa i casi al confine per validazione a occhio.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

// Soglia proposta: copre proteina_principale se l'ingrediente/i di quel
// ruolo forniscono ALMENO 10g di proteine, OPPURE almeno il 25% delle
// proteine totali del piatto - quale delle due e' piu' facile da
// raggiungere (OR, non AND): un piatto leggero con poche proteine totali ma
// un contributo reale (es. 12g da un uovo) non deve fallire solo perche' e'
// sotto il 25% di un piatto che ha anche molta pasta; un piatto molto
// proteico dove pero' la "proteina_principale" e' solo un contorno di
// legumi minoritario (15% del totale ma 15g assoluti) deve comunque contare.
const SOGLIA_GRAMMI_PROTEINA = 10;
const SOGLIA_QUOTA_PROTEINA = 0.25;

async function caricaTutto(supabase) {
  const dishes = [];
  const PAGINA = 1000;
  for (let offset = 0; ; offset += PAGINA) {
    const { data, error } = await supabase
      .from('dishes').select('id, name, name_en, meal_slot, ruolo_primario, ruoli_coperti')
      .order('id').range(offset, offset + PAGINA - 1);
    if (error) throw new Error(error.message);
    dishes.push(...data);
    if (data.length < PAGINA) break;
  }

  const ingredienti = {};
  for (let i = 0; i < dishes.length; i += 200) {
    const blocco = dishes.slice(i, i + 200).map(d => d.id);
    const { data, error } = await supabase
      .from('dish_ingredients')
      .select('dish_id, food_id, grams, foods (protein_100g)')
      .in('dish_id', blocco)
      .order('dish_id').order('food_id');
    if (error) throw new Error(error.message);
    for (const r of data) { (ingredienti[r.dish_id] ||= []).push(r); }
  }

  const { data: cat } = await supabase.from('categorie_alimenti').select('food_id, categoria');
  const CATEGORIE_PROTEINA = new Set(['pesce', 'carne_rossa', 'carne_bianca', 'crostacei', 'molluschi', 'legumi', 'uova', 'soia']);
  const foodIdProteina = new Set((cat || []).filter(r => CATEGORIE_PROTEINA.has(r.categoria)).map(r => r.food_id));

  return { dishes, ingredienti, foodIdProteina };
}

(async () => {
  const { dishes, ingredienti, foodIdProteina } = await caricaTutto(supabase);

  const righe = [];
  for (const d of dishes) {
    const ing = ingredienti[d.id] || [];
    if (!ing.some(i => foodIdProteina.has(i.food_id))) continue; // nessun ingrediente di quella categoria, non e' un confine interessante
    let proteinaTotale = 0, proteinaDaRuolo = 0;
    for (const i of ing) {
      const p = ((i.foods && i.foods.protein_100g) || 0) * (i.grams || 0) / 100;
      proteinaTotale += p;
      if (foodIdProteina.has(i.food_id)) proteinaDaRuolo += p;
    }
    if (proteinaTotale <= 0) continue;
    const quota = proteinaDaRuolo / proteinaTotale;
    const copre = proteinaDaRuolo >= SOGLIA_GRAMMI_PROTEINA || quota >= SOGLIA_QUOTA_PROTEINA;
    righe.push({
      nome: d.name_en || d.name, slot: d.meal_slot,
      f1Copre: (d.ruoli_coperti || []).includes('proteina_principale'),
      proteinaDaRuolo: Math.round(proteinaDaRuolo * 10) / 10,
      proteinaTotale: Math.round(proteinaTotale * 10) / 10,
      quota: Math.round(quota * 100),
      copre,
    });
  }

  const copreOk = righe.filter(r => r.copre).length;
  console.log(`Piatti con almeno un ingrediente proteina_principale: ${righe.length}`);
  console.log(`Copertura confermata dalla soglia proteica (>=10g o >=25%): ${copreOk}`);
  console.log(`Sotto soglia (traccia, non copertura vera): ${righe.length - copreOk}`);
  const disaccordo = righe.filter(r => r.f1Copre !== r.copre);
  console.log(`Disaccordo fra soglia F1 (peso ingrediente) e soglia proteica: ${disaccordo.length}\n`);
  if (disaccordo.length) {
    console.log('--- Casi di disaccordo (F1 peso vs soglia proteica) ---');
    for (const r of disaccordo) {
      console.log(`  F1=${r.f1Copre ? 'copre' : 'non copre'} / proteina=${r.copre ? 'copre' : 'non copre'} | ${r.nome} - ${r.proteinaDaRuolo}g/${r.proteinaTotale}g (${r.quota}%)`);
    }
    console.log();
  }

  // Casi al confine: ordina per "distanza dalla soglia piu' vicina" e mostra
  // i piu' vicini sia sopra (copre) sia sotto (non copre) la soglia.
  const distanzaGrammi = (r) => Math.abs(r.proteinaDaRuolo - SOGLIA_GRAMMI_PROTEINA);
  const distanzaQuota = (r) => Math.abs(r.quota - SOGLIA_QUOTA_PROTEINA * 100);
  const distanza = (r) => Math.min(distanzaGrammi(r), distanzaQuota(r));

  const sopra = righe.filter(r => r.copre).sort((a, b) => distanza(a) - distanza(b)).slice(0, 8);
  const sotto = righe.filter(r => !r.copre).sort((a, b) => distanza(a) - distanza(b)).slice(0, 7);

  console.log('=== 15 casi al confine (8 appena sopra, 7 appena sotto) ===');
  for (const r of [...sopra, ...sotto].sort((a, b) => distanza(a) - distanza(b))) {
    console.log(`  ${r.copre ? 'COPRE    ' : 'NON COPRE'} | ${r.nome} (${r.slot}) - proteina da ruolo: ${r.proteinaDaRuolo}g / ${r.proteinaTotale}g totali (${r.quota}%)`);
  }
})();
