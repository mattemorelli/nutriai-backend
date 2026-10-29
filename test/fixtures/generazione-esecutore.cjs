const {parentPort,workerData}=require('node:worker_threads');
parentPort.on('message',lavoro=>{
  if(lavoro.opzioni?.modalita==='calcolo'){
    Atomics.store(new Int32Array(workerData),0,1);
    const fine=Date.now()+500;while(Date.now()<fine)Math.sqrt(2026);
  }
  parentPort.postMessage({id:lavoro.id,ok:true,risultato:{userId:lavoro.userId,seed:lavoro.seed,opzioni:lavoro.opzioni}});
});
