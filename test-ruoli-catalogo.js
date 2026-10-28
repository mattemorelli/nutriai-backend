const test=require('node:test'),assert=require('node:assert/strict');
const {mappaDaAlimenti,costruisciMappaRuoli,caricaIngredientiDi,classificaPiatti}=require('./classifica-ruoli-piatti');
const fixture=require('./test/fixtures/ruoli-catalogo.json');
const foods=new Map(fixture.foods.map(f=>[f.id,f]));
const ingredienti={};
for(const i of fixture.dish_ingredients)(ingredienti[i.dish_id]||=[]).push({food_id:i.food_id,grams:Number(i.grams),proteina:Number(i.protein_100g)*Number(i.grams)/100});
const mappa=mappaDaAlimenti(fixture.foods);
const risultato=classificaPiatti(fixture.dishes,ingredienti,mappa);
const ordinati=rs=>rs.map(r=>({...r,ruoli_coperti:[...r.ruoli_coperti].sort()})).sort((a,b)=>a.id.localeCompare(b.id));
test('23 ricette reali ricalcolate con le soglie canoniche esistenti',()=>{
 assert.equal(risultato.dubbi.length,0);assert.deepEqual(ordinati(risultato.aggiornamenti),ordinati(fixture.attesi));
});
test('rilettura e secondo ricalcolo non cambiano ancora i ruoli',()=>{
 const per=new Map(risultato.aggiornamenti.map(p=>[p.id,p]));
 const piatti=fixture.dishes.map(p=>({...p,...per.get(p.id)}));
 assert.deepEqual(classificaPiatti(piatti,ingredienti,mappa),risultato);
});
test('primario del piatto di patate deciso dal peso, non dal nome frittata',()=>{
 const p=risultato.aggiornamenti.find(p=>p.id==='6f18108c-9cc6-4c35-b144-6c71fe64f0b6');
 assert.equal(p.ruolo_primario,'base_amidacea');assert.ok(p.ruoli_coperti.includes('proteina_principale'));
});
test('melanzane ripiene conservano amido e latticino, senza falsa copertura proteica',()=>{
 const p=risultato.aggiornamenti.find(p=>p.id==='6da03221-009a-4e78-a520-127849513f7e');
 assert.equal(p.ruolo_primario,'verdura');assert.ok(p.ruoli_coperti.includes('base_amidacea'));assert.ok(p.ruoli_coperti.includes('latticino'));assert.ok(!p.ruoli_coperti.includes('proteina_principale'));
});
test('categorie allergeniche non modificano la derivazione dei ruoli',()=>{
 const altre=fixture.foods.map(f=>({...f,categoria:'uova',categorie_alimenti:['pesce','crostacei']}));
 assert.deepEqual([...mappaDaAlimenti(altre).mappa],[...mappa.mappa]);
});
function client(rows,errorPage=-1){
 const reads=[];return {reads,from(table){assert.equal(table,'foods');let page=0;const q={select(){return q;},order(k){assert.equal(k,'id');reads.push(k);return q;},range(a,b){assert.equal(b-a,999);page=a;return q;},then(ok,no){reads.push(page);return Promise.resolve(page===errorPage?{data:null,error:{message:'interruzione'}}:{data:rows.slice(page,page+1000),error:null}).then(ok,no);}};return q;}};
}
test('mappa nomi legge anche il cibo alla posizione 1001, in ordine unico',async()=>{
 const a=fixture.foods.find(f=>mappa.mappa.has(f.id)),b=fixture.foods.find(f=>f.id!==a.id&&mappa.mappa.has(f.id));
 const c=client([...Array(1000).fill(a),b]);const r=await costruisciMappaRuoli(c);
 assert.ok(r.mappa.has(b.id));assert.deepEqual(c.reads,['id',0,'id',1000]);
});
test('errore sulla seconda pagina blocca una mappa parziale',async()=>{
 const c=client(Array(1000).fill(fixture.foods[0]),1000);
 await assert.rejects(costruisciMappaRuoli(c),/lettura foods: interruzione/);
});
function clientIngredienti(row){return{from(){const q={select(){return q;},in(){return q;},order(){return q;},range(){return q;},then(ok,no){return Promise.resolve({data:[row],error:null}).then(ok,no);}};return q;}};}
for(const values of [{grams:null,foods:{protein_100g:1}},{grams:0,foods:{protein_100g:1}},{grams:'x',foods:{protein_100g:1}},{grams:20,foods:null},{grams:20,foods:{protein_100g:null}},{grams:20,foods:{protein_100g:-1}}]){
 test('ingrediente incompleto non viene trasformato in zero: '+JSON.stringify(values),async()=>{
  const row={...fixture.dish_ingredients[0],...values};await assert.rejects(caricaIngredientiDi(clientIngredienti(row),[row.dish_id]),/ingredienti non verificabili/);
 });
}
test('grammi e proteine decimali del database convertiti in numeri',async()=>{
 const row={...fixture.dish_ingredients[0],grams:'50.5',foods:{protein_100g:'10'}};
 const r=await caricaIngredientiDi(clientIngredienti(row),[row.dish_id]);assert.equal(r[row.dish_id][0].grams,50.5);assert.equal(r[row.dish_id][0].proteina,5.05);
});
