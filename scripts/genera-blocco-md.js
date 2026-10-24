require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const file = process.argv[2];
if (!file) { console.error('Uso: node scripts/_genera-blocco-md.js <file-dati.json>'); process.exit(1); }
const dati = require(path.resolve(__dirname, file));

function fmtTempo(p) {
  const parti = [];
  if (p.durata_min != null) {
    const bollini = [p.tipo_tempo === 'attesa' ? 'attesa' : 'attiva'];
    if (p.in_parallelo) bollini.push('in parallelo');
    if (p.tempo_da_confezione) bollini.push('da confezione');
    parti.push(`${p.durata_min} min (${bollini.join(', ')})`);
  }
  if (p.temperatura_c != null) parti.push(`forno ${p.temperatura_c}°C ${p.forno_modalita}`);
  if (p.fuoco) parti.push(`fuoco ${p.fuoco}`);
  return parti.length ? parti.join(' · ') : '—';
}

function tempoTotaleReale(passi) {
  let totale = 0, residuo = 0;
  for (const p of passi) {
    if (p.durata_min == null) continue;
    if (p.tipo_tempo === 'attesa') { totale += p.durata_min; residuo = p.durata_min; continue; }
    if (p.in_parallelo) {
      if (p.durata_min <= residuo) residuo -= p.durata_min;
      else { totale += p.durata_min - residuo; residuo = 0; }
    } else { totale += p.durata_min; residuo = 0; }
  }
  return Math.round(totale * 10) / 10;
}

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const foodIds = new Set();
  for (const r of dati.ricette) for (const p of r.passi) for (const i of (p.ingredienti || [])) foodIds.add(i.food_id);
  const { rows } = await client.query('select id, name_it, name_en from foods where id = any($1::text[])', [[...foodIds]]);
  await client.end();
  const nomeDi = Object.fromEntries(rows.map(f => [f.id, { it: f.name_it, en: f.name_en || f.name_it }]));

  function fmtIngredienti(p, lingua) {
    if (!p.ingredienti || !p.ingredienti.length) return '—';
    return p.ingredienti.map(i => {
      const n = nomeDi[i.food_id] || { it: i.food_id, en: i.food_id };
      return `${n[lingua]} (${Math.round(i.quota * 100)}%)`;
    }).join(', ');
  }

  let md = '';
  const dubbi = [];

  for (const r of dati.ricette) {
    const totale = tempoTotaleReale(r.passi);

    md += `## ${r.nome}\n\n`;
    md += `*${r.nome_en}* — ${r.meal_slot} — id \`${r.dish_id}\`\n\n`;
    md += `**Tempo totale reale: ${totale} min**` + (r.prep_anticipo ? ` — richiede preparazione in anticipo (${r.prep_anticipo.ore}h prima)` : '') + '\n\n';

    if (r.prep_anticipo) {
      md += `**Da fare in anticipo:** ${r.prep_anticipo.it} *(${r.prep_anticipo.en})*\n\n`;
    }

    if (r.note.length) {
      md += '**Note:**\n';
      for (const n of r.note) md += `- ${n}\n`;
      md += '\n';
      for (const n of r.note) dubbi.push(`- **${r.nome}**: ${n}`);
    }

    md += '### Passaggi (italiano)\n\n';
    r.passi.forEach(p => {
      md += `${p.ordine}. **[${p.azione}]** ${p.testo_it}\n`;
      md += `   tempo/fuoco: ${fmtTempo(p)} — ingredienti: ${fmtIngredienti(p, 'it')}\n\n`;
    });

    md += '### Steps (English)\n\n';
    r.passi.forEach(p => {
      md += `${p.ordine}. **[${p.azione}]** ${p.testo_en}\n`;
      md += `   time/heat: ${fmtTempo(p)} — ingredients: ${fmtIngredienti(p, 'en')}\n\n`;
    });
    md += '---\n\n';
  }

  const dest = path.join(process.env.HOME, 'Progetti/nutriai/audit/cook-ricette.md');
  const esiste = fs.existsSync(dest);
  if (!esiste) {
    const intestazione = '# Cook — ricette del gruppo A\n\n' +
      'Stesso formato di `cook-prova.md`. Ricette scritte a blocchi (vedi `scripts/cook-blocco-NN-dati.json`), ' +
      'ognuna verificata con `scripts/verifica-cook.js` e inserita in `ricetta_passi` prima di essere aggiunta qui.\n\n---\n\n';
    fs.writeFileSync(dest, intestazione + md);
  } else {
    fs.appendFileSync(dest, md);
  }

  if (dubbi.length) {
    const nomeBlocco = path.basename(file, '.json');
    let sezione = `## Dati da controllare — ${nomeBlocco}\n\n`;
    sezione += 'Trovati scrivendo le ricette, non corretti (solo segnalati):\n\n';
    for (const d of dubbi) sezione += `${d}\n`;
    sezione += '\n---\n\n';
    fs.appendFileSync(dest, sezione);
  }

  console.log('Aggiornato:', dest, esiste ? '(append)' : '(creato)', '| ricette aggiunte:', dati.ricette.length, '| note da controllare:', dubbi.length);
})();
