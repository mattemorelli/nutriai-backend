// SOLA LETTURA: client finto che inietta nella risposta di
// categorie_alimenti le righe della migrazione 2026-10-22-categorie-pane-
// patate.sql, SENZA scrivere nulla nel database vero - serve solo per
// misurare/testare stanotte prima che la migrazione venga lanciata domani.
// Usato da bisect-matrice.js e da misura-tipo-amido.js.
const EXTRA = [
  ['pane_comune_crea', 'pane'], ['pane_integrale_it', 'pane'], ['pane_senza_glutine_it', 'pane'],
  ['pane_segale_it', 'pane'], ['pane_carasau_it', 'pane'], ['grissini_it', 'pane'],
  ['174957', 'pane'], ['167942', 'pane'], ['174915', 'pane'], ['174924', 'pane'],
  ['170028', 'patate'],
].map(([food_id, categoria]) => ({ food_id, categoria }));

function clienteConCategoriePanePatate(reale) {
  return {
    from(tabella) {
      if (tabella !== 'categorie_alimenti') return reale.from(tabella);
      let filtroCategoriaEq = null;
      let filtroCategoriaIn = null;
      const builder = {
        select() { return builder; },
        eq(campo, val) { if (campo === 'categoria') filtroCategoriaEq = val; return builder; },
        in(campo, vals) { if (campo === 'categoria') filtroCategoriaIn = vals; return builder; },
        then(resolve, reject) {
          (async () => {
            const soloFoodId = filtroCategoriaEq != null || filtroCategoriaIn != null;
            let q = reale.from('categorie_alimenti').select(soloFoodId ? 'food_id' : 'food_id, categoria');
            if (filtroCategoriaEq != null) q = q.eq('categoria', filtroCategoriaEq);
            if (filtroCategoriaIn != null) q = q.in('categoria', filtroCategoriaIn);
            const risposta = await q;
            if (risposta.error) { resolve(risposta); return; }
            const passaFiltro = (r) =>
              (filtroCategoriaEq == null || r.categoria === filtroCategoriaEq) &&
              (filtroCategoriaIn == null || filtroCategoriaIn.includes(r.categoria));
            const extra = EXTRA.filter(passaFiltro).map(r => (soloFoodId ? { food_id: r.food_id } : r));
            resolve({ data: [...risposta.data, ...extra], error: null });
          })().catch(reject);
        },
      };
      return builder;
    },
  };
}

module.exports = { clienteConCategoriePanePatate, EXTRA };
