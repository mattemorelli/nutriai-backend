// Una lettura fallita non autorizza a usare dieta onnivora o a scartare
// i piatti bloccati. Tutte le risposte sono simulate, nessuna rete.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { generaESalva } = require('./genera');

function clienteConErrore(tabellaErrore) {
  return { from(tabella) {
    const risultato = tabella === tabellaErrore
      ? { data: null, error: { message: 'rete interrotta' } }
      : { data: tabella === 'users' ? { diet: 'vegano' } : tabella === 'plans' ? { id: 'precedente' } : [], error: null };
    const q = { select: () => q, eq: () => q, contains: () => q, order: () => q, range: () => q, limit: () => q,
      maybeSingle: () => Promise.resolve(risultato),
      then: (resolve, reject) => Promise.resolve(risultato).then(resolve, reject),
      insert: () => { throw new Error('Scrittura inattesa'); },
    };
    return q;
  } };
}

test('errore sul profilo: interrompe prima del fallback alla dieta onnivora', async () => {
  await assert.rejects(generaESalva(clienteConErrore('users'), 'test', 2026, { salva: false }), /lettura users: rete interrotta/);
});

test('errore sui piatti bloccati: interrompe invece di ignorare la scelta', async () => {
  await assert.rejects(generaESalva(clienteConErrore('plan_items'), 'test', 2026, { salva: false }), /lettura plan_items bloccati: rete interrotta/);
});
