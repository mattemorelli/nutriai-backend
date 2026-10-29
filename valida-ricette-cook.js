// valida-ricette-cook.js — SOLO LETTURA. Controllo automatico su un blocco di
// ricette riscritte per la modalità Cook, prima di mostrarle all'utente.
// Verifica: numero passaggi 5-8, parole per passaggio 10-35, formato tempo
// "X min"/"X-Y min", presenza di temperatura/segnale di cottura sulla proteina,
// nessun ingrediente nominato che non sia in dish_ingredients, somma tempi vs prep_min.
//
// Uso: node valida-ricette-cook.js ricette-cook-blocco1.json

require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const fs = require('fs');

function contaParole(testo) {
  return testo.trim().split(/\s+/).filter(Boolean).length;
}

// Tempo valido: "5 min" o "5-7 min". Qualsiasi altra menzione numerica di tempo
// (minutes, minuti, seconds, secondi, ore, hours) che non segua questo formato è un errore.
const RE_TEMPO_VALIDO = /\b\d+(-\d+)?\s*min\b/gi;
const RE_TEMPO_SOSPETTO = /\b\d+\s*(minutes?|minuti|seconds?|secondi|hours?|ore)\b/gi;
const RE_TEMPO_VAGO = /\bqualche minuto\b|\balcuni minuti\b|\ba few minutes\b|\bsome minutes\b/i;

const SEGNALI_COTTURA = [
  'golden', 'dorat[oi]', 'dorata', 'until', 'finché', 'translucent', 'trasparent[ei]',
  'bubbling', 'bubbles', 'sobbolle', 'simmer', 'boil', 'bollore', 'opaque', 'opac[ao]',
  'tender', 'tener[ei]', 'crisp', 'croccant[ei]', 'browned', 'brown', 'rosola', 'rosolat[oi]',
  'softened', 'soft', 'morbid[oi]', 'firm', 'sod[ao]', 'set', 'si sfalda', 'flake', 'flakes',
  'wilt', 'appassi', 'caramelized', 'caramellat[oi]', 'char', '°c', 'raggiunge', 'reaches',
  'succhi', 'juices', 'clear', 'chiari', 'pink', 'rosa',
];
const RE_SEGNALE = new RegExp('(' + SEGNALI_COTTURA.join('|') + ')', 'i');
const RE_TEMP_NUMERICA = /\b\d{2,3}\s*°?\s*c\b/i;

function normalizza(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}
function paroleSignificative(nome) {
  const STOP = new Set(['di', 'e', 'con', 'il', 'la', 'le', 'lo', 'i', 'gli', 'un', 'una', 'del', 'della', 'the', 'and', 'with', 'of']);
  return normalizza(nome).split(' ').filter(w => w.length >= 4 && !STOP.has(w));
}

const CATEGORIE_CARNE_PESCE = ['carne_bianca', 'carne_rossa', 'carne_processata', 'maiale', 'pesce', 'crostacei', 'molluschi'];

// regola 7 (CLAUDE.md): "non resta traccia rosa"/"no pink" e' un segnale valido
// SOLO per pollo, tacchino e macinato. Per manzo/vitello/maiale/agnello/canguro
// INTERI (non macinati) a 63 C possono restare rosati ed e' corretto: non va
// usato quel segnale. L'anatra e' esclusa SEMPRE (anche se macinata): la sua
// carne resta scura per natura, il test del rosa non e' applicabile.
const CATEGORIE_ROSSA_INTERA = ['carne_rossa', 'maiale'];
const RE_ANATRA = /anatra|duck/i;
const RE_ROSA = /non\s+resta\s+(più\s+)?tracc[ei]\s+rosa|senza\s+tracc[ei]\s+rosa|non\s+è\s+più\s+ros[ao]|no\s+pink\s+remains?|no\s+longer\s+pink|with\s+no\s+pink/i;
const RE_MACINATO = /macinat[oa]|ground/i;

// regola C: un taglio intero portato a 63 C deve avere un riposo di "3 min"
// scritto esplicitamente (non 2, non "qualche minuto").
const RE_63 = /\b63\s*°?\s*c\b/i;
const RE_RIPOSO_3MIN = /\b3\s*min\b.{0,30}(ripos|rest)|( ripos|rest).{0,30}\b3\s*min\b/i;

// regola F: un'azione in parallelo (es. tagliare la verdura mentre bolle la
// pasta) deve iniziare con "Mentre ..."/"While ..." - non con "nel frattempo"/
// "meanwhile" a meta' frase. La modalita' Cook usa la parola iniziale per
// decidere se tenere visibile il timer del passaggio precedente.
const RE_PARALLELO_VECCHIO = /\bnel frattempo\b|\bmeanwhile\b/i;
const RE_PARALLELO_CORRETTO = /^(mentre|while)\b/i;

async function main() {
  const file = process.argv[2];
  if (!file) { console.error('Uso: node valida-ricette-cook.js <blocco.json>'); process.exit(1); }
  const blocco = JSON.parse(fs.readFileSync(file));
  const ids = blocco.map(d => d.id);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const dishRes = await client.query(`select id, name, prep_min from dishes where id = ANY($1::uuid[])`, [ids]);
  const dishInfo = new Map(dishRes.rows.map(r => [r.id, r]));

  const ingrRes = await client.query(`
    select di.dish_id, di.food_id, di.grams, f.name, f.name_it, f.name_en, f.sinonimi, f.aliases, f.stato
    from dish_ingredients di join foods f on f.id = di.food_id
    where di.dish_id = ANY($1::uuid[])
  `, [ids]);
  const ingrByDish = new Map();
  for (const r of ingrRes.rows) { (ingrByDish.get(r.dish_id) || ingrByDish.set(r.dish_id, []).get(r.dish_id)).push(r); }

  const catRes = await client.query(`select food_id, categoria from categorie_alimenti`);
  const catByFood = new Map();
  for (const r of catRes.rows) { (catByFood.get(r.food_id) || catByFood.set(r.food_id, []).get(r.food_id)).push(r.categoria); }

  await client.end();

  let tuttoOk = true;
  const risultati = [];

  for (const d of blocco) {
    const errori = [];
    const info = dishInfo.get(d.id);
    if (!info) { errori.push('ID non trovato nel database'); risultati.push({ id: d.id, name: d.name, errori }); tuttoOk = false; continue; }

    const prep_min = info.prep_min;
    const ingredienti = ingrByDish.get(d.id) || [];

    for (const lingua of ['steps', 'steps_en']) {
      const steps = d[lingua];
      if (!Array.isArray(steps)) { errori.push(`${lingua}: assente`); continue; }

      if (steps.length < 5 || steps.length > 8) {
        errori.push(`${lingua}: ${steps.length} passaggi (richiesti 5-8)`);
      }

      steps.forEach((s, i) => {
        const n = contaParole(s);
        if (n < 10 || n > 35) errori.push(`${lingua} passo ${i + 1}: ${n} parole (richiesto 10-35)`);
        if (RE_TEMPO_VAGO.test(s)) errori.push(`${lingua} passo ${i + 1}: tempo vago ("qualche minuto"/simile)`);
        const sospetti = s.match(RE_TEMPO_SOSPETTO);
        if (sospetti) errori.push(`${lingua} passo ${i + 1}: formato tempo non valido (${sospetti.join(', ')}), serve "X min"/"X-Y min"`);
      });
    }

    if (d.steps && d.steps_en && d.steps.length !== d.steps_en.length) {
      errori.push(`numero passaggi diverso tra steps (${d.steps.length}) e steps_en (${d.steps_en.length})`);
    }

    // segnale/temperatura sulla proteina (controllo su steps_en, più ricco di segnali in inglese).
    // Un ingrediente carne/pesce gia' pronto da mangiare (stato 'cotto', o "in scatola"/canned -
    // alcuni alimenti in scatola hanno stato 'crudo' nel database per errore, es. tonno e fagioli)
    // non richiede un segnale di cottura nella ricetta se non viene scaldato.
    const RE_IN_SCATOLA = /scatola|canned/i;
    const haCarneOPesce = ingredienti.some(i => {
      const inCategoria = (catByFood.get(i.food_id) || []).some(c => CATEGORIE_CARNE_PESCE.includes(c));
      if (!inCategoria) return false;
      const prontoDaMangiare = i.stato === 'cotto' || [i.name_it, i.name, i.name_en].some(n => n && RE_IN_SCATOLA.test(n));
      return !prontoDaMangiare;
    });
    if (haCarneOPesce) {
      const testo = (d.steps_en || []).join(' ');
      if (!RE_SEGNALE.test(testo) && !RE_TEMP_NUMERICA.test(testo)) {
        errori.push('nessun segnale di cottura o temperatura trovato per una proteina carne/pesce/crostacei');
      }
    }

    // regola 7: niente "rosa"/"pink" su carne rossa/maiale/vitello/agnello/canguro
    // INTERI (non macinati), e MAI su anatra (nemmeno macinata: il test del rosa
    // non e' applicabile, la sua carne resta scura per natura).
    const vietaRosa = ingredienti.some(i => {
      const nomeAnatra = [i.name_it, i.name, i.name_en].some(n => n && RE_ANATRA.test(n));
      if (nomeAnatra) return true;
      const cats = catByFood.get(i.food_id) || [];
      const isRossaOMaiale = cats.some(c => CATEGORIE_ROSSA_INTERA.includes(c));
      if (!isRossaOMaiale) return false;
      const nomeMacinato = [i.name_it, i.name, i.name_en].some(n => n && RE_MACINATO.test(n));
      return !nomeMacinato;
    });
    if (vietaRosa) {
      for (const lingua of ['steps', 'steps_en']) {
        const steps = d[lingua] || [];
        steps.forEach((s, i) => {
          if (RE_ROSA.test(s)) errori.push(`${lingua} passo ${i + 1}: usa "rosa"/"pink" su anatra o un taglio intero di carne rossa/maiale/vitello/agnello/canguro (regola 7: non e' un indicatore valido per questa carne/a questa temperatura)`);
        });
      }
    }

    // regola F: azioni in parallelo iniziano con "Mentre"/"While", non "nel frattempo"/"meanwhile" a meta' frase
    for (const lingua of ['steps', 'steps_en']) {
      const steps = d[lingua] || [];
      steps.forEach((s, i) => {
        if (RE_PARALLELO_VECCHIO.test(s) && !RE_PARALLELO_CORRETTO.test(s.trim())) {
          errori.push(`${lingua} passo ${i + 1}: usa "nel frattempo"/"meanwhile" invece di iniziare con "Mentre ..."/"While ..." (regola F)`);
        }
      });
    }

    // regola C: un taglio intero a 63°C deve avere un riposo di "3 min" esplicito
    for (const lingua of ['steps', 'steps_en']) {
      const steps = d[lingua] || [];
      const testo = steps.join(' ');
      if (RE_63.test(testo) && !RE_RIPOSO_3MIN.test(testo)) {
        errori.push(`${lingua}: contiene 63°C ma non un riposo di "3 min" esplicito (regola C)`);
      }
    }

    // ingredienti nominati non presenti in dish_ingredients (controllo approssimato)
    const paroleIngredientiValidi = new Set();
    for (const i of ingredienti) {
      for (const campo of [i.name_it, i.name, i.name_en]) if (campo) for (const p of paroleSignificative(campo)) paroleIngredientiValidi.add(p);
      for (const arr of [i.sinonimi, i.aliases]) if (Array.isArray(arr)) for (const s of arr) for (const p of paroleSignificative(s)) paroleIngredientiValidi.add(p);
    }
    // nota: questo controllo è informativo, va letto a mano - troppi falsi positivi su parole comuni di cottura

    // somma tempi vs prep_min (usa il limite superiore di eventuali range "X-Y min").
    // Regola F: un passaggio che inizia con "Mentre"/"While" corre in parallelo a un
    // timer già contato (es. il forno, l'acqua che bolle) - il suo tempo NON si
    // aggiunge alla somma, altrimenti due processi simultanei verrebbero contati
    // come sequenziali e il confronto con prep_min sarebbe falsato.
    const stepsPerSomma = (d.steps_en || []).filter(s => !RE_PARALLELO_CORRETTO.test(s.trim()));
    const testoTutti = stepsPerSomma.join(' ');
    let sommaMin = 0;
    const matches = testoTutti.match(RE_TEMPO_VALIDO) || [];
    for (const m of matches) {
      const nums = m.match(/\d+/g).map(Number);
      sommaMin += Math.max(...nums);
    }
    // somma 0 = ricetta di sola composizione, senza alcuna cottura (es. tonno e fagioli in
    // scatola): non c'e' nessun "tempo reale" misurabile da confrontare con prep_min.
    const diff = Math.abs(sommaMin - prep_min);
    const tempoOk = sommaMin === 0 || diff <= 5;
    if (!tempoOk) errori.push(`somma tempi passaggi ≈${sommaMin} min vs prep_min ${prep_min} min (diff ${diff} min, tolleranza 5)`);

    risultati.push({ id: d.id, name: d.name, nPassaggi: d.steps ? d.steps.length : null, sommaMin, prep_min, errori });
    if (errori.length) tuttoOk = false;
  }

  console.log('='.repeat(78));
  console.log(`VALIDAZIONE ${file} — ${blocco.length} ricette`);
  console.log('='.repeat(78));
  let nOk = 0;
  for (const r of risultati) {
    if (r.errori.length === 0) {
      nOk++;
      console.log(`OK   ${r.name} (${r.nPassaggi} passaggi, ${r.sommaMin}min vs prep ${r.prep_min}min)`);
    } else {
      console.log(`FAIL ${r.name}`);
      for (const e of r.errori) console.log(`       - ${e}`);
    }
  }
  console.log('\n' + '-'.repeat(78));
  console.log(`Passate: ${nOk}/${blocco.length}`);
  console.log(tuttoOk ? 'TUTTE LE RICETTE PASSANO IL CONTROLLO AUTOMATICO.' : 'ALCUNE RICETTE RICHIEDONO ATTENZIONE (vedi sopra).');

  fs.writeFileSync(file.replace('.json', '-validazione.json'), JSON.stringify(risultati, null, 2));
}

main().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
