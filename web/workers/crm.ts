import { createClient } from '@supabase/supabase-js'
import { Worker } from 'bullmq'
import { getCrmQueue, QUEUE_NAME, redisConnection } from '../src/lib/whatsapp/queue'
import { getProviderForConversation } from '../src/lib/whatsapp/factory'

const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})
const queue=getCrmQueue()
const interval=Number(process.env.CRM_SEND_INTERVAL_MS || 3000)
if(!Number.isFinite(interval) || interval<1000) throw Error('CRM_SEND_INTERVAL_MS deve ser >= 1000')
let stopping=false
async function status(id:string,value:string,error?:string,messageId?:string) {
 const a=await db.from('crm_fila').update({status:value,erro:error||null,provider_message_id:messageId||null,updated_at:new Date().toISOString()}).eq('id',id)
 if(a.error) throw a.error
 const b=await db.from('mensagens_whatsapp').update({status:value,message_id:messageId||null}).eq('id',id)
 if(b.error) throw b.error
}
async function processar(id:string) {
 const {data:row,error}=await db.from('crm_fila').update({status:'enviando',updated_at:new Date().toISOString()}).eq('id',id).eq('status','pendente').select('*').maybeSingle()
 if(error) throw error
 if(!row) return // Uma entrega já iniciada nunca é repetida após crash/reprocessamento.
 try {
  const {data:c,error:ce}=await db.from('conversas_whatsapp').select('telefone,setor_id').eq('id',row.conversa_id).single()
  if(ce||!c) { await status(id,'falhou','Conversa indisponível'); return }
  if(row.usuario_id) {
  const {data:u}=await db.from('usuarios').select('id,ativo,is_admin').eq('auth_id',row.usuario_id).maybeSingle()
  if(!u?.ativo) { await status(id,'falhou','Usuário sem acesso'); return }
  if(!u.is_admin) {
   let query=db.from('usuarios_setores').select('id').eq('usuario_id',u.id)
   if(c.setor_id) query=query.eq('setor_id',c.setor_id)
   const {data:members,error:me}=await query.limit(1)
   if(me||!members?.length){await status(id,'falhou','Acesso ao setor removido');return}
  }
  }
  const provider=await getProviderForConversation(row.conversa_id)
  if(!provider?.config.ativo) { await status(id,'falhou','Configure um provedor WhatsApp ativo'); return }
  await db.from('mensagens_whatsapp').update({status:'enviando'}).eq('id',id)
  const result=await provider.sendMessage({...row.payload,to:c.telefone})
  // Os adaptadores atuais não distinguem timeout de rejeição. Não repetir automaticamente.
  await status(id,result.success?'enviada':'incerto',result.success?undefined:'Sem confirmação do provedor; confira antes de reenviar',result.messageId)
 } catch {
  await status(id,'incerto','Processamento interrompido; confira antes de reenviar')
 }
}
const worker=new Worker(QUEUE_NAME,job=>processar(job.data.id),{connection:{...redisConnection(),maxRetriesPerRequest:null},concurrency:1,limiter:{max:1,duration:interval}})
worker.on('error',()=>console.error('Worker CRM: conexão indisponível'))
worker.on('failed',job=>console.error('Worker CRM: tarefa interrompida',job?.id))
async function recuperar() {
 const {data,error}=await db.from('crm_fila').select('id').eq('status','pendente').order('created_at').limit(200)
 if(error) throw error
 for(const row of data||[]) {
  const existing=await queue.getJob(row.id)
  if(existing && ['failed','completed'].includes(await existing.getState())) await existing.remove()
  await queue.add('enviar',{id:row.id},{jobId:row.id})
 }
 const {data:interrupted}=await db.from('crm_fila').select('id').eq('status','enviando').lt('updated_at',new Date(Date.now()-120000).toISOString())
 for(const row of interrupted||[]) await status(row.id,'incerto','Worker interrompido; confira antes de reenviar')
 // Reconcilia histórico caso o processo tenha parado entre as duas atualizações.
 const {data:recent}=await db.from('crm_fila').select('id,status,provider_message_id').neq('status','pendente').order('updated_at',{ascending:false}).limit(200)
 for(const row of recent||[]) await db.from('mensagens_whatsapp').update({status:row.status,message_id:row.provider_message_id}).eq('id',row.id).in('status',['na_fila','enviando'])
}
async function loop(){
 await queue.setGlobalConcurrency(1)
 while(!stopping){try{await recuperar()}catch{console.error('Worker CRM: aguardando banco/Redis')} await new Promise(r=>setTimeout(r,5000))}
}
async function close(){stopping=true;await worker.close();await queue.close();process.exit(0)}
process.on('SIGTERM',()=>void close());process.on('SIGINT',()=>void close())
void loop().catch(()=>{console.error('Worker CRM: inicialização falhou');process.exit(1)})
