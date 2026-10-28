// Piani sintetici con recupero difficile, cene rapide e piatti bloccati.
// Sola lettura del catalogo reale; nessun piano o utente scritto.
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const { createClient } = require('@supabase/supabase-js');
const { generaESalva, caricaPiatti } = require(process.argv[2] || path.join(__dirname, '../genera.js'));
const reale = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const ID = '00000000-0000-4000-8000-000000000001';
const DIETE = ['onnivoro', 'pescetariano', 'vegetariano', 'vegano'];

function query(data) {
  const risultato = { data, error: null };
  const q = { select: () => q, eq: () => q, order: () => q, limit: () => q, range: () => q,
    maybeSingle: () => Promise.resolve(risultato),
    then: (resolve, reject) => Promise.resolve(risultato).then(resolve, reject),
  };
  return q;
}
function cliente(dieta, minuti, kcal, proteine, bloccati = []) {
  const dati = {
    users: { diet: dieta, cook_days: [1, 2, 3, 4, 5, 6, 7], lunch_away: false,
      pasti_casa: Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(g => [g, { pranzo: true, cena: true }])),
      evening_minutes: minuti, household_size: 1, paesi: ['italia'] },
    energy_targets: { id: 'target-sintetico', kcal, protein_g_min: proteine },
    user_cuisine_preferences: [], user_constraints: [], meal_outcomes: [],
    plans: bloccati.length ? { id: 'precedente-sintetico' } : null,
    plan_items: bloccati,
  };
  const CATALOGO = new Set(['dishes', 'dish_ingredients', 'foods', 'categorie_alimenti', 'tag_nutrizionali', 'alias_categoria']);
  return { from(tabella) {
    if (Object.hasOwn(dati, tabella)) return query(dati[tabella]);
    assert.ok(CATALOGO.has(tabella), 'Accesso inatteso: ' + tabella);
    return reale.from(tabella);
  } };
}

(async () => {
  const catalogo = await caricaPiatti(reale, ['mediterranea'], 6);
  const piattoDi = new Map(catalogo.map(p => [p.id, p]));
  const risultati = [];
  for (const dieta of DIETE) {
    const base = await generaESalva(cliente(dieta, 35, 2000, 70), ID, 2026, { salva: false, dettagli: true });
    assert.ok(!base.errore && base.righe?.length, 'Piano base non generato: ' + dieta);
    const scelti = base.righe.filter(r => r.day_of_week === 1 && ['colazione', 'secondo', 'spuntino'].includes(r.slot));
    const bloccati = scelti.map(r => ({ day_of_week: r.day_of_week, meal: r.meal, slot: r.slot, dish_id: r.dish_id, bloccato: true }));
    // Riproduce anche una settimana precedente con tre spuntini bloccati
    // nello stesso giorno: il terzo deve restare, non sovrascrivere il secondo.
    if (bloccati.filter(r => r.meal === 'spuntino').length < 3) {
      const extra = base.righe.find(r => r.meal === 'spuntino' && !bloccati.some(b => b.dish_id === r.dish_id));
      assert.ok(extra, 'Terzo spuntino distinto non trovato per ' + dieta);
      bloccati.push({ day_of_week: 1, meal: 'spuntino', slot: 'spuntino', dish_id: extra.dish_id, bloccato: true });
    }
    const casi = [
      { nome: 'cena 15 min', minuti: 15, kcal: 2000, proteine: 130, bloccati: [] },
      { nome: 'cena 20 min', minuti: 20, kcal: 1600, proteine: 100, bloccati: [] },
      { nome: 'piatti bloccati e proteine alte', minuti: 35, kcal: 2400, proteine: 150, bloccati },
    ];
    for (const caso of casi) {
      const nome = dieta + ' / ' + caso.nome;
      try {
        const p = await generaESalva(cliente(dieta, caso.minuti, caso.kcal, caso.proteine, caso.bloccati), ID, 2026, { salva: false, dettagli: true });
        assert.ok(!p.errore && p.righe?.length, p.errore + ': ' + p.vincolo_bloccante);
        for (const b of caso.bloccati) {
          assert.ok(p.righe.some(r => r.day_of_week === b.day_of_week && r.meal === b.meal && r.slot === b.slot && r.dish_id === b.dish_id && r.bloccato),
            'Piatto bloccato sostituito: ' + piattoDi.get(b.dish_id)?.name);
        }
        const usiSpuntini = new Map();
        for (const r of p.righe) {
          const d = piattoDi.get(r.dish_id); assert.ok(d);
          const max = r.meal === 'colazione' ? 15 : r.meal === 'spuntino' ? 10
            : r.day_of_week <= 5 ? r.meal === 'pranzo' ? Math.max(25, caso.minuti) : caso.minuti : 75;
          const minuti = d.prep_min || (r.meal === 'colazione' ? 10 : r.meal === 'spuntino' ? 5 : r.slot === 'contorno' ? 20 : 30);
          assert.ok(minuti <= max, `${d.name}: ${minuti} min > ${max}`);
          if (r.meal === 'spuntino') usiSpuntini.set(r.dish_id, (usiSpuntini.get(r.dish_id) || 0) + 1);
        }
        for (const [id, n] of usiSpuntini) {
          const imposti = caso.bloccati.filter(b => b.meal === 'spuntino' && b.dish_id === id).length;
          assert.ok(n <= Math.max(3, imposti), `${piattoDi.get(id)?.name}: ${n} spuntini, oltre il tetto settimanale`);
        }
        risultati.push({ nome, ok: true, gradino: p.gradino });
      } catch (e) { risultati.push({ nome, ok: false, errore: e.message }); }
    }
  }
  for (const r of risultati) console.log((r.ok ? 'OK ' : 'XX ') + r.nome + ': ' + (r.ok ? 'gradino ' + r.gradino : r.errore));
  const ok = risultati.filter(r => r.ok).length;
  console.log(`\nRecupero proteico: ${ok}/${risultati.length} casi.`);
  if (ok !== risultati.length) process.exitCode = 1;

  // Orologio controllato: una prova salta subito al tentativo finale,
  // l'altra interrompe una ricerca gia' iniziata. Il tempo virtuale rende
  // riproducibile il difetto senza dipendere dalla velocita' del computer.
  const file = process.argv[2] || path.join(__dirname, '../genera.js');
  const generaConTempo = async tempoMassimoMs => {
    let tick = 0;
    class Orologio extends Date { static now() { return tick++; } }
    const m = { exports: {} };
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), {
      module: m, require: createRequire(file), console, Date: Orologio,
    }, { filename: file });
    return m.exports.generaESalva(cliente('onnivoro', 15, 2000, 130), ID, 2026,
      { salva: false, dettagli: true, tempoMassimoMs });
  };
  const diretto = await generaConTempo(-1);
  const interrotto = await generaConTempo(12);
  assert.ok(!diretto.errore && !interrotto.errore, 'Tentativo finale non generato');
  assert.equal(diretto.gradino, '5');
  assert.equal(interrotto.gradino, '5');
  assert.equal(JSON.stringify(interrotto.righe), JSON.stringify(diretto.righe),
    'Il tempo del tentativo precedente cambia il piano finale');
  assert.equal(JSON.stringify(interrotto.concessioni), JSON.stringify(diretto.concessioni),
    'Il tempo del tentativo precedente cambia le concessioni');
  console.log('OK riproducibilita del tentativo finale con budget temporali diversi.');
})().catch(e => { console.error('ERRORE:', e.message); process.exitCode = 1; });
