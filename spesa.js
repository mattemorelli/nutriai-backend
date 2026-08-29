const { lettera, puntiCarbonio } = require('./voto');

// Reparti riconosciuti dal nome dell'alimento (italiano e inglese USDA).
const REPARTI = [
  ['Produce',   /tomato|pomodor|onion|cipoll|scalogno|shallot|garlic|aglio|carrot|carot|zucchin|squash|zucca|pepper|peperon|pastinac|parsnip|mango|albicocc|apricot|rape\b|broccoli|spinach|spinaci|lettuce|insalat|rucola|arugula|cabbage|cavol|potato|patat|topinambur|eggplant|melanzan|mushroom|fungh|cauliflower|cavolfior|pumpkin|pea,|pisell|asparagus|asparag|artichoke|carciof|cetriol|cucumber|sedano|celery|porr|leek|radicchio|cicoria|fagiolini|biet|ravanell|radish|rapa|turnip|okra|gombo|zenzer|ginger|limon|lemon|lime|orange|arancia|apple|mela|pear|pera|banana|platano|berry|mirtill|more|fragol|pesche|peach|ciliegi|cherry|uva|grape|melograno|anguria|melone|melon|ananas|pineapple|kiwi|avocado|erbe|basil|basilico|prezzemol|parsley|rosmarin|timo|thyme|salvia|sage|menta|mint|maggiorana|coriandol|cilantro/i],
  ['Meat & fish', /beef|manzo|chicken|pollo|turkey|tacchino|pork|maiale|lamb|agnello|vitell|coniglio|rabbit|fish|pesce|salmon|salmone|tuna|tonno|cod,|merluzzo|trout|trota|sgombro|sardin|acciugh|branzino|orata|nasello|sogliola|rombo|halibut|baccal|anguilla|gamber|shrimp|vongol|cozze|seppia|polpo|astice|granchio|crab|prosciutt|speck|bresaola|lonza/i],
  ['Dairy & eggs', /milk|latte|yogurt|cheese|formagg|mozzarella|ricotta|pecorino|parmig|grana|gorgonzola|taleggio|provola|emmental|caprino|stracchino|cheddar|feta|burro\b|butter|panna|cream|kefir|\begg|uovo|uova/i],
  ['Pantry',    /rice|riso|pasta|spaghett|penne|farro|spelt|orzo|quinoa|couscous|cous|bulgur|polenta|mais|corn|grano|bread|pane|tortilla|flour|farina|oat|avena|fiocchi|cereal|lentil|lenticch|bean|fagiol|ceci|chickpea|hummus|lupini|soia|soy|tofu|tempeh|edamame|passata|pelati|oil|olio|vinegar|aceto|salt|sale|pepe|sugar|zucchero|honey|miele|datter|uvetta|spice|spezi|paprika|curcuma|cumin|curry|origan|peperoncin|noci|almond|mandorl|nut|arachid|anacard|cashew|acai|cacao|cocoa|seed|semi|oliv|caper|capper|broth|brodo|stock|salsa|sauce|senape|mustard|tahini|miso/i],
];

function repartoDi(nome) {
  for (const [reparto, rx] of REPARTI) {
    if (rx.test(nome || '')) return reparto;
  }
  return 'Other';
}

// Trasforma i grammi in qualcosa che ha senso al supermercato.
function quantitaLeggibile(v, g) {
  if (g < 15 && v.unita !== 'pezzi') return 'a pinch';

  if (v.unita === 'pezzi' && v.pezzo) {
    const n = Math.max(1, Math.round(g / v.pezzo));
    return n === 1 ? '1' : `${n}`;
  }
  if (v.unita === 'mazzo') return '1 bunch';
  if (v.unita === 'barattolo' && v.pezzo) {
    const n = Math.max(1, Math.ceil(g / v.pezzo));
    return n === 1 ? '1 can' : `${n} cans`;
  }
  if (v.unita === 'confezione' && v.pezzo) {
    // Al supermercato compri la confezione intera, non i grammi che ti servono.
    const n = Math.max(1, Math.ceil(g / v.pezzo));
    const taglia = v.pezzo >= 1000
      ? `${(v.pezzo / 1000).toFixed(1)} kg`
      : `${v.pezzo} g`;
    return n === 1 ? `1 × ${taglia}` : `${n} × ${taglia}`;
  }
  if (g >= 1000) return `${(g / 1000).toFixed(1)} kg`;
  return `${g} g`;
}

// Quanto paghi davvero: la confezione intera, non i grammi che userai.
function costoReale(v, g) {
  let grammiPagati = g;

  if (v.unita === 'confezione' && v.pezzo) {
    grammiPagati = Math.max(1, Math.ceil(g / v.pezzo)) * v.pezzo;
  } else if (v.unita === 'barattolo' && v.pezzo) {
    grammiPagati = Math.max(1, Math.ceil(g / v.pezzo)) * v.pezzo;
  } else if (v.unita === 'pezzi' && v.pezzo) {
    grammiPagati = Math.max(1, Math.round(g / v.pezzo)) * v.pezzo;
  } else if (v.unita === 'mazzo' && v.pezzo) {
    grammiPagati = v.pezzo;
  }

  return Math.round(v.prezzo_kg * (grammiPagati / 1000) * 100) / 100;
}

// Quanto peserebbe la stessa settimana con una dieta onnivora media italiana.
// Stessa struttura di pasti, stesse quantità, ma i gruppi proteici sostituiti
// con la ripartizione tipica: più carne rossa e bianca, meno legumi e pesce.
const SETTIMANA_TIPICA = {
  // quota dei secondi settimanali per categoria, dieta onnivora media
  manzo:           { quota: 0.20, co2: 60.0 },
  maiale:          { quota: 0.22, co2: 7.2 },
  pollame:         { quota: 0.28, co2: 6.1 },
  pesce_selvatico: { quota: 0.10, co2: 3.5 },
  pesce_allevato:  { quota: 0.06, co2: 5.1 },
  formaggio:       { quota: 0.08, co2: 21.2 },
  uova:            { quota: 0.04, co2: 4.7 },
  legumi:          { quota: 0.02, co2: 0.9 },
};

function settimanaTipica(grammiProteici) {
  let co2 = 0;
  for (const v of Object.values(SETTIMANA_TIPICA)) {
    co2 += (grammiProteici / 1000) * v.quota * v.co2;
  }
  return co2;
}

async function listaSpesa(supabase, userId, planId) {
  // il piano più recente se non ne viene chiesto uno preciso
  let id = planId;
  if (!id) {
    const { data: p } = await supabase
      .from('plans').select('id')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1).maybeSingle();
    if (!p) throw new Error('Nessun piano trovato');
    id = p.id;
  } else {
    const { data: p } = await supabase
      .from('plans').select('id, user_id').eq('id', id).single();
    if (!p || p.user_id !== userId) throw new Error('Non autorizzato');
  }

  // le righe del piano che vanno davvero cucinate
  const { data: righe, error } = await supabase
    .from('plan_items')
    .select('dish_id, portion_g, stato, avanzi')
    .eq('plan_id', id);
  if (error) throw new Error(error.message);

  const attive = (righe || []).filter(r => r.stato !== 'saltato' && !r.avanzi);
  if (!attive.length) return { plan_id: id, reparti: [] };

  // ingredienti di tutti i piatti coinvolti
  const dishIds = [...new Set(attive.map(r => r.dish_id))];
  const { data: ing } = await supabase
    .from('dish_ingredients')
    .select('dish_id, food_id, grams, foods (name, name_en, name_it, unita, peso_pezzo_g, reparto, green_score, categoria_impatto, prezzo_kg, prezzo_fonte)')
    .in('dish_id', dishIds);

  // nomi dei piatti, per sapere dove finisce ogni ingrediente
  const { data: piatti } = await supabase
    .from('dishes')
    .select('id, name, name_en')
    .in('id', dishIds);
  const nomiPiatto = {};
  for (const p of (piatti || [])) {
    nomiPiatto[p.id] = p.name_en || p.name;
  }

  // grammi totali della ricetta base, per scalare sulla porzione
  const baseDi = {};
  for (const r of ing || []) {
    baseDi[r.dish_id] = (baseDi[r.dish_id] || 0) + Number(r.grams || 0);
  }

  // somma per alimento
  const totali = {};
  for (const riga of attive) {
    const base = baseDi[riga.dish_id] || 0;
    const scala = base > 0 ? Number(riga.portion_g || base) / base : 1;

    for (const r of (ing || []).filter(x => x.dish_id === riga.dish_id)) {
      const f = r.foods || {};
      if (!totali[r.food_id]) {
        totali[r.food_id] = {
          food_id: r.food_id,
          nome: f.name_en || f.name || r.food_id,
          unita: f.unita || 'peso',
          pezzo: f.peso_pezzo_g ? Number(f.peso_pezzo_g) : null,
          reparto: f.reparto || null,
          green: f.green_score || null,
          cat_impatto: f.categoria_impatto || null,
          prezzo_kg: f.prezzo_kg ? Number(f.prezzo_kg) : null,
          prezzo_debole: f.prezzo_fonte === 'stima_debole',
          grammi: 0,
          per: new Set(),
        };
      }
      totali[r.food_id].grammi += Number(r.grams || 0) * scala;
      if (nomiPiatto[riga.dish_id]) totali[r.food_id].per.add(nomiPiatto[riga.dish_id]);
    }
  }

  // Cosa l'utente ha già in casa: non entra nella lista.
  const { data: inCasa } = await supabase
    .from('pantry_items')
    .select('food_id')
    .eq('user_id', userId);
  const posseduti = new Set((inCasa || []).map(r => r.food_id));

  // Impatto assoluto per categoria: serve a dire quali voci pesano di più.
  const { data: categorie } = await supabase
    .from('impatto_categorie')
    .select('categoria, co2_kg_per_kg, nota');

  const impattoDi = {};
  for (const c of categorie || []) {
    impattoDi[c.categoria] = {
      co2: Number(c.co2_kg_per_kg),
      voto: lettera(puntiCarbonio(Number(c.co2_kg_per_kg))),
      nota: c.nota,
    };
  }

  // raggruppa per reparto
  const perReparto = {};
  for (const v of Object.values(totali)) {
    if (posseduti.has(v.food_id)) continue;

    const rep = v.reparto || repartoDi(v.nome);
    const g = Math.round(v.grammi);
    (perReparto[rep] ||= []).push({
      food_id: v.food_id,
      nome: v.nome,
      grammi: g,
      quantita: quantitaLeggibile(v, g),
      costo: v.prezzo_kg ? costoReale(v, g) : null,
      costo_debole: v.prezzo_debole || false,
      impatto: v.cat_impatto && impattoDi[v.cat_impatto]
        ? {
            voto: impattoDi[v.cat_impatto].voto,
            co2_kg: Math.round(impattoDi[v.cat_impatto].co2 * (g / 1000) * 100) / 100,
            categoria: v.cat_impatto,
          }
        : null,
      per: [...v.per].slice(0, 3),
      altri: Math.max(0, v.per.size - 3),
    });
  }

  const ordine = ['Produce', 'Meat & fish', 'Dairy & eggs', 'Pantry', 'Other'];
  const reparti = ordine
    .filter(r => perReparto[r])
    .map(r => ({
      reparto: r,
      voci: perReparto[r].sort((a, b) => b.grammi - a.grammi),
    }));

  // tutte le voci in un unico elenco, per i totali della spesa
  const tutte = reparti.flatMap(r => r.voci);
  const co2Totale = tutte.reduce((s, v) => s + (v.impatto?.co2_kg || 0), 0);
  const peggiori = tutte
    .filter(v => v.impatto)
    .sort((a, b) => b.impatto.co2_kg - a.impatto.co2_kg)
    .slice(0, 3)
    .map(v => ({
      nome: v.nome,
      co2_kg: v.impatto.co2_kg,
      voto: v.impatto.voto,
      quota: co2Totale > 0 ? Math.round((v.impatto.co2_kg / co2Totale) * 100) : 0,
    }));

  return {
    plan_id: id,
    reparti,
    totale: (() => {
      const costo = tutte.reduce((s, v) => s + (v.costo || 0), 0);

      // grammi delle fonti proteiche, per costruire il confronto a parità di pasti
      const PROTEICHE = ['manzo','agnello','maiale','pollame','pesce_selvatico',
                         'pesce_allevato','gamberi','uova','formaggio','legumi','tofu'];
      const grammiProt = tutte
        .filter(v => PROTEICHE.includes(v.impatto?.categoria))
        .reduce((s, v) => s + v.grammi, 0);

      const co2Tipica = settimanaTipica(grammiProt) + (co2Totale - tutte
        .filter(v => PROTEICHE.includes(v.impatto?.categoria))
        .reduce((s, v) => s + (v.impatto?.co2_kg || 0), 0));

      const diff = co2Tipica > 0
        ? Math.round((1 - co2Totale / co2Tipica) * 100)
        : 0;

      return {
        voci: tutte.length,
        co2_kg: Math.round(co2Totale * 10) / 10,
        co2_tipica_kg: Math.round(co2Tipica * 10) / 10,
        differenza_perc: diff,
        // I prezzi variano molto fra insegne: si mostra una forbice, non un numero secco
        costo_min: Math.round(costo * 0.88),
        costo_max: Math.round(costo * 1.12),
        costo_giorno: Math.round((costo / 7) * 10) / 10,
      };
    })(),
  };
}

async function dispensa(supabase, userId) {
  const { data, error } = await supabase
    .from('pantry_items')
    .select('food_id, foods (name)')
    .eq('user_id', userId);
  if (error) throw new Error(error.message);

  return (data || []).map(r => ({
    food_id: r.food_id,
    nome: r.foods?.name || r.food_id,
  }));
}

async function cambiaDispensa(supabase, userId, foodId, presente) {
  if (presente) {
    const { error } = await supabase
      .from('pantry_items')
      .upsert({ user_id: userId, food_id: foodId }, { onConflict: 'user_id,food_id' });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .eq('user_id', userId)
      .eq('food_id', foodId);
    if (error) throw new Error(error.message);
  }
  return { ok: true, food_id: foodId, presente };
}

// Per un ingrediente della lista, trova i prodotti migliori in catalogo.
async function marchePer(supabase, foodId, paese = 'italy', quanti = 5) {
  const { data: alimento } = await supabase
    .from('foods')
    .select('id, name, name_en, name_it, sinonimi, categoria_impatto')
    .eq('id', foodId)
    .single();
  if (!alimento?.categoria_impatto) return { food_id: foodId, prodotti: [] };

  // termini da cercare: nome italiano più sinonimi, i più lunghi per primi
  const termini = [alimento.name_it, ...(alimento.sinonimi || [])]
    .filter(Boolean)
    .map(t => t.toLowerCase().trim())
    .filter(t => t.length >= 4)
    .sort((a, b) => b.length - a.length)
    .slice(0, 8);

  if (!termini.length) return { food_id: foodId, prodotti: [] };

  // prendo tutti i prodotti della categoria e filtro qui: su parola intera,
  // che in SQL costerebbe una ricerca testuale completa
  const { data: tutti } = await supabase
    .from('prodotti')
    .select('barcode, nome, marca, voto_ambientale, punteggio_ambientale, nutri_score, voto_json')
    .eq('paese', paese)
    .eq('categoria_riconosciuta', alimento.categoria_impatto)
    .order('punteggio_ambientale', { ascending: false, nullsFirst: false })
    .limit(2000);

  // Le insegne della grande distribuzione non sono marche di prodotto:
  // l'utente vuole sapere quale marca comprare, non in quale supermercato andare.
  const { data: insegne } = await supabase
    .from('marche').select('nome').eq('tipo', 'insegna');
  const eInsegna = new Set((insegne || []).map(m => m.nome.toLowerCase()));

  const combacia = (nome) => {
    const n = ' ' + nome.toLowerCase().replace(/[^a-zàèéìòù0-9]+/g, ' ') + ' ';
    return termini.some(t => {
      if (n.includes(' ' + t + ' ')) return true;
      // plurali e varianti italiane: uovo/uova, mela/mele, pomodoro/pomodori
      const radice = t.replace(/[oaei]$/, '');
      if (radice.length < 4) return false;
      return new RegExp('\\s' + radice + '[oaei]\\s').test(n);
    });
  };

  // "Cozze al pomodoro" non è pomodoro: è un piatto che lo contiene.
  const PREPARATO = /\b(al|alla|allo|ai|agli|alle|con|in)\s|gratinat|ripien|farcit|impanat|panat|surgelat.*pront|piatto pronto|sugo di|salsa di|zuppa|minestr|insalata di|polpett|burger|crocchett|bastoncin/i;
  const eIngrediente = (nome) => {
    // se il termine cercato compare all'inizio, è probabilmente l'ingrediente
    const n = nome.toLowerCase();
    const primo = termini.find(t => n.startsWith(t));
    if (primo) return true;
    return !PREPARATO.test(n);
  };

  const visti = new Set();
  const tutti_validi = [];
  for (const p of tutti || []) {
    if (!combacia(p.nome)) continue;
    if (!eIngrediente(p.nome)) continue;
    if (p.marca && eInsegna.has(p.marca.toLowerCase())) continue;
    const chiave = (p.marca || p.nome).toLowerCase();
    if (visti.has(chiave)) continue;
    visti.add(chiave);
    tutti_validi.push({
      barcode: p.barcode,
      nome: p.nome,
      marca: p.marca,
      impatto: p.voto_ambientale,
      nutrizione: p.nutri_score ? p.nutri_score.toUpperCase() : null,
      perche: (p.voto_json?.marca_bonus ? [p.voto_json.marca_bonus] : [])
        .concat((p.voto_json?.dettaglio || []).flatMap(d => d.modificatori).filter(m => m.punti > 0))
        .map(m => ({ testo: m.descrizione, fonte: m.fonte })),
      contro: (p.voto_json?.dettaglio || [])
        .flatMap(d => d.modificatori)
        .filter(m => m.punti < 0)
        .map(m => ({ testo: m.descrizione, fonte: m.fonte })),
    });
  }

  // La seconda marca serve solo se ha un voto diverso dalla prima:
  // due alternative con lo stesso voto non aiutano a scegliere.
  const conVoto = tutti_validi.filter(p => p.impatto);
  const scelti = [];
  if (conVoto.length) {
    scelti.push(conVoto[0]);
    const diversa = conVoto.find(p => p.impatto !== conVoto[0].impatto);
    if (diversa) scelti.push(diversa);
  }
  // se non c'è niente con voto, mostro comunque cosa esiste
  if (!scelti.length) scelti.push(...tutti_validi.slice(0, quanti));

  // chi ha un voto ambientale davanti a chi non ne ha
  scelti.sort((a, b) => {
    const va = a.impatto ? 1 : 0, vb = b.impatto ? 1 : 0;
    if (va !== vb) return vb - va;
    return (a.impatto || 'Z').localeCompare(b.impatto || 'Z');
  });

  return {
    food_id: foodId,
    ingrediente: alimento.name_it || alimento.name_en,
    prodotti: scelti,
  };
}

// Per ogni voce della lista, le due marche migliori. Il lavoro lo fa il database.
async function sceltePer(supabase, userId, paese = 'italy') {
  const CON_MARCA = ['formaggio','latte','yogurt','burro','uova','maiale','pollame',
    'manzo','agnello','pesce_selvatico','pesce_allevato','gamberi','legumi',
    'pane_pasta','riso','cereali','olio','cioccolato','caffe','frutta_secca','tofu'];

  const PREPARATO = /\b(al|alla|allo|ai|agli|alle|con|in)\s|passata|frullat|pure\b|purè|omogeneizzat|gratinat|ripien|farcit|impanat|panat|sugo di|salsa di|zuppa|minestr|insalata di|polpett|burger|crocchett|bastoncin|snack|merendin|budino|dessert|fiori di|croccant|dorat|cordon|nugget|straccetti|spiedin|involtin|rustic|sfizi|delizi|mousse|pat[eè]\b|terrina|vellutat|crema di|risotto|pronto|preparato|condit|marinat|aromatizzat|affumicat.*erb|piatto|pancake|waffle|biscott|pasta\b|maccheron|penne|fusill|spaghett|gnocch|farina di|farina per|gusto|aromatizz/i;

  const lista = await listaSpesa(supabase, userId);
  const voci = lista.reparti.flatMap(r => r.voci);
  if (!voci.length) return { voci: [] };

  const { data: alimenti } = await supabase
    .from('foods')
    .select('id, name_it, name_en, sinonimi, categoria_impatto')
    .in('id', voci.map(v => v.food_id));

  // Chiamate separate, ma a gruppi di 6: tutte insieme finiscono in coda.
  const richieste = [];
  for (const v of voci) {
    const a = (alimenti || []).find(x => x.id === v.food_id);
    if (!a?.categoria_impatto || !CON_MARCA.includes(a.categoria_impatto)) continue;

    const termini = [a.name_it, ...(a.sinonimi || [])]
      .filter(Boolean)
      .map(t => t.toLowerCase().trim().replace(/[^a-zà-ù ]/g, ''))
      .filter(t => t.length >= 4)
      .slice(0, 6);
    if (!termini.length) continue;

    richieste.push({
      food_id: v.food_id,
      ingrediente: a.name_it || a.name_en,
      categoria: a.categoria_impatto,
      termini,
    });
  }

  const risultati = [];
  const GRUPPO = 6;

  for (let i = 0; i < richieste.length; i += GRUPPO) {
    const gruppo = richieste.slice(i, i + GRUPPO);
    const esiti = await Promise.all(gruppo.map(async (r) => {
      const { data } = await supabase.rpc('marche_migliori', {
        p_paese: paese,
        p_categoria: r.categoria,
        p_termini: r.termini,
        p_quante: 2,
      });
      return { r, data: data || [] };
    }));

    for (const { r, data } of esiti) {
      const due = [];
      for (const p of data) {
        const nl = p.nome.toLowerCase();
        const iniziaCon = r.termini.some(t => nl.startsWith(t));
        if (!iniziaCon && PREPARATO.test(nl)) continue;

        const mods = (p.voto_json?.dettaglio || []).flatMap(d => d.modificatori);
        due.push({
          barcode: p.barcode,
          marca: p.marca,
          nome: p.nome,
          impatto: p.voto_ambientale,
          perche: (p.voto_json?.marca_bonus ? [p.voto_json.marca_bonus] : [])
            .concat(mods.filter(m => m.punti > 0))
            .map(m => ({ testo: m.descrizione, fonte: m.fonte })),
          contro: mods.filter(m => m.punti < 0)
            .map(m => ({ testo: m.descrizione, fonte: m.fonte })),
        });
        if (due.length === 2) break;
      }
      if (due.length) {
        risultati.push({ food_id: r.food_id, ingrediente: r.ingrediente, marche: due });
      }
    }
  }

  return { voci: risultati };
}

// La classifica delle insegne per il paese dell'utente.
async function classificaInsegne(supabase, paese = 'italy') {
  const { data: voti } = await supabase
    .from('voti_marche')
    .select('*')
    .eq('paese', paese)
    .gt('criteri_valutati', 0)
    .order('complessivo', { ascending: false, nullsFirst: false });

  if (!voti?.length) return { valutate: [], insufficienti: [] };

  // il dettaglio dei criteri per tutte insieme
  const { data: dettagli } = await supabase
    .from('punteggi_marca')
    .select('marca_id, criterio, punti, motivazione, fonte, anno_dato, criteri_voto(nome, asse)')
    .in('marca_id', voti.map(v => v.id));

    // I criteri hanno pesi diversi: quelli sul cibo contano di più
  const { data: criteri } = await supabase
    .from('criteri_voto').select('codice, peso');
  const pesoDi = {};
  for (const c of criteri || []) pesoDi[c.codice] = Number(c.peso);

  const perMarca = {};
  for (const d of dettagli || []) {
    (perMarca[d.marca_id] ||= []).push({
      codice: d.criterio,
      criterio: d.criteri_voto?.nome || d.criterio,
      asse: d.criteri_voto?.asse,
      punti: Number(d.punti),
      pesato: Number(d.punti) / 2 * (pesoDi[d.criterio] || 2),
      motivazione: d.motivazione,
      fonte: d.fonte,
      anno: d.anno_dato,
    });
  }

  // Le due cose che pesano di più in positivo, più il difetto principale
  const treMotivi = (lista) => {
    if (!lista?.length) return [];
    const ordinati = [...lista].sort((a, b) => b.pesato - a.pesato);
    const forti = ordinati.filter(c => c.punti >= 1).slice(0, 2);
    const debole = [...lista]
      .sort((a, b) => a.punti - b.punti || b.pesato - a.pesato)
      .find(c => c.punti < 2 && !forti.includes(c));

    return [
      ...forti.map(c => ({ segno: '+', testo: c.motivazione, fonte: c.fonte, anno: c.anno })),
      ...(debole ? [{ segno: '–', testo: debole.motivazione, fonte: debole.fonte, anno: debole.anno }] : []),
    ];
  };

  const componi = (v, i) => ({
    posizione: i + 1,
    nome: v.nome,
    voto: v.complessivo != null ? Number(v.complessivo) : null,
    lettera: v.lettera,
    assi: v.valutabile ? {
      ambiente: Number(v.ambiente),
      umano: Number(v.umano),
      trasparenza: Number(v.trasparenza),
    } : null,
    copertura: {
      valutati: Number(v.criteri_valutati),
      totali: Number(v.criteri_possibili),
    },
       motivi: treMotivi(perMarca[v.id]),
    criteri: (perMarca[v.id] || []).sort((a, b) => b.pesato - a.pesato),
  });

  return {
    valutate: voti.filter(v => v.valutabile).map(componi),
    insufficienti: voti
      .filter(v => !v.valutabile)
      .sort((a, b) => b.criteri_valutati - a.criteri_valutati)
      .map(componi),
  };
}

module.exports = { listaSpesa, repartoDi, dispensa, cambiaDispensa, marchePer, sceltePer, classificaInsegne };