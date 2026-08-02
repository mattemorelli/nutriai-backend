require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { creaRichiedeAuth, verificaProprieta } = require('./auth-middleware');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const app = express();

// In produzione accetta solo il frontend pubblicato; in locale accetta tutto.
const ORIGINI = process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : true;
app.use(cors({ origin: ORIGINI }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Guardiano: verifica il token e mette l'utente in req.utente
const richiedeAuth = creaRichiedeAuth(supabase);

const LIMITI = {
  satMaxGiorno: 29,
  saleMaxGiorno: 5,
  fibraMinGiorno: 25,
};

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
    const { data: piatti, error } = await supabase
      .from('dishes')
      .select('id, name, meal_slot')
      .order('name');

    if (error) throw error;

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

  if (error) return res.status(500).json({ errore: error.message });
  if (!data) return res.status(404).json({ errore: 'Nessun piano per questo utente' });

  res.json({ plan_id: data.id });
});

app.get('/piano/:planId', richiedeAuth, async (req, res) => {
  try {
    const ok = await verificaProprieta(supabase, res, 'plans', req.params.planId, req.utente.id);
    if (!ok) return;

    const { data: items, error } = await supabase
      .from('plan_items')
      .select('day_of_week, meal, slot, dish_id, dishes (name, name_en, prep_min, steps, steps_en)')
      .eq('plan_id', req.params.planId)
      .order('day_of_week')
      .order('meal');

    if (error) throw error;
    if (!items.length) return res.status(404).json({ errore: 'Piano non trovato o vuoto' });

    const NOMI_GIORNO = ['', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    const giorni = {};

    for (const item of items) {
      const vals = await calcolaPiatto(item.dish_id);
      const g = item.day_of_week;
      if (!giorni[g]) {
        giorni[g] = {
          giorno: NOMI_GIORNO[g],
          pasti: [],
          totale: { kcal: 0, saturi_g: 0, fibra_g: 0, sale_g: 0 },
        };
      }
      giorni[g].pasti.push({
        pasto: item.meal,
        slot: item.slot,
        piatto: item.dishes.name,
        piatto_en: item.dishes.name_en || null,
        kcal: Math.round(vals.kcal),
        saturi_g: Number(vals.satFat.toFixed(1)),
        fibra_g: Number(vals.fibre.toFixed(1)),
        sale_g: Number(vals.salt.toFixed(2)),
        prep_min: item.dishes.prep_min,
        passaggi: item.dishes.steps,
        passaggi_en: item.dishes.steps_en || null,
      });
      giorni[g].totale.kcal     += vals.kcal;
      giorni[g].totale.saturi_g += vals.satFat;
      giorni[g].totale.fibra_g  += vals.fibre;
      giorni[g].totale.sale_g   += vals.salt;
    }

    const risultato = Object.values(giorni).map(g => ({
      giorno: g.giorno,
      pasti: g.pasti,
      totale_giorno: {
        kcal: Math.round(g.totale.kcal),
        saturi_g: Number(g.totale.saturi_g.toFixed(1)),
        fibra_g: Number(g.totale.fibra_g.toFixed(1)),
        sale_g: Number(g.totale.sale_g.toFixed(2)),
      },
      verifica: {
        saturi: g.totale.saturi_g <= LIMITI.satMaxGiorno ? 'OK' : 'SFORA',
        sale: g.totale.sale_g <= LIMITI.saleMaxGiorno ? 'OK' : 'SFORA',
        fibra: g.totale.fibra_g >= LIMITI.fibraMinGiorno ? 'OK' : 'BASSA',
      },
    }));

    res.json(risultato);
  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
});

// ---------- PREFERENZE CUCINA (protette) ----------

app.get('/preferenze', richiedeAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('user_cuisine_preferences')
    .select('cucina, rank')
    .eq('user_id', req.utente.id);

  if (error) return res.status(500).json({ errore: error.message });
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

  if (error) return res.status(500).json({ errore: error.message });
  res.json({ messaggio: 'Preferenze salvate.', preferenze: data });
});

// ---------- RADICE ----------

app.get('/', (req, res) => {
  res.send('NutriAI backend attivo.');
});

app.listen(PORT, () => {
  console.log(`\nServer avviato sulla porta ${PORT}`);
});