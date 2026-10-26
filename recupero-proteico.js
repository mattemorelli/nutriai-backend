// Il recupero delle proteine riusa i selettori ordinari. Qui vive solo
// il cambio reversibile di una portata gia' scelta, con i suoi contatori.
function creaRecuperoProteico({
  statoGiorni, usati, usoGruppi, usoSalse, usoSpuntini,
  contestoGiorno, candidatiSecondo, candidatiSpuntino, candidatiSpuntino3,
  assegnaSecondoScelto, assegnaSpuntinoScelto,
  accompagnaBene, tipiAccompagnamentoDaSecondo, tipoAmidoDiAccompagnamento, copreRuolo,
}) {
  const densita = p => (p.protein || 0) / (p.kcal || 1);
  const ordina = candidati => candidati.slice().sort((a, b) => densita(b) - densita(a));

  function slotBloccato(gi, nomeSlot) {
    const st = statoGiorni[gi], p = st[nomeSlot];
    return Boolean(p && st.bloccatiOggi?.some(b => b.piatto.id === p.id));
  }
  function secondoProtetto(gi) {
    const st = statoGiorni[gi];
    // Un avanzo mantiene l'identita' della portata preparata prima. Una
    // ripetizione mantiene la scelta e il suo budget settimanale: il
    // recupero prova gli spuntini o torna alle scelte precedenti.
    return slotBloccato(gi, 'secondo') || st.secondoEAvanzo || st.secondoERipetizione;
  }
  function senzaSlot(gi, slot, fn) {
    const st = statoGiorni[gi], p = st[slot];
    delete st[slot];
    try { return fn(); } finally { st[slot] = p; }
  }
  function candidatiSecondoProteico(gi) {
    const st = statoGiorni[gi], attuale = st.secondo;
    if (!attuale || secondoProtetto(gi)) return [];
    const ctx = contestoGiorno(gi);
    const compagni = [st.contornoCena, st.base].filter(Boolean);
    // La portata sostituita non deve impedire un'altra ricetta con lo
    // stesso ingrediente principale, ne' occupare il posto della salsa.
    const salsePrima = usoSalse.valore;
    if (attuale.salsa_industriale) usoSalse.valore--;
    let candidati;
    try {
      candidati = senzaSlot(gi, 'secondo', () => candidatiSecondo(
        gi, ctx.profiloGiorno, st.paeseGiorno, st.genericoOggi, ctx.paeseOk, st.limiteBase,
      ));
    } finally { usoSalse.valore = salsePrima; }
    return ordina(candidati.filter(p => p.id !== attuale.id && !usati.has(p.id)
      && compagni.every(c => accompagnaBene(p, c))
      && (!st.base || tipiAccompagnamentoDaSecondo(p).includes(tipoAmidoDiAccompagnamento(st.base)))));
  }
  function assegnaSecondoProteico(gi, piatto) {
    const st = statoGiorni[gi], precedente = st.secondo;
    if (secondoProtetto(gi)) throw new Error('Il recupero non puo sostituire un secondo protetto');
    const flagAvanzo = st.secondoEAvanzo, flagRipetizione = st.secondoERipetizione;
    usati.delete(precedente.id);
    if (precedente.gruppo) usoGruppi[precedente.gruppo]--;
    if (precedente.salsa_industriale) usoSalse.valore--;
    const annullaNuovo = assegnaSecondoScelto(gi, piatto);
    return () => {
      annullaNuovo();
      st.secondo = precedente;
      st.secondoEAvanzo = flagAvanzo;
      st.secondoERipetizione = flagRipetizione;
      usati.add(precedente.id);
      if (precedente.gruppo) usoGruppi[precedente.gruppo] = (usoGruppi[precedente.gruppo] || 0) + 1;
      if (precedente.salsa_industriale) usoSalse.valore++;
    };
  }

  function candidatiSpuntinoProteico(gi, nomeSlot) {
    const st = statoGiorni[gi], attuale = st[nomeSlot];
    if (!attuale || slotBloccato(gi, nomeSlot)) return [];
    const ctx = contestoGiorno(gi);
    const altri = ['spuntino', 'spuntino2', 'spuntino3'].filter(s => s !== nomeSlot).map(s => st[s]).filter(Boolean);
    const altroOrdinario = nomeSlot === 'spuntino' ? st.spuntino2 : st.spuntino;
    const candidati = senzaSlot(gi, nomeSlot, () => nomeSlot === 'spuntino3'
      ? candidatiSpuntino3(gi, ctx.profiloGiorno, ctx.paeseOkLeggero, ctx.cappaSpuntino)
      : candidatiSpuntino(gi, ctx.profiloGiorno, ctx.paeseOkLeggero, altroOrdinario, ctx.cappaSpuntino));
    return ordina(candidati.filter(p => p.id !== attuale.id
      && !altri.some(a => a.id === p.id)
      && (!copreRuolo(p, 'base_amidacea') || !altri.some(a => copreRuolo(a, 'base_amidacea')))));
  }
  function assegnaSpuntinoProteico(gi, nomeSlot, piatto) {
    const st = statoGiorni[gi], precedente = st[nomeSlot];
    if (slotBloccato(gi, nomeSlot)) throw new Error('Il recupero non puo sostituire uno spuntino bloccato');
    const nPrima = usoSpuntini.get(precedente.id) || 0;
    if (nPrima <= 1) usoSpuntini.delete(precedente.id); else usoSpuntini.set(precedente.id, nPrima - 1);
    const annullaNuovo = assegnaSpuntinoScelto(gi, nomeSlot, piatto);
    return () => {
      annullaNuovo();
      st[nomeSlot] = precedente;
      if (nPrima) usoSpuntini.set(precedente.id, nPrima); else usoSpuntini.delete(precedente.id);
    };
  }
  return { slotBloccato, candidatiSecondoProteico, assegnaSecondoProteico, candidatiSpuntinoProteico, assegnaSpuntinoProteico };
}

module.exports = { creaRecuperoProteico };
