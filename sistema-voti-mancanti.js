// Ricalcola voto_ambientale (e punteggio_ambientale) per i prodotti che ne sono privi.
//
// Perche' si erano fermati:
// - importa-catalogo.js (import bulk da CSV OFF) calcola sempre punteggio_ambientale,
//   ma non scrive MAI voto_ambientale: quella conversione punteggio->lettera esiste
//   solo qui e in arricchisci-mancanti.js.
// - Il CSV bulk ha spesso labels_tags/ingredients_tags/packaging_tags/origins vuoti,
//   quindi modificatoriDa() non trova nulla e calcolaVoto() restituisce esattamente 50
//   (nessuno spostamento dal centro): e' il caso "confidenza: categoria" in voto_json.
// - arricchisci-mancanti.js (l'unico script che scrive voto_ambientale) tratta
//   punteggio===50 come "nessun dato" e salta la riga di proposito - e in piu' era
//   limitato a paese=italy, 8 categorie, marche con >=5 prodotti, 15 righe a lancio:
//   ecco perche' 24.331 righe restavano fuori.
//
// Questo script NON cambia la formula (calcolaVoto/modificatoriDa/categoriaDa da
// voto.js, invariati) ne' la soglia punteggio->lettera (75/62/52/40/25, la stessa
// gia' in uso per i 39.361 voti esistenti: verificata contro i min/max reali in db).
// Amplia solo l'ambito: tutte le righe con voto_ambientale nullo, non solo il
// sottoinsieme italy/8-categorie/marche-frequenti/15-alla-volta.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { calcolaVoto, modificatoriDa, categoriaDa } = require('./voto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

// Pausa di base fra una richiesta e l'altra. Un primo lancio a 650ms ha preso
// il 60% di 429 (troppe richieste) da Open Food Facts: qui si parte piu' larghi
// e si regola da soli in base a come risponde l'API (vedi pausaAttuale sotto).
const PAUSA_BASE = Number(process.argv.find(a => a.startsWith('--pausa='))?.split('=')[1]) || 3000;
const LIMITE = Number(process.argv.find(a => a.startsWith('--limite='))?.split('=')[1]) || Infinity;
const MAX_TENTATIVI = 5;
const LOG = 'sistema-voti-log.jsonl';
const CAMPI = 'code,product_name,brands,categories_tags,labels_tags,ingredients_tags,'
  + 'packaging_tags,origins,manufacturing_places,nova_group,additives_n';

const attesa = (ms) => new Promise(r => setTimeout(r, ms));

// Pausa adattiva: sale quando l'API risponde 429, scende piano dopo una
// striscia di successi. Non e' la formula del voto, e' solo il ritmo delle
// chiamate HTTP.
let pausaAttuale = PAUSA_BASE;
let successiDiFila = 0;

function alza429() {
  successiDiFila = 0;
  pausaAttuale = Math.min(pausaAttuale * 2, 60000);
}

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

// Un 429 non significa "nessun dato": significa "riprova piu' tardi". Prima
// veniva trattato come un errore definitivo e la riga saltata per sempre.
async function schedaConRetry(barcode) {
  for (let tentativo = 1; tentativo <= MAX_TENTATIVI; tentativo++) {
    const r = await scheda(barcode);
    if (!r.errore) {
      abbassaDopoSuccesso();
      return r;
    }
    if (r.errore === 429) alza429();
    if (tentativo === MAX_TENTATIVI) return r;
    await attesa(pausaAttuale);
  }
}

function scrivi(riga) {
  fs.appendFileSync(LOG, JSON.stringify(riga) + '\n');
}

(async () => {
  const { data: categorie } = await supabase.from('impatto_categorie').select('*');
  const { data: pesi } = await supabase.from('voto_pesi').select('*');
  const { data: modificatori } = await supabase.from('voto_modificatori').select('*');
  const baseDi = {}; for (const c of categorie) baseDi[c.categoria] = c;
  const pesiDi = { vegetale: [], animale: [] };
  for (const p of pesi) pesiDi[p.tipo_prodotto].push(p);

  // PostgREST limita a 1000 righe per risposta: va paginato con .range(),
  // altrimenti restano fuori le stesse righe di cui sopra.
  const daFare = [];
  const PAGINA = 1000;
  for (let offset = 0; ; offset += PAGINA) {
    const { data: blocco, error: errFetch } = await supabase
      .from('prodotti')
      .select('barcode, nome, marca, categoria_riconosciuta, paese')
      .is('voto_ambientale', null)
      .range(offset, offset + PAGINA - 1);
    if (errFetch) { console.error('Errore lettura prodotti:', errFetch.message); process.exit(1); }
    daFare.push(...blocco);
    if (blocco.length < PAGINA) break;
  }

  const lista = daFare.slice(0, LIMITE);
  console.log(`Da sistemare: ${lista.length} (su ${daFare.length} totali senza voto_ambientale)\n`);

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

    // Stessa soglia punteggio->lettera gia' in uso per i voti esistenti
    // (verificata contro i min/max reali di voto_ambientale in db).
    const lettera =
      voto.punteggio >= 75 ? 'A' : voto.punteggio >= 62 ? 'B' :
      voto.punteggio >= 52 ? 'C' : voto.punteggio >= 40 ? 'D' :
      voto.punteggio >= 25 ? 'E' : 'F';

    const { error: errUpdate } = await supabase.from('prodotti').update({
      punteggio_ambientale: voto.punteggio,
      voto_ambientale: lettera,
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
