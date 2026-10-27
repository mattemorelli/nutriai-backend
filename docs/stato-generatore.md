# Quadrio — stato del generatore e criteri di rilascio

Aggiornamento: 27 ottobre 2026. Perimetro attuale richiesto da Matteo:
solo generatore. Questo e' il riferimento operativo da
aggiornare dopo ogni blocco: distinguere codice verificato, ipotesi,
funzioni mancanti e versione effettivamente distribuita. I documenti
precedenti descrivono anche stati storici e non vanno trattati come il
codice attuale. Nessuna percentuale di completezza senza criteri misurati.

## Primo blocco verificato e pubblicato

- Porzioni: applicazione dei minimi/massimi PRIMA della redistribuzione
  calorica, anche se il totale base e' gia' vicino all'obiettivo.
- Simulazione `salva:false,dettagli:true`: espone le stesse righe scalate
  e arrotondate usate per `plan_items`, senza scrivere piani.
- Errori di lettura di profilo, piatti bloccati, misure, allenamenti e PAL:
  interrompono il calcolo; non diventano dati assenti o dieta predefinita.
- Controllo allergeni: letture paginate con ordinamento stabile.
- Verifica automatica: 12 gruppi di controlli, inclusi 12 profili con
  target espliciti (1600/2400/3200 kcal, quattro diete), 17 nuovi test
  locali e i 26 controlli gia' esistenti sui limiti d'ingresso.
- Confronto su catalogo congelato (495 piatti, due semi su diversi
  fabbisogni e casi con allergie): prima 31/32 piani, 200 porzioni oltre
  limite; dopo 32/32 piani, zero oltre limite su 1816 porzioni/224 giorni.
  Nessuna violazione di dieta/allergie/tempo o intervallo calorico in quel
  campione. Il risultato non prova tutti i profili o l'adeguatezza clinica.
- La risposta alla radice del server include `X-Quadrio-Revision`:
  confrontarlo col commit pubblicato prima di dichiarare un deploy riuscito.

## Prima pubblicazione verificata

Commit del backend: `3a86549b818135f0ff9381f9eb2ece841e75ab99`.
Render ha confermato `Deploy succeeded | Live`; la risposta HTTP pubblica
riporta lo stesso commit. Backend locale di Expo riavviato sul codice
aggiornato. La pubblicazione riguarda il backend, non un invio all'App Store.

Prova online del 26/10/2026, ore 22:46 italiane: undici controlli sul
flusso reale, autenticazione, rifiuto minorenne, onboarding adulto,
salvataggio di sette giorni/56 porzioni, calorie, tetti in grammi,
rilettura piano, ingredienti e spesa. Account di prova isolato, sessione e
dati rimossi al termine, con verifica di assenza di residui.

## Pubblicazione precedente al nuovo blocco

Commit `e1d9711965234979a633ab45095fb0c5e23728f0`: recupero proteico
con selettori ordinari, piatti bloccati preservati, accompagnamenti entro
i tempi e contatori degli spuntini corretti. Revisione HTTP pubblica
confermata, undici controlli online superati e dati di prova rimossi.

## Nuovo blocco: bilanciamento finale delle proteine

Stato: pubblicato e verificato online il 27 ottobre 2026.
Commit `5b99e891d0001068ad7aa909e80c2c52c000cd5b`: revisione HTTP
confermata e 13 verifiche online superate, compresa la coerenza fra
proteine salvate e deficit dichiarati. Account e dati di prova rimossi.
Backend locale riavviato con lo stesso codice. I piani precedenti non
vengono modificati: il bilanciamento vale per le nuove generazioni.

Verifica finale: 13/13 gruppi superati, 9 nuove regressioni sulle
porzioni, 300 giornate sintetiche, 12 casi difficili e prova del tempo
virtuale. Matrice estesa: 32/32 settimane generate, nessuna violazione
rilevata di porzioni, tempi, dieta/allergie o intervallo calorico.
Nel campione con nuova ricerca restano 20/32 settimane con almeno
un deficit proteico dichiarato (64 giorni): il generatore non e' ancora
pienamente adeguato sul piano nutrizionale. Il confronto sugli STESSI
piatti sotto misura separatamente il beneficio delle sole porzioni.

Corretto anche un difetto preesistente di riproducibilita': i gradini
ereditavano il generatore casuale consumato dai tentativi interrotti.
Ora ogni gradino ha il proprio flusso; fino a tre tentativi finali
indipendenti, con tetto di passi per ciascuno, riducono i falsi fallimenti
di ricerca. Il limite totale di lavoro finale puo' quindi triplicare
nei casi difficili: la latenza in produzione resta da monitorare.
Test con orologio virtuale: identiche righe e concessioni dopo budget
temporali diversi nei tentativi precedenti.

- Redistribuisce le calorie tra le ricette gia' scelte per avvicinarsi al
  target proteico, conservando l'energia totale e i limiti delle porzioni.
- Mantiene sale e saturi entro i tetti esistenti; se sono gia' oltre,
  non li peggiora. Conserva il pavimento di fibra oppure, quando manca
  gia' fibra, non ne riduce ulteriormente la quantita'.
- Si applica alla settimana gia' costruita. Non modifica la ricerca dei
  piatti: la prova che inseriva il bilanciamento durante la ricerca ha
  esaurito i tentativi in casi di cene rapide prima completabili.
- Valutazione finale, concessioni, simulazione e salvataggio usano lo
  stesso target e gli stessi fattori. I deficit risolti non restano
  segnalati; quelli ancora presenti rimangono dichiarati.
- Confronto sugli stessi piatti dei 32 piani registrati: proteine
  aumentate in almeno 137/224 giorni; giorni sotto il minimo da 66 a
  non piu' di 54, settimane con almeno un deficit da 18 a non piu' di 16.
  Ricostruzione verificata su tutte le righe; per 16 giorni con flag
  interno ambiguo si considera il beneficio minore. Nessuna variazione
  calorica o violazione aggiuntiva dei limiti nei casi confrontati.
- Ricerca locale di scambi calorici, non ottimizzazione globale: puo'
  rimanere una combinazione migliore non individuata. Non certifica
  l'adeguatezza nutrizionale dei piani e non modifica le soglie esistenti.

## Nuovo blocco: tre strutture di pranzo e cena

Stato: verificato nel progetto, da pubblicare dopo i controlli.

- Il generatore puo' scegliere un piatto unico, un secondo con verdure
  (con pane/patate quando serve), oppure primo, secondo e verdure.
  La scelta migliora la giornata gia' costruita; non introduce nuovi
  spuntini e conserva il piano precedente quando non trova miglioramenti.
- Esclude dai nuovi modelli le ricette con ruoli mancanti, senza
  assumere che una composizione non definita sia completa.
- Usa ruoli e dati reali del catalogo, lo stesso pool gia' filtrato per
  dieta, allergie e preferenze, soglia di salute, paese/profilo, tecnica,
  trasportabilita' e tempi. Per le nuove combinazioni, la SOMMA dei tempi
  delle ricette rispetta il budget; il percorso storico conserva ancora
  il suo controllo per singola ricetta, non una schedulazione parallela.
- Proteine, calorie, sale/saturi e fibra vengono rivalutati sulla giornata
  e sulle stesse porzioni salvate. Le nuove strutture non peggiorano le
  carenze esistenti ne' le frequenze minime/massime rispetto al piano base.
- Frequenze ora contate sulle portate proteiche di pranzo E cena, una
  volta per gruppo e pasto. I tetti gia' superati nel piano base restano
  dichiarati, senza aggravarli durante il miglioramento dei modelli.
- Supportati primo bloccato a cena, secondo bloccato a pranzo, pasto
  completo bloccato e solo pane bloccato. Un accompagnamento generico
  bloccato non impone piu' il suo paese a tutta la giornata.
- Swap conserva i ruoli che il resto del pasto non fornisce, anche su
  un piatto unico senza gemelli. Verifica anche la conferma inviata dal
  client; componenti non risolvibili interrompono la sostituzione.
- Corretto giorni_conformi: conta effettivamente 0-7 giornate conformi,
  anziche' arrotondare un punteggio che comprendeva salute e completezza.
- Verifiche: 17 nuovi test locali, 12 casi sul catalogo reale senza
  scritture, 14/14 gruppi completi. Nel campione esteso: 32/32 settimane
  riuscite, zero violazioni rilevate di porzioni/tempi/dieta/calorie.
  Deficit proteici DICHIARATI: 62 -> 29 giorni su 224; 19 -> 9 settimane
  con almeno un deficit. Il conteggio con tolleranza di arrotondamento
  del confronto e' 60 -> 27 giorni. Sono misure del campione, non una
  garanzia per ogni profilo e non una validazione clinica.
- Restano aperti il modello esplicitamente freddo (trasportabile non
  significa freddo), scelta degli spuntini, limiti per ingredienti,
  ottimizzazione globale e coerenza completa di spostamenti/salti e
  ricalcolo nutrizionale dopo modifiche manuali del piano.

## Cinque blocchi da chiudere per un generatore pronto al lancio

### G1 — Fabbisogno e popolazione supportata

Stato: APERTO, priorita' alta.

- Documentare provenienza e significato dei quattro coefficienti NEAT.
  Le fonti su PAL/TEE comprendono la termogenesi; questo non dimostra
  da solo che i coefficienti specifici del codice siano PAL. La rimozione
  di `/0.90` resta un'ipotesi da validare, non una correzione gia' approvata.
- Validare sport, durata/intensita' e massa grassa: oggi alcuni input
  ricevono fallback o vengono ignorati invece di essere rifiutati.
- Verificare il ciclo aggiornamento peso/obiettivo/BMI/target: `/peso`
  controlla il range del peso ma non rivalida da solo il rapporto fra
  BMI e obiettivo; non equipararlo al controllo presente in onboarding.
- Scegliere e documentare una politica per proteine, fibra, sale/saturi
  e concessioni. Oggi la fibra e' segnalata ma non blocca la ricerca;
  sale/saturi sono allentabili dal gradino 2b; proteine solo all'ultimo.
- Revisione nutrizionale qualificata delle formule, porzioni e limiti
  di applicabilita' prima di promesse pubbliche di accuratezza sanitaria.

Chiuso quando: coefficienti e popolazione sono documentati, input
coerenti, aggiornamenti verificati e casi rappresentativi revisionati.

### G2 — Struttura dei pasti e porzioni realistiche

Stato: PARZIALE; tre strutture implementate nel nuovo blocco sopra.

- La ricerca di base parte ancora da pranzo primo+contorno e cena
  secondo+contorno+base; ora puo' migliorare entrambi con tre strutture.
  Non descrivere ogni pasto come completo obbligatorio: il percorso base
  rimane il risultato quando una alternativa non rispetta i vincoli.
- Restano da identificare con dati affidabili i piatti davvero freddi,
  oltre alla trasportabilita', e da ampliare la verifica delle strutture
  su piu' paesi, fabbisogni, pasti bloccati e modifiche manuali.
- Scegliere esplicitamente numero/presenza di spuntini. Oggi sono due
  automatici e puo' comparire un terzo per recuperare calorie.
- Definire limiti per GRUPPO DI INGREDIENTI e per giornata: far rispettare
  il tetto del piatto non basta a validare carne, pasta, olio o frutta
  secca realmente contenuti. I tetti tecnici attuali possono ancora essere
  troppo generosi quando crescono col fabbisogno.
- Definire pasti fuori casa vs pasti da portare: attualmente
  `pranzoFuoriIl` richiede trasportabilita', mentre `cook_days` riusa
  avanzi nelle sere senza cucina. Verificare che corrisponda alla promessa
  della griglia nell'app e che non compensi pasti esterni con porzioni enormi.

Chiuso quando: stessi profili/semi prima e dopo, porzioni per ingrediente
realistiche, nessuno spuntino o pasto aggiunto contro la scelta dell'utente.

### G3 — Vincoli rispettati in OGNI percorso

Stato: PARZIALE; recupero proteico corretto e pubblicato nel commit
`e1d9711965234979a633ab45095fb0c5e23728f0`.
Non considerare chiuso tutto G3.

- Recupero dei secondi e spuntini: riusa i selettori ordinari, con tempo,
  paese/profilo, gradimenti e ripetizioni; gli accompagnamenti rispettano
  anch'essi tempo, tecnica e compatibilita'.
- Colazione, secondo e spuntini bloccati preservati durante gli aumenti
  di energia/proteine. Avanzi e secondi ripetuti mantengono identita'.
- Contatori di gruppi/salse/spuntini ripristinati quando una sostituzione
  viene annullata; gli spuntini bloccati contano negli usi settimanali.
- Fino a tre spuntini bloccati al giorno vengono conservati, senza che
  il terzo sovrascriva il secondo.
- Regressione riprodotta sulla versione precedente: i dodici casi mirati
  di cene da 15/20 minuti e scelte bloccate fallivano sui vincoli. Sulla
  correzione i dodici casi passano, compresi tre spuntini bloccati nello
  stesso giorno; 13 test locali dedicati passano.
- Confronto aggiuntivo su catalogo congelato: 32/32 settimane generate,
  senza violazioni rilevate di porzioni, tempi, dieta/allergie o intervallo
  calorico. Questo campione non prova tutte le combinazioni supportate.
  Le richieste proteiche difficili possono ancora terminare all'ultimo
  gradino con deficit proteico dichiarato: la correzione dei vincoli non
  equivale a dimostrare che ogni target proteico sia raggiungibile.
- Verifica completa del nuovo blocco: 13/13 gruppi superati, inclusi
  i controlli permanenti precedenti e i 12 casi mirati sul catalogo reale.
- Restano da aggiungere disponibilita' attrezzi (es. senza forno) come
  dato reale dell'utente e una matrice piu' ampia di combinazioni.
- Restano verifiche complete di coerenza fra generazione, Swap,
  spostamenti, salti, pasti da portare e spesa.

Chiuso quando: tutti i percorsi di costruzione/modifica rispettano le
scelte, con regressioni mirate e matrice estesa, non solo questi 12 casi.

### G4 — Catalogo e ricette del mercato attivo

Stato: PARZIALE.

- Verifiche correnti: 495 piatti attivi; zero discrepanze nei flag
  allergenici e nessun voto attivo fermo a 10 come la formula saturata.
- Restano audit di ingredienti/nomi, dati mancanti o incoerenti,
  secco/cotto/sciacquato, duplicati e varianti quasi identiche.
- Estendere la verifica Cook ai campi legacy `steps`/`steps_en`:
  il controllo su `ricetta_passi` non copre da solo ogni ricetta visibile.
  I conteggi di mismatch nei documenti precedenti vanno rimisurati.
- Calibrazione nutrizionale del catalogo oltre ai lotti gia' revisionati;
  un controllo automatico verde non sostituisce la revisione delle ricette.

Chiuso quando: il catalogo di lancio ha dati e ricette validati e tutti
i problemi che alterano allergie, calorie o istruzioni sono risolti.

### G5 — Affidabilita' e validazione completa

Stato: PARZIALE.

- Matrice estesa: diete x allergie x fabbisogni x tempi x pasti da portare
  x attrezzi x piatti bloccati x aggiornamenti profilo, piu' semi fissi.
- Verifica locale + produzione con account di prova isolato, compresi
  salvataggio, rilettura piano, ingredienti e lista spesa.
- Profilazione dei casi difficili: l'ultimo gradino ha ancora ricerca
  senza tetto temporale; evitare blocchi prolungati del server Node.
- Diagnosi piu' utile di `non_identificato` e limiti di copertura dichiarati.
- Audit dipendenze del 26/10/2026: tre avvisi nelle dipendenze di
  produzione (`proxy-addr` critico, `body-parser` alto, `qs` moderato),
  correzioni disponibili. Il numero di severita' non dimostra da solo
  sfruttabilita' nella configurazione attuale; aggiornare e riverificare.
  Il log completo della build conta anche una dipendenza di sviluppo.
- Allineare il runtime testato e quello distribuito: locale Node 24,
  Render Node 26 al rilascio; `engines >=20` non fissa una versione.
- TestFlight su dispositivi veri, errori di rete, sessioni scadute,
  rigenerazioni, carico e monitoraggio di errori/latenza con rollback.

Chiuso quando: nessuna violazione assoluta nella matrice concordata,
risultati nutrizionali revisionati, prestazioni accettate e beta stabile.

## App Store: quattro aree ulteriori rispetto al generatore

1. Pagamenti Pro: i pulsanti `onAcquista` oggi fanno `console.log` in
   Settimana/Spesa/Profilo. Servono acquisto reale, ripristino, stato
   abbonamento verificato dal server e gestione rinnovi/scadenze.
2. Account e privacy: consenso sanitario esistente, ma cancellazione
   account nell'app non individuata nelle schermate/rotte attuali.
   Verificare informativa, uso/ritenzione dei dati, autorizzazioni e
   dichiarazioni privacy. Non considerare questa una verifica legale completa.
3. Interfaccia coerente: onboarding consente ancora eta' da 15 anni e
   range antropometrici diversi dal backend. Allineare limiti e messaggi
   di errore. Verificare accessibilita' e testi che descrivono le capacita'.
4. Distribuzione iOS: build di produzione con URL pubblico esplicito
   (il `.env` di sviluppo punta a localhost), identificativi/configurazione
   release, TestFlight, schermate/materiali App Store, supporto e account
   dimostrativo per la revisione. Stato dell'account App Store Connect
   non verificato in questo lavoro.

Riferimento Apple verificato il 26/10/2026:
https://developer.apple.com/app-store/review/guidelines/
(1.4 accuratezza/ambito salute; 2.1 completezza; 3.1 pagamenti;
5.1 privacy e cancellazione). Le regole vanno ricontrollate al rilascio.

## Miglioramenti successivi, separati dai blocchi di lancio

Dispensa nella scelta dei piatti (oggi sottratta dalla spesa), budget e
stima costo, gradimenti positivi, stagionalita' nella scelta, abilita'
in cucina, varieta' su piu' settimane. Sono capacita' utili, non tutte
obbligatorie per una prima versione se non vengono promesse nell'app.

## Quanto manca e prossimo passo

Mancano cinque blocchi sostanziali del generatore e le quattro aree
di rilascio sopra: non siamo alla sola rifinitura per l'App Store.
Ordine di grandezza di pianificazione: alcune settimane di sviluppo,
revisione nutrizionale e beta, non pochi ritocchi. Nessuna data o
percentuale affidabile prima di chiudere G1-G3 e misurare G4-G5.

Il criterio e' una versione affidabile per una popolazione e un insieme
di casi dichiarati, con problemi noti gestiti e monitoraggio; "perfetto"
non e' una condizione dimostrabile da un campione di test.

Prossimo lavoro nel perimetro attuale: G2, piu' modelli di pranzo/cena
e presenza di una portata proteica coerente con il resto della giornata;
poi numero degli spuntini e limiti per ingredienti. G1 (fabbisogno)
resta da validare con criteri nutrizionali documentati. Le attivita' su infrastruttura e App
Store restano separate dal lavoro ora richiesto sul generatore.
