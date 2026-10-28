// Regressioni locali per le dipendenze HTTP; nessun DB e nessun servizio esterno.
const assert=require('node:assert/strict'),express=require('express'),proxyaddr=require('proxy-addr'),qs=require('qs'),{gzipSync}=require('node:zlib');
(async()=>{let n=0;const check=(nome,ok)=>{assert.ok(ok,nome);n++;console.log('OK '+nome);};
 const trust=proxyaddr.compile('::ffff:10.0.0.0/104');
 check('proxy IPv4 mappato riconosce la rete corretta',trust('10.1.2.3')&&!trust('203.0.113.7'));
 const ampio=proxyaddr.compile('::/1');check('rete IPv6 ampia non rende attendibile ogni IPv4',!ampio('203.0.113.7'));
 const oggetto=JSON.parse('{"a":[{"toString":"x"}]}');
 for(const encodeValuesOnly of [false,true]){assert.doesNotThrow(()=>qs.stringify(oggetto,{arrayFormat:'comma',encodeValuesOnly}));n++;console.log('OK serializzazione protetta '+encodeValuesOnly);}
 const app=express();app.use(express.json());app.post('/prova',(req,res)=>res.json(req.body));app.use((e,req,res,next)=>res.status(e.status||500).json({errore:'corpo_non_valido'}));
 const server=app.listen(0,'127.0.0.1');await new Promise((ok,no)=>{server.once('listening',ok);server.once('error',no);});
 const url='http://127.0.0.1:'+server.address().port+'/prova';
 async function richiesta(body,headers={}){return fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body,signal:AbortSignal.timeout(5000)});}
 try{
  let r=await richiesta(JSON.stringify({weight_kg:78}));check('JSON ordinario compatibile',r.status===200&&(await r.json()).weight_kg===78);
  r=await richiesta('{');check('JSON malformato rifiutato',r.status===400);
  r=await richiesta(JSON.stringify({dati:'x'.repeat(110*1024)}));check('corpo troppo grande rifiutato',r.status===413);
  r=await richiesta(gzipSync(JSON.stringify({ok:true})),{'Content-Encoding':'gzip'});check('JSON compresso compatibile',r.status===200&&(await r.json()).ok===true);
  r=await richiesta(Buffer.concat([gzipSync('{"ok":true}'),Buffer.from([255,255])]),{'Content-Encoding':'gzip'});check('compressione con dati finali non validi gestita',r.status>=400&&r.status<500);
  r=await richiesta('{"vivo":true}');check('server disponibile dopo richieste rifiutate',r.status===200&&(await r.json()).vivo===true);
 }finally{server.closeAllConnections();await new Promise(ok=>server.close(ok));}
 console.log(`${n} verifiche HTTP e librerie superate.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
