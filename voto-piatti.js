// voto-piatti.js — v3, SOLA LETTURA. Non scrive un solo voto.
//
// Storia delle due correzioni precedenti, per non rifare gli stessi errori:
//  v1: la fibra come penalita' condannava i piatti che fibra non devono averne
//      (uovo sodo 4.4/10) e la curva ripida bocciava l'insalata greca (4.6)
//      solo perche' porta poche calorie. Saturi, sale e fibra sono budget
//      GIORNALIERI e genera.js li controlla gia' sulla giornata (LIMITI).
//  v2: fibra come bonus e curva piu' larga. Ha aggiustato quei due, ma ha
//      promosso Currywurst e Toad in the hole, perche' mancava la dimensione
//      che quei piatti hanno davvero: sono insaccati.
//
// v3 aggiunge la carne processata e una regola di non compensazione.
//
// La carne processata e' una dimensione primaria quanto il sale: WCRF (gia'
// fonte del corpus) raccomanda "poca o nessuna carne processata", IARC la
// classifica in gruppo 1. Prende il peso che la fibra ha lasciato libero, cosi'
// i pesi restano quelli calibrati ad agosto: 30 saturi, 30 sale, 25 carne
// processata, 15 salse industriali, piu' il bonus fibra fino a +1.
//
// La regola di non compensazione: se una singola voce scende sotto 3 su 10, il
// piatto non puo' superare 6.5 comunque vada il resto. Un piatto sbagliato su
// una dimensione sola non si riscatta con le altre — lo Schweinshaxe ha il sale
// a 6.7 volte il limite giornaliero e con i soli pesi medi sfiorerebbe il 7.
//
// v3.1: il tetto lo fanno scattare SOLO le tre voci quantitative (saturi, sale,
// carne processata), non salsa_industriale. Quel flag e' binario: dice che una
// salsa industriale c'e', non quanta — e con il tetto attivo anche su di lui,
// cinque piatti cinesi con un cucchiaio di hoisin finivano tutti a 6.5 esatti,
// cioe' bocciati da una spunta invece che da una quantita'. La salsa pesa
// ancora il 15% del voto, e restano bocciati i piatti in cui la salsa arriva
// insieme a sale o carne processata (la Currywurst vera cade comunque).
//
// Il voto calcolato NON sostituisce quello a mano: gli sta accanto come
// allarme. Quando divergono molto, o e' sbagliata la ricetta o e' sbagliato il
// voto — ed e' il controllo che oggi non esiste.

require('dotenv').config();
const { Client } = require('pg');

// I limiti giornalieri che genera.js gia' applica (const LIMITI). Le soglie
// del voto sono ancorate a QUESTI: se LIMITI cambia, va cambiato anche qui.
const LIMITI_GIORNO = { satMax: 29, saleMax: 5, fibraMin: 25 };
const KCAL_RIFERIMENTO = 2300;

// 50 g al giorno e' la quantita' su cui IARC misura l'aumento di rischio per
// la carne processata: la usiamo come punto in cui il punteggio tocca il
// minimo, non come soglia di accettabilita'.
const CARNE_PROCESSATA_GIORNO = 50;

const SOGLIE = {
  sat:        LIMITI_GIORNO.satMax        / KCAL_RIFERIMENTO * 100,  // ~1.26 g per 100 kcal
  sale:       LIMITI_GIORNO.saleMax       / KCAL_RIFERIMENTO * 100,  // ~0.217
  fibra:      LIMITI_GIORNO.fibraMin      / KCAL_RIFERIMENTO * 100,  // ~1.09
  processata: CARNE_PROCESSATA_GIORNO     / KCAL_RIFERIMENTO * 100,  // ~2.17
};

const PESI = { sat: 0.30, sale: 0.30, processata: 0.25, salse: 0.15 };
const BONUS_FIBRA_MAX = 1.0;
const QUANTE_VOLTE_IL_LIMITE = 4;   // dove saturi e sale toccano il minimo
const VOCE_CRITICA = 3;             // sotto questo punteggio scatta il tetto
const TETTO_SE_CRITICA = 6.5;
// salse resta fuori: e' un flag binario, non una quantita' (v3.1)
const VOCI_CON_TETTO = new Set(['sat', 'sale', 'processata']);

// La lista approvata il 16/09. Serve solo finche' categorie_alimenti non ha
// la categoria 'carne_processata': appena esiste, il dato vero vince e questa
// lista resta come rete di sicurezza.
// Nota sui compositi (cornetto, muffin): sono taggati perche' la categoria
// risponde a "cosa contiene", ma i loro grammi sovrastimano la carne
// processata vera, perche' contano tutto il piatto. Oggi non li usa nessuna
// ricetta; se un domani entrano, quel voto va guardato a mano.
const CARNE_PROCESSATA_APPROVATA = new Set([
  '167871', 'wurstel_it', '173862', 'speck_it', 'bresaola_it', 'turkey_bacon_us',
  'pancetta_it', 'petto_pollo_affumicato_it', 'mortadella_it', '173870', '168277',
  'salame_it', '171631', '173270', '172032',
]);

// I nove piatti di riferimento, PER ID e non per nome: il controllo di v2
// falliva perche' cercava "Currywurst" per nome e ne esistono due, di cui una
// (b9000003) non contiene nessun insaccato — e' pollo al pomodoro con un nome
// sbagliato, quindi un voto alto su quella riga e' corretto, non un errore.
const CONTROLLO = [
  { id: '22d328e8-2061-48e9-9131-a1fcba33486e', nome: 'Insalata greca',        atteso: 'sopra' },
  { id: '084d0f0b-5590-47c4-94f0-8f14e545c074', nome: 'Uovo sodo con sale',    atteso: 'sopra' },
  { id: 'd0a6b668-a52e-483f-9262-fdda6e45e810', nome: 'Pomodorini con feta',   atteso: 'sopra' },
  { id: '7e187205-83be-4316-8040-8acac21a62c6', nome: 'Tacchino e funghi',     atteso: 'sopra' },
  { id: 'b9000003-0000-0000-0000-000000000004', nome: 'Currywurst col pollo (nome sbagliato)', atteso: 'sopra' },
  // v3.2: girato da 'sotto' a 'sopra'. Prima cadeva per il sale, ma il sale
  // non era suo: la ricetta era agganciata a 169157 "pickled pork hocks",
  // stinco in salamoia a 2,6 g di sale per 100 g, mentre il piatto e' al
  // forno e va fatto con maiale fresco (168226, 0,21 g). Uno stinco fresco
  // arrosto con crauti non e' cibo spazzatura: lo era l'ingrediente sbagliato.
  // Ora questa riga e' la prova che il riaggancio ha funzionato — se torna
  // 'sotto', la correzione non e' stata applicata.
  { id: 'afd7ab03-50b2-491a-a45d-49e3da52aaa6', nome: 'Schweinshaxe (maiale fresco)', atteso: 'sopra' },
  { id: 'dfbb97fb-1088-4437-8e76-682417e94333', nome: 'Currywurst vera',       atteso: 'sotto' },
  { id: 'e531f938-7b7f-4842-89e1-fb3aeaed16c2', nome: 'Bratwurst',             atteso: 'sotto' },
  { id: 'a16cc5d1-ec4a-4256-820b-d23530bb922c', nome: 'Welsh rarebit',         atteso: 'sotto' },
  { id: '76158b05-86b0-4458-82b8-7b05a70cde02', nome: 'Toad in the hole',      atteso: 'sotto' },
];

const fra = (x, a, b) => Math.max(0, Math.min(1, (x - a) / (b - a)));

// 10 fino al limite giornaliero, poi giu' fino a 1 a quattro volte il limite.
const punto = (densita, soglia) => 10 - 9 * fra(densita, soglia, soglia * QUANTE_VOLTE_IL_LIMITE);
// La carne processata parte da 10 a zero grammi: "poca o nessuna" non ha una
// soglia sotto la quale si sta tranquilli, quindi il punteggio scende subito.
const puntoProcessata = (densita) => 10 - 9 * fra(densita, 0, SOGLIE.processata);

// v3.3: pavimento di calorie per il solo calcolo della densita'. Sotto le 150
// kcal la densita' per 100 kcal e' dominata da qualunque grasso o sale ci sia
// nel condimento e diventa instabile: 8 g di burro su 50 g di ravanelli fanno
// un piatto da poco piu' di cento calorie in cui il burro e' quasi tutto il
// contenuto energetico, e la densita' schizza come se fosse un piatto grasso.
// Non e' il pavimento che avevo scartato in v2 per l'insalata greca — quella
// sta a 300 kcal e non e' mai stata il caso d'uso: questo agisce solo sui
// piatti davvero piccoli, e nessuno dei dieci riferimenti lo attraversa.
const KCAL_PAVIMENTO = 150;

function votoCalcolato(v, salsaIndustriale) {
  if (!v.kcal || v.kcal <= 0) return null;
  const kcalDensita = Math.max(v.kcal, KCAL_PAVIMENTO);
  const per100 = (x) => x / kcalDensita * 100;

  const dSat = per100(v.satFat), dSale = per100(v.salt);
  const dFibra = per100(v.fibre), dProc = per100(v.grammiProcessata);

  const voci = {
    sat:        punto(dSat, SOGLIE.sat),
    sale:       punto(dSale, SOGLIE.sale),
    processata: puntoProcessata(dProc),
    salse:      salsaIndustriale ? 2 : 10,
  };
  const bonus = Math.min(1, dFibra / SOGLIE.fibra) * BONUS_FIBRA_MAX;

  let voto = PESI.sat * voci.sat + PESI.sale * voci.sale
           + PESI.processata * voci.processata + PESI.salse * voci.salse + bonus;

  // Solo le voci quantitative possono mettere il tetto: vedi v3.1 in testa.
  const critiche = Object.entries(voci)
    .filter(([k, p]) => p < VOCE_CRITICA && VOCI_CON_TETTO.has(k))
    .map(([k]) => k);
  if (critiche.length) voto = Math.min(voto, TETTO_SE_CRITICA);

  return {
    voto: Math.round(Math.max(1, Math.min(10, voto)) * 10) / 10,
    critiche,
    dettaglio: {
      voci: Object.fromEntries(Object.entries(voci).map(([k, x]) => [k, +x.toFixed(1)])),
      bonus: +bonus.toFixed(2),
      volteIlLimite: { sat: +(dSat / SOGLIE.sat).toFixed(2), sale: +(dSale / SOGLIE.sale).toFixed(2) },
      gProcessataPer100kcal: +dProc.toFixed(2),
    },
  };
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  try {
    const { rows: catRighe } = await c.query(
      "select food_id from categorie_alimenti where categoria = 'carne_processata'"
    );
    const daDb = new Set(catRighe.map(r => String(r.food_id)));
    const processata = daDb.size ? daDb : CARNE_PROCESSATA_APPROVATA;
    console.log(daDb.size
      ? `carne_processata: ${daDb.size} alimenti letti da categorie_alimenti`
      : `carne_processata: la categoria non esiste ancora nel database — uso la lista approvata (${CARNE_PROCESSATA_APPROVATA.size} alimenti)`);
    console.log('');

    const { rows } = await c.query(`
      select d.id, d.name, d.meal_slot, d.paese, d.health_score, d.salsa_industriale,
             i.food_id, i.grams, f.kcal_100g, f.sat_fat_100g, f.fibre_100g, f.salt_100g
        from dishes d
        join dish_ingredients i on i.dish_id = d.id
        join foods f on f.id = i.food_id
       order by d.id
    `);

    const piatti = new Map();
    for (const r of rows) {
      if (!piatti.has(r.id)) {
        piatti.set(r.id, {
          id: r.id, nome: r.name, slot: r.meal_slot, paese: r.paese,
          aMano: r.health_score == null ? null : Number(r.health_score),
          salsa: r.salsa_industriale,
          v: { kcal: 0, satFat: 0, fibre: 0, salt: 0, grammiProcessata: 0 },
        });
      }
      const p = piatti.get(r.id);
      const g = Number(r.grams), k = g / 100;
      p.v.kcal   += Number(r.kcal_100g    || 0) * k;
      p.v.satFat += Number(r.sat_fat_100g || 0) * k;
      p.v.fibre  += Number(r.fibre_100g   || 0) * k;
      p.v.salt   += Number(r.salt_100g    || 0) * k;
      if (processata.has(String(r.food_id))) p.v.grammiProcessata += g;
    }

    const tutti = [...piatti.values()].map(p => ({ ...p, calc: votoCalcolato(p.v, p.salsa) }));
    const validi = tutti.filter(p => p.calc && p.aMano != null)
      .map(p => ({ ...p, scarto: +(p.aMano - p.calc.voto).toFixed(1) }));

    console.log('=== taratura v3 ===');
    console.log(`  10/10 fino al limite giornaliero, 1/10 a ${QUANTE_VOLTE_IL_LIMITE} volte il limite`);
    console.log(`  saturi ${SOGLIE.sat.toFixed(2)} · sale ${SOGLIE.sale.toFixed(3)} · fibra ${SOGLIE.fibra.toFixed(2)} · carne processata ${SOGLIE.processata.toFixed(2)} g per 100 kcal`);
    console.log(`  pesi: saturi ${PESI.sat} · sale ${PESI.sale} · processata ${PESI.processata} · salse ${PESI.salse} · bonus fibra +${BONUS_FIBRA_MAX}`);
    console.log(`  una voce sotto ${VOCE_CRITICA}/10 mette un tetto di ${TETTO_SE_CRITICA}\n`);

    console.log('=== CONTROLLO DI TARATURA (guarda prima questo) ===');
    let falliti = 0;
    for (const t of CONTROLLO) {
      const p = validi.find(x => x.id === t.id);
      if (!p) { console.log(`  ??  ${t.nome.padEnd(38)} id non trovato`); falliti++; continue; }
      const ok = (t.atteso === 'sopra') === (p.calc.voto >= 7);
      if (!ok) falliti++;
      const d = p.calc.dettaglio;
      console.log(`  ${ok ? 'OK  ' : 'NO  '} ${t.nome.padEnd(38)} a mano ${String(p.aMano).padStart(4)}  v3 ${String(p.calc.voto).padStart(4)}  (atteso ${t.atteso} 7)   sat ${d.volteIlLimite.sat}x sale ${d.volteIlLimite.sale}x proc ${d.gProcessataPer100kcal}g${p.calc.critiche.length ? '  [tetto: ' + p.calc.critiche.join(',') + ']' : ''}`);
    }
    console.log(falliti ? `\n${falliti} controlli falliti: la formula NON e' tarata.\n` : '\nDieci su dieci.\n');

    const medio = validi.reduce((s, p) => s + p.scarto, 0) / validi.length;
    const assoluto = validi.reduce((s, p) => s + Math.abs(p.scarto), 0) / validi.length;
    console.log('=== scostamento dal voto a mano ===');
    console.log(`  medio ${medio.toFixed(2)} · medio assoluto ${assoluto.toFixed(2)}`);
    const fasce = { 'entro 0.5': 0, '0.5 - 1': 0, '1 - 2': 0, 'oltre 2': 0 };
    for (const p of validi) {
      const a = Math.abs(p.scarto);
      if (a <= 0.5) fasce['entro 0.5']++;
      else if (a <= 1) fasce['0.5 - 1']++;
      else if (a <= 2) fasce['1 - 2']++;
      else fasce['oltre 2']++;
    }
    Object.entries(fasce).forEach(([k, n]) =>
      console.log(`  ${k.padEnd(12)} ${String(n).padStart(5)}  (${(n / validi.length * 100).toFixed(1)}%)`));
    console.log('');

    const falsiPromossi = validi.filter(p => p.aMano >= 7 && p.calc.voto < 7).sort((a, b) => a.calc.voto - b.calc.voto);
    const falsiBocciati = validi.filter(p => p.aMano < 7 && p.calc.voto >= 7).sort((a, b) => b.calc.voto - a.calc.voto);
    console.log('=== la soglia 7 ===');
    console.log(`  passano oggi ma la ricetta non ci arriva:  ${falsiPromossi.length}`);
    console.log(`  bocciati oggi ma la ricetta regge:         ${falsiBocciati.length}\n`);

    const tabella = (titolo, righe, n) => {
      if (!righe.length) return;
      console.log(`=== ${titolo} ===`);
      righe.slice(0, n).forEach(p => {
        const d = p.calc.dettaglio;
        console.log(`  ${String(p.nome).slice(0, 40).padEnd(42)} ${String(p.slot || '').padEnd(10)} a mano ${String(p.aMano).padStart(4)}  v3 ${String(p.calc.voto).padStart(4)}   sat ${d.volteIlLimite.sat}x sale ${d.volteIlLimite.sale}x proc ${d.gProcessataPer100kcal}g${p.calc.critiche.length ? '  [' + p.calc.critiche.join(',') + ']' : ''}`);
      });
      if (righe.length > n) console.log(`  … (+${righe.length - n})`);
      console.log('');
    };

    tabella('passano la soglia ma non dovrebbero', falsiPromossi, 40);
    tabella('bocciati ma la ricetta regge', falsiBocciati, 25);

    console.log('=== quanto sono "a mano" i voti a mano: distribuzione ===');
    const conteggio = {};
    for (const p of validi) conteggio[p.aMano.toFixed(1)] = (conteggio[p.aMano.toFixed(1)] || 0) + 1;
    Object.entries(conteggio).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([v, n]) =>
      console.log(`  voto ${v.padStart(4)}  ${String(n).padStart(5)} piatti  (${(n / validi.length * 100).toFixed(1)}%)`));
    console.log('');

    console.log('=== scarto medio per slot ===');
    const perSlot = {};
    for (const p of validi) (perSlot[p.slot || '?'] ||= []).push(p.scarto);
    Object.entries(perSlot).sort((a, b) => b[1].length - a[1].length).forEach(([slot, v]) => {
      const m = v.reduce((s, x) => s + x, 0) / v.length;
      console.log(`  ${slot.padEnd(12)} ${String(v.length).padStart(5)} piatti   scarto medio ${m >= 0 ? '+' : ''}${m.toFixed(2)}`);
    });
  } finally {
    await c.end();
  }
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
