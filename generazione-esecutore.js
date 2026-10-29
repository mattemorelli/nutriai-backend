const {parentPort}=require('node:worker_threads');
if(!parentPort)throw new Error('Generation executor requires its worker thread.');
require('dotenv').config({path:require('node:path').join(__dirname,'.env'),quiet:true});
const {createClient}=require('@supabase/supabase-js');
const {generaESalva}=require('./genera');
const supabase=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY||process.env.SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
parentPort.on('message',async lavoro=>{
  try {
    const risultato=await generaESalva(supabase,lavoro.userId,lavoro.seed,lavoro.opzioni);
    parentPort.postMessage({id:lavoro.id,ok:true,risultato});
  } catch(e) {
    parentPort.postMessage({id:lavoro.id,ok:false,errore:{message:e.message,status:e.status,code:e.code}});
  }
});
