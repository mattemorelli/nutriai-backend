const { categoriaDa } = require('./voto');

const BARCODE = [
  '3046920022651',  // Lindt Excellence 70%
  '7622300336738',  // Milka
  '4000417025005',  // Ritter Sport
  '8000500310427',  // Nutella biscuits
  '7622210449283',  // Oreo
  '8000500037560',  // Kinder Bueno
  '80177173',       // ?
];

(async () => {
  for (const b of BARCODE) {
    const r = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${b}?fields=code,product_name,brands,categories_tags`,
      { headers: { 'User-Agent': 'Sorrel/0.1' } }
    );
    const d = await r.json();
    if (d.status !== 1) { console.log(`${b}  non trovato`); continue; }
    const p = d.product;
    console.log(
      (p.brands || '?').slice(0, 16).padEnd(18),
      (p.product_name || '?').slice(0, 26).padEnd(28),
      '->', categoriaDa(p) || 'NESSUNA'
    );
    await new Promise(s => setTimeout(s, 400));
  }
})();