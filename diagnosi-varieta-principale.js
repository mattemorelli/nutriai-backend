require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const { caricaPiatti, foodIdVietatiPerDieta } = require('./genera.js');
const { clienteConAccompagnamenti } = require('./simula-accompagnamenti-pane-patate.js');

function ammessoBase(idVietatiDieta) {
  return (p) => {
    const ingredienti = p.ingredienti || p.dish_ingredients || [];
    for (const i of ingredienti) {
      const fid = i.food_id || (i.foods && i.foods.id);
      if (fid && idVietatiDieta.has(fid)) return false;
    }
    return true;
  };
}

(async () => {
  const finto = clienteConAccompagnamenti(supabase);
  for (const dieta of ['vegetariano', 'vegano']) {
    console.log(`\n=== ${dieta.toUpperCase()}: varieta' ingrediente principale tra i secondi ===`);
    const idVietati = new Set(await foodIdVietatiPerDieta(finto, dieta));
    const ammesso = ammessoBase(idVietati);
    const piatti = (await caricaPiatti(finto, ['mediterranea'], 6)).filter(ammesso);
    const secondi = piatti.filter(p => p.meal_slot === 'secondo');

    const perPrincipale = {};
    for (const p of secondi) {
      const k = p.principale || '(nessuno)';
      (perPrincipale[k] ||= []).push(p.name);
    }
    const righe = Object.entries(perPrincipale).sort((a, b) => b[1].length - a[1].length);
    console.log(`secondi totali: ${secondi.length}, ingredienti principali distinti: ${righe.length}`);
    for (const [principale, nomi] of righe) {
      console.log(`  ${principale.padEnd(20)} x${nomi.length}  -  ${nomi.slice(0, 4).join(', ')}${nomi.length > 4 ? '...' : ''}`);
    }
    // La regola "non piu' di 2-3 volte a settimana" per principale: quanti
    // principali hanno ALMENO 3 piatti distinti (il minimo per riempire le
    // caselle assegnate a quel principale senza mai ripetere lo stesso piatto)?
    const conAlmeno3 = righe.filter(([, nomi]) => nomi.length >= 3).length;
    const conAlmeno2 = righe.filter(([, nomi]) => nomi.length >= 2).length;
    console.log(`principali con >=3 piatti distinti: ${conAlmeno3} | con >=2: ${conAlmeno2} | con 1 solo: ${righe.filter(([,n])=>n.length===1).length}`);
  }
})();
