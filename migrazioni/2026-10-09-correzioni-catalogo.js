// MIGRAZIONE DATI - da applicare al database vero solo dopo l'ok dell'utente.
// Raccoglie le correzioni del problema G (audit/analisi-generatore.md):
//
// 1) Lupini: 'lupini_it' ha i valori del lupino SECCO/crudo (371 kcal/100g),
//    ma "Lupini con finocchi, arancia e aceto" lo usa a 180g come se fosse
//    lupini IN SALAMOIA (pronti, il formato che si compra in Italia) - lo
//    stesso errore gia' corretto per le lenticchie (crudo/cotto separati).
//    Creato 'lupini_cotti_it' con lo stesso fattore di idratazione misurato
//    su lenticchie (cotto = crudo / 3.03), sale piu' alto perche' la
//    salamoia ne aggiunge. Controllato tutto il catalogo (vedi
//    scripts/_tmp-audit-secco-cotto.js): nessun altro legume secco e' usato
//    a >=100g in un piatto del mercato IT, lupini era il solo caso.
// 2) Lo stesso piatto non e' cucina italiana di casa come SECONDO (lupini
//    come piatto principale non e' un uso italiano) - spostato a contorno,
//    porzione di ricetta ridotta a una quantita' da contorno/antipasto
//    freddo (prima: ~514g di base, ora ~200g).
// 3) 6 piatti avevano "proxy" visibile nel nome (un'annotazione tecnica
//    interna, non testo per l'utente). Rinominati in italiano naturale,
//    verificando contro gli ingredienti REALI quale dei due nomi (quello
//    prima o quello nella parentesi "proxy") corrispondeva a cosa c'e'
//    davvero nel piatto (vedi scripts/_tmp-investiga-proxy.js).
// 4) "Salmorejo (crema fredda di pomodoro spagnola)" (paese mediterraneo_
//    generico, profilo neutro) risultava raggiungibile da profili con
//    paesi=['italia'] perche' 'neutro' e 'mediterraneo_generico' bypassano
//    il filtro paese - e' stato trovato davvero in una settimana generata
//    (problema #6 dell'analisi). L'altro Salmorejo (paese spagna) aveva
//    gia' mercati=[], solo questo va tolto dal mercato IT.
//
// Uso locale:  node migrazioni/2026-10-09-correzioni-catalogo.js
// Uso su prod: DATABASE_URL=... node migrazioni/2026-10-09-correzioni-catalogo.js
const { Client } = require('pg');

const LUPINI_DISH_ID = '85e5ecfa-f2c7-4f03-9ada-8bc932e5b0fa';
const SALMOREJO_NEUTRO_ID = 'b3000002-0000-0000-0000-000000000008';

const RINOMINA = [
  { id: 'a6900001-0000-0000-0000-000000000013', name: 'Gelato con fragole', name_en: 'Ice cream with strawberries' },
  { id: 'c1000001-0000-0000-0000-000000000014', name: 'Grano saraceno con astice', name_en: 'Buckwheat with lobster' },
  { id: 'a2900001-0000-0000-0000-000000000012', name: 'Pecorino con lenticchie', name_en: 'Pecorino with lentils' },
  { id: 'a9000001-0000-0000-0000-000000000011', name: 'Pollo allo zenzero e lime (stile vietnamita)', name_en: 'Vietnamese-style chicken with ginger and lime' },
  { id: 'a5900001-0000-0000-0000-000000000011', name: 'Ananas con mandorle', name_en: 'Pineapple with almonds' },
  { id: 'a8000001-0000-0000-0000-000000000011', name: 'Gai lan saltato con salsa di soia', name_en: 'Gai lan sautéed with soy sauce' },
];

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgres://matte@localhost:5432/quadrio_local';
  const client = new Client({ connectionString });
  await client.connect();

  await client.query('begin');
  try {
    // 1) lupini cotti/in salamoia
    const { rows: esisteLupiniCotti } = await client.query(`select 1 from foods where id = 'lupini_cotti_it'`);
    if (!esisteLupiniCotti.length) {
      await client.query(
        `insert into foods (
           id, name, name_it, name_en, source, stato, kcal_100g, protein_100g, carb_100g, sugar_100g,
           fat_100g, sat_fat_100g, fibre_100g, salt_100g, categoria_impatto, unita, peso_pezzo_g, sat_fat_stimato
         ) values (
           'lupini_cotti_it', 'Lupins, cooked/brined', 'Lupini cotti (in salamoia)', 'Lupins, cooked/brined',
           $1, 'cotto', 122, 12.0, 13.3, 0, 3.2, 0.36, 6.24, 1.8, 'legumi', 'vasetto', 230, true
         )`,
        ["Derivato da lupini_it (USDA, crudo) diviso per il fattore di idratazione misurato su lenticchie (352/116 = 3.03); sale piu' alto per la salamoia. Valori stimati, non confermati su un prodotto reale in commercio - vedi audit/analisi-generatore.md problema G _stimato"]
      );
      await client.query(`insert into categorie_alimenti (food_id, categoria) values ('lupini_cotti_it', 'legumi') on conflict do nothing`);
      console.log(`Creato food 'lupini_cotti_it' (122 kcal/100g, cotto/in salamoia).`);
    } else {
      console.log(`'lupini_cotti_it' gia' presente, nessun inserimento.`);
    }

    const { rowCount: rCorrInd } = await client.query(
      `update dish_ingredients set food_id = 'lupini_cotti_it', grams = 70
         where dish_id = $1 and food_id = 'lupini_it'`,
      [LUPINI_DISH_ID]
    );
    console.log(`"Lupini con finocchi, arancia e aceto": ingrediente lupini corretto a lupini_cotti_it 70g (${rCorrInd} riga).`);

    // 2) riduce il resto della ricetta a porzione da contorno, sposta a contorno
    await client.query(
      `update dish_ingredients set grams = case food_id
         when 'finocchio_it' then 80
         when 'arancia_it' then 40
         when '171413' then 6
         when 'aceto_vino_it' then 4
         when 'prezzemolo_it' then 3
         when 'pepe_nero_it' then 0.5
         else grams end
       where dish_id = $1`,
      [LUPINI_DISH_ID]
    );
    await client.query(
      `update dishes set meal_slot = 'contorno' where id = $1`,
      [LUPINI_DISH_ID]
    );
    console.log(`"Lupini con finocchi, arancia e aceto": spostato a contorno, ricetta ridotta a porzione da contorno.`);

    // 3) rinomina i piatti "proxy"
    for (const d of RINOMINA) {
      const { rowCount } = await client.query(
        `update dishes set name = $2, name_en = $3 where id = $1`,
        [d.id, d.name, d.name_en]
      );
      console.log(`Rinominato ${d.id}: "${d.name}" / "${d.name_en}" (${rowCount} riga).`);
    }

    // 4) Salmorejo fuori dal mercato IT
    const { rowCount: rSalmorejo } = await client.query(
      `update dishes set mercati = array_remove(mercati, 'it') where id = $1`,
      [SALMOREJO_NEUTRO_ID]
    );
    console.log(`Salmorejo (neutro/mediterraneo_generico): tolto da mercati (${rSalmorejo} riga).`);

    await client.query('commit');
  } catch (e) {
    await client.query('rollback');
    throw e;
  }
  await client.end();
}

main().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
