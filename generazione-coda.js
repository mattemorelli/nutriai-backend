const {Worker}=require('node:worker_threads');
const {AsyncResource}=require('node:async_hooks');
const path=require('node:path');
const {caricaContestoGenerazione}=require('./salvataggio-generazione');
const {numeroSpuntiniRichiesto}=require('./richiesta-generazione');
const occupato=()=>Object.assign(new Error('The generator is busy. Wait a moment and try again.'),{status:503,code:'generatore_occupato'});
const nonConfermato=()=>Object.assign(new Error('The result could not be confirmed. Refresh your week before trying again.'),{status:503,code:'generazione_non_confermata'});

// Un solo esecutore riutilizzabile: la ricerca puo' essere lunga, ma non
// deve fermare autenticazione, lettura del piano o richieste di altri utenti.
// La coda e' limitata; una richiesta rifiutata non parte in seguito.
class CodaGenerazione {
  constructor({creaWorker=()=>new Worker(path.join(__dirname,'generazione-esecutore.js'),{resourceLimits:{maxOldGenerationSizeMb:128}}),maxInAttesa=3}={}) {
    this.creaWorker=creaWorker;this.maxInAttesa=maxInAttesa;this.coda=[];this.utenti=new Set();this.worker=null;this.attivo=null;this.sequenza=0;this.chiusa=false;
  }
  genera(userId,seed,opzioni={}) {
    if(this.chiusa)return Promise.reject(occupato());
    if(this.utenti.has(userId))return Promise.reject(Object.assign(new Error('A week is already being built for you. Wait a moment before trying again.'),{status:409,code:'generazione_in_corso'}));
    if(this.attivo&&this.coda.length>=this.maxInAttesa)return Promise.reject(occupato());
    // Copia al momento dell'accettazione: un chiamante non puo' cambiare
    // le scelte di una richiesta mentre aspetta il proprio turno.
    let copia;try{copia=structuredClone(opzioni);}catch{return Promise.reject(Object.assign(new Error('Invalid generation options.'),{status:400,code:'scelte_non_valide'}));}
    return new Promise((resolve,reject)=>{
      const lavoro={id:++this.sequenza,userId,seed,opzioni:copia,resolve,reject,risorsa:new AsyncResource('QuadrioGenerazione')};
      this.utenti.add(userId);this.coda.push(lavoro);this._prossimo();
    });
  }
  _concludi(lavoro,errore,risultato) {
    this.utenti.delete(lavoro.userId);
    lavoro.risorsa.runInAsyncScope(errore?lavoro.reject:lavoro.resolve,null,errore||risultato);
    lavoro.risorsa.emitDestroy();
  }
  _prossimo() {
    if(this.chiusa||this.attivo||!this.coda.length){if(!this.attivo)this.worker?.unref();return;}
    if(!this.worker){
      try{
        const worker=this.creaWorker();this.worker=worker;
        worker.on('message',m=>this._risposta(worker,m));
        worker.on('error',()=>this._interrotto(worker));
        worker.on('messageerror',()=>this._interrotto(worker));
        worker.on('exit',()=>this._interrotto(worker));
        worker.unref();
      }catch{
        this._concludi(this.coda.shift(),occupato());this._prossimo();return;
      }
    }
    this.attivo=this.coda.shift();this.worker.ref();
    try{this.worker.postMessage({id:this.attivo.id,userId:this.attivo.userId,seed:this.attivo.seed,opzioni:this.attivo.opzioni});}
    catch{this._interrotto(this.worker);}
  }
  _risposta(worker,m) {
    if(worker!==this.worker||!this.attivo||m?.id!==this.attivo.id)return;
    if((m.ok!==true&&m.ok!==false)||(m.ok===true&&(!m.risultato||typeof m.risultato!=='object'||Array.isArray(m.risultato)))){this._interrotto(worker);return;}
    const lavoro=this.attivo;this.attivo=null;
    const errore=m.ok?null:Object.assign(new Error(m.errore?.message||'Generation failed.'),{...(m.errore?.status?{status:m.errore.status}:{}),...(m.errore?.code?{code:m.errore.code}:{})});
    this._concludi(lavoro,errore,m.risultato);this._prossimo();
  }
  _interrotto(worker) {
    if(worker!==this.worker)return;
    this.worker=null;
    if(this.attivo){const lavoro=this.attivo;this.attivo=null;this._concludi(lavoro,nonConfermato());}
    // Nessun tentativo automatico per il lavoro interrotto: il salvataggio
    // potrebbe essere gia' riuscito. Le richieste ancora in attesa non sono
    // state eseguite e possono proseguire con un esecutore nuovo.
    Promise.resolve().then(()=>worker.terminate()).catch(()=>{}).finally(()=>this._prossimo());
  }
  async chiudi() {
    this.chiusa=true;
    for(const lavoro of this.coda.splice(0))this._concludi(lavoro,occupato());
    if(this.attivo){const lavoro=this.attivo;this.attivo=null;this._concludi(lavoro,nonConfermato());}
    const worker=this.worker;this.worker=null;if(worker)await worker.terminate();
  }
}
const coda=new CodaGenerazione();
// Il client non attraversa il confine del thread: l'esecutore usa la stessa
// configurazione server, con credenziali che restano nel backend.
function creaGenerazioneSeparata(coda){
 return async (client,userId,seed,opzioni={})=>{
  numeroSpuntiniRichiesto(opzioni.numeroSpuntini);
  // Il contesto viene fissato PRIMA dell'attesa, poi ricontrollato
  // dall'esecutore e dal commit atomico. Una coda non puo' rendere valida
  // una richiesta che nel frattempo ha cambiato profilo o catalogo.
  const contestoAtteso=opzioni.salva===false?null:await caricaContestoGenerazione(client,userId);
  return coda.genera(userId,seed,{...opzioni,...(contestoAtteso?{contestoAtteso}:{})});
 };
}
const generaESalvaSeparato=creaGenerazioneSeparata(coda);
module.exports={CodaGenerazione,generaESalvaSeparato,creaGenerazioneSeparata};
