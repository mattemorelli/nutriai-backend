// Lotto 01 — esegue in una sola transazione (richiede DATABASE_URL raggiungibile):
// 1. Ricalcolo di contiene_glutine/contiene_lattosio/contiene_frutta_secca per
//    TUTTO il catalogo, dalla stessa fonte del generatore (categorie_alimenti).
// 2. Nuovo alimento lenticchie_rosse_cotte_it + i 5 del lotto 01.
// 3. Ripunta 33 piatti (172420/lenticchie_rosse_it/piselli_spezzati_it) agli
//    alimenti "cotti" gia' esistenti (o nuovi), e aggiorna il loro voto salute.
// 4. categoria_impatto su pomodorini_it/frutti_bosco_it.
// 5. 13 piatti nuovi (dishes + dish_ingredients), ricetta_passi, ricetta_info.
require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const fs = require('fs');
const piattiData = require('./lotto-01-piatti.json').piatti;
const ricetteData = require('./lotto-01-ricette.json').ricette;
const mismatch = JSON.parse(fs.readFileSync('/tmp/mismatch-flags.json'));
const legumiRisultati = JSON.parse(fs.readFileSync('/tmp/legumi-risultati.json'));

const NUOVI_ALIMENTI = [
  { id: 'farina_ceci_it', name: 'Chickpea flour', name_it: 'Farina di ceci', name_en: 'Chickpea flour',
    source: "USDA (Chickpea flour, besan); valori di riferimento non ancora confermati su un prodotto reale in commercio - vedi lotto-01.md _stimato",
    stato: 'crudo', kcal_100g: 387, protein_100g: 22.39, carb_100g: 57.82, sugar_100g: 10.74, fat_100g: 6.69, sat_fat_100g: 0.688, fibre_100g: 10.8, salt_100g: 0.05,
    unita: 'confezione', peso_pezzo_g: 500, reparto: 'Pantry', categoria_impatto: 'cereali', prezzo_kg: 4.5 },
  { id: 'pane_senza_glutine_it', name: 'Gluten-free bread', name_it: 'Pane senza glutine', name_en: 'Gluten-free bread',
    source: "USDA (Bread, gluten-free); valori di riferimento non ancora confermati su un prodotto reale in commercio - vedi lotto-01.md _stimato",
    stato: 'crudo', kcal_100g: 260, protein_100g: 3.5, carb_100g: 51, sugar_100g: 3, fat_100g: 3.5, sat_fat_100g: 0.6, fibre_100g: 3.5, salt_100g: 1.1,
    unita: 'confezione', peso_pezzo_g: 400, reparto: 'Bakery', categoria_impatto: 'pane_pasta', prezzo_kg: 7 },
  { id: 'crema_riso_it', name: 'Rice cream, powder', name_it: 'Crema di riso, in polvere', name_en: 'Rice cream, powder',
    source: "USDA-riferito (prodotti simili a base di riso per la prima colazione); valori di riferimento non ancora confermati su un prodotto reale in commercio - vedi lotto-01.md _stimato",
    stato: 'crudo', kcal_100g: 378, protein_100g: 6.5, carb_100g: 85, sugar_100g: 1, fat_100g: 1, sat_fat_100g: 0.2, fibre_100g: 1.5, salt_100g: 0.02,
    unita: 'confezione', peso_pezzo_g: 300, reparto: 'Pantry', categoria_impatto: 'cereali', prezzo_kg: 6 },
  { id: 'gallette_riso_it', name: 'Rice cakes, plain', name_it: 'Gallette di riso', name_en: 'Rice cakes, plain',
    source: "USDA (Rice cakes, brown rice, plain, unsalted); valori di riferimento non ancora confermati su un prodotto reale in commercio - vedi lotto-01.md _stimato",
    stato: 'crudo', kcal_100g: 387, protein_100g: 8.2, carb_100g: 81.3, sugar_100g: 0.8, fat_100g: 2.8, sat_fat_100g: 0.6, fibre_100g: 4.4, salt_100g: 0.02,
    unita: 'confezione', peso_pezzo_g: 130, reparto: 'Pantry', categoria_impatto: 'riso', prezzo_kg: 5.5 },
  { id: 'fiocchi_mais_sg_it', name: 'Corn flakes, gluten-free', name_it: 'Fiocchi di mais senza glutine', name_en: 'Corn flakes, gluten-free',
    source: "USDA-riferito (corn flakes generici, senza malto d'orzo); valori di riferimento non ancora confermati su un prodotto reale in commercio - vedi lotto-01.md _stimato",
    stato: 'crudo', kcal_100g: 370, protein_100g: 6, carb_100g: 83, sugar_100g: 8, fat_100g: 1, sat_fat_100g: 0.2, fibre_100g: 3, salt_100g: 0.6,
    unita: 'confezione', peso_pezzo_g: 375, reparto: 'Pantry', categoria_impatto: 'cereali', prezzo_kg: 5 },
  { id: 'lenticchie_rosse_cotte_it', name: 'Red lentils, cooked', name_it: 'Lenticchie rosse cotte', name_en: 'Red lentils, cooked',
    source: "USDA-riferito (red lentils, cooked, boiled, no salt); valori di riferimento non ancora confermati su un prodotto reale in commercio - vedi lotto-01.md _stimato",
    stato: 'cotto', kcal_100g: 106, protein_100g: 7.6, carb_100g: 18.5, sugar_100g: 1.5, fat_100g: 0.4, sat_fat_100g: 0.06, fibre_100g: 7.3, salt_100g: 0.01,
    unita: 'confezione', peso_pezzo_g: 400, reparto: 'Pantry', categoria_impatto: 'legumi', prezzo_kg: 3.5 },
];

const SOSTITUZIONI_LEGUMI = { '172420': 'lenticchie_cotte_it', 'lenticchie_rosse_it': 'lenticchie_rosse_cotte_it', 'piselli_spezzati_it': 'piselli_spezzati_cotti_it' };

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('begin');

    // ---- 1. Flag glutine/lattosio/frutta_secca su TUTTO il catalogo ----
    for (const [colonna, lista] of [['contiene_glutine', mismatch.glutine], ['contiene_lattosio', mismatch.lattosio], ['contiene_frutta_secca', mismatch.frutta_secca]]) {
      let nTrue = 0, nFalse = 0;
      for (const d of lista) {
        await client.query(`update dishes set ${colonna} = $1 where id = $2`, [d.corretto, d.id]);
        if (d.corretto) nTrue++; else nFalse++;
      }
      console.log(`  ${colonna}: ${lista.length} piatti corretti (${nTrue} -> true, ${nFalse} -> false)`);
    }

    // ---- 2. Nuovi alimenti ----
    for (const f of NUOVI_ALIMENTI) {
      await client.query(
        `insert into foods (id, name, name_it, name_en, source, stato, kcal_100g, protein_100g, carb_100g,
           sugar_100g, fat_100g, sat_fat_100g, fibre_100g, salt_100g, unita, peso_pezzo_g, reparto,
           categoria_impatto, prezzo_kg, prezzo_fonte, prezzo_aggiornato, sat_fat_stimato, aliases, sinonimi)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'stima',current_date,true,'{}','{}')`,
        [f.id, f.name, f.name_it, f.name_en, f.source, f.stato, f.kcal_100g, f.protein_100g, f.carb_100g,
         f.sugar_100g, f.fat_100g, f.sat_fat_100g, f.fibre_100g, f.salt_100g, f.unita, f.peso_pezzo_g, f.reparto,
         f.categoria_impatto, f.prezzo_kg]
      );
      console.log(`  alimento nuovo: ${f.name_it} (${f.id})`);
    }

    // ---- 3. Ripunta i 33 piatti ai legumi cotti + aggiorna voto salute ----
    for (const [vecchio, nuovo] of Object.entries(SOSTITUZIONI_LEGUMI)) {
      const res = await client.query(`update dish_ingredients set food_id = $1 where food_id = $2`, [nuovo, vecchio]);
      console.log(`  dish_ingredients: ${vecchio} -> ${nuovo} (${res.rowCount} righe)`);
    }
    for (const r of legumiRisultati) {
      await client.query(`update dishes set health_score = $1 where id = $2`, [r.votoNew, r.dish_id]);
    }
    console.log(`  health_score aggiornato su ${legumiRisultati.length} piatti (legumi cotti)`);

    // ---- 4. categoria_impatto ----
    const rp = await client.query(`update foods set categoria_impatto = 'verdura' where id = 'pomodorini_it' and categoria_impatto is null`);
    const rf = await client.query(`update foods set categoria_impatto = 'frutta' where id = 'frutti_bosco_it' and categoria_impatto is null`);
    console.log(`  categoria_impatto: pomodorini_it (${rp.rowCount}), frutti_bosco_it (${rf.rowCount})`);

    // ---- 5. 13 piatti nuovi ----
    for (const p of piattiData) {
      await client.query(
        `insert into dishes (id, name, name_en, meal_slot, prep_min, steps, steps_en, cucina, profilo, famiglia,
           occasione, tecnica, health_score, salsa_industriale, base_amidacea, trasportabile, contiene_glutine,
           contiene_lattosio, contiene_frutta_secca, ha_amido, ha_proteina, paese, ruolo_primario, ruoli_coperti, mercati)
         values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`,
        [p.id, p.name, p.name_en, p.meal_slot, p.prep_min, JSON.stringify(p.steps), JSON.stringify(p.steps_en), p.cucina, p.profilo, p.famiglia,
         p.occasione, p.tecnica, p.health_score, p.salsa_industriale, p.base_amidacea, p.trasportabile, p.contiene_glutine,
         p.contiene_lattosio, p.contiene_frutta_secca, p.ha_amido, p.ha_proteina, p.paese, p.ruolo_primario, p.ruoli_coperti, p.mercati]
      );
      for (const [foodId, grams] of p.ingredienti) {
        await client.query(`insert into dish_ingredients (dish_id, food_id, grams) values ($1,$2,$3)`, [p.id, foodId, grams]);
      }
      console.log(`  piatto nuovo: ${p.name} (${p.ingredienti.length} ingredienti)`);
    }

    // ---- 6. ricetta_passi + ricetta_info ----
    let passiScritti = 0;
    for (const ricetta of ricetteData) {
      for (const pa of ricetta.passi) {
        await client.query(
          `insert into ricetta_passi
             (dish_id, ordine, azione, testo_it, testo_en, durata_min, tipo_tempo,
              temperatura_c, forno_modalita, fuoco, tempo_da_confezione, in_parallelo, ingredienti)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`,
          [ricetta.dish_id, pa.ordine, pa.azione, pa.testo_it, pa.testo_en, pa.durata_min, pa.tipo_tempo,
           pa.temperatura_c, pa.forno_modalita, pa.fuoco, pa.tempo_da_confezione, pa.in_parallelo,
           JSON.stringify(pa.ingredienti || [])]
        );
        passiScritti++;
      }
      if (ricetta.prep_anticipo) {
        await client.query(
          `insert into ricetta_info (dish_id, prep_anticipo_it, prep_anticipo_en, ore_anticipo) values ($1,$2,$3,$4)`,
          [ricetta.dish_id, ricetta.prep_anticipo.it, ricetta.prep_anticipo.en, ricetta.prep_anticipo.ore]
        );
      }
      console.log(`  ricetta: ${ricetta.nome} (${ricetta.passi.length} passi${ricetta.prep_anticipo ? ', + prep_anticipo' : ''})`);
    }

    console.log(`\nTotale: ${NUOVI_ALIMENTI.length} alimenti nuovi, ${piattiData.length} piatti nuovi, ${passiScritti} passi ricetta_passi, ${legumiRisultati.length} piatti legumi corretti.`);
    await client.query('commit');
    console.log('Fatto (commit).');
  } catch (e) {
    await client.query('rollback');
    console.error('\nERRORE, transazione annullata (rollback):', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
