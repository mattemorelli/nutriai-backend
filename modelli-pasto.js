const { RIFERIMENTO_GRASSI } = require('./bilancia-grassi');
const RUOLI = ['proteina_principale', 'base_amidacea', 'verdura'];
const copre = (p, ruolo) => (p?.ruoli_coperti || []).includes(ruolo);
const copertura = piatti => new Set(RUOLI.filter(r => piatti.some(p => copre(p, r))));

// Lo Swap deve conservare i ruoli che il resto del pasto non fornisce.
// Vale anche per un piatto unico senza altre righe nello stesso pasto.
function preservaRuoliDelPasto(originale, nuovo, gemelli = []) {
  const altri = copertura(gemelli);
  return RUOLI.every(r => !copre(originale, r) || altri.has(r) || copre(nuovo, r));
}

function contaGruppi(settimana) {
  const usi = {};
  for (const g of settimana) for (const meal of ['pranzo', 'cena']) {
    const gruppi = new Set(g.pasti.filter(p => p.meal === meal && copre(p.piatto, 'proteina_principale'))
      .map(p => p.piatto.gruppo).filter(Boolean));
    for (const gruppo of gruppi) usi[gruppo] = (usi[gruppo] || 0) + 1;
  }
  return usi;
}

// Ripetizioni effettive dei secondi freschi; gli avanzi non consumano
// questo budget. Usato sia dal vincolo sia dalle concessioni finali.
function ripetizioniSecondi(settimana) {
  const visti=new Set(),ripetuti=[];
  for(const g of settimana.slice().sort((a,b)=>a.giorno-b.giorno))for(const r of g.pasti) {
    if(r.slot!=='secondo'||r.avanzi)continue;
    if(visti.has(r.piatto.id))ripetuti.push({giorno:g.giorno,meal:r.meal,piatto:r.piatto});
    else visti.add(r.piatto.id);
  }
  return ripetuti;
}

// Ottimizzazione locale sulla settimana gia' costruita. La ricerca
// principale rimane disponibile come risultato quando non c'e' un modello
// migliore. Nessuna ricetta viene modificata e nessun nuovo spuntino aggiunto.
function miglioraModelliPasto({ settimana, contesto, valuta, targetProteine, quote, accompagnaBene, preferisciGrassi = false, riferimentoFruttaSecca = null, ripetizioneQuantita = false }) {
  const nuova = settimana.map(g => ({ ...g, pasti: g.pasti.slice() }));
  const gruppiPrima = contaGruppi(settimana);
  const modelli = [];
  if (!targetProteine || !settimana.length) return { settimana: nuova, modelli, usoGruppi: gruppiPrima };
  const EPS = 1e-7;
  const contaUsi = week => {
    const usi=new Map();for(const g of week)for(const r of g.pasti)if(r.slot==='secondo'&&!r.avanzi)usi.set(r.piatto.id,(usi.get(r.piatto.id)||0)+1);return usi;
  };
  const usiPrima=contaUsi(settimana);
  const maxRipetizioni=Math.max(1,ripetizioniSecondi(settimana).length);
  const minuti = p => p.prep_min ?? (p.meal_slot === 'contorno' ? 20 : 30);
  const durata = ps => ps.reduce((s, p) => s + minuti(p), 0);
  const densita = p => (p.protein || 0) / (p.kcal || 1);
  const ordine = ps => ps.slice().sort((a, b) => densita(b) - densita(a)
    || (b.health_score || 0) - (a.health_score || 0) || String(a.id).localeCompare(String(b.id)));
  const salsePrima = new Set(settimana.flatMap(d => d.pasti.filter(p => p.piatto.salsa_industriale).map(p => p.piatto.id))).size;
  const resti = new Set(settimana.flatMap(g => g.pasti.filter(p => p.avanzi).map(p => p.piatto.id)));

  for (const g of nuova) for (const meal of ['pranzo', 'cena']) {
    const precedenti = g.pasti.filter(p => p.meal === meal);
    // Protegge anche il piatto da cui dipende un avanzo successivo.
    if (!precedenti.length || precedenti.some(p => p.bloccato || p.avanzi || resti.has(p.piatto.id))) continue;
    const altri = g.pasti.filter(p => p.meal !== meal);
    const base = valuta(g.pasti);
    if (!base) continue;
    const quantitaAttiva = Number.isFinite(riferimentoFruttaSecca);
    if (quantitaAttiva && (!Number.isFinite(base.fruttaSecca) || !Number.isFinite(base.grassi) || base.fruttaSecca <= riferimentoFruttaSecca+.5)) continue;
    const ctx = contesto(g, meal);
    const ruoliPrima = copertura(g.pasti.map(p => p.piatto));
    const giaUsati = new Set(nuova.flatMap(d => d.pasti.filter(p => d !== g || p.meal !== meal).map(p => p.piatto.id)));
    const principali = new Set(altri.map(p => p.piatto.principale).filter(Boolean));
    const pool = ctx.piatti.filter(p => Array.isArray(p.ruoli_coperti) && p.ruoli_coperti.length
      && (!giaUsati.has(p.id) || (quantitaAttiva && ripetizioneQuantita && p.meal_slot==='secondo' && !resti.has(p.id))) && (!p.principale || !principali.has(p.principale)));
    const primi = ordine(pool.filter(p => p.meal_slot === 'primo'));
    const secondi = ordine(pool.filter(p => p.meal_slot === 'secondo' && copre(p, 'proteina_principale')));
    const verdure = ordine(pool.filter(p => p.meal_slot === 'contorno' && copre(p, 'verdura') && !p.base_amidacea)).slice(0, 8);
    const basi = ordine(pool.filter(p => p.meal_slot === 'contorno' && p.base_amidacea && ctx.baseAmmessa(p))).slice(0, 6);
    const tuttiPrincipali = ordine([...primi, ...secondi]);
    const firmaPrima = precedenti.map(p => p.piatto.id).sort().join('|');
    const riga = p => ({ meal, slot: p.meal_slot, piatto: p, bloccato: false,
      cercaProteine: Boolean(precedenti[0].cercaProteine) });
    let migliore = { pasti: precedenti, valore: base, tipo: null,
      punteggio: punteggio(base, precedenti.map(p => p.piatto)) };

    function punteggio(v, ps) {
      const scartoGrassi = preferisciGrassi && Number.isFinite(v.grassi) ? Math.max(0,v.grassi-v.kcal*RIFERIMENTO_GRASSI.maxPercento/100/9) : 0;
      const scartoQuantita = quantitaAttiva && Number.isFinite(v.fruttaSecca) ? Math.max(0,v.fruttaSecca-riferimentoFruttaSecca) : 0;
      return [Math.round(Math.min(targetProteine, v.proteine) * 10), -Math.round(scartoQuantita*10), -Math.round(scartoGrassi*10), -ps.length, -durata(ps),
        ps.reduce((s, p) => s + (p.health_score || 0), 0) / ps.length];
    }
    function meglio(a, b) {
      for (let i = 0; i < a.length; i++) {
        if (Math.abs(a[i] - b[i]) > EPS) return a[i] > b[i];
      }
      return false;
    }
    function prova(tipo, ps) {
      if (!ps.length || durata(ps) > ctx.minuti || ps.map(p => p.id).sort().join('|') === firmaPrima) return;
      if (new Set(ps.map(p => p.id)).size !== ps.length) return;
      const ingredienti = ps.map(p => p.principale).filter(Boolean);
      if (new Set(ingredienti).size !== ingredienti.length) return;
      if (ps.some((p, i) => ps.slice(i + 1).some(q => !accompagnaBene(p, q)))) return;
      const coperti = copertura(ps);
      if (!coperti.has('proteina_principale') || !coperti.has('verdura')) return;
      if (tipo !== 'secondo_contorno' && !coperti.has('base_amidacea')) return;
      if (ps.some(p => !ctx.abbinamentoBaseOk(p, ps))) return;
      const pasti = [...altri, ...ps.map(riga)];
      const ruoliDopo = copertura(pasti.map(p => p.piatto));
      if ([...ruoliPrima].some(r => !ruoliDopo.has(r))) return;
      const v = valuta(pasti);
      if (!v?.kcalOk || Math.abs(v.kcal - ctx.kcal) > Math.max(40, quantitaAttiva ? ctx.kcal*.05 : 0, Math.abs(base.kcal - ctx.kcal)) + EPS) return;
      if (quantitaAttiva && (!Number.isFinite(v.fruttaSecca) || !Number.isFinite(v.grassi) || v.fruttaSecca > base.fruttaSecca+.1)) return;
      if (preferisciGrassi && Number.isFinite(base.grassi) && Number.isFinite(v.grassi) && v.grassi > v.kcal*Math.max(base.grassi/base.kcal,RIFERIMENTO_GRASSI.maxPercento/100/9)+EPS) return;
      if (v.proteine + EPS < Math.min(targetProteine, base.proteine)) return;
      if (v.sale > Math.max(base.sale, v.saleMax) + EPS) return;
      if (v.saturi / v.satMax > Math.max(1, base.saturi / base.satMax) + EPS) return;
      if (v.fibra + EPS < Math.min(base.fibra, v.fibraMin)) return;
      const settimanaProposta = nuova.map(d => d === g ? { ...g, pasti } : d);
      if (quantitaAttiva && ripetizioneQuantita && ripetizioniSecondi(settimanaProposta).length>maxRipetizioni) return;
      if (quantitaAttiva && ripetizioneQuantita && [...contaUsi(settimanaProposta)].some(([id,n])=>n>Math.max(2,usiPrima.get(id)||0))) return;
      const usi = contaGruppi(settimanaProposta);
      if (Object.keys(usi).some(gruppo => usi[gruppo] > Math.max(quote[gruppo]?.max ?? Infinity, gruppiPrima[gruppo] || 0))) return;
      if (Object.keys(quote).some(gruppo => (usi[gruppo] || 0) < Math.min(quote[gruppo].min, gruppiPrima[gruppo] || 0))) return;
      const salseDopo = new Set(nuova.flatMap(d => (d === g ? pasti : d.pasti).filter(p => p.piatto.salsa_industriale).map(p => p.piatto.id))).size;
      if (salseDopo > Math.max(1, salsePrima)) return;
      const score = punteggio(v, ps);
      if (meglio(score, migliore.punteggio)) migliore = { pasti: ps.map(riga), valore: v, tipo, punteggio: score };
    }

    for (const p of tuttiPrincipali.filter(p => RUOLI.every(r => copre(p, r))).slice(0, 16)) prova('piatto_unico', [p]);
    for (const p of secondi.slice(0, 16)) {
      const contorni = copre(p, 'verdura') ? [null, ...verdure] : verdure;
      for (const v of contorni) {
        const ps = [p, v].filter(Boolean);
        prova('secondo_contorno', ps);
        if (!ps.some(q => q.amidoReale)) for (const b of basi) prova('secondo_contorno', [...ps, b]);
      }
    }
    for (const p of primi.filter(p => !copre(p, 'proteina_principale')).slice(0, 8)) {
      for (const s of secondi.slice(0, 12)) {
        const ps = [p, s];
        if (ps.some(q => copre(q, 'verdura'))) prova('completo', ps);
        else for (const v of verdure) prova('completo', [...ps, v]);
      }
    }
    if (migliore.tipo) {
      g.pasti = [...altri, ...migliore.pasti];
      modelli.push({ giorno: g.giorno, meal, modello: migliore.tipo });
    }
  }
  return { settimana: nuova, modelli, usoGruppi: contaGruppi(nuova) };
}

module.exports = { ripetizioniSecondi, RUOLI, preservaRuoliDelPasto, contaGruppi, miglioraModelliPasto };
