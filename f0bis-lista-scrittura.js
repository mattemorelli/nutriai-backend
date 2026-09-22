require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { caricaPiatti } = require('./genera');

const CATEGORIE_DIETA = {
  vegano:       ['carne_rossa', 'carne_bianca', 'pesce', 'crostacei', 'molluschi', 'uova', 'latticini', 'lattosio'],
  vegetariano:  ['carne_rossa', 'carne_bianca', 'pesce', 'crostacei', 'molluschi'],
  pescetariano: ['carne_rossa', 'carne_bianca', 'maiale'],
};

const CONFIG = [
  { nome: 'vegetariano + centro_nord_generico', dieta: 'vegetariano', paeseGenerico: 'centro_nord_generico' },
  { nome: 'vegano + centro_nord_generico', dieta: 'vegano', paeseGenerico: 'centro_nord_generico' },
  { nome: 'vegetariano + centro_nord_generico (Portogallo+Germania)', dieta: 'vegetariano', paeseGenerico: 'centro_nord_generico' },
];

async function alimentiVietati(dieta) {
  const vietati = new Set();
  for (const cat of (CATEGORIE_DIETA[dieta] || [])) {
    const { data } = await supabase.from('categorie_alimenti').select('food_id').eq('categoria', cat);
    for (const r of (data || [])) vietati.add(r.food_id);
  }
  return vietati;
}

(async () => {
  const piatti = await caricaPiatti(supabase, ['mediterranea'], 7);

  const viste = new Set();
  for (const cfg of CONFIG) {
    const chiave = cfg.dieta + '|' + cfg.paeseGenerico;
    if (viste.has(chiave)) continue;
    viste.add(chiave);

    const vietati = await alimentiVietati(cfg.dieta);
    const ammesso = (p) => !(p.ingredienti || []).some(i => vietati.has(i.food_id));

    const secondiGenerico = piatti.filter(p =>
      p.meal_slot === 'secondo' && p.paese === cfg.paeseGenerico &&
      p.profilo && p.profilo !== 'neutro' && ammesso(p)
    );

    const perProfilo = {};
    for (const p of secondiGenerico) {
      if (!perProfilo[p.profilo]) perProfilo[p.profilo] = [];
      perProfilo[p.profilo].push(p.name);
    }

    console.log(`\n=== ${cfg.paeseGenerico}, dieta ${cfg.dieta}: secondi disponibili per profilo (servono 7 per reggere una settimana da solo) ===`);
    // Includo anche i profili europeo-* che oggi hanno zero, per completezza della lista di scrittura.
    const profiliEuropei = ['europeo-aceto', 'europeo-burro', 'europeo-erbe', 'europeo-brasato', 'europeo-panna'];
    for (const profilo of profiliEuropei) {
      const lista = perProfilo[profilo] || [];
      const mancano = Math.max(0, 7 - lista.length);
      console.log(`  ${profilo}: ha ${lista.length} secondi (${lista.join(', ') || 'nessuno'}) - mancano ${mancano}`);
    }
  }
})();
