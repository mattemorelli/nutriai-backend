console.log('[genera] v6-piano-proteico caricato');

// Il generico è ammesso solo dentro la sua famiglia: un piatto
// "mediterraneo generico" sta bene in una giornata italiana,
// non in una giapponese.
const GENERICO_DI = {
  italia: 'mediterraneo_generico', francia: 'mediterraneo_generico',
  spagna: 'mediterraneo_generico', grecia: 'mediterraneo_generico',
  portogallo: 'mediterraneo_generico',
  germania: 'centro_nord_generico', regno_unito: 'centro_nord_generico',
  giappone: 'asia_generico', cina: 'asia_generico', thailandia: 'asia_generico',
  corea: 'asia_generico', vietnam: 'asia_generico',
  messico: 'latino_generico', argentina: 'latino_generico',
  brasile: 'latino_generico', ande: 'latino_generico',
  stati_uniti: null, australia: 'mediterraneo_generico',
};

const GENERICI = ['mediterraneo_generico', 'asia_generico', 'latino_generico', 'centro_nord_generico'];
// A quale macro-area appartiene ciascun generico: centro_nord_generico e'
// comunque Europa (i paesi che vi ricadono, Germania e Regno Unito, sono
// sotto la stessa cucina 'europea' -> famiglia 'mediterranea' di
// Italia/Francia/Spagna in FAMIGLIE_PER_CUCINA). Un tedesco che finisce nel
// pool mediterraneo resta in Europa; solo asia_generico e latino_generico
// sono davvero un'altra macro-area (Fase 3 Passo C bis, C9).
const FAMIGLIA_DI_GENERICO = {
  mediterraneo_generico: 'mediterranea',
  centro_nord_generico: 'mediterranea',
  asia_generico: 'asiatica',
  latino_generico: 'latina',
};

const CORPUS_VERSION = 'v8-paesi-e-vincoli';

// Lancio Italia (2026-10-08): il mercato attivo e' un cancello assoluto,
// non un gusto - a differenza di paesi/user_cuisine_preferences, che
// restano un peso morbido dentro il pool gia' filtrato per mercato. Un solo
// punto da cambiare quando si aprira' un altro mercato (o si passera' a
// leggerlo per utente/regione invece che come costante globale).
// Vedi nutriai/audit/solo-italiano.md per l'analisi che ha portato a
// dishes.mercati e la lista dei piatti qualificati per 'it'.
const MERCATO_ATTIVO = 'it';

// Pavimento di tempo per il PRANZO (24 ottobre 2026, audit "piano_impossibile"):
// evening_minutes e' dichiarato per la cena, non esiste un campo utente per
// il pranzo. Il primo (bollire l'acqua e' un tempo fisico reale) ha una
// mediana di 30 min nel catalogo e un solo piatto sotto i 15 - usare il
// tetto stretto della cena anche per il primo rendeva impossibile ogni
// profilo con una cena rapida, anche quando la cena da sola sarebbe stata
// benissimo risolvibile. 25 min e' appena sopra il 10 percentile dei primi
// reali (20,5): abbastanza perche' esista sempre una scelta vera.
const LIMITE_PRANZO_MINIMO = 25;

// PostgREST impone un tetto di righe per risposta (di default 1000)
// indipendente da .limit(): una lettura a tutta tabella (senza .eq/.in che
// la restringa) va sempre paginata con .range() e un ordinamento unico,
// altrimenti le righe oltre la millesima spariscono in silenzio - stessa
// funzione di server.js/spesa.js/tu.js, duplicata qui apposta (genera.js
// non le importa, per non introdurre una dipendenza incrociata). Scoperto
// il 23 ottobre in scripts/verifica-ricette.js (ricetta_passi troncata a
// 1000 righe su 1208 reali); l'audit del 24 ottobre ha trovato che QUESTO
// file leggeva foods/categorie_alimenti/tag_nutrizionali/alias_categoria
// per intero, senza paginazione, a ogni generazione - tabelle oggi sotto
// 1000 righe ma che crescono con il catalogo, quindi a rischio futuro.
async function paginaTutto(costruisciQuery) {
  const righe = [];
  const PAGINA = 1000;
  for (let offset = 0; ; offset += PAGINA) {
    const { data: blocco, error } = await costruisciQuery(offset, offset + PAGINA - 1);
    if (error) throw new Error(error.message);
    righe.push(...(blocco || []));
    if (!blocco || blocco.length < PAGINA) break;
  }
  return righe;
}

// ---- La scala: si sale di un gradino solo dopo aver esaurito onestamente quello precedente ----
// Ogni gradino eredita gli allentamenti di quelli precedenti (si sale,
// non si passa da uno all'altro): 3a e 3b restano due gradini distinti
// (Passo C bis, C9) perche' il danno culturale di un pool generico della
// STESSA famiglia (3a) e' nullo, quello di un'ALTRA macro-area (3b) no.
// A livello di modulo (non solo dentro generaESalva) perche' il controllo di
// capienza fuori linea (F0) deve scandire la STESSA scala della generazione
// vera, non una sua copia che puo' disallinearsi nel tempo.
const GRADINI = [
  { gradino: '0',  soglia: 7,   opz: {} },
  { gradino: '1',  soglia: 7,   opz: { ripetizione: true } },
  { gradino: '2',  soglia: 7,   opz: { ripetizione: true, quotaTollerante: true } },
  // 2b (2026-09-17): il tetto sale/saturi (giornaliero, proporzionale al
  // fabbisogno, valutato sui valori SCALATI da adattaGiornata) e' un vincolo
  // vero dal gradino 0: un fallimento fa risalire il backtracking DENTRO la
  // giornata, come un vicolo cieco qualunque. Fino al gradino 2b compreso
  // niente lo allenta - si esaurisce onestamente il pool corretto prima di
  // concedere. tettoTollerante accetta il giorno comunque, registrando la
  // concessione: stessa famiglia di quotaTollerante (l'aritmetica non torna
  // esatta col pool attuale), non una concessione culturale come 3a/3b.
  { gradino: '2b', soglia: 7,   opz: { ripetizione: true, quotaTollerante: true, tettoTollerante: true } },
  { gradino: '3a', soglia: 7,   opz: { ripetizione: true, quotaTollerante: true, tettoTollerante: true, genericoStessaFamiglia: true } },
  { gradino: '3b', soglia: 7,   opz: { ripetizione: true, quotaTollerante: true, tettoTollerante: true, genericoStessaFamiglia: true, genericoQualunqueFamiglia: true } },
  { gradino: '4',  soglia: 7,   opz: { ripetizione: true, quotaTollerante: true, tettoTollerante: true, genericoStessaFamiglia: true, genericoQualunqueFamiglia: true } },
  // 4b (2026-09-20): le preferenze alimentari (kind non_gradito + severity
  // preferibile) cedono qui, e solo qui - prima della soglia salute perche'
  // il voto e' la promessa centrale del prodotto. Allergie, intolleranze
  // e dieta non entrano in questo gradino ne' in nessun altro. CORREZIONE
  // (25 ottobre 2026, principio inviolabile): il tempo dichiarato (tetto
  // minuti per pasto) NON e' mai fra le cose che un gradino allenta - era
  // l'unica eccezione (tempoAllargato, tolto da qui e da tutti i gradini) e
  // violava "tempo per i pasti" dichiarato dall'utente, una scelta sua,
  // non una regola di qualita' interna.
  { gradino: '4b', soglia: 7, opz: { ripetizione: true, quotaTollerante: true, tettoTollerante: true, genericoStessaFamiglia: true, genericoQualunqueFamiglia: true, preferenzeTolleranti: true } },
  { gradino: '5',  soglia: 6.5, opz: { ripetizione: true, quotaTollerante: true, tettoTollerante: true, genericoStessaFamiglia: true, genericoQualunqueFamiglia: true, preferenzeTolleranti: true } },
  // Ultimo gradino (2026-10-09, terza correzione: "nessuno senza piano"):
  // SOLO qui le proteine possono restare sotto il 90% del minimo - mai nei
  // gradini precedenti, nemmeno 5-soglia-6.5. kcal (+-10%) e il tetto sale/
  // saturi restano vincoli veri anche qui: non e' "accetta qualunque cosa",
  // e' "fra le combinazioni che rispettano tutto il resto, consegna quella
  // con piu' proteine possibile invece di nessuna settimana". Il
  // ricercatore di proteine (provaAumentoProteine) ha gia' provato a
  // massimizzarle PRIMA che questo gradino venga anche solo tentato.
  { gradino: '5',  soglia: 6,   opz: { ripetizione: true, quotaTollerante: true, tettoTollerante: true, genericoStessaFamiglia: true, genericoQualunqueFamiglia: true, preferenzeTolleranti: true, proteinaTollerante: true } },
];

// Perche' un tentativo (un profilo, a un gradino) si e' fermato senza
// successo - tre motivi possibili, mai una regola cambiata: il tetto dei
// passi (C16, sopra) resta identico, 'tempo' e' solo un secondo tetto,
// sullo stesso punto di controllo (vedi avanzaFinDove), per il tetto di
// tempo massimo di ricerca (24 ottobre, indagine velocita' in produzione).
function descrizioneMotivoEsaurimento(motivo) {
  if (motivo === 'tetto') return 'tetto passi raggiunto';
  if (motivo === 'tempo') return 'tempo massimo di ricerca raggiunto';
  return 'esaurimento reale';
}

// Quanto ogni elemento puo' essere scalato. Le ancore hanno margini stretti,
// le leve margini ampi. E' questa distinzione che evita le porzioni assurde.
//
// CORREZIONE (25 ottobre 2026, "porzioni che scalano invece di aggiungere
// piatti"): secondo e contorno allargati dentro l'intervallo di porzione
// singola che le linee guida (LARN/CREA) considerano normale per un pasto,
// non oltre - una porzione di carne/pesce/legumi va comunemente da ~100g a
// ~200g secondo il fabbisogno della persona (un'ancora stretta a 0.9-1.3
// su una base di 150g restava 135-195g, sotto il range alto reale); le
// verdure come contorno tollerano porzioni piu' ampie senza diventare
// irrealistiche (restano a bassa densita' calorica). Prima di questa
// correzione, un fabbisogno alto (misurato: 3200 kcal) con un'ancora troppo
// stretta esauriva lo spazio di scala quasi subito e faceva scattare gli
// aumenti di emergenza (pane a pranzo, terzo spuntino, colazione piu'
// ricca) - una giornata con piu' voce invece di porzioni piu' generose. Il
// tetto assoluto (TETTO_GRAMMI sotto) resta la vera rete di sicurezza
// contro le porzioni assurde: questi rapporti non bastano da soli a
// produrne una, ci vuole anche un piatto a bassa densita' e un fabbisogno
// molto alto, ed e' li' che TETTO_GRAMMI interviene.
const LIMITI_SCALA = {
  base:      [0.4, 2.2],   // riso, pasta, pane, patate: la leva principale
  colazione: [0.8, 2.0],
  spuntino:  [0.8, 2.0],
  primo:     [0.7, 1.8],
  contorno:  [0.8, 1.8],   // era 1.5: le verdure tollerano porzioni piu' ampie
  secondo:   [0.85, 1.5],  // era 0.9-1.3: resta un'ancora, ma copre l'intervallo LARN 100-200g
};

// Tetto assoluto in grammi per portata (problema D, 2026-10-09): LIMITI_SCALA
// scala solo in proporzione alla ricetta base, mai con un massimo assoluto -
// su un fabbisogno kcal alto abbinato a un piatto a bassa densita' calorica
// (verdure, legumi) questo produceva porzioni singole non realistiche
// (misurato: 13% delle righe primo/secondo/contorno sopra 500g, fino a
// 1038g). Il tetto vince sempre sul rapporto: le kcal che non ci stanno in
// un piatto devono andare altrove (un altro piatto, piu' spuntino), mai
// gonfiare oltre il tetto. Valori di riferimento per ~2000 kcal/giorno.
const TETTO_GRAMMI = {
  primo: 450, secondo: 350, contorno: 350, pane: 120, patate: 350, colazione: 350, spuntino: 250,
  spuntino_frutta_secca: 40,
};

// I tetti sono calibrati su un fabbisogno di ~2000 kcal: un profilo a 3533
// kcal (vedi la verifica del 2026-10-09: giornate crollate a 1781-2032 kcal,
// ben sotto obiettivo, perche' ogni piatto satura un tetto pensato per
// un'altra persona) ha bisogno di porzioni piu' grandi per arrivarci, un
// profilo a 1590 kcal di porzioni piu' piccole. Scala come la radice quasi
// quadrata del rapporto kcal (esponente 0.7, non 1: le porzioni non devono
// crescere alla stessa velocita' delle kcal, altrimenti un fabbisogno
// doppio tornerebbe a porzioni-chilo - 0.7 e' lo stesso tipo di scala
// sub-lineare con cui le porzioni reali crescono con il fabbisogno). Tetti
// min 0.7x (verso i 1200 kcal, il minimo clinico) e max 1.8x (sopra i
// ~4600 kcal, oltre il range di questi profili).
function fattoreTetto(obiettivo) {
  if (!obiettivo) return 1;
  return Math.max(0.7, Math.min(1.8, Math.pow(obiettivo / 2000, 0.7)));
}

function limitiDi(p, obiettivo) {
  let ratio = p.piatto.base_amidacea ? LIMITI_SCALA.base : (LIMITI_SCALA[p.slot] || [0.9, 1.2]);
  // Proteine ancora sotto il minimo dopo aver scelto piatti diversi
  // (provaAumentoProteine, problema 2 della terza correzione): lascia
  // crescere il secondo fino a 1.5x (richiesto esplicitamente, oltre il
  // normale 1.3) e stringe primo e pane/patate - meno proteici per kcal -
  // sia in su che in giu', cosi' quando adattaGiornata ridistribuisce le
  // kcal la quota in piu' finisce sul secondo, non sul primo.
  if (p.cercaProteine) {
    if (p.slot === 'secondo') ratio = [ratio[0], 1.5];
    else if (p.slot === 'primo') ratio = [0.5, 1.1];
    else if (p.piatto.base_amidacea) ratio = [0.3, 1.3];
  }
  const tipo = tipoAmidoDiAccompagnamento(p.piatto);
  const fattore = fattoreTetto(obiettivo);
  const tettoGrammi = (tipo === 'pane' ? TETTO_GRAMMI.pane
    : tipo === 'patate' ? TETTO_GRAMMI.patate
    : (TETTO_GRAMMI[p.slot] || TETTO_GRAMMI.contorno)) * fattore;
  const grammiBase = p.piatto.grams || 0;
  if (!grammiBase) return ratio;
  let maxEffettivo = Math.min(ratio[1], tettoGrammi / grammiBase);
  // Frutta secca: il tetto vale sull'INGREDIENTE frutta a guscio/arachidi,
  // non sul piatto intero (problema 3 trovato alla verifica: "Mela e
  // mandorle" finiva a 40g totali, quando il problema erano solo le
  // mandorle - la mela puo' restare quanto serve).
  if (p.piatto.grammiFruttaSecca > 0) {
    const maxRatioNoce = (TETTO_GRAMMI.spuntino_frutta_secca * fattore) / p.piatto.grammiFruttaSecca;
    maxEffettivo = Math.min(maxEffettivo, maxRatioNoce);
  }
  // Se la ricetta base e' gia' piu' pesante del tetto anche al minimo
  // normale del rapporto (piatti a verdura abbondante, bassa densita'
  // calorica: 672g di "Lenticchie e spinaci" restano 605g anche a 0.9x), il
  // tetto vince comunque e il piatto si stringe fino li' - mai sparire, ma
  // nemmeno sfondare il tetto. Le kcal che non ci stanno piu' su di lui
  // vengono redistribuite sugli altri piatti dal normale ciclo di
  // adattaGiornata (lo spazio di manovra si ricalcola sugli altri quando
  // uno satura, non serve un meccanismo a parte).
  if (maxEffettivo < ratio[0]) return [maxEffettivo, maxEffettivo];
  return [ratio[0], maxEffettivo];
}

// Distribuisce il residuo calorico proporzionalmente allo spazio di manovra
// di ciascun elemento, invece di moltiplicare tutto per lo stesso fattore.
function adattaGiornata(pasti, obiettivo) {
  const stato = pasti.map(p => ({ p, f: 1, lim: limitiDi(p, obiettivo) }));
  const totale = () => stato.reduce((s, x) => s + (x.p.piatto.kcal || 0) * x.f, 0);

  for (let i = 0; i < 15; i++) {
    const diff = obiettivo - totale();
    if (Math.abs(diff) < 40) break;

    if (diff > 0) {
      const spazio = stato.reduce((s, x) =>
        s + (x.p.piatto.kcal || 0) * Math.max(0, x.lim[1] - x.f), 0);
      if (spazio < 1) break;
      const quota = Math.min(1, diff / spazio);
      stato.forEach(x => { x.f += (x.lim[1] - x.f) * quota; });
    } else {
      const spazio = stato.reduce((s, x) =>
        s + (x.p.piatto.kcal || 0) * Math.max(0, x.f - x.lim[0]), 0);
      if (spazio < 1) break;
      const quota = Math.min(1, -diff / spazio);
      stato.forEach(x => { x.f -= (x.f - x.lim[0]) * quota; });
    }
  }
  return stato;
}

// Limiti proporzionali al fabbisogno (2026-09-17, sostituisce la costante
// fissa satMaxGiorno=29/saleMaxGiorno=5/fibraMinGiorno=25 - quei 29g erano il
// 10% dell'energia di una giornata da ~2600 kcal, una raccomandazione OMS
// resa in grammi per UNA persona media, sbagliata per chiunque altro: a 1800
// kcal lasciava passare 29g dove il limite vero e' 20, a 2900 tappava a 29
// dove il limite vero e' 32). Il sale resta assoluto (OMS: sotto 5g/giorno a
// prescindere da quanto si mangia). La fibra resta un pavimento EFSA (25g
// minimo adulto, ~14g/1000kcal come adeguatezza) - vedi valutaGiornataScalata
// per come sale/saturi diventano un vincolo vero e la fibra no.
function limitiProporzionali(kcal) {
  return {
    satMaxGiorno: kcal * 0.10 / 9,
    saleMaxGiorno: 5,
    fibraMinGiorno: Math.max(25, kcal * 0.014),
  };
}

// Valuta una giornata sui valori SCALATI (adattaGiornata la porta al kcal
// obiettivo, come fa davvero il salvataggio in plan_items) invece che sulla
// ricetta base - il buco misurato il 2026-09-17: una giornata validata sui
// valori base poteva arrivare all'utente fino al doppio su sale/saturi dopo
// lo scalamento di colazione/base amidacea (fino a 2x/2.2x). tettoOk e'
// sale<=5 e saturi<=limite proporzionale: un vincolo vero, verificato dal
// chiamante DURANTE la costruzione della giornata (vedi avanzaFinDove), non
// solo a posteriori. fibraOk resta un pavimento: mai un vincolo, solo
// riportato come concessione (vedi il ciclo di ricostruzione della settimana).
// kcalOk (aggiunto insieme ai piatti bloccati, 2026-10-05): adattaGiornata
// scala le PORZIONI entro i limiti di LIMITI_SCALA, ma se la combinazione
// scelta per la giornata e' intrinsecamente leggera (o pesante) anche al
// massimo (o minimo) di quei limiti non ha modo di colmare il resto - senza
// questo controllo quella giornata veniva accettata comunque, scoperto
// misurando le giornate con un piatto bloccato (un piatto fisso toglie un
// grado di liberta' alla ricerca, rendendo il caso piu' frequente, ma puo'
// capitare a qualunque giornata).
// proteinOk (2026-10-09, problema B dell'audit): prima nessun controllo
// guardava le proteine durante la generazione - solo saturi/sale/fibra/kcal.
// Misurato: 6 profili su 7 restavano sistematicamente sotto l'85% del
// target proteico, uno su tutti i 70 giorni generati (vedi
// audit/analisi-generatore.md, problema 1). Soglia al 90% del minimo (non al
// 100%): un pavimento con un po' di margine, come fibraMin, non un vincolo
// durissimo come il tetto sale/saturi - la ricerca puo' ancora accettare un
// giorno leggermente sotto se il resto va bene, ma segnala quanto manca.
function valutaGiornataScalata(pastiGiorno, obiettivo, obiettivoProteine) {
  if (!obiettivo || !pastiGiorno.length) return null;
  const adattati = adattaGiornata(pastiGiorno, obiettivo);
  let saturi = 0, sale = 0, fibra = 0, kcal = 0, proteine = 0;
  for (const { p, f } of adattati) {
    saturi += (p.piatto.satFat || 0) * f;
    sale += (p.piatto.salt || 0) * f;
    fibra += (p.piatto.fibre || 0) * f;
    kcal += (p.piatto.kcal || 0) * f;
    proteine += (p.piatto.protein || 0) * f;
  }
  const lim = limitiProporzionali(kcal || obiettivo);
  const proteinMin = obiettivoProteine ? obiettivoProteine * 0.90 : null;
  return {
    saturi, sale, fibra, kcal, proteine,
    satMax: lim.satMaxGiorno, saleMax: lim.saleMaxGiorno, fibraMin: lim.fibraMinGiorno, proteinMin,
    tettoOk: saturi <= lim.satMaxGiorno && sale <= lim.saleMaxGiorno,
    fibraOk: fibra >= lim.fibraMinGiorno,
    kcalOk: Math.abs(kcal - obiettivo) <= obiettivo * 0.10,
    proteinOk: proteinMin == null || proteine >= proteinMin,
  };
}

// Sostituisce le frequenze CREA 2018 (2026-10-09): misurando le settimane
// generate, la carne come secondo compariva quasi mai (vedi audit/
// analisi-generatore.md, problema C). Due cause distinte, corrette insieme:
// 1) pianoProteico riceveva i gruppi disponibili SOLO del profiloSettimana
//    scelto per la settimana (vedi il fix piu' sotto, "gruppiUnioneSettimana"
//    in provaGradino/analizzaCapienza) - se quel profilo era uno a catalogo
//    povero (es. 'europeo-leggero', 9 secondi di cui 0 carne/uova), il piano
//    non poteva MAI chiedere carne o uova per l'intera settimana, qualunque
//    fosse la quota;
// 2) le frequenze CREA (pensate per la popolazione generale, non per le 7
//    caselle fisse di un piano Quadrio) assegnavano alla carne bianca un
//    peso residuo troppo basso (freq-min = 0.167) rispetto a uova/legumi
//    (1.75/0.75): a parita' di gruppi disponibili, lo slot "libero" andava
//    quasi sempre a uova o legumi.
// Numeri allineati a una richiesta esplicita dell'utente (2026-10-09): carne
// bianca 2-3, pesce 2-3, uova 1-2, legumi 1-3 (min abbassato a 1 apposta,
// cosi' resta uno slot libero per la varieta' settimana su settimana),
// carne rossa al massimo 1. Somma dei minimi: 0+2+2+1+1=6, un solo slot
// libero su 7 - redistribuito per peso fra tutti i gruppi (legumi il piu'
// probabile, ma qualunque gruppo puo' guadagnare il settimo giorno).
const QUOTE = {
  carne_rossa:  { min: 0, max: 1, freq: 0.5, fonte: 'Richiesta esplicita 2026-10-09: al massimo 1 volta a settimana' },
  carne_bianca: { min: 2, max: 3, freq: 2.5, fonte: 'Richiesta esplicita 2026-10-09: 2-3 volte a settimana' },
  pesce:        { min: 2, max: 3, freq: 2.5, fonte: 'Richiesta esplicita 2026-10-09: 2-3 volte a settimana' },
  legumi:       { min: 1, max: 3, freq: 2.5, fonte: 'Richiesta esplicita 2026-10-09: 2-3 volte a settimana (min 1 per lasciare un giorno libero)' },
  uova:         { min: 1, max: 2, freq: 1.5, fonte: 'Richiesta esplicita 2026-10-09: 1-2 volte a settimana' },
  // formaggio: nessun secondo del catalogo ha un latticino come ancora
  // proteica (misurato 19/09/2026, confermato 2026-10-09: ancora 0 su 161
  // secondi mercato IT). L'utente ha chiesto "formaggi al massimo 1": un
  // tetto resta inutile finche' non esistono secondi a base di formaggio da
  // limitare - un tetto su un insieme vuoto non difende niente.
};

// Categorie escluse da ciascuna dieta (prima dell'espansione CONTENUTE_IN).
// Condivisa fra generaESalva (applica il filtro sui piatti caricati) e i
// controlli di capienza fuori linea (F0), che devono vedere esattamente le
// stesse esclusioni, non una loro copia.
const CATEGORIE_DIETA = {
  vegano:       ['carne_rossa', 'carne_bianca', 'pesce', 'crostacei', 'molluschi', 'uova', 'latticini'],
  vegetariano:  ['carne_rossa', 'carne_bianca', 'pesce', 'crostacei', 'molluschi'],
  pescetariano: ['carne_rossa', 'carne_bianca'],
};

const FAMIGLIE_PER_CUCINA = {
  europea: ['mediterranea'],
  australiana: ['mediterranea'],
  asiatica: ['asiatica'],
  sud_americana: ['latina'],
  usa: ['americana'],
};

// RIPIEGO (Fase 2, 2026-09-16): queste sei regex erano il metodo PRIMARIO
// per indovinare il gruppo proteico di un piatto dai nomi degli ingredienti.
// Fragile per costruzione (foods.name mescola inglese USDA e slug italiani,
// e l'ordine fisso della lista decide chi vince quando un piatto ha piu' di
// un ingrediente riconosciuto, non chi pesa di piu' - vedi f3-gruppo-
// proteico.js, gli 8 casi "in disaccordo" accettati il 2026-09-16). Il
// metodo primario ora e' gruppoDa() sotto, che legge categorie_alimenti
// sull'ancora proteica (metrica F1). Le regex restano SOLO come ripiego per
// quando l'ancora non ha nessuna categoria - cosi' nessun piatto che oggi ha
// un gruppo lo perde.
const GRUPPI = [
  ['pesce',        /fish|salmon|salmone|cod,|merluzzo|tuna|tonno|trout|trota|sgombro|sardin|acciugh|aringa|branzino|orata|barramundi|halibut|nasello|rombo|sogliola|anguilla|baccal|mahi|astice|granchio|crab|shrimp|gamber|vongol|cozze|seppia|polpo/i],
  ['carne_rossa',  /beef|manzo|brisket|agnello|lamb|canguro|kangaroo|vitell|veal|maiale|pork|lonza|speck|bresaola/i],
  ['carne_bianca', /chicken|pollo|turkey|tacchino|coniglio|rabbit/i],
  ['uova',         /\begg|uovo/i],
  ['formaggio',    /cheese|formagg|mozzarella|ricotta|pecorino|gorgonzola|taleggio|provola|emmental|caprino|stracchino|cheddar|feta|parmig/i],
  ['legumi',       /fagiol|beans,|lentil|lenticch|ceci|chickpea|lupini|tofu|tempeh|edamame/i],
];

const rankInPeso = (rank) => Math.round(25 / Math.pow(2, rank - 1));

function gruppoDaRegex(ingredienti) {
  const testo = ingredienti.filter(i => i.grams >= 40).map(i => i.nome).join(' | ');
  for (const [gruppo, rx] of GRUPPI) {
    if (rx.test(testo)) return gruppo;
  }
  return null;
}

// L'ancora proteica di un piatto: la stessa metrica di F1 (regola 9 del
// CLAUDE.md) - grammi di proteina reale, non grammi di alimento. Soglia
// >=10g oppure >=25% della proteina totale del piatto, quale delle due e'
// piu' facile. Il peso dell'alimento e' la misura sbagliata per la
// proteina: un contorno di verdure puo' pesare piu' del pollo.
function ancoraProteica(ingredienti) {
  const conProteina = ingredienti
    .map(i => ({ ...i, proteina: (i.protein_100g || 0) * i.grams / 100 }))
    .filter(i => i.proteina > 0)
    .sort((a, b) => b.proteina - a.proteina);
  if (!conProteina.length) return null;
  const totale = conProteina.reduce((s, i) => s + i.proteina, 0);
  const primo = conProteina[0];
  if (primo.proteina >= 10 || (totale > 0 && primo.proteina / totale >= 0.25)) return primo;
  return null;
}

// Da categoria (categorie_alimenti) a gruppo proteico, sull'ingrediente che
// l'ancora proteica ha gia' scelto - NON viola la regola 9 del CLAUDE.md
// ("la categoria non deve mai determinare il ruolo"): qui il ruolo/ancora
// resta deciso dai grammi di proteina, la categoria dice solo *che cosa e'*
// l'ingrediente che ha gia' vinto. E' anche cio' che protegge dai casi che
// la regola 9 cita: il curry rosso e' taggato 'pesce' (contiene salsa di
// pesce) ma con pochi grammi e quasi nessuna proteina non sara' mai
// l'ancora. L'ordine e' la precedenza quando l'ancora porta piu' categorie:
// si nomina il piatto per la proteina piu' "impegnativa" (il pesce prima
// del latticino, la carne prima del legume) - lo stesso ordine in cui QUOTE
// ragiona.
const GRUPPO_DA_CATEGORIA = [
  ['pesce',        ['pesce', 'crostacei', 'molluschi']],
  ['carne_rossa',  ['carne_rossa', 'maiale']],
  ['carne_bianca', ['carne_bianca']],
  ['uova',         ['uova']],
  ['legumi',       ['legumi', 'soia']],
  ['formaggio',    ['latticini']],
];

// Metodo primario (Fase 2, 2026-09-16): ancora proteica -> categoria
// dell'ancora -> gruppo. Ripiega sulle regex (gruppoDaRegex) solo quando
// l'ancora non esiste o non ha nessuna categoria che mappi a un gruppo -
// misurato su tutto il catalogo prima di attivare (f3-gruppo-proteico.js):
// 771 d'accordo, 45 recuperati dalla categoria (prima invisibili al
// generatore), 0 persi, 8 disaccordi accettati (la categoria aveva ragione
// in tutti e otto - l'ordine fisso delle regex vinceva per posizione in
// lista, non per peso).
function gruppoDa(ingredienti, categorieDi) {
  const ancora = ancoraProteica(ingredienti);
  if (ancora && categorieDi) {
    const cat = categorieDi[ancora.food_id];
    if (cat) {
      for (const [gruppo, categorie] of GRUPPO_DA_CATEGORIA) {
        if (categorie.some(x => cat.has(x))) return gruppo;
      }
    }
  }
  return gruppoDaRegex(ingredienti);
}

function ingredientePrincipale(ingredienti) {
  const utili = ingredienti.filter(i =>
    i.grams >= 40 &&
    !/oil|olio|garlic|aglio|zenzer|ginger|salsa|sauce|zucchero|sugar|miso|curry|chimichurri|gochujang|hoisin|teriyaki|limon|lime|coriandol|dressing/i.test(i.nome || '')
  );
  if (!utili.length) return null;
  return utili.sort((a, b) => b.grams - a.grams)[0].nome.toLowerCase().slice(0, 22);
}

// AAAA-MM-GG dai getter LOCALI (getFullYear/getMonth/getDate), mai da
// toISOString(): quella converte in UTC, mentre getDay() qui sopra legge
// gia' in locale - mescolare i due dentro la stessa funzione sposta il
// lunedi' di una settimana intera per chi genera un piano tra mezzanotte e
// l'alba, ora locale (es. le 00:30 di lunedi' sono ancora domenica sera in
// UTC: getDay() vede lunedi', toISOString() formatta domenica). Bug trovato
// il 2026-10-05: il piano mostrato in Week era quello della settimana
// scorsa, non perche' l'app lo sceglieva male ma perche' aveva gia' un
// week_start sbagliato scritto nel database.
function lunediCorrente() {
  const oggi = new Date();
  const giorno = oggi.getDay();
  const scarto = giorno === 0 ? -6 : 1 - giorno;
  const lun = new Date(oggi);
  lun.setDate(oggi.getDate() + scarto);
  const anno = lun.getFullYear();
  const mese = String(lun.getMonth() + 1).padStart(2, '0');
  const giornoMese = String(lun.getDate()).padStart(2, '0');
  return `${anno}-${mese}-${giornoMese}`;
}

// Stessa regola di lunediCorrente() sopra (stesso new Date(), stesso
// getDay()), ma restituisce il numero del giorno invece della data del
// lunedi': 1 = lunedi' ... 7 = domenica. Usa l'ora del SERVER (UTC su
// Render), non il fuso dell'utente - e' una scelta consapevole, non un bug:
// l'app non deve mai ricalcolare "oggi" per conto suo, deve sempre aprire
// sul giorno che le dice il server con plans.giorno_gratis, qualunque esso
// sia. Un utente al fuso opposto vedra' il cambio di giorno gratis a
// un'ora diversa da mezzanotte locale: accettato, non un difetto da
// correggere qui.
function giornoSettimanaCorrente() {
  const giorno = new Date().getDay();
  return giorno === 0 ? 7 : giorno;
}

// Un generatore pseudocasuale CON SEME, non Math.random diretto: la stessa
// generazione (stesso profilo, stesso seed) deve produrre sempre lo stesso
// piano, cosi' un fallimento intermittente si puo' rigiocare invece di
// restare un mistero. E' passato esplicitamente a ogni funzione che pesca a
// caso (mai una variabile di modulo condivisa): il server serve piu' utenti
// sullo stesso processo Node, e uno stato condiviso mutabile fra chiamate
// asincrone concorrenti mescolerebbe il seed di un utente con quello di un
// altro.
function creaRng(seed) {
  let s = seed >>> 0;
  return function rng() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pescaPesato(voci, peso, rng) {
  const totale = voci.reduce((s, v) => s + peso(v), 0);
  if (totale <= 0) return null;
  let r = rng() * totale;
  for (const v of voci) {
    r -= peso(v);
    if (r <= 0) return v;
  }
  return voci[voci.length - 1];
}

function pescaCasuale(lista, filtro, rng) {
  const buoni = filtro ? lista.filter(filtro) : lista;
  if (!buoni.length) return null;
  return buoni[Math.floor(rng() * buoni.length)];
}

function mescola(a, rng) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// CORREZIONE 2026-10-23 (richiesta dell'utente): nessuno mangia 7
// colazioni diverse a settimana - prima il generatore ne pretendeva 7
// distinte (vedi analizzaCapienza) perche' le colazioni condividevano con
// tutti gli altri pasti il divieto di ripetersi nella settimana. Ora la
// settimana sceglie fino a 3 colazioni diverse per INGREDIENTE PRINCIPALE
// (mai tre yogurt) una volta sola, e ruotano sui 7 giorni (vedi
// candidatiColazione, che le usa in quest'ordine di preferenza); se per il
// profilo ce ne sono meno di 3 compatibili, la settimana usa solo quelle -
// mai un errore, solo una rotazione piu' corta. Non e' piu' legata a
// 'usati': lo stesso piatto puo' tornare quanti giorni serve.
function pianoColazioni(colazioniAmmesse, rng) {
  const mescolate = mescola(colazioniAmmesse, rng);
  const viste = new Set();
  const uniche = [];
  for (const c of mescolate) {
    const chiave = c.principale || c.id;
    if (viste.has(chiave)) continue;
    viste.add(chiave);
    uniche.push(c);
    if (uniche.length === 3) break;
  }
  return uniche;
}

// Costruisce in anticipo l'ordine dei gruppi proteici della settimana,
// cosi' le quote sono garantite invece di sperate.
function pianoProteico(gruppiDisponibili, rng) {
  const piano = [];
  for (const [gruppo, q] of Object.entries(QUOTE)) {
    if (!gruppiDisponibili.has(gruppo)) continue;
    for (let i = 0; i < q.min; i++) piano.push(gruppo);
  }

  const liberi = 7 - piano.length;
  if (liberi > 0) {
    const residui = mescola(
      Object.entries(QUOTE)
        .filter(([g]) => gruppiDisponibili.has(g))
        .map(([g, q]) => [g, Math.max(0, (q.freq != null ? q.freq : q.max) - q.min)])
        .filter(([, w]) => w > 0),
      rng
    );
    const somma = residui.reduce((a, [, w]) => a + w, 0);
    if (somma > 0) {
      // Campionamento sistematico: i pesi riscalati sommano a `liberi`, quindi
      // ogni gruppo esce floor o ceil del proprio peso e la media e' esatta.
      const scala = liberi / somma;
      const cursore = rng();
      let acc = 0;
      for (const [g, w] of residui) {
        const prima = acc;
        acc += w * scala;
        const n = Math.ceil(acc - cursore) - Math.ceil(prima - cursore);
        for (let i = 0; i < n && piano.length < 7; i++) piano.push(g);
      }
    }
  }

  while (piano.length < 7) piano.push(null);
  return mescola(piano, rng).slice(0, 7);
}

// CORREZIONE (25 ottobre 2026, principio inviolabile): il tempo dichiarato
// e' una scelta dell'utente, non una preferenza che un gradino puo' allargare
// - la vecchia versione di questa funzione (e di chi la chiamava) allargava
// il limite in automatico quando il catalogo era insufficiente, e quel
// limite allargato finiva nella ricerca vera (limiteFeriale). Da oggi questa
// funzione serve SOLO a diagnosticare "quanti piatti ci sarebbero con X
// minuti in piu'" per il messaggio di errore (vedi diagnosticaTempoBlocca
// piu' sotto) - nessun chiamante la usa piu' per decidere il limite reale.
function limiteEfficace(secondi, profili, minutiDichiarati, minimoRichiesto) {
  for (const extra of [0, 10, 20, 35, 50]) {
    const limite = minutiDichiarati + extra;
    const reggono = profili.filter(pr =>
      secondi.filter(p =>
        p.profilo === pr &&
        (p.prep_min || 30) <= limite &&
        (p.tecnica || 'semplice') === 'semplice'
      ).length >= minimoRichiesto
    );
    if (reggono.length) return { limite, allargato: extra > 0 };
  }
  return { limite: minutiDichiarati + 60, allargato: true };
}

// Da un catalogo gia' filtrato per dieta, i profili con secondi utilizzabili
// e i gruppi proteici che ciascuno copre entro il limite serale DICHIARATO
// (mai allargato, vedi la correzione sopra limiteEfficace). Estratta da
// generaESalva perche' il controllo di capienza fuori linea (F0) deve
// vedere lo stesso catalogo che vedrebbe una generazione vera, non una sua
// approssimazione con soglie ricalcolate a mano.
function gruppiPerProfiloDa(piatti, minutiSera = 45) {
  const profiliConSecondo = [...new Set(
    piatti.filter(p => p.meal_slot === 'secondo' && p.profilo !== 'neutro').map(p => p.profilo)
  )];

  const gruppiPerProfilo = {};
  for (const p of piatti.filter(x =>
    x.meal_slot === 'secondo' && x.profilo !== 'neutro' &&
    (x.prep_min || 30) <= minutiSera &&
    (x.tecnica || 'semplice') === 'semplice'
  )) {
    if (p.gruppo) {
      if (!gruppiPerProfilo[p.profilo]) gruppiPerProfilo[p.profilo] = new Set();
      gruppiPerProfilo[p.profilo].add(p.gruppo);
    }
  }

  return { profiliConSecondo, gruppiPerProfilo };
}

// Normalizza una stringa per il confronto fra alias: minuscole, accenti
// rimossi, spazi e underscore trattati come equivalenti. "Frutta a guscio",
// "frutta_guscio", "FRUTTA A GUSCIO" devono ridursi tutte alla stessa chiave.
function normalizza(s) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, ' ')
    .trim();
}

// Risolve il subject dichiarato da un utente (codice categoria, nome_it,
// nome_en o sinonimo, in qualunque forma) al codice categoria corrispondente,
// usando la tabella alias_categoria come unica fonte - li' un vincolo di
// unicita' sul database impedisce che lo stesso alias appartenga a due
// categorie diverse (e' esattamente il punto dove e' nato il bug
// latticini/lattosio). Estratta come funzione a se' ed esportata perche' un
// test deve poter chiamare QUESTA funzione, non una sua reimplementazione.
function trovaCategoria(subject, mappaAlias) {
  const chiave = normalizza(subject);
  if (!chiave) return null;
  const codice = mappaAlias.get(chiave);
  return codice ? { codice } : null;
}

// "Lenticchie cotte" -> "lenticchie": lo stesso alimento crudo, cotto o
// secco resta lo stesso alimento agli occhi di chi lo vuole evitare.
function radiceAlimento(s) {
  const n = normalizza(s);
  return n.replace(/[aeio]$/, '').replace(/[aeio]$/, '');
}
function baseAlimento(s) {
  return normalizza(s)
    .replace(/\b(cotti|cotte|cotto|cotta|crudi|crude|crudo|cruda|secchi|secche|secco|secca|in scatola|surgelati|surgelate)\b/g, '')
    .replace(/[,\s]+/g, ' ')
    .trim();
}

// I 6 allergeni che l'onboarding offre come scelta dedicata (ESCLUSIONI in
// screens/Onboarding.js), piu' molluschi (sempre aggiunto insieme a
// crostacei, vedi la stessa Onboarding.js): per questi il subject dichiarato
// e' SEMPRE il nome della categoria, mai il nome di un prodotto - un
// alimento specifico non e' un'opzione che l'utente possa scegliere qui.
// Devono risolvere DIRETTAMENTE sulla categoria in categorie_alimenti,
// bypassando la ricerca per nome qui sotto.
//
// Bug trovato il 2026-10-21, indagine sulla capienza del generatore: la
// ricerca per nome (sotto) viene PRIMA della categoria, quindi se il testo
// dell'allergene combinava per sottostringa col nome di un prodotto, quel
// prodotto vinceva e la categoria vera non veniva mai interrogata.
// 'glutine' trovava "Pane senza glutine" e "Fiocchi di mais senza glutine"
// (introdotti il 2026-10-09, due prodotti GIA' senza glutine - l'opposto di
// quello da escludere): un celiaco restava con 0 piatti davvero esclusi
// invece dei ~59 che contengono glutine. 'uova' trovava solo "Uova di
// quaglia" invece della categoria con tutte le uova (9 alimenti): chi e'
// allergico alle uova continuava a vedere piatti con uova di gallina. 'soia'
// trovava 10 dei 17 alimenti con soia per nome (mancavano gli altri 7,
// quelli il cui nome non contiene "soia" alla lettera).
const CATEGORIA_ALLERGENE = {
  glutine: 'glutine',
  lattosio: 'lattosio',
  'frutta guscio': 'frutta_guscio',
  crostacei: 'crostacei',
  molluschi: 'molluschi',
  uova: 'uova',
  soia: 'soia',
};

// Risolve un subject dichiarato da un utente (allergia, non_gradito, ...) a
// un riferimento concreto - uno o piu' food_id, oppure una categoria intera -
// con la STESSA logica di migra-vincoli.js: prima il nome esatto o
// singolare/plurale/sottostringa nel catalogo alimenti (allargato alle
// varianti crudo/cotto/secco dello stesso alimento), poi la categoria via
// alias_categoria. Estratta qui perche' va chiamata SUBITO quando un
// vincolo si scrive (server.js), non solo dal migra-vincoli.js lanciato a
// mano - cosi' un vincolo nuovo esclude gia' qualcosa dal primo piano
// generato, senza aspettare un passaggio manuale.
function risolviSubject(subject, { mappaAlias, foods, foodIdPerCategoria }) {
  const s = (subject || '').trim();
  if (!s) return { tipo: 'irrisolto' };

  // Allergene noto: niente ricerca per nome, mai. "In caso di dubbio si
  // esclude" (richiesta 2026-10-21) vale anche al contrario - se la
  // categoria risultasse vuota (nessun alimento taggato, es. un alias
  // cancellato per errore), fermarsi con un errore e' piu' sicuro che
  // restituire un'esclusione vuota e lasciare che il generatore proceda
  // credendo di aver escluso qualcosa.
  const codiceAllergene = CATEGORIA_ALLERGENE[normalizza(s)];
  if (codiceAllergene) {
    const presenti = (foodIdPerCategoria && foodIdPerCategoria.get(codiceAllergene)) || [];
    if (!presenti.length) {
      throw new Error(
        `Allergene "${s}" non risolvibile con certezza: nessun alimento e' taggato con la ` +
        `categoria "${codiceAllergene}" in categorie_alimenti. Il vincolo non viene applicato ` +
        `a vuoto - va corretto il catalogo prima di proseguire.`
      );
    }
    return { tipo: 'categoria', codice: codiceAllergene };
  }

  const nomeDi = (f) => f.name_it || f.name;

  let trovati = (foods || []).filter(
    (f) => normalizza(f.name_it) === normalizza(s) || normalizza(f.name) === normalizza(s)
  );

  if (!trovati.length) {
    const r = radiceAlimento(s);
    if (r.length >= 4) {
      trovati = (foods || []).filter(
        (f) => radiceAlimento(f.name_it).startsWith(r) || radiceAlimento(f.name).startsWith(r)
      );
    }
  }

  if (!trovati.length) {
    trovati = (foods || []).filter(
      (f) => normalizza(f.name_it).includes(normalizza(s)) || normalizza(f.name).includes(normalizza(s))
    );
  }

  if (trovati.length) {
    const basi = new Set(trovati.map((f) => baseAlimento(nomeDi(f))));
    const allargato = (foods || []).filter((f) => basi.has(baseAlimento(nomeDi(f))));
    return { tipo: 'alimenti', foodIds: allargato.map((f) => f.id) };
  }

  const cat = trovaCategoria(s, mappaAlias);
  if (cat) return { tipo: 'categoria', codice: cat.codice };

  return { tipo: 'irrisolto' };
}

// Le due tabelle di cui risolviSubject ha bisogno, in un solo giro - le
// chiama chi scrive vincoli nuovi (server.js), non chi li legge soltanto
// (caricaVincoli sopra continua a leggere food_id/categoria gia' scritti).
async function caricaCatalogoPerRisoluzione(supabase) {
  const [aliasRighe, foods, catRighe] = await Promise.all([
    paginaTutto((da, a) => supabase.from('alias_categoria').select('alias, codice').order('alias').range(da, a)),
    paginaTutto((da, a) => supabase.from('foods').select('id, name, name_it').order('id').range(da, a)),
    // Serve a risolviSubject per verificare che un allergene noto (vedi
    // CATEGORIA_ALLERGENE) abbia davvero alimenti taggati prima di fidarsi
    // della categoria - senza questa tabella non potrebbe distinguere una
    // categoria valida da una svuotata per errore.
    paginaTutto((da, a) => supabase.from('categorie_alimenti').select('food_id, categoria').order('food_id').order('categoria').range(da, a)),
  ]);
  const mappaAlias = new Map((aliasRighe || []).map((r) => [r.alias, r.codice]));
  const foodIdPerCategoria = new Map();
  for (const r of (catRighe || [])) {
    if (!foodIdPerCategoria.has(r.categoria)) foodIdPerCategoria.set(r.categoria, []);
    foodIdPerCategoria.get(r.categoria).push(r.food_id);
  }
  return { mappaAlias, foods: foods || [], foodIdPerCategoria };
}

// Alcune categorie ne contengono altre: il maiale e' comunque carne rossa,
// il lattosio e' comunque presente nei latticini. Chi esclude la categoria
// piu' ampia deve escludere anche quella contenuta, anche se un domani un
// alimento venisse taggato con una sola delle due per una svista - non ci si
// puo' affidare al doppio tag manuale per sempre.
// CONTENUTE_IN e GRUPPO_DA_CATEGORIA sono DIVERSE di proposito, non per
// svista. GRUPPO_DA_CATEGORIA risponde a una domanda nutrizionale: un
// gambero conta come pesce nel profilo proteico della settimana.
// CONTENUTE_IN risponde a cosa esclude un vincolo dichiarato: pesce,
// crostacei, molluschi e soia sono allergeni distinti nel Reg. UE
// 1169/2011, e l'onboarding li offre come voci separate. Non allinearle.
// (Verificato il 21/09/2026 con prova-4b.js: con le categorie dichiarate
// tutte, il gradino 4b scatta e dichiara le concessioni.)
const CONTENUTE_IN = {
  carne_rossa: ['maiale'],
  latticini: ['lattosio'],
};

// Tofu e tempeh sono alternative proteiche pensate per chi non mangia carne
// ne' pesce: su un onnivoro o un pescetariano (che la quota di carne/pesce
// ce l'hanno gia') risultano fuori posto, anche se nessuna allergia o
// categoria li escluderebbe. Esclusione per singolo food_id, non per
// categoria 'soia' intera: la salsa di soia come condimento resta ammessa a
// chiunque, solo tofu/tempeh come ingrediente principale non lo sono per
// queste due diete. Richiesta esplicita 2026-10-09.
const ALIMENTI_VIETATI_PER_DIETA = {
  onnivoro: ['tofu_it', 'tempeh_it', '172475'],
  pescetariano: ['tofu_it', 'tempeh_it', '172475'],
};

// Food_id esclusi dalla sola dieta (CATEGORIE_DIETA espanso con CONTENUTE_IN),
// senza i vincoli personali dell'utente (allergie, non graditi): serve sia a
// generaESalva sia ai controlli di capienza fuori linea (F0), che ragionano
// per dieta+paese senza un utente reale dietro. Estratta a se' perche' un
// controllo fuori linea deve interrogare la STESSA fonte di esclusione, non
// una sua reimplementazione.
// Cache di riferimento in memoria (Fase 5, 2026-10-24): dishes, dish_ingredients
// (con i foods agganciati), tag_nutrizionali e categorie_alimenti sono dati
// di CATALOGO - uguali per ogni utente, cambiano solo quando si pubblica un
// piatto nuovo - non dati personali da rileggere a ogni chiamata. Prima di
// questa cache, generaESalva li rileggeva per intero 2 volte a chiamata (una
// volta per il pool di ricerca via caricaPiatti, una seconda per i piatti
// bloccati via caricaPiattiPerId) piu' le espansioni di categorie_alimenti
// dentro caricaVincoli: misurato in produzione su Render, 20-37s a
// generazione contro 1.3s della stessa chiamata in locale con salva:false -
// la differenza era quasi tutta rete (10-15 andate e ritorni verso Supabase
// in sequenza, non il calcolo). Con la cache, il catalogo si legge una sola
// volta ogni DURATA_CACHE_MS (non per sempre: un piatto nuovo pubblicato deve
// comunque apparire entro quella finestra, senza richiedere un riavvio del
// server) e ogni chiamata successiva filtra in memoria, zero rete.
// cachePromessaInCorso evita lo stampede: se due richieste arrivano mentre la
// cache e' scaduta, la seconda aspetta la STESSA lettura della prima invece
// di farne una propria.
const DURATA_CACHE_MS = 10 * 60 * 1000; // 10 minuti
let cacheRiferimento = null;
let cachePromessaInCorso = null;

async function caricaRiferimento(supabase) {
  if (cacheRiferimento && Date.now() < cacheRiferimento.scadenza) return cacheRiferimento;
  if (cachePromessaInCorso) return cachePromessaInCorso;

  cachePromessaInCorso = (async () => {
    const [dishesCrudi, tagRighe, catRighe] = await Promise.all([
      // Il mercato (MERCATO_ATTIVO) resta un cancello assoluto applicato qui,
      // non un filtro da ripetere in memoria a ogni chiamata - nessun
      // chiamante deve mai vedere un piatto fuori mercato, nemmeno un piatto
      // bloccato (vedi la nota su caricaPiattiPerId piu' sotto).
      paginaTutto((da, a) => supabase
        .from('dishes')
        .select('id, name, name_en, meal_slot, cucina, profilo, famiglia, ha_amido, ha_proteina, prep_min, occasione, tecnica, health_score, salsa_industriale, base_amidacea, trasportabile, contiene_glutine, contiene_lattosio, contiene_frutta_secca, paese, ruolo_primario, ruoli_coperti, mercati, steps')
        .contains('mercati', [MERCATO_ATTIVO])
        .order('id')
        .range(da, a)),
      paginaTutto((da, a) => supabase.from('tag_nutrizionali').select('food_id, tag').order('food_id').order('tag').range(da, a)),
      paginaTutto((da, a) => supabase.from('categorie_alimenti').select('food_id, categoria').order('food_id').order('categoria').range(da, a)),
    ]);

    const tagDi = {};
    for (const r of tagRighe) (tagDi[r.food_id] ||= new Set()).add(r.tag);

    const categorieDi = {};
    const foodIdsPerCategoria = {};
    for (const r of catRighe) {
      (categorieDi[r.food_id] ||= new Set()).add(r.categoria);
      (foodIdsPerCategoria[r.categoria] ||= new Set()).add(r.food_id);
    }

    // Ingredienti di TUTTO il catalogo, a blocchi di 200 id (stesso tetto di
    // PostgREST di sempre), una sola volta invece che per ogni sottoinsieme
    // che un chiamante potrebbe chiedere.
    const ingredientiPerDish = {};
    const tuttiGliId = dishesCrudi.map((d) => d.id);
    for (let i = 0; i < tuttiGliId.length; i += 200) {
      const blocco = tuttiGliId.slice(i, i + 200);
      const righe = await paginaTutto((da, a) => supabase
        .from('dish_ingredients')
        .select('dish_id, food_id, grams, foods (name, kcal_100g, protein_100g, fat_100g, sat_fat_100g, fibre_100g, salt_100g, stato, categoria_impatto)')
        .in('dish_id', blocco)
        .order('dish_id').order('food_id')
        .range(da, a));
      for (const r of righe) (ingredientiPerDish[r.dish_id] ||= []).push(r);
    }

    return { scadenza: Date.now() + DURATA_CACHE_MS, dishesCrudi, ingredientiPerDish, tagDi, categorieDi, foodIdsPerCategoria };
  })();

  try {
    cacheRiferimento = await cachePromessaInCorso;
    return cacheRiferimento;
  } finally {
    cachePromessaInCorso = null;
  }
}

async function foodIdVietatiPerDieta(supabase, dieta) {
  const { foodIdsPerCategoria } = await caricaRiferimento(supabase);
  const codiciDietaEspansi = new Set();
  for (const codice of (CATEGORIE_DIETA[dieta] || [])) {
    codiciDietaEspansi.add(codice);
    for (const contenuta of (CONTENUTE_IN[codice] || [])) codiciDietaEspansi.add(contenuta);
  }

  const vietati = new Set();
  for (const codice of codiciDietaEspansi) {
    for (const fid of (foodIdsPerCategoria[codice] || [])) vietati.add(fid);
  }
  return vietati;
}

// Dalle righe grezze di 'dishes' (dalla cache) ai piatti pronti per il
// generatore: calcola kcal/protein/gruppo/principale/riassunto nutrizionale
// per ciascuno, leggendo gli ingredienti e le tabelle di enrichment dalla
// cache di riferimento invece che dal database. Condivisa da caricaPiatti
// (il pool filtrato per la ricerca) e caricaPiattiPerId (un piatto bloccato
// specifico, a prescindere da famiglia/soglia salute/occasione - l'utente
// l'ha gia' approvato bloccandolo). Sincrona apposta: tutto cio' che le
// serve e' gia' in memoria, nessuna chiamata di rete qui dentro.
function arricchisciPiattiDaCache(piattiGrezzi, cache) {
  if (!piattiGrezzi.length) return [];
  const { ingredientiPerDish, tagDi, categorieDi } = cache;

  const valori = {};
  for (const p of piattiGrezzi) {
    const righe = ingredientiPerDish[p.id];
    if (!righe) continue;
    const v = { kcal: 0, protein: 0, fat: 0, satFat: 0, fibre: 0, salt: 0, grams: 0, ingredienti: [] };
    for (const r of righe) {
      const f = r.foods || {};
      const k = r.grams / 100;
      v.kcal    += (f.kcal_100g    || 0) * k;
      v.protein += (f.protein_100g || 0) * k;
      v.fat     += (f.fat_100g     || 0) * k;
      v.satFat  += (f.sat_fat_100g || 0) * k;
      v.fibre   += (f.fibre_100g   || 0) * k;
      v.salt    += (f.salt_100g    || 0) * k;
      v.grams   += r.grams;
      v.ingredienti.push({ food_id: r.food_id, nome: f.name || '', grams: r.grams, stato: f.stato || null, protein_100g: f.protein_100g || 0, categoria_impatto: f.categoria_impatto || null });
    }
    valori[p.id] = v;
  }

  // F4: riassunto nutrizionale del piatto, dai tag sugli ingredienti.
  // vitaminaCStato = 'crudo' se ALMENO una fonte di vitamina C nel piatto e'
  // cruda (la vitamina C e' termolabile, un piatto con una fonte cruda e una
  // cotta conta come cruda - basta che l'ascorbico sia presente in quel
  // pasto), altrimenti 'cotto' se ce n'e' solo di cotte, altrimenti null.
  function riassuntoNutrizionale(ingredienti) {
    let vitaminaCStato = null;
    let ferroVegetale = false;
    let caroteni = false;
    for (const ing of ingredienti) {
      const tags = tagDi[ing.food_id];
      if (!tags) continue;
      if (tags.has('fonte_vitamina_c')) {
        if (ing.stato === 'crudo') vitaminaCStato = 'crudo';
        else if (!vitaminaCStato) vitaminaCStato = 'cotto';
      }
      if (tags.has('ferro_vegetale')) ferroVegetale = true;
      if (tags.has('caroteni')) caroteni = true;
    }
    return { vitaminaCStato, ferroVegetale, caroteni };
  }

  // Amido riconosciuto dagli ingredienti (categoria 'amido' in
  // categorie_alimenti: pasta, riso, couscous, orzo, farro, miglio, grano
  // saraceno, polenta, patate, pane), non dal flag ha_amido salvato sul
  // piatto ne' dal nome - quel flag puo' essere sbagliato o mancante (vedi
  // audit/analisi-generatore.md, problema E: contorni di couscous/orzo senza
  // il flag, mai riconosciuti come doppio amido). Sostituisce ha_amido in
  // ogni punto del codice che decide su base dell'amido (accompagnaBene,
  // l'accompagnamento pane/patate a cena).
  function amidoDaIngredienti(ingredienti) {
    return ingredienti.some(i => (categorieDi[i.food_id] || new Set()).has('amido'));
  }

  // Tipo di amido d'accompagnamento (vedi tipoAmidoDiAccompagnamento piu'
  // sotto, CORREZIONE 2026-10-22): dalle categorie vere 'pane'/'patate' su
  // categorie_alimenti, mai da un elenco di food_id scritto qui. 'pane'
  // controllato prima di 'patate' per lo stesso motivo del commento sopra
  // (un secondo "morbido" vuole il pane anche se capitasse di contenere
  // anche un po' di patate in ricetta).
  function tipoAmidoDaIngredienti(ingredienti) {
    if (ingredienti.some(i => (categorieDi[i.food_id] || new Set()).has('pane'))) return 'pane';
    if (ingredienti.some(i => (categorieDi[i.food_id] || new Set()).has('patate'))) return 'patate';
    return null;
  }

  // Grammi (ricetta base) di frutta a guscio/arachidi nel piatto - serve al
  // tetto grammi (problema D) per limitare l'INGREDIENTE, non il piatto
  // intero: "Mela e mandorle" non deve diventare un piatto da 40g solo
  // perche' contiene mandorle, va capato sulle mandorle (vedi limitiDi).
  // categoria_impatto='frutta_secca' (non categorie_alimenti 'frutta_guscio'/
  // 'arachidi': quelle sono allergeniche e giustamente inclusive, taggano
  // anche il latte di mandorla - 200g di bevanda non sono 200g di mandorle.
  // Qui serve l'alimento vero e proprio, non chi ne contiene traccia).
  function grammiFruttaSeccaDi(ingredienti) {
    return ingredienti
      .filter(i => i.categoria_impatto === 'frutta_secca')
      .reduce((s, i) => s + i.grams, 0);
  }

  return piattiGrezzi
    .filter(p => valori[p.id])
    .map(p => ({
      ...p,
      ...valori[p.id],
      gruppo: gruppoDa(valori[p.id].ingredienti, categorieDi),
      principale: ingredientePrincipale(valori[p.id].ingredienti),
      amidoReale: amidoDaIngredienti(valori[p.id].ingredienti),
      tipoAmido: tipoAmidoDaIngredienti(valori[p.id].ingredienti),
      grammiFruttaSecca: grammiFruttaSeccaDi(valori[p.id].ingredienti),
      ...riassuntoNutrizionale(valori[p.id].ingredienti),
    }));
}

async function caricaPiatti(supabase, famiglie, sogliaSalute = 7) {
  // Dalla cache di riferimento (vedi caricaRiferimento sopra), non piu' da
  // una query diretta: stesso identico filtro di prima (mercato, soglia
  // salute, profilo non nullo, occasione, famiglia-o-neutro), applicato in
  // memoria sulle righe gia' lette.
  //
  // Il filtro per famiglia (bug corretto il 2026-09-12: prima 'famiglie' non
  // veniva usato affatto, la query caricava sempre l'intero catalogo) NON
  // esclude mai un piatto 'neutro' in base alla sua famiglia: compatibile()
  // tratta il profilo 'neutro' come sempre ammesso a prescindere dalla
  // famiglia, e in dishes 33 piatti neutri hanno famiglia='mediterranea'
  // invece di 'neutra' - filtrarli via famiglia li farebbe sparire per un
  // utente che ha scelto un'altra famiglia, mentre oggi sono visibili a tutti.
  const cache = await caricaRiferimento(supabase);
  const famiglieSet = new Set(famiglie);
  const piatti = cache.dishesCrudi.filter((p) =>
    p.health_score >= sogliaSalute &&
    p.profilo != null &&
    ['quotidiano', 'lungo'].includes(p.occasione) &&
    (p.profilo === 'neutro' || famiglieSet.has(p.famiglia))
  );

  if (!piatti.length) throw new Error('Nessun piatto etichettato per le cucine scelte');
  return arricchisciPiattiDaCache(piatti, cache);
}

// Un piatto bloccato specifico, indipendentemente da famiglia/soglia
// salute/occasione (vedi la regola dei piatti bloccati in generaESalva: un
// piatto bloccato resta qualunque sia la combinazione - solo l'incompatibilita'
// con dieta/allergie puo' farlo scartare, mai questi filtri di catalogo).
// ECCEZIONE dal 2026-10-08: il mercato (MERCATO_ATTIVO) non e' un filtro di
// catalogo come gli altri, e' un cancello assoluto - un piatto bloccato
// prima del lancio-solo-Italia che oggi risulta fuori mercato deve
// sbloccarsi da solo, non restare in piano. Chi chiama questa funzione
// (bloccatiPerGiorno in generaESalva) tratta gia' un id non risolto come
// "scartato", quindi non serve altro codice: basta non farlo tornare qui -
// la cache di riferimento e' gia' filtrata per mercato (vedi caricaRiferimento),
// quindi basta cercare per id dentro le righe che contiene.
async function caricaPiattiPerId(supabase, ids) {
  if (!ids.length) return [];
  const cache = await caricaRiferimento(supabase);
  const idsSet = new Set(ids);
  const piatti = cache.dishesCrudi.filter((p) => idsSet.has(p.id));
  return arricchisciPiattiDaCache(piatti, cache);
}

const compatibile = (piatto, profilo) => piatto.profilo === profilo || piatto.profilo === 'neutro';

// Legge ruoli_coperti cosi' come lo ha scritto F1 (classifica-ruoli-piatti.js)
// - non ricalcola una soglia qui: la metrica di copertura (grammi di
// proteina per proteina_principale/latticino, grammi di alimento per gli
// altri ruoli) vive in un posto solo, quel file.
const copreRuolo = (piatto, ruolo) => Array.isArray(piatto.ruoli_coperti) && piatto.ruoli_coperti.includes(ruolo);

// Pane o patate a cena (problema A, 2026-10-09): prima candidatiBase pescava
// QUALUNQUE contorno base_amidacea=true (anche pasta, riso, farro, orzo,
// couscous sconditi, usati come semplice "riempimento" di calorie) - non e'
// come si mangia in Italia, un secondo non si accompagna con un primo
// scondito. Ora la scelta e' solo fra pane e patate (mai piu' pasta/riso/
// cereali come riempimento), e quale dei due dipende da come e' cucinato il
// secondo: in umido/col sugo/legumi/uova vuole il pane (per la scarpetta),
// arrosto/al forno/alla griglia vuole le patate. Un secondo "in padella"
// senza sugo ne' forno (pesce o carne scottati con verdure, la maggioranza
// del catalogo) non e' ne' l'uno ne' l'altro: patate resta la scelta piu'
// vicina alla tradizione (un fritto/scottato si accompagna piu' spesso con
// patate che con pane).
//
// CORREZIONE 2026-10-22 (diagnosi crollo generatore, vedi RAPPORTO-NOTTE.md):
// prima qui c'era un elenco fisso di 6 food_id scritti a mano (5 pani +
// "Patate bianche"). Lo stesso bug di forma del fix allergeni di ieri: un
// elenco chiuso invece di una categoria vera. Risultato misurato: 120 piatti
// amidacei su 243 nel catalogo (quinoa, farro, pasta integrale, ceci...)
// restavano "orfani", mai riconosciuti ne' come pane ne' come patate, quindi
// mai utilizzabili come accompagnamento - la causa del crollo del 9 ottobre.
// Ora il tipo e' precalcolato in arricchisciPiattiDaCache (vedi piatto.tipoAmido)
// dalle categorie VERE 'pane'/'patate' su categorie_alimenti (migrazione
// migrazioni/2026-10-22-categorie-pane-patate.sql, non eseguita sul db
// vero), che un domani si aggiornano semplicemente taggando un nuovo
// alimento - senza toccare questo file. Lo scopo della regola originale
// (niente amido scondito come riempimento) resta identico: qui sotto si
// legge solo il valore gia' calcolato, non si allarga la definizione.
function tipoAmidoDiAccompagnamento(piatto) {
  return piatto.tipoAmido || null;
}

const RE_SECONDO_UMIDO = /\bin umido\b|\bcol sugo\b|\bal sugo\b|\bin guazzetto\b|\bal pomodoro\b|\bin salsa\b|\bbrasat|\bspezzatino\b|\bstufat|\bin tegame\b|\bal cartoccio\b|\bbollit|\blessat/i;
const RE_SECONDO_ARROSTO = /\bal forno\b|\barrosto\b|\balla griglia\b|\bgrigliat|\balla brace\b|\bcroccant/i;

// Il criterio (richiesto 2026-10-09): azioni di ricetta (steps) e nome del
// piatto, non una categoria dichiarata a parte che nessuno aggiornerebbe.
// legumi/soia/uova contano come "morbido" (pane) a prescindere dal testo,
// perche' un piatto di legumi o una frittata non si definisce dalla tecnica
// di cottura ma dalla sua natura (si mangia con il pane, non con le patate).
//
// CORREZIONE 2026-10-22 (sera, seconda del giorno): restituisce un ORDINE
// di preferenza, non piu' un tipo unico - misurato stanotte che per
// vegetariano/vegano il gruppo e' SEMPRE legumi o uova (mai "arrosto"), 0
// richieste di patate su migliaia di tentativi in tutta la ricerca. Chi ha
// il glutine come vincolo assoluto restava quindi legato ai soli pane senza
// glutine (4 piatti) per coprire da 4 a 7 cene su 7 a settimana - troppo
// pochi. "Legumi/uova con le patate" e' comunque un abbinamento reale di
// cucina di casa (lenticchie e patate, fagioli e patate, uova e patate - non
// inventato): qui le patate diventano un secondo livello, provato solo se
// non c'e' nessun pane (fresco o ripetibile) disponibile - per chi NON ha
// il glutine come vincolo il pane resta la prima scelta esattamente come
// prima, questo tocca solo i casi in cui il pane manca.
function tipiAccompagnamentoDaSecondo(secondo) {
  if (!secondo) return [];
  const testo = `${secondo.name || ''} ${(secondo.steps || []).join(' ')}`.toLowerCase();
  const morbido = secondo.gruppo === 'legumi' || secondo.gruppo === 'uova';
  if (morbido || RE_SECONDO_UMIDO.test(testo)) return ['pane', 'patate'];
  if (RE_SECONDO_ARROSTO.test(testo)) return ['patate'];
  return ['patate'];
}

// Un piatto "senza glutine" e' una sostituzione pensata per chi il glutine
// non lo puo' mangiare: a chi non ha quel vincolo non porta nessun
// vantaggio reale (problema 4 dell'audit, 2026-10-09 - "Pane senza
// glutine" proposto anche a chi non e' celiaco). Non esclude i piatti
// naturalmente senza glutine (riso, patate...), solo quelli che lo
// dichiarano nel nome come caratteristica apposita.
const RE_SOSTITUTO_SENZA_GLUTINE = /senza glutine/i;
function sostitutoSenzaGlutineNonRichiesto(piatto, haVincoloGlutine) {
  return RE_SOSTITUTO_SENZA_GLUTINE.test(piatto.name || '') && !haVincoloGlutine;
}

function accompagnaBene(accompagnamento, piattoBase) {
  if (piattoBase.amidoReale && accompagnamento.amidoReale) return false;
  // F2: due piatti dello stesso pasto non coprono entrambi proteina_principale
  // (l'intenzione era "non due piatti di proteina", non "stesso ruolo
  // primario" - un secondo il cui primario e' 'verdura' per peso ma che
  // copre comunque la proteina resta comunque un piatto proteico agli
  // effetti di questa regola). Sostituisce il vecchio controllo su
  // ha_proteina, il flag esistente e piu' largo (conta anche i latticini
  // leggeri) e non allineato alla soglia misurata in F1.
  if (copreRuolo(piattoBase, 'proteina_principale') && copreRuolo(accompagnamento, 'proteina_principale')) return false;
  if (accompagnamento.principale && accompagnamento.principale === piattoBase.principale) return false;
  return true;
}

// F0: controllo di capienza per aritmetica, prima di cercare una settimana.
// Il tetto dei passi (C16) ferma la ricerca senza dimostrare l'impossibilita':
// se il conto dice che non bastano abbastanza piatti DISTINTI, non serve
// cercare per scoprirlo. Granularita' reale della ricerca: il profiloSettimana
// governa 5 giorni su 7 (i giorni 3 e 6 possono usare un profiloGiorno
// diverso, pescato da profiliConSecondo - per questo il conto e' fatto per
// profilo, non sul totale del pool), ma resta un'approssimazione prudente
// pensata per non creare falsi "non si puo'": sovrastima la disponibilita'
// (conta un piatto se esiste ALMENO un giorno della settimana dove il suo
// paese sarebbe accettato, non lo vincola al giorno esatto) e sottostima
// leggermente la domanda (ignora la base amidacea, il cui bisogno dipende da
// scelte non ancora fatte). Meglio una ricerca in piu' quando non serve, mai
// un salto sbagliato.
//
// Estratta da provaGradino perche' un controllo di capienza fuori linea (F0,
// su tutte le combinazioni dieta+paese/i) deve chiamare la STESSA funzione
// che la generazione vera usa, non una sua reimplementazione - lo stesso
// principio gia' seguito per trovaCategoria.
function analizzaCapienza(profiloSettimana, catalogo, ctx) {
  const { primi, secondi, contorni, colazioni, spuntini } = catalogo;
  const { paesiScelti, opz, rifiutato, secondiFreschiNecessari, gruppiUnioneSettimana } = ctx;

  const paesiRilevanti = new Set(paesiScelti.length ? paesiScelti : [null]);
  const genericiPropri = new Set([...paesiRilevanti].map(p => p && GENERICO_DI[p]).filter(Boolean));
  const famiglieProprie = new Set([...genericiPropri].map(g => FAMIGLIA_DI_GENERICO[g]).filter(Boolean));
  const paesiAccettati = new Set([...paesiRilevanti, ...genericiPropri]);
  if (opz.genericoStessaFamiglia) {
    for (const g of GENERICI) if (famiglieProprie.has(FAMIGLIA_DI_GENERICO[g])) paesiAccettati.add(g);
  }
  if (opz.genericoQualunqueFamiglia) {
    for (const g of GENERICI) paesiAccettati.add(g);
  }
  const paeseAmmesso = (p) => !paesiScelti.length || paesiAccettati.has(p.paese);

  function contaDisponibili(lista, richiedeEsatto, filtroExtra) {
    return lista.filter(p =>
      (richiedeEsatto ? p.profilo === profiloSettimana : (p.profilo === profiloSettimana || p.profilo === 'neutro')) &&
      paeseAmmesso(p) && !rifiutato(p) && (!filtroExtra || filtroExtra(p))
    ).length;
  }

  // Le quote dei gruppi proteici (QUOTE) sono un vincolo sull'INTERA
  // settimana, non sul solo profiloSettimana: i giorni 3 e 6 possono pescare
  // il secondo da un profilo diverso (vedi gruppiUnioneSettimana piu' sopra),
  // quindi un gruppo mancante nel solo profiloSettimana in prova non rende la
  // settimana impossibile se esiste altrove nel pool. Scoped solo per paese e
  // rifiuti, mai per profilo - a differenza di contaDisponibili sopra, che
  // resta scoped al profiloSettimana per il conto dei secondi FRESCHI
  // (quello si', legato a quale profilo domina i 5 giorni normali).
  function contaDisponibiliUnione(lista, filtroExtra) {
    return lista.filter(p => paeseAmmesso(p) && !rifiutato(p) && (!filtroExtra || filtroExtra(p))).length;
  }

  // Vedi il commento su gruppiUnioneSettimana in generaESalva: i gruppi
  // davvero raggiungibili in settimana sono l'unione di tutti i profili con
  // secondi, non solo quelli del profiloSettimana in prova qui.
  const gruppiDelProfilo = gruppiUnioneSettimana;

  // Dal gradino 1 in su (opz.ripetizione) candidatiSecondo ammette una
  // ripetizione nell'intera settimana: con N giorni di cottura bastano
  // N-1 secondi distinti, non N. Prima questo controllo lo ignorava e
  // scartava per aritmetica profili che la ricerca vera avrebbe potuto
  // completare (misurato 2026-10-08: "europeo-leggero", 6 distinti, sempre
  // scartato anche ai gradini con ripetizione attiva).
  const nSecondi = contaDisponibili(secondi, true);
  const sogliaSecondi = secondiFreschiNecessari - (opz.ripetizione ? 1 : 0);
  if (nSecondi < sogliaSecondi) {
    return { ok: false, messaggio: `servono ${sogliaSecondi} secondi distinti, ne ha ${nSecondi}` };
  }
  if (!opz.quotaTollerante) {
    for (const [gruppo, q] of Object.entries(QUOTE)) {
      if (!gruppiDelProfilo.has(gruppo) || q.min <= 0) continue;
      const nGruppo = contaDisponibiliUnione(secondi, (p) => p.gruppo === gruppo);
      if (nGruppo < q.min) {
        return { ok: false, messaggio: `quota minima gruppo ${gruppo}: servono ${q.min}, ne ha ${nGruppo} in tutta la settimana (non solo in ${profiloSettimana})` };
      }
    }
  }

  // Solo avviso, mai un fallimento: un gruppo di QUOTE presente nel profilo
  // ma con zero secondi disponibili e' esattamente la situazione di
  // 'formaggio' scoperta il 19/09/2026 (misurato 0 su 710) prima di togliere
  // la quota - se ricapita su un altro gruppo, deve gridare qui, non restare
  // silenzioso come formaggio e' rimasto per mesi.
  for (const gruppo of Object.keys(QUOTE)) {
    if (!gruppiDelProfilo.has(gruppo)) continue;
    const nGruppo = contaDisponibiliUnione(secondi, (p) => p.gruppo === gruppo);
    if (nGruppo === 0) {
      console.warn(`gruppo ${gruppo} in QUOTE ma 0 secondi disponibili in tutta la settimana`);
    }
  }

  const nPrimi = contaDisponibili(primi, false);
  if (nPrimi < 7) return { ok: false, messaggio: `servono 7 primi distinti, ne ha ${nPrimi}` };

  const nContorni = contaDisponibili(contorni, false);
  if (nContorni < 14) return { ok: false, messaggio: `servono almeno 14 contorni distinti (cena+pranzo), ne ha ${nContorni}` };

  // CORREZIONE 2026-10-23: le colazioni ruotano (fino a 3 per settimana,
  // vedi pianoColazioni), non servono piu' 7 distinte - ne basta 1, la
  // rotazione usera' quelle che ci sono (anche solo 1 o 2).
  const nColazioni = contaDisponibili(colazioni, false);
  if (nColazioni < 1) return { ok: false, messaggio: `serve almeno 1 colazione, ne ha 0` };

  // CORREZIONE 2026-10-23: gli spuntini si ripetono fino a 3 volte a
  // settimana (usoSpuntini), non servono piu' 14 distinti (2 al giorno x 7)
  // - bastano i distinti necessari a coprire 14 usi senza mai superare 3
  // ripetizioni ciascuno: ceil(14/3) = 5.
  const SPUNTINI_MINIMI = Math.ceil(14 / 3);
  const nSpuntini = contaDisponibili(spuntini, false);
  if (nSpuntini < SPUNTINI_MINIMI) return { ok: false, messaggio: `servono almeno ${SPUNTINI_MINIMI} spuntini distinti (si ripetono al massimo 3 volte ciascuno), ne ha ${nSpuntini}` };

  return { ok: true };
}

// Vincoli dell'utente: UNA sola fonte per generatore e Swap. Prima del
// 21/09/2026 viveva dentro generaESalva e lo Swap non la vedeva: proponeva
// piatti col glutine ai celiaci (misurato: 10 su 54 proposte).
async function caricaVincoli(supabase, userId, dieta = 'onnivoro') {
  // --- Vincoli dell'utente: riferimenti risolti, non piu' testo da indovinare ---
  // food_id  = un alimento singolo. categoria = un gruppo intero.
  // Nessuno dei due = vincolo non risolto: non esclude nulla, e lo diciamo.

  const { data: vincoli, error: eVincoli } = await supabase
    .from('user_constraints')
    .select('kind, subject, severity, food_id, categoria')
    .eq('user_id', userId);
  if (eVincoli) throw new Error('lettura user_constraints: ' + eVincoli.message);

  const foodIdVietati = new Set();    // allergie, intolleranze, dieta: non cedono mai
  const foodIdSgraditi = new Set();   // preferenze: cedono al gradino 4b, dichiarandolo
  const categorieDaEspandere = new Set();
  const categorieSgradite = new Set();
  const nonRisolti = [];

  // Prudente per costruzione: e' una preferenza solo se lo dice sia kind che
  // severity. Qualunque altra combinazione, o un campo mancante, resta assoluta.
  const ePreferenza = (v) => v.kind === 'non_gradito' && v.severity === 'preferibile';

  for (const v of vincoli || []) {
    const molle = ePreferenza(v);
    if (v.food_id) { (molle ? foodIdSgraditi : foodIdVietati).add(v.food_id); continue; }
    if (v.categoria) {
      const dove = molle ? categorieSgradite : categorieDaEspandere;
      for (const c of [v.categoria, ...(CONTENUTE_IN[v.categoria] || [])]) dove.add(c);
      continue;
    }
    nonRisolti.push(v.subject || '(vuoto)');
  }

  // Dalla cache di riferimento (vedi caricaRiferimento sopra), non piu' da
  // una query per ogni chiamata: stessa espansione categoria -> food_id,
  // letta in memoria.
  const { foodIdsPerCategoria } = await caricaRiferimento(supabase);
  const espandi = (codici, destinazione) => {
    for (const codice of codici) {
      for (const fid of (foodIdsPerCategoria[codice] || [])) destinazione.add(fid);
    }
  };

  espandi(categorieDaEspandere, foodIdVietati);
  espandi(categorieSgradite, foodIdSgraditi);

  for (const fid of await foodIdVietatiPerDieta(supabase, dieta)) foodIdVietati.add(fid);
  for (const fid of (ALIMENTI_VIETATI_PER_DIETA[dieta] || [])) foodIdVietati.add(fid);

  if (nonRisolti.length) {
    console.warn(
      `ATTENZIONE: ${nonRisolti.length} vincolo/i non risolto/i, non escludono nulla: ${nonRisolti.join(', ')}`
    );
  }

  const senzaNessunoDi = (insieme) => (p) => {
    const ingredienti = p.ingredienti || p.dish_ingredients || [];
    for (const i of ingredienti) {
      const fid = i.food_id || (i.foods && i.foods.id);
      if (fid && insieme.has(fid)) return false;
    }
    return true;
  };

  const ammesso = senzaNessunoDi(foodIdVietati);   // assoluto
  const gradito = senzaNessunoDi(foodIdSgraditi);  // preferenza

  console.log(
    `Vincoli: ${foodIdVietati.size} alimenti vietati, ${foodIdSgraditi.size} sgraditi (dieta: ${dieta}), ${nonRisolti.length} non risolti`
  );

  // Categorie assolute escluse (vincoli dell'utente, non la dieta): serve a
  // chi deve sapere SE l'utente esclude il glutine, non solo quali food_id
  // sono vietati - es. "Pane senza glutine" non va proposto a chi il
  // glutine lo mangia normalmente (problema 4 dell'audit, 2026-10-09): una
  // sostituzione speciale per chi ne ha bisogno, non un'alternativa neutra.
  const categorieVietate = categorieDaEspandere;

  return { foodIdVietati, foodIdSgraditi, nonRisolti, ammesso, gradito, categorieVietate };
}

// Un piatto non piaciuto due volte non si ripropone: e' un no chiaro. Soglia
// centralizzata qui - genera.js e sostituisci.js la leggono da rifiutato(),
// nessuno dei due la riscrive a mano.
const SOGLIA_RIFIUTO = 2;

// Cosa e' successo nelle settimane precedenti - UNA sola fonte per
// generatore e Swap, stesso principio di caricaVincoli.
async function caricaEsiti(supabase, userId) {
  const { data: esiti, error: eEsiti } = await supabase
    .from('meal_outcomes')
    .select('dish_id, status, skip_reason')
    .eq('user_id', userId)
    .order('reported_at', { ascending: false })
    .limit(300);
  if (eEsiti) throw new Error('lettura meal_outcomes: ' + eEsiti.message);

  const saltati = {};
  let skipPerTempo = 0, skipTotali = 0;

  for (const e of (esiti || [])) {
    if (e.status !== 'saltato') continue;
    // "Ero fuori" non dice niente ne' sul piatto ne' sul tempo: fuori dai conti.
    if (e.skip_reason === 'fuori_casa') continue;
    skipTotali++;
    if (e.skip_reason === 'tempo') skipPerTempo++;
    // Solo il gusto conta contro il piatto (decisione del 21/09/2026):
    // tempo, ingredienti, altro non lo tolgono dai piani.
    if (e.skip_reason === 'gusto') saltati[e.dish_id] = (saltati[e.dish_id] || 0) + 1;
  }

  const rifiutato = (p) => (saltati[p.id] || 0) >= SOGLIA_RIFIUTO;

  return { saltati, skipPerTempo, skipTotali, rifiutato };
}

async function generaESalva(supabase, userId, seedIniziale, opzioni = {}) {
  // Modo prova (2026-09-19): salva=false costruisce la settimana senza
  // scrivere su plans/plan_items, per misurare senza sporcare il database.
  // Nessun chiamante esistente passa opzioni, quindi il default (true)
  // mantiene il comportamento di sempre.
  const salva = opzioni.salva !== false;
  // Nessun chiamante esistente passa questa opzione (stesso principio di
  // "salva" sopra): di default si tengono i piatti bloccati della
  // settimana precedente, come oggi. Il foglio "nuova settimana" (You)
  // passa false quando l'utente spegne "Keep the dishes you locked".
  const mantieniBloccati = opzioni.mantieniBloccati !== false;

  // MISURAZIONE TEMPORANEA (25 ottobre 2026, memoria della cache su Render
  // piano gratuito, 512MB): attiva solo con opzioni.misuraMemoria (nessun
  // chiamante esistente la passa). Da togliere a fine indagine.
  const _misuraMemoria = opzioni.misuraMemoria === true;
  const _memoria = [];
  const _scattaMemoria = (quando) => {
    if (!_misuraMemoria) return;
    const m = process.memoryUsage();
    _memoria.push({ quando, rss_mb: +(m.rss / 1048576).toFixed(1), heapUsed_mb: +(m.heapUsed / 1048576).toFixed(1), heapTotal_mb: +(m.heapTotal / 1048576).toFixed(1), external_mb: +(m.external / 1048576).toFixed(1) });
  };
  _scattaMemoria('ingresso (prima della cache)');

  // Seed esplicito se passato (per rigiocare un fallimento segnalato),
  // altrimenti generato qui - ma sempre salvato col piano, cosi' ogni
  // generazione e' rigiocabile a posteriori, non solo quando lo si prevede.
  const seed = (seedIniziale != null ? Number(seedIniziale) : Math.floor(Math.random() * 4294967296)) >>> 0;
  const rng = creaRng(seed);

  const { data: prefRaw, error: errPref } = await supabase
    .from('user_cuisine_preferences')
    .select('cucina, rank')
    .eq('user_id', userId);
  if (errPref) throw new Error(errPref.message);

  const preferenze = (prefRaw && prefRaw.length) ? prefRaw : [{ cucina: 'europea', rank: 1 }];

  const { data: profiloUtente } = await supabase
    .from('users')
    .select('cook_days, lunch_away, pasti_casa, evening_minutes, household_size, diet, paesi')
    .eq('id', userId)
    .maybeSingle();

  const giorniCottura = (profiloUtente && Array.isArray(profiloUtente.cook_days) && profiloUtente.cook_days.length)
    ? profiloUtente.cook_days
    : [1, 2, 3, 4, 5, 6, 7];
  // pasti_casa (se valorizzato) sa giorno per giorno dove si pranza; NULL
  // (utenti da prima della griglia, o chi non l'ha mai compilata) resta sul
  // vecchio comportamento: lunch_away vale per tutta la settimana o per
  // nessun giorno, non c'e' via di mezzo.
  const pastiCasa = profiloUtente && profiloUtente.pasti_casa;
  const lunchAwayGlobale = Boolean(profiloUtente && profiloUtente.lunch_away);
  const pranzoFuoriIl = (g) => pastiCasa
    ? (pastiCasa[String(g)] && pastiCasa[String(g)].pranzo === false)
    : lunchAwayGlobale;
  const minutiSera = (profiloUtente && Number(profiloUtente.evening_minutes)) || 45;

  const paesiScelti = (profiloUtente && profiloUtente.paesi) || [];

  // Il paese scelto domina, il generico della famiglia lo accompagna,
  // gli altri paesi restano possibili ma rari: e' cosi' che mangia una persona.
  const pesoPaese = (p) => {
    if (!paesiScelti.length) return 1;
    if (paesiScelti.includes(p.paese)) return 25;
    if (GENERICI.includes(p.paese)) return 6;
    return 1;
  };


  const dieta = profiloUtente?.diet || 'onnivoro';
  const { foodIdVietati, foodIdSgraditi, nonRisolti, ammesso, gradito, categorieVietate } =
    await caricaVincoli(supabase, userId, dieta);
  const haVincoloGlutine = categorieVietate.has('glutine');
  _scattaMemoria('dopo il caricamento della cache');

  // Cosa l'utente ha deciso di tenere dalla settimana precedente
  const { data: pianoVecchio, error: ePiano } = await supabase
    .from('plans').select('id')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false }).limit(1).maybeSingle();
  if (ePiano) throw new Error('lettura plans: ' + ePiano.message);

  // Un piatto bloccato resta esattamente nel suo giorno, pasto e slot,
  // qualunque sia la combinazione (anche una sola cena bloccata, o un solo
  // contorno): il resto della giornata si costruisce intorno a lui con le
  // regole normali (vedi il pre-assegnamento dentro provaGradino, piu' sotto).
  // Risolto qui una volta sola (non per gradino/profilo, che si ripetono)
  // sul catalogo pieno - un piatto bloccato non deve sparire solo perche'
  // la sua famiglia/soglia salute/occasione non e' quella di questo
  // tentativo, l'utente l'ha gia' approvato bloccandolo. Scartato SOLO se
  // non e' piu' ammesso da dieta/allergie (es. aggiunte nel frattempo):
  // in quel caso non entra nel piano ed e' segnalato nella risposta.
  const bloccatiPerGiorno = {};
  const piattiBloccatiScartati = [];
  if (pianoVecchio && mantieniBloccati) {
    const { data: righeBloccate } = await supabase
      .from('plan_items')
      .select('day_of_week, meal, slot, dish_id')
      .eq('plan_id', pianoVecchio.id)
      .eq('bloccato', true);

    if (righeBloccate?.length) {
      const idsBloccati = [...new Set(righeBloccate.map(r => r.dish_id))];
      const piattiRisolti = await caricaPiattiPerId(supabase, idsBloccati);
      const piattoDi = {};
      for (const p of piattiRisolti) piattoDi[p.id] = p;

      for (const r of righeBloccate) {
        const piatto = piattoDi[r.dish_id];
        if (!piatto || !ammesso(piatto)) {
          piattiBloccatiScartati.push({
            dish_id: r.dish_id, day_of_week: r.day_of_week, meal: r.meal, slot: r.slot,
            name: piatto?.name_en || piatto?.name || null,
          });
          continue;
        }
        if (!bloccatiPerGiorno[r.day_of_week]) bloccatiPerGiorno[r.day_of_week] = [];
        bloccatiPerGiorno[r.day_of_week].push({ meal: r.meal, slot: r.slot, piatto });
      }
    }
  }

  const cucinaOggi = (g) => giorniCottura.includes(g);
  const ferialeG = (g) => g <= 5;

  const tecnicaOk = (piatto, g) =>
    !ferialeG(g) || (piatto.tecnica || 'semplice') === 'semplice';

  const pesoFamiglia = {};
  for (const p of preferenze) {
    for (const fam of (FAMIGLIE_PER_CUCINA[p.cucina] || [])) {
      pesoFamiglia[fam] = Math.max(pesoFamiglia[fam] || 0, rankInPeso(p.rank));
    }
  }
  const famiglie = Object.keys(pesoFamiglia);
  if (!famiglie.length) throw new Error('Nessuna famiglia di sapori derivabile dalle preferenze');

  // Soglia 6, la piu' bassa mai ammessa (gradino 5 del Passo C): il filtro
  // vero per voto salute si applica in memoria a ogni tentativo, cosi' non
  // si riinterroga il database per ogni gradino della scala.
  let piatti = await caricaPiatti(supabase, famiglie, 6);

  // La dieta è un vincolo assoluto: si applica una volta sola, a monte,
  // così quote, piano proteico e selezione lavorano già su piatti ammessi.
  piatti = piatti.filter(ammesso);        // assoluti: filtrati una volta sola, come prima
  piatti = piatti.filter(p => !sostitutoSenzaGlutineNonRichiesto(p, haVincoloGlutine));
  const piattiConSgraditi = piatti;       // ci si arriva solo al gradino 4b
  piatti = piatti.filter(gradito);        // il caso normale: preferenze rispettate

  console.log(`Pool: ${piattiConSgraditi.length} dopo i vincoli assoluti, ` +
              `${piatti.length} dopo le preferenze ` +
              `(${piattiConSgraditi.length - piatti.length} piatti sgraditi tolti)`);

  // Spostato qui (2026-09-17, prima era letto solo a fine funzione, dopo la
  // ricerca): il tetto sale/saturi (gradino 2b+) deve valutare i valori
  // SCALATI durante la costruzione della giornata, quindi serve conoscere il
  // kcal obiettivo PRIMA che la ricerca inizi, non dopo che ha gia' finito.
  const { data: target, error: eTarget } = await supabase
    .from('energy_targets')
    .select('id, kcal, protein_g_min')
    .eq('user_id', userId)
    .order('computed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (eTarget) throw new Error('lettura energy_targets: ' + eTarget.message);
  const obiettivo = target?.kcal ?? null;
  const obiettivoProteine = target?.protein_g_min ?? null;

  const { skipPerTempo, skipTotali, rifiutato } = await caricaEsiti(supabase, userId);

  // Se piu' della meta' dei salti e' per mancanza di tempo, il limite
  // dichiarato non regge la vita reale e va stretto di dieci minuti.
  const minutiCorretti = (skipTotali >= 4 && skipPerTempo / skipTotali > 0.5)
    ? Math.max(15, minutiSera - 10)
    : minutiSera;

  // limiteFeriale e' il tempo reale dichiarato (minutiCorretti), sempre -
  // mai allargato da gruppiPerProfiloDa (vedi la correzione sopra).
  const limiteFeriale = minutiCorretti;
  const { profiliConSecondo, gruppiPerProfilo } = gruppiPerProfiloDa(piatti, minutiCorretti);
  if (!profiliConSecondo.length) throw new Error('Nessun profilo ha secondi utilizzabili');

  // Bug trovato il 2026-10-09 (vedi audit/analisi-generatore.md, problema C):
  // pianoProteico decide la sequenza di gruppi proteici di TUTTA la
  // settimana usando solo i gruppi del profiloSettimana scelto - ma i giorni
  // 3 e 6 possono gia' pescare un profiloGiorno diverso da profiliConSecondo
  // (vedi prossimaDecisione piu' sotto), quindi i gruppi DAVVERO
  // raggiungibili nella settimana sono l'unione di tutti i profili, non solo
  // quello della settimana. Con un profiloSettimana a catalogo povero (es.
  // 'europeo-leggero': 9 secondi, 0 carne/uova) il piano restava bloccato
  // su legumi/pesce per tutti e 7 i giorni, qualunque fosse la quota in
  // QUOTE - la carne non poteva mai essere pianificata, non solo essere rara.
  const gruppiUnioneSettimana = new Set();
  for (const pr of profiliConSecondo) for (const g of (gruppiPerProfilo[pr] || [])) gruppiUnioneSettimana.add(g);

  // Fase 3 Passo B: non si prefiltra piu' quali profili sono "abbastanza
  // ricchi" (la vecchia soglia >=5 secondi e >=2 gruppi proteici misurava la
  // cosa sbagliata - ammetteva profili che poi non completavano sette giorni,
  // e ne rifiutava altri risolvibili). Si prova ogni profilo con secondi
  // utilizzabili tramite costruzione incrementale con backtracking: e' la
  // costruzione stessa a rispondere se una settimana esiste.

  const famigliaDi = {};
  piatti.forEach(p => { if (p.profilo !== 'neutro') famigliaDi[p.profilo] = p.famiglia; });

  // ================= Fase 3 Passo B+C: costruttore con backtracking e scala di allentamento =================
  // Si costruisce UNA settimana un pezzo alla volta: ogni volta si riempie lo
  // slot con MENO candidati ammissibili, e quando uno slot resta senza
  // candidati si torna indietro all'ultima scelta fatta e si prova il
  // candidato successivo di QUELLO slot - non si butta via la settimana. Un
  // tetto di passi (5000 per profilo tentato) evita casi patologici. Se la
  // ricerca completa a un gradino di allentamento e' esaurita per TUTTI i
  // profili, si sale di un gradino e si rifa' la ricerca completa da capo -
  // mai un allentamento parziale "a occhio".
  //
  // Dieta, allergie e i non_graditi assoluti NON hanno alcun percorso qui
  // dentro: sono gia' fuori dal pool prima ancora di arrivarci (piatti =
  // piatti.filter(ammesso), sopra) - la scala non li vede proprio, non c'e'
  // un gradino che li "non applica", semplicemente non esiste codice che li
  // tocchi in questa funzione.

  // CORREZIONE 2026-10-22 (ricerca piu' efficiente, Parte 1 punto 11c):
  // configurabile via opzioni.maxPassiPerProfilo, default 5000 identico a
  // sempre - nessun chiamante esistente lo passa, quindi il comportamento
  // di oggi non cambia. genera-v4.js lo abbassa per fare tanti tentativi
  // brevi con seed diversi invece di uno solo lungo.
  const MAX_PASSI = opzioni.maxPassiPerProfilo || 5000; // per profilo tentato, non condiviso: un profilo povero non deve rubare il budget agli altri

  // Mescola una lista con l'rng col seme, ordinata per peso (famiglia
  // preferita) DOPO il mescolamento: usata per la scelta del profilo, non
  // per i piatti (quelli usano l'estrazione pesata qui sotto, C6).
  function pesoOrdinato(lista, pesoFn, rng) {
    return mescola(lista, rng)
      .map(v => ({ v, peso: pesoFn(v) }))
      .sort((a, b) => b.peso - a.peso)
      .map(x => x.v);
  }

  // F4 - due regole, entrambe preferenze (mai un vincolo, nessuna
  // combinazione e' vietata), terza componente di pesoCandidato sotto.
  // Fonti verificate (non a memoria) il 2026-09-12, elenco completo dei tag
  // e delle rispettive fonti in migrazione-tag-nutrizionali.js:
  //  - vitamina C + ferro vegetale nello stesso pasto: l'acido ascorbico
  //    riduce Fe3+ a Fe2+ e contrasta gli inibitori - "The role of vitamin C
  //    in iron absorption", PubMed 2507689. E' il piu' forte e documentato
  //    dei quattro misurati, da qui il peso maggiore.
  //  - grassi del pasto (>=5g, soglia dalla fonte stessa, non un tag per
  //    ingrediente: e' un totale, non una proprieta') + caroteni: senza
  //    grassi i caroteni liposolubili si assorbono molto meno - "Influence
  //    of dietary fat on beta-carotene absorption", PubMed 12002680.
  // Eliminate le altre due misurate: te'/caffe' + ferro (Hurrell, PubMed
  // 10999016 - effetto reale e forte, ma verificato che nel catalogo
  // attuale zero piatti hanno insieme una bevanda e una fonte di ferro
  // vegetale, dichiarata inattiva invece di lasciarla a far finta di
  // funzionare) e calcio+ferro (il piu' debole e contestato dei quattro,
  // svanisce negli studi di lungo periodo, avrebbe penalizzato abbinamenti
  // legittimi come pasta e fagioli col parmigiano - tolta anche dalla
  // tabella tag_nutrizionali, non solo dal peso).
  //
  // La vitamina C e' termolabile (foods.stato): bonus pieno se la fonte nel
  // piatto e' cruda, dimezzato se cotta. I caroteni sono l'opposto (la
  // cottura li rende PIU' disponibili) quindi nessuna penalita' li' - non
  // implementata di proposito, non per dimenticanza.
  const PESO_VITAMINA_C_FERRO = 6;    // il piu' forte dei due, effetto maggiore in letteratura
  const PESO_GRASSI_CAROTENI = 3;
  const GRASSI_MINIMI_PASTO = 5; // grammi, dalla fonte (PubMed 12002680: "circa 3-5g")

  function bonusNutrizionale(p, altriDelPasto) {
    if (!altriDelPasto.length) return 0;
    let bonus = 0;

    const pesoVitaminaC = (pFonte) => pFonte.vitaminaCStato === 'crudo' ? PESO_VITAMINA_C_FERRO
      : pFonte.vitaminaCStato === 'cotto' ? PESO_VITAMINA_C_FERRO / 2 : 0;

    // Vitamina C + ferro vegetale: conta in entrambe le direzioni (p porta
    // la vitamina C e un compagno il ferro, o viceversa) - a chi tocca
    // fornire cosa non e' definito a priori, dipende da quale slot si sta
    // decidendo in quel momento.
    if (p.ferroVegetale && altriDelPasto.some(c => c.vitaminaCStato)) {
      bonus += Math.max(...altriDelPasto.filter(c => c.vitaminaCStato).map(pesoVitaminaC));
    }
    if (p.vitaminaCStato && altriDelPasto.some(c => c.ferroVegetale)) {
      bonus += pesoVitaminaC(p);
    }

    // Grassi del pasto + caroteni: il totale include p stesso, non solo i
    // compagni - e' una soglia sul pasto intero.
    const grassiPasto = (p.fat || 0) + altriDelPasto.reduce((s, c) => s + (c.fat || 0), 0);
    if (grassiPasto >= GRASSI_MINIMI_PASTO) {
      if (p.caroteni) bonus += PESO_GRASSI_CAROTENI;
      if (altriDelPasto.some(c => c.caroteni)) bonus += PESO_GRASSI_CAROTENI;
    }

    return bonus;
  }

  // C6: peso di qualita' di un candidato piatto. Il voto salute domina
  // l'ordine, l'aderenza alle preferenze di cucina (pesoPaese: 25 sul paese
  // scelto, 6 sul generico, 1 altrove) e' un correttivo piu' leggero che
  // conta solo a parita' di voto - per questo e' su scala log2 mentre il
  // voto e' moltiplicato per 10. F4 (bonusNutrizionale) e' la terza
  // componente prevista da questo commento fin dalla progettazione
  // originale - mai piu' del 10-15% dell'intervallo del voto salute (10-100,
  // quindi il tetto pratico dei due pesi sopra e' attorno a 9-13,5, coerente
  // con 6 e 3 scelti sopra).
  function pesoCandidato(p, altriDelPasto = []) {
    const salute = (p.health_score != null ? p.health_score : 6) * 10;
    const aderenza = Math.log2((pesoPaese(p) || 1) + 1);
    return salute + aderenza + bonusNutrizionale(p, altriDelPasto);
  }

  // Estrazione pesata col seme: pesca senza reimbussolare, ricalcolando i
  // pesi sui rimanenti - e' l'idea di pescaPesato ripetuta finche' la lista
  // non si esaurisce, cosi' l'intero ORDINE riflette il peso, non solo il
  // primo elemento. Ogni candidato resta raggiungibile: cambia la
  // probabilita' di essere provato presto, mai l'insieme di cio' che e'
  // possibile provare.
  function mescolaPesata(lista, pesoFn, rng) {
    const rimanenti = lista.slice();
    const risultato = [];
    while (rimanenti.length) {
      const pesi = rimanenti.map(pesoFn);
      const totale = pesi.reduce((s, w) => s + Math.max(w, 1e-6), 0);
      let r = rng() * totale;
      let scelto = rimanenti.length - 1;
      for (let i = 0; i < rimanenti.length; i++) {
        r -= Math.max(pesi[i], 1e-6);
        if (r <= 0) { scelto = i; break; }
      }
      risultato.push(rimanenti[scelto]);
      rimanenti.splice(scelto, 1);
    }
    return risultato;
  }

  // Concatena piu' livelli di preferenza (es. profilo proprio, poi
  // ripetizione consentita): ogni livello e' estratto pesato per conto suo,
  // i duplicati fra livelli sono tolti. Il livello piu' preferito resta
  // primo nella struttura, ma la ricerca puo' comunque scendere ai livelli
  // successivi invece di fermarsi.
  function concatenaLivelli(livelli, rng, altriDelPasto = []) {
    const visti = new Set();
    const risultato = [];
    const pesoFn = (p) => pesoCandidato(p, altriDelPasto);
    for (const livello of livelli) {
      for (const p of mescolaPesata(livello, pesoFn, rng)) {
        if (visti.has(p.id)) continue;
        visti.add(p.id);
        risultato.push(p);
      }
    }
    return risultato;
  }

  // Un tentativo di costruzione completo a un dato gradino di allentamento.
  // gradino 0 = obiettivo, nessun allentamento. sogliaSalute e' passata a
  // parte perche' al gradino 5 scende sotto 7 in due passi (6.5 poi 6),
  // sempre dentro lo stesso gradino 5.
  function provaGradino(opz, sogliaSalute, scadenza) {
    const insiemeBase = opz.preferenzeTolleranti ? piattiConSgraditi : piatti;
    const perSlot = (slot) => insiemeBase.filter(p => p.meal_slot === slot && (p.health_score == null || p.health_score >= sogliaSalute));
    const primi     = perSlot('primo');
    const secondi   = perSlot('secondo');
    const contorni  = perSlot('contorno');
    const colazioni = perSlot('colazione');
    const spuntini  = perSlot('spuntino');

    // Quante cene fresche servono davvero: un giorno senza cottura riusa
    // l'avanzo del giorno precedente, tranne se e' il giorno 1 (non c'e'
    // nulla da riusare ancora) - stessa logica dell'avanzo nella ricerca.
    const secondiFreschiNecessari = giorniCottura.length + (cucinaOggi(1) ? 0 : 1);

    const catalogoSlot = { primi, secondi, contorni, colazioni, spuntini };
    const ctxCapienza = { paesiScelti, opz, rifiutato, secondiFreschiNecessari, gruppiUnioneSettimana };
    const capienzaSufficiente = (profiloSettimana) => analizzaCapienza(profiloSettimana, catalogoSlot, ctxCapienza);

    const diagnosticaProfili = [];
    const profiliDaProvare = pesoOrdinato(profiliConSecondo, pr => pesoFamiglia[famigliaDi[pr]] || 1, rng);

    profiliEsterni:
    for (const profiloSettimana of profiliDaProvare) {
      const capienza = capienzaSufficiente(profiloSettimana);
      if (!capienza.ok) {
        diagnosticaProfili.push(`${profiloSettimana}: impossibile per aritmetica - ${capienza.messaggio}`);
        continue profiliEsterni;
      }

      const passiUsati = { valore: 0 };

      const sequenza = pianoProteico(gruppiUnioneSettimana, rng);
      // Colazioni ammesse per questa settimana: stesso criterio compatibile()
      // usato dentro candidatiColazione (profilo proprio o neutro), cosi' la
      // rotazione scelta qui e' sempre coerente con cio' che candidatiColazione
      // accetterebbe comunque giorno per giorno.
      const sequenzaColazioni = pianoColazioni(colazioni.filter(p => compatibile(p, profiloSettimana) && !rifiutato(p)), rng);
      if (sequenzaColazioni.length < 3) {
        console.warn(`[genera] colazioni in rotazione per ${profiloSettimana}: solo ${sequenzaColazioni.length} disponibili (ne servirebbero 3 per ingrediente principale distinto)`);
      }

      // Stato mutabile di questo tentativo: ogni frame della pila sa come
      // annullare esattamente cio' che ha causato, cosi' tornare indietro e'
      // la semplice inversa di andare avanti.
      const usati = new Set();
      // CORREZIONE 2026-10-23: gli spuntini non condividono piu' 'usati' - si
      // ripetono quanto serve nella settimana, ma al massimo 3 volte per
      // piatto (letto qui, mai nello stesso giorno per costruzione: le
      // candidatiSpuntino* escludono sempre gli altri spuntini di quel
      // giorno a prescindere da questo contatore).
      const usoSpuntini = new Map();
      const usoGruppi = {};
      const usoSalse = { valore: 0 };
      const ripetizioniSecondo = { valore: 0 }; // gradino 1: al massimo una nell'intera settimana
      // Stessa regola del secondo (gradino 1: al massimo una ripetizione a
      // settimana), con in piu' il vincolo che non capiti mai due giorni di
      // fila: un contorno con l'amido non deve sentirsi "lo stesso pranzo di
      // ieri". giornoBaseDi ricorda in quale giorno un piatto e' stato usato
      // la prima volta in questo slot, cosi' candidatiBase puo' verificare
      // la distanza prima di riproporlo.
      const ripetizioniBase = { valore: 0 };
      const giornoBaseDi = new Map();
      const statoGiorni = Array.from({ length: 7 }, () => ({}));
      // Giorni dove il ricercatore di proteine (provaAumentoProteine) ha
      // gia' provato a scegliere diverso e serve ancora stringere il primo/
      // pane per lasciare crescere il secondo: letto da limitiDi tramite
      // pastiDi (vedi piu' sotto), mai resettato a meta' tentativo - un
      // giorno che l'ha chiesto una volta resta "affamato" per il resto di
      // questo tentativo, non e' un problema se il tentativo viene scartato
      // (si riparte da un Set vuoto al prossimo gradino/profilo).
      const giorniCercaProteine = new Set();

      // Pre-assegna i piatti bloccati, una volta per tentativo (usati/
      // usoGruppi sono per-tentativo, azzerati qui sopra): MAI dentro la
      // pila di backtracking, quindi mai annullati da un "torna indietro" -
      // e' un vincolo dato da prima che la ricerca cominci, non una scelta
      // della ricerca. Il resto della giornata (vedi prossimaDecisione piu'
      // sotto) si decide intorno a questi con le regole normali: stesso
      // principaleLiberoOggi, stesso paese/profilo del giorno (preso dal
      // bloccato stesso, non dalla rotazione), stessa ricerca per i soli
      // slot ancora liberi.
      for (const [giornoStr, lista] of Object.entries(bloccatiPerGiorno)) {
        const gi = Number(giornoStr) - 1;
        const st = statoGiorni[gi];
        st.bloccatiOggi = lista;
        for (const b of lista) {
          if (b.meal === 'cena' && b.slot === 'secondo') { assegnaSecondoScelto(gi, b.piatto); continue; }
          usati.add(b.piatto.id);
          if (b.meal === 'colazione') st.colazione = b.piatto;
          else if (b.meal === 'pranzo' && b.slot === 'primo') st.primo = b.piatto;
          else if (b.meal === 'pranzo' && b.slot === 'contorno') st.contornoPranzo = b.piatto;
          else if (b.meal === 'spuntino') { if (st.spuntino === undefined) st.spuntino = b.piatto; else st.spuntino2 = b.piatto; }
          else if (b.meal === 'cena' && b.slot === 'contorno') {
            if (b.piatto.base_amidacea) st.base = b.piatto; else st.contornoCena = b.piatto;
          }
        }
      }

      const pila = [];

      // Stessa forma dell'array 'pasti' costruito a fine funzione per il
      // salvataggio (era duplicato inline li' e nel ciclo di ricostruzione:
      // estratto una volta sola perche' ora serve anche qui, dentro la
      // ricerca, per valutare la giornata sui valori scalati appena e'
      // COMPLETA).
      function pastiDi(gi) {
        const st = statoGiorni[gi];
        // Quali id sono quelli dei piatti bloccati di oggi: serve a
        // rimettere bloccato=true sulla riga giusta al salvataggio, senza
        // dover portare il flag dentro ogni singolo campo di statoGiorni.
        const idsBloccati = new Set((st.bloccatiOggi || []).map(b => b.piatto.id));
        const cercaProteine = giorniCercaProteine.has(gi);
        const conFlag = (x) => x && { ...x, bloccato: idsBloccati.has(x.piatto.id), cercaProteine };
        return [
          conFlag(st.colazione      && { meal: 'colazione', slot: 'colazione', piatto: st.colazione }),
          conFlag(st.primo          && { meal: 'pranzo',    slot: 'primo',     piatto: st.primo }),
          conFlag(st.contornoPranzo && { meal: 'pranzo',    slot: 'contorno',  piatto: st.contornoPranzo }),
          conFlag(st.basePranzo     && { meal: 'pranzo',    slot: 'contorno',  piatto: st.basePranzo }),
          conFlag(st.spuntino       && { meal: 'spuntino',  slot: 'spuntino',  piatto: st.spuntino }),
          conFlag(st.secondo        && { meal: 'cena',      slot: 'secondo',   piatto: st.secondo, avanzi: st.secondoEAvanzo }),
          conFlag(st.contornoCena   && { meal: 'cena',      slot: 'contorno',  piatto: st.contornoCena }),
          conFlag(st.base           && { meal: 'cena',      slot: 'contorno',  piatto: st.base }),
          conFlag(st.spuntino2      && { meal: 'spuntino',  slot: 'spuntino',  piatto: st.spuntino2 }),
          conFlag(st.spuntino3      && { meal: 'spuntino',  slot: 'spuntino',  piatto: st.spuntino3 }),
        ].filter(Boolean);
      }

      function creaFrame(giorno, nomeSlot, candidati, applica) {
        return { giorno, nomeSlot, candidati, indice: 0, applica, annullaCorrente: null };
      }
      function entraFrame(frame) {
        frame.annullaCorrente = frame.applica(frame.candidati[0]);
        passiUsati.valore++;
      }
      function riprovaFrame(frame) {
        if (frame.annullaCorrente) { frame.annullaCorrente(); frame.annullaCorrente = null; }
        frame.indice++;
        if (frame.indice >= frame.candidati.length) return false;
        frame.annullaCorrente = frame.applica(frame.candidati[frame.indice]);
        passiUsati.valore++;
        return true;
      }
      // Torna indietro all'ultima scelta e prova il candidato successivo di
      // QUELLO slot (B2); se e' esaurito, si scende di un altro livello
      // nella pila, finche' non se ne trova uno con alternative o la pila
      // si svuota (questo profilo, a questo gradino, non regge nessuna
      // settimana).
      function indietro() {
        while (pila.length) {
          const frame = pila[pila.length - 1];
          if (riprovaFrame(frame)) return frame.giorno - 1;
          pila.pop();
        }
        return -1;
      }

      function assegnaSlot(gi, nomeSlot, piatto) {
        statoGiorni[gi][nomeSlot] = piatto;
        usati.add(piatto.id);
        return () => { delete statoGiorni[gi][nomeSlot]; usati.delete(piatto.id); };
      }
      // Un secondo puo' essere: fresco (non ancora usato, il caso normale),
      // oppure - solo dal gradino 1 in su, e al massimo una volta nella
      // settimana - una ripetizione di un secondo gia' servito. La
      // distinzione si legge da 'usati' al momento della scelta, non serve
      // taggare il candidato a monte.
      function assegnaSecondoScelto(gi, piatto) {
        const eRipetizione = usati.has(piatto.id);
        statoGiorni[gi].secondo = piatto;
        statoGiorni[gi].secondoEAvanzo = false;
        statoGiorni[gi].secondoERipetizione = eRipetizione;
        let salsaIncrementata = false;
        if (!eRipetizione) {
          usati.add(piatto.id);
          if (piatto.salsa_industriale) { usoSalse.valore++; salsaIncrementata = true; }
        } else {
          ripetizioniSecondo.valore++;
        }
        if (piatto.gruppo) usoGruppi[piatto.gruppo] = (usoGruppi[piatto.gruppo] || 0) + 1;
        return () => {
          delete statoGiorni[gi].secondo;
          delete statoGiorni[gi].secondoEAvanzo;
          delete statoGiorni[gi].secondoERipetizione;
          if (!eRipetizione) {
            usati.delete(piatto.id);
            if (salsaIncrementata) usoSalse.valore--;
          } else {
            ripetizioniSecondo.valore--;
          }
          if (piatto.gruppo) usoGruppi[piatto.gruppo]--;
        };
      }
      // Stesso schema di assegnaSecondoScelto: una ripetizione non tocca
      // 'usati' (e' gia' dentro) e si annulla senza rimuoverlo. giornoBaseDi
      // tiene la prima apparizione per il controllo di distanza in
      // candidatiBase; su una ripetizione non si aggiorna (conta sempre
      // dalla prima volta, non dall'ultima).
      function assegnaBaseScelto(gi, piatto) {
        const eRipetizione = usati.has(piatto.id);
        statoGiorni[gi].base = piatto;
        if (!eRipetizione) {
          usati.add(piatto.id);
          giornoBaseDi.set(piatto.id, gi);
        } else {
          ripetizioniBase.valore++;
        }
        return () => {
          delete statoGiorni[gi].base;
          if (!eRipetizione) {
            usati.delete(piatto.id);
            giornoBaseDi.delete(piatto.id);
          } else {
            ripetizioniBase.valore--;
          }
        };
      }
      function assegnaProfiloGiorno(gi, profilo) {
        statoGiorni[gi].profiloGiorno = profilo;
        return () => { delete statoGiorni[gi].profiloGiorno; };
      }

      // F3: nessun ingrediente principale ripetuto nella stessa giornata -
      // non solo fra un piatto e il suo abbinato (accompagnaBene gia' lo
      // faceva, ma solo per la coppia), tutta la giornata: due spuntini alla
      // banana in momenti diversi del giorno sono lo stesso problema di un
      // contorno e una colazione entrambi ai cachi. Letto da statoGiorni al
      // momento della scelta, non serve uno stato separato da annullare -
      // riflette sempre esattamente cio' che e' assegnato adesso.
      function principaliOggi(gi) {
        const st = statoGiorni[gi];
        return [st.colazione, st.primo, st.contornoPranzo, st.basePranzo, st.spuntino, st.secondo, st.contornoCena, st.base, st.spuntino2, st.spuntino3]
          .filter(Boolean).map(p => p.principale).filter(Boolean);
      }
      const principaleLiberoOggi = (gi, p) => !p.principale || !principaliOggi(gi).includes(p.principale);

      // F4: piatti gia' scelti nello stesso pasto (pranzo = primo+contorno
      // [+pane d'emergenza], cena = secondo+contorno+base), qualunque sia
      // l'ordine in cui la ricerca li ha decisi - la ricerca sceglie prima
      // lo slot con meno candidati, non sempre nello stesso ordine, quindi
      // va letto da statoGiorni al momento della scelta, non assunto fisso.
      function compagniDiPasto(gi, pasto) {
        const st = statoGiorni[gi];
        if (pasto === 'pranzo') return [st.primo, st.contornoPranzo, st.basePranzo].filter(Boolean);
        if (pasto === 'cena') return [st.secondo, st.contornoCena, st.base].filter(Boolean);
        return [];
      }

      // Candidati per ciascuno slot, dato lo stato attuale del giorno.
      // paeseOk e limiteOggi sono gia' allargati (gradini 3 e 4) da chi li
      // costruisce in prossimaDecisione, quindi qui i filtri restano
      // identici a prima: e' l'ingresso che e' piu' largo, non la logica.
      function candidatiSecondo(gi, profiloGiorno, paeseGiorno, genericoOggi, paeseOk, limiteOggi) {
        const g = gi + 1;
        const gruppoRichiesto = sequenza[gi];
        const baseComune = (p) =>
          !rifiutato(p) &&
          (p.prep_min || 30) <= limiteOggi && tecnicaOk(p, g) &&
          (!p.salsa_industriale || usoSalse.valore < 1) &&
          principaleLiberoOggi(gi, p);

        const proprio = secondi.filter(p => p.profilo === profiloGiorno && paeseOk(p) && baseComune(p) && !usati.has(p.id));
        const proprioCentra = gruppoRichiesto ? proprio.filter(p => p.gruppo === gruppoRichiesto) : [];
        const proprioAltro = gruppoRichiesto ? proprio.filter(p => p.gruppo !== gruppoRichiesto) : proprio;
        const generico = paeseGiorno
          ? secondi.filter(p => p.paese === genericoOggi && baseComune(p) && !usati.has(p.id))
          : [];
        // Gradino 1, ultimo livello: una ripetizione, mai piu' di una a
        // settimana, provata solo se non c'e' altro fresco disponibile.
        const ripetuto = (opz.ripetizione && ripetizioniSecondo.valore < 1)
          ? secondi.filter(p => p.profilo === profiloGiorno && paeseOk(p) && baseComune(p) && usati.has(p.id))
          : [];
        return concatenaLivelli([proprioCentra, proprioAltro, generico, ripetuto], rng, compagniDiPasto(gi, 'cena'));
      }

      function candidatiPrimo(gi, profiloGiorno, paeseGiorno, genericoOggi, paeseOk, limiteOggi) {
        const g = gi + 1;
        const base = (p) =>
          !usati.has(p.id) && !rifiutato(p) &&
          (p.prep_min || 30) <= limiteOggi && tecnicaOk(p, g) &&
          (!pranzoFuoriIl(g) || p.trasportabile) &&
          principaleLiberoOggi(gi, p);

        const proprio = primi.filter(p => compatibile(p, profiloGiorno) && paeseOk(p) && base(p));
        const generico = paeseGiorno ? primi.filter(p => p.paese === genericoOggi && base(p)) : [];
        const neutro = primi.filter(p => (p.profilo === 'neutro' || !p.profilo || p.paese === 'mediterraneo_generico') && base(p));
        return concatenaLivelli([proprio, generico, neutro], rng, compagniDiPasto(gi, 'pranzo'));
      }

      function candidatiContorno(gi, ruolo, profiloGiorno, paeseGiorno, paeseOk, limiteOggi, piattoAbbinato, altroContorno) {
        const g = gi + 1;
        const trasportabileSeServe = ruolo === 'pranzo' ? (c) => (!pranzoFuoriIl(g) || c.trasportabile) : () => true;
        // Un contorno di pasta/riso/farro/orzo/couscous scondito non e'
        // cucina italiana di casa (problema A, poi problema 5 trovato alla
        // verifica: tornava a PRANZO - "Farro con pastinaca" + contorno
        // "Pasta integrale" - perche' la prima correzione escludeva questi
        // piatti solo a cena). Vale sempre, pranzo e cena: l'unico amido
        // ammesso come contorno e' pane o patate, mai un primo travestito.
        const nonCerealeScondito = (c) => !c.base_amidacea || tipoAmidoDiAccompagnamento(c) != null;
        const base = (c) =>
          !usati.has(c.id) && !rifiutato(c) &&
          (c.prep_min || 20) <= limiteOggi && tecnicaOk(c, g) &&
          (!altroContorno || c.id !== altroContorno.id) &&
          trasportabileSeServe(c) &&
          nonCerealeScondito(c) &&
          principaleLiberoOggi(gi, c);

        const proprio = contorni.filter(c => compatibile(c, profiloGiorno) && accompagnaBene(c, piattoAbbinato) && paeseOk(c) && base(c));
        const neutroStretto = contorni.filter(c => (c.profilo === 'neutro' || !c.profilo) && accompagnaBene(c, piattoAbbinato) && paeseOk(c) && base(c));
        const neutroLargo = contorni.filter(c => (c.profilo === 'neutro' || !c.profilo || c.paese === 'mediterraneo_generico') && accompagnaBene(c, piattoAbbinato) && base(c));
        return concatenaLivelli([proprio, neutroStretto, neutroLargo], rng, compagniDiPasto(gi, ruolo));
      }

      // CORREZIONE 2026-10-23: niente piu' !usati.has - le colazioni possono
      // ripetersi nella settimana, la varieta' e' garantita a monte dalla
      // rotazione (sequenzaColazioni, fino a 3 per ingrediente principale
      // distinto). Il giorno prova PRIMA quella che gli tocca in rotazione
      // (gi % lunghezza), poi le altre 1-2 della rotazione se quella di oggi
      // scontra un altro pasto dello stesso giorno (principaleLiberoOggi),
      // e solo come ultima risorsa il resto del catalogo - cosi' la
      // settimana resta quasi sempre a 3 colazioni diverse, ma un vicolo
      // cieco non blocca comunque tutta la giornata.
      function candidatiColazione(gi, profiloGiorno, paeseOkLeggero, cappaMinuti) {
        const base = (p) => !rifiutato(p) && (p.prep_min || 10) <= cappaMinuti && paeseOkLeggero(p) && principaleLiberoOggi(gi, p);
        const assegnata = sequenzaColazioni.length ? sequenzaColazioni[gi % sequenzaColazioni.length] : null;
        const diOggi = assegnata && base(assegnata) ? [assegnata] : [];
        const altreDellaRotazione = sequenzaColazioni.filter(c => (!assegnata || c.id !== assegnata.id) && base(c));
        const proprio = colazioni.filter(p => compatibile(p, profiloGiorno) && base(p));
        const neutro = colazioni.filter(p => (p.profilo === 'neutro' || !p.profilo) && base(p));
        return concatenaLivelli([diOggi, altreDellaRotazione, proprio, neutro], rng);
      }

      // F3, seconda regola: non due spuntini con base amidacea nello stesso
      // giorno (due spuntini a cracker/gallette, invece di uno a frutta e
      // uno amidaceo). copreRuolo legge ruoli_coperti gia' calcolato da F1
      // (classifica-ruoli-piatti.js), non lo ricalcola.
      //
      // CORREZIONE 2026-10-23: niente piu' !usati.has - gli spuntini sono
      // pensati per essere semplici e ripetibili (frutta, yogurt, frutta
      // secca...), quindi possono tornare piu' giorni, ma al massimo 3 volte
      // a settimana per piatto (usoSpuntini). Mai due volte nello stesso
      // giorno: lo garantisce gia' "!altroSpuntino || p.id !== altroSpuntino.id"
      // qui sotto, indipendente dal nuovo tetto.
      function candidatiSpuntino(gi, profiloGiorno, paeseOkLeggero, altroSpuntino, cappaMinuti) {
        const altroEAmidaceo = altroSpuntino && copreRuolo(altroSpuntino, 'base_amidacea');
        const base = (p) =>
          !rifiutato(p) && (usoSpuntini.get(p.id) || 0) < 3 && (p.prep_min || 5) <= cappaMinuti && paeseOkLeggero(p) &&
          (!altroSpuntino || p.id !== altroSpuntino.id) &&
          (!altroEAmidaceo || !copreRuolo(p, 'base_amidacea')) &&
          principaleLiberoOggi(gi, p);
        const proprio = spuntini.filter(p => compatibile(p, profiloGiorno) && base(p));
        const neutro = spuntini.filter(p => (p.profilo === 'neutro' || !p.profilo) && base(p));
        return concatenaLivelli([proprio, neutro], rng);
      }

      // tipiRichiesti e' un ordine di preferenza (es. ['pane', 'patate']), non
      // un valore unico - vedi tipiAccompagnamentoDaSecondo. Ogni tipo genera
      // il suo livello "fresco" prima di passare al tipo successivo, cosi' un
      // pane fresco batte sempre una patata fresca quando entrambi esistono
      // (la preferenza del secondo resta la prima scelta), ma una patata
      // fresca batte un pane ripetuto quando il pane e' scarso - meglio
      // variare piatto che ripetere lo stesso, a parita' di tipo "giusto" o
      // "di scorta". I livelli "ripetuto" di ciascun tipo vengono dopo tutti
      // i "fresco", nello stesso ordine di preferenza.
      function candidatiBase(gi, paeseOk, tipiRichiesti) {
        const altriDelPasto = compagniDiPasto(gi, 'cena');
        const baseDiTipo = (tipo) => (p) => p.base_amidacea && tipoAmidoDiAccompagnamento(p) === tipo && paeseOk(p) && !rifiutato(p) && principaleLiberoOggi(gi, p);
        const freschi = tipiRichiesti.map((tipo) => contorni.filter(p => baseDiTipo(tipo)(p) && !usati.has(p.id)));
        // Stessa ripetizione del secondo (gradino 1, al massimo una a
        // settimana), ma mai a meno di due giorni di distanza dalla prima
        // volta: un contorno con l'amido ripetuto il giorno dopo si
        // sentirebbe "lo stesso pasto di ieri" in un modo che un secondo
        // ripetuto a distanza non da'.
        const ripetuti = (opz.ripetizione && ripetizioniBase.valore < 1)
          ? tipiRichiesti.map((tipo) => contorni.filter(p => baseDiTipo(tipo)(p) && usati.has(p.id) && giornoBaseDi.has(p.id) && Math.abs(giornoBaseDi.get(p.id) - gi) >= 2))
          : [];
        return concatenaLivelli([...freschi, ...ripetuti], rng, altriDelPasto);
      }

      // Aumenti di emergenza (problema 1/2 della verifica, 2026-10-09): se a
      // fine giornata le kcal restano sotto obiettivo perche' ogni piatto e'
      // gia' al suo tetto in grammi, non c'e' piu' spazio per gonfiare un
      // piatto esistente - va aggiunta capacita' nuova. Nell'ordine chiesto:
      // un contorno amidaceo anche a pranzo, un terzo spuntino, una
      // colazione piu' ricca. Chiamati SOLO da avanzaFinDove quando serve
      // (non sono decisioni sempre presenti come le altre), ma con lo
      // stesso meccanismo di frame/applica/annulla cosi' il backtracking li
      // annulla come tutto il resto se la giornata viene poi scartata per
      // altri motivi.
      //
      // CORREZIONE 2026-10-22 (richiesta dell'utente): questo contorno era
      // sempre "pane", mai "patate" - una scelta mai decisa, solo quella che
      // capitava di scrivere quando e' stato implementato il 9 ottobre
      // (commit 4cda843, "Aumenti di emergenza... pane anche a pranzo").
      // Nessun motivo forte per la differenza dalla regola di cena: il
      // secondo del giorno e' lo stesso sia a pranzo (come avanzo, se oggi
      // non si cucina) sia a cena, quindi la stessa logica "pane o patate
      // secondo cosa sta meglio col secondo" (tipoAccompagnamentoDaSecondo,
      // usata da candidatiBase per la cena) vale identica qui: e' l'ordine di
      // preferenza a cambiare da chiamata a chiamata, non piu' un valore
      // fisso (vedi tipiAccompagnamentoDaSecondo, correzione 2026-10-22 sera).
      function candidatiBasePranzo(gi, paeseOk, tipiRichiesti) {
        const altriDelPasto = compagniDiPasto(gi, 'pranzo');
        const baseDiTipo = (tipo) => (p) => p.base_amidacea && tipoAmidoDiAccompagnamento(p) === tipo &&
          paeseOk(p) && !rifiutato(p) && !usati.has(p.id) && principaleLiberoOggi(gi, p);
        const livelli = tipiRichiesti.map((tipo) => contorni.filter(baseDiTipo(tipo)));
        return concatenaLivelli(livelli, rng, altriDelPasto);
      }
      function assegnaBasePranzoScelto(gi, piatto) {
        statoGiorni[gi].basePranzo = piatto;
        usati.add(piatto.id);
        return () => { delete statoGiorni[gi].basePranzo; usati.delete(piatto.id); };
      }

      // Stesso tetto di 3 usi a settimana di candidatiSpuntino (usoSpuntini,
      // non piu' 'usati'), mai lo stesso piatto di spuntino/spuntino2 oggi.
      function candidatiSpuntino3(gi, profiloGiorno, paeseOkLeggero, cappaMinuti) {
        const st = statoGiorni[gi];
        const altri = [st.spuntino, st.spuntino2].filter(Boolean);
        const base = (p) =>
          !rifiutato(p) && (usoSpuntini.get(p.id) || 0) < 3 && (p.prep_min || 5) <= cappaMinuti && paeseOkLeggero(p) &&
          !altri.some(a => a.id === p.id) && principaleLiberoOggi(gi, p);
        const proprio = spuntini.filter(p => compatibile(p, profiloGiorno) && base(p));
        const neutro = spuntini.filter(p => (p.profilo === 'neutro' || !p.profilo) && base(p));
        return concatenaLivelli([proprio, neutro], rng);
      }
      // Unico punto che davvero assegna uno spuntino (spuntino/spuntino2/
      // spuntino3 passano tutti di qui): incrementa usoSpuntini invece di
      // 'usati', cosi' lo stesso piatto resta scegliibile altri giorni fino
      // al tetto di 3.
      function assegnaSpuntinoScelto(gi, nomeSlot, piatto) {
        statoGiorni[gi][nomeSlot] = piatto;
        usoSpuntini.set(piatto.id, (usoSpuntini.get(piatto.id) || 0) + 1);
        return () => {
          delete statoGiorni[gi][nomeSlot];
          const n = (usoSpuntini.get(piatto.id) || 1) - 1;
          if (n <= 0) usoSpuntini.delete(piatto.id); else usoSpuntini.set(piatto.id, n);
        };
      }

      // Rifa' la scelta della colazione preferendo le piu' ricche in kcal
      // (non il solito peso casuale): qui si cerca deliberatamente piu'
      // energia, non varieta'. Annulla ripristina la colazione precedente,
      // non la cancella - non e' un'aggiunta, e' una sostituzione. Non
      // guarda la rotazione (sequenzaColazioni): e' una via d'emergenza per
      // le kcal, puo' eccezionalmente introdurre una quarta colazione se
      // serve davvero.
      function candidatiColazionePiuRicca(gi, profiloGiorno, paeseOkLeggero, cappaMinuti) {
        const base = (p) => !rifiutato(p) && (p.prep_min || 10) <= cappaMinuti && paeseOkLeggero(p) && principaleLiberoOggi(gi, p);
        const candidati = colazioni.filter(p => compatibile(p, profiloGiorno) && base(p));
        return candidati.slice().sort((a, b) => (b.kcal || 0) - (a.kcal || 0));
      }
      function assegnaColazionePiuRicca(gi, piatto) {
        const st = statoGiorni[gi];
        const precedente = st.colazione;
        st.colazione = piatto;
        return () => {
          if (precedente) st.colazione = precedente;
          else delete st.colazione;
        };
      }
      // Unico punto che assegna la colazione del giorno (sia la scelta
      // normale sia, con lo stesso meccanismo, quella di rotazione): niente
      // 'usati', vedi candidatiColazione.
      function assegnaColazioneScelto(gi, piatto) {
        statoGiorni[gi].colazione = piatto;
        return () => { delete statoGiorni[gi].colazione; };
      }

      // Determina la prossima decisione necessaria per il giorno `gi`.
      // Ritorna 'COMPLETO' se il giorno non ha piu' nulla da decidere,
      // altrimenti il frame pronto da inserire in pila, o null se la
      // decisione necessaria non ha candidati (vicolo cieco).
      function prossimaDecisione(gi) {
        const g = gi + 1;
        const st = statoGiorni[gi];

        // Un giorno con un piatto bloccato segue il profilo e il paese di
        // QUEL piatto (coerenza degli abbinamenti), non la rotazione
        // settimanale - mai una ricerca per decidere il profiloGiorno:
        // il piatto bloccato l'ha gia' deciso lui.
        if (st.profiloGiorno === undefined && st.bloccatiOggi?.length) {
          const daiBloccati = st.bloccatiOggi.map(b => b.piatto.profilo).find(p => p && p !== 'neutro');
          if (daiBloccati) st.profiloGiorno = daiBloccati;
        }

        if ((g === 3 || g === 6) && st.profiloGiorno === undefined) {
          const candidati = pesoOrdinato(profiliConSecondo, pr => pesoFamiglia[famigliaDi[pr]] || 1, rng);
          if (!candidati.length) return null;
          return creaFrame(g, 'profiloGiorno', candidati, (pr) => assegnaProfiloGiorno(gi, pr));
        }
        if (st.profiloGiorno === undefined) st.profiloGiorno = profiloSettimana;

        const profiloGiorno = st.profiloGiorno;
        const paeseDaBloccati = st.bloccatiOggi?.length ? st.bloccatiOggi.map(b => b.piatto.paese).find(Boolean) : null;
        const paeseGiorno = paeseDaBloccati || (paesiScelti.length ? paesiScelti[(g - 1) % paesiScelti.length] : null);
        const genericoOggi = paeseGiorno ? GENERICO_DI[paeseGiorno] : null;
        // Gradino 3a: oltre al proprio generico, si accetta il pool generico
        // di un'altra macro-area SOLO se e' la stessa famiglia culinaria del
        // paese scelto (per la Germania: anche mediterraneo_generico, che e'
        // comunque Europa). Gradino 3b: qualunque macro-area (GENERICI
        // intero) - quello che prima era un unico gradino 3, ora il secondo
        // dei due (Fase 3 Passo C bis, C9).
        const famigliaOggi = genericoOggi ? FAMIGLIA_DI_GENERICO[genericoOggi] : null;
        const paeseOk = (p) => !paeseGiorno
          || p.paese === paeseGiorno
          || (genericoOggi && p.paese === genericoOggi)
          || (opz.genericoStessaFamiglia && famigliaOggi && FAMIGLIA_DI_GENERICO[p.paese] === famigliaOggi)
          || (opz.genericoQualunqueFamiglia && GENERICI.includes(p.paese));
        const paeseOkLeggero = (p) => paeseOk(p) || p.paese === 'mediterraneo_generico';
        // CORREZIONE (25 ottobre 2026, principio inviolabile): limiteFeriale
        // e' sempre il tempo reale dichiarato (vedi minutiCorretti sopra) -
        // nessun gradino lo allarga mai (tempoAllargato tolto, vedi GRADINI).
        // Il weekend (Math.max(..., 75)) resta un'assunzione di base del
        // prodotto, non un allentamento della scala.
        const limiteBase = ferialeG(g) ? limiteFeriale : Math.max(limiteFeriale, 75);
        const limiteOggi = limiteBase;
        // CORREZIONE (24 ottobre 2026, audit "piano_impossibile"): il primo
        // (e il suo contorno) e' a PRANZO, non a cena - usare lo stesso
        // tetto di evening_minutes (pensato per la cena, vedi il nome del
        // campo) lo strangolava: nel catalogo esiste UN SOLO primo sotto i
        // 15 minuti in tutto il mercato 'it' (una crema fredda), contro una
        // mediana reale di 30 minuti (bollire l'acqua richiede tempo fisico,
        // non e' un limite del catalogo). Nessuna scelta dichiarata
        // dall'utente esiste per il tempo del pranzo - LIMITE_PRANZO_MINIMO
        // e' un pavimento di prodotto, non preso dal profilo, cosi' un
        // tetto di cena stretto non si riversa piu' sul pranzo.
        const limiteBasePranzo = ferialeG(g) ? Math.max(limiteFeriale, LIMITE_PRANZO_MINIMO) : Math.max(limiteFeriale, 75);
        const cappaColazione = 15;
        const cappaSpuntino = 10;

        st.paeseGiorno = paeseGiorno;
        st.genericoOggi = genericoOggi;
        st.limiteBase = limiteBase;
        st.limiteBasePranzo = limiteBasePranzo;

        if (st.secondo === undefined && !cucinaOggi(g)) {
          for (let k = gi - 1; k >= 0; k--) {
            const s = statoGiorni[k];
            if (s.secondo && !s.secondoEAvanzo) { st.secondo = s.secondo; st.secondoEAvanzo = true; break; }
          }
        }

        if (st.secondo === undefined) {
          const candidati = candidatiSecondo(gi, profiloGiorno, paeseGiorno, genericoOggi, paeseOk, limiteOggi);
          if (!candidati.length) return null;
          return creaFrame(g, 'secondo', candidati, (p) => assegnaSecondoScelto(gi, p));
        }

        const pronti = [];
        if (st.primo === undefined) pronti.push(['primo', () => candidatiPrimo(gi, profiloGiorno, paeseGiorno, genericoOggi, paeseOk, limiteBasePranzo)]);
        if (st.contornoCena === undefined) pronti.push(['contornoCena', () => candidatiContorno(gi, 'cena', profiloGiorno, paeseGiorno, paeseOk, limiteOggi, st.secondo, st.contornoPranzo)]);
        if (st.primo !== undefined && st.contornoPranzo === undefined) pronti.push(['contornoPranzo', () => candidatiContorno(gi, 'pranzo', profiloGiorno, paeseGiorno, paeseOk, limiteBasePranzo, st.primo, st.contornoCena)]);
        if (st.colazione === undefined) pronti.push(['colazione', () => candidatiColazione(gi, profiloGiorno, paeseOkLeggero, cappaColazione)]);
        if (st.spuntino === undefined) pronti.push(['spuntino', () => candidatiSpuntino(gi, profiloGiorno, paeseOkLeggero, st.spuntino2, cappaSpuntino)]);
        if (st.spuntino2 === undefined) pronti.push(['spuntino2', () => candidatiSpuntino(gi, profiloGiorno, paeseOkLeggero, st.spuntino, cappaSpuntino)]);
        if (st.contornoCena !== undefined && st.base === undefined) {
          const cenaHaAmido = st.secondo.amidoReale || (st.contornoCena && st.contornoCena.amidoReale);
          if (!cenaHaAmido) pronti.push(['base', () => candidatiBase(gi, paeseOk, tipiAccompagnamentoDaSecondo(st.secondo))]);
          else st.base = null;
        }

        if (!pronti.length) return 'COMPLETO';

        let scelto = null;
        for (const [nomeSlot, calcola] of pronti) {
          const candidati = calcola();
          if (!candidati.length) return null;
          if (!scelto || candidati.length < scelto.candidati.length) scelto = { nomeSlot, candidati };
        }

        const applicaPerSlot = {
          primo: (p) => assegnaSlot(gi, 'primo', p),
          contornoCena: (p) => assegnaSlot(gi, 'contornoCena', p),
          contornoPranzo: (p) => assegnaSlot(gi, 'contornoPranzo', p),
          colazione: (p) => assegnaColazioneScelto(gi, p),
          spuntino: (p) => assegnaSpuntinoScelto(gi, 'spuntino', p),
          spuntino2: (p) => assegnaSpuntinoScelto(gi, 'spuntino2', p),
          base: (p) => assegnaBaseScelto(gi, p),
        };
        return creaFrame(g, scelto.nomeSlot, scelto.candidati, applicaPerSlot[scelto.nomeSlot]);
      }

      // 'tetto' e 'reale' sono due fallimenti diversi (C16): il primo dice
      // solo che la ricerca si e' arresa al limite di passi, non che lo
      // spazio sia stato esplorato per intero (la pila aveva ancora
      // candidati non provati); il secondo dice che la pila si e' svuotata
      // da sola, nessuna alternativa restava da tentare per questo profilo.
      // Tetto sale/saturi (gradino 2b): appena una giornata e' COMPLETA, si
      // valuta sui valori SCALATI (valutaGiornataScalata chiama adattaGiornata,
      // la stessa funzione che scala davvero cio' che l'utente riceve). Se
      // sfonda e il gradino non e' ancora tollerante, e' un vicolo cieco
      // come un altro: si torna indietro e si riprova un candidato diverso
      // per l'ultimo slot deciso di QUESTA giornata (stesso meccanismo di
      // 'decisione === null', non uno nuovo). Il risultato si salva su
      // statoGiorni[gi] cosi' il ciclo di ricostruzione dopo non ricalcola.
      // Ricostruisce dai valori salvati su statoGiorni[gi] lo stesso contesto
      // (profiloGiorno, paeseOk, le cappe tempo) che prossimaDecisione calcola
      // da zero per quel giorno - serve qui perche' gli aumenti di emergenza
      // (vedi sopra) si decidono DOPO che il giorno e' COMPLETO, fuori dallo
      // scope locale di prossimaDecisione.
      function contestoGiorno(gi) {
        const g = gi + 1;
        const st = statoGiorni[gi];
        const profiloGiorno = st.profiloGiorno;
        const paeseGiorno = st.paeseGiorno;
        const genericoOggi = st.genericoOggi;
        const famigliaOggi = genericoOggi ? FAMIGLIA_DI_GENERICO[genericoOggi] : null;
        const paeseOk = (p) => !paeseGiorno
          || p.paese === paeseGiorno
          || (genericoOggi && p.paese === genericoOggi)
          || (opz.genericoStessaFamiglia && famigliaOggi && FAMIGLIA_DI_GENERICO[p.paese] === famigliaOggi)
          || (opz.genericoQualunqueFamiglia && GENERICI.includes(p.paese));
        const paeseOkLeggero = (p) => paeseOk(p) || p.paese === 'mediterraneo_generico';
        // Stesso principio di sopra: tetti fissi, mai allargati da un gradino.
        const cappaColazione = 15;
        const cappaSpuntino = 10;
        return { g, profiloGiorno, paeseOk, paeseOkLeggero, cappaColazione, cappaSpuntino };
      }

      // Aumenti di emergenza, nell'ordine richiesto: pane a pranzo, terzo
      // spuntino, colazione piu' ricca. Si ferma al primo che chiude il
      // buco; ogni aumento e' un frame vero (pila.push+entraFrame), quindi
      // se la giornata viene poi scartata per un altro motivo il
      // backtracking lo annulla come qualunque altra scelta.
      function provaAumentoKcal(gi) {
        const st = statoGiorni[gi];
        const ctx = contestoGiorno(gi);
        const prova = (nomeSlot, candidati, applica) => {
          if (!candidati.length) return false;
          const frame = creaFrame(ctx.g, nomeSlot, candidati, applica);
          pila.push(frame);
          entraFrame(frame);
          return true;
        };
        const ancoraCorto = () => {
          const val = valutaGiornataScalata(pastiDi(gi), obiettivo, obiettivoProteine);
          return val && val.kcal < obiettivo && !val.kcalOk;
        };

        if (!ancoraCorto()) return;
        if (st.basePranzo === undefined) {
          const pranzoHaAmido = (st.primo && st.primo.amidoReale) || (st.contornoPranzo && st.contornoPranzo.amidoReale);
          if (!pranzoHaAmido) {
            const tipiRichiesti = tipiAccompagnamentoDaSecondo(st.secondo);
            prova('basePranzo', candidatiBasePranzo(gi, ctx.paeseOk, tipiRichiesti), (p) => assegnaBasePranzoScelto(gi, p));
          }
        }

        if (!ancoraCorto()) return;
        if (st.spuntino3 === undefined) {
          prova('spuntino3', candidatiSpuntino3(gi, ctx.profiloGiorno, ctx.paeseOkLeggero, ctx.cappaSpuntino), (p) => assegnaSpuntinoScelto(gi, 'spuntino3', p));
        }

        if (!ancoraCorto()) return;
        prova('colazionePiuRicca', candidatiColazionePiuRicca(gi, ctx.profiloGiorno, ctx.paeseOkLeggero, ctx.cappaColazione), (p) => assegnaColazionePiuRicca(gi, p));
      }

      // Densita' proteica (g proteina per kcal): il criterio richiesto per
      // preferire candidati "con piu' proteine per kcal", non solo piu'
      // proteina in assoluto - un piatto da 800 kcal con 40g di proteina
      // non e' piu' proteico di uno da 300 kcal con 25g, e' solo piu' grande.
      const densitaProteica = (p) => (p.protein || 0) / (p.kcal || 1);

      // Scambia il secondo attuale con uno piu' proteico per kcal, dallo
      // stesso pool di candidatiSecondo ma ordinato per densita' proteica
      // invece che per peso/salute - stesso principio di
      // candidatiColazionePiuRicca, applicato alla proteina invece che
      // alle kcal totali. Deve ancora abbinarsi bene col resto del pasto
      // (accompagnaBene contro contornoCena/base).
      function candidatiSecondoProteico(gi) {
        const st = statoGiorni[gi];
        const attuale = st.secondo;
        if (!attuale) return [];
        const altriDelPasto = [st.contornoCena, st.base].filter(Boolean);
        const candidati = secondi.filter(p =>
          p.id !== attuale.id && !usati.has(p.id) && !rifiutato(p) &&
          altriDelPasto.every(c => accompagnaBene(p, c)) &&
          principaleLiberoOggi(gi, p)
        );
        return candidati.slice().sort((a, b) => densitaProteica(b) - densitaProteica(a));
      }
      function assegnaSecondoProteico(gi, piatto) {
        const st = statoGiorni[gi];
        const precedente = st.secondo;
        usati.delete(precedente.id);
        if (precedente.gruppo) usoGruppi[precedente.gruppo]--;
        st.secondo = piatto;
        usati.add(piatto.id);
        if (piatto.gruppo) usoGruppi[piatto.gruppo] = (usoGruppi[piatto.gruppo] || 0) + 1;
        return () => {
          usati.delete(piatto.id);
          if (piatto.gruppo) usoGruppi[piatto.gruppo]--;
          st.secondo = precedente;
          usati.add(precedente.id);
          if (precedente.gruppo) usoGruppi[precedente.gruppo] = (usoGruppi[precedente.gruppo] || 0) + 1;
        };
      }

      // Stesso scambio per uno spuntino gia' scelto (spuntino, spuntino2 o
      // il terzo d'emergenza): negli spuntini la richiesta e' letterale,
      // "scegli prima quelli proteici".
      function candidatiSpuntinoProteico(gi, nomeSlot) {
        const st = statoGiorni[gi];
        const attuale = st[nomeSlot];
        if (!attuale) return [];
        const altri = [st.spuntino, st.spuntino2, st.spuntino3].filter(p => p && p.id !== attuale.id);
        const candidati = spuntini.filter(p =>
          p.id !== attuale.id && !usati.has(p.id) && !rifiutato(p) &&
          !altri.some(a => a.id === p.id) && principaleLiberoOggi(gi, p)
        );
        return candidati.slice().sort((a, b) => densitaProteica(b) - densitaProteica(a));
      }
      function assegnaSpuntinoProteico(gi, nomeSlot, piatto) {
        const st = statoGiorni[gi];
        const precedente = st[nomeSlot];
        usati.delete(precedente.id);
        st[nomeSlot] = piatto;
        usati.add(piatto.id);
        return () => { usati.delete(piatto.id); st[nomeSlot] = precedente; usati.add(precedente.id); };
      }

      // Ricerca delle proteine (problema 2 della terza correzione,
      // 2026-10-09): quando la giornata e' sotto il minimo proteico,
      // nell'ordine chiesto - secondo piu' proteico per kcal, spuntini piu'
      // proteici uno per uno, poi (se serve ancora scalare, non solo
      // scegliere diverso) lascia crescere il secondo fino a 1.5x stringendo
      // primo e pane/patate. Scambi veri (pila.push+entraFrame): annullati
      // dal backtracking come ogni altra scelta se la giornata viene poi
      // scartata per un altro motivo.
      function provaAumentoProteine(gi) {
        const st = statoGiorni[gi];
        const corto = () => {
          const val = valutaGiornataScalata(pastiDi(gi), obiettivo, obiettivoProteine);
          return val && !val.proteinOk;
        };
        const prova = (nomeSlot, candidati, applica) => {
          if (!candidati.length) return false;
          const frame = creaFrame(gi + 1, nomeSlot, candidati, applica);
          pila.push(frame);
          entraFrame(frame);
          return true;
        };

        if (!corto()) return;
        prova('secondoProteico', candidatiSecondoProteico(gi), (p) => assegnaSecondoProteico(gi, p));

        for (const nomeSlot of ['spuntino', 'spuntino2', 'spuntino3']) {
          if (!corto()) return;
          if (!st[nomeSlot]) continue;
          prova('proteico_' + nomeSlot, candidatiSpuntinoProteico(gi, nomeSlot), (p) => assegnaSpuntinoProteico(gi, nomeSlot, p));
        }

        if (!corto()) return;
        giorniCercaProteine.add(gi);
      }

      function avanzaFinDove(giIniziale) {
        let gi = giIniziale;
        while (gi < 7) {
          if (passiUsati.valore > MAX_PASSI) return { esaurito: true, motivo: 'tetto' };
          if (Date.now() > scadenza) return { esaurito: true, motivo: 'tempo' };
          const decisione = prossimaDecisione(gi);
          if (decisione === 'COMPLETO') {
            const st = statoGiorni[gi];
            if (obiettivo) {
              provaAumentoKcal(gi);
              provaAumentoProteine(gi);
              const val = valutaGiornataScalata(pastiDi(gi), obiettivo, obiettivoProteine);
              // Il tetto sale/saturi resta allentabile dal gradino 2b
              // (tettoTollerante); kcal non lo e' mai, a nessun gradino. Le
              // proteine restano un vincolo vero fino al penultimo gradino -
              // solo l'ultimo (proteinaTollerante, "nessuno senza piano")
              // le allenta, e solo dopo che provaAumentoProteine ha gia'
              // provato a massimizzarle.
              if (val && ((!val.tettoOk && !opz.tettoTollerante) || !val.kcalOk || (!val.proteinOk && !opz.proteinaTollerante))) {
                const tornaA = indietro();
                if (tornaA < 0) return { esaurito: true, motivo: 'reale' };
                gi = tornaA;
                continue;
              }
              st.valutazioneNutrienti = val;
            }
            gi++; continue;
          }
          if (decisione === null) {
            const tornaA = indietro();
            if (tornaA < 0) return { esaurito: true, motivo: 'reale' };
            gi = tornaA;
            continue;
          }
          pila.push(decisione);
          entraFrame(decisione);
        }
        return { esaurito: false };
      }

      const primoTentativo = avanzaFinDove(0);
      if (primoTentativo.esaurito) {
        diagnosticaProfili.push(`${profiloSettimana}: ${descrizioneMotivoEsaurimento(primoTentativo.motivo)} (passi: ${passiUsati.valore})`);
        continue profiliEsterni;
      }

      // Prima del gradino 2: le quote minime sui gruppi proteici restano un
      // vincolo duro verificato a fine settimana (dipende da tutti i giorni
      // insieme), e un vicolo cieco come un altro innesca backtracking. Dal
      // gradino 2 in su si accetta il risultato comunque: lo scostamento
      // viene registrato come concessione, non forzato a sparire.
      if (!opz.quotaTollerante) {
        while (true) {
          let quoteRispettate = true;
          for (const [gruppo, q] of Object.entries(QUOTE)) {
            if (!gruppiUnioneSettimana.has(gruppo)) continue;
            if ((usoGruppi[gruppo] || 0) < q.min) { quoteRispettate = false; break; }
          }
          if (quoteRispettate) break;

          const tornaA = indietro();
          if (tornaA < 0) { diagnosticaProfili.push(`${profiloSettimana}: quote proteiche mai soddisfatte (esaurimento reale)`); continue profiliEsterni; }
          const ripreso = avanzaFinDove(tornaA);
          if (ripreso.esaurito) {
            diagnosticaProfili.push(`${profiloSettimana}: ${descrizioneMotivoEsaurimento(ripreso.motivo)} durante la ricerca quote (passi: ${passiUsati.valore})`);
            continue profiliEsterni;
          }
        }
      }

      // ---- Successo a questo gradino: ricostruisce la settimana e rileva le concessioni usate ----
      const settimana = [];
      const concessioni = [];

      for (let k = 0; k < 7; k++) {
        const g = k + 1;
        const st = statoGiorni[k];
        const pasti = pastiDi(k);

        // Riusa la valutazione gia' fatta DURANTE la ricerca (vedi
        // avanzaFinDove) quando c'e'; la ricalcola solo se manca (giornata
        // senza obiettivo kcal - nessun utente ha ancora un energy_target,
        // capita per esempio ai profili appena creati). Una giornata con
        // piatti bloccati arriva qui come ogni altra (vedi il pre-assegnamento
        // in provaGradino): sale e saturi restano un vincolo vero anche per
        // lei, valutato sugli stessi valori scalati. Se e' arrivata fin qui
        // con tettoOk=false, il gradino corrente ha tettoTollerante=true
        // (altrimenti avanzaFinDove l'avrebbe scartata, vedi il gate li') - va
        // registrato come concessione, non come piatto rotto. La fibra non
        // blocca mai: solo concessione.
        const val = st.valutazioneNutrienti || valutaGiornataScalata(pasti, obiettivo, obiettivoProteine);
        const conforme = val ? (val.tettoOk && val.fibraOk && val.kcalOk && val.proteinOk) : true;

        if (val && !val.tettoOk) {
          concessioni.push({
            gradino: '2b', tipo: 'allentamento', giorno: g, slot: null, vincolo: 'tetto_sale_saturi',
            prima: `sale<=${val.saleMax} saturi<=${val.satMax.toFixed(1)}`,
            dopo: `sale=${val.sale.toFixed(2)} saturi=${val.saturi.toFixed(2)}`,
          });
        }
        if (val && !val.kcalOk) {
          concessioni.push({
            gradino: null, tipo: 'vincolo_non_soddisfatto', giorno: g, slot: null, vincolo: 'kcal_fabbisogno',
            prima: `${obiettivo} ±10%`, dopo: Math.round(val.kcal),
          });
        }
        if (val && !val.proteinOk) {
          concessioni.push({
            gradino: null, tipo: 'vincolo_non_soddisfatto', giorno: g, slot: null, vincolo: 'proteine_minime',
            prima: `>=${val.proteinMin.toFixed(1)}`, dopo: val.proteine.toFixed(1),
          });
        }
        if (val && !val.fibraOk) {
          concessioni.push({
            gradino: null, tipo: 'pavimento_mancato', giorno: g, slot: null, vincolo: 'fibra_minima',
            prima: val.fibraMin.toFixed(1), dopo: val.fibra.toFixed(1),
          });
        }

        // Gradino 4b: se ci si e' arrivati, la settimana puo' contenere un
        // alimento sgradito - va dichiarato, non lasciato in silenzio dentro
        // un piatto altrimenti conforme.
        if (opz.preferenzeTolleranti) {
          for (const pasto of pasti) {
            for (const ing of (pasto.piatto.ingredienti || [])) {
              if (foodIdSgraditi.has(ing.food_id)) {
                concessioni.push({
                  gradino: '4b', tipo: 'allentamento', giorno: g, slot: pasto.slot,
                  vincolo: 'preferenza_non_gradita', prima: ing.nome, dopo: pasto.piatto.name,
                  food_id: ing.food_id, dish_id: pasto.piatto.id,
                });
              }
            }
          }
        }

        settimana.push({ giorno: g, profilo: st.profiloGiorno, pasti, conforme });

        // F2, seconda regola (corretta il 2026-09-12: era scritta a livello
        // di PASTO, ma la giornata ha il pranzo su due soli slot - primo e
        // contorno - quindi "pasta e verdure" veniva bocciato a torto, non
        // e' un pasto incompleto, e' la struttura normale del pranzo). La
        // completezza si misura sulla GIORNATA intera, non sul singolo
        // pasto: fra tutti i piatti del giorno insieme deve comparire
        // proteina_principale, base_amidacea e verdura. Registrata come
        // concessione, non come vincolo duro: imporla in backtracking
        // scarterebbe scelte gia' fatte altrove nel giorno, impatto sulla
        // capienza da misurare con F5 prima di irrigidirla.
        {
          const RUOLI_GIORNATA_COMPLETA = ['proteina_principale', 'base_amidacea', 'verdura'];
          const copertiOggi = new Set(pasti.flatMap(p => (p.piatto && p.piatto.ruoli_coperti) || []));
          const mancantiOggi = RUOLI_GIORNATA_COMPLETA.filter(r => !copertiOggi.has(r));
          if (mancantiOggi.length) {
            concessioni.push({
              gradino: null, tipo: 'giornata_incompleta', giorno: g, slot: null,
              vincolo: 'ruoli_giornata', prima: RUOLI_GIORNATA_COMPLETA.join('+'), dopo: `mancano: ${mancantiOggi.join(', ')}`,
            });
          }
        }

        // C5: deviazione dalla sequenza proteica pianificata - sempre
        // registrata, a qualunque gradino, perche' non e' un allentamento
        // della scala, e' un segnale di quanto il catalogo sia magro li'.
        if (st.secondo && !st.secondoEAvanzo && !st.secondoERipetizione) {
          const gruppoRichiesto = sequenza[k];
          if (gruppoRichiesto && st.secondo.gruppo !== gruppoRichiesto) {
            concessioni.push({ gradino: null, tipo: 'deviazione_sequenza', giorno: g, slot: 'secondo', vincolo: 'gruppo_proteico_pianificato', prima: gruppoRichiesto, dopo: st.secondo.gruppo || null });
          }
        }

        // Gradino 1: ripetizione del secondo.
        if (st.secondoERipetizione) {
          concessioni.push({ gradino: '1', tipo: 'allentamento', giorno: g, slot: 'secondo', vincolo: 'ripetizione_piatto', prima: 'nessuna ripetizione', dopo: st.secondo.name || st.secondo.id });
        }

        // Gradino 3a: pool generico di un'altra famiglia culinaria ma STESSA
        // macro-area (es. Germania -> mediterraneo_generico, ancora Europa).
        // Gradino 3b: davvero un'altra macro-area (es. Germania -> asiatico).
        for (const [slot, piatto] of [['secondo', st.secondo], ['primo', st.primo], ['contornoCena', st.contornoCena], ['contornoPranzo', st.contornoPranzo]]) {
          if (!piatto || (slot === 'secondo' && (st.secondoEAvanzo || st.secondoERipetizione))) continue;
          if (st.paeseGiorno && piatto.paese !== st.paeseGiorno && piatto.paese !== st.genericoOggi && GENERICI.includes(piatto.paese)) {
            const famigliaPropria = st.genericoOggi ? FAMIGLIA_DI_GENERICO[st.genericoOggi] : null;
            const stessaFamiglia = famigliaPropria && FAMIGLIA_DI_GENERICO[piatto.paese] === famigliaPropria;
            concessioni.push({
              gradino: stessaFamiglia ? '3a' : '3b',
              tipo: 'allentamento', giorno: g, slot,
              vincolo: stessaFamiglia ? 'pool_generico_stessa_famiglia' : 'pool_generico_famiglia_diversa',
              prima: st.genericoOggi, dopo: piatto.paese,
            });
          }
        }

        // Gradino 4: tetto dei minuti allentato. primo/contornoPranzo contro
        // il loro proprio tetto (limiteBasePranzo), non quello della cena.
        for (const [slot, piatto, cappa] of [
          ['secondo', st.secondo, st.limiteBase], ['primo', st.primo, st.limiteBasePranzo],
          ['contornoCena', st.contornoCena, st.limiteBase], ['contornoPranzo', st.contornoPranzo, st.limiteBasePranzo],
          ['colazione', st.colazione, 15], ['spuntino', st.spuntino, 10], ['spuntino2', st.spuntino2, 10],
        ]) {
          if (!piatto || (slot === 'secondo' && (st.secondoEAvanzo || st.secondoERipetizione))) continue;
          const minuti = piatto.prep_min || 0;
          if (minuti > cappa) {
            concessioni.push({ gradino: '4', tipo: 'allentamento', giorno: g, slot, vincolo: 'tetto_minuti', prima: cappa, dopo: minuti });
          }
        }

        // Gradino 5: voto salute sotto la soglia obiettivo di 7.
        for (const [slot, piatto] of Object.entries({ secondo: st.secondo, primo: st.primo, contornoCena: st.contornoCena, contornoPranzo: st.contornoPranzo, colazione: st.colazione, spuntino: st.spuntino, spuntino2: st.spuntino2, spuntino3: st.spuntino3, base: st.base, basePranzo: st.basePranzo })) {
          if (!piatto) continue;
          const voto = piatto.health_score;
          if (voto != null && voto < 7) {
            concessioni.push({ gradino: '5', tipo: 'allentamento', giorno: g, slot, vincolo: 'voto_salute_minimo', prima: 7, dopo: voto });
          }
        }
      }

      // Gradino 2: quote minime non raggiunte (una riga per gruppo, non per giorno).
      for (const [gruppo, q] of Object.entries(QUOTE)) {
        if (!gruppiUnioneSettimana.has(gruppo)) continue;
        const ottenuto = usoGruppi[gruppo] || 0;
        if (ottenuto < q.min) {
          concessioni.push({ gradino: '2', tipo: 'allentamento', giorno: null, slot: null, vincolo: 'quota_minima_gruppo_proteico', prima: q.min, dopo: ottenuto, gruppo });
        } else if (ottenuto > q.max) {
          concessioni.push({ gradino: null, tipo: 'sforamento_tetto', giorno: null, slot: null, vincolo: 'quota_massima_gruppo_proteico', prima: q.max, dopo: ottenuto, gruppo });
        }
      }

      const conPasti = settimana.filter(g => g.pasti.length > 0);
      const conformi = conPasti.filter(g => g.conforme).length;
      const completezza = conPasti.length
        ? conPasti.reduce((s, g) => s + g.pasti.length, 0) / (conPasti.length * 6)
        : 1;
      const mediaSalute = conPasti.length
        ? conPasti.reduce((s, g) =>
            s + g.pasti.reduce((a, p) => a + (p.piatto.health_score || 0), 0) / g.pasti.length, 0) / conPasti.length
        : 0;
      const punteggio = conformi + completezza * 2 + mediaSalute * 0.5;

      return { ok: true, settimana, punteggio, concessioni, mediaSalute, usoGruppi };
    }

    return { ok: false, diagnosticaProfili };
  }

  // Tetto di TEMPO sulla ricerca (24 ottobre 2026, indagine velocita' in
  // produzione: la scala provava tutti i gradini da 0 a 5 per intero prima
  // di arrendersi, anche quando il tempo per profilo+gradino era gia'
  // lunghissimo su un server piu' lento - misurato 20-35s su Render per un
  // profilo che in locale impiega 1-2s, stesso numero di passi). Non e' un
  // allentamento di regola: e' un secondo tetto, oltre a quello dei passi
  // (MAX_PASSI, dentro provaGradino), sullo STESSO punto di controllo
  // (avanzaFinDove) - un tentativo che lo supera si considera esaurito
  // esattamente come se avesse esaurito i passi.
  //
  // CORREZIONE URGENTE (25 ottobre 2026): la prima versione applicava il
  // tetto di tempo a TUTTI i gradini, compreso l'ultimo - quello che la
  // scala stessa commenta come "nessuno senza piano" (vedi sopra, GRADINI).
  // In produzione questo ha fatto FALLIRE profili che prima ricevevano
  // sempre un piano (misurato: l'account di test con cena in 20 minuti,
  // da gradino 5 riuscito in 51-59s a errore in 5s). Un errore e' peggio
  // di un'attesa: ora il tetto di tempo vale solo per i gradini PRIMA
  // dell'ultimo (gradiniConTetto sotto) - se il tempo scade durante uno di
  // questi, si salta DIRETTAMENTE all'ultimo gradino (gradinoFinale),
  // tentato SENZA alcun tetto di tempo, solo col tetto dei passi di
  // sempre (MAX_PASSI) - esattamente il comportamento di prima di ieri per
  // quel gradino. Risultato: profili facili restano veloci (risolti ai
  // primi gradini, dentro il tempo massimo); profili difficili restano
  // lenti come sempre, ma ricevono sempre un piano - mai un errore che
  // prima non c'era.
  const scadenzaRicerca = Date.now() + (opzioni.tempoMassimoMs ?? 4000);
  const gradiniConTetto = GRADINI.slice(0, -1);
  const gradinoFinale = GRADINI[GRADINI.length - 1];

  let esito = null;
  let gradinoRaggiunto = null;
  const diagnosticaCompleta = [];

  for (const passo of gradiniConTetto) {
    if (Date.now() > scadenzaRicerca) {
      console.log(`[scala] tempo massimo di ricerca raggiunto prima del gradino ${passo.gradino}: si salta direttamente all'ultimo gradino (${gradinoFinale.gradino}), senza tetto di tempo`);
      diagnosticaCompleta.push(`gradino ${passo.gradino} (soglia ${passo.soglia}): non tentato, tempo massimo di ricerca raggiunto`);
      break;
    }
    const r = provaGradino(passo.opz, passo.soglia, scadenzaRicerca);
    if (r.ok) {
      console.log(`[scala] gradino ${passo.gradino} (soglia ${passo.soglia}): RIUSCITO`);
      esito = r; gradinoRaggiunto = passo.gradino; break;
    }
    console.log(`[scala] gradino ${passo.gradino} (soglia ${passo.soglia}): esaurito per tutti i profili - ${r.diagnosticaProfili.join(' | ') || 'nessun profilo'}`);
    diagnosticaCompleta.push(`gradino ${passo.gradino} (soglia ${passo.soglia}): ${r.diagnosticaProfili.join(', ') || 'nessun profilo'}`);
  }

  // L'ultimo gradino, sempre - mai col tetto di tempo (vedi sopra): e' la
  // garanzia che nessun profilo resti senza piano solo perche' il tempo e'
  // scaduto prima di arrivarci.
  if (!esito) {
    const r = provaGradino(gradinoFinale.opz, gradinoFinale.soglia, Infinity);
    if (r.ok) {
      console.log(`[scala] ultimo gradino ${gradinoFinale.gradino} (soglia ${gradinoFinale.soglia}, senza tetto di tempo): RIUSCITO`);
      esito = r; gradinoRaggiunto = gradinoFinale.gradino;
    } else {
      console.log(`[scala] ultimo gradino ${gradinoFinale.gradino} (soglia ${gradinoFinale.soglia}, senza tetto di tempo): esaurito per tutti i profili - ${r.diagnosticaProfili.join(' | ') || 'nessun profilo'}`);
      diagnosticaCompleta.push(`gradino ${gradinoFinale.gradino} (soglia ${gradinoFinale.soglia}): ${r.diagnosticaProfili.join(', ') || 'nessun profilo'}`);
    }
  }

  if (!esito) {
    // DIAGNOSI STRUTTURATA (25 ottobre 2026, principio inviolabile - punto
    // A4): nessun piano trovato nemmeno all'ultimo gradino, senza aver mai
    // violato una scelta dell'utente (dieta, allergie, tempo...). Non e' un
    // errore generico ne' un piano scorretto: e' una risposta riconoscibile
    // (errore: 'piano_impossibile') con quale scelta blocca, quanti piatti
    // sarebbero compatibili e quale modifica minima lo sbloccherebbe -
    // l'interfaccia che la mostra all'utente si disegna altrove, qui si
    // prepara solo il dato. RETURN, non throw: chi chiama (server.js) deve
    // controllare piano.errore prima di trattare il risultato come un piano.

    // Caso piu' netto (residuo ammesso da C4): NESSUN secondo compatibile
    // con dieta/allergie esiste per il paese scelto, a prescindere dal
    // tempo - il catalogo manca del tutto per questa combinazione.
    const paeseUnico = paesiScelti[0] || null;
    const genericoUnico = paeseUnico ? GENERICO_DI[paeseUnico] : null;
    const nessunSecondoPerPaese = paeseUnico
      ? !piatti.some(p => p.meal_slot === 'secondo' && (p.paese === paeseUnico || p.paese === genericoUnico))
      : false;
    if (nessunSecondoPerPaese) {
      return {
        errore: 'piano_impossibile',
        vincolo_bloccante: 'paese',
        dettaglio: `Nessun secondo compatibile con la dieta dichiarata e' disponibile per ${paeseUnico} (o il suo generico ${genericoUnico}). Manca il catalogo per questa combinazione.`,
        piatti_compatibili: 0,
        suggerimento: null,
      };
    }

    // Sospetto piu' comune (vedi l'audit del 24 ottobre sulla matrice
    // allargata): troppo pochi secondi delle cucine scelte rientrano nel
    // tempo REALE dichiarato (limiteFeriale, mai allargato). Stessa soglia
    // (8) che il resto del codice usa per giudicare un profilo "abbastanza
    // ricco" (vedi limiteEfficace/gruppiPerProfiloDa sopra) - qui SOLO per
    // diagnosticare il messaggio, mai per cambiare la ricerca vera.
    const secondiRilevanti = piatti.filter(p => p.meal_slot === 'secondo' && (p.profilo === 'neutro' || famiglie.includes(p.famiglia)));
    const entroTempo = secondiRilevanti.filter(p => (p.prep_min || 30) <= limiteFeriale && (p.tecnica || 'semplice') === 'semplice');
    if (entroTempo.length < 8) {
      const profiliRilevanti = [...new Set(secondiRilevanti.map((p) => p.profilo))];
      const { limite: limiteSuggerito } = limiteEfficace(secondiRilevanti, profiliRilevanti, limiteFeriale, 8);
      return {
        errore: 'piano_impossibile',
        vincolo_bloccante: 'tempo_cena',
        dettaglio: `Con ${limiteFeriale} minuti per la cena, solo ${entroTempo.length} secondi sono disponibili per le cucine scelte - non bastano per completare una settimana rispettando dieta e allergie.`,
        tempo_dichiarato_min: limiteFeriale,
        piatti_compatibili: entroTempo.length,
        suggerimento: limiteSuggerito > limiteFeriale
          ? { tempo_cena_min: limiteSuggerito, testo: `Cena in ${limiteSuggerito} minuti invece di ${limiteFeriale}` }
          : null,
      };
    }

    // Stesso sospetto sul PRIMO (pranzo, non cena - vedi LIMITE_PRANZO_MINIMO
    // sopra): il primo ha una mediana reale di 30 minuti nel catalogo
    // (bollire l'acqua e' un tempo fisico), quindi anche col pavimento di
    // prodotto possono restare pochi primi compatibili. Solo se il pranzo a
    // casa serve almeno un giorno - altrimenti il primo non e' mai pianificato.
    const serveMaiIlPrimo = [1, 2, 3, 4, 5, 6, 7].some((g) => !pranzoFuoriIl(g));
    if (serveMaiIlPrimo) {
      const limiteFerialePranzoDiagnostico = Math.max(limiteFeriale, LIMITE_PRANZO_MINIMO);
      const primiRilevanti = piatti.filter((p) => p.meal_slot === 'primo' && (p.profilo === 'neutro' || famiglie.includes(p.famiglia)));
      const primiEntroTempo = primiRilevanti.filter((p) => (p.prep_min || 30) <= limiteFerialePranzoDiagnostico && (p.tecnica || 'semplice') === 'semplice');
      if (primiEntroTempo.length < 3) {
        const profiliRilevantiPrimo = [...new Set(primiRilevanti.map((p) => p.profilo))];
        const { limite: limiteSuggeritoPrimo } = limiteEfficace(primiRilevanti, profiliRilevantiPrimo, limiteFerialePranzoDiagnostico, 3);
        return {
          errore: 'piano_impossibile',
          vincolo_bloccante: 'tempo_pranzo',
          dettaglio: `Con ${limiteFerialePranzoDiagnostico} minuti per il primo a pranzo, solo ${primiEntroTempo.length} primi sono disponibili per le cucine scelte - non bastano per completare una settimana.`,
          tempo_dichiarato_min: limiteFerialePranzoDiagnostico,
          piatti_compatibili: primiEntroTempo.length,
          suggerimento: limiteSuggeritoPrimo > limiteFerialePranzoDiagnostico
            ? { tempo_pranzo_min: limiteSuggeritoPrimo, testo: `Primo a pranzo con ${limiteSuggeritoPrimo} minuti invece di ${limiteFerialePranzoDiagnostico}` }
            : null,
        };
      }
    }

    // Nessuna causa specifica identificata: resta la diagnosi completa
    // gradino per gradino, nello stesso campo di sempre.
    return {
      errore: 'piano_impossibile',
      vincolo_bloccante: 'non_identificato',
      dettaglio: `Nessuna settimana completabile nonostante la scala di allentamento fino al gradino ${gradinoFinale.gradino}, rispettando sempre dieta, allergie, tempo e le altre scelte dichiarate.`,
      diagnostica: diagnosticaCompleta,
      piatti_compatibili: null,
      suggerimento: null,
    };
  }

  const { settimana: migliore, punteggio: migliorPunteggio, concessioni, usoGruppi } = esito;

  // target/obiettivo letti all'inizio della funzione, non qui: vedi sopra.

  // 'piano' dichiarata qui (non con const dentro l'if) apposta: deve restare
  // visibile al return finale anche quando salva=true, e un const dentro il
  // blocco sarebbe uscito di scope li' (verificato: senza questo, il ramo
  // salva=true lancia "piano is not defined", non solo quello salva=false).
  let piano = null;
  if (salva) {
    const { data: pianoInserito, error: errPiano } = await supabase
      .from('plans')
      .insert({
        user_id: userId,
        week_start: lunediCorrente(),
        giorno_gratis: giornoSettimanaCorrente(),
        generated_at: new Date().toISOString(),
        energy_target_id: target?.id ?? null,
        corpus_version: CORPUS_VERSION,
        seed,
        gradino_raggiunto: gradinoRaggiunto,
        concessioni,
        dieta,
        paesi: paesiScelti,
      })
      .select('id')
      .single();
    if (errPiano) throw new Error(`Creazione piano fallita: ${errPiano.message}`);
    piano = pianoInserito;

    const righe = [];
    for (const g of migliore) {
      // Ogni giornata, bloccata o no, passa per la stessa adattaGiornata:
      // le porzioni dei piatti bloccati possono essere riscalate come
      // quelle di chiunque altro, solo il piatto stesso resta fisso (vedi
      // il pre-assegnamento in provaGradino, piu' sopra).
      const adattati = obiettivo ? adattaGiornata(g.pasti, obiettivo) : g.pasti.map(p => ({ p, f: 1 }));
      for (const x of adattati) {
        const p = x.p, f = x.f;
        righe.push({
          plan_id: piano.id,
          day_of_week: g.giorno,
          meal: p.meal,
          slot: p.slot,
          dish_id: p.piatto.id,
          portion_g: Math.round(p.piatto.grams * f),
          kcal: Math.round(p.piatto.kcal * f),
          protein_g: Number((p.piatto.protein * f).toFixed(1)),
          sat_fat_g: Number((p.piatto.satFat * f).toFixed(1)),
          fibre_g: Number((p.piatto.fibre * f).toFixed(1)),
          salt_g: Number((p.piatto.salt * f).toFixed(2)),
          avanzi: Boolean(p.avanzi),
          bloccato: Boolean(p.bloccato),
        });
      }
    }

    const { error: errItems } = await supabase.from('plan_items').insert(righe);
    if (errItems) {
      await supabase.from('plans').delete().eq('id', piano.id);
      throw new Error(`Inserimento pasti fallito: ${errItems.message}`);
    }
  }

  _scattaMemoria('fine generazione (ricerca completata)');

  return {
    plan_id: salva ? piano.id : null, giorni_conformi: Math.floor(migliorPunteggio), seed,
    gradino: gradinoRaggiunto, concessioni, uso_gruppi: { ...usoGruppi },
    dish_ids: esito.settimana.flatMap((g) => g.pasti.map((x) => x.piatto.id)),
    // Piatti bloccati che non sono entrati nel piano perche' non piu'
    // ammessi da dieta/allergie (es. aggiunte dopo averli bloccati) - l'app
    // li mostra come "N locked dish(es) no longer fit your profile".
    piatti_bloccati_scartati: piattiBloccatiScartati,
    // MISURAZIONE TEMPORANEA: vedi sopra. undefined quando non richiesto.
    _memoria: _misuraMemoria ? _memoria : undefined,
  };
}

module.exports = {
  generaESalva, caricaPiatti, caricaPiattiPerId, gruppoDa, gruppoDaRegex, ancoraProteica, GRUPPO_DA_CATEGORIA,
  GRUPPI, QUOTE, trovaCategoria, normalizza, CONTENUTE_IN,
  CATEGORIE_DIETA, foodIdVietatiPerDieta, gruppiPerProfiloDa, analizzaCapienza, GRADINI,
  GENERICO_DI, GENERICI, FAMIGLIA_DI_GENERICO, FAMIGLIE_PER_CUCINA, caricaVincoli,
  caricaEsiti, SOGLIA_RIFIUTO, giornoSettimanaCorrente,
  risolviSubject, caricaCatalogoPerRisoluzione, MERCATO_ATTIVO,
  accompagnaBene, sostitutoSenzaGlutineNonRichiesto, CATEGORIA_ALLERGENE,
};
