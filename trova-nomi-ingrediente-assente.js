// trova-nomi-ingrediente-assente.js — SOLA LETTURA. Confronta ogni parola
// del nome italiano di ogni piatto con foods.name_it + i sinonimi, su
// TUTTO il catalogo (non solo i 14 ingredienti usati nell'audit che ha
// portato alle correzioni di questa settimana). Segnala i piatti dove una
// parola del nome corrisponde a un alimento che NON è tra i suoi
// ingredienti veri.
//
// ATTENZIONE, letto dall'audit che ha prodotto questa lista: la maggior
// parte dei risultati grezzi sono falsi positivi, per due motivi noti,
// già verificati a campione:
//   1. parole generiche (insalata, zuppa, verdure, salsa, formaggio,
//      pesce...) che compaiono per caso nel sinonimo di UN prodotto
//      specifico - una zuppa di pesce ha davvero il pesce (es. merluzzo),
//      solo non un prodotto chiamato genericamente "pesce". Lista
//      RUMORE_STEM sotto, verificata a mano una per una.
//   2. salse composte da ingredienti base (chimichurri, vinaigrette):
//      hanno davvero olio+aceto+erbe tracciati singolarmente, non un
//      prodotto unico - non è un errore, è come il catalogo li modella.
// Lo stem (ultima vocale finale troncata) serve a far coincidere
// singolare/plurale italiano (barbabietola/barbabietole) - è un'euristica
// grezza, non un vero stemmer.
//
// Il residuo dopo il filtro (oggi 126 candidati) NON è tutto genuino: su
// un campione verificato a mano, circa metà erano ancora falsi (parola
// generica non ancora in RUMORE_STEM, o l'ingrediente c'è sotto un'altra
// forma - es. "formaggio" soddisfatto da Emmental). Stima onesta, non un
// conteggio esatto: ~55-65 casi genuini nel residuo. Vanno verificati uno
// per uno contro dish_ingredients prima di correggere qualcosa -
// esattamente come i 26 di questa settimana.
//
// Uso: node trova-nomi-ingrediente-assente.js
require('dotenv').config({ quiet: true });
const { Client } = require('pg');

const STOP = new Set(['di','del','della','dello','dei','degli','delle','senza','con','e','ed','a',
  'al','allo','alla','ai','agli','alle','in','su','per','tra','fra','da','il','lo','la','i','gli','le','un','una',
  'fresco','fresca','freschi','fresche','secco','secca','secchi','secche','intero','intera','interi','intere',
  'grande','grandi','piccolo','piccola','piccoli','piccole','extra','vergine','biologico','biologica',
  'cotto','cotta','cotti','cotte','crudo','cruda','crudi','crude','rosso','rossa','rossi','rosse',
  'bianco','bianca','bianchi','bianche','verde','verdi','giallo','gialla','gialli','gialle','dolce','dolci',
  'style','nostro','nostra','come','base','classico','classica','rapido','rapida']);

// Parole-stem confermate rumore (vedi nota in testa) - una voce qui
// copre tutte le forme singolare/plurale/maschile/femminile che condividono
// lo stesso stem (es. 'legger' copre leggera/leggero/leggeri/leggère).
const RUMORE_STEM = new Set(['insalat','zupp','verdur','erb','legger','tedesc','crem','asiatic','tostat',
  'sals','frutt','ingles','pomodorin','grec','budin','sod','integral','bosc','sal','compost','fett',
  'involtin','muesl','tortill','chimichurr','vinaigrett','magr']);

function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
function parole(s) { return norm(s).split(/[^a-z]+/).filter(w => w.length >= 4 && !STOP.has(w)); }
function stem(w) { return w.replace(/[aeiou]$/, ''); }

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  const { rows: foods } = await c.query('select id, name_it, sinonimi from foods');
  const { rows: dishes } = await c.query('select id, name, name_en from dishes');
  const { rows: ing } = await c.query('select dish_id, food_id from dish_ingredients');

  const dizionario = new Map(); // stem -> Set(food_id)
  for (const f of foods) {
    const varianti = new Set();
    for (const w of parole(f.name_it)) varianti.add(w);
    for (const s of (f.sinonimi || [])) for (const w of parole(s)) varianti.add(w);
    for (const w of varianti) {
      const st = stem(w);
      if (!dizionario.has(st)) dizionario.set(st, new Set());
      dizionario.get(st).add(f.id);
    }
  }

  const ingByDish = new Map();
  for (const r of ing) { if (!ingByDish.has(r.dish_id)) ingByDish.set(r.dish_id, new Set()); ingByDish.get(r.dish_id).add(r.food_id); }

  const candidati = [];
  for (const d of dishes) {
    const miei = ingByDish.get(d.id) || new Set();
    for (const w of parole(d.name)) {
      const st = stem(w);
      if (RUMORE_STEM.has(st)) continue;
      const cand = dizionario.get(st);
      if (!cand) continue;
      const presente = [...cand].some(fid => miei.has(fid));
      if (!presente) candidati.push({ id: d.id, nome: d.name, nome_en: d.name_en, parola: w });
    }
  }

  console.log(`${candidati.length} candidati residui (dopo il filtro rumore) su ${dishes.length} piatti.\n`);
  console.log('Per tipo (parola trovata nel nome), i gruppi piu\' frequenti:');
  const conta = new Map();
  for (const cnd of candidati) conta.set(cnd.parola, (conta.get(cnd.parola) || 0) + 1);
  [...conta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).forEach(([p, n]) => console.log(`  ${n}  ${p}`));

  require('fs').writeFileSync('candidati-nomi-assenti.json', JSON.stringify(candidati, null, 1));
  console.log('\nElenco completo in candidati-nomi-assenti.json - verificare a mano contro dish_ingredients prima di correggere.');

  await c.end();
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
