// Utenti di test dedicati, fissi, mai cancellati. Creati da crea-utenti-test.js
// (eseguito una sola volta). Ogni script di generazione di prova deve
// richiedere assertUtenteDiTest(userId) prima di chiamare generaESalva:
// oggi niente impediva a uno script di riempire un utente vero, non deve
// succedere di nuovo.
const TEST_USERS = {
  basso: { id: 'c29890d4-a37f-4995-a00d-543d07263c32', email: 'test-basso@nutriai-test.invalid', nota: 'fabbisogno basso, ~1800 kcal, onnivoro, italia' },
  alto: { id: '0fb76f4f-f237-44dc-9ffe-98bebde312ab', email: 'test-alto@nutriai-test.invalid', nota: 'fabbisogno alto, ~2900 kcal, onnivoro, italia (184cm/2007/mantenimento)' },
  vegano: { id: 'ee544d17-2a31-4b9a-a7db-ea8a3d3953f2', email: 'test-vegano@nutriai-test.invalid', nota: 'dieta vegana, italia' },
  pescetarianoGlutine: { id: '2a332989-514e-44f1-8b5c-0eb297c8b269', email: 'test-pescetariano-glutine@nutriai-test.invalid', nota: 'pescetariano + vincolo glutine, italia' },
};

const ID_VALIDI = new Set(Object.values(TEST_USERS).map(u => u.id).filter(Boolean));

function assertUtenteDiTest(userId) {
  if (!ID_VALIDI.size) {
    throw new Error('test-users.js: nessun id popolato - esegui crea-utenti-test.js prima di generare piani di prova');
  }
  if (!ID_VALIDI.has(userId)) {
    throw new Error(`GUARDRAIL: userId ${userId} non e' uno dei 4 utenti di test dedicati. Uno script di generazione di prova non deve mai scrivere su un utente vero.`);
  }
}

module.exports = { TEST_USERS, assertUtenteDiTest };
