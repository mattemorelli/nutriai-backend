require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

// Errori pre-esistenti trovati confrontando categorie_alimenti con la
// classificazione di questa fase (vedi trova-contraddizioni.js). Non tocchiamo
// i casi ambigui (curry_rosso_it/glutine: plausibile, dipende dalla marca) ne'
// i casi dove la convenzione esistente si e' rivelata corretta e la nostra
// classificazione incompleta (crostacei = "shellfish" include i molluschi,
// come confermano i sinonimi gia' in tabella "categorie").

const DA_RIMUOVERE = [
  ['spaghetti_riso_it', 'glutine'],       // riso, senza glutine
  ['tamarindo_it', 'glutine'],            // polpa di frutta, niente glutine
  ['latte_avena_it', 'latticini'],        // latte vegetale, non e' latticino
  ['latte_avena_it', 'lattosio'],
  ['latte_mandorla_it', 'latticini'],
  ['latte_mandorla_it', 'lattosio'],
  ['yogurt_soia_it', 'latticini'],
  ['yogurt_soia_it', 'lattosio'],
  ['latte_soia_dolce_it', 'latticini'],
  ['latte_soia_dolce_it', 'lattosio'],
  ['latte_soia_it', 'latticini'],
  ['latte_soia_it', 'lattosio'],
  ['burro_arachidi_it', 'latticini'],     // burro di arachidi, non e' burro da latte
  ['burro_arachidi_it', 'lattosio'],
  ['latte_cocco_it', 'latticini'],
  ['latte_cocco_it', 'lattosio'],
  ['noce_moscata_it', 'frutta_guscio'],   // e' una spezia, non un frutto a guscio
  ['turkey_bacon_us', 'maiale'],          // e' tacchino, non maiale
  ['turkey_bacon_us', 'carne_rossa'],     // e' carne bianca (tacchino)
  ['uova_quaglia_it', 'carne_bianca'],    // sono uova, non carne
  ['169957', 'soia'],                     // "Mung beans sprouted": name_it dice erroneamente soia, ma non lo e'
];

const DA_AGGIUNGERE = [
  ['169284', 'legumi'],        // semi di soia germogliati: legume anche oltre a soia
  ['calamari_it', 'crostacei'], // convenzione app: crostacei = shellfish, include i molluschi (vedi sinonimi)
];

(async () => {
  console.log(`=== Rimozione di ${DA_RIMUOVERE.length} righe errate pre-esistenti ===`);
  for (const [food_id, categoria] of DA_RIMUOVERE) {
    const { error, count } = await supabase.from('categorie_alimenti').delete({ count: 'exact' }).eq('food_id', food_id).eq('categoria', categoria);
    console.log(`  DELETE ${food_id} / ${categoria} -> ${error ? 'ERRORE: ' + error.message : `righe rimosse: ${count}`}`);
  }

  console.log(`\n=== Aggiunta di ${DA_AGGIUNGERE.length} righe corrette mancanti ===`);
  for (const [food_id, categoria] of DA_AGGIUNGERE) {
    const { error } = await supabase.from('categorie_alimenti').insert([{ food_id, categoria }]);
    console.log(`  INSERT ${food_id} / ${categoria} -> ${error ? 'ERRORE: ' + error.message : 'ok'}`);
  }

  const { count } = await supabase.from('categorie_alimenti').select('*', { count: 'exact', head: true });
  console.log(`\nRighe totali in categorie_alimenti ora: ${count}`);
})();
