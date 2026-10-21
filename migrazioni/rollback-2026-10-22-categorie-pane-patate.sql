-- Rollback di 2026-10-22-categorie-pane-patate.sql. NON ESEGUITO.
-- Toglie solo le righe che quella migrazione ha aggiunto (nessuna riga
-- esistente viene toccata dalla migrazione, quindi il rollback e' una
-- semplice cancellazione, non un ripristino da backup - il backup resta
-- comunque la rete di sicurezza se qualcos'altro ha scritto nel frattempo).
--
-- Ordine inverso rispetto alla migrazione: prima categorie_alimenti (ha la
-- foreign key verso categorie), poi categorie - altrimenti la cancellazione
-- di categorie fallirebbe per il vincolo (o scatterebbe l'ON DELETE CASCADE
-- e cancellerebbe anche le righe categorie_alimenti prima di poterle
-- controllare: meglio esplicito).

delete from public.categorie_alimenti where categoria in ('pane', 'patate');
delete from public.categorie where codice in ('pane', 'patate');
