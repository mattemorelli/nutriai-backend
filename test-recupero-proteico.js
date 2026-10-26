const assert = require('node:assert/strict');
const { test } = require('node:test');
const { creaRecuperoProteico } = require('./recupero-proteico');

const piatto = (id, extra = {}) => ({ id, kcal: 200, protein: 20, gruppo: 'pesce', ...extra });
function contesto(extra = {}) {
  const vecchio = piatto('vecchio', { salsa_industriale: true });
  const st = { secondo: vecchio, secondoEAvanzo: false, secondoERipetizione: false,
    profiloGiorno: 'mediterraneo', paeseGiorno: 'italia', genericoOggi: 'mediterraneo_generico', limiteBase: 15,
    spuntino: piatto('mela'), spuntino2: piatto('yogurt'), ...extra };
  const statoGiorni = [st], usati = new Set([vecchio.id]), usoGruppi = { pesce: 1 }, usoSalse = { valore: 1 };
  const usoSpuntini = new Map([['mela', 2], ['yogurt', 1], ['nuovo-spuntino', 2]]);
  const normale = { secondo: [], spuntino: [], terzo: [], chiamate: [] };
  const deps = { statoGiorni, usati, usoGruppi, usoSalse, usoSpuntini,
    contestoGiorno: () => ({ g: 1, profiloGiorno: st.profiloGiorno, paeseOk: 'filtro-paese', paeseOkLeggero: 'filtro-paese-spuntino', cappaSpuntino: 10 }),
    candidatiSecondo(...args) { normale.chiamate.push(['secondo', ...args]); assert.equal(st.secondo, undefined); assert.equal(usoSalse.valore, 0); return normale.secondo; },
    candidatiSpuntino(...args) { normale.chiamate.push(['spuntino', ...args]); return normale.spuntino; },
    candidatiSpuntino3(...args) { normale.chiamate.push(['terzo', ...args]); return normale.terzo; },
    assegnaSecondoScelto(gi, p) {
      st.secondo = p; st.secondoEAvanzo = false; st.secondoERipetizione = false;
      usati.add(p.id); usoGruppi[p.gruppo] = (usoGruppi[p.gruppo] || 0) + 1;
      if (p.salsa_industriale) usoSalse.valore++;
      return () => { delete st.secondo; usati.delete(p.id); usoGruppi[p.gruppo]--; if (p.salsa_industriale) usoSalse.valore--; };
    },
    assegnaSpuntinoScelto(gi, slot, p) {
      st[slot] = p; usoSpuntini.set(p.id, (usoSpuntini.get(p.id) || 0) + 1);
      return () => { delete st[slot]; const n = usoSpuntini.get(p.id) - 1; if (n) usoSpuntini.set(p.id, n); else usoSpuntini.delete(p.id); };
    },
    accompagnaBene: (p, altro) => !p.incompatibile && p.id !== altro.id,
    tipiAccompagnamentoDaSecondo: p => p.accompagnamenti || ['pane', 'patate'],
    tipoAmidoDiAccompagnamento: p => p.tipoAmido,
    copreRuolo: (p, ruolo) => p.ruoli_coperti?.includes(ruolo),
  };
  return { st, vecchio, deps, normale, api: creaRecuperoProteico(deps) };
}

test('un secondo bloccato non ha candidati di recupero e non viene sostituito', () => {
  const c = contesto(); c.st.bloccatiOggi = [{ piatto: c.vecchio }];
  assert.deepEqual(c.api.candidatiSecondoProteico(0), []);
  assert.equal(c.normale.chiamate.length, 0);
  assert.throws(() => c.api.assegnaSecondoProteico(0, piatto('nuovo')), /protetto/);
  assert.equal(c.st.secondo, c.vecchio);
});

test('avanzi e ripetizioni mantengono piatto e budget', () => {
  for (const flag of ['secondoEAvanzo', 'secondoERipetizione']) {
    const c = contesto({ [flag]: true });
    assert.deepEqual(c.api.candidatiSecondoProteico(0), []);
    assert.throws(() => c.api.assegnaSecondoProteico(0, piatto('nuovo')), /protetto/);
    assert.equal(c.deps.usoGruppi.pesce, 1);
  }
});

test('il secondo riusa il selettore normale con tempo, paese e profilo del giorno', () => {
  const c = contesto(); c.normale.secondo = [piatto('ammesso', { protein: 35 })];
  assert.equal(c.api.candidatiSecondoProteico(0)[0].id, 'ammesso');
  assert.deepEqual(c.normale.chiamate[0], ['secondo', 0, 'mediterraneo', 'italia', 'mediterraneo_generico', 'filtro-paese', 15]);
  assert.equal(c.st.secondo, c.vecchio);
  assert.equal(c.deps.usoSalse.valore, 1);
});

test('nessuna alternativa scartata dal selettore ordinario viene reintrodotta', () => {
  const c = contesto();
  assert.deepEqual(c.api.candidatiSecondoProteico(0), []);
  assert.deepEqual(c.api.candidatiSpuntinoProteico(0, 'spuntino'), []);
});

test('anche un errore del selettore ripristina portata e contatori', () => {
  const c = contesto();
  c.deps.candidatiSecondo = () => { throw new Error('prova'); };
  const api = creaRecuperoProteico(c.deps);
  assert.throws(() => api.candidatiSecondoProteico(0), /prova/);
  assert.equal(c.st.secondo, c.vecchio);
  assert.equal(c.deps.usoSalse.valore, 1);
});

test('gli abbinamenti gia scelti restano validi, incluso pane o patate', () => {
  const c = contesto({ base: piatto('pane', { tipoAmido: 'pane' }) });
  c.normale.secondo = [piatto('arrosto', { accompagnamenti: ['patate'] }), piatto('compatibile'), piatto('doppio', { incompatibile: true })];
  assert.deepEqual(c.api.candidatiSecondoProteico(0).map(p => p.id), ['compatibile']);
});

test('i secondi freschi vengono ordinati per proteine per caloria', () => {
  const c = contesto();
  c.normale.secondo = [c.vecchio, piatto('a'), piatto('b', { protein: 40 }), piatto('gia-usato')];
  c.deps.usati.add('gia-usato');
  assert.deepEqual(c.api.candidatiSecondoProteico(0).map(p => p.id), ['b', 'a']);
});

test('cambio e annullamento del secondo ripristinano gruppi, salse e usati', () => {
  const c = contesto(), nuovo = piatto('nuovo', { gruppo: 'legumi', salsa_industriale: true });
  const annulla = c.api.assegnaSecondoProteico(0, nuovo);
  assert.equal(c.st.secondo, nuovo); assert.equal(c.deps.usoGruppi.pesce, 0); assert.equal(c.deps.usoGruppi.legumi, 1);
  assert.equal(c.deps.usoSalse.valore, 1); assert.equal(c.deps.usati.has(c.vecchio.id), false);
  annulla();
  assert.equal(c.st.secondo, c.vecchio); assert.equal(c.deps.usoGruppi.pesce, 1); assert.equal(c.deps.usoGruppi.legumi, 0);
  assert.equal(c.deps.usoSalse.valore, 1); assert.deepEqual([...c.deps.usati], ['vecchio']);
  assert.equal(c.st.secondoEAvanzo, false); assert.equal(c.st.secondoERipetizione, false);
});

test('spuntino bloccato e colazione bloccata sono protetti', () => {
  const c = contesto(); c.st.colazione = piatto('colazione');
  c.st.bloccatiOggi = [{ piatto: c.st.spuntino }, { piatto: c.st.colazione }];
  assert.deepEqual(c.api.candidatiSpuntinoProteico(0, 'spuntino'), []);
  assert.throws(() => c.api.assegnaSpuntinoProteico(0, 'spuntino', piatto('altro')), /bloccato/);
  assert.equal(c.api.slotBloccato(0, 'colazione'), true);
});

test('il recupero spuntino passa al selettore normale il limite di 10 minuti', () => {
  const c = contesto(); c.normale.spuntino = [piatto('nuovo-spuntino')];
  assert.equal(c.api.candidatiSpuntinoProteico(0, 'spuntino')[0].id, 'nuovo-spuntino');
  assert.deepEqual(c.normale.chiamate[0], ['spuntino', 0, 'mediterraneo', 'filtro-paese-spuntino', c.st.spuntino2, 10]);
});

test('nessun duplicato o secondo spuntino amidaceo anche se esiste il terzo', () => {
  const c = contesto({ spuntino3: piatto('cracker', { ruoli_coperti: ['base_amidacea'] }) });
  c.normale.spuntino = [piatto('cracker'), piatto('pane', { ruoli_coperti: ['base_amidacea'] }), piatto('frutta')];
  assert.deepEqual(c.api.candidatiSpuntinoProteico(0, 'spuntino').map(p => p.id), ['frutta']);
});

test('anche il terzo spuntino usa il proprio selettore ordinario', () => {
  const c = contesto({ spuntino3: piatto('terzo') }); c.normale.terzo = [piatto('nuovo-terzo')];
  assert.equal(c.api.candidatiSpuntinoProteico(0, 'spuntino3')[0].id, 'nuovo-terzo');
  assert.deepEqual(c.normale.chiamate[0], ['terzo', 0, 'mediterraneo', 'filtro-paese-spuntino', 10]);
});

test('gli spuntini aggiornano il contatore di tre usi, senza sporcare usati', () => {
  const c = contesto(), prima = [...c.deps.usoSpuntini];
  const precedente = c.st.spuntino, nuovo = piatto('nuovo-spuntino');
  const annulla = c.api.assegnaSpuntinoProteico(0, 'spuntino', nuovo);
  assert.equal(c.deps.usoSpuntini.get(precedente.id), 1);
  assert.equal(c.deps.usoSpuntini.get(nuovo.id), 3);
  assert.deepEqual([...c.deps.usati], ['vecchio']);
  annulla();
  assert.equal(c.st.spuntino, precedente);
  assert.deepEqual([...c.deps.usoSpuntini], prima);
  assert.deepEqual([...c.deps.usati], ['vecchio']);
});
