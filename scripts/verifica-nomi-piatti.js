// Controllo permanente sui NOMI dei piatti (name/name_en su dishes) - nato
// il 23 ottobre dall'audit richiesto dopo aver trovato nomi come
// "Pecorino con fave (proxy lenticchie)" arrivati fino al catalogo: note
// tecniche o interne (promemoria di chi ha scritto la ricetta) che un utente
// non deve mai leggere nel nome di un piatto.
//
// Cerca parole come "proxy", "test", "tmp", "todo" e parentesi con un
// termine tecnico/interno dentro (es. "(contorno)", "(spuntino)" usate solo
// per distinguere due righe altrimenti omonime - quell'informazione esiste
// già nel campo meal_slot, non deve stare nel nome).
//
// Fa fallire il controllo (errore, blocca il push) solo per i piatti del
// mercato 'it' - sono gli unici che arrivano davvero a un utente oggi
// (MERCATO_ATTIVO in genera.js). Per gli altri mercati stampa un avviso
// (non blocca), cosi' resta visibile per quando quei mercati si attiveranno.
//
// SOLA LETTURA: non scrive mai nulla.
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const PATTERN = [
  /\bproxy\b/i,
  /\btest\b/i,
  /\btmp\b/i,
  /\btodo\b/i,
  /\bfixme\b/i,
  /\bwip\b/i,
  /\bplaceholder\b/i,
  /\bdummy\b/i,
  /\bxxx\b/i,
  /\bdebug\b/i,
  /\bbozza\b/i,
  /\(\s*(contorno|spuntino|colazione|primo|secondo|dolce|snack|side|breakfast|bis)\s*\)/i,
];

async function leggiTutto(query) {
  const PAGINA = 1000;
  let risultato = [];
  for (let offset = 0; ; offset += PAGINA) {
    const { data, error } = await query.range(offset, offset + PAGINA - 1);
    if (error) throw error;
    risultato = risultato.concat(data);
    if (data.length < PAGINA) break;
  }
  return risultato;
}

(async () => {
  const dishes = await leggiTutto(supabase.from('dishes').select('id, name, name_en, mercati').order('id'));
  const sospetti = [];
  for (const d of dishes) {
    for (const [campo, valore] of [['name', d.name], ['name_en', d.name_en]]) {
      if (!valore) continue;
      if (PATTERN.some((re) => re.test(valore))) {
        sospetti.push({ id: d.id, campo, valore, mercati: d.mercati || [] });
        break;
      }
    }
  }

  const inMercatoIt = sospetti.filter((s) => s.mercati.includes('it'));
  const altri = sospetti.filter((s) => !s.mercati.includes('it'));

  console.log(`${dishes.length} piatti controllati, ${sospetti.length} nomi sospetti trovati.`);

  if (altri.length) {
    console.log(`\n${altri.length} avvisi (non bloccanti - piatti non ancora nel mercato 'it', non arrivano a nessun utente oggi):`);
    for (const s of altri) console.log(`  - [${s.id}] ${s.campo} = "${s.valore}"`);
  }

  if (inMercatoIt.length) {
    console.log(`\n${inMercatoIt.length} piatti del mercato 'it' con nome sospetto (QUESTI arrivano a un utente vero):`);
    for (const s of inMercatoIt) console.log(`  - [${s.id}] ${s.campo} = "${s.valore}"`);
    throw new Error(`${inMercatoIt.length} nomi sospetti nel mercato 'it' - correggili prima di proseguire.`);
  }

  console.log('\nNessun nome sospetto nel mercato \'it\'.');
})().catch((e) => { console.error('\nERRORE:', e.message); process.exitCode = 1; });
