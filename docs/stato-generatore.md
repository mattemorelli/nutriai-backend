# Quadrio — stato del generatore e criteri di rilascio

Aggiornamento: 26 ottobre 2026. Questo e' il riferimento operativo da
aggiornare dopo ogni blocco: distinguere codice verificato, ipotesi,
funzioni mancanti e versione effettivamente distribuita. I documenti
precedenti descrivono anche stati storici e non vanno trattati come il
codice attuale. Nessuna percentuale di completezza senza criteri misurati.

## Blocco verificato in questa revisione

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

## Pubblicazione verificata

Commit del backend: `3a86549b818135f0ff9381f9eb2ece841e75ab99`.
Render ha confermato `Deploy succeeded | Live`; la risposta HTTP pubblica
riporta lo stesso commit. Backend locale di Expo riavviato sul codice
aggiornato. La pubblicazione riguarda il backend, non un invio all'App Store.

Prova online del 26/10/2026, ore 22:46 italiane: undici controlli sul
flusso reale, autenticazione, rifiuto minorenne, onboarding adulto,
salvataggio di sette giorni/56 porzioni, calorie, tetti in grammi,
rilettura piano, ingredienti e spesa. Account di prova isolato, sessione e
dati rimossi al termine, con verifica di assenza di residui.

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

Stato: PROGETTATO, IMPLEMENTAZIONE MANCANTE.

- Oggi: pranzo primo+contorno, cena secondo+contorno+base se serve;
  non descrivere il codice come un pasto completo obbligatorio a ogni pasto.
- Implementare quattro modelli: completo, piatto unico, secondo e
  contorno, freddo e veloce; scelta coerente con tempo, preferenze e
  fabbisogno, verificata su catalogo e con pasti bloccati/Swap.
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

Stato: PARZIALE. Prossimo blocco tecnico prioritario.

- Dieta/allergie sono filtri assoluti; estendere le prove oltre i casi verdi.
- Rivedere gli aumenti di emergenza di calorie/proteine. In particolare
  `candidatiSecondoProteico` e `candidatiSpuntinoProteico` non riusano tutti
  i filtri normali di tempo/paese/profilo. Rischio individuato sul codice,
  da riprodurre con test mirati prima della correzione.
- Questi scambi devono preservare piatti bloccati, avanzi, abbinamenti e
  contatori di ripetizione/salse/spuntini durante avanzamento e backtracking.
- Aggiungere disponibilita' attrezzi (es. senza forno) come dato reale
  dell'utente: oggi la matrice lo simula filtrando il catalogo.
- Controllare coerenza fra generazione, Swap, spostamenti, salti e spesa.

Chiuso quando: anche i percorsi di recupero e modifica rispettano tutte
le scelte, con regressioni mirate e matrice estesa.

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

Prossimo lavoro: aggiornare le dipendenze segnalate in G5 e riverificare
il servizio. Poi G3, percorsi di recupero proteico e conservazione delle
scelte dell'utente; seguono G1/G2 con criteri nutrizionali documentati.
