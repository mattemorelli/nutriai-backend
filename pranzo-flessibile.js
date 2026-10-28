// Recupero delle sole settimane che il modello primo+contorno non completa.
// I piatti sono sempre selezionati dai filtri ordinari del generatore.
function creaPranzoFlessibile({ statoGiorni, candidatiPrimo, candidatiSecondo, assegnaSlot, assegnaSecondoPranzoScelto, capacitaEnergetica }) {
  function candidatiPrincipalePranzo(gi, profilo, paese, generico, paeseOk, limite) {
    const primi = candidatiPrimo(gi, profilo, paese, generico, paeseOk, limite)
      .map(piatto => ({ slot: 'primo', piatto }));
    const secondi = candidatiSecondo(gi, profilo, paese, generico, paeseOk, limite, 'pranzo')
      .map(piatto => ({ slot: 'secondo', piatto }));
    // Nei feriali il tempo/tecnica sono piu' stretti del weekend. Se il
    // pool attuale dei primi non copre i giorni rimanenti dello stesso
    // regime, esplora prima un secondo, conservando tutti i candidati.
    // A zero spuntini prova prima le ricette che possono fornire piu'
    // energia entro i limiti di porzione. Cambia solo l'ordine di ricerca.
    if (capacitaEnergetica) return [...primi, ...secondi].sort((a, b) => capacitaEnergetica(b) - capacitaEnergetica(a));
    const giorniNelloStessoRegime = gi < 5 ? 5 - gi : 7 - gi;
    return primi.length < giorniNelloStessoRegime ? [...secondi, ...primi] : [...primi, ...secondi];
  }
  function assegnaPrincipalePranzo(gi, scelta) {
    const st = statoGiorni[gi];
    if (st.primo !== undefined || st.secondoPranzo !== undefined) throw new Error('Principale pranzo gia assegnato');
    if (scelta.slot === 'primo') return assegnaSlot(gi, 'primo', scelta.piatto);
    if (scelta.slot !== 'secondo') throw new Error('Principale pranzo non valido');
    // I contatori di gruppi, salse e piatti usati restano quelli ordinari.
    const annulla = assegnaSecondoPranzoScelto(gi, scelta.piatto);
    st.primo = null;
    return () => { annulla(); delete st.primo; };
  }
  return { candidatiPrincipalePranzo, assegnaPrincipalePranzo };
}
module.exports = { creaPranzoFlessibile };
