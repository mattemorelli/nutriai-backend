require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

// Classificazione alimento per alimento, per conoscenza reale del cibo, non per
// parole chiave. "certe" = categorie assegnate con certezza. "prudenti" = stessa
// lista di categorie ma assegnate per il criterio prudenziale (in dubbio si
// esclude, quindi si tagga) - vanno riviste a campione dall'utente.
// Le 9 categorie soggette a criterio prudenziale: glutine, latticini, lattosio,
// pesce, crostacei, frutta_guscio, arachidi, soia, uova.
// Le altre 4 (carne_rossa, carne_bianca, maiale, legumi) sono classificazione
// diretta, senza criterio prudenziale (non sono allergeni).

const C = {};
function set(id, certe, prudenti) { C[id] = { certe: certe || [], prudenti: prudenti || [] }; }

// ---- blocco USDA (id numerici) ----
set('167533', ['glutine']);
set('167555', ['glutine']);
set('167557', []);
set('167622', ['carne_rossa']);
set('167708', []);
set('167755', []);
set('167758', []);
set('167762', []);
set('167787', []);
set('167793', []);
set('167811', ['maiale']);
set('167853', ['maiale']);
set('167859', ['maiale']);
set('167871', ['maiale']);
set('167942', ['glutine']);
set('168162', []);
set('168191', []);
set('168249', ['maiale']);
set('168269', ['maiale']);
set('168277', ['maiale']);
set('168372', ['maiale']);
set('168396', ['legumi']);
set('168409', []);
set('168421', []);
set('168434', []);
set('168448', []);
set('168457', []);
set('168462', []);
set('168472', []);
set('168556', []);
set('168561', []);
set('168567', []);
set('168576', []);
set('168607', ['carne_rossa']);
set('168609', ['carne_rossa']);
set('168653', ['carne_rossa']);
set('168726', ['carne_rossa']);
set('168820', []);
set('168867', []);
set('168877', []);
set('168886', ['glutine']);
set('168892', ['glutine']);
set('168918', []);
set('168933', ['glutine']);
set('168936', ['glutine']);
set('169079', ['latticini', 'lattosio']);
set('169092', []);
set('169094', []);
set('169097', []);
set('169157', ['maiale']);
set('169205', []);
set('169228', []);
set('169230', []);
set('169231', []);
set('169247', []);
set('169279', []);
set('169284', ['soia']);
set('169291', []);
set('169295', []);
set('169449', ['carne_rossa']);
set('169451', ['carne_rossa']);
set('169606', []);
set('169655', []);
set('169656', []);
set('169698', []);
set('169699', ['glutine']);
set('169703', []);
set('169722', ['glutine']);
set('169736', ['glutine']);
set('169745', ['glutine']);
set('169813', ['pesce']);
set('169868', ['latticini', 'lattosio']);
set('169905', ['carne_bianca']);
set('169928', []); // Peaches - falso positivo pesce/pesche evitato
set('169949', []);
set('169957', ['legumi']); // Mung bean sprouts - name_it errato dice "soia", NON e' soia
set('169975', []);
set('169986', []);
set('169991', []);
set('169998', []);
set('170000', []);
set('170028', []);
set('170051', []);
set('170075', []);
set('170103', ['legumi']);
set('170188', []);
set('170196', ['carne_rossa']);
set('170379', []);
set('170383', []);
set('170393', []);
set('170406', []);
set('170419', ['legumi']);
set('170457', []);
set('170496', []);
set('170569', ['frutta_guscio']);
set('170679', []);
set('170682', []);
set('170783', ['carne_rossa']);
set('170844', ['latticini', 'lattosio']);
set('170845', ['latticini', 'lattosio']);
set('170848', ['latticini', 'lattosio']);
set('170850', ['latticini', 'lattosio']);
set('170917', []);
set('170923', []);
set('170929', []);
set('171017', []);
set('171028', []);
set('171040', [], ['latticini', 'soia']); // margarina: whey/lecitina di soia comuni ma non certi
set('171060', ['carne_bianca']);
set('171077', ['carne_bianca']);
set('171093', ['carne_bianca']);
set('171098', ['carne_bianca']);
set('171116', ['carne_bianca']);
set('171129', ['carne_bianca']);
set('171186', []);
set('171241', ['latticini', 'lattosio']);
set('171242', ['latticini', 'lattosio']);
set('171245', ['latticini', 'lattosio']);
set('171255', ['latticini', 'lattosio']);
set('171274', ['latticini', 'lattosio']);
set('171275', ['latticini', 'lattosio']);
set('171284', ['latticini', 'lattosio']);
set('171304', ['latticini', 'lattosio']);
set('171315', []);
set('171319', []);
set('171321', []);
set('171323', []);
set('171328', []);
set('171329', []);
set('171400', ['carne_rossa']);
set('171412', []);
set('171413', []);
set('171493', ['carne_bianca']);
set('171610', ['pesce']); // Worcestershire: ricetta classica con acciughe
set('171631', ['maiale']);
set('171719', []);
set('171723', []);
set('171796', ['carne_rossa']);
set('171869', []);
set('171890', []);
set('171951', ['pesce']);
set('171952', ['pesce']);
set('171955', ['pesce']);
set('171962', ['pesce']);
set('171964', ['pesce']);
set('171988', ['pesce']);
set('172032', ['glutine', 'latticini', 'lattosio', 'maiale']);
set('172177', ['latticini', 'lattosio']);
set('172178', ['latticini', 'lattosio']);
set('172182', ['latticini', 'lattosio']);
set('172194', ['latticini', 'lattosio']);
set('172223', ['latticini', 'lattosio']);
set('172231', []);
set('172234', []);
set('172240', []);
set('172385', ['carne_bianca']);
set('172390', ['carne_bianca']);
set('172410', ['carne_bianca']);
set('172413', ['carne_bianca']);
set('172417', ['carne_bianca']);
set('172420', ['legumi']);
set('172475', ['soia']);
set('172479', ['carne_rossa']);
set('172481', ['carne_rossa']);
set('172517', ['carne_rossa']);
set('172564', ['carne_rossa']);
set('172738', ['glutine'], ['latticini', 'lattosio']); // sfoglia: spesso al burro
set('172791', ['glutine']);
set('172803', []);
set('172938', ['maiale']);
set('173177', ['latticini', 'lattosio']);
set('173242', ['glutine']);
set('173270', ['glutine', 'uova', 'latticini', 'lattosio', 'maiale']);
set('173416', ['latticini', 'lattosio']);
set('173420', ['latticini', 'lattosio']);
set('173468', []);
set('173469', []);
set('173471', []);
set('173472', []);
set('173475', []);
set('173678', ['pesce']);
set('173686', ['pesce']);
set('173698', ['pesce']);
set('173703', ['pesce']);
set('173713', ['pesce']);
set('173725', ['pesce']);
set('173862', ['carne_rossa']);
set('173870', ['maiale']);
set('174186', ['pesce']);
set('174188', ['pesce']);
set('174196', ['pesce']);
set('174204', ['crostacei']);
set('174206', ['crostacei']);
set('174208', ['crostacei']);
set('174285', ['legumi']);
set('174469', ['carne_bianca']);
set('174528', []);
set('174842', []);
set('174915', ['glutine']);
set('174924', ['glutine']);
set('174957', ['glutine']);
set('175036', []);
set('175040', []);
set('175043', []);
set('175142', ['pesce']);
set('175154', ['pesce']);
set('175176', ['pesce']);
set('175188', ['legumi']);
set('175205', ['legumi']);
set('175206', ['legumi']);
set('175303', ['carne_rossa']);

// ---- blocco slug italiani ----
set('acai_it', []);
set('acciughe_it', ['pesce']);
set('aceto_balsamico_it', []);
set('aceto_sherry_it', []);
set('aceto_vino_it', []);
set('agnello_australiano_it', ['carne_rossa']);
set('agnello_it', ['carne_rossa']);
set('albicocche_it', []);
set('albicocche_secche_it', []);
set('albume_it', ['uova']);
set('alghe_nori_it', []);
set('american_cheese_us', ['latticini', 'lattosio']);
set('anacardi_it', ['frutta_guscio']);
set('anacardi_salt_it', ['frutta_guscio']);
set('ananas_it', []);
set('anatra_fesa_it', ['carne_bianca']);
set('anatra_it', ['carne_bianca']);
set('anatra_petto_it', ['carne_bianca']);
set('aneto_it', []);
set('anguilla_it', ['pesce']);
set('anguria_it', []);
set('anice_stellato_it', []);
set('arachidi_crude_it', ['arachidi']);
set('arancia_it', []);
set('aringa_it', ['pesce']);
set('asiago_it', ['latticini', 'lattosio']);
set('asparagi_it', []);
set('astice_it', ['crostacei']);
set('avena_it', ['glutine']); // linea prudente gia' decisa: avena dentro
set('avocado_it', []);
set('baccala_it', ['pesce']);
set('banana_it', []);
set('barbabietola_australiana_it', []);
set('barbabietola_it', []);
set('barbabietole_it', []);
set('barramundi_it', ['pesce']);
set('basilico_it', []);
set('bbq_sauce_us', [], ['glutine']); // spesso aceto di malto
set('bietola_it', []);
set('bietole_it', []);
set('birra_it', ['glutine']);
set('biscuit_us', ['glutine', 'latticini', 'lattosio']);
set('bok_choy_it', []);
set('branzino_it', ['pesce']);
set('bresaola_it', ['carne_rossa']);
set('buffalo_sauce_us', [], ['latticini', 'lattosio']); // ricetta classica con burro
set('bulgur_it', ['glutine']);
set('burro_arachidi_it', ['arachidi']);
set('burro_it', ['latticini', 'lattosio']);
set('burro_mandorle_it', ['frutta_guscio']); // NON latticini: falso positivo noto evitato
set('cacao_it', []);
set('cachi_it', []);
set('caciocavallo_it', ['latticini', 'lattosio']);
set('caffe_it', []);
set('calamari_it', []); // mollusco, non crostaceo - vedi nota nel report
set('canguro_it', ['carne_rossa']);
set('cannella_it', []);
set('capesante_it', []); // mollusco
set('capperi_it', []);
set('caprino_it', ['latticini', 'lattosio']);
set('carciofi_it', []);
set('cardamomo_it', []);
set('carta_riso_it', []);
set('castagne_it', []); // castagne NON nella lista UE frutta a guscio
set('cavolfiore_it', []);
set('cavolini_bruxelles_it', []);
set('cavolini_it', []);
set('cavolo_cappuccio_it', []);
set('cavolo_napa_it', []);
set('cavolo_rapa_it', []);
set('cavolo_verde_it', []);
set('cavolo_verza_it', []);
set('ceci_rossi_it', ['legumi']);
set('ceci_secchi_it', ['legumi']);
set('cetrioli_it', []);
set('cicoria_it', []);
set('ciliegie_it', []);
set('cinghiale_it', ['maiale']); // stessa specie del maiale, rilevante per halal/kosher
set('cioccolato_fondente_it', [], ['latticini', 'lattosio']); // possibili tracce di latte
set('cipolla_rossa_it', []);
set('cipollotto_it', []);
set('clementine_it', []);
set('cocco_it', []); // coconut non nella lista UE frutta a guscio
set('concentrato_pomodoro_it', []);
set('coniglio_it', ['carne_bianca']);
set('coriandolo_it', []);
set('cornflakes_it', [], ['glutine']); // malto d'orzo comune nei cereali soffiati
set('couscous_integrale_it', ['glutine']);
set('cozze_it', []); // mollusco
set('cranberry_sauce_us', []);
set('crescenza_it', ['latticini', 'lattosio']);
set('crescione_it', []);
set('curcuma_it', []);
set('curry_it', []);
set('curry_rosso_it', [], ['pesce', 'crostacei']); // pasta di gamberetti/salsa di pesce tradizionale
set('daikon_it', []);
set('datteri_it', []);
set('edamame_it', ['soia', 'legumi']);
set('emmental_it', ['latticini', 'lattosio']);
set('erba_cipollina_it', []);
set('fagioli_borlotti_it', ['legumi']);
set('fagioli_cannellini_it', ['legumi']);
set('fagioli_neri_it', ['legumi']);
set('fagioli_secchi_it', ['legumi']);
set('fagiolini_it', ['legumi']);
set('farina_00_it', ['glutine']);
set('farina_avena_it', ['glutine']);
set('farina_mais_bianca_it', []);
set('farina_mais_it', []);
set('farina_riso_glutinoso_it', []); // falso positivo noto evitato: senza glutine
set('farina_riso_it', []);
set('farro_integrale_it', ['glutine']);
set('farro_perlato_it', ['glutine']);
set('fave_it', ['legumi']);
set('fave_secche_it', ['legumi']);
set('fegato_vitello_it', ['carne_rossa']);
set('fette_biscottate_it', ['glutine']);
set('fichi_it', []);
set('fichi_secchi_it', []);
set('fico_it', []);
set('finocchi_it', []);
set('finocchio_it', []);
set('fontina_it', ['latticini', 'lattosio']);
set('formaggio_fresco_andino_it', ['latticini', 'lattosio']);
set('formaggio_fresco_it', ['latticini', 'lattosio']);
set('formaggio_spalmabile_it', ['latticini', 'lattosio']);
set('formaggio_stagionato_it', ['latticini', 'lattosio']);
set('fragole_it', []);
set('friselle_it', ['glutine']);
set('frutti_bosco_it', []);
set('funghi_champignon_it', []);
set('funghi_it', []);
set('funghi_porcini_it', []);
set('gai_lan_it', []);
set('gamberetti_it', ['crostacei']);
set('gelato_it', ['latticini', 'lattosio']);
set('germogli_soia_it', ['soia', 'legumi']);
set('gochujang_it', ['soia'], ['glutine']); // pasta di soia fermentata; grano possibile a seconda della marca
set('gorgonzola_it', ['latticini', 'lattosio']);
set('granchio_it', ['crostacei']);
set('granchio_polpa_it', ['crostacei']);
set('grano_saraceno_it', []); // falso positivo noto evitato: senza glutine
set('granola_us', ['glutine'], ['frutta_guscio']);
set('grissini_it', ['glutine']);
set('guava_it', []);
set('halibut_it', ['pesce']);
set('hamburger_bun_us', ['glutine']);
set('hummus_it', ['legumi']);
set('indivia_it', []);
set('italian_dressing_us', []);
set('kale_it', []);
set('kamut_it', ['glutine']);
set('kefir_it', ['latticini', 'lattosio']);
set('kimchi_it', [], ['pesce', 'crostacei']); // jeotgal (salsa di pesce/gamberetti) tradizionale
set('kiwi_it', []);
set('lamponi_it', []);
set('latte_avena_it', ['glutine']);
set('latte_capra_it', ['latticini', 'lattosio']);
set('latte_cocco_it', []);
set('latte_mandorla_it', ['frutta_guscio']);
set('latte_ps_it', ['latticini', 'lattosio']);
set('latte_soia_dolce_it', ['soia']);
set('latte_soia_it', ['soia']);
set('latticello_it', ['latticini', 'lattosio']);
set('lattuga_it', []);
set('lenticchie_rosse_it', ['legumi']);
set('lievito_birra_it', [], ['glutine']);
set('lime_sudam_it', []);
set('limone_it', []);
set('lupini_it', ['legumi']); // NB: la UE tratta i lupini come allergene a se', vedi report
set('macadamia_it', ['frutta_guscio']);
set('maggiorana_it', []);
set('mahi_mahi_it', ['pesce']);
set('maiale_lonza_it', ['maiale']);
set('maiale_macinato_magro_it', ['maiale']);
set('maionese_it', ['uova']);
set('mais_bianco_it', []);
set('mandorle_it', ['frutta_guscio']);
set('mango_it', []);
set('manzo_magro_arg_it', ['carne_rossa']);
set('marmellata_it', []);
set('mascarpone_it', ['latticini', 'lattosio']);
set('mela_it', []);
set('melagrana_it', []);
set('melanzana_it', []);
set('melone_it', []);
set('menta_it', []);
set('miele_it', []);
set('miglio_it', []);
set('mirtilli_it', []);
set('miso_it', ['soia']);
set('more_it', []);
set('mortadella_it', ['maiale'], ['frutta_guscio', 'latticini']); // pistacchi molto comuni, latte in polvere possibile
set('nasello_it', ['pesce']);
set('nocciole_it', ['frutta_guscio']);
set('noce_moscata_it', []); // falso positivo noto evitato: non e' frutta a guscio
set('noci_it', ['frutta_guscio']);
set('noodle_grano_it', ['glutine']);
set('okra_it', []);
set('olio_semi_vari_it', []);
set('olio_sesamo_it', []);
set('olive_verdi_it', []);
set('orata_it', ['pesce']);
set('orzo_it', ['glutine']);
set('pancetta_it', ['maiale']);
set('pane_carasau_it', ['glutine']);
set('pane_comune_crea', ['glutine']);
set('pane_integrale_it', ['glutine']);
set('pane_segale_it', ['glutine']);
set('pangrattato_it', ['glutine']);
set('panna_it', ['latticini', 'lattosio']);
set('papaya_it', []);
set('parmigiano_it', ['latticini', 'lattosio']);
set('passata_pomodoro_it', []);
set('pasta_integrale_it', ['glutine']);
set('pasta_it', ['glutine']);
set('pastinaca_it', []);
set('paximadia_it', ['glutine']);
set('pecorino_it', ['latticini', 'lattosio']);
set('peperoncino_it', []);
set('peperoncino_jalapeno_it', []);
set('peperone_giallo_it', []);
set('peperone_rosso_it', []);
set('peperone_verde_it', []);
set('peperoni_padron_it', []);
set('pera_it', []);
set('pesche_it', []); // falso positivo noto evitato: pesche non pesce
set('pesto_it', ['latticini', 'lattosio', 'frutta_guscio']); // parmigiano/pecorino + pinoli, ricetta classica
set('petto_manzo_magro_it', ['carne_rossa']);
set('petto_pollo_affumicato_it', ['carne_bianca']);
set('pinoli_it', ['frutta_guscio']);
set('piselli_occhio_nero_it', ['legumi']);
set('piselli_secchi_it', ['legumi']);
set('piselli_spezzati_it', ['legumi']);
set('pistacchi_it', ['frutta_guscio']);
set('platano_it', []);
set('platessa_it', ['pesce']);
set('polenta_it', []);
set('polenta_taragna_it', []);
set('pollo_coscia_it', ['carne_bianca']);
set('polpo_it', []); // mollusco
set('pomodorini_it', []);
set('pompelmo_it', []);
set('popcorn_us', []);
set('porri_it', []);
set('porro_it', []);
set('prezzemolo_it', []);
set('provola_it', ['latticini', 'lattosio']);
set('prugne_it', []);
set('quaglia_it', ['carne_bianca']);
set('quinoa_it', []);
set('quinoa_rossa_it', []);
set('radicchio_it', []);
set('ranch_dressing_us', ['latticini', 'lattosio', 'uova']);
set('rapa_it', []);
set('rape_it', []);
set('rape_rosse_it', []);
set('ravanelli_it', []);
set('ravanello_it', []);
set('ricotta_it', ['latticini', 'lattosio']);
set('riso_basmati_it', []);
set('riso_jasmine_it', []);
set('riso_venere_it', []);
set('robiola_it', ['latticini', 'lattosio']);
set('rombo_it', ['pesce']);
set('root_beer_us', []);
set('rosmarino_it', []);
set('rucola_it', []);
set('salame_it', ['maiale']);
set('salmone_affumicato_it', ['pesce']);
set('salmone_selvaggio_it', ['pesce']);
set('salsa_bbq_aceto_it', []);
set('salsa_bbq_bianca_it', ['latticini', 'lattosio'], ['uova']);
set('salsa_chimichurri_it', []);
set('salsa_hoisin_it', ['soia'], ['glutine']);
set('salsa_pesce_it', ['pesce']);
set('salsa_senape_carolina_it', []);
set('salsa_soia_it', ['soia', 'glutine']);
set('salsa_teriyaki_it', ['soia'], ['glutine']);
set('salvia_it', []);
set('sardine_it', ['pesce']);
set('savoiardi_it', ['glutine', 'uova']);
set('scalogno_it', []);
set('scamorza_it', ['latticini', 'lattosio']);
set('scampi_it', ['crostacei']);
set('scarola_it', []);
set('sciroppo_acero_it', []);
set('sedano_it', []);
set('segale_it', ['glutine']);
set('seitan_it', ['glutine']);
set('semi_chia_it', []);
set('semi_girasole_it', []);
set('semi_lino_it', []);
set('semi_sesamo_it', []);
set('semi_zucca_it', []);
set('semola_it', ['glutine']);
set('senape_it', []);
set('seppie_it', []); // mollusco
set('sgombro_it', ['pesce']);
set('sharp_cheddar_us', ['latticini', 'lattosio']);
set('sogliola_it', ['pesce']);
set('soia_it', ['soia', 'legumi']);
set('spaghetti_riso_it', []);
set('speck_it', ['maiale']);
set('spinaci_it', []);
set('stracchino_it', ['latticini', 'lattosio']);
set('succo_arancia_it', []);
set('succo_mela_it', []);
set('surimi_it', ['pesce'], ['crostacei']);
set('sweet_corn_canned_us', []);
set('tacchino_macinato_it', ['carne_bianca']);
set('taccole_it', ['legumi']);
set('tahini_it', []);
set('taleggio_it', ['latticini', 'lattosio']);
set('tamarindo_it', []);
set('taralli_it', ['glutine']);
set('te_verde_it', []);
set('tempeh_it', ['soia']);
set('timo_it', []);
set('tofu_it', ['soia']);
set('tonno_fresco_it', ['pesce']);
set('topinambur_it', []);
set('tuorlo_it', ['uova']);
set('turkey_bacon_us', ['carne_bianca']);
set('uova_quaglia_it', ['uova']);
set('uovo_grande_it', ['uova']);
set('uva_it', []);
set('uvetta_it', []);
set('valeriana_it', []);
set('vaniglia_it', []);
set('vegemite_it', [], ['glutine']); // estratto di lievito di birra
set('vino_bianco_it', []);
set('vino_rosso_it', []);
set('vitello_it', ['carne_rossa']);
set('vitello_magro_it', ['carne_rossa']);
set('vongole_it', []); // mollusco
set('wurstel_it', [], ['maiale']); // composizione non specificata nel nome, la piu' comune in Italia e' di maiale
set('yogurt_magro_it', ['latticini', 'lattosio']);
set('yogurt_soia_it', ['soia']);
set('yuca_it', []);
set('zenzero_it', []);
set('zucca_delicata_it', []);
set('zucchero_canna_it', []);
set('zucchero_it', []);

const ALLERGENI = new Set(['glutine', 'latticini', 'lattosio', 'pesce', 'crostacei', 'frutta_guscio', 'arachidi', 'soia', 'uova']);

(async () => {
  let foods = [];
  {
    let da = 0;
    while (true) {
      const { data, error } = await supabase.from('foods').select('id, name, name_it').order('id').range(da, da + 999);
      if (error) throw error;
      if (!data.length) break;
      foods = foods.concat(data);
      da += 1000;
      if (data.length < 1000) break;
    }
  }
  const nomeDi = {};
  for (const f of foods) nomeDi[f.id] = f.name_it || f.name;

  const mancanti = foods.filter(f => !C[f.id]);
  if (mancanti.length) {
    console.log('ATTENZIONE: alimenti in foods senza classificazione nello script:', mancanti.map(f => f.id));
  }

  let esistenti = [];
  {
    let da = 0;
    while (true) {
      const { data, error } = await supabase.from('categorie_alimenti').select('food_id, categoria').order('food_id').order('categoria').range(da, da + 999);
      if (error) throw error;
      if (!data.length) break;
      esistenti = esistenti.concat(data);
      da += 1000;
      if (data.length < 1000) break;
    }
  }
  const esistentiSet = new Set(esistenti.map(r => `${r.food_id}::${r.categoria}`));
  const esistentiPerCategoria = {};
  for (const r of esistenti) esistentiPerCategoria[r.categoria] = (esistentiPerCategoria[r.categoria] || 0) + 1;

  const daInserire = [];
  const prudenziali = [];
  for (const [id, cls] of Object.entries(C)) {
    const tutte = new Set([...(cls.certe || []), ...(cls.prudenti || [])]);
    for (const cat of tutte) {
      const chiave = `${id}::${cat}`;
      if (!esistentiSet.has(chiave)) {
        daInserire.push({ food_id: id, categoria: cat });
        if ((cls.prudenti || []).includes(cat)) {
          prudenziali.push({ food_id: id, nome: nomeDi[id], categoria: cat });
        }
      }
    }
  }

  console.log(`=== Righe nuove da inserire: ${daInserire.length} ===\n`);

  const TAGLIO = 75;
  for (let i = 0; i < daInserire.length; i += TAGLIO) {
    const blocco = daInserire.slice(i, i + TAGLIO);
    console.log(`--- blocco ${Math.floor(i / TAGLIO) + 1} (righe ${i + 1}-${Math.min(i + TAGLIO, daInserire.length)}) ---`);
    for (const r of blocco) {
      console.log(`  ${r.food_id.padEnd(28)} ${(nomeDi[r.food_id] || '?').padEnd(35)} -> ${r.categoria}`);
    }
    const { error } = await supabase.from('categorie_alimenti').insert(blocco);
    if (error) { console.error('ERRORE insert blocco:', error.message); process.exit(1); }
  }

  console.log('\n=== Riepilogo per categoria (nuove righe aggiunte) ===');
  const nuovePerCategoria = {};
  for (const r of daInserire) nuovePerCategoria[r.categoria] = (nuovePerCategoria[r.categoria] || 0) + 1;
  for (const cat of Object.keys(nuovePerCategoria).sort()) {
    console.log(`  ${cat}: +${nuovePerCategoria[cat]} nuove (prima: ${esistentiPerCategoria[cat] || 0}, ora: ${(esistentiPerCategoria[cat] || 0) + nuovePerCategoria[cat]})`);
  }
  console.log(`\nTotale righe nuove: ${daInserire.length}`);
  console.log(`Totale righe gia' presenti prima: ${esistenti.length}`);

  console.log(`\n=== Tag assegnati per PRUDENZA (non certezza) - da rivedere: ${prudenziali.length} ===`);
  for (const p of prudenziali) console.log(`  ${p.food_id.padEnd(28)} ${(p.nome || '?').padEnd(35)} -> ${p.categoria}`);
})();
