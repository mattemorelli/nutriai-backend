require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');
const { calcolaVoto, modificatoriDa, categoriaDa } = require('./voto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const FILE = 'dati/off.csv.gz';
const PAESE = process.argv[2] || 'italy';
const SOLO_PROVA = process.argv.includes('--prova');
const BLOCCO = 500;

const CATEGORIE_UTILI = /en:(fishes|seafood|meats|dairies|cheeses|eggs|cereals|legumes|pastas|rices|flours|vegetables|fruits|olive-oils|vegetable-oils|canned|frozen|yogurts|milks|breads|chocolates|coffees|nuts|honeys)/;

// indici di colonna, dalla riga di intestazione
let COL = {};

function leggiIntestazione(riga) {
  const nomi = riga.split('\t');
  COL = {
    code: nomi.indexOf('code'),
    nome: nomi.indexOf('product_name'),
    quantita: nomi.indexOf('quantity'),
    packaging_tags: nomi.indexOf('packaging_tags'),
    brands: nomi.indexOf('brands'),
    categories_tags: nomi.indexOf('categories_tags'),
    origins: nomi.indexOf('origins'),
    labels_tags: nomi.indexOf('labels_tags'),
    countries_tags: nomi.indexOf('countries_tags'),
    ingredients_tags: nomi.indexOf('ingredients_tags'),
    nova: nomi.indexOf('nova_group'),
    additivi: nomi.indexOf('additives_n'),
    nutriscore: nomi.indexOf('nutriscore_grade'),
    luogo_produzione: nomi.indexOf('manufacturing_places'),
  };
}

function aProdotto(campi) {
  const lista = (i) => (campi[i] || '').split(',').filter(Boolean);
  return {
    code: campi[COL.code],
    product_name: campi[COL.nome],
    brands: campi[COL.brands] || null,
    quantity: campi[COL.quantita] || null,
    origins: campi[COL.origins] || '',
    categories_tags: lista(COL.categories_tags),
    labels_tags: lista(COL.labels_tags),
    packaging_tags: lista(COL.packaging_tags),
    ingredients_tags: lista(COL.ingredients_tags),
    manufacturing_places: campi[COL.luogo_produzione] || '',
  };
}

(async () => {
  // dati di riferimento, caricati una volta sola
  const { data: categorie } = await supabase.from('impatto_categorie').select('*');
  const { data: pesi } = await supabase.from('voto_pesi').select('*');
  const { data: modificatori } = await supabase.from('voto_modificatori').select('*');

  const baseDi = {};
  for (const c of categorie || []) baseDi[c.categoria] = c;
  const pesiDi = { vegetale: [], animale: [] };
  for (const p of pesi || []) pesiDi[p.tipo_prodotto].push(p);

  const flusso = readline.createInterface({
    input: fs.createReadStream(FILE).pipe(zlib.createGunzip()),
    crlfDelay: Infinity,
  });

  let riga = 0, tenuti = 0, scartati = 0, scritti = 0;
  let buffer = [];

  const svuota = async () => {
    if (!buffer.length) return;
    // Nell'esportazione lo stesso barcode può comparire più volte:
    // Postgres rifiuta il blocco se ne trova due, quindi teniamo l'ultimo.
    const unici = [...new Map(buffer.map(r => [r.barcode, r])).values()];
    if (!SOLO_PROVA) {
      const { error } = await supabase.from('prodotti')
        .upsert(unici, { onConflict: 'barcode' });
      if (error) console.error('  errore scrittura:', error.message);
      else scritti += unici.length;
    } else {
      scritti += buffer.length;
    }
    buffer = [];
  };

  for await (const linea of flusso) {
    riga++;
    if (riga === 1) { leggiIntestazione(linea); continue; }

    const campi = linea.split('\t');
    if (!campi[COL.countries_tags]?.includes(`en:${PAESE}`)) continue;
    if (!campi[COL.nome]) continue;
    if (!CATEGORIE_UTILI.test(campi[COL.categories_tags] || '')) continue;

    const p = aProdotto(campi);
    const categoria = categoriaDa(p);
    if (!categoria || !baseDi[categoria]) {
      scartati++;
      if (SOLO_PROVA && scartati % 500 === 0) {
        console.log(`\n  scartato: ${p.product_name} | ${(p.categories_tags[p.categories_tags.length-1] || '?')}`);
      }
      continue;
    }

    const base = baseDi[categoria];
    const codici = modificatoriDa({ ...p, tipo_prodotto: base.tipo_prodotto, paese_utente: 'it' }, categoria);
    const mod = (modificatori || []).filter(m =>
      codici.includes(m.codice) && (!m.categorie || m.categorie.includes(categoria)));

    const voto = calcolaVoto({ base, pesi: pesiDi[base.tipo_prodotto], modificatori: mod });

    buffer.push({
      barcode: p.code,
      nome: p.product_name.slice(0, 200),
      marca: p.brands ? p.brands.split(',')[0].slice(0, 100) : null,
      paese: PAESE,
      nova_group: campi[COL.nova] ? Number(campi[COL.nova]) : null,
      additivi_n: campi[COL.additivi] !== '' ? Number(campi[COL.additivi]) : null,
      nutri_score: /^[a-e]$/i.test(campi[COL.nutriscore] || '')
        ? campi[COL.nutriscore].toLowerCase()
        : null,
      punteggio_ambientale: voto.punteggio,
      certificazioni: p.labels_tags.slice(0, 20),
      origine: p.origins ? p.origins.slice(0, 200) : null,
      categoria_riconosciuta: categoria,
      voto_json: { ...voto, nome: p.product_name, marca: p.brands, barcode: p.code },
      fonte: 'openfoodfacts-export',
      aggiornato_il: new Date().toISOString(),
    });
    tenuti++;

    if (buffer.length >= BLOCCO) {
      await svuota();
      process.stdout.write(`\r  tenuti ${tenuti} | scritti ${scritti} | scartati ${scartati}`);
    }
  }
  await svuota();
  console.log(`\n\nFatto. Tenuti ${tenuti}, scritti ${scritti}, scartati ${scartati} (categoria non riconosciuta)`);
})();