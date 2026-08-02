require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ============================================================
// LIMITI E REGOLE DEL CORPUS NORMATIVO
// ============================================================
const LIMITI = {
  satMaxGiorno: 29,
  saleMaxGiorno: 5,
  fibraMinGiorno: 25,
};

const FREQUENZE_MAX = {
  carne_rossa: 1,
  carne_bianca: 3,
  pesce: 3,
  formaggio: 3,
  legumi: 3,
  uova: 4,
};

const GRUPPO_PER_FOOD_ID = {
  '171796': 'carne_rossa', '171077': 'carne_bianca', '171093': 'carne_bianca',
  '171955': 'pesce', '173686': 'pesce', '171988': 'pesce', '175179': 'pesce',
  '175154': 'pesce', 'barramundi_it': 'pesce', 'tonno_fresco_it': 'pesce', 'baccala_it': 'pesce',
  '170845': 'formaggio', '170848': 'formaggio', '170851': 'formaggio',
  '173420': 'formaggio', 'american_cheese_us': 'formaggio', 'sharp_cheddar_us': 'formaggio',
  '174285': 'legumi', '175206': 'legumi', '172420': 'legumi', 'fagioli_neri_it': 'legumi',
  'lenticchie_rosse_it': 'legumi', 'tofu_it': 'legumi', 'tempeh_it': 'legumi',
  '171287': 'uova', 'uovo_grande_it': 'uova',
  'agnello_it': 'carne_rossa', 'agnello_australiano_it': 'carne_rossa',
  'manzo_magro_arg_it': 'carne_rossa', 'canguro_it': 'carne_rossa', 'petto_manzo_magro_it': 'carne_rossa',
  'coniglio_it': 'carne_bianca', 'tacchino_macinato_it': 'carne_bianca',
};

// ============================================================
// CONVERSIONE RANK (1-5) -> PESO DI PROBABILITA'
// Rank 1 = piu' preferita = peso 5. Rank 5 = meno preferita = peso 1.
// ============================================================
function rankInPeso(rank) {
  return 6 - rank; // rank 1 -> peso 5, rank 5 -> peso 1
}

function classificaPiatto(ingredienti) {
  for (const ing of ingredienti) {
    const gruppo = GRUPPO_PER_FOOD_ID[ing.food_id];
    if (gruppo) return gruppo;
  }
  return null;
}

async function calcolaPiatto(dishId) {
  const { data: ingredienti, error } = await supabase
    .from('dish_ingredients')
    .select('food_id, grams, foods (kcal_100g, sat_fat_100g, fibre_100g, salt_100g)')
    .eq('dish_id', dishId);
  if (error) throw error;

  const tot = { kcal: 0, satFat: 0, fibre: 0, salt: 0 };
  for (const riga of ingredienti) {
    const f = riga.foods;
    const fattore = riga.grams / 100;
    tot.kcal    += (f.kcal_100g    || 0) * fattore;
    tot.satFat  += (f.sat_fat_100g || 0) * fattore;
    tot.fibre   += (f.fibre_100g   || 0) * fattore;
    tot.salt    += (f.salt_100g    || 0) * fattore;
  }
  return { ...tot, gruppo: classificaPiatto(ingredienti) };
}

function sommaGiorno(pasti) {
  return pasti.reduce((acc, p) => ({
    kcal:   acc.kcal   + p.kcal,
    satFat: acc.satFat + p.satFat,
    fibre:  acc.fibre  + p.fibre,
    salt:   acc.salt   + p.salt,
  }), { kcal: 0, satFat: 0, fibre: 0, salt: 0 });
}

function verificaGiorno(tot) {
  return {
    saturi: tot.satFat <= LIMITI.satMaxGiorno ? 'OK' : 'SFORA',
    sale:   tot.salt   <= LIMITI.saleMaxGiorno ? 'OK' : 'SFORA',
    fibra:  tot.fibre  >= LIMITI.fibraMinGiorno ? 'OK' : 'BASSA',
  };
}

// Sceglie un piatto a caso rispettando i pesi delle cucine
function scegliPesato(piattiPerCucina, pesi) {
  const cucineDisponibili = Object.keys(piattiPerCucina).filter(c => piattiPerCucina[c].length > 0);
  if (!cucineDisponibili.length) return null;

  const pesoTotale = cucineDisponibili.reduce((s, c) => s + (pesi[c] || 1), 0);
  let r = Math.random() * pesoTotale;
  let cucinaScelta = cucineDisponibili[0];
  for (const c of cucineDisponibili) {
    r -= (pesi[c] || 1);
    if (r <= 0) { cucinaScelta = c; break; }
  }
  const lista = piattiPerCucina[cucinaScelta];
  return lista[Math.floor(Math.random() * lista.length)];
}

// ============================================================
// MOTORE DI GENERAZIONE — ora pesato per preferenza utente
// ============================================================
async function generaSettimana(userId) {
  // 1. Carica le preferenze di cucina dell'utente
  const { data: preferenze, error: errPref } = await supabase
    .from('user_cuisine_preferences')
    .select('cucina, rank')
    .eq('user_id', userId);
  if (errPref) throw errPref;

  if (!preferenze || !preferenze.length) {
    console.log('Nessuna preferenza di cucina impostata per questo utente. Uso solo "europea" come default.');
    preferenze.push({ cucina: 'europea', rank: 1 });
  }

  const pesi = {};
  preferenze.forEach(p => { pesi[p.cucina] = rankInPeso(p.rank); });

  console.log('Preferenze cucina (rank -> peso):');
  preferenze.forEach(p => console.log(`  ${p.cucina}: rank ${p.rank} -> peso ${rankInPeso(p.rank)}`));
  console.log('');

  // 2. Carica tutti i piatti delle cucine scelte dall'utente
  const cucineScelte = preferenze.map(p => p.cucina);
  const { data: piattiRaw, error } = await supabase
    .from('dishes')
    .select('id, name, meal_slot, cucina')
    .in('cucina', cucineScelte);
  if (error) throw error;

  const piatti = [];
  for (const p of piattiRaw) {
    const vals = await calcolaPiatto(p.id);
    piatti.push({ ...p, ...vals });
  }

  // 3. Organizza i piatti per slot e per cucina
  function perSlotECucina(slot) {
    const risultato = {};
    cucineScelte.forEach(c => { risultato[c] = piatti.filter(p => p.meal_slot === slot && p.cucina === c); });
    return risultato;
  }

  const secondiPerCucina = perSlotECucina('secondo');
  const primiPerCucina = perSlotECucina('primo');
  const colazioniPerCucina = perSlotECucina('colazione');
  const contorniPerCucina = perSlotECucina('contorno');
  const spuntiniPerCucina = perSlotECucina('spuntino');

  console.log(`Piatti totali disponibili nelle cucine scelte: ${piatti.length}\n`);

  const TENTATIVI_MAX = 300;
  let migliore = null;
  let migliorPunteggio = -Infinity;

  for (let tentativo = 0; tentativo < TENTATIVI_MAX; tentativo++) {
    const settimana = [];
    const usoGruppi = {};
    let valido = true;

    for (let g = 0; g < 7 && valido; g++) {
      const secondo = scegliPesato(secondiPerCucina, pesi);
      const primo = scegliPesato(primiPerCucina, pesi);
      const colazione = scegliPesato(colazioniPerCucina, pesi);
      const contorno = scegliPesato(contorniPerCucina, pesi);
      const spuntino = scegliPesato(spuntiniPerCucina, pesi);

      if (!secondo || !primo) { valido = false; break; }

      if (secondo.gruppo) {
        usoGruppi[secondo.gruppo] = (usoGruppi[secondo.gruppo] || 0) + 1;
        if (usoGruppi[secondo.gruppo] > (FREQUENZE_MAX[secondo.gruppo] || 99)) {
          valido = false;
          break;
        }
      }

      const pastiGiorno = [colazione, primo, contorno, secondo, spuntino].filter(Boolean);
      const totale = sommaGiorno(pastiGiorno);
      const verifica = verificaGiorno(totale);

      settimana.push({ giorno: g + 1, primo, secondo, totale, verifica });
    }

    if (!valido) continue;

    const punteggio = settimana.filter(g =>
      g.verifica.saturi === 'OK' && g.verifica.sale === 'OK' && g.verifica.fibra === 'OK'
    ).length;

    if (punteggio > migliorPunteggio) {
      migliorPunteggio = punteggio;
      migliore = settimana;
      if (punteggio === 7) break;
    }
  }

  if (!migliore) {
    console.log("Non e' stato possibile generare una settimana valida con le cucine e i piatti disponibili.");
    return;
  }

  console.log(`Miglior risultato: ${migliorPunteggio}/7 giorni pienamente conformi\n`);
  const NOMI = ['', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  for (const g of migliore) {
    console.log(
      `${NOMI[g.giorno]}  [${g.primo.cucina}] ${g.primo.name.padEnd(30)} + [${g.secondo.cucina}] ${g.secondo.name.padEnd(30)}  ` +
      `${Math.round(g.totale.kcal)} kcal  sat ${g.totale.satFat.toFixed(1)}(${g.verifica.saturi})  ` +
      `fibra ${g.totale.fibre.toFixed(1)}(${g.verifica.fibra})  sale ${g.totale.salt.toFixed(2)}(${g.verifica.sale})`
    );
  }
}

// ============================================================
// Esempio: node genera-settimana.js 99999999-0000-0000-0000-000000000001
// ============================================================
const userId = process.argv[2] || '99999999-0000-0000-0000-000000000001';
generaSettimana(userId).catch(err => console.error('Errore:', err.message));