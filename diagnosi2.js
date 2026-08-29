require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

// --- copiati identici da genera.js ---
const GRUPPI = [
  ['pesce', /fish|salmon|salmone|cod,|merluzzo|tuna|tonno|trout|trota|sgombro|sardin|acciugh|aringa|branzino|orata|barramundi|halibut|nasello|rombo|sogliola|anguilla|baccal|mahi|astice|granchio|crab|shrimp|gamber|vongol|cozze|seppia|polpo/i],
  ['carne_rossa', /beef|manzo|brisket|agnello|lamb|canguro|kangaroo|vitell|veal|maiale|pork|lonza|speck|bresaola/i],
  ['carne_bianca', /chicken|pollo|turkey|tacchino|coniglio|rabbit/i],
  ['uova', /\begg|uovo/i],
  ['formaggio', /cheese|formagg|mozzarella|ricotta|pecorino|gorgonzola|taleggio|provola|emmental|caprino|stracchino|cheddar|feta|parmig/i],
  ['legumi', /fagiol|beans,|lentil|lenticch|ceci|chickpea|lupini|tofu|tempeh|edamame/i],
];
const QUOTE = {
  carne_rossa:  { min: 0, max: 1 },
  carne_bianca: { min: 1, max: 3 },
  pesce:        { min: 2, max: 4 },
  legumi:       { min: 1, max: 3 },
  uova:         { min: 0, max: 2 },
  formaggio:    { min: 0, max: 2 },
};
function gruppoDa(ingredienti) {
  const testo = ingredienti.filter(i => i.grams >= 40).map(i => i.nome).join(' | ');
  for (const [gruppo, rx] of GRUPPI) if (rx.test(testo)) return gruppo;
  return null;
}
// --- fine copia ---

const DIETA = process.argv[2] || 'pescetariano';
const SENZA_GLUTINE = process.argv[3] !== 'no';
const LIMITE_MIN = 40;

(async () => {
  const { data: piatti } = await supabase
    .from('dishes')
    .select('id, name, meal_slot, profilo, prep_min, tecnica, health_score, contiene_glutine')
    .eq('meal_slot', 'secondo');

  // ingredienti a blocchi
  const ids = piatti.map(p => p.id);
  const ing = {};
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase
      .from('dish_ingredients')
      .select('dish_id, grams, foods (name)')
      .in('dish_id', ids.slice(i, i + 200));
    for (const r of data || []) {
      (ing[r.dish_id] ||= []).push({ grams: r.grams, nome: r.foods?.name || '' });
    }
  }

  let senzaGruppo = 0;
  for (const p of piatti) {
    p.gruppo = gruppoDa(ing[p.id] || []);
    if (!p.gruppo) senzaGruppo++;
  }

  const utili = piatti.filter(p =>
    (!SENZA_GLUTINE || !p.contiene_glutine) &&
    p.profilo && p.profilo !== 'neutro' &&
    (p.tecnica || 'semplice') === 'semplice' &&
    (p.prep_min || 30) <= LIMITE_MIN &&
    (p.health_score || 0) >= 7
  );

  const vietati =
    DIETA === 'vegano' ? ['carne_rossa','carne_bianca','pesce','uova','formaggio'] :
    DIETA === 'vegetariano' ? ['carne_rossa','carne_bianca','pesce'] :
    DIETA === 'pescetariano' ? ['carne_rossa','carne_bianca'] : [];

  const ammessi = utili.filter(p => !vietati.includes(p.gruppo));

  console.log(`\nDieta: ${DIETA} | senza glutine: ${SENZA_GLUTINE}`);
  console.log(`Secondi totali: ${piatti.length}`);
  console.log(`Senza gruppo riconosciuto: ${senzaGruppo}  <-- se alto, le regex non agganciano`);
  console.log(`Utili dopo i filtri base: ${utili.length}`);
  console.log(`Ammessi dalla dieta: ${ammessi.length}\n`);

  // il test che conta: quali profili reggono una settimana
  const perProfilo = {};
  for (const p of ammessi) {
    (perProfilo[p.profilo] ||= { tot: 0, gruppi: new Set() }).tot++;
    if (p.gruppo) perProfilo[p.profilo].gruppi.add(p.gruppo);
  }

  console.log('Profilo'.padEnd(22), 'secondi', 'gruppi', 'quote-min raggiungibili?');
  for (const [pr, v] of Object.entries(perProfilo).sort((a,b) => b[1].tot - a[1].tot)) {
    const mancanti = Object.entries(QUOTE)
      .filter(([g, q]) => q.min > 0 && !v.gruppi.has(g))
      .map(([g]) => g);
    const ok = v.tot >= 5 && v.gruppi.size >= 2;
    console.log(
      pr.padEnd(22),
      String(v.tot).padStart(6),
      String(v.gruppi.size).padStart(6),
      mancanti.length ? '  MANCA: ' + mancanti.join(', ') : '  ok',
      ok ? '' : '  <-- non dominante'
    );
  }
})();