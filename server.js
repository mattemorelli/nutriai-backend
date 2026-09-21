console.log('[server] avviato', new Date().toISOString());
const { calcolaESalvaTarget } = require('./fabbisogno');
const { generaESalva } = require('./genera');
const { calibra } = require('./calibra');
const { trovaProposte, applicaSostituzione, spostaGiorno, saltaPasto } = require('./sostituisci');
const { listaSpesa, ingredientiPiatto, dispensa, cambiaDispensa, marchePer, sceltePer, classificaInsegne } = require('./spesa');
const { votoBarcode } = require('./voto');
const { ritratto, carbonioSettimanale, mappaPaesi } = require('./tu');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { creaRichiedeAuth, verificaProprieta } = require('./auth-middleware');

// Il backend deve usare la service_role: con RLS attivo la chiave anon
// non puo' leggere le tabelle personali (users, plans, ...).
const CHIAVE = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(process.env.SUPABASE_URL, CHIAVE);

// Avviso all'avvio se stiamo girando con la chiave sbagliata
try {
  const payload = JSON.parse(Buffer.from(CHIAVE.split('.')[1], 'base64').toString());
  if (payload.role !== 'service_role') {
    console.warn(`\n[ATTENZIONE] Il backend sta usando una chiave con ruolo "${payload.role}".`);
    console.warn('Serve la service_role, altrimenti le tabelle protette da RLS daranno "permission denied".\n');
  }
} catch {
  console.warn('\n[ATTENZIONE] Impossibile leggere il ruolo della chiave Supabase.\n');
}

const app = express();

// In produzione accetta solo il frontend pubblicato; in locale accetta tutto.
const ORIGINI = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin(origine, callback) {
    if (!origine) return callback(null, true);              // curl, server-to-server
    if (ORIGINI.length === 0) return callback(null, true);  // sviluppo locale
    if (ORIGINI.includes(origine.replace(/\/$/, ''))) return callback(null, true);
    callback(new Error('Origine non consentita'));
  },
}));

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Guardiano: verifica il token e mette l'utente in req.utente
const richiedeAuth = creaRichiedeAuth(supabase);

const LIMITI = {
  satMaxGiorno: 29,
  saleMaxGiorno: 5,
  fibraMinGiorno: 25,
};

// PostgREST impone un tetto di righe per risposta (di default 1000)
// indipendente da .limit(): con piu' di 1000 piatti in tabella le righe oltre
// la millesima spariscono in silenzio (visto anche in genera.js e tu.js).
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

async function calcolaPiatto(dishId) {
  const { data: ingredienti, error } = await supabase
    .from('dish_ingredients')
    .select('grams, foods (id, name, kcal_100g, protein_100g, fat_100g, sat_fat_100g, fibre_100g, salt_100g)')
    .eq('dish_id', dishId);

  if (error) throw error;

  const tot = { kcal: 0, protein: 0, fat: 0, satFat: 0, fibre: 0, salt: 0 };
  for (const riga of ingredienti) {
    const f = riga.foods;
    const fattore = riga.grams / 100;
    tot.kcal    += (f.kcal_100g    || 0) * fattore;
    tot.protein += (f.protein_100g || 0) * fattore;
    tot.fat     += (f.fat_100g     || 0) * fattore;
    tot.satFat  += (f.sat_fat_100g || 0) * fattore;
    tot.fibre   += (f.fibre_100g   || 0) * fattore;
    tot.salt    += (f.salt_100g    || 0) * fattore;
  }
  return tot;
}

// ---------- CATALOGO PIATTI (pubblico) ----------

app.get('/dishes', async (req, res) => {
  try {
    const piatti = await paginaTutto((da, a) => supabase
      .from('dishes')
      .select('id, name, meal_slot')
      .order('name').order('id')
      .range(da, a));

    const risultato = [];
    for (const piatto of piatti) {
      const vals = await calcolaPiatto(piatto.id);
      risultato.push({
        id: piatto.id,
        nome: piatto.name,
        slot: piatto.meal_slot,
        kcal: Math.round(vals.kcal),
        proteine_g: Number(vals.protein.toFixed(1)),
        grassi_g: Number(vals.fat.toFixed(1)),
        saturi_g: Number(vals.satFat.toFixed(1)),
        fibra_g: Number(vals.fibre.toFixed(1)),
        sale_g: Number(vals.salt.toFixed(2)),
      });
    }
    res.json(risultato);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
});

app.get('/dishes/:id', async (req, res) => {
  try {
    const { data: piatto, error: err1 } = await supabase
      .from('dishes')
      .select('id, name, meal_slot, prep_min, steps')
      .eq('id', req.params.id)
      .single();

    if (err1) throw err1;

    const { data: ingredienti, error: err2 } = await supabase
      .from('dish_ingredients')
      .select('grams, foods (id, name)')
      .eq('dish_id', req.params.id);

    if (err2) throw err2;

    const vals = await calcolaPiatto(req.params.id);

    res.json({
      piatto: piatto.name,
      slot: piatto.meal_slot,
      prep_min: piatto.prep_min,
      passaggi: piatto.steps,
      ingredienti: ingredienti.map(i => ({ nome: i.foods.name, grammi: i.grams })),
      valori: {
        kcal: Math.round(vals.kcal),
        saturi_g: Number(vals.satFat.toFixed(1)),
        fibra_g: Number(vals.fibre.toFixed(1)),
        sale_g: Number(vals.salt.toFixed(2)),
      },
      verifica: {
        saturi_ok: vals.satFat <= LIMITI.satMaxGiorno,
        sale_ok: vals.salt <= LIMITI.saleMaxGiorno,
      },
    });
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
});

// ---------- PIANI (protetti) ----------

app.get('/piano-corrente', richiedeAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('plans')
    .select('id')
    .eq('user_id', req.utente.id)
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('ERRORE /piano-corrente:', error);
    return res.status(500).json({ errore: error.message });
  }
  if (!data) return res.status(404).json({ errore: 'Nessun piano per questo utente' });

  res.json({ plan_id: data.id });
});

app.get('/piano/:planId', richiedeAuth, async (req, res) => {
  try {
    const { planId } = req.params;

    const { data: piano, error: errPiano } = await supabase
      .from('plans')
      .select('id, user_id, week_start, generated_at, corpus_version')
      .eq('id', planId)
      .single();

    if (errPiano || !piano) return res.status(404).json({ errore: 'Piano non trovato' });
    if (piano.user_id !== req.utente.id) return res.status(403).json({ errore: 'Non autorizzato' });

    const { data: righe, error: errItems } = await supabase
      .from('plan_items')
      .select(`
        id, day_of_week, meal, slot, portion_g, avanzi, bloccato, stato,
        kcal, protein_g, sat_fat_g, fibre_g, salt_g,
        dishes ( name, name_en, prep_min, steps, steps_en, health_score )
      `)
      .eq('plan_id', planId)
      .order('day_of_week');

    if (errItems) return res.status(500).json({ errore: errItems.message });

    const ordinePasto = { colazione: 1, pranzo: 2, spuntino: 3, cena: 4 };
    const ordineSlot = { colazione: 1, primo: 2, secondo: 3, contorno: 4, spuntino: 5, dolce: 6 };

    const perGiorno = {};
    for (const r of righe) {
      const d = r.dishes || {};
      if (!perGiorno[r.day_of_week]) perGiorno[r.day_of_week] = [];
      perGiorno[r.day_of_week].push({
        plan_item_id: r.id,
        stato: r.stato,
        pasto: r.meal,
        slot: r.slot,
        piatto: d.name,
        piatto_en: d.name_en,
        passaggi: d.steps || [],
        passaggi_en: d.steps_en || null,
        prep_min: d.prep_min,
        // I valori arrivano da plan_items: sono gia' scalati sul fabbisogno.
        porzione_g: r.portion_g,
        kcal: Math.round(Number(r.kcal) || 0),
        proteine_g: Number(r.protein_g) || 0,
        saturi_g: Number(r.sat_fat_g) || 0,
        fibra_g: Number(r.fibre_g) || 0,
        sale_g: Number(r.salt_g) || 0,
        health_score: d.health_score,
        avanzi: r.avanzi,
        bloccato: r.bloccato,
      });
    }

    const giorni = Object.keys(perGiorno)
      .map(Number)
      .sort((a, b) => a - b)
      .map((g) => ({
        giorno: g,
        pasti: perGiorno[g].sort((a, b) =>
          (ordinePasto[a.pasto] || 9) - (ordinePasto[b.pasto] || 9) ||
          (ordineSlot[a.slot] || 9) - (ordineSlot[b.slot] || 9)
        ),
      }));

    const { data: obiettivi } = await supabase
      .from('energy_targets')
      .select('kcal, protein_g_min, fibre_g_min, sat_fat_g_max, salt_g_max')
      .eq('user_id', piano.user_id)
      .order('computed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({
      plan_id: piano.id,
      week_start: piano.week_start,
      generated_at: piano.generated_at,
      corpus_version: piano.corpus_version,
      dati: giorni,
      giorni,
      obiettivi: obiettivi || null,
    });
  } catch (e) {
    res.status(500).json({ errore: e.message });
  }
});

// ---------- PREFERENZE CUCINA (protette) ----------

app.get('/preferenze', richiedeAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('user_cuisine_preferences')
    .select('cucina, rank')
    .eq('user_id', req.utente.id);

  if (error) {
    console.error('ERRORE /preferenze:', error);
    return res.status(500).json({ errore: error.message });
  }
  res.json(data);
});

app.post('/preferenze', richiedeAuth, async (req, res) => {
  const preferenze = req.body;

  if (!Array.isArray(preferenze) || preferenze.length === 0) {
    return res.status(400).json({ errore: 'Il corpo della richiesta deve essere un array di preferenze non vuoto.' });
  }

  const CUCINE_VALIDE = ['europea', 'usa', 'asiatica', 'sud_americana', 'australiana'];

  for (const p of preferenze) {
    if (!CUCINE_VALIDE.includes(p.cucina)) {
      return res.status(400).json({ errore: `Cucina non valida: ${p.cucina}` });
    }
    if (!Number.isInteger(p.rank) || p.rank < 1 || p.rank > 5) {
      return res.status(400).json({ errore: `Rank non valido per ${p.cucina}: deve essere un intero tra 1 e 5.` });
    }
  }

  const righe = preferenze.map(p => ({
    user_id: req.utente.id,
    cucina: p.cucina,
    rank: p.rank,
  }));

  const { data, error } = await supabase
    .from('user_cuisine_preferences')
    .upsert(righe, { onConflict: 'user_id,cucina' })
    .select();

  if (error) {
    console.error('ERRORE POST /preferenze:', error);
    return res.status(500).json({ errore: error.message });
  }
  res.json({ messaggio: 'Preferenze salvate.', preferenze: data });
});

// ---------- RADICE ----------

app.get('/', (req, res) => {
  res.send('NutriAI backend attivo.');
});

// ---------- ONBOARDING ----------

// Dice al frontend se il profilo e' completo
app.get('/profilo', richiedeAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('sex, birth_year, height_cm, city, region_zone, goal, cook_days, lunch_away, household_size, evening_minutes, paesi, is_pro')
    .eq('id', req.utente.id)
    .maybeSingle();

  if (error) {
    console.error('ERRORE /profilo:', error);
    return res.status(500).json({ errore: error.message });
  }

  const completo = Boolean(
    data && data.sex && data.birth_year && data.height_cm && data.goal
  );

  // Fonte unica per lo stato Pro: oggi il flag si alza a mano sul DB
  // (in attesa degli acquisti veri), ma chi legge da qui non deve cambiare
  // quando si collega un pagamento reale - cambia solo chi scrive is_pro.
  res.json({ completo, pro: Boolean(data?.is_pro), profilo: data || null });
});

// Dati per la schermata "You": ritratto sempre, carbonio e mappa solo Pro
// (restano null per chi non lo e', cosi' l'app puo' mostrare la sezione
// comunque, coperta da un invito ad abbonarsi, invece di nasconderla).
app.get('/tu', richiedeAuth, async (req, res) => {
  try {
    const { data: utente, error } = await supabase
      .from('users').select('is_pro').eq('id', req.utente.id).maybeSingle();
    if (error) return res.status(500).json({ errore: error.message });

    const isPro = Boolean(utente?.is_pro);
    const [r, carbonio, mappa] = await Promise.all([
      ritratto(supabase, req.utente.id, isPro),
      isPro ? carbonioSettimanale(supabase, req.utente.id) : Promise.resolve(null),
      isPro ? mappaPaesi(supabase, req.utente.id) : Promise.resolve(null),
    ]);

    res.json({ pro: isPro, ritratto: r, carbonio, mappa });
  } catch (e) {
    console.error('[tu]', e.message);
    res.status(500).json({ errore: e.message });
  }
});

// Salva le risposte, calcola il fabbisogno, genera il primo piano
app.post('/onboarding', richiedeAuth, async (req, res) => {
  const utenteId = req.utente.id;
  const b = req.body || {};

  // --- validazione ---
  const annoCorrente = new Date().getFullYear();
  const errori = [];

  if (!['M', 'F'].includes(b.sex)) errori.push('sesso non valido');
  if (!Number.isInteger(b.birth_year) || b.birth_year < annoCorrente - 100 || b.birth_year > annoCorrente - 16)
    errori.push('anno di nascita non valido');
  if (!(b.height_cm >= 120 && b.height_cm <= 230)) errori.push('altezza non valida');
  if (!(b.weight_kg >= 35 && b.weight_kg <= 300)) errori.push('peso non valido');
  if (!['dimagrimento', 'mantenimento', 'massa'].includes(b.goal)) {
    errori.push(`obiettivo non valido: ricevuto "${b.goal}"`);
  }
  const LAVORI_VALIDI = ['sedentario', 'in_piedi', 'fisico', 'molto_fisico'];
  const lavoroValido = LAVORI_VALIDI.includes(b.occupation_level);
  if (!lavoroValido) errori.push('livello di attività non valido');
  if (!Array.isArray(b.cuisines) || b.cuisines.length === 0) errori.push('preferenze cucina mancanti');

  if (errori.length) return res.status(400).json({ errore: errori.join('; ') });

  const CUCINE_VALIDE = ['europea', 'usa', 'asiatica', 'sud_americana', 'australiana'];
  if (b.cuisines.some(c => !CUCINE_VALIDE.includes(c)))
    return res.status(400).json({ errore: 'Cucina non riconosciuta' });

  const oggi = new Date().toISOString().slice(0, 10);

  try {
    // 1. profilo
    const { error: e1 } = await supabase
      .from('users')
      .update({
        sex: b.sex,
        birth_year: b.birth_year,
        height_cm: b.height_cm,
        city: b.city || null,
        region_zone: b.region_zone || null,
        goal: b.goal,
        cook_days: Array.isArray(b.cook_days) && b.cook_days.length ? b.cook_days : [1,2,3,4,5,6,7],
        lunch_away: Boolean(b.lunch_away),
        household_size: Number(b.household_size) || 1,
        evening_minutes: Number(b.evening_minutes) || 45,
        diet: ['onnivoro','vegetariano','vegano','pescetariano'].includes(b.diet) ? b.diet : 'onnivoro',
        paesi: Array.isArray(b.paesi) ? b.paesi : [],
        occupation_level: b.occupation_level,
      })
      .eq('id', utenteId);
    if (e1) throw new Error(`profilo: ${e1.message}`);

    // Il PAL resta scritto per compatibilità con i profili vecchi,
    // ma il calcolo userà occupation_level e training_sessions.
    if (Array.isArray(b.training_sessions) && b.training_sessions.length) {
      await supabase.from('training_sessions').delete().eq('user_id', req.utente.id);
      await supabase.from('training_sessions').insert(
        b.training_sessions.map((t) => ({
          user_id: req.utente.id,
          activity: t.activity,
          minutes_per_week: Math.min(1200, Math.max(0, Number(t.minutes_per_week) || 0)),
          intensity: ['leggera', 'moderata', 'intensa'].includes(t.intensity) ? t.intensity : 'moderata',
        }))
      );
    }

    // 2. peso - upsert perche' c'e' un vincolo una-misura-al-giorno: se
    // l'utente ha gia' registrato un peso oggi (es. da Peso.js prima di
    // finire l'onboarding), lo aggiorna invece di scontrarsi col vincolo.
    const { error: e2 } = await supabase
      .from('body_measurements')
      .upsert({
        user_id: utenteId,
        measured_on: oggi,
        weight_kg: Number(b.weight_kg),
        source: 'utente',
        body_fat_pct: b.body_fat_pct || null,
      }, { onConflict: 'user_id,measured_on' });
    if (e2) throw new Error(`peso: ${e2.message}`);

    // 4. vincoli alimentari (facoltativi)
    if (Array.isArray(b.constraints) && b.constraints.length) {
      const righe = b.constraints
        .filter(c => c && c.subject)
        .slice(0, 40)
        .map(c => ({
          user_id: utenteId,
          kind: c.kind || 'non_gradito',
          subject: String(c.subject).trim().slice(0, 80),
          severity: c.severity || 'preferibile',
          declared_at: new Date().toISOString(),
        }));
      if (righe.length) {
        const { error: e4 } = await supabase.from('user_constraints').insert(righe);
        if (e4) throw new Error(`vincoli: ${e4.message}`);
      }
    }

    // 5. preferenze cucina (l'ordine dell'array e' il rank)
    const prefs = b.cuisines.map((c, i) => ({ user_id: utenteId, cucina: c, rank: i + 1 }));
    const { error: e5 } = await supabase
      .from('user_cuisine_preferences')
      .upsert(prefs, { onConflict: 'user_id,cucina' });
    if (e5) throw new Error(`preferenze: ${e5.message}`);

    // 6. fabbisogno energetico
    const target = await calcolaESalvaTarget(supabase, utenteId);

    // 7. primo piano
    const piano = await generaESalva(supabase, utenteId);

    res.json({ ok: true, kcal: target.kcal, ...piano });
  } catch (err) {
    console.error('ERRORE /onboarding:', err);
    res.status(500).json({ errore: err.message });
  }
});

// ---------- SCHERMATA "YOU": modifiche puntuali dopo l'onboarding ----------

const GOAL_VALIDI = ['dimagrimento', 'mantenimento', 'massa'];
const DIET_VALIDI = ['onnivoro', 'vegetariano', 'vegano', 'pescetariano'];

// A differenza di /onboarding (scrive tutto insieme la prima volta), qui si
// cambia un campo alla volta: si aggiornano solo le chiavi presenti nel corpo.
app.post('/profilo', richiedeAuth, async (req, res) => {
  const b = req.body || {};
  const aggiornamento = {};

  if ('goal' in b) {
    if (!GOAL_VALIDI.includes(b.goal)) return res.status(400).json({ errore: 'obiettivo non valido' });
    aggiornamento.goal = b.goal;
  }
  if ('diet' in b) {
    if (!DIET_VALIDI.includes(b.diet)) return res.status(400).json({ errore: 'dieta non valida' });
    aggiornamento.diet = b.diet;
  }
  if ('cook_days' in b) {
    if (!Array.isArray(b.cook_days) || !b.cook_days.length
        || !b.cook_days.every(d => Number.isInteger(d) && d >= 1 && d <= 7)) {
      return res.status(400).json({ errore: 'giorni di cucina non validi' });
    }
    aggiornamento.cook_days = b.cook_days;
  }
  if ('evening_minutes' in b) {
    const m = Number(b.evening_minutes);
    if (!(m >= 10 && m <= 180)) return res.status(400).json({ errore: 'minuti serali non validi' });
    aggiornamento.evening_minutes = m;
  }
  if ('paesi' in b) {
    if (!Array.isArray(b.paesi) || !b.paesi.every(p => typeof p === 'string')) {
      return res.status(400).json({ errore: 'paesi non validi' });
    }
    aggiornamento.paesi = b.paesi;
  }
  if ('height_cm' in b) {
    const h = Number(b.height_cm);
    if (!(h >= 120 && h <= 230)) return res.status(400).json({ errore: 'altezza non valida' });
    aggiornamento.height_cm = h;
  }
  if ('birth_year' in b) {
    const annoCorrente = new Date().getFullYear();
    const y = Number(b.birth_year);
    if (!(y >= annoCorrente - 100 && y <= annoCorrente - 16)) {
      return res.status(400).json({ errore: 'anno di nascita non valido' });
    }
    aggiornamento.birth_year = y;
  }
  if ('household_size' in b) {
    const n = Number(b.household_size);
    if (!(Number.isInteger(n) && n >= 1 && n <= 12)) return res.status(400).json({ errore: 'numero di persone non valido' });
    aggiornamento.household_size = n;
  }

  if (!Object.keys(aggiornamento).length) return res.status(400).json({ errore: 'nessun campo da aggiornare' });

  const { error } = await supabase.from('users').update(aggiornamento).eq('id', req.utente.id);
  if (error) return res.status(500).json({ errore: error.message });
  res.json({ ok: true });
});

// ---------- VINCOLI ALIMENTARI (allergie, cibi esclusi) ----------

app.get('/vincoli', richiedeAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('user_constraints')
    .select('id, kind, subject, severity')
    .eq('user_id', req.utente.id)
    .order('declared_at', { ascending: true });
  if (error) return res.status(500).json({ errore: error.message });
  res.json(data || []);
});

app.post('/vincoli', richiedeAuth, async (req, res) => {
  const { kind, subject, severity } = req.body || {};
  const testo = String(subject || '').trim().slice(0, 80);
  if (!testo) return res.status(400).json({ errore: 'manca cosa evitare' });
  const k = ['allergia', 'non_gradito'].includes(kind) ? kind : 'non_gradito';
  const s = ['assoluto', 'preferibile'].includes(severity) ? severity : (k === 'allergia' ? 'assoluto' : 'preferibile');

  const { data, error } = await supabase
    .from('user_constraints')
    .insert({ user_id: req.utente.id, kind: k, subject: testo, severity: s, declared_at: new Date().toISOString() })
    .select('id, kind, subject, severity')
    .single();
  if (error) return res.status(500).json({ errore: error.message });
  res.json(data);
});

app.delete('/vincoli/:id', richiedeAuth, async (req, res) => {
  const ok = await verificaProprieta(supabase, res, 'user_constraints', req.params.id, req.utente.id);
  if (!ok) return;
  const { error } = await supabase.from('user_constraints').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ errore: error.message });
  res.json({ ok: true });
});

// Rigenera il piano per chi ha gia' un profilo
app.post('/genera-piano', richiedeAuth, async (req, res) => {
  try {
    const piano = await generaESalva(supabase, req.utente.id);
    res.json({ ok: true, ...piano });
  } catch (err) {
    console.error('ERRORE /genera-piano:', err);
    res.status(500).json({ errore: err.message });
  }
});

// Registra cosa e' successo davvero a un piatto del piano.
// E' il dato piu' prezioso che raccogliamo: dice se il piano regge la vita vera.
app.post('/esito', richiedeAuth, async (req, res) => {
  try {
    const b = req.body || {};
    const stati = ['cucinato', 'modificato', 'saltato'];
    const motivi = ['tempo', 'gusto', 'ingredienti', 'fuori_casa', 'altro'];

    if (!b.plan_item_id) return res.status(400).json({ errore: 'plan_item_id mancante' });
    if (!stati.includes(b.status)) return res.status(400).json({ errore: 'stato non valido' });
    if (b.skip_reason && !motivi.includes(b.skip_reason)) {
      return res.status(400).json({ errore: 'motivo non valido' });
    }

    // Verifica che la riga appartenga davvero a questo utente
    const { data: riga } = await supabase
      .from('plan_items')
      .select('id, dish_id, plans!inner(user_id)')
      .eq('id', b.plan_item_id)
      .single();

    if (!riga || riga.plans.user_id !== req.utente.id) {
      return res.status(403).json({ errore: 'Non autorizzato' });
    }

    const { error } = await supabase.from('meal_outcomes').upsert({
      user_id: req.utente.id,
      plan_item_id: b.plan_item_id,
      dish_id: riga.dish_id,
      status: b.status,
      skip_reason: b.status === 'saltato' ? (b.skip_reason || 'altro') : null,
      liked: b.liked ? Number(b.liked) : null,
      reported_at: new Date().toISOString(),
    }, { onConflict: 'plan_item_id' });

    if (error) return res.status(500).json({ errore: error.message });

    let rifiutiGusto = 0;
    if (b.status === 'saltato' && b.skip_reason === 'gusto') {
      const { count } = await supabase
        .from('meal_outcomes')
        .select('plan_item_id', { count: 'exact', head: true })
        .eq('user_id', req.utente.id)
        .eq('dish_id', riga.dish_id)
        .eq('status', 'saltato')
        .eq('skip_reason', 'gusto');
      rifiutiGusto = count || 0;
    }
    res.json({ ok: true, rifiuti_gusto: rifiutiGusto });
  } catch (e) {
    res.status(500).json({ errore: e.message });
  }
});

app.post('/sostituisci', richiedeAuth, async (req, res) => {
  try {
    const { item_id } = req.body;
    if (!item_id) return res.status(400).json({ errore: 'item_id mancante' });

    const r = await trovaProposte(supabase, req.utente.id, item_id);
    res.json(r);
  } catch (e) {
    console.error('[sostituisci]', e.message);
    const codice = e.message === 'Non autorizzato' ? 403 : 500;
    res.status(codice).json({ errore: e.message });
  }
});

app.post('/sostituisci/applica', richiedeAuth, async (req, res) => {
  try {
    const { item_id, dish_id, portion_g } = req.body;
    if (!item_id || !dish_id) {
      return res.status(400).json({ errore: 'item_id o dish_id mancante' });
    }

    const r = await applicaSostituzione(
      supabase, req.utente.id, item_id, dish_id, portion_g
    );
    res.json(r);
  } catch (e) {
    console.error('[sostituisci/applica]', e.message);
    const codice = e.message === 'Non autorizzato' ? 403 : 500;
    res.status(codice).json({ errore: e.message });
  }
});

app.post('/sposta', richiedeAuth, async (req, res) => {
  try {
    const { item_id, giorno } = req.body;
    if (!item_id || giorno === undefined) {
      return res.status(400).json({ errore: 'item_id o giorno mancante' });
    }

    const r = await spostaGiorno(supabase, req.utente.id, item_id, giorno);
    res.json(r);
  } catch (e) {
    console.error('[sposta]', e.message);
    const codice = e.message === 'Non autorizzato' ? 403 : 500;
    res.status(codice).json({ errore: e.message });
  }
});

app.post('/salta', richiedeAuth, async (req, res) => {
  try {
    const { item_id, annulla } = req.body;
    if (!item_id) return res.status(400).json({ errore: 'item_id mancante' });

    const r = await saltaPasto(supabase, req.utente.id, item_id, annulla === true);
    res.json(r);
  } catch (e) {
    console.error('[salta]', e.message);
    const codice = e.message === 'Non autorizzato' ? 403 : 500;
    res.status(codice).json({ errore: e.message });
  }
});

app.get('/piatto/:planItemId', richiedeAuth, async (req, res) => {
  try {
    const { planItemId } = req.params;
    const { data: item, error: errItem } = await supabase
      .from('plan_items')
      .select('id, plan_id, dish_id, portion_g')
      .eq('id', planItemId)
      .single();
    if (errItem || !item) return res.status(404).json({ errore: 'Piatto non trovato' });

    const { data: piano, error: errPiano } = await supabase
      .from('plans').select('user_id').eq('id', item.plan_id).single();
    if (errPiano || !piano) return res.status(404).json({ errore: 'Piano non trovato' });
    if (piano.user_id !== req.utente.id) return res.status(403).json({ errore: 'Non autorizzato' });

    const ingredienti = await ingredientiPiatto(supabase, item.dish_id, item.portion_g);
    res.json({ ingredienti });
  } catch (e) {
    console.error('[piatto]', e.message);
    res.status(500).json({ errore: e.message });
  }
});

app.get('/spesa', richiedeAuth, async (req, res) => {
  try {
    const r = await listaSpesa(supabase, req.utente.id, req.query.plan_id);
    res.json(r);
  } catch (e) {
    console.error('[spesa]', e.message);
    const codice = e.message === 'Non autorizzato' ? 403 : 500;
    res.status(codice).json({ errore: e.message });
  }
});

app.get('/dispensa', richiedeAuth, async (req, res) => {
  try {
    res.json({ voci: await dispensa(supabase, req.utente.id) });
  } catch (e) {
    console.error('[dispensa]', e.message);
    res.status(500).json({ errore: e.message });
  }
});

app.post('/dispensa', richiedeAuth, async (req, res) => {
  try {
    const { food_id, presente } = req.body;
    if (!food_id) return res.status(400).json({ errore: 'food_id mancante' });
    res.json(await cambiaDispensa(supabase, req.utente.id, food_id, presente === true));
  } catch (e) {
    console.error('[dispensa]', e.message);
    res.status(500).json({ errore: e.message });
  }
});

app.get('/prodotto/:barcode', richiedeAuth, async (req, res) => {
  try {
    const { barcode } = req.params;
    if (!/^\d{8,14}$/.test(barcode)) {
      return res.status(400).json({ errore: 'Codice a barre non valido' });
    }
    const r = await votoBarcode(supabase, barcode, req.query.paese || 'it');
    res.json(r);
  } catch (e) {
    console.error('[prodotto]', e.message);
    res.status(500).json({ errore: e.message });
  }
});

app.get('/marche/:foodId', richiedeAuth, async (req, res) => {
  try {
    const r = await marchePer(
      supabase,
      req.params.foodId,
      req.query.paese || 'italy',
      Number(req.query.quanti) || 5
    );
    res.json(r);
  } catch (e) {
    console.error('[marche]', e.message);
    res.status(500).json({ errore: e.message });
  }
});

app.get('/scelte', richiedeAuth, async (req, res) => {
  try {
    res.json(await sceltePer(supabase, req.utente.id, req.query.paese || 'italy'));
  } catch (e) {
    console.error('[scelte]', e.message);
    res.status(500).json({ errore: e.message });
  }
});

app.get('/insegne', richiedeAuth, async (req, res) => {
  try {
    res.json(await classificaInsegne(supabase, req.query.paese || 'italy'));
  } catch (e) {
    console.error('[insegne]', e.message);
    res.status(500).json({ errore: e.message });
  }
});

// Blocca o sblocca un piatto: alla prossima generazione resterà dov'è.
app.post('/blocca', richiedeAuth, async (req, res) => {
  try {
    const { plan_item_id, bloccato, day_of_week } = req.body || {};

    if (day_of_week) {
      // blocca l'intera giornata
      const { data: piano, error: ePiano } = await supabase
        .from('plans').select('id')
        .eq('user_id', req.utente.id)
        .order('generated_at', { ascending: false }).limit(1).maybeSingle();

      if (ePiano) return res.status(500).json({ errore: 'lettura plans: ' + ePiano.message });
      if (!piano) return res.status(404).json({ errore: 'Nessun piano da bloccare' });

      const { error } = await supabase
        .from('plan_items')
        .update({ bloccato: Boolean(bloccato) })
        .eq('plan_id', piano.id)
        .eq('day_of_week', day_of_week);

      if (error) return res.status(500).json({ errore: error.message });
      return res.json({ ok: true });
    }

    const { data: riga } = await supabase
      .from('plan_items')
      .select('id, plans!inner(user_id)')
      .eq('id', plan_item_id).single();

    if (!riga || riga.plans.user_id !== req.utente.id) {
      return res.status(403).json({ errore: 'Non autorizzato' });
    }

    const { error } = await supabase
      .from('plan_items').update({ bloccato: Boolean(bloccato) }).eq('id', plan_item_id);

    if (error) return res.status(500).json({ errore: error.message });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ errore: e.message });
  }
});

// Peso attuale e andamento delle ultime settimane, per la carta compatta
// nella schermata "You" (il flusso di inserimento resta in Peso.js).
app.get('/peso', richiedeAuth, async (req, res) => {
  try {
    const da = new Date(Date.now() - 42 * 86400000).toISOString().slice(0, 10); // 6 settimane
    const { data, error } = await supabase
      .from('body_measurements')
      .select('measured_on, weight_kg')
      .eq('user_id', req.utente.id)
      .gte('measured_on', da)
      .order('measured_on', { ascending: true });
    if (error) return res.status(500).json({ errore: error.message });

    const misure = data || [];
    if (!misure.length) return res.json({ attuale: null, trend_kg: null, giorni: 0, storico: [] });

    const attuale = Number(misure[misure.length - 1].weight_kg);
    const trend_kg = misure.length >= 2
      ? Math.round((attuale - Number(misure[0].weight_kg)) * 10) / 10
      : null;
    const giorni = misure.length >= 2
      ? Math.round((new Date(misure[misure.length - 1].measured_on) - new Date(misure[0].measured_on)) / 86400000)
      : 0;

    res.json({
      attuale,
      trend_kg,
      giorni,
      storico: misure.map(m => ({ data: m.measured_on, kg: Number(m.weight_kg) })),
    });
  } catch (e) {
    res.status(500).json({ errore: e.message });
  }
});

app.post('/peso', richiedeAuth, async (req, res) => {
  try {
    const kg = Number(req.body && req.body.weight_kg);
    if (!(kg >= 30 && kg <= 300)) {
      return res.status(400).json({ errore: 'Peso non valido' });
    }

    const oggi = new Date().toISOString().slice(0, 10);

    // Una sola pesata al giorno: la seconda sovrascrive la prima.
    const { error } = await supabase.from('body_measurements').upsert({
      user_id: req.utente.id,
      measured_on: oggi,
      weight_kg: kg,
      body_fat_pct: req.body.body_fat_pct ? Number(req.body.body_fat_pct) : null,
      source: 'utente',
    }, { onConflict: 'user_id,measured_on' });

    if (error) return res.status(500).json({ errore: error.message });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ errore: e.message });
  }
});

app.post('/calibra', richiedeAuth, async (req, res) => {
  try {
    const esito = await calibra(supabase, req.utente.id);
    res.json(esito);
  } catch (e) {
    res.status(500).json({ errore: e.message });
  }
});

console.log('[server] file:', __filename);
console.log('[server] avviato', new Date().toLocaleTimeString('it-IT'));

app.listen(PORT, () => {
  console.log(`\nServer avviato sulla porta ${PORT}`);
});