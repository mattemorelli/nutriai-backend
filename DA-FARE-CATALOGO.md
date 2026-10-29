# Da fare sul catalogo — blocco futuro

Tre voci, nessuna avviata. Ogni script è SOLA LETTURA (nessuno scrive da
solo): produce l'elenco da correggere a mano, non la correzione.

## 1. Voti fuori dalla scala della regola 2

**Quanti**: 44 piatti con `health_score = 10`.

**Script**: `node trova-voti-fuori-scala.js` — li elenca con reparto e
primi 4 ingredienti per reparto, per capire a colpo d'occhio a quale
fascia dovrebbero appartenere.

**Regola**: nessuna fascia della regola 2 di CLAUDE.md arriva a 10 (verdure
crude/vapore 9.0-9.4, legumi 9.0-9.4, pesce magro 8.8-9.3, pollame
8.5-9.1, uova 8.0-8.7, carne rossa 7.8-8.4, pane/patate 8.0-8.6, dolci mai
sopra 7.5) — un 10 piatto è quasi sempre un voto "a soffitto", non
ragionato sulla fascia vera del piatto. Dalla prima lettura: la
maggioranza (~34) sono piatti a base di lenticchie (legumi: andrebbero
portati a 9.0-9.4, non lasciati a 10), una decina sono dolci (frutta
cotta/composte: regola 2 dice mai sopra 7.5, qui è una violazione netta,
non solo "fuori scala"), pochi sono frutta fresca semplice come spuntino
(nessuna fascia dedicata nella regola 2 — va deciso a parte se merita una
fascia propria o rientra in "verdure/frutta" 9.0-9.4).

## 2. Nomi con un ingrediente assente (controllo estero al catalogo)

**Quanti**: 126 candidati residui dopo il filtro delle parole-rumore
confermate (insalata/zuppa/verdure/salsa/formaggio generici, salse
composte come chimichurri/vinaigrette, singolare/plurale). Stima onesta
su un campione verificato a mano: **~55-65 casi genuini**, il resto sono
ancora falsi positivi non ancora filtrati (altre parole generiche, o
l'ingrediente c'è sotto un'altra forma che il dizionario non riconosce).

**Script**: `node trova-nomi-ingrediente-assente.js` — confronta ogni
parola del nome italiano con `foods.name_it` + sinonimi su tutto il
catalogo, salva l'elenco in `candidati-nomi-assenti.json`.

**Regola**: la stessa dei 26 corretti questa settimana — il nome dice la
verità, si corregge l'ingrediente (o si inserisce quello mancante con
valori USDA/CREA reali, regola 1). Nessun candidato va corretto senza
prima controllare a mano `dish_ingredients` per quel piatto: il filtro
automatico sbaglia spesso, in entrambe le direzioni (falsi positivi su
parole generiche, falsi negativi quando l'ingrediente c'è ma sotto un
nome/sinonimo che il dizionario non collega).

## 3. Piatti da portare al formato Cook

**Quanti**: 786 piatti con 3-4 passaggi (la fascia "quasi pronta" da cui
ripartire). Il resto del catalogo: 283 piatti a 1 passo, 949 a 2 — molti
di più, ma troppo lontani dal formato per lo stesso blocco di lavoro — e
solo 104 già a 5-8 passi (di cui non tutti passano comunque
`valida-ricette-cook.js`: numero di passaggi IT/EN diverso, formato tempo,
o altri controlli della regola 6/7/F/C).

**Script**: `node trova-piatti-da-portare-a-cook.js` — stampa la
distribuzione completa e salva l'elenco dei 3-4 passaggi in
`piatti-3-4-passaggi.json`, con il conteggio per paese (Francia, Spagna e
Grecia sono le fette più grandi).

**Regola**: regola 6 di CLAUDE.md — steps e steps_en completi in entrambe
le lingue, stesso numero di passaggi, 5-8, un'azione per passaggio, tempi
sempre "X min"/"X-Y min", "Mentre"/"While" per le azioni in parallelo.
Dopo la riscrittura di un blocco, farlo passare da
`node valida-ricette-cook.js <blocco.json>` prima di considerarlo fatto -
non limitarsi a contare i passaggi.
