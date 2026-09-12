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
  GRADINI, FAMIGLIE_PER_CUCINA,
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

  const righeReport = [];
  const impossibili = [];

  for (const cfg of CONFIG) {
    const piattiFamiglia = await piattiDellaFamiglia(cfg.cucina);
    const vietati = await vietatiDellaDieta(cfg.dieta);
    const piatti = piattiFamiglia.filter(p => !(p.ingredienti || []).some(i => vietati.has(i.food_id)));

    const { profiliConSecondo: profiliCatalogo, gruppiPerProfilo } = gruppiPerProfiloDa(piatti, 45);

    // caricaPiatti (bug noto, non toccato qui: il parametro 'famiglie' non
    // filtra la query, vedi memoria) restituisce l'intero catalogo, quindi
    // profiliCatalogo include profili di famiglie culinarie estranee al
    // paese in esame - per costruzione mai raggiungibili (paeseAmmesso li
    // esclude sempre). Il generatore vero li scarta gia' da soli tramite
    // questo stesso controllo di capienza; qui li togliamo prima di
    // riportarli, per non riempire l'esito F0 di "impossibile" ovvio.
    const famigliaDiProfilo = {};
    for (const p of piatti) if (p.profilo !== 'neutro') famigliaDiProfilo[p.profilo] = p.famiglia;
    const famigliaAttesa = FAMIGLIE_PER_CUCINA[cfg.cucina][0];
    const profiliConSecondo = profiliCatalogo.filter(pr => famigliaDiProfilo[pr] === famigliaAttesa);

    if (!profiliConSecondo.length) {
      righeReport.push({ combo: cfg.nome, profilo: '(nessuno)', gradinoMinimo: 'IMPOSSIBILE', dettaglio: 'nessun profilo ha secondi utilizzabili' });
      impossibili.push(`${cfg.nome}: nessun profilo ha secondi utilizzabili`);
      continue;
    }

    for (const profilo of profiliConSecondo) {
      let gradinoMinimo = null;
      let ultimoMessaggio = null;

      for (const passo of GRADINI) {
        const catalogo = perSlotDa(piatti, passo.soglia);
        const esito = analizzaCapienza(profilo, catalogo, {
          paesiScelti: cfg.paesi, opz: passo.opz, rifiutato, secondiFreschiNecessari, gruppiPerProfilo,
        });
        if (esito.ok) { gradinoMinimo = passo.gradino; break; }
        ultimoMessaggio = esito.messaggio;
      }

      if (gradinoMinimo === null) {
        righeReport.push({ combo: cfg.nome, profilo, gradinoMinimo: 'IMPOSSIBILE', dettaglio: ultimoMessaggio });
        impossibili.push(`${cfg.nome} / ${profilo}: impossibile anche al gradino piu' permissivo - ${ultimoMessaggio}`);
      } else {
        righeReport.push({ combo: cfg.nome, profilo, gradinoMinimo, dettaglio: gradinoMinimo === '0' ? null : ultimoMessaggio });
      }
    }
  }

  console.log(`\n=== Passo F0: capienza aritmetica su ${CONFIG.length} combinazioni dieta+paese/i ===\n`);

  const soloProblematiche = righeReport.filter(r => r.gradinoMinimo !== '0');
  if (!soloProblematiche.length) {
    console.log('Tutte le combinazioni reggono al gradino 0 (nessun allentamento necessario).');
  } else {
    console.log(`${soloProblematiche.length}/${righeReport.length} righe profilo richiedono un allentamento (o sono impossibili):\n`);
    for (const r of soloProblematiche) {
      console.log(`  ${r.combo} / ${r.profilo}: gradino minimo = ${r.gradinoMinimo}${r.dettaglio ? ` (${r.dettaglio})` : ''}`);
    }
  }

  if (impossibili.length) {
    console.log(`\n--- IMPOSSIBILI anche al gradino piu' permissivo (${impossibili.length}) ---`);
    for (const m of impossibili) console.log(`  ${m}`);
  } else {
    console.log('\nNessuna combinazione risulta impossibile: la scala di allentamento basta sempre a trovare una settimana.');
  }

  require('fs').writeFileSync(
    __dirname + '/passoF0-risultati.json',
    JSON.stringify({ righeReport, impossibili }, null, 2)
  );
  console.log(`\nDettaglio completo salvato in passoF0-risultati.json (${righeReport.length} righe).`);
})();
