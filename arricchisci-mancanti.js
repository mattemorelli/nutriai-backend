require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { calcolaVoto, modificatoriDa, categoriaDa } = require('./voto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

const PAUSA = 2000;          // ms fra una chiamata e l'altra
const CATEGORIE = ['uova','pollame','pesce_allevato','latte','yogurt','formaggio','maiale','olio'];
const CAMPI = 'code,product_name,brands,categories_tags,labels_tags,ingredients_tags,'
  + 'packaging_tags,origins,manufacturing_places,nova_group,additives_n';

const attesa = (ms) => new Promise(r => setTimeout(r, ms));

// PostgREST impone un tetto di righe per risposta (di default 1000)
// indipendente da .limit(): categorie come formaggio o latte hanno migliaia
// di prodotti in italy, quindi va paginato con .range().
async function paginaTutto(costruisciQuery) {
  const righe = [];
  const PAGINA = 1000;
  for (let offset = 0; ; offset += PAGINA) {
    const { data: blocco, error } = await costruisciQuery(offset, offset + PAGINA - 1);
    if (error) throw new Error(error.message);
    righe.push(...(blocco || []));
    if (!blocco || blocco.length < PAGINA) break;
  }
  return righe;
}

async function scheda(barcode) {
  try {
    const r = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${CAMPI}`,
      { headers: { 'User-Agent': 'Sorrel/0.1 (sorrel.app)' } }
    );
    if (!r.ok) return { errore: r.status };
    const t = await r.text();
    const d = JSON.parse(t);
    return d.status === 1 ? { prodotto: d.product } : { vuoto: true };
  } catch (e) {
    return { errore: e.message };
  }
}

(async () => {
  // dati di riferimento
  const { data: categorie } = await supabase.from('impatto_categorie').select('*');
  const { data: pesi } = await supabase.from('voto_pesi').select('*');
  const { data: modificatori } = await supabase.from('voto_modificatori').select('*');
  const baseDi = {}; for (const c of categorie) baseDi[c.categoria] = c;
  const pesiDi = { vegetale: [], animale: [] };
  for (const p of pesi) pesiDi[p.tipo_prodotto].push(p);

  // le marche che contano
  const tutte = await paginaTutto((da, a) => supabase
    .from('prodotti').select('marca, barcode')
    .eq('paese', 'italy').in('categoria_riconosciuta', CATEGORIE)
    .not('marca', 'is', null)
    .order('barcode')
    .range(da, a));
  const conteggio = {};
  for (const r of tutte) conteggio[r.marca] = (conteggio[r.marca] || 0) + 1;
  const marcheVere = new Set(Object.keys(conteggio).filter(m => conteggio[m] >= 5));

  // i prodotti da arricchire
  const daFare = await paginaTutto((da, a) => supabase
    .from('prodotti')
    .select('barcode, nome, marca, categoria_riconosciuta')
    .eq('paese', 'italy')
    .in('categoria_riconosciuta', CATEGORIE)
    .is('voto_ambientale', null)
    .order('barcode')
    .range(da, a));

  const lista = daFare.filter(p => marcheVere.has(p.marca)).slice(0, 15);
  console.log(`Da arricchire: ${lista.length}\n`);

  let ok = 0, vuoti = 0, errori = 0;
  const t0 = Date.now();

  for (let i = 0; i < lista.length; i++) {
    const p = lista[i];
    const r = await scheda(p.barcode);

    if (r.errore) { errori++; await attesa(PAUSA * 2); continue; }
    if (r.vuoto)  { vuoti++;  await attesa(PAUSA); continue; }

    const off = r.prodotto;
    const categoria = categoriaDa(off) || p.categoria_riconosciuta;
    const base = baseDi[categoria];
    if (!base) { vuoti++; await attesa(PAUSA); continue; }

    const codici = modificatoriDa(
      { ...off, tipo_prodotto: base.tipo_prodotto, paese_utente: 'it' }, categoria);
    const mod = modificatori.filter(m =>
      codici.includes(m.codice) && (!m.categorie || m.categorie.includes(categoria)));

    const voto = calcolaVoto({ base, pesi: pesiDi[base.tipo_prodotto], modificatori: mod });

    if (voto.punteggio === 50) { vuoti++; await attesa(PAUSA); continue; }

    const lettera =
      voto.punteggio >= 75 ? 'A' : voto.punteggio >= 62 ? 'B' :
      voto.punteggio >= 52 ? 'C' : voto.punteggio >= 40 ? 'D' :
      voto.punteggio >= 25 ? 'E' : 'F';

    await supabase.from('prodotti').update({
      punteggio_ambientale: voto.punteggio,
      voto_ambientale: lettera,
      certificazioni: off.labels_tags || [],
      nova_group: off.nova_group ? Number(off.nova_group) : null,
      additivi_n: off.additives_n != null ? Number(off.additives_n) : null,
      voto_json: { ...voto, nome: off.product_name, marca: off.brands, barcode: p.barcode },
      fonte: 'openfoodfacts-api',
      aggiornato_il: new Date().toISOString(),
    }).eq('barcode', p.barcode);

    ok++;

    if (i % 25 === 0) {
      const min = ((Date.now() - t0) / 60000).toFixed(0);
      const restano = (((lista.length - i) * PAUSA) / 60000).toFixed(0);
      process.stdout.write(
        `\r  ${i}/${lista.length} | voti nuovi ${ok} | vuoti ${vuoti} | errori ${errori} | ${min} min, ~${restano} rimasti   `);
    }
    await attesa(PAUSA);
  }

  console.log(`\n\nFatto. Voti nuovi: ${ok} | senza dati: ${vuoti} | errori: ${errori}`);
})();