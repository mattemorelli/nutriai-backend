// SQL diretto: nessun limite implicito PostgREST e nessuna scrittura.
// Distingue errori strutturali dai casi che richiedono revisione editoriale.
require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const fs = require('node:fs');
async function verifica() {
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
  try {
    await db.connect();
    const { rows } = await db.query(`
      SELECT d.id, d.name, d.meal_slot,
        d.health_score >= 6 AND d.profilo IS NOT NULL AND d.occasione IN ('quotidiano','lungo') AS nel_pool,
        d.ruolo_primario IS NULL OR d.ruoli_coperti IS NULL OR cardinality(d.ruoli_coperti)=0 AS ruoli_mancanti,
        jsonb_typeof(d.steps) IS DISTINCT FROM 'array' OR jsonb_typeof(d.steps_en) IS DISTINCT FROM 'array'
          OR d.steps='[]'::jsonb OR d.steps_en='[]'::jsonb AS passi_mancanti,
        CASE WHEN jsonb_typeof(d.steps)='array' THEN jsonb_array_length(d.steps) ELSE 0 END AS passi_it,
        CASE WHEN jsonb_typeof(d.steps_en)='array' THEN jsonb_array_length(d.steps_en) ELSE 0 END AS passi_en,
        (SELECT count(*)::int FROM dish_ingredients di WHERE di.dish_id=d.id) AS ingredienti,
        (SELECT count(*)::int FROM dish_ingredients di LEFT JOIN foods f ON f.id=di.food_id
          WHERE di.dish_id=d.id AND (f.id IS NULL OR di.grams IS NULL OR di.grams<=0
            OR f.kcal_100g IS NULL OR f.kcal_100g<0 OR f.protein_100g IS NULL OR f.protein_100g<0)) AS ingredienti_invalidi
      FROM dishes d WHERE d.mercati @> ARRAY['it']::text[] ORDER BY d.id`);
    const errori = rows.filter(r => r.passi_mancanti || !r.ingredienti || r.ingredienti_invalidi || (r.nel_pool && r.ruoli_mancanti));
    const revisione = rows.filter(r => r.passi_it !== r.passi_en || r.passi_it < 5 || r.passi_it > 8 || r.passi_en < 5 || r.passi_en > 8);
    const riepilogo = { mercato_it: rows.length, pool_generatore: rows.filter(r=>r.nel_pool).length,
      errori_strutturali: errori.length, lingue_disallineate: rows.filter(r=>r.passi_it!==r.passi_en).length,
      fuori_formato_passi: rows.filter(r=>r.passi_it<5||r.passi_it>8||r.passi_en<5||r.passi_en>8).length,
      ricette_da_revisionare: revisione.length };
    const rapporto = { rilevato_il: new Date().toISOString(), riepilogo, errori, revisione };
    const output = process.argv.find(a => a.startsWith('--output='));
    if (output) fs.writeFileSync(output.slice('--output='.length), JSON.stringify(rapporto, null, 2));
    console.log(JSON.stringify(riepilogo, null, 2));
    if (errori.length) throw new Error(`${errori.length} ricette con dati strutturali mancanti o non validi`);
    if (revisione.length) console.log('APERTO G4: questi controlli non certificano la qualita o la sicurezza delle istruzioni legacy.');
    if (process.argv.includes('--lancio') && revisione.length) throw new Error('Revisione ricette necessaria prima di chiudere G4');
  } finally { await db.end(); }
}
verifica().catch(e => { console.error(e.message); process.exitCode = 1; });
