// Uso: node verifica-amido-canonico.cjs --backend /path/backend --snapshot /path/catalogo.json [--output /path/esito.json]
// Nessun DB: tutte le query leggono copie del catalogo congelato. ID esclusivamente reali.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),Module=require('node:module'),crypto=require('node:crypto');
const args=process.argv.slice(2),arg=(key,def)=>{const i=args.indexOf('--'+key);return i>=0?args[i+1]:def;};
const backend=path.resolve(arg('backend',__dirname)),snapshotPath=path.resolve(arg('snapshot',path.join(__dirname,'test/fixtures/amido-canonico.json'))),output=arg('output',null);
const snapshotRaw=fs.readFileSync(snapshotPath,'utf8'),snapshot=JSON.parse(snapshotRaw);
for(const i of snapshot.tabelle.dish_ingredients)i.grams=Number(i.grams);
for(const d of snapshot.tabelle.dishes)if(d.health_score!=null)d.health_score=Number(d.health_score);
const FIX={riso:'22222222-0001-0001-0001-000000000001',pasta:'09624782-535f-445a-836c-a34338a2b427',patate:'43cb8d0c-4fbd-4874-ac50-9e9b371a1f1f',paneGF:'950107bb-00a2-4b6b-9983-b01e4f8c779e',legumi:'1c7fce71-8b53-4e58-83aa-3ac4d12e7317',soia:'03876a15-3217-4c85-9faa-c87d08fce0f1',tracciaFarina:'2ba80bbb-b009-4fbf-ac95-91a7ef12ec3c',tracciaFarinaGF:'93f5f274-c625-4e6c-af34-ec0bc074c7e8',verdura:'c0000002-0000-0000-0000-000000000005'};
function clone(){return structuredClone(snapshot.tabelle);}
function client(tables){
 return {from(table){assert.ok(Object.hasOwn(tables,table),'Tabella inattesa '+table);let predicates=[],orders=[],start=0,end=Infinity,one=false;
  const result=()=>{let rs=tables[table].filter(r=>predicates.every(f=>f(r)));if(orders.length)rs=rs.slice().sort((a,b)=>{for(const[k,asc]of orders){if(a[k]<b[k])return asc?-1:1;if(a[k]>b[k])return asc?1:-1;}return 0;});rs=rs.slice(start,end===Infinity?undefined:end+1);return{data:one?(rs[0]||null):rs,error:null};};
  const q={select(){return q;},eq(k,v){predicates.push(r=>r[k]===v);return q;},in(k,vs){const s=new Set(vs);predicates.push(r=>s.has(r[k]));return q;},contains(k,vs){predicates.push(r=>vs.every(v=>(r[k]||[]).includes(v)));return q;},order(k,o={}){orders.push([k,o.ascending!==false]);return q;},range(a,b){start=a;end=b;return q;},limit(n){end=n-1;return q;},single(){one=true;return Promise.resolve(result());},maybeSingle(){one=true;return Promise.resolve(result());},then(resolve,reject){return Promise.resolve().then(result).then(resolve,reject);},insert(){throw Error('Scrittura proibita');},update(){throw Error('Scrittura proibita');},delete(){throw Error('Scrittura proibita');}};return q;
 }};
}
function fresh(){const file=path.join(backend,'genera.js'),m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(backend);const log=console.log;console.log=()=>{};try{m._compile(fs.readFileSync(file,'utf8'),file);}finally{console.log=log;}return m.exports;}
async function load(tables){const g=fresh(),pool=await g.caricaPiattiPerId(client(tables),tables.dishes.map(d=>d.id));return{g,pool,byId:new Map(pool.map(p=>[p.id,p]))};}
const results=[],warnings=[];
function test(name,fn){try{fn();results.push({name,ok:true});}catch(e){results.push({name,ok:false,error:e.message});}}
(async()=>{
 const original=await load(clone());
 const d=k=>{const p=original.byId.get(FIX[k]);assert.ok(p,'Fixture reale mancante '+k);return p;};
 for(const[k,id]of Object.entries(FIX))test('Fixture reale '+k,()=>{assert.ok(snapshot.tabelle.dishes.some(d=>d.id===id));assert.ok(original.byId.has(id));});
 const expect={riso:true,pasta:true,patate:true,paneGF:true,legumi:false,soia:false,tracciaFarina:false,tracciaFarinaGF:false,verdura:false};
 for(const[k,want]of Object.entries(expect))test('Loader '+k+' amido='+want,()=>assert.equal(d(k).amidoReale,want,d(k).name));
 test('Contratto canonico completo su tutti i piatti caricati',()=>{assert.equal(original.pool.length,snapshot.tabelle.dishes.length);for(const p of original.pool)assert.equal(p.amidoReale,Array.isArray(p.ruoli_coperti)&&p.ruoli_coperti.includes('base_amidacea'),p.name);});
 test('Traccia farina reale di10g resta distinta da base amidacea',()=>{for(const k of ['tracciaFarina','tracciaFarinaGF']){const ings=snapshot.tabelle.dish_ingredients.filter(i=>i.dish_id===FIX[k]);assert.ok(ings.some(i=>i.grams===10&&/farina/i.test(i.foods?.name_it||'')));assert.equal(d(k).amidoReale,false);}});
 for(const[a,b]of [['riso','pasta'],['pasta','patate'],['paneGF','pasta'],['paneGF','patate']])test('Doppio amido vietato '+a+'+'+b,()=>{const p=d(a),q=d(b);assert.notEqual(p.principale,q.principale,'Precondizione: ingredienti principali diversi');assert.ok(!p.ruoli_coperti.includes('proteina_principale')&&!q.ruoli_coperti.includes('proteina_principale'),'Precondizione: nessun doppio proteico');assert.equal(original.g.accompagnaBene(p,q),false);assert.equal(original.g.accompagnaBene(q,p),false);});
 for(const[a,b]of [['patate','verdura'],['pasta','tracciaFarina'],['paneGF','legumi'],['patate','soia']])test('Una base con accompagnamento non amidaceo ammessa '+a+'+'+b,()=>{assert.equal(original.g.accompagnaBene(d(a),d(b)),true);assert.equal(original.g.accompagnaBene(d(b),d(a)),true);});
 const noCategories=clone();noCategories.categorie_alimenti=[];const without=await load(noCategories);
 test('Rimuovere tutte le categorie non cambia amidoReale',()=>{assert.equal(without.pool.length,original.pool.length);for(const p of original.pool)assert.equal(without.byId.get(p.id).amidoReale,p.amidoReale,p.name);});
 const mutated=clone(),foodIds=new Set(mutated.foods.map(f=>f.id));
 const realRice=mutated.dish_ingredients.find(i=>i.dish_id===FIX.riso&&/riso|rice/i.test(i.foods?.name_it||i.foods?.name||''));
 const realChicken=mutated.dish_ingredients.find(i=>i.dish_id===FIX.tracciaFarina&&/pollo|chicken/i.test(i.foods?.name_it||i.foods?.name||''));
 assert.ok(realRice&&realChicken&&foodIds.has(realRice.food_id)&&foodIds.has(realChicken.food_id));
 // Le categorie aggiunte esistono solo nella copia in memoria: nessuna mutazione al catalogo o al DB.
 mutated.categorie_alimenti.push({food_id:realRice.food_id,categoria:'glutine'},{food_id:realChicken.food_id,categoria:'frutta_guscio'},{food_id:realChicken.food_id,categoria:'amido'});
 const changed=await load(mutated);
 test('Categorie allergeniche e categoria amido artificiale non cambiano i ruoli amidacei',()=>{for(const p of original.pool)assert.equal(changed.byId.get(p.id).amidoReale,p.amidoReale,p.name);});
 test('Doppio amido resta vietato senza categorie allergeniche',()=>assert.equal(without.g.accompagnaBene(without.byId.get(FIX.pasta),without.byId.get(FIX.patate)),false));
 const malformed=clone();malformed.dishes.find(p=>p.id===FIX.riso).ruoli_coperti=null;malformed.dishes.find(p=>p.id===FIX.pasta).ruoli_coperti='base_amidacea';const missing=await load(malformed);
 test('Ruoli nulli o non array non vengono interpretati come ruolo canonico',()=>{assert.equal(missing.byId.get(FIX.riso).amidoReale,false);assert.equal(missing.byId.get(FIX.pasta).amidoReale,false);});
 for(const id of ['6f18108c-9cc6-4c35-b144-6c71fe64f0b6','b29d57e7-db25-4cdf-8329-e275de84c7eb','81690e67-d20a-43c4-8ce9-8f6c35c59c66']){
  const p=original.byId.get(id);assert.ok(p);const ingredients=snapshot.tabelle.dish_ingredients.filter(i=>i.dish_id===id);const starch=ingredients.filter(i=>/patat|riso|rice/i.test(i.foods?.name_it||i.foods?.name||''));warnings.push({id,name:p.name,ruoli_coperti:p.ruoli_coperti,amidoReale:p.amidoReale,ingredientiAmidacei:starch.map(i=>({food_id:i.food_id,name:i.foods?.name_it||i.foods?.name,grams:i.grams})),nota:'Dato canonico da revisionare: il fix del loader rispetta il contratto ma non corregge ruoli preesistenti incompleti.'});
 }
 const outcome={backend,snapshot:snapshotPath,snapshotSha256:crypto.createHash('sha256').update(snapshotRaw).digest('hex'),generaSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(backend,'genera.js'))).digest('hex'),piatti:original.pool.length,amidoReale:original.pool.filter(p=>p.amidoReale).length,test:results.length,passati:results.filter(r=>r.ok).length,falliti:results.filter(r=>!r.ok).length,risultati:results,avvisiCatalogo:warnings};
 if(output)fs.writeFileSync(path.resolve(output),JSON.stringify(outcome,null,2));process.stdout.write(JSON.stringify(outcome,null,2)+'\n');if(outcome.falliti)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
