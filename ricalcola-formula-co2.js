// Applica la nuova formula (base dinamica da CO2, modificatori capati a ±12)
// ai 39.366 voti reali, poi rifà la stima al 35° percentile sui 24.326 stimati
// usando i nuovi valori reali. Non tocca modificatori/pesi/co2_kg_per_kg:
// solo il modo in cui si combinano, esattamente come in voto.js.
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

const CAP = 12;
const FATTORE = 5;

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    // ---- 0. Snapshot prima di tutto (per contare quante lettere cambiano) ----
    const prima = await client.query(
      `select barcode, categoria_riconosciuta, voto_stimato, punteggio_ambientale, voto_ambientale
       from prodotti`
    );
    fs.writeFileSync('snapshot-prima-formula-co2.json', JSON.stringify(prima.rows));
    console.log(`Snapshot salvato: ${prima.rows.length} righe.`);

    await client.query('begin');

    // ---- 1. Ricalcola i 39.366 voti reali dalla loro scomposizione già salvata ----
    // dettaglio[].delta e .peso sono esattamente quelli usati all'origine dai
    // modificatori: si ricombinano con la nuova base, senza ricalcolare nulla
    // dei modificatori stessi.
    const reali = await client.query(`
      with agg as (
        select p.barcode,
               sum((elem->>'delta')::numeric * (elem->>'peso')::numeric) as delta_pesato,
               sum((elem->>'peso')::numeric) as peso_totale
        from prodotti p, jsonb_array_elements(p.voto_json->'dettaglio') as elem
        where p.voto_stimato = false and p.voto_ambientale is not null
        group by p.barcode
      ),
      calcolo as (
        select a.barcode,
               greatest(-${CAP}, least(${CAP}, (a.delta_pesato / nullif(a.peso_totale, 0)) * ${FATTORE})) as spostamento,
               25 + 0.5 * greatest(0, least(100,
                 case
                   when ic.co2_kg_per_kg <= 0.5 then 100
                   when ic.co2_kg_per_kg >= 60 then 0
                   else 100 - (log(ic.co2_kg_per_kg / 0.5) / log(120)) * 100
                 end
               )) as base_categoria
        from agg a
        join prodotti p on p.barcode = a.barcode
        join impatto_categorie ic on ic.categoria = p.categoria_riconosciuta
      ),
      finale as (
        select barcode, round(greatest(0, least(100, base_categoria + spostamento))) as punteggio_nuovo,
               round(base_categoria) as base_nuova
        from calcolo
      )
      update prodotti p
      set punteggio_ambientale = f.punteggio_nuovo,
          voto_ambientale = case
            when f.punteggio_nuovo >= 75 then 'A'
            when f.punteggio_nuovo >= 62 then 'B'
            when f.punteggio_nuovo >= 52 then 'C'
            when f.punteggio_nuovo >= 40 then 'D'
            when f.punteggio_nuovo >= 25 then 'E'
            else 'F'
          end,
          voto_json = p.voto_json
            || jsonb_build_object('punteggio', f.punteggio_nuovo)
            || jsonb_build_object('impatto_categoria',
                 (p.voto_json->'impatto_categoria') || jsonb_build_object('base_categoria', f.base_nuova))
      from finale f
      where p.barcode = f.barcode
      returning p.barcode
    `);
    console.log(`Voti reali ricalcolati: ${reali.rowCount}`);

    // ---- 2. Rifà la stima (35° percentile) sui 24.326 stimati, sui NUOVI valori reali ----
    const stimati = await client.query(`
      with percentili as (
        select categoria_riconosciuta as categoria,
               percentile_cont(0.35) within group (order by punteggio_ambientale) as p35
        from prodotti
        where voto_stimato = false and voto_ambientale is not null
        group by categoria_riconosciuta
      )
      update prodotti p
      set punteggio_ambientale = round(pr.p35::numeric, 0),
          voto_ambientale = case
            when pr.p35 >= 75 then 'A'
            when pr.p35 >= 62 then 'B'
            when pr.p35 >= 52 then 'C'
            when pr.p35 >= 40 then 'D'
            when pr.p35 >= 25 then 'E'
            else 'F'
          end
      from percentili pr
      where p.categoria_riconosciuta = pr.categoria
        and p.voto_stimato = true
      returning p.barcode
    `);
    console.log(`Voti stimati ricalcolati: ${stimati.rowCount}`);

    await client.query('commit');

    // ---- 3. Report finale ----
    const dopo = await client.query(
      `select barcode, categoria_riconosciuta, voto_stimato, punteggio_ambientale, voto_ambientale
       from prodotti`
    );

    const primaDi = {}; for (const r of prima.rows) primaDi[r.barcode] = r.voto_ambientale;
    let cambiati = 0;
    for (const r of dopo.rows) if (primaDi[r.barcode] !== r.voto_ambientale) cambiati++;

    console.log(`\nProdotti che hanno cambiato lettera: ${cambiati} su ${dopo.rows.length}`);

    const distribuzione = await client.query(`
      select categoria_riconosciuta, voto_stimato, voto_ambientale,
             min(punteggio_ambientale) as min_p, max(punteggio_ambientale) as max_p, count(*)
      from prodotti
      group by categoria_riconosciuta, voto_stimato, voto_ambientale
      order by categoria_riconosciuta, voto_stimato, voto_ambientale
    `);
    console.log('\nDistribuzione per categoria:');
    console.log(JSON.stringify(distribuzione.rows, null, 2));

    const range = await client.query(`
      select categoria_riconosciuta, min(punteggio_ambientale) as minimo, max(punteggio_ambientale) as massimo
      from prodotti
      group by categoria_riconosciuta
      order by massimo desc
    `);
    console.log('\nRange per categoria (per verificare l\'ordine CO2):');
    console.log(JSON.stringify(range.rows, null, 2));

  } catch (e) {
    await client.query('rollback');
    console.error('ERRORE, rollback eseguito:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
