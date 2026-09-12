// Fase 2 — voto_salute (1-10), granulare per prodotto.
//
// Priorità delle fonti, dalla più affidabile alla più dedotta:
//  1. nutriscore_score reale (OFF) -> non stimato
//  2. nutrienti grezzi (>=3 su 5 disponibili) -> stimato (nostra approssimazione
//     dei punti Nutri-Score, non l'algoritmo ufficiale)
//  3. solo nova_group -> stimato (proxy debole ma reale sul prodotto)
//  4. nessun dato -> mediana di voto_salute della categoria -> stimato
//
// nova_group e additivi_n intervengono sempre come aggiustamento secondario,
// mai come base, e solo se presenti (assenti = nessun aggiustamento, mai inventati).
require('dotenv').config();
const { Client } = require('pg');

// ---- mappatura punteggio Nutri-Score (-15 ottimo, 40 pessimo) -> base 1-10 ----
function baseDaComposito(x) {
  const b = 10 - (x + 15) / 55 * 9;
  return Math.max(1, Math.min(10, b));
}

// ---- approssimazione dei punti Nutri-Score dai nutrienti grezzi ----
function compositoApprossimato({ energia, zuccheri, grassiSaturi, sale, fibra, proteine }) {
  const pt = (v, passo, max) => v == null ? 0 : Math.max(0, Math.min(max, Math.floor(v / passo)));
  const negativi = pt(energia, 335, 10) + pt(zuccheri, 4.5, 10) + pt(grassiSaturi, 1, 10) + pt(sale, 0.2, 10);
  const positivi = pt(fibra, 0.9, 5) + pt(proteine, 1.6, 5);
  return negativi - positivi;
}

function deltaNova(nova) {
  return { 1: 0.3, 2: 0, 3: -0.3, 4: -0.8 }[nova] ?? 0;
}
function deltaAdditivi(n) {
  if (n == null) return 0;
  if (n === 0) return 0;
  if (n <= 2) return -0.1;
  if (n <= 5) return -0.3;
  return -0.6;
}
function baseSoloNova(nova) {
  return { 1: 8.0, 2: 6.5, 3: 5.0, 4: 3.0 }[nova] ?? null;
}

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const { rows } = await client.query(`
    select barcode, categoria_riconosciuta, nova_group, additivi_n,
           voto_salute_json->'dati_grezzi' as grezzi
    from prodotti
  `);
  console.log(`Prodotti caricati: ${rows.length}`);

  const risultati = [];
  const senzaNulla = [];

  for (const r of rows) {
    const g = r.grezzi || {};
    const nutriscoreScore = g.nutriscore_score != null ? Number(g.nutriscore_score) : null;
    const nutrienti = {
      energia: g.energy_kcal_100g != null ? Number(g.energy_kcal_100g) : null,
      zuccheri: g.sugars_100g != null ? Number(g.sugars_100g) : null,
      grassiSaturi: g.saturated_fat_100g != null ? Number(g.saturated_fat_100g) : null,
      sale: g.salt_100g != null ? Number(g.salt_100g) : null,
      fibra: g.fiber_100g != null ? Number(g.fiber_100g) : null,
      proteine: g.proteins_100g != null ? Number(g.proteins_100g) : null,
    };
    // energia conta come segnale ma non tra i nutrienti chiave che decidono l'affidabilita'
    const nNutrientiChiave = ['zuccheri', 'grassiSaturi', 'sale', 'fibra', 'proteine']
      .filter(k => nutrienti[k] != null).length;

    let base, stimato, fonte;
    if (nutriscoreScore != null) {
      base = baseDaComposito(nutriscoreScore);
      stimato = false;
      fonte = 'nutriscore_reale';
    } else if (nNutrientiChiave >= 3) {
      const comp = compositoApprossimato(nutrienti);
      base = baseDaComposito(comp);
      stimato = true;
      fonte = 'nutrienti_approssimato';
    } else if (r.nova_group != null) {
      base = baseSoloNova(r.nova_group);
      stimato = true;
      fonte = 'solo_nova';
    } else {
      senzaNulla.push(r);
      continue;
    }

    const nova = r.nova_group != null ? deltaNova(r.nova_group) : 0;
    const add = deltaAdditivi(r.additivi_n);
    const finale = Math.max(1, Math.min(10, base + nova + add));

    risultati.push({
      barcode: r.barcode,
      categoria: r.categoria_riconosciuta,
      voto_salute: Math.round(finale * 10) / 10,
      voto_salute_stimato: stimato,
      fonte,
      base: Math.round(base * 10) / 10,
      delta_nova: nova,
      delta_additivi: add,
    });
  }

  console.log(`Con base calcolabile (reale o approssimata o solo-nova): ${risultati.length}`);
  console.log(`Senza alcun dato (nutriscore, nutrienti, nova tutti assenti): ${senzaNulla.length}`);

  // ---- mediana di categoria per chi non ha nessun dato ----
  const perCategoria = {};
  for (const r of risultati) {
    (perCategoria[r.categoria] ||= []).push(r.voto_salute);
  }
  const medianaDi = {};
  for (const [cat, vals] of Object.entries(perCategoria)) {
    const ord = [...vals].sort((a, b) => a - b);
    const mezzo = Math.floor(ord.length / 2);
    medianaDi[cat] = ord.length % 2 ? ord[mezzo] : (ord[mezzo - 1] + ord[mezzo]) / 2;
  }

  let senzaCategoria = 0;
  for (const r of senzaNulla) {
    const mediana = medianaDi[r.categoria_riconosciuta];
    if (mediana == null) { senzaCategoria++; continue; }
    risultati.push({
      barcode: r.barcode,
      categoria: r.categoria_riconosciuta,
      voto_salute: Math.round(mediana * 10) / 10,
      voto_salute_stimato: true,
      fonte: 'mediana_categoria',
      base: null, delta_nova: 0, delta_additivi: 0,
    });
  }
  console.log(`Assegnati per mediana di categoria: ${senzaNulla.length - senzaCategoria}`);
  console.log(`Categorie senza nessun prodotto con base calcolabile (impossibile anche la mediana): ${senzaCategoria}`);

  // ---- scrittura in blocchi ----
  const BLOCCO = 500;
  for (let i = 0; i < risultati.length; i += BLOCCO) {
    const batch = risultati.slice(i, i + BLOCCO);
    await client.query(
      `update prodotti p set
         voto_salute = (elem->>'voto_salute')::numeric,
         voto_salute_stimato = (elem->>'voto_salute_stimato')::boolean,
         voto_salute_json = coalesce(p.voto_salute_json,'{}'::jsonb) || jsonb_build_object(
           'fonte', elem->>'fonte',
           'base', (elem->>'base')::numeric,
           'delta_nova', (elem->>'delta_nova')::numeric,
           'delta_additivi', (elem->>'delta_additivi')::numeric
         )
       from jsonb_array_elements($1::jsonb) as elem
       where p.barcode = elem->>'barcode'`,
      [JSON.stringify(batch)]
    );
    process.stdout.write(`\rscritti ${Math.min(i + BLOCCO, risultati.length)}/${risultati.length}`);
  }

  console.log(`\n\nFatto. Voto_salute assegnato a ${risultati.length} prodotti su ${rows.length}.`);
  await client.end();
})();
