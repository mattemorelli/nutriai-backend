// Fase 4, F4 — tabella tag_nutrizionali: curata a mano sui soli alimenti che
// contano davvero per le due regole approvate (vitamina C + ferro vegetale,
// grassi del pasto + caroteni). Fonte del contenuto nutrizionale: USDA
// FoodData Central. Fonte del meccanismo: vedi genera.js, sezione F4.
//
// calcio_alto ELIMINATO (decisione 2026-09-12): l'effetto calcio/ferro e'
// il piu' debole e contestato dei quattro misurati, svanisce negli studi di
// lungo periodo, e avrebbe penalizzato abbinamenti legittimi (pasta e
// fagioli col parmigiano). Restano solo due regole, entrambe forti.
// fonte_grassi ELIMINATO: non e' una proprieta' dell'ingrediente, e' una
// soglia sul TOTALE del pasto (5g), calcolata direttamente da fat_100g in
// genera.js - non serve un tag.
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const FONTE_VITAMINA_C = [
  '169097', 'arancia_it', 'limone_it', 'pompelmo_it', 'clementine_it', 'lime_sudam_it', 'succo_arancia_it',
  'kiwi_it', '167762', 'fragole_it', 'guava_it', 'mango_it', 'papaya_it',
  '170379', 'gai_lan_it', '169986', 'cavolfiore_it', 'cavolini_it', 'cavolini_bruxelles_it',
  'kale_it', '168421',
  'peperone_giallo_it', 'peperone_rosso_it', 'peperone_verde_it', 'peperoni_padron_it',
  'peperoncino_it', '168576', 'peperoncino_jalapeno_it',
  // aggiunto per il blocco A F0bis (2026-09-13): ananas ~48mg/100g, sopra
  // la soglia di 24mg, mancava dall'elenco.
  'ananas_it',
];

const FERRO_VEGETALE = [
  '175206', 'ceci_rossi_it', 'ceci_secchi_it',
  'fagioli_borlotti_it', 'fagioli_secchi_it', 'fagioli_cannellini_it', 'fagioli_neri_it', '175188', '174285',
  'fave_it', '175205', '168396', 'fave_secche_it',
  '172420', 'lenticchie_rosse_it', 'lupini_it',
  '170419', 'piselli_occhio_nero_it', '170103', 'piselli_secchi_it', 'piselli_spezzati_it',
  'quinoa_it', 'quinoa_rossa_it',
  'semi_sesamo_it', 'tahini_it', 'semi_zucca_it', '170188',
  'spinaci_it', '168462',
  'tempeh_it', 'tofu_it', '172475',
  // aggiunti dopo il controllo richiesto (avena, albicocche secche, cacao):
  // latte d'avena escluso, contenuto in ferro non affidabile senza dati di fortificazione.
  'avena_it', 'farina_avena_it', 'albicocche_secche_it', 'cacao_it',
  // aggiunti per il blocco 3 F0bis (2026-09-12): anacardi ~6.7mg/100g,
  // soia gialla cotta ~5mg/100g - sopra la soglia, mancavano dall'elenco.
  'anacardi_it', 'soia_gialla_cotta_it',
  // aggiunti per il blocco B F0bis (2026-09-13): sorelle cotte di alimenti
  // gia' in elenco (fagioli_spagna_it come gli altri fagioli cotti,
  // piselli_spezzati_cotti_it come piselli_spezzati_it gia' presente).
  'fagioli_spagna_it', 'piselli_spezzati_cotti_it',
];

const CAROTENI = [
  '170393', // Carota
  '168448', '168472', '169295', 'zucca_delicata_it', // Zucca in tutte le varieta'
  'spinaci_it', '168462', 'kale_it', '168421', // Spinaci, cavolo riccio (gia' in ferro_vegetale/vitC - piu' tag sullo stesso alimento e' normale)
  'peperone_rosso_it',
  'albicocche_it', 'albicocche_secche_it',
  'melone_it', '169092',
  'mango_it',
  'concentrato_pomodoro_it', 'passata_pomodoro_it', '170051', '168567', 'pomodorini_it', '170457', '167708',
];

async function verificaEsistenza(tutti) {
  const idUnici = [...new Set(tutti)];
  const { data, error } = await supabase.from('foods').select('id').in('id', idUnici);
  if (error) throw new Error(error.message);
  const trovati = new Set(data.map(r => r.id));
  const mancanti = idUnici.filter(id => !trovati.has(id));
  if (mancanti.length) throw new Error(`food_id inesistenti, controllare prima di inserire: ${mancanti.join(', ')}`);
  console.log(`Verificati ${idUnici.length} food_id, tutti esistono in foods.`);
}

async function inserisci(tag, foodIds) {
  const righe = [...new Set(foodIds)].map(food_id => ({ food_id, tag }));
  const { error } = await supabase.from('tag_nutrizionali').upsert(righe, { onConflict: 'food_id,tag' });
  if (error) throw new Error(`${tag}: ${error.message}`);
  console.log(`${tag}: ${righe.length} alimenti`);
}

(async () => {
  await verificaEsistenza([...FONTE_VITAMINA_C, ...FERRO_VEGETALE, ...CAROTENI]);
  await inserisci('fonte_vitamina_c', FONTE_VITAMINA_C);
  await inserisci('ferro_vegetale', FERRO_VEGETALE);
  await inserisci('caroteni', CAROTENI);

  const { data, error } = await supabase.from('tag_nutrizionali').select('tag');
  if (error) throw new Error(error.message);
  console.log(`\nTotale righe in tag_nutrizionali: ${data.length}`);
})();
