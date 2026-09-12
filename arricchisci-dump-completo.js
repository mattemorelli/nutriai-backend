// Fase 1 — arricchisce i 63.692 prodotti con i campi OFF non ancora salvati
// (labels_tags, packaging_tags, ingredients_tags, origins, manufacturing_places,
// nova_group, additives_n, nutri_score) e i nutrienti grezzi per il voto_salute
// (Fase 2), leggendo il dump completo scaricato in dati/off-fresh.csv.gz.
// Nessuna chiamata API: un'unica passata sul file.
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const zlib = require('zlib');
const readline = require('readline');

const FILE = process.argv[2] || 'dati/off-fresh.csv.gz';
const BLOCCO = 500;

let COL = {};
function leggiIntestazione(riga) {
  const nomi = riga.split('\t');
  const idx = (nome) => nomi.indexOf(nome);
  COL = {
    code: idx('code'),
    labels_tags: idx('labels_tags'),
    packaging_tags: idx('packaging_tags'),
    ingredients_tags: idx('ingredients_tags'),
    origins: idx('origins'),
    manufacturing_places: idx('manufacturing_places'),
    nova_group: idx('nova_group'),
    additives_n: idx('additives_n'),
    nutriscore_grade: idx('nutriscore_grade'),
    nutriscore_score: idx('nutriscore_score'),
    energy_kcal: idx('energy-kcal_100g'),
    saturated_fat: idx('saturated-fat_100g'),
    sugars: idx('sugars_100g'),
    fiber: idx('fiber_100g'),
    proteins: idx('proteins_100g'),
    salt: idx('salt_100g'),
  };
  for (const [k, v] of Object.entries(COL)) {
    if (v === -1) throw new Error(`Colonna non trovata nel CSV: ${k}`);
  }
}

const lista = (v) => (v || '').split(',').filter(Boolean);
const num = (v) => (v !== '' && v != null && !isNaN(Number(v))) ? Number(v) : null;

async function scrivi(client, batch) {
  if (!batch.length) return;
  await client.query(
    `update prodotti p set
       certificazioni = case when jsonb_array_length(coalesce(elem->'labels_tags','[]'::jsonb)) > 0
                              then array(select jsonb_array_elements_text(elem->'labels_tags'))
                              else p.certificazioni end,
       packaging_tags = case when jsonb_array_length(coalesce(elem->'packaging_tags','[]'::jsonb)) > 0
                              then array(select jsonb_array_elements_text(elem->'packaging_tags'))
                              else p.packaging_tags end,
       ingredients_tags = case when jsonb_array_length(coalesce(elem->'ingredients_tags','[]'::jsonb)) > 0
                              then array(select jsonb_array_elements_text(elem->'ingredients_tags'))
                              else p.ingredients_tags end,
       origine = coalesce(nullif(elem->>'origins',''), p.origine),
       manufacturing_places = coalesce(nullif(elem->>'manufacturing_places',''), p.manufacturing_places),
       nova_group = coalesce((elem->>'nova_group')::int, p.nova_group),
       additivi_n = coalesce((elem->>'additivi_n')::int, p.additivi_n),
       nutri_score = coalesce(elem->>'nutri_score', p.nutri_score),
       voto_salute_json = coalesce(p.voto_salute_json, '{}'::jsonb) || jsonb_build_object('dati_grezzi', jsonb_build_object(
         'nutriscore_score', (elem->>'nutriscore_score')::numeric,
         'energy_kcal_100g', (elem->>'energy_kcal_100g')::numeric,
         'saturated_fat_100g', (elem->>'saturated_fat_100g')::numeric,
         'sugars_100g', (elem->>'sugars_100g')::numeric,
         'fiber_100g', (elem->>'fiber_100g')::numeric,
         'proteins_100g', (elem->>'proteins_100g')::numeric,
         'salt_100g', (elem->>'salt_100g')::numeric
       )),
       aggiornato_il = now()
     from jsonb_array_elements($1::jsonb) as elem
     where p.barcode = elem->>'barcode'`,
    [JSON.stringify(batch)]
  );
}

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows } = await client.query('select barcode from prodotti');
  const nostri = new Set(rows.map(r => r.barcode));
  console.log(`Barcode nostri da cercare nel dump: ${nostri.size}`);

  const flusso = readline.createInterface({
    input: fs.createReadStream(FILE).pipe(zlib.createGunzip()),
    crlfDelay: Infinity,
  });

  let riga = 0, trovati = 0;
  let buffer = [];
  const t0 = Date.now();

  for await (const linea of flusso) {
    riga++;
    if (riga === 1) { leggiIntestazione(linea); continue; }

    // Il code e' il primo campo: lo isoliamo senza splittare l'intera riga
    // finche' non sappiamo che ci serve, per non pagare lo split su ~4M righe inutili.
    const finePrimoCampo = linea.indexOf('\t');
    const code = finePrimoCampo === -1 ? linea : linea.slice(0, finePrimoCampo);
    if (!nostri.has(code)) continue;

    trovati++;
    const campi = linea.split('\t');
    buffer.push({
      barcode: code,
      labels_tags: lista(campi[COL.labels_tags]),
      packaging_tags: lista(campi[COL.packaging_tags]),
      ingredients_tags: lista(campi[COL.ingredients_tags]),
      origins: campi[COL.origins] || '',
      manufacturing_places: campi[COL.manufacturing_places] || '',
      nova_group: num(campi[COL.nova_group]),
      additivi_n: num(campi[COL.additives_n]),
      nutri_score: /^[a-e]$/i.test(campi[COL.nutriscore_grade] || '') ? campi[COL.nutriscore_grade].toLowerCase() : null,
      nutriscore_score: num(campi[COL.nutriscore_score]),
      energy_kcal_100g: num(campi[COL.energy_kcal]),
      saturated_fat_100g: num(campi[COL.saturated_fat]),
      sugars_100g: num(campi[COL.sugars]),
      fiber_100g: num(campi[COL.fiber]),
      proteins_100g: num(campi[COL.proteins]),
      salt_100g: num(campi[COL.salt]),
    });

    if (buffer.length >= BLOCCO) {
      await scrivi(client, buffer);
      buffer = [];
      const min = ((Date.now() - t0) / 60000).toFixed(1);
      process.stdout.write(`\rrighe CSV lette ${riga} | nostri trovati ${trovati}/${nostri.size} | ${min} min`);
    }
  }
  if (buffer.length) await scrivi(client, buffer);

  console.log(`\n\nFatto. Righe CSV totali: ${riga}. Barcode nostri trovati nel dump: ${trovati}/${nostri.size}.`);
  await client.end();
})();
