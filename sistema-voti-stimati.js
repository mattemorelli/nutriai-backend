// Riprende sistema-voti-mancanti.js (P1, 2026-09-12): quella corsa di agosto
// mirava a voto_ambientale IS NULL, ma oggi 0 righe sono NULL - tutte le
// 24.776 rimaste senza dati reali sono state chiuse con un fallback
// (voto_stimato=true, punteggio dal percentile di categoria) da
// ricalcola-ambientale-fase3.js, che lavora sui campi gia' in tabella
// (spesso vuoti nel CSV bulk), non su una chiamata OFF live.
//
// Il log storico (sistema-voti-log.jsonl) mostra che la corsa di agosto si
// e' fermata dopo 717 tentativi su 24.329 candidati (5 recuperati, 632
// confermati neutri anche con dati freschi, 78 errori di rete, 2 di
// scrittura) - si e' interrotta, non ha finito. Questo script riprende da
// li': stesso identico calcolo (calcolaVoto/modificatoriDa/categoriaDa da
// voto.js, stessa soglia punteggio->lettera), stesso log
// (sistema-voti-log.jsonl, append), ma la lista di partenza e'
// voto_stimato=true ESCLUSI i barcode gia' definitivamente verificati
// (esito 'sistemato' o 'neutro_anche_con_dati_freschi') - quelli restano
// verificati, non serve richiamare OFF una seconda volta per la stessa
// risposta. I barcode con errore (rete/scrittura) vengono ritentati.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { calcolaVoto, modificatoriDa, categoriaDa } = require('./voto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const PAUSA_BASE = Number(process.argv.find(a => a.startsWith('--pausa='))?.split('=')[1]) || 3000;
const LIMITE = Number(process.argv.find(a => a.startsWith('--limite='))?.split('=')[1]) || Infinity;
const MAX_TENTATIVI = 5;
const LOG = 'sistema-voti-log.jsonl';
const CAMPI = 'code,product_name,brands,categories_tags,labels_tags,ingredients_tags,'
  + 'packaging_tags,origins,manufacturing_places,nova_group,additives_n';

const attesa = (ms) => new Promise(r => setTimeout(r, ms));

let pausaAttuale = PAUSA_BASE;
let successiDiFila = 0;
function alza429() { successiDiFila = 0; pausaAttuale = Math.min(pausaAttuale * 2, 60000); }
function abbassaDopoSuccesso() {
  successiDiFila++;
  if (successiDiFila >= 20 && pausaAttuale > PAUSA_BASE) {
    pausaAttuale = Math.max(PAUSA_BASE, Math.round(pausaAttuale * 0.85));
    successiDiFila = 0;
  }
}

async function scheda(barcode) {
  try {
    const r = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${CAMPI}`,
      { headers: { 'User-Agent': 'Sorrel/0.1 (sorrel.app)' } }
    );
    if (!r.ok) return { errore: r.status };
    const t = await r.text();
    const d = JSON.parse(t);
    return d.status === 1 ? { prodotto: d.product } : { vuoto: true };
  } catch (e) {
    return { errore: e.message };
  }
}

async function schedaConRetry(barcode) {
  for (let tentativo = 1; tentativo <= MAX_TENTATIVI; tentativo++) {
    const r = await scheda(barcode);
    if (!r.errore) { abbassaDopoSuccesso(); return r; }
    if (r.errore === 429) alza429();
    if (tentativo === MAX_TENTATIVI) return r;
    await attesa(pausaAttuale);
  }
}

function scrivi(riga) { fs.appendFileSync(LOG, JSON.stringify(riga) + '\n'); }

(async () => {
  const { data: categorie } = await supabase.from('impatto_categorie').select('*');
  const { data: pesi } = await supabase.from('voto_pesi').select('*');
  const { data: modificatori } = await supabase.from('voto_modificatori').select('*');
  const baseDi = {}; for (const c of categorie) baseDi[c.categoria] = c;
  const pesiDi = { vegetale: [], animale: [] };
  for (const p of pesi) pesiDi[p.tipo_prodotto].push(p);

  // Barcode gia' definitivamente verificati nella corsa di agosto: non
  // richiamare OFF una seconda volta per una risposta gia' nota.
  const giaVerificati = new Set();
  if (fs.existsSync(LOG)) {
    for (const riga of fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean)) {
      const r = JSON.parse(riga);
      if (r.esito === 'sistemato' || r.esito === 'neutro_anche_con_dati_freschi') giaVerificati.add(r.barcode);
    }
  }
  console.log(`Barcode gia' verificati in un run precedente (esclusi): ${giaVerificati.size}`);

  const daFare = [];
  const PAGINA = 1000;
  for (let offset = 0; ; offset += PAGINA) {
    const { data: blocco, error: errFetch } = await supabase
      .from('prodotti')
      .select('barcode, nome, marca, categoria_riconosciuta, paese')
      .eq('voto_stimato', true)
      .order('barcode')
      .range(offset, offset + PAGINA - 1);
    if (errFetch) { console.error('Errore lettura prodotti:', errFetch.message); process.exit(1); }
    daFare.push(...blocco);
    if (blocco.length < PAGINA) break;
  }

  const candidati = daFare.filter(p => !giaVerificati.has(p.barcode));
  // --campione prende una fetta distribuita su tutta la lista (ordinata per
  // barcode) invece dei primi N: i primi barcode potrebbero corrispondere a
  // un produttore/paese con dati OFF sistematicamente migliori o peggiori.
  const CAMPIONE = Number(process.argv.find(a => a.startsWith('--campione='))?.split('=')[1]) || null;
  let lista;
  if (CAMPIONE) {
    const passo = Math.max(1, Math.floor(candidati.length / CAMPIONE));
    lista = [];
    for (let i = 0; i < candidati.length && lista.length < CAMPIONE; i += passo) lista.push(candidati[i]);
  } else {
    lista = candidati.slice(0, LIMITE);
  }
  console.log(`voto_stimato=true totali: ${daFare.length} | da provare ora: ${candidati.length} | in questo lancio: ${lista.length}\n`);

  let ok = 0, nonTrovati = 0, senzaCategoria = 0, ancoraNeutri = 0, errori = 0;
  const t0 = Date.now();

  for (let i = 0; i < lista.length; i++) {
    const p = lista[i];
    const r = await schedaConRetry(p.barcode);

    if (r.errore) {
      errori++;
      scrivi({ barcode: p.barcode, nome: p.nome, esito: 'errore_rete', dettaglio: r.errore });
      await attesa(pausaAttuale);
      continue;
    }
    if (r.vuoto) {
      nonTrovati++;
      scrivi({ barcode: p.barcode, nome: p.nome, esito: 'non_trovato_su_off' });
      await attesa(pausaAttuale);
      continue;
    }

    const off = r.prodotto;
    const categoria = categoriaDa(off) || p.categoria_riconosciuta;
    const base = baseDi[categoria];
    if (!base) {
      senzaCategoria++;
      scrivi({ barcode: p.barcode, nome: p.nome, esito: 'categoria_senza_dati_impatto', categoria });
      await attesa(pausaAttuale);
      continue;
    }

    const codici = modificatoriDa(
      { ...off, tipo_prodotto: base.tipo_prodotto, paese_utente: 'it' }, categoria);
    const mod = modificatori.filter(m =>
      codici.includes(m.codice) && (!m.categorie || m.categorie.includes(categoria)));

    const voto = calcolaVoto({ base, pesi: pesiDi[base.tipo_prodotto], modificatori: mod });

    if (voto.punteggio === 50) {
      ancoraNeutri++;
      scrivi({ barcode: p.barcode, nome: p.nome, esito: 'neutro_anche_con_dati_freschi', categoria });
      await attesa(pausaAttuale);
      continue;
    }

    const lettera =
      voto.punteggio >= 75 ? 'A' : voto.punteggio >= 62 ? 'B' :
      voto.punteggio >= 52 ? 'C' : voto.punteggio >= 40 ? 'D' :
      voto.punteggio >= 25 ? 'E' : 'F';

    const { error: errUpdate } = await supabase.from('prodotti').update({
      punteggio_ambientale: voto.punteggio,
      voto_ambientale: lettera,
      voto_stimato: false,
      certificazioni: off.labels_tags || [],
      nova_group: off.nova_group ? Number(off.nova_group) : null,
      additivi_n: off.additives_n != null ? Number(off.additives_n) : null,
      voto_json: { ...voto, nome: off.product_name, marca: off.brands, barcode: p.barcode },
      fonte: 'openfoodfacts-api',
      aggiornato_il: new Date().toISOString(),
    }).eq('barcode', p.barcode);

    if (errUpdate) {
      errori++;
      scrivi({ barcode: p.barcode, nome: p.nome, esito: 'errore_scrittura_db', dettaglio: errUpdate.message });
    } else {
      ok++;
      scrivi({ barcode: p.barcode, nome: p.nome, esito: 'sistemato', punteggio: voto.punteggio, voto: lettera });
    }

    if (i % 50 === 0) {
      const min = ((Date.now() - t0) / 60000).toFixed(0);
      const restano = (((lista.length - i) * pausaAttuale) / 60000).toFixed(0);
      process.stdout.write(
        `\r  ${i}/${lista.length} | sistemati ${ok} | non trovati ${nonTrovati} | ` +
        `neutri ${ancoraNeutri} | senza categoria ${senzaCategoria} | errori ${errori} | ` +
        `pausa ${pausaAttuale}ms | ${min} min trascorsi, ~${restano} min rimasti   `);
    }
    await attesa(pausaAttuale);
  }

  console.log(`\n\nFatto. Sistemati: ${ok} | non trovati su OFF: ${nonTrovati} | ` +
    `restati neutri (50): ${ancoraNeutri} | categoria senza dati: ${senzaCategoria} | errori: ${errori}`);
})();
