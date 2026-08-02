require('dotenv').config();

function leggi(nome) {
  const k = process.env[nome];
  if (!k) return `${nome}: assente`;
  const parti = k.split('.');
  if (parti.length !== 3) return `${nome}: NON e un JWT valido (${parti.length} parti invece di 3) - probabilmente spezzato su piu righe`;
  try {
    const p = JSON.parse(Buffer.from(parti[1], 'base64').toString());
    return `${nome}: role=${p.role}  progetto=${p.ref}`;
  } catch (e) {
    return `${nome}: illeggibile - ${e.message}`;
  }
}

console.log(leggi('SUPABASE_KEY'));
console.log(leggi('SUPABASE_SERVICE_KEY'));
console.log('URL progetto:', process.env.SUPABASE_URL);
console.log('Esiste .env.local?', require('fs').existsSync('.env.local') ? 'SI (attenzione: ha la precedenza)' : 'no');