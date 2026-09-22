# NutriAI — regole per il catalogo piatti

## Come eseguire SQL
`node db.js "SELECT ..."` — esegue qualsiasi query sul database Supabase.
Per gli INSERT con `returning id, name`, il risultato torna in JSON e va usato
per gli inserimenti in `dish_ingredients`.

## Struttura
- `dishes`: id (uuid), name, name_en, meal_slot, prep_min, cucina, paese, profilo,
  famiglia, ha_amido, ha_proteina, tecnica, occasione, health_score,
  base_amidacea, trasportabile, salsa_industriale, steps (jsonb), steps_en (jsonb),
  ruolo_primario (text), ruoli_coperti (text[]) — Fase 4 F1, vedi regola 9
- `dish_ingredients`: dish_id, food_id, grams
- `foods`: id (text), name, name_it, source, stato, kcal_100g, protein_100g,
  carb_100g, sugar_100g, fat_100g, sat_fat_100g, fibre_100g, salt_100g

## Regole non negoziabili
1. **Mai inventare food_id.** Prima di scrivere gli ingredienti, verificare che
   esistano: `node db.js "select id, name_it from foods where lower(name_it) ~ '...'"`.
   Se un ingrediente manca, inserirlo in `foods` con valori USDA o CREA reali.
2. **health_score sempre valorizzato.** Un piatto senza voto è invisibile al
   generatore. Scala: verdure crude o al vapore 9.0-9.4, legumi 9.0-9.4,
   pesce magro 8.8-9.3, pollame 8.5-9.1, uova 8.0-8.7, carne rossa 7.8-8.4,
   piatti con pane o patate come base 8.0-8.6, dolci mai sopra 7.5.
3. **prep_min massimo 25** per i piatti quotidiani.
4. **profilo** deve essere uno dei valori esistenti: neutro, mediterraneo,
   europeo-leggero, europeo-ricco, asiatico-orientale, asiatico-sudest,
   latino-messicano-ampio, latino-chimichurri, americano.
   (Accorpati il 2026-09-12 da 16 profili a 8 — misura in
   misura-accorpamento-profili.js, migrazione in migrazione-accorpamento-profili.js —
   perché troppo frammentati facevano fallire per aritmetica quasi ogni
   profilo secondario; vecchia tassonomia: mediterraneo-olio/erbe,
   europeo-aceto/erbe, europeo-burro/panna/brasato, asiatico-soia/gochujang,
   asiatico-lime/cocco, latino-lime/messicano.)
5. **famiglia**: mediterranea, neutra, latina, asiatica, americana.
6. **steps_en** deve avere 5-6 passaggi che spiegano il *perché*, non solo il cosa.
   Esempio: "sottili, perché dentro un cartoccio niente si mescola".
   **steps** in italiano ne ha 2-3, sintetici.
7. **Temperature interne**: pollame 74C, maiale 63C, pesce 63C, manzo 52C al sangue.
8. **Verificare i duplicati** prima di inserire: un piatto con lo stesso nome
   nello stesso paese non va aggiunto.
9. **ruolo_primario e ruoli_coperti** (Fase 4 F1, 2026-09-12). Ruoli:
   proteina_principale, base_amidacea, verdura, frutta, latticino, condimento.
   ruolo_primario = ruolo dell'ingrediente col peso maggiore in grammi, per
   OGNI ruolo (anche proteina_principale/latticino). ruoli_coperti usa una
   metrica diversa per ruolo, dichiarata una volta sola qui (chi la usa - F2
   compreso - la legge da qui, non la ricalcola): proteina_principale e
   latticino sui GRAMMI DI PROTEINA reale (protein_100g*grams/100, soglia
   >=10g o >=25% delle proteine totali del piatto - il peso dell'alimento e'
   la misura sbagliata per la proteina, un contorno di verdure puo' pesare
   piu' del pollo pur essendo il pollo l'85% delle proteine); gli altri
   quattro ruoli sui grammi di ALIMENTO (soglia adattiva 40g, o 20% del peso
   totale se piu' basso). condimento non e' mai ruolo primario: se lo
   sarebbe, il piatto resta senza ruolo (va segnalato, non inventato). Le
   bevande (caffe', te', acqua frizzante/tonica, root beer) non sono un
   ruolo: escluse a monte, non occupano mai uno slot.
   **La categoria (categorie_alimenti) NON deve MAI determinare il ruolo, in
   nessuna delle due direzioni.** La categoria risponde "cosa contiene che
   puo' far male" ed e' volutamente inclusiva (taggare 'uova' su un biscotto
   che ne contiene e' corretto per un'allergia); il ruolo risponde "che
   lavoro fa nel piatto". Sono domande diverse: "Savoiardi" e' 'uova' in
   categorie_alimenti ma il suo ruolo e' base_amidacea (farina e zucchero),
   non proteina_principale; "Kimchi" e "Pasta di curry rosso" sono pesce/
   crostacei (contengono salsa di pesce/gamberetti) ma il loro ruolo e'
   verdura/condimento. Per questo classifica-ruoli-piatti.js deriva TUTTI e
   sei i ruoli dal nome dell'alimento (mai da categorie_alimenti) - la
   stessa regola vale anche al contrario, mai derivare una categoria
   allergenica dal ruolo di un piatto. Un nuovo piatto scritto a mano deve
   avere ruolo_primario/ruoli_coperti valorizzati coerentemente con questo
   principio, non lasciati a NULL e non copiati dalla categoria allergenica
   dei suoi ingredienti.
10. **Gruppo proteico** (Fase 3, genera.js, 2026-09-16). Il gruppo di un
    piatto (pesce, carne_rossa, carne_bianca, uova, legumi, formaggio - usato
    da QUOTE per il bilanciamento della settimana) si legge da
    categorie_alimenti sull'ancora proteica, non piu' solo da sei regex sui
    nomi. **Questo non e' un'eccezione alla regola 9**: il ruolo/ancora resta
    deciso dai grammi di proteina reale (stessa metrica: >=10g o >=25% della
    proteina del piatto), e la categoria dice soltanto *che cosa e'*
    l'ingrediente che l'ancora ha gia' scelto - stessa distinzione "cosa fa"
    vs "cosa contiene" della regola 9, applicata a un problema diverso (il
    gruppo per QUOTE, non il ruolo del piatto). Precedenza quando l'ancora
    porta piu' categorie: pesce (pesce, crostacei, molluschi) > carne_rossa
    (carne_rossa, maiale) > carne_bianca > uova > legumi (legumi, soia) >
    formaggio (latticini). Le sei regex restano come ripiego (gruppoDaRegex)
    per quando l'ancora non ha nessuna categoria - mai lasciare un piatto
    senza gruppo se la regex lo trovava. **Ogni legume/soia nuovo inserito a
    mano deve avere una riga 'legumi' (e 'soia' se pertinente) in
    categorie_alimenti**, altrimenti resta senza gruppo E non viene escluso
    da nessun vincolo utente che esclude i legumi - e' successo con 5
    alimenti del blocco F0bis, trovato solo con l'audit di f3-gruppo-
    proteico.js.
11. **Mai leggere una tabella via PostgREST (supabase-js `.select()`) per
    un'analisi senza paginazione E senza un ordinamento unico.** PostgREST
    tronca silenziosamente a ~1000 righe di default, senza errore: la query
    torna, sembra valida, ed e' sbagliata. Per una lettura di sola analisi
    (conteggi, audit, verifiche) usare SQL diretto via `node db.js "..."`
    (nessun limite implicito) invece di supabase-js. Non e' pedanteria:
    successo tre volte nella stessa giornata (2026-09-17). 1) l'audit dei
    doppioni di dishes ha rischiato di mancare righe oltre le prime 1000. 2) un
    conteggio d'uso di un ingrediente nei piatti, non paginato, avrebbe
    riportato un numero parziale come se fosse totale. 3) la misura del buco
    di scalamento su plan_items ha riportato "134 giornate reali" quando
    l'utente di test condiviso da solo ne aveva 92.876 - la query aveva letto
    un frammento arbitrario dei primi ~1000 record, quasi tutti rumore di
    verifiche passate, e il numero e' sembrato plausibile finche' un conteggio
    diretto via db.js non l'ha smentito.
12. **Mai cancellare righe da `plans` o `plan_items`** (tranne i piani di prova
    sull'utente di test): la cascata cancella anche `meal_outcomes`, cioe' la
    memoria dei piatti rifiutati. Prima di qualunque archiviazione bisogna
    separare gli esiti dai piani.

## Obiettivo per paese
Paesi senza generico di riferimento (Italia, Francia, Grecia, Spagna, Portogallo):
40 colazioni, 25 primi, 45 secondi, 45 contorni, 25 spuntini.

Paesi coperti da un generico (Germania, Regno Unito → centro_nord_generico):
15 secondi, 10 primi, 10 contorni, 5 colazioni. Gli spuntini li copre il generico.

## Stato attuale
Completi: Italia, Francia, Grecia, Spagna, Portogallo, centro_nord_generico
(40 colazioni, 25 primi, 45 secondi, 45 contorni, 25 spuntini — target pieno raggiunto).
Germania: piatti davvero tedeschi (non generici centro-nord) — 5 colazioni, 12 primi,
16 secondi, 11 contorni. Target dei paesi coperti da un generico (15/10/10/5) raggiunto.
Regno Unito: piatti davvero britannici (pesce del Mare del Nord, shepherd's/cottage pie,
jacket potato, kedgeree, porridge, piatti gallesi e scozzesi) — 8 colazioni, 10 primi,
18 secondi, 10 contorni, tutti con health_score >= 7. Target dei paesi coperti da un
generico (15/10/10/5) raggiunto.
Da fare: nessun paese pianificato al momento.