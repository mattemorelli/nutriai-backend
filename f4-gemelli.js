// f4-gemelli.js — chiude i dieci alimenti entrati due volte nel catalogo.
//
// Contesto: foods contiene ancora 211 id in formato USDA numerico accanto agli
// slug. Rinominarli tutti si e' deciso di non farlo (zero righe orfane, le
// categorie coprono entrambi i formati, non c'e' nessun buco di sicurezza da
// tappare). Restavano pero' dieci casi in cui lo STESSO alimento e' entrato due
// volte, una da USDA e una a mano: quelli vanno chiusi, altrimenti il catalogo
// tiene due voci per la stessa cosa e le quantita' si dividono fra le due.
//
// Tutto in SQL e dentro una transazione: la lettura paginata via PostgREST
// ordinata su una colonna non unica puo' ripetere righe fra una pagina e
// l'altra, ed e' esattamente l'errore che aveva fatto credere a 265 duplicati
// inesistenti in dish_ingredients. Qui non si pagina niente.
//
// Senza --scrivi non tocca nulla: stampa quello che farebbe e annulla.

require('dotenv').config();
const { Client } = require('pg');

const SCRIVI = process.argv.includes('--scrivi');

// Le tabelle che puntano a foods.id, con l'altra colonna della loro chiave:
// serve per capire quando lo spostamento produrrebbe una riga gia' esistente.
const RIFERIMENTI = [
  { tabella: 'dish_ingredients',   altra: 'dish_id' },
  { tabella: 'categorie_alimenti', altra: 'categoria' },
  { tabella: 'tag_nutrizionali',   altra: 'tag' },
  { tabella: 'pantry_items',       altra: 'user_id' },
];

// UNISCI: il numerico e lo slug sono lo stesso alimento, i valori per 100 g
// coincidono. Sopravvive lo slug, i riferimenti si spostano su di lui.
// CANCELLA: identico a uno slug esistente e non usato da nessuno.
// RINOMINA: alimento suo, cambia solo l'id.
const DECISIONI = [
  { azione: 'UNISCI',   vecchio: '168462', nuovo: 'spinaci_it',      perche: 'Spinaci: 23 kcal e 2,9 g di proteine in entrambi' },
  { azione: 'UNISCI',   vecchio: '169986', nuovo: 'cavolfiore_it',   perche: 'Cavolfiore: 25 kcal in entrambi' },
  { azione: 'UNISCI',   vecchio: '169228', nuovo: 'melanzana_it',    perche: 'Melanzana/Melanzane: stesso alimento al singolare e al plurale' },
  { azione: 'UNISCI',   vecchio: '175205', nuovo: 'fave_secche_it',  perche: 'Fave a 341 kcal sono le secche, non fave_it che ne ha 88 (fresche)' },
  { azione: 'UNISCI',   vecchio: '168933', nuovo: 'semola_it',       perche: 'Semola di grano duro: 360 contro 348 kcal, stesso alimento' },
  { azione: 'UNISCI',   vecchio: '172938', nuovo: 'salame_it',       perche: 'Salame generico non usato da nessun piatto: confluisce nel Milano' },
  { azione: 'UNISCI',   vecchio: '172479', nuovo: 'agnello_it',      perche: 'Agnello generico non usato da nessun piatto: confluisce nella spalla' },
  { azione: 'CANCELLA', vecchio: '169231', nuovo: 'zenzero_it',      perche: 'Zenzero: identico a zenzero_it (80 kcal), zero riferimenti' },
  { azione: 'CANCELLA', vecchio: '171890', nuovo: 'caffe_it',        perche: 'Caffe: identico a caffe_it, zero riferimenti' },
  { azione: 'CANCELLA', vecchio: '172231', nuovo: 'curcuma_it',      perche: 'Curcuma: identica a curcuma_it (312 kcal), zero riferimenti' },
  { azione: 'RINOMINA', vecchio: '168867', nuovo: 'polenta_cruda_it', perche: 'Polenta cruda 370 kcal: NON e\' polenta_it, che e\' quella cotta a 85' },
];

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();

  try {
    await c.query('begin');

    // --- Controllo preliminare: un piatto che contiene ENTRAMBI i gemelli ---
    // Non lo risolvo da solo. Sommare i grammi raddoppierebbe l'ingrediente se
    // le due righe erano lo stesso, tenerne una sola perderebbe quantita' se
    // erano due cose diverse. Se ne esce anche uno, mi fermo e lo mostro.
    const scontri = [];
    for (const d of DECISIONI.filter(x => x.azione === 'UNISCI')) {
      const { rows } = await c.query(
        `select v.dish_id, v.grams as grammi_vecchio, n.grams as grammi_nuovo
           from dish_ingredients v
           join dish_ingredients n on n.dish_id = v.dish_id and n.food_id = $2
          where v.food_id = $1`,
        [d.vecchio, d.nuovo]
      );
      rows.forEach(r => scontri.push({ ...d, ...r }));
    }

    if (scontri.length) {
      console.log('FERMO: questi piatti contengono entrambi i gemelli.\n');
      scontri.forEach(s =>
        console.log(`  ${s.dish_id}  ${s.vecchio} (${s.grammi_vecchio} g) + ${s.nuovo} (${s.grammi_nuovo} g)`));
      console.log('\nVanno decisi uno per uno prima di unire: non sommo e non scarto di mia iniziativa.');
      await c.query('rollback');
      return;
    }
    console.log('Nessun piatto contiene entrambi i gemelli: le unioni sono pulite.\n');

    // --- Le tre azioni ---
    for (const d of DECISIONI) {
      const presente = await c.query('select id, name_it from foods where id = $1', [d.vecchio]);
      if (!presente.rows.length) { console.log(`${d.azione.padEnd(9)} ${d.vecchio}: gia' fatto\n`); continue; }
      const nome = presente.rows[0].name_it;

      console.log(`${d.azione.padEnd(9)} ${d.vecchio} "${nome}" → ${d.nuovo}`);
      console.log(`          ${d.perche}`);

      if (d.azione === 'RINOMINA') {
        // Nessuno lo referenzia (verificato), quindi l'id si cambia sul posto.
        const usi = await contaUsi(c, d.vecchio);
        if (usi) {
          console.log(`          ATTENZIONE: ha ${usi} riferimenti, non lo rinomino sul posto`);
          continue;
        }
        const r = await c.query('update foods set id = $2 where id = $1', [d.vecchio, d.nuovo]);
        console.log(`          foods: ${r.rowCount} riga rinominata\n`);
        continue;
      }

      if (d.azione === 'CANCELLA') {
        const usi = await contaUsi(c, d.vecchio);
        if (usi) {
          console.log(`          ATTENZIONE: risulta usato (${usi} riferimenti), NON lo cancello — va trattato come UNISCI`);
          continue;
        }
        const r = await c.query('delete from foods where id = $1', [d.vecchio]);
        console.log(`          foods: ${r.rowCount} riga cancellata\n`);
        continue;
      }

      // UNISCI: prima le righe che diventerebbero un doppione (si scartano,
      // la riga di destinazione esiste gia' e dice la stessa cosa), poi si
      // sposta tutto il resto.
      for (const { tabella, altra } of RIFERIMENTI) {
        const doppie = await c.query(
          `delete from ${tabella} v
            where v.food_id = $1
              and exists (select 1 from ${tabella} n
                           where n.food_id = $2 and n.${altra} = v.${altra})`,
          [d.vecchio, d.nuovo]
        );
        const spostate = await c.query(
          `update ${tabella} set food_id = $2 where food_id = $1`,
          [d.vecchio, d.nuovo]
        );
        if (doppie.rowCount || spostate.rowCount) {
          console.log(`          ${tabella}: ${spostate.rowCount} spostate, ${doppie.rowCount} gia' presenti e scartate`);
        }
      }

      const rimasti = await contaUsi(c, d.vecchio);
      if (rimasti) {
        throw new Error(`${d.vecchio} ha ancora ${rimasti} riferimenti dopo lo spostamento: annullo tutto`);
      }
      const r = await c.query('delete from foods where id = $1', [d.vecchio]);
      console.log(`          foods: ${r.rowCount} riga cancellata\n`);
    }

    // --- Verifica finale dentro la stessa transazione ---
    const { rows: resti } = await c.query(
      `select id from foods where id = any($1::text[])`,
      [DECISIONI.filter(d => d.azione !== 'RINOMINA').map(d => d.vecchio)]
    );
    console.log(resti.length
      ? `Restano in foods: ${resti.map(r => r.id).join(', ')}`
      : 'Tutti i gemelli chiusi.');

    if (SCRIVI) {
      await c.query('commit');
      console.log('\nScritto.');
    } else {
      await c.query('rollback');
      console.log('\nProva a vuoto: annullato, niente e\' stato scritto. Rilancia con --scrivi per applicare.');
    }
  } catch (e) {
    await c.query('rollback');
    console.error('ERRORE (transazione annullata, database invariato):', e.message);
    process.exitCode = 1;
  } finally {
    await c.end();
  }
})();

async function contaUsi(c, foodId) {
  let n = 0;
  for (const { tabella } of RIFERIMENTI) {
    const { rows } = await c.query(`select count(*)::int as n from ${tabella} where food_id = $1`, [foodId]);
    n += rows[0].n;
  }
  return n;
}
