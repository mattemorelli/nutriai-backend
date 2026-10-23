# Scala dei voti salute — criteri di calibrazione a mano

Nato il 25 ottobre 2026, dopo aver trovato piu' volte lo stesso problema:
`voto-piatti.js` (formula v3) e' un ALLARME, non un giudizio - sopra una
certa soglia di qualita' nutrizionale satura sempre a 10 (quasi tutti i
piatti a base di legumi, per esempio, calcolano 10 dalla formula: saturi e
sale sono naturalmente bassi, la formula non ha piu' niente da penalizzare).
Il voto vero, nella fascia alta, si da' **a mano**, confrontando il piatto
con altri piatti simili gia' calibrati - mai un numero isolato, sempre
dentro un gruppo.

Questo file e' la fonte permanente di quel confronto: ogni calibrazione
futura deve partire dagli ancoraggi qui sotto, non reinventarli da zero -
e' esattamente l'errore del 25 ottobre (il lotto delle "cene veloci" e il
lotto 02 confrontati ciascuno con UN riferimento esterno diverso, mai tra
loro, producendo incoerenze dentro lo stesso gruppo di piatti).

## Ancoraggi fra gruppi (voti gia' decisi, non ridiscuterli senza una ragione forte)

| Piatto | Voto | Gruppo |
|---|---|---|
| Hamburger di manzo in padella | 7,6 | carne rossa, padella, senza verdura |
| Frittate (zucchine, funghi, ...) | 7,1-7,3 | uova + verdura, padella |
| Fettine di tacchino ai ferri | 8,4 | carne bianca magra, padella, senza verdura |
| Filetti di nasello in padella al limone | 8,3 | pesce magro, padella, senza verdura |
| Merluzzo al cartoccio con pomodorini e olive | 9,0 | pesce + verdura, forno/cartoccio |
| Tofu in padella con zucchine | 8,6 | proteina vegetale + verdura, padella |

**Regola che gli ancoraggi insegnano**: una proteina magra COTTA SEMPLICE
SENZA VERDURA sta verso 8,3-8,4; la stessa proteina CON VERDURA (o legumi,
che la verdura la portano sempre con se') sale verso 8,6-9,0; uova in
padella restano piu' basse (7,1-7,3) perche' la frittata porta grassi
saturi piu' alti a parita' di kcal; la carne rossa senza verdura e' la piu'
bassa delle proteine "pulite" (7,6) per i saturi piu' alti della specie.

## Come si confrontano i piatti DENTRO lo stesso gruppo

1. Non il voto calcolato dalla formula (satura a 10 per quasi tutti i
   piatti vegetali) - i quattro numeri veri sono **per 100 kcal**, non
   totali: grammi di fibra, proteine, grassi saturi, sale ogni 100 kcal
   del piatto. Un piatto da 600 kcal e uno da 300 kcal con la stessa
   composizione hanno lo stesso profilo per 100 kcal - il voto non deve
   cambiare solo perche' la porzione e' piu' grande.
2. Pesi, in ordine: saturi/100kcal (il piu' pesante, ogni +0,1 vale circa
   -0,2/-0,3 punti dentro lo stesso gruppo), sale/100kcal (peso simile),
   fibra/100kcal (bonus, non supera mai un problema di saturi/sale alti).
3. **Pasta o pane nel piatto**: -0,3/-0,5 punti rispetto allo stesso
   ingrediente principale senza - diluisce la fibra per kcal e aggiunge
   carboidrati raffinati, anche quando saturi/sale restano bassi.
4. **Metodo di cottura**: crudo/insalata e umido/lessato non aggiungono
   grassi da cottura; padella e forno possono aggiungerne (olio, formaggio
   gratinato) - ma la differenza si giudica dai NUMERI (saturi/100kcal
   reali), mai dal nome del metodo da solo. Due piatti con saturi/sale/
   fibra quasi identici restano vicini in voto anche se uno e' "in padella"
   e l'altro "al forno" - la cottura spiega una differenza SOLO se i numeri
   la confermano (visto il 25 ottobre: "Polpette di lenticchie al forno"
   e "...in padella" avevano numeri quasi identici, persino leggermente
   migliori per la versione in padella, ma un salto di 1,5 punti senza
   alcun numero a sostegno - corretto portandoli a 0,1-0,3 punti di
   distanza).
5. **Proteina animale aggiunta a un piatto di legumi** (tonno, uova,
   formaggio): il piatto esce dal gruppo "legumi puri" ed entra in un
   gruppo misto, giudicato contro gli ancoraggi di quella proteina (es.
   "Pecorino con fave", saturi altissimi da formaggio, si giudica vicino
   ai piatti di formaggio/carne grassa, non ai legumi puri).
6. Mai una differenza superiore a 0,3-0,5 punti tra due piatti con i
   quattro numeri per 100kcal quasi identici, a meno che un quinto fattore
   (proteina animale aggiunta, metodo di cottura CON numeri a conferma,
   porzione irrealistica) lo spieghi esplicitamente.

## Frutta e dolci: criterio sullo zucchero AGGIUNTO

Lo zucchero TOTALE (quello che la formula leggerebbe) non distingue niente
qui: la frutta ha sempre zucchero naturale, alto o basso secondo la specie,
indipendente da quanto e' stata "lavorata". Il criterio giusto e' lo
zucchero AGGIUNTO in ricetta (zucchero, miele, sciroppo, marmellata),
leggendo gli ingredienti veri, non una stima:

- **Frutta fresca intera, senza nulla aggiunto**: 9,0-9,5. Dentro questa
  fascia, la specie con meno zucchero totale e piu' fibra (es. i frutti di
  bosco) sta piu' in alto.
- **Frutta intera ma piu' densa per natura (es. frutta secca come i
  datteri) o cotta senza zucchero aggiunto**: 8,0-8,5 - resta comunque
  "solo frutta", nessun ingrediente in piu'.
- **Con zucchero aggiunto in ricetta**: 6,5-7,5, piu' basso quanto piu'
  zucchero aggiunto c'e' (in grammi assoluti per porzione, non per 100kcal
  - qui conta cosa hai davvero aggiunto con il cucchiaio, non la densita').
  Una fibra alta nel frutto di base (es. le more in una composta) alza
  leggermente il piatto dentro questa fascia, non lo fa uscire dalla
  fascia.

## Nomi: niente qualificazioni tra parentesi senza una vera disambiguazione

Una parentesi come "(versione fresca)" o "(contorno)"/"(spuntino)" e'
legittima SOLO se esiste davvero un altro piatto da cui distinguersi. Se
non esiste (controllare con una query sul nome, come nel caso di "Pesche
allo sciroppo (versione fresca)", 25 ottobre: nessun'altra "Pesche allo
sciroppo" nel catalogo), la parentesi e' un resto di lavorazione interna e
va tolta - il nome deve descrivere onestamente cosa c'e' davvero in
ricetta (vedi anche `scripts/verifica-nomi-piatti.js`).
