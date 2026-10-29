// SOLA MISURA, IN LOCALE - non scrive nulla, nessun effetto su npm run
// verifica (e' un'esplorazione, non un controllo permanente). Richiesta del
// 24 ottobre: la matrice dieta x allergie non copre le situazioni reali che
// decidono se un piano regge la vita vera - tempo per la cena, pranzo fuori
// casa nei giorni feriali, assenza di forno. Incrocio rappresentativo (non
// tutte le possibili: niente allergie qui, solo le 4 diete principali) su:
//   - evening_minutes: 15, 20, 30, 999 (= "senza limite")
//   - pranzo fuori casa nei giorni feriali (lun-ven): si/no (weekend sempre a casa)
//   - senza forno: si/no (vedi RE_FORNO sotto - 'tecnica' su dishes non e'
//     un segnale attendibile, tagga solo la complessita' feriale, non lo
//     strumento richiesto: "Patate al forno al rosmarino" ha tecnica='semplice')
// 4 x 4 x 2 x 2 = 64 profili x 4 diete x 3 semi = 768 generazioni.
//
// "Senza forno" e' simulato filtrando il catalogo per nome/nome_en contro
// RE_FORNO PRIMA che entri nella cache di caricaRiferimento (genera.js):
// quella cache e' per processo, non per chiamata, quindi ogni gruppo
// (dieta x tempo x pranzo x forno) ricarica un genera.js pulito
// (require.cache) cosi' la cache non perde colpi tra un profilo e l'altro.
require('dotenv').config({ quiet: true });
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const supabaseReale = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const SEMI = [1001, 1002, 1003];
const DIETE = ['onnivoro', 'pescetariano', 'vegetariano', 'vegano'];
const TEMPI_CENA = [15, 20, 30, 999];
const PRANZO_FUORI_FERIALE = [false, true];
const SENZA_FORNO = [false, true];

// Non e' il campo 'tecnica' (quello tagga la complessita' feriale, non lo
// strumento - vedi la nota sopra): un piatto richiede il forno se il nome
// (o il nome inglese) lo dice.
const RE_FORNO = /\bal forno\b|\bgratinat|\bsformat|\bal cartoccio\b|\blasagn|\bparmigiana\b|\bbaked\b|\bgratin|\broast(ed)?\b/i;
function richiedeForno(piatto) {
  return RE_FORNO.test(piatto.name || '') || RE_FORNO.test(piatto.name_en || '');
}

function clienteFinto(reale, profiloSintetico, senzaForno) {
  return {
    from(tabella) {
      if (tabella === 'users') return { select() { return this; }, eq() { return this; }, maybeSingle: async () => ({ data: profiloSintetico, error: null }) };
      if (tabella === 'user_constraints') return { select() { return this; }, eq: async () => ({ data: [], error: null }) };
      if (tabella === 'dishes' && senzaForno) {
        // .range() non esiste ancora su reale.from('dishes') (il builder lo
        // guadagna solo dopo .select()): va avvolto DOPO .select(), non prima.
        const qb = reale.from(tabella);
        const selectOriginale = qb.select.bind(qb);
        qb.select = (...selArgs) => {
          const fb = selectOriginale(...selArgs);
          const rangeOriginale = fb.range.bind(fb);
          fb.range = (...rangeArgs) => {
            const thenabileOriginale = rangeOriginale(...rangeArgs);
            return {
              then(risolvi, rifiuta) {
                return thenabileOriginale.then(
                  ({ data, error }) => risolvi({ data: error ? data : (data || []).filter((d) => !richiedeForno(d)), error }),
                  rifiuta
                );
              },
            };
          };
          return fb;
        };
        return qb;
      }
      return reale.from(tabella);
    },
  };
}

function profiloPer(dieta, minutiSera, pranzoFuoriFeriale) {
  const pastiCasa = {};
  for (let g = 1; g <= 7; g++) {
    const weekend = g === 6 || g === 7;
    pastiCasa[g] = { pranzo: weekend ? true : !pranzoFuoriFeriale, cena: true };
  }
  return {
    diet: dieta, cook_days: [1, 2, 3, 4, 5, 6, 7], lunch_away: pranzoFuoriFeriale,
    pasti_casa: pastiCasa, evening_minutes: minutiSera, household_size: 1, paesi: ['italia'],
  };
}

(async () => {
  const risultati = [];
  for (const minutiSera of TEMPI_CENA) {
    for (const pranzoFuori of PRANZO_FUORI_FERIALE) {
      for (const senzaForno of SENZA_FORNO) {
        // Modulo pulito per ogni gruppo (tempo x pranzo x forno): la cache
        // di caricaRiferimento in genera.js e' per processo, deve ripartire
        // da zero quando cambia la forma del catalogo filtrato (senzaForno).
        delete require.cache[require.resolve('./genera.js')];
        const { generaESalva } = require('./genera.js');

        for (const dieta of DIETE) {
          const profilo = profiloPer(dieta, minutiSera, pranzoFuori);
          const finto = clienteFinto(supabaseReale, profilo, senzaForno);
          for (const seme of SEMI) {
            const etichetta = `${dieta} | cena<=${minutiSera === 999 ? '∞' : minutiSera}min | pranzo_fuori_feriale=${pranzoFuori ? 'si' : 'no'} | senza_forno=${senzaForno ? 'si' : 'no'} | seme ${seme}`;
            const inizio = Date.now();
            try {
              const r = await generaESalva(finto, crypto.randomUUID(), seme, { salva: false });
              // piano_impossibile (25 ottobre 2026): generaESalva ora
              // RITORNA questo esito (non lancia) quando nessun piano
              // rispetta tutte le scelte dell'utente - e' il buco di
              // catalogo vero, distinto da un errore di script.
              if (r.errore === 'piano_impossibile') {
                risultati.push({ dieta, minutiSera, pranzoFuori, senzaForno, seme, ok: false, impossibile: true, vincoloBloccante: r.vincolo_bloccante, dettaglio: r.dettaglio, piattiCompatibili: r.piatti_compatibili, suggerimento: r.suggerimento, secondi: (Date.now() - inizio) / 1000, etichetta });
              } else {
                risultati.push({ dieta, minutiSera, pranzoFuori, senzaForno, seme, ok: true, gradino: r.gradino, secondi: (Date.now() - inizio) / 1000, etichetta });
              }
            } catch (e) {
              risultati.push({ dieta, minutiSera, pranzoFuori, senzaForno, seme, ok: false, impossibile: false, errore: e.message, secondi: (Date.now() - inizio) / 1000, etichetta });
            }
          }
        }
      }
    }
  }

  const ok = risultati.filter((r) => r.ok);
  console.log(`\n${ok.length}/${risultati.length} riuscite su ${risultati.length} generazioni (${SEMI.length} semi x ${DIETE.length} diete x ${TEMPI_CENA.length} tempi x ${PRANZO_FUORI_FERIALE.length} pranzo x ${SENZA_FORNO.length} forno)\n`);

  // piano_impossibile (25 ottobre 2026): il buco di catalogo VERO - nessun
  // piano possibile senza violare una scelta dell'utente. Separato dagli
  // errori di script veri e propri.
  const impossibili = risultati.filter((r) => r.impossibile);
  const erroriScript = risultati.filter((r) => !r.ok && !r.impossibile);
  console.log(`piano_impossibile: ${impossibili.length}`);
  const perVincolo = {};
  for (const r of impossibili) (perVincolo[r.vincoloBloccante] ||= []).push(r);
  for (const [vincolo, righe] of Object.entries(perVincolo)) {
    console.log(`\n  vincolo bloccante "${vincolo}": ${righe.length} casi`);
    const perGruppoImpossibile = {};
    for (const r of righe) {
      const chiave = `${r.dieta} | cena<=${r.minutiSera === 999 ? '∞' : r.minutiSera}min | pranzo_fuori_feriale=${r.pranzoFuori ? 'si' : 'no'} | senza_forno=${r.senzaForno ? 'si' : 'no'}`;
      (perGruppoImpossibile[chiave] ||= []).push(r);
    }
    for (const [chiave, righeGruppo] of Object.entries(perGruppoImpossibile)) {
      const esempio = righeGruppo[0];
      console.log(`    ${chiave} - ${righeGruppo.length}/${SEMI.length} semi - ${esempio.piattiCompatibili} piatti compatibili - suggerimento: ${esempio.suggerimento ? esempio.suggerimento.testo : 'nessuno'}`);
    }
  }
  console.log(`\nErrori di script (non piano_impossibile): ${erroriScript.length}`);
  for (const r of erroriScript) console.log(`  XX ${r.etichetta} - ${r.errore} (${r.secondi.toFixed(1)}s)`);

  const gradinoAlto = risultati.filter((r) => r.ok && r.gradino >= 4);

  console.log(`\nRiuscite ma al gradino 4 o 5 (molte concessioni, segno di catalogo scarso per quella combinazione): ${gradinoAlto.length}`);
  const perGruppo = {};
  for (const r of gradinoAlto) {
    const chiave = `${r.dieta} | cena<=${r.minutiSera === 999 ? '∞' : r.minutiSera}min | pranzo_fuori_feriale=${r.pranzoFuori ? 'si' : 'no'} | senza_forno=${r.senzaForno ? 'si' : 'no'}`;
    (perGruppo[chiave] ||= []).push(r.gradino);
  }
  for (const [chiave, gradini] of Object.entries(perGruppo).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${chiave} - ${gradini.length}/${SEMI.length} semi al gradino alto (${gradini.join(',')})`);
  }

  console.log(`\nTempo medio per gruppo (dieta x tempo x pranzo x forno), secondi:`);
  const tempoGruppo = {};
  for (const r of risultati.filter((x) => x.ok)) {
    const chiave = `${r.dieta.padEnd(13)} cena<=${String(r.minutiSera === 999 ? '∞' : r.minutiSera).padStart(3)}min pranzo_fuori=${r.pranzoFuori ? 'si ' : 'no '} senza_forno=${r.senzaForno ? 'si' : 'no'}`;
    (tempoGruppo[chiave] ||= []).push(r.secondi);
  }
  for (const [chiave, tempi] of Object.entries(tempoGruppo)) {
    const media = tempi.reduce((s, t) => s + t, 0) / tempi.length;
    console.log(`  ${chiave}  media ${media.toFixed(2)}s  (max ${Math.max(...tempi).toFixed(2)}s)`);
  }

  require('fs').writeFileSync(__dirname + '/misura-matrice-allargata-risultati.json', JSON.stringify(risultati, null, 2));
  console.log('\nRisultati completi in misura-matrice-allargata-risultati.json');
})().catch((e) => { console.error('ERRORE nello script:', e.message); process.exitCode = 1; });
