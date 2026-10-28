const {test}=require('node:test'),assert=require('node:assert/strict');
const fixture=require('./test/fixtures/amido-canonico.json').tabelle;
const {caricaVincoli,generaESalva}=require('./genera');
const id=fixture.foods[0].id,ID='utente-sintetico';
function client(vincoli){let scritture=0;const pagine=[];const t={...fixture,user_constraints:vincoli.map((v,i)=>({id:String(i).padStart(8,'0'),user_id:ID,...v})),users:[{id:ID,diet:'onnivoro',paesi:['italia'],evening_minutes:35,cook_days:[1,2,3,4,5,6,7]}],user_cuisine_preferences:[],energy_targets:[{id:'target',user_id:ID,kcal:2000,protein_g_min:85}],plans:[],plan_items:[],meal_outcomes:[]};
 return{pagine,scritture:()=>scritture,rpc:async nome=>{assert.equal(nome,'quadrio_contesto_generazione_v1');return{data:{versione:'0'},error:null};},from(tabella){let da=0,a=Infinity,one=false,filtri=[],ordini=[];assert.ok(t[tabella]);
 const result=()=>{let rs=t[tabella].filter(r=>filtri.every(f=>f(r)));if(ordini.length)rs=rs.slice().sort((x,y)=>{for(const k of ordini){if(x[k]<y[k])return-1;if(x[k]>y[k])return 1;}return 0;});if(tabella==='user_constraints')pagine.push([da,a,ordini]);return{data:one?rs[0]||null:rs.slice(da,a+1),error:null};};
 const q={select:()=>q,eq:(k,v)=>{filtri.push(r=>r[k]===v);return q;},contains:()=>q,in:(k,vs)=>{filtri.push(r=>vs.includes(r[k]));return q;},order:k=>{ordini.push(k);return q;},range:(x,y)=>{da=x;a=y;return q;},limit:n=>{a=n-1;return q;},single:()=>{one=true;return Promise.resolve(result());},maybeSingle:()=>{one=true;return Promise.resolve(result());},then:(x,y)=>Promise.resolve().then(result).then(x,y),insert:()=>{scritture++;throw Error('Scrittura vietata');},update:()=>{scritture++;throw Error('Scrittura vietata');}};return q;}};
}
test('legge anche il vincolo obbligatorio oltre la millesima riga',async()=>{
 const c=client([...Array.from({length:1000},()=>({kind:'non_gradito',severity:'preferibile',food_id:id})),{kind:'allergia',severity:'assoluto',subject:'esclusione non risolta'}]);
 await assert.rejects(caricaVincoli(c,ID),e=>e.status===422&&e.code==='vincoli_non_verificabili');assert.deepEqual(c.pagine.map(x=>x.slice(0,2)),[[0,999],[1000,1999]]);assert.ok(c.pagine.every(x=>x[2].includes('id')));assert.equal(c.scritture(),0);
});
test('la generazione rifiuta il vincolo prima di salvare un piano',async()=>{
 const c=client([{kind:'allergia',severity:'assoluto',subject:'esclusione non risolta'}]);await assert.rejects(generaESalva(c,ID,2026),e=>e.code==='vincoli_non_verificabili');assert.equal(c.scritture(),0);
});
test('preferenza facoltativa irrisolta non blocca una categoria valida',async()=>{
 const c=client([{kind:'non_gradito',severity:'preferibile',subject:'voce locale'},{kind:'allergia',severity:'assoluto',categoria:fixture.categorie_alimenti[0].categoria}]);
 const v=await caricaVincoli(c,ID);assert.equal(v.nonRisolti.length,1);assert.ok(v.foodIdVietati.size>0);
});

// La pagina Profilo deve permettere di vedere e correggere proprio il
// vincolo che ha fermato il generatore, anche quando e' oltre la riga 1000.
test('GET vincoli restituisce tutte le esclusioni con lo stesso lettore del generatore',async()=>{
 const fs=require('node:fs'),vm=require('node:vm');const source=fs.readFileSync(require.resolve('./server'),'utf8');
 const a=source.indexOf("app.get('/vincoli',"),b=source.indexOf("app.post('/vincoli',",a);let handler;
 const c=client(Array.from({length:1001},(_,i)=>({kind:'non_gradito',severity:'preferibile',subject:'preferenza '+i,food_id:id})));
 const ctx={supabase:c,richiedeAuth:()=>{},...require('./vincoli-verificabili'),app:{get(path,...fns){handler=fns.at(-1);}}};
 vm.createContext(ctx);vm.runInContext(source.slice(a,b),ctx);let body,status=200;
 const res={status(n){status=n;return res;},json(d){body=d;}};
 await handler({utente:{id:ID}},res);assert.equal(status,200);assert.equal(body.length,1001);assert.equal(body[1000].subject,'preferenza 1000');assert.ok(!('food_id' in body[0]));
 assert.equal(c.pagine.length,2);assert.equal(c.scritture(),0);
});
test('errore di lettura dei vincoli non restituisce una lista vuota',async()=>{
 const c={from(){const q={select:()=>q,eq:()=>q,order:()=>q,range:()=>q,then:(ok,no)=>Promise.resolve({data:null,error:{message:'rete interrotta'}}).then(ok,no)};return q;}};
 await assert.rejects(require('./vincoli-verificabili').leggiVincoliDichiarati(c,ID),/lettura user_constraints: rete interrotta/);
});
