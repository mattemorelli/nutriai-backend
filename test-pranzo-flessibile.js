const assert = require('node:assert/strict');
const { test } = require('node:test');
const { creaPranzoFlessibile } = require('./pranzo-flessibile');
const { analizzaCapienza } = require('./genera');
function fixture(primi = [], secondi = []) {
  const statoGiorni = [{}, {}, {}, {}, {}, {}, {}], chiamate = [], usati = new Set(), gruppi = {};
  let salse = 0;
  const api = creaPranzoFlessibile({ statoGiorni,
    candidatiPrimo(...args) { chiamate.push(['primo', ...args]); return primi; },
    candidatiSecondo(...args) { chiamate.push(['secondo', ...args]); return secondi; },
    assegnaSlot(gi, slot, p) { statoGiorni[gi][slot] = p; usati.add(p.id); return () => { delete statoGiorni[gi][slot]; usati.delete(p.id); }; },
    assegnaSecondoPranzoScelto(gi, p) { statoGiorni[gi].secondoPranzo = p; usati.add(p.id); gruppi[p.gruppo] = (gruppi[p.gruppo] || 0) + 1; if(p.salsa_industriale)salse++;
      return () => { delete statoGiorni[gi].secondoPranzo; usati.delete(p.id); gruppi[p.gruppo]--; if(p.salsa_industriale)salse--; }; },
  });
  return { api, statoGiorni, chiamate, usati, gruppi, salse:()=>salse };
}
const piatti = n => Array.from({length:n},(_,i)=>({id:String(i)}));

test('selettori ordinari ricevono lo stesso contesto e il secondo viene filtrato come pranzo', () => {
  const c = fixture(piatti(2), [{id:'s'}]), filtro = () => true;
  const out = c.api.candidatiPrincipalePranzo(0,'mediterraneo','italia','mediterraneo_generico',filtro,25);
  assert.deepEqual(c.chiamate,[['primo',0,'mediterraneo','italia','mediterraneo_generico',filtro,25],['secondo',0,'mediterraneo','italia','mediterraneo_generico',filtro,25,'pranzo']]);
  assert.equal(out[0].slot,'secondo');
  assert.equal(out.length,3);
});

test('non reintroduce nessun candidato scartato dai selettori ordinari', () => {
  const c = fixture(); assert.deepEqual(c.api.candidatiPrincipalePranzo(0,'m','it',null,()=>true,25),[]);
});

test('la precedenza cambia con la capienza feriale senza perdere alternative', () => {
  for(const [gi,n,primoSlot] of [[0,4,'secondo'],[1,4,'primo'],[5,1,'secondo'],[6,1,'primo']]){
    const c=fixture(piatti(n),[{id:'s'}]);const out=c.api.candidatiPrincipalePranzo(gi,'m','it',null,()=>true,25);
    assert.equal(out[0].slot,primoSlot);assert.equal(out.length,n+1);
  }
});

test('annullare un secondo ripristina stato, usati, gruppi e salse', () => {
  const c=fixture(),p={id:'s',gruppo:'legumi',salsa_industriale:true};
  const undo=c.api.assegnaPrincipalePranzo(0,{slot:'secondo',piatto:p});
  assert.equal(c.statoGiorni[0].primo,null);assert.equal(c.statoGiorni[0].secondoPranzo,p);assert.equal(c.gruppi.legumi,1);assert.equal(c.salse(),1);assert.ok(c.usati.has('s'));
  undo();assert.deepEqual(c.statoGiorni[0],{});assert.equal(c.gruppi.legumi,0);assert.equal(c.salse(),0);assert.equal(c.usati.size,0);
});

test('un primo segue il setter ordinario e si annulla', () => {
 const c=fixture(),p={id:'p'};const undo=c.api.assegnaPrincipalePranzo(0,{slot:'primo',piatto:p});
 assert.equal(c.statoGiorni[0].primo,p);assert.equal(c.statoGiorni[0].secondoPranzo,undefined);undo();assert.deepEqual(c.statoGiorni[0],{});
});

test('nessuna scelta sovrascrive una portata gia assegnata o bloccata', () => {
 for(const st of [{primo:{id:'p'}},{primo:null,secondoPranzo:{id:'s'}},{secondoPranzo:{id:'s'}}]){
  const c=fixture();c.statoGiorni[0]=st;const before=structuredClone(st);
  assert.throws(()=>c.api.assegnaPrincipalePranzo(0,{slot:'secondo',piatto:{id:'nuovo'}}),/gia assegnato/);assert.deepEqual(st,before);assert.equal(c.usati.size,0);
 }
});

test('capienza: il recupero accetta principali alternativi senza rendere facoltative le cene', () => {
 const d=id=>({id,profilo:'m',paese:'italia'}),catalogo={primi:piatti(4).map((p,i)=>d('p'+i)),secondi:piatti(8).map((p,i)=>d('s'+i)),contorni:piatti(14).map((p,i)=>d('c'+i)),colazioni:[d('b')],spuntini:[]};
 const ctx={paesiScelti:['italia'],opz:{},rifiutato:()=>false,secondiFreschiNecessari:7,gruppiUnioneSettimana:new Set(),numeroSpuntini:0};
 assert.equal(analizzaCapienza('m',catalogo,ctx).ok,false);
 assert.equal(analizzaCapienza('m',catalogo,{...ctx,opz:{pranzoFlessibile:true}}).ok,true);
 assert.equal(analizzaCapienza('m',{...catalogo,secondi:catalogo.secondi.slice(0,2)},{...ctx,opz:{pranzoFlessibile:true}}).ok,false);
});
