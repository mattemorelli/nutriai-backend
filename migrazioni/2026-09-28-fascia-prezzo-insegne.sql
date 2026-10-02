-- 2026-09-28 — Fascia di prezzo delle insegne (€ / €€ / €€€).
--
-- Nuova informazione puramente decorativa sulle catene di supermercati
-- mostrate nella scheda Shops: quanto costa fare la spesa li', su una scala
-- a tre livelli. La fonte e' l'indagine annuale Altroconsumo sui
-- supermercati, edizione 2026 (rilevazione 16 febbraio - 13 marzo 2026,
-- 1.158 punti vendita, 67 citta'), classifica "prodotti piu' economici":
-- https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026
--
-- REGOLA ASSOLUTA, verificata prima di scrivere questo file: la fascia non
-- entra MAI nel voto delle insegne. Il voto vive nella vista voti_marche
-- (ambiente 40% + umano 40% + trasparenza 20%, dai 16 criteri di
-- criteri_voto/punteggi_marca) - questa migrazione non tocca ne'
-- criteri_voto ne' punteggi_marca ne' la vista, aggiunge solo colonne
-- nullable su marche che nessun calcolo del voto legge.
--
-- Le colonne sono tutte nullable e senza default: una catena senza dato
-- verificabile nella fonte resta a NULL, mai una fascia scritta a occhio
-- (vedi CLAUDE.md e la discussione di questa migrazione: Iper/Unes/Crai
-- sono rimaste fuori, nessun dato trovato dopo tre livelli di ricerca -
-- Selex e' arrivato in un secondo momento, 2026-09-28, con la regola
-- esplicita "prendi l'indice di Famila", vedi il blocco in fondo al file).
--
-- Sicura da rilanciare: "add column if not exists" ovunque, quindi su un
-- database dove e' gia' passata non fa niente. I valori scritti sotto sono
-- invece semplici UPDATE per nome+paese: rilanciarli non fa danni (scrivono
-- di nuovo lo stesso valore), ma non sono un "if not exists" - chi li
-- cambia a mano dopo e rilancia questo file se li vede sovrascritti.

alter table public.marche
  add column if not exists fascia_prezzo smallint check (fascia_prezzo between 1 and 3),
  add column if not exists fascia_indice numeric,
  add column if not exists fascia_metodo text check (fascia_metodo in ('diretto', 'media_formati', 'gruppo', 'stima_locale')),
  add column if not exists fascia_nota text,
  add column if not exists fascia_fonte text,
  add column if not exists fascia_anno smallint;

-- Le 10 catene con dato nazionale diretto o media di formati dello stesso
-- gruppo (le altre 4 visibili in app - Selex, Iper, Unes, Crai - restano
-- fuori da questa passata: nessun dato verificabile trovato per loro nella
-- ricerca del 2026-09-28, si scrivono solo dopo un nuovo ok esplicito).

-- Diretto: nome identico all'insegna Altroconsumo, indice preso cosi' com'e'.
update public.marche set
  fascia_prezzo = 1, fascia_indice = 100, fascia_metodo = 'diretto',
  fascia_nota = 'Eurospin, indice 100 (riferimento della classifica)',
  fascia_fonte = 'https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Eurospin';

update public.marche set
  fascia_prezzo = 1, fascia_indice = 102, fascia_metodo = 'diretto',
  fascia_nota = 'Lidl, indice 102',
  fascia_fonte = 'https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Lidl';

update public.marche set
  fascia_prezzo = 1, fascia_indice = 105, fascia_metodo = 'diretto',
  fascia_nota = 'MD, indice 105',
  fascia_fonte = 'https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'MD';

update public.marche set
  fascia_prezzo = 1, fascia_indice = 108, fascia_metodo = 'diretto',
  fascia_nota = 'Penny, indice 108',
  fascia_fonte = 'https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Penny';

update public.marche set
  fascia_prezzo = 1, fascia_indice = 103, fascia_metodo = 'diretto',
  fascia_nota = 'Aldi, indice 103',
  fascia_fonte = 'https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Aldi';

-- Media di formati: la nostra insegna e' generica, Altroconsumo distingue
-- piu' formati dello stesso gruppo - media semplice, metodo dichiarato.
update public.marche set
  fascia_prezzo = 2, fascia_indice = 120.5, fascia_metodo = 'media_formati',
  fascia_nota = 'Media di Coop 124 e Ipercoop 117',
  fascia_fonte = 'https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Coop';

update public.marche set
  fascia_prezzo = 2, fascia_indice = 121, fascia_metodo = 'media_formati',
  fascia_nota = 'Media di Esselunga 122 e Esselunga Superstore 120',
  fascia_fonte = 'https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Esselunga';

update public.marche set
  fascia_prezzo = 3, fascia_indice = 127.3, fascia_metodo = 'media_formati',
  fascia_nota = 'Media di Conad 130, Spazio Conad 123 e Conad Superstore 129',
  fascia_fonte = 'https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Conad';

update public.marche set
  fascia_prezzo = 3, fascia_indice = 130, fascia_metodo = 'media_formati',
  fascia_nota = 'Media di Carrefour 125 e Carrefour Market 135',
  fascia_fonte = 'https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Carrefour';

update public.marche set
  fascia_prezzo = 3, fascia_indice = 126, fascia_metodo = 'media_formati',
  fascia_nota = 'Media di Interspar 118 e Eurospar 134 (i due formati Despar in Italia)',
  fascia_fonte = 'https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Despar';

-- Aggiunta 2026-09-28 (approvata a parte): Selex e' un consorzio d'acquisto,
-- non un'insegna che il cliente vede sullo scaffale - i suoi soci vendono
-- sotto altri marchi, fra cui Famila (gia' nostra insegna separata). La
-- fascia si legge dal socio che ha un dato pubblicato, non si stima a occhio.
update public.marche set
  fascia_prezzo = 3, fascia_indice = 129.5, fascia_metodo = 'gruppo',
  fascia_nota = 'Famila, insegna dei soci Selex: media di Famila 128 e Famila Superstore 131',
  fascia_fonte = 'https://www.altroconsumo.it/alimentazione/fare-la-spesa/news/indagine-supermercati-convenienti-2026',
  fascia_anno = 2026
where paese = 'italy' and nome = 'Selex';
