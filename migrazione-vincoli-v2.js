require('dotenv').config();
const { Client } = require('pg');

function normalizza(s) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_]+/g, ' ')
    .trim();
}

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');

    // --- A6: sciogliere le due ambiguita' residue nei sinonimi ---
    await client.query(`update categorie set sinonimi = array_remove(sinonimi, 'dairy') where codice = 'lattosio'`);
    await client.query(`update categorie set sinonimi = array_remove(sinonimi, 'pork') where codice = 'carne_rossa'`);

    // --- A10: separare crostacei / molluschi, con migrazione vincoli nella STESSA transazione ---
    await client.query(`
      insert into categorie (codice, nome_it, nome_en, tipo, sinonimi)
      values ('molluschi', 'Molluschi', 'Molluscs', 'allergene', ARRAY['molluscs','cozze','vongole','calamari','mussels','clams','squid','octopus','polpo'])
      on conflict (codice) do nothing
    `);

    await client.query(`update categorie set nome_it = 'Crostacei' where codice = 'crostacei'`);
    await client.query(`update categorie set sinonimi = array_remove(array_remove(array_remove(sinonimi, 'cozze'), 'vongole'), 'calamari') where codice = 'crostacei'`);

    const moveResult = await client.query(`
      update categorie_alimenti
      set categoria = 'molluschi'
      where categoria = 'crostacei'
        and food_id in ('calamari_it','capesante_it','cozze_it','polpo_it','seppie_it','vongole_it')
      returning food_id
    `);
    console.log('Alimenti spostati da crostacei a molluschi:', moveResult.rows.map(r => r.food_id));

    const migrResult = await client.query(`
      insert into user_constraints (user_id, kind, subject, severity, declared_at)
      select uc1.user_id, uc1.kind, 'molluschi', uc1.severity, uc1.declared_at
      from user_constraints uc1
      where uc1.subject = 'crostacei'
        and not exists (
          select 1 from user_constraints uc2
          where uc2.user_id = uc1.user_id and uc2.subject = 'molluschi'
        )
      returning user_id
    `);
    console.log('Vincoli utente migrati (crostacei -> anche molluschi):', migrResult.rows.length);

    // --- A5/A6: tabella degli alias, con vincolo di unicita' reale sul database ---
    await client.query(`drop table if exists alias_categoria`);
    await client.query(`
      create table alias_categoria (
        alias text primary key,
        codice text not null references categorie(codice)
      )
    `);

    const { rows: categorie } = await client.query(`select codice, nome_it, nome_en, sinonimi from categorie`);

    const alias = new Map(); // alias normalizzato -> codice
    const conflitti = [];
    for (const cat of categorie) {
      const candidati = [cat.codice, cat.nome_it, cat.nome_en, ...(cat.sinonimi || [])];
      for (const c of candidati) {
        const chiave = normalizza(c);
        if (!chiave) continue;
        if (alias.has(chiave) && alias.get(chiave) !== cat.codice) {
          conflitti.push(`"${chiave}" gia' assegnato a "${alias.get(chiave)}", ${cat.codice} lo rivendica anche`);
          continue;
        }
        alias.set(chiave, cat.codice);
      }
    }

    if (conflitti.length) {
      throw new Error('Conflitti irrisolti negli alias, migrazione interrotta:\n' + conflitti.join('\n'));
    }

    for (const [chiave, codice] of alias) {
      await client.query(`insert into alias_categoria (alias, codice) values ($1, $2)`, [chiave, codice]);
    }
    console.log('Alias inseriti:', alias.size);

    await client.query('COMMIT');
    console.log('\nMigrazione completata e confermata (COMMIT).');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('ERRORE, tutto annullato (ROLLBACK):', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();
