const {test}=require('node:test'),assert=require('node:assert/strict');
const {caricaContestoGenerazione,salvaGenerazione}=require('./salvataggio-generazione');
test('contesto letto prima del salvataggio, senza creare righe personali',async()=>{
 const chiamate=[];const client={rpc:async(n,a)=>{chiamate.push([n,a]);return{data:{versione:'123',catalogo_id:'00000000-0000-4000-8000-000000000099',catalogo_versione:'1'},error:null};}};
 assert.deepEqual(await caricaContestoGenerazione(client,'u'),{versione:'123',catalogo_id:'00000000-0000-4000-8000-000000000099',catalogo_versione:'1'});assert.deepEqual(chiamate,[['quadrio_contesto_generazione_v2',{p_user_id:'u'}]]);
});
for(const data of [null,{}, {versione:0},{versione:'-1'},{versione:'1.2'},{versione:'x'}])test('contesto non valido non viene interpretato come versione zero: '+JSON.stringify(data),async()=>{
 await assert.rejects(caricaContestoGenerazione({rpc:async()=>({data,error:null})},'u'),/contesto generazione non disponibile/);
});
test('errore di lettura non consente una generazione senza protezione',async()=>{
 await assert.rejects(caricaContestoGenerazione({rpc:async()=>({data:null,error:{message:'rete interrotta'}})},'u'),/lettura contesto generazione: rete interrotta/);
});
test('unica chiamata salva intestazione, portate e contesto, senza scritture separate',async()=>{
 const chiamate=[],piano={seed:2026},righe=[{day_of_week:1}],contesto={versione:'1',catalogo_id:'00000000-0000-4000-8000-000000000099',catalogo_versione:'1'};
 const client={rpc:async(n,a)=>{chiamate.push([n,a]);return{data:{id:'piano',righe:1},error:null};},from:()=>assert.fail('Scrittura separata vietata')};
 const r=await salvaGenerazione(client,'u',contesto,piano,righe);assert.equal(r.id,'piano');assert.deepEqual(chiamate,[['quadrio_salva_generazione_v2',{p_user_id:'u',p_contesto:contesto,p_piano:piano,p_righe:righe}]]);
});
for(const code of ['PT409','40001','40P01'])test('conflitto riconoscibile e riprovabile: '+code,async()=>{
 await assert.rejects(salvaGenerazione({rpc:async()=>({error:{code,message:'conflitto'}})},'u',{}, {},[]),e=>e.status===409&&e.code==='contesto_generazione_modificato');
});
test('errore di inserimento propagato senza cancellare piani per compensarlo',async()=>{
 await assert.rejects(salvaGenerazione({rpc:async()=>({error:{code:'23503',message:'riga non valida'}}),from:()=>assert.fail('Cancellazione compensativa vietata')},'u',{}, {},[]),/salvataggio generazione: riga non valida/);
});
for(const data of [null,{}, {id:'p',righe:2},{id:null,righe:1}])test('risposta incompleta non dichiarata come successo: '+JSON.stringify(data),async()=>{
 await assert.rejects(salvaGenerazione({rpc:async()=>({data,error:null})},'u',{}, {},[{}]),/salvataggio generazione non confermato/);
});

for(const code of ['57014','55P03'])test('attesa database scaduta restituisce errore temporaneo: '+code,async()=>{
 await assert.rejects(salvaGenerazione({rpc:async()=>({error:{code,message:'attesa scaduta'}})},'u',{}, {},[]),e=>e.status===503&&e.code==='salvataggio_generazione_temporaneo');
});

test('catalogo cambiato nel commit: conflitto distinto dalle scelte personali',async()=>{
 await assert.rejects(salvaGenerazione({rpc:async()=>({error:{code:'PT410',message:'catalogo cambiato'}})},'u',{}, {},[]),e=>e.status===409&&e.code==='catalogo_modificato');
});
test('versione del catalogo arretrata non puo essere usata con una cache successiva',async()=>{
 const {registraCatalogo}=require('./contesto-catalogo'),id=require('node:crypto').randomUUID(),client={rpc:async()=>({data:{versione:'1',catalogo_id:id,catalogo_versione:'1'},error:null})};
 registraCatalogo(client,{catalogo_id:id,catalogo_versione:'2'});await assert.rejects(caricaContestoGenerazione(client,'u'),e=>e.status===409&&e.code==='catalogo_modificato');
});
