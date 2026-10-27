// CONTROLLO PRIMA DEL PUSH - cosa fa e come si lancia
// ======================================================
// In italiano semplice: prima di spingere codice sul repository, questo
// comando controlla che il generatore di piani non sia rotto. Lancia in
// fila quattordici controlli e ne riporta tutti gli esiti: se anche uno solo
// fallisce, l'intero comando fallisce (exit code
// diverso da 0) e git non lascia partire il push (e' installato come hook
// pre-push, vedi scripts/installa-hook-pre-push.sh).
//
// I quattordici controlli, in ordine:
//   1. node --check su tutti i file .js del backend - niente di rotto a
//      livello di sintassi (non esegue il codice, solo lo legge).
//   2. verifica-flag-allergeni.js - le etichette "contiene glutine/
//      lattosio/frutta a guscio" dei piatti devono coincidere con gli
//      ingredienti veri.
//   3. verifica-risoluzione-allergeni.js - ogni allergene dell'onboarding
//      deve escludere la sua categoria intera, mai un singolo prodotto per
//      nome (il bug del 21 ottobre).
//   4. verifica-tipo-amido.js - il controllo permanente pane/patate (il
//      bug del 9 ottobre): il riconoscimento deve passare dalle categorie
//      vere, non da un elenco fisso, e i numeri devono essere quelli
//      attesi.
//   5. scripts/verifica-ricette.js --db - ogni ricetta (passi Cook) nel
//      database rispetta l'elenco chiuso delle azioni (azioni_cook),
//      fuoco/tipo_tempo/forno_modalita nei valori ammessi, niente quantita'
//      assolute nel testo, le quote per ingrediente sommano a 1, l'ordine
//      preriscaldare/infornare e scaldare-acqua/bollire e' giusto - il
//      controllo nato il 23 ottobre dal fermo a meta' del lotto 02
//      (ricetta_passi_fuoco_check su un valore "medio-basso" inventato):
//      ora un lotto futuro con lo stesso problema viene fermato QUI, prima
//      di scrivere, non a meta' scrittura.
//   6. scripts/verifica-matrice-ridotta.js - 12 combinazioni dieta+allergie
//      rappresentative (non tutte le 36x3 della matrice completa, quella
//      ci vuole troppo per un controllo ad ogni push) devono generare una
//      settimana valida.
//   7. scripts/verifica-nomi-piatti.js - nessun nome di piatto (italiano o
//      inglese) contiene parole tecniche o note interne ("proxy", "test",
//      "tmp", parentesi con il meal_slot dentro...) - il controllo nato il
//      23 ottobre dall'audit dei nomi, dopo aver trovato "Pecorino con fave
//      (proxy lenticchie)" nel catalogo. Blocca solo per il mercato 'it'
//      (l'unico attivo oggi); per gli altri mercati stampa solo un avviso.
//   8. scripts/verifica-paginazione.js - nessuna lettura di produzione
//      (server.js, genera.js e gli altri moduli che importa) legge una
//      tabella grande o in crescita (dishes, dish_ingredients, plan_items,
//      prodotti, ricetta_passi, foods, categorie_alimenti, tag_nutrizionali,
//      alias_categoria) per intero, senza paginazione (.range()) e senza un
//      filtro che la restringa - PostgREST tronca a 1000 righe senza
//      errore. Nato dall'audit del 24 ottobre, dopo aver trovato genera.js
//      che leggeva foods/categorie_alimenti/tag_nutrizionali/alias_categoria
//      per intero a ogni generazione, sotto 1000 righe oggi ma in crescita.
//   9. scripts/verifica-voto-saturato.js - segnala (avviso, non bloccante)
//      i piatti il cui voto salute e' rimasto esattamente al soffitto che
//      la formula calcolerebbe da sola, mai calibrato a mano confrontando
//      con piatti simili - nato il 25 ottobre dopo aver trovato 18 piatti
//      recenti (lotto delle cene veloci, lotto 02) bloccati a 10.
//  10. test-porzioni.js e scripts/verifica-profili-nutrizionali.js - limiti
//      effettivi, target irraggiungibili, valori finali di plan_items e 12
//      profili con kcal/proteine esplicite (la matrice ridotta non le ha).
//      Include bilanciamento proteico a calorie costanti, sale/saturi/fibra
//      preservati e concessioni coerenti con le porzioni finali.
//  11. test-fabbisogno.js e test-errori-profilo.js - nessun errore di
//      lettura viene scambiato per allenamenti, PAL o piatti bloccati
//      assenti, oppure per un profilo onnivoro di default.
//  12. test-sicurezza-input.js - limiti di eta'/peso/altezza e BMI-obiettivo.
//  13. test-recupero-proteico.js e scripts/verifica-recupero-proteico.js:
//      stessi filtri della scelta ordinaria, piatti bloccati preservati,
//      contatori reversibili, 12 casi difficili e riproducibilita del
//      tentativo finale dopo ricerche interrotte dal tempo.
//  14. Modelli di pranzo/cena: composizione, tempi complessivi, rigenerazione
//      con portate bloccate e Swap che conserva i ruoli del pasto.
//
// Uso: npm run verifica
// (lo stesso identico comando lo lancia da solo git, da questa cartella,
// ad ogni "git push" - vedi scripts/installa-hook-pre-push.sh)
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const RADICE = path.join(__dirname, '..');
const risultati = [];

function passo(titolo, fn) {
  console.log(`\n=== ${titolo} ===`);
  const inizio = Date.now();
  try {
    fn();
    const secondi = (Date.now() - inizio) / 1000;
    console.log(`OK (${secondi.toFixed(1)}s)`);
    risultati.push({ titolo, ok: true, secondi });
  } catch (e) {
    const secondi = (Date.now() - inizio) / 1000;
    console.log(`FALLITO (${secondi.toFixed(1)}s): ${e.message}`);
    risultati.push({ titolo, ok: false, secondi, errore: e.message });
  }
}

function lanciaNodeCheck() {
  const file = fs.readdirSync(RADICE).filter((f) => f.endsWith('.js'));
  const fileScripts = fs.readdirSync(path.join(RADICE, 'scripts')).filter((f) => f.endsWith('.js')).map((f) => 'scripts/' + f);
  const tutti = [...file, ...fileScripts];
  const falliti = [];
  for (const f of tutti) {
    try {
      execFileSync(process.execPath, ['--check', f], { cwd: RADICE, stdio: 'pipe' });
    } catch (e) {
      falliti.push(`${f}: ${e.stderr?.toString().split('\n')[0] || e.message}`);
    }
  }
  console.log(`  ${tutti.length} file controllati`);
  if (falliti.length) throw new Error(`${falliti.length} file con errori di sintassi:\n    ` + falliti.join('\n    '));
}

function lanciaScript(comando) {
  const [relPath, ...args] = comando.split(' ');
  execFileSync(process.execPath, [relPath, ...args], { cwd: RADICE, stdio: 'inherit' });
}

passo('1. node --check sui file del backend', lanciaNodeCheck);
passo('2. Flag allergeni (contiene_glutine/lattosio/frutta_secca) coerenti con gli ingredienti', () => lanciaScript('verifica-flag-allergeni.js'));
passo('3. Risoluzione allergeni: ogni vincolo esclude la categoria intera', () => lanciaScript('verifica-risoluzione-allergeni.js'));
passo('4. Controllo permanente pane/patate', () => lanciaScript('verifica-tipo-amido.js'));
passo('5. Ricette Cook: azioni/fuoco/quote validi su tutto il database', () => lanciaScript('scripts/verifica-ricette.js --db'));
passo('6. Matrice ridotta (12 combinazioni dieta+allergie)', () => lanciaScript('scripts/verifica-matrice-ridotta.js'));
passo('7. Nomi dei piatti: niente note tecniche o interne nel mercato "it"', () => lanciaScript('scripts/verifica-nomi-piatti.js'));
passo('8. Paginazione: niente letture di produzione a rischio di troncatura a 1000 righe', () => lanciaScript('scripts/verifica-paginazione.js'));
passo('9. Voti salute: nessun piatto fermo al soffitto calcolato senza calibrazione a mano', () => lanciaScript('scripts/verifica-voto-saturato.js'));
passo('10. Porzioni e 12 profili con fabbisogni espliciti', () => {
  lanciaScript('test-porzioni.js');
  lanciaScript('scripts/verifica-profili-nutrizionali.js');
});
passo('11. Fabbisogno e profilo: errori di lettura distinti da dati assenti', () => {
  lanciaScript('test-fabbisogno.js');
  lanciaScript('test-errori-profilo.js');
});
passo('12. Sicurezza input: eta, peso, altezza e BMI-obiettivo', () => lanciaScript('test-sicurezza-input.js'));
passo('13. Recupero proteico: vincoli, piatti bloccati e contatori', () => {
  lanciaScript('test-recupero-proteico.js');
  lanciaScript('scripts/verifica-recupero-proteico.js');
});

passo('14. Modelli dei pasti e sostituzioni coerenti', () => {
  lanciaScript('test-modelli-pasto.js');
  lanciaScript('test-sostituisci-modelli.js');
  lanciaScript('scripts/verifica-modelli-pasto.js');
});

const falliti = risultati.filter((r) => !r.ok);
console.log(`\n${'='.repeat(60)}`);
console.log(`RIEPILOGO: ${risultati.length - falliti.length}/${risultati.length} controlli superati.`);
for (const r of risultati) console.log(`  ${r.ok ? 'OK  ' : 'XX  '} ${r.titolo}`);

if (falliti.length) {
  console.log(`\n${falliti.length} controllo/i falliti - il push NON deve continuare.`);
  process.exitCode = 1;
} else {
  console.log('\nTutti i controlli superati.');
}
