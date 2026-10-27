// Verifica permanente: la matrice dieta/allergie da sola non ha un
// energy_target e quindi non esercita la scala delle porzioni. Questi 12
// profili sintetici hanno invece kcal/proteine esplicite. Catalogo reale,
// nessun utente reale e nessun piano scritto: salva:false,dettagli:true.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const { generaESalva, caricaPiatti, caricaVincoli, limitiDi } = require('../genera');
const reale = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const ID = '00000000-0000-4000-8000-000000000001';
const SEME = 2026;
const DIETE = ['onnivoro', 'pescetariano', 'vegetariano', 'vegano'];
const OBIETTIVI = [[1600, 75], [2400, 95], [3200, 110]];

function query(data) {
  const risultato = { data, error: null };
  const q = { select: () => q, eq: () => q, order: () => q, limit: () => q,
    maybeSingle: () => Promise.resolve(risultato),
    then: (resolve, reject) => Promise.resolve(risultato).then(resolve, reject),
  };
  return q;
}
function clientePer(dieta, kcal, proteine) {
  const dati = {
    users: { diet: dieta, cook_days: [1, 2, 3, 4, 5, 6, 7], lunch_away: false,
      pasti_casa: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(g => [g, { pranzo: true, cena: true }])),
      evening_minutes: 35, household_size: 1, paesi: ['italia'] },
    energy_targets: { id: 'target-sintetico', kcal, protein_g_min: proteine },
    user_cuisine_preferences: [], user_constraints: [], meal_outcomes: [], plans: null,
  };
  const CATALOGO = new Set(['dishes', 'dish_ingredients', 'foods', 'categorie_alimenti', 'tag_nutrizionali', 'alias_categoria']);
  return { from(tabella) {
    if (Object.hasOwn(dati, tabella)) return query(dati[tabella]);
    assert.ok(CATALOGO.has(tabella), 'Accesso inatteso alla tabella ' + tabella);
    return reale.from(tabella);
  } };
}

(async () => {
  const catalogo = await caricaPiatti(reale, ['mediterranea'], 6);
  const piattoDi = new Map(catalogo.map(p => [p.id, p]));
  let passati = 0;
  const errori = [];
  for (const dieta of DIETE) for (const [kcal, proteine] of OBIETTIVI) {
    const etichetta = `${dieta} ${kcal} kcal`;
    try {
      const c = clientePer(dieta, kcal, proteine);
      const piano = await generaESalva(c, ID, SEME, { salva: false, dettagli: true });
      assert.ok(!piano.errore, piano.errore + ': ' + piano.vincolo_bloccante);
      assert.equal(piano.plan_id, null);
      assert.ok(piano.righe?.length, 'Nessuna porzione ispezionabile');
      const vincoli = await caricaVincoli(c, ID, dieta);
      const giorni = new Map();
      for (const r of piano.righe) {
        const p = piattoDi.get(r.dish_id);
        assert.ok(p, 'Piatto fuori catalogo: ' + r.dish_id);
        assert.ok(vincoli.ammesso(p), 'Dieta violata: ' + p.name);
        const massimo = limitiDi({ slot: r.slot, piatto: p }, kcal)[1] * p.grams;
        assert.ok(r.portion_g <= Math.round(massimo), `Porzione fuori limite: ${p.name}, ${r.portion_g}g > ${Math.round(massimo)}g`);
        assert.ok(r.portion_g > 0 && Number.isFinite(r.kcal) && Number.isFinite(r.protein_g), 'Porzione non valida');
        const limite = r.meal === 'colazione' ? 15 : r.meal === 'spuntino' ? 10 : r.day_of_week <= 5 ? 35 : 75;
        const tempo = p.prep_min || (r.meal === 'colazione' ? 10 : r.meal === 'spuntino' ? 5 : r.slot === 'contorno' ? 20 : 30);
        assert.ok(tempo <= limite, `Tempo superato: ${p.name}, ${tempo} > ${limite} min`);
        const g = giorni.get(r.day_of_week) || { kcal: 0, righe: 0, proteine: 0 };
        g.kcal += r.kcal; g.proteine += r.protein_g; g.righe++;
        giorni.set(r.day_of_week, g);
      }
      assert.equal(giorni.size, 7);
      assert.equal(piano.riepilogo_ingredienti?.length,7,'Riepilogo ingredienti mancante');
      for(const g of piano.riepilogo_ingredienti){
        assert.ok(g.completo && g.nutrienti_completi,'Dati ingredienti incompleti');
        const righe=piano.righe.filter(r=>r.day_of_week===g.giorno);
        const grammi=righe.reduce((s,r)=>s+r.portion_g,0);
        assert.ok(Math.abs(g.ingredienti.reduce((s,i)=>s+i.grammi,0)-grammi)<=g.ingredienti.length*.051,'Pesi ingredienti non coerenti con le porzioni');
        const kcalEff=righe.reduce((s,r)=>s+piattoDi.get(r.dish_id).kcal*r.portion_g/piattoDi.get(r.dish_id).grams,0);
        const grassiEff=righe.reduce((s,r)=>s+piattoDi.get(r.dish_id).fat*r.portion_g/piattoDi.get(r.dish_id).grams,0);
        assert.ok(Math.abs(g.grassi.grammi-grassiEff)<.051,'Grassi discordanti');
        assert.ok(Math.abs(g.grassi.percento_energia-grassiEff*9/kcalEff*100)<.051,'Percentuale grassi discordante');
      }
      for (const [giorno, g] of giorni) {
        // Ogni riga puo' arrotondare di 0,5 kcal / 0,05g di proteina.
        assert.ok(Math.abs(g.kcal - kcal) <= kcal * 0.10 + g.righe * 0.5, `Giorno ${giorno}: ${g.kcal} kcal fuori target`);
        if (g.proteine + g.righe * 0.05 < proteine * 0.9) {
          assert.ok(piano.concessioni.some(x => x.giorno === giorno && x.vincolo === 'proteine_minime'),
            `Giorno ${giorno}: deficit proteico non dichiarato`);
        }
        const concessione = piano.concessioni.find(x => x.giorno === giorno && x.vincolo === 'proteine_minime');
        if (concessione) {
          assert.ok(Math.abs(g.proteine - Number(concessione.dopo)) <= g.righe * 0.05 + 0.051,
            `Giorno ${giorno}: deficit riferito alle porzioni precedenti al bilanciamento`);
          assert.ok(g.proteine - g.righe * 0.05 < proteine * 0.9,
            `Giorno ${giorno}: deficit gia risolto ma ancora dichiarato`);
        }
      }
      passati++;
      console.log(`OK  ${etichetta}, gradino ${piano.gradino}`);
    } catch (e) { errori.push(etichetta + ': ' + e.message); }
  }
  console.log(`\nProfili nutrizionali: ${passati}/${DIETE.length * OBIETTIVI.length}, seme ${SEME}.`);
  for (const e of errori) console.error('FALLITO: ' + e);
  if (errori.length) process.exitCode = 1;
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
