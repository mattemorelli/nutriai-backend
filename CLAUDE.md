# NutriAI — regole per il catalogo piatti

## Come eseguire SQL
`node db.js "SELECT ..."` — esegue qualsiasi query sul database Supabase.
Per gli INSERT con `returning id, name`, il risultato torna in JSON e va usato
per gli inserimenti in `dish_ingredients`.

## Struttura
- `dishes`: id (uuid), name, name_en, meal_slot, prep_min, cucina, paese, profilo,
  famiglia, ha_amido, ha_proteina, tecnica, occasione, health_score,
  base_amidacea, trasportabile, salsa_industriale, steps (jsonb), steps_en (jsonb)
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