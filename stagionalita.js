// Calendario di stagionalità per la frutta e verdura fresca dell'app.
// Fonte: nessun corpus esisteva nel progetto (verificato con grep su tutto
// il backend) - questa è una tabella costruita a mano dai calendari di
// stagionalità italiani più comuni (centro Italia, clima temperato), un
// mese per voce = "si trova fresco e locale in quel mese". Non varia per
// macro-zona: 'zona' è accettato per compatibilità futura ma oggi il
// calcolo è lo stesso ovunque, perché region_zone è popolato per 2 utenti
// su 59 e non ha alcuna UI che lo raccolga - una tabella per zona sarebbe
// invisibile nella pratica.
//
// Avocado/banana/mango/ananas sono voci fresche reali della lista ma non
// si coltivano in Italia: restano nella tabella con mese [] (sempre fuori
// stagione), non vengono escluse, cosi' il conteggio "N di M fresche" resta
// onesto invece di far sparire la voce dal denominatore.
//
// Esclusi del tutto (non sono prodotto fresco nonostante il reparto
// Produce): albicocche secche, succo d'arancia, orzo perlato, farro
// perlato - non hanno una stagione, sono trasformati/secchi.
const STAGIONE = {
  mela_it: [1, 2, 3, 9, 10, 11, 12],
  albicocche_it: [6, 7, 8],
  '169205': [10, 11, 12, 1, 2, 3, 4], // Artichokes
  rucola_it: [3, 4, 5, 9, 10, 11],
  asparagi_it: [3, 4, 5, 6],
  avocado_it: [],
  banana_it: [],
  '170379': [10, 11, 12, 1, 2, 3], // Broccoli
  '169975': [10, 11, 12, 1, 2, 3], // Cabbage
  '170393': [5, 6, 7, 8, 9, 10, 11], // Carrots
  sedano_it: [9, 10, 11, 12, 1, 2],
  cetrioli_it: [5, 6, 7, 8, 9],
  '169230': [5, 6, 7], // Garlic
  pompelmo_it: [11, 12, 1, 2, 3],
  uva_it: [8, 9, 10],
  topinambur_it: [10, 11, 12, 1, 2, 3],
  kiwi_it: [10, 11, 12, 1, 2, 3, 4, 5],
  porri_it: [10, 11, 12, 1, 2, 3],
  limone_it: [10, 11, 12, 1, 2, 3, 4],
  mango_it: [],
  melone_it: [6, 7, 8],
  funghi_champignon_it: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // coltivati, non stagionali
  '168434': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Mushrooms, cremini - coltivati
  arancia_it: [11, 12, 1, 2, 3, 4],
  prezzemolo_it: [1, 2, 3, 4, 5, 9, 10, 11, 12],
  pastinaca_it: [10, 11, 12, 1, 2, 3],
  pesche_it: [6, 7, 8, 9],
  pera_it: [8, 9, 10, 11, 12, 1],
  ananas_it: [],
  funghi_porcini_it: [9, 10, 11],
  '170028': [6, 7, 8, 9, 10, 11, 12, 1], // Potatoes
  '168448': [9, 10, 11, 12], // Pumpkin
  radicchio_it: [10, 11, 12, 1, 2],
  cavolo_verza_it: [10, 11, 12, 1, 2, 3],
  scalogno_it: [6, 7, 8],
  spinaci_it: [10, 11, 12, 1, 2, 3, 4],
  '170457': [6, 7, 8, 9], // Tomatoes
  rape_it: [10, 11, 12, 1, 2, 3],
  anguria_it: [6, 7, 8],
  peperone_giallo_it: [6, 7, 8, 9],
  '169291': [5, 6, 7, 8, 9], // Zucchini

  // Seconda passata: queste voci non emergevano dal nome (classificate
  // "Produce" solo dal campo foods.reparto in DB, non dalla regex di
  // repartoDi) - trovate confrontando repartoDi() col campo reparto reale,
  // altrimenti sarebbero rimaste fuori dal calendario senza una ragione.
  barbabietole_it: [6, 7, 8, 9, 10, 11], // Beetroots
  more_it: [7, 8, 9], // Blackberries
  mirtilli_it: [6, 7, 8, 9], // Blueberries
  ciliegie_it: [5, 6, 7], // Cherries
  cicoria_it: [10, 11, 12, 1, 2, 3], // Chicory
  clementine_it: [11, 12, 1, 2], // Clementines
  '170000': [7, 8, 9], // Corn
  valeriana_it: [10, 11, 12, 1, 2, 3], // Corn salad
  scarola_it: [10, 11, 12, 1, 2, 3], // Escarole
  finocchi_it: [10, 11, 12, 1, 2, 3], // Fennel
  erba_cipollina_it: [4, 5, 6, 7, 8, 9], // Fresh chives
  cocco_it: [], // Fresh coconut - non si coltiva in Italia
  '170419': [4, 5, 6], // Green peas
  cavolo_rapa_it: [10, 11, 12, 1, 2, 3], // Kohlrabi
  cachi_it: [10, 11, 12], // Persimmon
  melagrana_it: [10, 11, 12], // Pomegranate
  lamponi_it: [6, 7, 8, 9], // Raspberries
  taccole_it: [4, 5, 6], // Snow peas
  germogli_soia_it: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // germogliati, non stagionali
  fragole_it: [4, 5, 6], // Strawberries
  crescione_it: [3, 4, 5, 9, 10, 11], // Watercress
};

const MESI_NOME = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Dato l'elenco di voci della lista (food_id + nome), quante sono fresche
// (= presenti nella tabella sopra) e di quelle quante sono di stagione nel
// mese dato. 'zona' non cambia oggi il risultato (vedi nota in testa).
function vociInStagione(voci, mese, zona) {
  const fresche = voci.filter(v => STAGIONE[v.food_id] !== undefined);
  if (!fresche.length) return null;

  const elenco = fresche.map(v => ({
    nome: v.nome,
    di_stagione: STAGIONE[v.food_id].includes(mese),
  }));

  return {
    mese: MESI_NOME[mese - 1],
    zona: zona || 'centro',
    zona_dedotta: !zona,
    di_stagione: elenco.filter(v => v.di_stagione).length,
    totale_fresche: elenco.length,
    voci: elenco,
  };
}

module.exports = { STAGIONE, vociInStagione };
