require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY);

const PLAN_IDS = [
  '5c868899-3900-447d-ac31-43c86fa5db0a', '20aac0de-e17b-4e7d-885c-be6b4a7de370',
  '121baf35-0bf3-4674-859b-5fd1ecde14e4', '3becb201-fc7d-486d-a3e0-003fa978953f',
  '1becad39-7e27-45d8-81b3-c36994f7e78d', '48c1a132-91da-48f7-b7c2-b21f12f40224',
  '5940f012-e4aa-44ea-afbc-48c7b560d013', '2d13d68e-7b84-4050-849e-be83d834793e',
  '96ca11a4-6888-439c-9a90-5448e25d1e30', '45fdbc78-430c-4a36-8636-193680c7cb17',
  '95e85be0-c4eb-42cb-b513-2499feb0d399', 'd14f7b8d-4a20-47cd-a6fe-577bc736509c',
  '26fac12e-b344-4c9c-b189-245f7d78bfde', 'a219c5bc-a636-4508-b69f-f6804d4fa4a9',
  '62c5b26d-4344-46dc-90f4-eac04d705c57', 'b741614c-352e-4f27-a9b2-1ec81e77e838',
  '6731f875-19ea-4795-ab31-7da8900f9eb7',
];

const GENERICI = ['mediterraneo_generico', 'asia_generico', 'latino_generico', 'centro_nord_generico'];

(async () => {
  const { data: righe } = await supabase
    .from('plan_items')
    .select('plan_id, day_of_week, meal, slot, avanzi, stato, dish_id, dishes(name, name_en, famiglia, profilo, paese, cucina, prep_min, ha_amido, ha_proteina, base_amidacea)')
    .in('plan_id', PLAN_IDS);

  const dishIds = [...new Set(righe.map(r => r.dish_id))];
  let ing = [];
  for (let i = 0; i < dishIds.length; i += 100) {
    const blocco = dishIds.slice(i, i + 100);
    const { data, error } = await supabase
      .from('dish_ingredients')
      .select('dish_id, grams, foods(name_it, name)')
      .in('dish_id', blocco);
    if (error) { console.error('errore ingredienti:', error.message); continue; }
    ing = ing.concat(data || []);
  }
  // Condimenti/basi di cottura: pesano poco ma finiscono comunque in cima a
  // una ricetta con pochi ingredienti. Non sono "l'identita'" del piatto -
  // escluderli e' l'unico modo per trovare una ripetizione vera (due piatti
  // "a base di patate"), non un olio d'oliva che compare ovunque.
  const BASE = /^(olio|olio di oliva|olio extravergine|burro|sale|pepe|zucchero|aceto|aceto di mele|aceto balsamico|acqua|brodo vegetale|brodo di pollo|farina|lievito|vino bianco|vino rosso|succo di limone)$/;

  const ingredientiPer = {};
  for (const i of ing) {
    if (!ingredientiPer[i.dish_id]) ingredientiPer[i.dish_id] = [];
    ingredientiPer[i.dish_id].push({ nome: (i.foods?.name_it || i.foods?.name || '').toLowerCase(), grammi: Number(i.grams) || 0 });
  }
  // Il singolo ingrediente "stella" per piatto: il piu' pesante tra quelli
  // che non sono un condimento di base.
  const principali = {};
  for (const [id, lista] of Object.entries(ingredientiPer)) {
    const stella = lista.filter(x => x.nome && !BASE.test(x.nome)).sort((a, b) => b.grammi - a.grammi)[0];
    principali[id] = stella ? [stella.nome] : [];
  }

  const perMeal = {};
  for (const r of righe) {
    if (r.stato === 'saltato' || r.avanzi) continue;
    const key = `${r.plan_id}|${r.day_of_week}|${r.meal}`;
    if (!perMeal[key]) perMeal[key] = [];
    perMeal[key].push(r);
  }

  const casi = [];
  for (const [key, piatti] of Object.entries(perMeal)) {
    if (piatti.length < 2) continue;
    for (let a = 0; a < piatti.length; a++) {
      for (let b = a + 1; b < piatti.length; b++) {
        const p1 = piatti[a], p2 = piatti[b];
        const d1 = p1.dishes, d2 = p2.dishes;
        if (!d1 || !d2) continue;

        const problemi = [];

        // cucine diverse nello stesso pasto: solo se ENTRAMBI i paesi sono
        // specifici (non generici) e genuinamente diversi - un generico
        // accanto al suo paese e' esattamente come il generatore li pesa.
        const paese1Specifico = d1.paese && !GENERICI.includes(d1.paese);
        const paese2Specifico = d2.paese && !GENERICI.includes(d2.paese);
        if (paese1Specifico && paese2Specifico && d1.paese !== d2.paese) {
          problemi.push(`paesi diversi: ${d1.paese} vs ${d2.paese}`);
        }
        // stesso controllo sulla famiglia, ignorando "neutra" (i contorni
        // neutri stanno bene con qualunque famiglia, e' il loro scopo)
        if (d1.famiglia !== 'neutra' && d2.famiglia !== 'neutra' && d1.famiglia !== d2.famiglia) {
          problemi.push(`famiglie diverse: ${d1.famiglia} vs ${d2.famiglia}`);
        }

        // due basi amidacee nello stesso pasto (es. primo di pasta + contorno di patate)
        if (d1.base_amidacea && d2.base_amidacea) {
          problemi.push('due basi amidacee nello stesso pasto');
        }
        // due fonti di proteina "vere" nello stesso pasto (non un secondo +
        // un contorno di verdura, ma due piatti entrambi proteici)
        if (d1.ha_proteina && d2.ha_proteina && p1.slot !== 'colazione' && p2.slot !== 'colazione') {
          problemi.push('due fonti proteiche nello stesso pasto');
        }

        // ingrediente principale ripetuto (tra i 3 piu' pesanti di ciascun piatto)
        const pr1 = principali[p1.dish_id] || [], pr2 = principali[p2.dish_id] || [];
        const comuni = pr1.filter(x => pr2.includes(x));
        if (comuni.length) problemi.push(`ingrediente principale ripetuto: ${comuni.join(', ')}`);

        if (problemi.length) {
          casi.push({
            key, slot1: p1.slot, dish1: d1.name_en || d1.name, slot2: p2.slot, dish2: d2.name_en || d2.name,
            paese1: d1.paese, paese2: d2.paese, famiglia1: d1.famiglia, famiglia2: d2.famiglia,
            problemi,
          });
        }
      }
    }
  }

  console.log('Pasti con 2+ piatti analizzati:', Object.values(perMeal).filter(p => p.length >= 2).length);
  console.log('Casi con almeno un problema:', casi.length);

  const perTipo = {};
  for (const c of casi) for (const p of c.problemi) {
    const tipo = p.split(':')[0];
    perTipo[tipo] = (perTipo[tipo] || 0) + 1;
  }
  console.log('Per tipo:', perTipo);

  require('fs').writeFileSync('/tmp/casi-pasto.json', JSON.stringify(casi, null, 2));
  console.log('Salvato /tmp/casi-pasto.json,', casi.length, 'casi');
})();
