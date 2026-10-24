// Controllo permanente, sola lettura: ogni allergene che l'onboarding offre
// come scelta dedicata (ESCLUSIONI in screens/Onboarding.js, app Expo) deve
// risolvere SEMPRE sulla sua categoria intera in categorie_alimenti, mai sul
// nome di un singolo prodotto - vedi CATEGORIA_ALLERGENE in genera.js.
//
// Bug corretto il 2026-10-21 (indagine sulla capienza del generatore):
// risolviSubject cercava prima un alimento per nome, e per 'glutine' e
// 'uova' un prodotto il cui nome CONTENEVA quella parola (es. "Pane senza
// glutine", "Uova di quaglia") vinceva per sottostringa prima che la
// categoria vera venisse mai interrogata - un celiaco o un allergico alle
// uova finiva con una esclusione quasi vuota. Questo script fallisce
// (exit code 1) se succede di nuovo, su QUALUNQUE allergene, per QUALUNQUE
// ragione: tipo di risoluzione sbagliato, categoria sbagliata, o una
// categoria che si e' svuotata rispetto a quanto registrato qui sotto.
//
// Uso: node verifica-risoluzione-allergeni.js
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const { risolviSubject, caricaCatalogoPerRisoluzione, CATEGORIA_ALLERGENE, normalizza } = require('./genera.js');

// Quanti alimenti risultavano taggati per ciascuna categoria il giorno
// della correzione (2026-10-21): la soglia di allarme sta al 80% di questo
// numero, cosi' una normale aggiunta/rimozione di qualche alimento al
// catalogo non fa fallire il controllo, ma un crollo (es. una migrazione
// che svuota la categoria, o un alias cancellato per errore) si'.
const CONTEGGIO_REGISTRATO = {
  glutine: 59, lattosio: 60, frutta_guscio: 14,
  crostacei: 11, molluschi: 6, uova: 9, soia: 17,
};

(async () => {
  const catalogo = await caricaCatalogoPerRisoluzione(supabase);
  const problemi = [];

  // Gli stessi 7 codici che screens/Onboarding.js (app Expo) offre come
  // ESCLUSIONI dedicate (crostacei vi aggiunge sempre anche molluschi, ma
  // ciascuno dei due va verificato anche da solo, essendo un codice valido
  // di per se'). Se l'onboarding ne aggiunge uno nuovo in futuro, va
  // aggiunto anche qui E a CATEGORIA_ALLERGENE in genera.js - altrimenti
  // questo controllo non lo saprebbe mai.
  const ALLERGENI_ONBOARDING = ['glutine', 'lattosio', 'frutta_guscio', 'crostacei', 'molluschi', 'uova', 'soia'];

  for (const subject of ALLERGENI_ONBOARDING) {
    if (!CATEGORIA_ALLERGENE[normalizza(subject)]) {
      problemi.push(`"${subject}" e' nell'elenco degli allergeni dell'onboarding ma non ha una voce in CATEGORIA_ALLERGENE (genera.js) - risolverebbe con la ricerca per nome, non sulla categoria.`);
      continue;
    }

    let risolto;
    try {
      risolto = risolviSubject(subject, catalogo);
    } catch (e) {
      problemi.push(`"${subject}": risolviSubject ha lanciato un errore - ${e.message}`);
      continue;
    }

    if (risolto.tipo !== 'categoria') {
      problemi.push(`"${subject}" risolve come '${risolto.tipo}' invece che 'categoria' (${risolto.tipo === 'alimenti' ? risolto.foodIds.length + ' alimenti trovati per nome' : 'irrisolto'}) - rischia di escludere solo un prodotto specifico invece di tutti gli alimenti con questo allergene.`);
      continue;
    }

    const atteso = CONTEGGIO_REGISTRATO[subject];
    const nAlimenti = (catalogo.foodIdPerCategoria.get(risolto.codice) || []).length;
    if (atteso != null && nAlimenti < atteso * 0.8) {
      problemi.push(`"${subject}" risolve sulla categoria '${risolto.codice}' ma con solo ${nAlimenti} alimenti (erano ${atteso} il 2026-10-21, sotto l'80% e' un crollo da controllare).`);
    } else {
      console.log(`OK  "${subject}" -> categoria '${risolto.codice}' (${nAlimenti} alimenti, erano ${atteso ?? '?'})`);
    }
  }

  if (problemi.length) {
    console.log(`\n${problemi.length} PROBLEMA/I TROVATO/I:`);
    for (const p of problemi) console.log('  - ' + p);
    process.exitCode = 1;
  } else {
    console.log('\nTutti gli allergeni dell\'onboarding risolvono correttamente sulla loro categoria.');
  }
})();
