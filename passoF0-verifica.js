// Passo F0: controllo di capienza per aritmetica, su tutte le combinazioni
// dieta + paese/i, SENZA generare nessun piano.
//
// Chiama esattamente le funzioni che generaESalva usa davvero (caricaPiatti,
// foodIdVietatiPerDieta, gruppiPerProfiloDa, analizzaCapienza, la scala
// GRADINI) - non una loro reimplementazione - cosi' il risultato descrive il
// generatore reale, non un modello approssimato di esso.
//
// Ipotesi assunte (le piu' favorevoli, per non urlare "impossibile" quando
// dipenderebbe solo dal profilo utente): settimana intera di cottura
// (cook_days 1-7, quindi 7 secondi freschi necessari) e nessun piatto ancora
// rifiutato (rifiutato = () => false). Se un profilo risulta al limite anche
// cosi', un utente reale con meno giorni di cottura o piatti gia' rifiutati
// sta comunque peggio.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);
const {
  caricaPiatti, foodIdVietatiPerDieta, gruppiPerProfiloDa, analizzaCapienza,
  GRADINI, FAMIGLIE_PER_CUCINA, GENERICO_DI,
} = require('./genera');

const CUCINA_DI_PAESE = {
  italia: 'europea', francia: 'europea', spagna: 'europea', grecia: 'europea', portogallo: 'europea',
  germania: 'europea', regno_unito: 'europea',
  giappone: 'asiatica', cina: 'asiatica', thailandia: 'asiatica', corea: 'asiatica', vietnam: 'asiatica',
  messico: 'sud_americana', argentina: 'sud_americana', brasile: 'sud_americana', ande: 'sud_americana',
  stati_uniti: 'usa', australia: 'australiana',
};

const DIETE = ['onnivoro', 'vegetariano', 'vegano', 'pescetariano'];

// Sweep sistematico: ogni paese da solo, con ogni dieta. Piu' le combinazioni
// multi-paese gia' note dal Passo C/D, che restano il caso reale piu' comune
// per gli utenti con piu' di un paese scelto.
const COMBO_SINGOLE = Object.keys(CUCINA_DI_PAESE).flatMap(paese =>
  DIETE.map(dieta => ({ nome: `${dieta}+${paese}`, dieta, paesi: [paese], cucina: CUCINA_DI_PAESE[paese] }))
);
const COMBO_MULTIPLE = [
  { nome: 'pescetariano+Germania+RegnoUnito', dieta: 'pescetariano', paesi: ['germania', 'regno_unito'], cucina: 'europea' },
  { nome: 'vegetariano+Portogallo+Germania',  dieta: 'vegetariano',  paesi: ['portogallo', 'germania'],  cucina: 'europea' },
  { nome: 'vegano+RegnoUnito+StatiUniti',     dieta: 'vegano',       paesi: ['regno_unito', 'stati_uniti'], cucina: 'europea' },
];
const CONFIG = [...COMBO_SINGOLE, ...COMBO_MULTIPLE];

const GIORNI_COTTURA_PIENA = [1, 2, 3, 4, 5, 6, 7];
const secondiFreschiNecessari = GIORNI_COTTURA_PIENA.length; // cucinaOggi(1) sempre vero qui
const rifiutato = () => false;

function perSlotDa(piatti, soglia) {
  const filtra = (slot) => piatti.filter(p => p.meal_slot === slot && (p.health_score == null || p.health_score >= soglia));
  return {
    primi: filtra('primo'), secondi: filtra('secondo'), contorni: filtra('contorno'),
    colazioni: filtra('colazione'), spuntini: filtra('spuntino'),
  };
}

(async () => {
  // caricaPiatti dipende solo dalla famiglia, non dalla dieta: una chiamata
  // per famiglia, riusata per tutte le diete/paesi che vi ricadono.
  const cachePiattiPerFamiglia = new Map();
  async function piattiDellaFamiglia(cucina) {
    const famiglie = FAMIGLIE_PER_CUCINA[cucina];
    const chiave = famiglie.join(',');
    if (!cachePiattiPerFamiglia.has(chiave)) {
      cachePiattiPerFamiglia.set(chiave, await caricaPiatti(supabase, famiglie, 6));
    }
    return cachePiattiPerFamiglia.get(chiave);
  }

  const cacheVietatiPerDieta = new Map();
  async function vietatiDellaDieta(dieta) {
    if (!cacheVietatiPerDieta.has(dieta)) {
      cacheVietatiPerDieta.set(dieta, await foodIdVietatiPerDieta(supabase, dieta));
    }
    return cacheVietatiPerDieta.get(dieta);
  }

  // Un profilo e' "non applicabile" a un paese quando non e' mai stato
  // scritto per quel paese: zero piatti (di qualunque punteggio salute,
  // qualunque dieta) taggati con quel paese o il suo generico designato -
  // non la famiglia intera, il pool esatto di gradino 0. E' la stessa
  // distinzione che si fa gia' a mano per la dieta (un vegetariano non ha
  // bisogno di europeo-brasato, e' fatto di carne) applicata al paese: un
  // italiano non ha bisogno di europeo-ricco, non l'ha mai avuto, usera' il
  // suo mediterraneo. Diverso da un buco vero, dove il profilo ESISTE nel
  // pool proprio del paese ma non basta (es. asiatico-sudest per il
  // Giappone: qualche piatto in asia_generico c'e', non e' abbastanza).
  // Calcolata sulla famiglia intera (non filtrata per dieta): l'esistenza di
  // un piatto non dipende da chi puo' mangiarlo.
  function profiloApplicabileA(piattiFamiglia, profilo, paesi) {
    const poolProprio = new Set(paesi.flatMap(p => [p, GENERICO_DI[p]].filter(Boolean)));
    return piattiFamiglia.some(p =>
      p.meal_slot === 'secondo' && p.profilo === profilo && poolProprio.has(p.paese)
    );
  }

  const righeReport = [];
  const impossibili = [];
  const nonApplicabili = [];

  for (const cfg of CONFIG) {
    const piattiFamiglia = await piattiDellaFamiglia(cfg.cucina);
    const vietati = await vietatiDellaDieta(cfg.dieta);
    const piatti = piattiFamiglia.filter(p => !(p.ingredienti || []).some(i => vietati.has(i.food_id)));

    const { gruppiPerProfilo } = gruppiPerProfiloDa(piatti, 45);

    // Riga per ogni profilo della FAMIGLIA ATTESA, non solo quelli che
    // sopravvivono al filtro dieta - altrimenti una dieta che esclude TUTTI
    // i secondi di un profilo (es. asiatico-sudest per un vegetariano, tutto
    // a base di pesce) non produce nessuna riga invece di una riga a zero:
    // e' esattamente la stessa forma del bug della paginazione, un'assenza
    // silenziosa proprio nel caso peggiore. Calcolato sulla famiglia INTERA
    // (piattiFamiglia, non filtrata per dieta): l'esistenza di un profilo
    // non dipende da chi puo' mangiarlo, solo la sua capienza ne dipende.
    const famigliaDiProfilo = {};
    for (const p of piattiFamiglia) if (p.profilo !== 'neutro') famigliaDiProfilo[p.profilo] = p.famiglia;
    const famigliaAttesa = FAMIGLIE_PER_CUCINA[cfg.cucina][0];
    const profiliAttesi = [...new Set(piattiFamiglia
      .filter(p => p.meal_slot === 'secondo' && p.profilo !== 'neutro' && famigliaDiProfilo[p.profilo] === famigliaAttesa)
      .map(p => p.profilo))];

    const profiliConSecondo = profiliAttesi;

    if (!profiliConSecondo.length) {
      righeReport.push({ combo: cfg.nome, profilo: '(nessuno)', gradinoMinimo: 'IMPOSSIBILE', stato: 'buco_vero', dettaglio: 'nessun profilo esiste per questa famiglia' });
      impossibili.push(`${cfg.nome}: nessun profilo esiste per questa famiglia`);
      continue;
    }

    for (const profilo of profiliConSecondo) {
      let gradinoMinimo = null;
      let ultimoMessaggio = null;

      for (const passo of GRADINI) {
        // 2b (2026-09-19): NON testabile qui, non per svista. analizzaCapienza
        // ragiona su conteggi (secondi distinti, quote gruppo, ecc.), mai su
        // kcal/sale/saturi - e F0 non ha mai un target kcal dietro (ragiona
        // per dieta+paese, "senza un utente reale dietro", vedi sopra
        // foodIdVietatiPerDieta). opz.tettoTollerante non e' letto da
        // analizzaCapienza: se non saltassimo 2b qui, il suo esito
        // sarebbe SEMPRE identico a quello del gradino 2 (stesso
        // quotaTollerante, l'unica opzione che analizzaCapienza guarda),
        // e potrebbe uscire come "il gradino minimo e' 2b" per puro caso
        // di posizione in lista - una riga che dice di aver testato il
        // tetto senza averlo mai potuto fare. Il tetto va verificato con
        // una generazione vera (misura-gradino-2b.js), non qui.
        if (passo.gradino === '2b') continue;
        const catalogo = perSlotDa(piatti, passo.soglia);
        const esito = analizzaCapienza(profilo, catalogo, {
          paesiScelti: cfg.paesi, opz: passo.opz, rifiutato, secondiFreschiNecessari, gruppiPerProfilo,
        });
        if (esito.ok) { gradinoMinimo = passo.gradino; break; }
        ultimoMessaggio = esito.messaggio;
      }

      if (gradinoMinimo === null) {
        const applicabile = profiloApplicabileA(piattiFamiglia, profilo, cfg.paesi);
        const stato = applicabile ? 'IMPOSSIBILE' : 'NON_APPLICABILE';
        righeReport.push({ combo: cfg.nome, profilo, gradinoMinimo: stato, stato: applicabile ? 'buco_vero' : 'non_applicabile', dettaglio: ultimoMessaggio });
        if (applicabile) {
          impossibili.push(`${cfg.nome} / ${profilo}: impossibile anche al gradino piu' permissivo - ${ultimoMessaggio}`);
        } else {
          nonApplicabili.push(`${cfg.nome} / ${profilo}: mai scritto per questo paese (0 piatti nel pool proprio)`);
        }
      } else {
        // QUATTRO stati, non tre (corretto 2026-09-13 su richiesta esplicita):
        // "regge" da solo nascondeva casi come centro_nord_generico, che
        // raggiunge SEMPRE e solo un gradino allentato (mai 0) e quindi si
        // presentava come "sano" in un conteggio unico con chi regge quasi
        // sempre a 0. regge_0 e regge_allentamento sono ora due stati
        // separati e paritetici nel riepilogo, non un conteggio annidato.
        const stato = gradinoMinimo === '0' ? 'regge_0' : 'regge_allentamento';
        righeReport.push({ combo: cfg.nome, profilo, gradinoMinimo, stato, dettaglio: gradinoMinimo === '0' ? null : ultimoMessaggio });
      }
    }
  }

  console.log(`\n=== Passo F0: capienza aritmetica su ${CONFIG.length} combinazioni dieta+paese/i ===`);
  console.log('(gradino 2b escluso da questa scansione: e\' il tetto sale/saturi, dipende da un target kcal che F0 non ha - vedi il commento nel codice. Va verificato con una generazione vera, non con la sola capienza aritmetica.)\n');

  const reggeGradino0 = righeReport.filter(r => r.stato === 'regge_0');
  const reggeConAllentamento = righeReport.filter(r => r.stato === 'regge_allentamento');
  const nonApplicabiliRighe = righeReport.filter(r => r.stato === 'non_applicabile');
  console.log(`Totale righe profilo: ${righeReport.length}`);
  console.log(`  regge a gradino 0:        ${reggeGradino0.length}`);
  console.log(`  regge solo con allentamento: ${reggeConAllentamento.length}`);
  console.log(`  non applicabile:          ${nonApplicabiliRighe.length}`);
  console.log(`  buco vero (impossibile, profilo comunque scritto per il paese): ${impossibili.length}\n`);

  if (reggeConAllentamento.length) {
    console.log(`--- REGGE SOLO CON ALLENTAMENTO: mai a gradino 0, il gradino minimo e' indicato per riga (${reggeConAllentamento.length}) ---`);
    for (const r of reggeConAllentamento) {
      console.log(`  ${r.combo} / ${r.profilo}: gradino minimo = ${r.gradinoMinimo}${r.dettaglio ? ` (${r.dettaglio})` : ''}`);
    }
  }

  if (nonApplicabili.length) {
    console.log(`\n--- NON APPLICABILI: profilo mai scritto per quel paese (${nonApplicabili.length}) ---`);
    for (const m of nonApplicabili) console.log(`  ${m}`);
  }

  if (impossibili.length) {
    console.log(`\n--- BUCHI VERI: profilo scritto per il paese ma non abbastanza (${impossibili.length}) ---`);
    for (const m of impossibili) console.log(`  ${m}`);
  } else {
    console.log('\nNessun buco vero: dove il profilo esiste per il paese, la scala di allentamento basta.');
  }

  require('fs').writeFileSync(
    __dirname + '/passoF0-risultati.json',
    JSON.stringify({ righeReport, impossibili, nonApplicabili }, null, 2)
  );
  console.log(`\nDettaglio completo salvato in passoF0-risultati.json (${righeReport.length} righe).`);
})();
