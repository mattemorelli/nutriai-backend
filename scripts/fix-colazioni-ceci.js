// Corregge due problemi trovati dall'audit ricette (~/Progetti/nutriai/audit):
//
// A) 9 colazioni dell'infornata combinatoria c0000001-0000-0000-0000-00000000{01..09}
//    hanno 3 ingredienti salati ciascuna, mai citati in nessuna ricetta (IT/EN) e non
//    reclamati da nessun altro piatto del catalogo: righe orfane di una seconda
//    infornata "proteina+verdura+erba" (come i 19 piatti salati nello stesso lotto,
//    c0000001-...-10..30) i cui piatti non sono mai stati creati, ma le cui righe
//    dish_ingredients sono finite comunque agganciate alle 9 colazioni.
// B) "Ceci e rosmarino" (eef92929-8545-46bb-8525-6b4d1fe05850): nome IT/EN dice
//    "ceci"/"chickpeas" ma l'ingrediente vero e' Fagioli rossi, 180g - e i passaggi
//    inglesi dettagliati dicono "beans" piu' volte, mai "chickpeas". Si rinomina il
//    piatto (l'ingrediente e la ricetta restano corretti cosi' com'erano), e si
//    rimuovono anche gli Spinaci 150g, mai citati in nessuna lingua.
//
// Dopo la rimozione delle righe orfane, ruolo_primario/ruoli_coperti (Fase 4 F1,
// vedi CLAUDE.md regola 9 e classifica-ruoli-piatti.js) vanno ricalcolati per le 9
// colazioni, perche' erano stati derivati includendo gli ingredienti estranei
// (es. "Yogurt con cereali e banana" risultava ruolo_primario=proteina_principale
// per il petto di tacchino agganciato per errore, non per il vero yogurt). Per
// "Ceci e rosmarino" il ruolo non cambia: il pomodoro (verdura, 150g) copre da solo
// il ruolo verdura anche senza gli spinaci, quindi non viene toccato.
//
// health_score NON viene ricalcolato: in questo database e' un voto a mano (CLAUDE.md
// regola 2), non derivato da una formula sulle righe ingrediente - voto-piatti.js, il
// solo script che calcola un voto dagli ingredienti, e' dichiaratamente di sola
// lettura e non sostituisce mai il voto a mano. I voti attuali (6.6-8.7, tutti
// coerenti con colazioni leggere) risultano gia' assegnati pensando alla ricetta
// vera, non alle righe estranee: non c'e' quindi nulla da "aggiustare" a formula.
//
// Non tocca dishes.steps/steps_en, plans, plan_items, meal_outcomes.

require('dotenv').config();
const { Client } = require('pg');

const COLAZIONI = [
  {
    id: 'c0000001-0000-0000-0000-000000000001',
    nome: 'Yogurt con cereali e banana',
    rimuovi: ['171098', 'bietola_it', 'salvia_it'],
    ruolo_primario: 'latticino',
    ruoli_coperti: ['latticino', 'frutta'],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000002',
    nome: 'Fette biscottate con marmellata',
    rimuovi: ['gamberetti_it', 'peperone_rosso_it', 'rosmarino_it'],
    ruolo_primario: 'base_amidacea',
    ruoli_coperti: ['condimento', 'base_amidacea'],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000003',
    nome: 'Latte e cacao con pane',
    rimuovi: ['fagioli_neri_it', 'peperone_rosso_it', 'timo_it'],
    ruolo_primario: 'latticino',
    ruoli_coperti: ['latticino', 'base_amidacea'],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000004',
    nome: 'Uova strapazzate con pane',
    rimuovi: ['gamberetti_it', 'kale_it', 'timo_it'],
    ruolo_primario: 'proteina_principale',
    ruoli_coperti: ['base_amidacea', 'proteina_principale'],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000005',
    nome: 'Yogurt con mandorle e miele',
    rimuovi: ['fagioli_neri_it', 'rapa_it', 'timo_it'],
    ruolo_primario: 'latticino',
    ruoli_coperti: ['latticino'],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000006',
    nome: 'Pane con ricotta e miele',
    rimuovi: ['halibut_it', 'timo_it', 'zucca_delicata_it'],
    ruolo_primario: 'base_amidacea',
    ruoli_coperti: ['base_amidacea', 'latticino'],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000007',
    nome: 'Cereali con latte e kiwi',
    rimuovi: ['173686', 'cavolo_verde_it', 'timo_it'],
    ruolo_primario: 'latticino',
    ruoli_coperti: ['frutta', 'latticino'],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000008',
    nome: 'Pane con mela e cannella',
    rimuovi: ['173686', 'peperone_rosso_it', 'timo_it'],
    ruolo_primario: 'frutta',
    ruoli_coperti: ['frutta', 'base_amidacea'],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000009',
    nome: 'Fette biscottate con ricotta e pera',
    rimuovi: ['174285', 'bietola_it', 'salvia_it'],
    ruolo_primario: 'frutta',
    ruoli_coperti: ['frutta', 'latticino'],
  },
];

const CECI = {
  id: 'eef92929-8545-46bb-8525-6b4d1fe05850',
  rimuovi: ['spinaci_it'],
  nome_vecchio: 'Ceci e rosmarino',
  nome_en_vecchio: 'Chickpeas with rosemary',
  nome_nuovo: 'Fagioli rossi al rosmarino',
  nome_en_nuovo: 'Red beans with rosemary',
  // ruolo_primario/ruoli_coperti non cambiano: il pomodoro (verdura, 150g) copre
  // da solo il ruolo verdura anche senza gli spinaci - vedi nota in testa al file.
};

async function verificaRigheAttese(client, dishId, foodIdsAttesi) {
  const { rows } = await client.query(
    'select food_id, grams from dish_ingredients where dish_id = $1 and food_id = any($2::text[]) order by food_id',
    [dishId, foodIdsAttesi]
  );
  if (rows.length !== foodIdsAttesi.length) {
    throw new Error(
      `${dishId}: attese ${foodIdsAttesi.length} righe da togliere (${foodIdsAttesi.join(', ')}), trovate ${rows.length} (${rows.map(r => r.food_id).join(', ')}). Aborto senza scrivere nulla - i dati sono cambiati dall'audit, da controllare a mano.`
    );
  }
  return rows;
}

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('begin');

    console.log('=== A) Colazioni: righe orfane da togliere ===');
    for (const c of COLAZIONI) {
      const righe = await verificaRigheAttese(client, c.id, c.rimuovi);
      console.log(`  ${c.nome}: tolgo ${righe.map(r => `${r.food_id} (${r.grams}g)`).join(', ')}`);
      const del = await client.query(
        'delete from dish_ingredients where dish_id = $1 and food_id = any($2::text[])',
        [c.id, c.rimuovi]
      );
      if (del.rowCount !== c.rimuovi.length) {
        throw new Error(`${c.nome}: cancellate ${del.rowCount} righe, attese ${c.rimuovi.length}`);
      }
      const upd = await client.query(
        'update dishes set ruolo_primario = $1, ruoli_coperti = $2 where id = $3',
        [c.ruolo_primario, c.ruoli_coperti, c.id]
      );
      if (upd.rowCount !== 1) throw new Error(`${c.nome}: update ruoli, righe toccate ${upd.rowCount}`);
    }

    console.log('\n=== B) Ceci e rosmarino -> Fagioli rossi al rosmarino ===');
    const righeCeci = await verificaRigheAttese(client, CECI.id, CECI.rimuovi);
    console.log(`  tolgo ${righeCeci.map(r => `${r.food_id} (${r.grams}g)`).join(', ')}`);
    const delCeci = await client.query(
      'delete from dish_ingredients where dish_id = $1 and food_id = any($2::text[])',
      [CECI.id, CECI.rimuovi]
    );
    if (delCeci.rowCount !== CECI.rimuovi.length) {
      throw new Error(`Ceci: cancellate ${delCeci.rowCount} righe, attese ${CECI.rimuovi.length}`);
    }
    const { rows: nomeAttuale } = await client.query('select name, name_en from dishes where id = $1', [CECI.id]);
    if (nomeAttuale[0].name !== CECI.nome_vecchio || nomeAttuale[0].name_en !== CECI.nome_en_vecchio) {
      throw new Error(
        `Ceci: nome attuale "${nomeAttuale[0].name}" / "${nomeAttuale[0].name_en}" diverso da quello atteso - aborto senza rinominare`
      );
    }
    const updCeci = await client.query(
      'update dishes set name = $1, name_en = $2 where id = $3',
      [CECI.nome_nuovo, CECI.nome_en_nuovo, CECI.id]
    );
    if (updCeci.rowCount !== 1) throw new Error(`Ceci: update nome, righe toccate ${updCeci.rowCount}`);
    console.log(`  rinominato in "${CECI.nome_nuovo}" / "${CECI.nome_en_nuovo}"`);

    await client.query('commit');
    console.log('\nFatto. Transazione confermata (commit).');
  } catch (e) {
    await client.query('rollback');
    console.error('\nERRORE, transazione annullata (rollback):', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
