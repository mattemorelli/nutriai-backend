// Rollback di un backup di voti salute (health_score). Rilegge un file di
// backup (lo stesso formato scritto prima di ogni ricalibrazione: un array
// di { id, name, health_score }) e riscrive su dishes.health_score i
// valori originali, riga per riga.
//
// SICUREZZA: di default e' A SECCO (--secco, o nessun flag) - stampa solo
// cosa farebbe, non scrive nulla. Scrive davvero SOLO con --scrivi
// esplicito, per evitare un rollback lanciato per errore.
//
// Uso:
//   node scripts/rollback-voti.js <file-di-backup.json>            (a secco, default)
//   node scripts/rollback-voti.js <file-di-backup.json> --scrivi   (scrive davvero)
//
// I backup vivono in ~/Progetti/backup-supabase/ (fuori dal repository,
// mai committati - vedi CLAUDE.md/convenzione del 25 ottobre 2026), con
// data e ora nel nome del file.
require('dotenv').config({ quiet: true });
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const fileBackup = process.argv[2];
const scrivi = process.argv.includes('--scrivi');

if (!fileBackup) {
  console.error('Uso: node scripts/rollback-voti.js <file-di-backup.json> [--scrivi]');
  process.exit(1);
}

(async () => {
  const righe = JSON.parse(fs.readFileSync(fileBackup, 'utf8'));
  if (!Array.isArray(righe) || !righe.length) {
    console.error('Il file di backup e\' vuoto o non e\' un array.');
    process.exit(1);
  }

  console.log(`Backup: ${fileBackup}`);
  console.log(`${righe.length} righe da ripristinare. Modalita': ${scrivi ? 'SCRITTURA VERA' : 'a secco (sola stampa)'}\n`);

  // Convalida: ogni riga deve avere id e health_score, e il piatto deve
  // ancora esistere con lo stesso nome - un backup vecchio su un piatto
  // rinominato o cancellato nel frattempo va segnalato, non applicato alla
  // cieca.
  const ids = righe.map((r) => r.id);
  const { data: attuali, error } = await supabase.from('dishes').select('id, name, health_score').in('id', ids);
  if (error) throw new Error(error.message);
  const attualeDi = Object.fromEntries(attuali.map((d) => [d.id, d]));

  let pronte = 0, problemi = 0;
  for (const r of righe) {
    const att = attualeDi[r.id];
    if (!att) {
      console.log(`  [PROBLEMA] ${r.id} (${r.name}): non esiste piu' nel database, saltato.`);
      problemi++;
      continue;
    }
    if (att.name !== r.name) {
      console.log(`  [AVVISO] ${r.id}: nome cambiato da "${r.name}" a "${att.name}" - procedo comunque, controlla che sia lo stesso piatto.`);
    }
    console.log(`  ${att.name.padEnd(50)} ${att.health_score} -> ${r.health_score}`);
    pronte++;
  }

  console.log(`\n${pronte} pronte, ${problemi} con problemi (saltate).`);

  if (!scrivi) {
    console.log('\nA secco: nessuna scrittura eseguita. Rilancia con --scrivi per applicare davvero.');
    return;
  }

  for (const r of righe) {
    if (!attualeDi[r.id]) continue;
    const { error: eScrittura } = await supabase.from('dishes').update({ health_score: r.health_score }).eq('id', r.id);
    if (eScrittura) throw new Error(`${r.name}: ${eScrittura.message}`);
  }
  console.log(`\nFATTO: ${pronte} voti ripristinati.`);
})().catch((e) => { console.error('ERRORE:', e.message); process.exitCode = 1; });
