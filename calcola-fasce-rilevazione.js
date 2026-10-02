// Calcola l'indice di prezzo stimato per le catene senza dato Altroconsumo
// (Iper, Unes, Crai), a partire dalla rilevazione Quadrio in
// rilevazioni_prezzi - legge SOLO da li', nessun'altra tabella.
//
// Metodo: sulle categorie presenti per TUTTE le catene rilevate, rapporto
// medio geometrico dei prezzi unitari X/R (media geometrica, non aritmetica,
// perche' stiamo confrontando rapporti di prezzo - la geometrica e' quella
// che non distorce quando un singolo prodotto ha un rapporto molto fuori
// scala). indice_X = indice_R * rapporto(X,R), fatto per ciascun riferimento
// e poi mediato.
require('dotenv').config();
const { Client } = require('pg');

const RIFERIMENTI = { Esselunga: 121, Carrefour: 125 };
const SCARTO_MASSIMO = 0.05;

function mediaGeometricaRapporti(prezzi, comuni, a, b) {
  const logSum = comuni.reduce((s, cat) => s + Math.log(prezzi[a][cat] / prezzi[b][cat]), 0);
  return Math.exp(logSum / comuni.length);
}

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const { rows } = await client.query(
    'select catena, categoria, prezzo_unitario from public.rilevazioni_prezzi'
  );
  await client.end();

  const prezzi = {};
  const catene = new Set();
  for (const r of rows) {
    catene.add(r.catena);
    (prezzi[r.catena] ||= {})[r.categoria] = Number(r.prezzo_unitario);
  }

  const perCatena = [...catene].map((c) => new Set(Object.keys(prezzi[c])));
  const comuni = [...perCatena[0]].filter((cat) => perCatena.every((s) => s.has(cat)));

  console.log(`Catene rilevate: ${[...catene].sort().join(', ')}`);
  console.log(`Categorie comuni a tutte: ${comuni.length}`);
  if (comuni.length !== 28) {
    console.error(`ATTESE 28 categorie comuni a tutte le catene, trovate ${comuni.length}. Mi fermo.`);
    process.exit(1);
  }

  const rapportoControllo = mediaGeometricaRapporti(prezzi, comuni, 'Carrefour', 'Esselunga');
  const atteso = RIFERIMENTI.Carrefour / RIFERIMENTI.Esselunga;
  const scarto = Math.abs(rapportoControllo - atteso) / atteso;
  console.log(
    `\nControllo di validita' del paniere - Carrefour/Esselunga: ${rapportoControllo.toFixed(3)} `
    + `(atteso ${atteso.toFixed(3)} da Altroconsumo 125/121, scarto ${(scarto * 100).toFixed(1)}%)`
  );
  if (scarto > SCARTO_MASSIMO) {
    console.error(`Scarto oltre il ${SCARTO_MASSIMO * 100}% ammesso: il paniere non e' valido. Mi fermo, nessun indice calcolato.`);
    process.exit(1);
  }

  const daStimare = [...catene].filter((c) => !(c in RIFERIMENTI));
  console.log('\nIndici stimati:');
  const risultati = {};
  for (const catena of daStimare.sort()) {
    const stimePerRiferimento = Object.entries(RIFERIMENTI).map(([rif, indiceRif]) => {
      const rapporto = mediaGeometricaRapporti(prezzi, comuni, catena, rif);
      return { rif, indice: indiceRif * rapporto };
    });
    const media = stimePerRiferimento.reduce((s, x) => s + x.indice, 0) / stimePerRiferimento.length;
    risultati[catena] = Math.round(media * 10) / 10;
    const dettaglio = stimePerRiferimento.map((x) => `${x.rif} ${x.indice.toFixed(1)}`).join(', ');
    console.log(`  ${catena}: ${risultati[catena]}  (${dettaglio})`);
  }

  console.log('\n' + JSON.stringify(risultati));
})().catch((e) => { console.error('ERRORE:', e.message); process.exit(1); });
