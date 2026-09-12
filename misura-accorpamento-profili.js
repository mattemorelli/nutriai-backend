// MISURA, non applica: quante delle righe problematiche del Passo F0
// sparirebbero se i profili di sapore fossero accorpati in gruppi piu'
// larghi? Il remapping avviene solo in memoria, su una copia dei piatti -
// nessuna scrittura sul database, nessuna modifica a genera.js.
//
// Riusa le stesse funzioni del generatore vero (caricaPiatti,
// foodIdVietatiPerDieta, gruppiPerProfiloDa, analizzaCapienza, GRADINI): la
// misura descrive esattamente cosa succederebbe se si accorpasse, non un
// modello approssimato.
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
const secondiFreschiNecessari = GIORNI_COTTURA_PIENA.length;
const rifiutato = () => false;

// ---- Proposta di accorpamento (SOLO per questa misura) ----
// Criterio: dentro ogni gruppo, i piatti condividono cottura e registro di
// sapore al punto da poter comparire nello stesso giorno senza stonare -
// vedi il messaggio di riepilogo per gli esempi concreti.
const MAPPA_ACCORPAMENTO = {
  'mediterraneo-olio': 'mediterraneo',
  'mediterraneo-erbe': 'mediterraneo',
  'europeo-aceto': 'europeo-leggero',
  'europeo-erbe': 'europeo-leggero',
  'europeo-burro': 'europeo-ricco',
  'europeo-panna': 'europeo-ricco',
  'europeo-brasato': 'europeo-ricco',
  'asiatico-soia': 'asiatico-orientale',
  'asiatico-gochujang': 'asiatico-orientale',
  'asiatico-lime': 'asiatico-sudest',
  'asiatico-cocco': 'asiatico-sudest',
  'latino-lime': 'latino-messicano-ampio',
  'latino-messicano': 'latino-messicano-ampio',
  'latino-chimichurri': 'latino-chimichurri', // resta a se'
  'americano-comfort': 'americano',
  'americano-bbq': 'americano',
};

function perSlotDa(piatti, soglia) {
  const filtra = (slot) => piatti.filter(p => p.meal_slot === slot && (p.health_score == null || p.health_score >= soglia));
  return {
    primi: filtra('primo'), secondi: filtra('secondo'), contorni: filtra('contorno'),
    colazioni: filtra('colazione'), spuntini: filtra('spuntino'),
  };
}

// Calcola, per una data lista di piatti (gia' filtrata per dieta), il
// gradino minimo per ciascun profilo della famiglia attesa.
function gradiniMinimiPer(piatti, cfg, famigliaAttesa) {
  const { profiliConSecondo: profiliCatalogo, gruppiPerProfilo } = gruppiPerProfiloDa(piatti, 45);
  const famigliaDiProfilo = {};
  for (const p of piatti) if (p.profilo !== 'neutro') famigliaDiProfilo[p.profilo] = p.famiglia;
  const profiliConSecondo = profiliCatalogo.filter(pr => famigliaDiProfilo[pr] === famigliaAttesa);

  const risultato = {};
  for (const profilo of profiliConSecondo) {
    let gradinoMinimo = 'IMPOSSIBILE';
    let ultimoMessaggio = null;
    for (const passo of GRADINI) {
      const catalogo = perSlotDa(piatti, passo.soglia);
      const esito = analizzaCapienza(profilo, catalogo, {
        paesiScelti: cfg.paesi, opz: passo.opz, rifiutato, secondiFreschiNecessari, gruppiPerProfilo,
      });
      if (esito.ok) { gradinoMinimo = passo.gradino; break; }
      ultimoMessaggio = esito.messaggio;
    }
    risultato[profilo] = { gradinoMinimo, ultimoMessaggio };
  }
  return risultato;
}

(async () => {
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

  const righePrima = []; // { combo, profilo, gradinoMinimo }
  const righeDopo = [];  // { combo, profiloOriginale, profiloAccorpato, gradinoMinimo }

  for (const cfg of CONFIG) {
    const piattiFamiglia = await piattiDellaFamiglia(cfg.cucina);
    const vietati = await vietatiDellaDieta(cfg.dieta);
    const piattiBase = piattiFamiglia.filter(p => !(p.ingredienti || []).some(i => vietati.has(i.food_id)));
    const famigliaAttesa = FAMIGLIE_PER_CUCINA[cfg.cucina][0];

    // ---- PRIMA: profili cosi' come sono oggi ----
    const gradiniPrima = gradiniMinimiPer(piattiBase, cfg, famigliaAttesa);
    for (const [profilo, r] of Object.entries(gradiniPrima)) {
      righePrima.push({ combo: cfg.nome, profilo, gradinoMinimo: r.gradinoMinimo });
    }

    // ---- DOPO: stessi piatti, profilo rimappato secondo MAPPA_ACCORPAMENTO ----
    const piattiAccorpati = piattiBase.map(p => {
      const nuovo = MAPPA_ACCORPAMENTO[p.profilo];
      return nuovo ? { ...p, profilo: nuovo } : p;
    });
    const gradiniDopo = gradiniMinimiPer(piattiAccorpati, cfg, famigliaAttesa);

    // Ogni riga PRIMA corrisponde al gradino del suo profilo accorpato DOPO.
    for (const [profiloOriginale, r] of Object.entries(gradiniPrima)) {
      const profiloAccorpato = MAPPA_ACCORPAMENTO[profiloOriginale] || profiloOriginale;
      const dopo = gradiniDopo[profiloAccorpato] || { gradinoMinimo: 'IMPOSSIBILE' };
      righeDopo.push({
        combo: cfg.nome, profiloOriginale, profiloAccorpato,
        gradinoPrima: r.gradinoMinimo, gradinoDopo: dopo.gradinoMinimo,
      });
    }
  }

  const problematichePrima = righeDopo.filter(r => r.gradinoPrima !== '0');
  const risolteACero = problematichePrima.filter(r => r.gradinoDopo === '0');
  const diventatePossibili = problematichePrima.filter(r => r.gradinoPrima === 'IMPOSSIBILE' && r.gradinoDopo !== 'IMPOSSIBILE');
  const ancoraImpossibili = problematichePrima.filter(r => r.gradinoDopo === 'IMPOSSIBILE');
  const peggiorate = righeDopo.filter(r => r.gradinoPrima === '0' && r.gradinoDopo !== '0');

  console.log(`\n=== Misura accorpamento profili: PRIMA (${righePrima.length} righe) vs DOPO ===\n`);
  console.log(`Righe problematiche PRIMA (gradino != 0): ${problematichePrima.length} / ${righeDopo.length}`);
  console.log(`  -> di queste, raggiungono gradino 0 DOPO l'accorpamento: ${risolteACero.length}`);
  console.log(`  -> di queste, diventano possibili (ma non gradino 0) DOPO: ${diventatePossibili.length}`);
  console.log(`  -> di queste, restano IMPOSSIBILI anche DOPO: ${ancoraImpossibili.length}`);
  if (peggiorate.length) {
    console.log(`ATTENZIONE: ${peggiorate.length} righe che reggevano al gradino 0 PRIMA non ci reggono piu' DOPO (l'accorpamento le ha danneggiate).`);
  }

  console.log('\n--- Dettaglio delle righe ancora IMPOSSIBILI dopo l\'accorpamento ---');
  for (const r of ancoraImpossibili) {
    console.log(`  ${r.combo} / ${r.profiloOriginale} -> ${r.profiloAccorpato}: ancora impossibile`);
  }

  require('fs').writeFileSync(
    __dirname + '/misura-accorpamento-risultati.json',
    JSON.stringify({ righePrima, righeDopo, riepilogo: {
      totale: righeDopo.length,
      problematichePrima: problematichePrima.length,
      risolteACero: risolteACero.length,
      diventatePossibili: diventatePossibili.length,
      ancoraImpossibili: ancoraImpossibili.length,
      peggiorate: peggiorate.length,
    } }, null, 2)
  );
  console.log('\nDettaglio completo in misura-accorpamento-risultati.json');
})();
