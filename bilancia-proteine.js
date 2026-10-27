// Scambia calorie fra ricette gia' scelte: piu' spazio a quelle con
// maggiore densita' proteica, senza cambiare il totale energetico.
// E' una ricerca locale: se non trova altro spazio, il chiamante continua
// a scegliere ricette diverse e a dichiarare gli eventuali deficit.
function bilanciaProteine(stato, target, limiti) {
  if (!Number.isFinite(target) || target <= 0 || stato.length < 2) return stato;
  const EPS = 1e-8;
  const totale = campo => stato.reduce((s, x) => s + (x.p.piatto[campo] || 0) * x.f, 0);
  let proteine = totale('protein');
  if (proteine >= target - EPS) return stato;
  const saleMax = Math.max(totale('salt'), limiti.saleMaxGiorno);
  const saturiMax = Math.max(totale('satFat'), limiti.satMaxGiorno);
  const fibraMin = Math.min(totale('fibre'), limiti.fibraMinGiorno);
  const righe = stato.filter(x => Number.isFinite(x.p.piatto.kcal) && x.p.piatto.kcal > 0)
    .map(x => ({ x, kcal: x.p.piatto.kcal,
      proteine: (x.p.piatto.protein || 0) / x.p.piatto.kcal,
      sale: (x.p.piatto.salt || 0) / x.p.piatto.kcal,
      saturi: (x.p.piatto.satFat || 0) / x.p.piatto.kcal,
      fibra: (x.p.piatto.fibre || 0) / x.p.piatto.kcal,
    }));

  // Limite esplicito per la ricerca, anche con margini numerici minuscoli.
  for (let i = 0; i < 2 * stato.length * stato.length; i++) {
    const sale = totale('salt'), saturi = totale('satFat'), fibra = totale('fibre');
    let migliore = null;
    for (const riceve of righe) for (const cede of righe) {
      const guadagno = riceve.proteine - cede.proteine;
      if (riceve === cede || guadagno <= EPS) continue;
      let kcal = Math.min(
        (riceve.x.lim[1] - riceve.x.f) * riceve.kcal,
        (cede.x.f - cede.x.lim[0]) * cede.kcal,
        (target - proteine) / guadagno,
      );
      const deltaSale = riceve.sale - cede.sale;
      const deltaSaturi = riceve.saturi - cede.saturi;
      const deltaFibra = riceve.fibra - cede.fibra;
      // Un piccolo margine evita che gli errori in virgola mobile facciano
      // risultare oltre soglia una giornata arrivata esattamente al tetto.
      if (deltaSale > 0) kcal = Math.min(kcal, Math.max(0, saleMax - sale - EPS) / deltaSale);
      if (deltaSaturi > 0) kcal = Math.min(kcal, Math.max(0, saturiMax - saturi - EPS) / deltaSaturi);
      if (deltaFibra < 0) kcal = Math.min(kcal, Math.max(0, fibra - fibraMin - EPS) / -deltaFibra);
      const proteineInPiu = kcal * guadagno;
      if (kcal > EPS && proteineInPiu > EPS && (!migliore || proteineInPiu > migliore.proteineInPiu + EPS)) {
        migliore = { riceve, cede, kcal, proteineInPiu };
      }
    }
    if (!migliore) break;
    const { riceve, cede, kcal } = migliore;
    riceve.x.f = Math.min(riceve.x.lim[1], riceve.x.f + kcal / riceve.kcal);
    cede.x.f = Math.max(cede.x.lim[0], cede.x.f - kcal / cede.kcal);
    proteine = totale('protein');
    if (proteine >= target - EPS) break;
  }
  return stato;
}

module.exports = { bilanciaProteine };
