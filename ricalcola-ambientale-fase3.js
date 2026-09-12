// Fase 3 — ricalcola voto_ambientale per tutti i 63.692 prodotti usando i campi
// arricchiti in Fase 1 (certificazioni, packaging_tags, ingredients_tags, origine,
// manufacturing_places, nova_group, additivi_n) e la formula aggiornata in voto.js
// (base da CO2, tetto differenziato 9/20). Poi rifà la stima al 35° percentile
// sui prodotti rimasti senza modificatori reali, sui nuovi valori reali.
require('dotenv').config();
const { Client } = require('pg');
const { calcolaVoto, modificatoriDa } = require('./voto');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows: categorie } = await client.query('select * from impatto_categorie');
  const { rows: pesi } = await client.query('select * from voto_pesi');
  const { rows: modificatoriTutti } = await client.query('select * from voto_modificatori');
  const baseDi = {}; for (const c of categorie) baseDi[c.categoria] = c;
  const pesiDi = { vegetale: [], animale: [] };
  for (const p of pesi) pesiDi[p.tipo_prodotto].push(p);

  const { rows: prodotti } = await client.query(`
    select barcode, categoria_riconosciuta, certificazioni, packaging_tags,
           ingredients_tags, origine, manufacturing_places, nova_group, additivi_n, nome
    from prodotti
  `);
  console.log(`Prodotti caricati: ${prodotti.length}`);

  const reali = [];
  const daStimare = [];
  let senzaBase = 0;

  for (const p of prodotti) {
    const base = baseDi[p.categoria_riconosciuta];
    if (!base) { senzaBase++; continue; }

    const prodottoOff = {
      product_name: p.nome || '',
      labels_tags: p.certificazioni || [],
      packaging_tags: p.packaging_tags || [],
      ingredients_tags: p.ingredients_tags || [],
      origins: p.origine || '',
      manufacturing_places: p.manufacturing_places || '',
      tipo_prodotto: base.tipo_prodotto,
      paese_utente: 'it',
    };
    const codici = modificatoriDa(prodottoOff, p.categoria_riconosciuta);
    const mod = modificatoriTutti.filter(m =>
      codici.includes(m.codice) && (!m.categorie || m.categorie.includes(p.categoria_riconosciuta)));

    if (mod.length === 0) {
      daStimare.push({ barcode: p.barcode, categoria: p.categoria_riconosciuta });
      continue;
    }

    const voto = calcolaVoto({ base, pesi: pesiDi[base.tipo_prodotto], modificatori: mod });
    reali.push({
      barcode: p.barcode,
      categoria: p.categoria_riconosciuta,
      punteggio: voto.punteggio,
      voto_json: { ...voto, nome: p.nome, barcode: p.barcode },
    });
  }

  console.log(`Senza categoria d'impatto: ${senzaBase}`);
  console.log(`Con modificatori reali: ${reali.length}`);
  console.log(`Senza modificatori (da stimare per percentile): ${daStimare.length}`);

  const lettera = (p) =>
    p >= 75 ? 'A' : p >= 62 ? 'B' : p >= 52 ? 'C' : p >= 40 ? 'D' : p >= 25 ? 'E' : 'F';

  // ---- scrittura dei reali ----
  const BLOCCO = 500;
  for (let i = 0; i < reali.length; i += BLOCCO) {
    const batch = reali.slice(i, i + BLOCCO).map(r => ({
      barcode: r.barcode, punteggio: r.punteggio, voto: lettera(r.punteggio), voto_json: r.voto_json,
    }));
    await client.query(
      `update prodotti p set
         punteggio_ambientale = (elem->>'punteggio')::numeric,
         voto_ambientale = elem->>'voto',
         voto_stimato = false,
         voto_json = elem->'voto_json',
         aggiornato_il = now()
       from jsonb_array_elements($1::jsonb) as elem
       where p.barcode = elem->>'barcode'`,
      [JSON.stringify(batch)]
    );
    process.stdout.write(`\rreali scritti ${Math.min(i + BLOCCO, reali.length)}/${reali.length}`);
  }
  console.log('');

  // ---- percentile 35 di categoria sui NUOVI valori reali, per chi resta senza modificatori ----
  const perCategoria = {};
  for (const r of reali) (perCategoria[r.categoria] ||= []).push(r.punteggio);
  const percentile35 = {};
  for (const [cat, vals] of Object.entries(perCategoria)) {
    const ord = [...vals].sort((a, b) => a - b);
    const pos = 0.35 * (ord.length - 1);
    const lo = Math.floor(pos), hi = Math.ceil(pos);
    percentile35[cat] = ord[lo] + (ord[hi] - ord[lo]) * (pos - lo);
  }

  let senzaCategoriaStima = 0;
  const stimati = [];
  for (const d of daStimare) {
    const p35 = percentile35[d.categoria];
    if (p35 == null) { senzaCategoriaStima++; continue; }
    stimati.push({ barcode: d.barcode, punteggio: Math.round(p35), voto: lettera(p35) });
  }
  console.log(`Stimati per percentile di categoria: ${stimati.length}`);
  console.log(`Categorie senza nessun prodotto reale (percentile impossibile): ${senzaCategoriaStima}`);

  for (let i = 0; i < stimati.length; i += BLOCCO) {
    const batch = stimati.slice(i, i + BLOCCO);
    await client.query(
      `update prodotti p set
         punteggio_ambientale = (elem->>'punteggio')::numeric,
         voto_ambientale = elem->>'voto',
         voto_stimato = true
       from jsonb_array_elements($1::jsonb) as elem
       where p.barcode = elem->>'barcode'`,
      [JSON.stringify(batch)]
    );
    process.stdout.write(`\rstimati scritti ${Math.min(i + BLOCCO, stimati.length)}/${stimati.length}`);
  }

  console.log(`\n\nFatto. Reali: ${reali.length} | Stimati: ${stimati.length} | Senza base: ${senzaBase + senzaCategoriaStima}`);
  await client.end();
})();
