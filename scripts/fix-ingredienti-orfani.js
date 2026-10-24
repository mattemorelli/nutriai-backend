// Secondo giro di correzioni dall'audit ricette (~/Progetti/nutriai/audit).
//
// PARTE 1 (77 piatti con 3+ ingredienti mai citati nei passaggi, fuori
// dall'infornata c0000001 gia' corretta in scripts/fix-colazioni-ceci.js):
// controllati uno per uno (ingredienti, grammi, passaggi IT/EN, sinonimi,
// dialetto UK/US). Nessuno ha un ingrediente estraneo vero: il segnale era
// quasi sempre un passaggio-segnaposto che non nomina mai nulla ("Prepara
// con cottura leggera"), o il controllo che cercava la parola sbagliata
// (dialetto, categoria generica, bug "Cipolle"/"Corn" sotto). ESITO: nessuna
// riga da togliere, nessuna scrittura per questa parte.
//
// PARTE 2 (3 colazioni incomplete): i passaggi di "Yogurt con mandorle e
// miele" e "Pane con ricotta e miele" citano gia' il miele ("un cucchiaino
// di miele" / "un filo di miele") ma la riga ingrediente mancava. "Pane con
// mela e cannella" non cita la cannella in nessuna delle due lingue (lo
// segnaliamo, non riscriviamo i passaggi - sara' compito di Cook). Dopo
// l'aggiunta, ricalcolato ruolo_primario/ruoli_coperti con lo stesso metodo
// di classifica-ruoli-piatti.js: solo "Yogurt con mandorle e miele" cambia
// (il condimento supera la soglia di copertura una volta aggiunto il
// miele), gli altri due restano uguali.
//
// AGGIUNTA (foods, id 170000 "Cipolle"): name_en era "Corn" invece di
// "Onion/Onions" - un errore isolato su questa sola riga (verificato: nessun
// altro food_id ha name_en='Corn' per errore). Corretto in "Onions" (plurale,
// stessa convenzione di Carota->"Carrots" e Pomodoro->"Tomatoes", entrambi
// come questa riga di fonte USDA - il campo `name` della riga e' infatti
// "Onions, raw"). Anche categoria_impatto era sbagliato sulla stessa riga
// ("cereali" invece di "verdura") - propagava una CO2 sbagliata e rompeva il
// confronto marche per la cipolla in spesa.js (filtra i prodotti per
// categoria_impatto, quindi cercava "cipolla" solo fra i prodotti categoria
// "cereali" e non trovava mai nulla). Corretto anche questo, con conferma
// dell'utente. Nessuna tabella/cache derivata trovata: foods e'
// l'unica fonte, non serve toccare altro.
//
// Non tocca dishes.steps/steps_en, plans, plan_items, meal_outcomes.

require('dotenv').config({ quiet: true });
const { Client } = require('pg');

const COLAZIONI = [
  {
    id: 'c0000001-0000-0000-0000-000000000005',
    nome: 'Yogurt con mandorle e miele',
    aggiungi: { food_id: 'miele_it', grams: 10 },
    ruolo_primario: 'latticino',
    ruoli_coperti: ['latticino', 'condimento'],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000006',
    nome: 'Pane con ricotta e miele',
    aggiungi: { food_id: 'miele_it', grams: 8 },
    ruolo_primario: 'base_amidacea',
    ruoli_coperti: ['base_amidacea', 'latticino'],
  },
  {
    id: 'c0000001-0000-0000-0000-000000000008',
    nome: 'Pane con mela e cannella',
    aggiungi: { food_id: 'cannella_it', grams: 1 },
    ruolo_primario: 'frutta',
    ruoli_coperti: ['frutta', 'base_amidacea'],
  },
];

const FOOD_CIPOLLE = {
  id: '170000',
  name_it_atteso: 'Cipolle',
  name_en_vecchio_atteso: 'Corn',
  categoria_vecchia_attesa: 'cereali',
  name_en_nuovo: 'Onions',
  categoria_nuova: 'verdura',
};

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('begin');

    console.log('=== Parte 2: aggiungo gli ingredienti mancanti ===');
    for (const c of COLAZIONI) {
      const { rows: esiste } = await client.query(
        'select 1 from dish_ingredients where dish_id = $1 and food_id = $2',
        [c.id, c.aggiungi.food_id]
      );
      if (esiste.length) {
        throw new Error(`${c.nome}: ha gia' una riga per ${c.aggiungi.food_id} - aborto, controllare a mano`);
      }
      await client.query(
        'insert into dish_ingredients (dish_id, food_id, grams) values ($1, $2, $3)',
        [c.id, c.aggiungi.food_id, c.aggiungi.grams]
      );
      console.log(`  ${c.nome}: aggiunto ${c.aggiungi.food_id} (${c.aggiungi.grams}g)`);

      const upd = await client.query(
        'update dishes set ruolo_primario = $1, ruoli_coperti = $2 where id = $3',
        [c.ruolo_primario, c.ruoli_coperti, c.id]
      );
      if (upd.rowCount !== 1) throw new Error(`${c.nome}: update ruoli, righe toccate ${upd.rowCount}`);
    }

    console.log('\n=== Aggiunta: foods 170000 "Cipolle" ===');
    const { rows: cipolla } = await client.query(
      'select name_it, name_en, categoria_impatto from foods where id = $1',
      [FOOD_CIPOLLE.id]
    );
    if (!cipolla.length) throw new Error('foods 170000 non trovato');
    const attuale = cipolla[0];
    if (
      attuale.name_it !== FOOD_CIPOLLE.name_it_atteso ||
      attuale.name_en !== FOOD_CIPOLLE.name_en_vecchio_atteso ||
      attuale.categoria_impatto !== FOOD_CIPOLLE.categoria_vecchia_attesa
    ) {
      throw new Error(
        `foods 170000: valori attuali diversi dall'atteso (name_it="${attuale.name_it}", name_en="${attuale.name_en}", categoria_impatto="${attuale.categoria_impatto}") - aborto senza scrivere`
      );
    }
    const updFood = await client.query(
      'update foods set name_en = $1, categoria_impatto = $2 where id = $3',
      [FOOD_CIPOLLE.name_en_nuovo, FOOD_CIPOLLE.categoria_nuova, FOOD_CIPOLLE.id]
    );
    if (updFood.rowCount !== 1) throw new Error(`foods 170000: update, righe toccate ${updFood.rowCount}`);
    console.log(`  name_en: "${FOOD_CIPOLLE.name_en_vecchio_atteso}" -> "${FOOD_CIPOLLE.name_en_nuovo}"`);
    console.log(`  categoria_impatto: "${FOOD_CIPOLLE.categoria_vecchia_attesa}" -> "${FOOD_CIPOLLE.categoria_nuova}"`);

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
