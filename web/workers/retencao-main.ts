import { createClient } from '@supabase/supabase-js'
import { executarRetencao } from './retencao'
import { getCrmQueue } from '../src/lib/whatsapp/queue'
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})
async function ciclo(){
 try {
  await executarRetencao(db)
  if(process.env.REDIS_URL) {
   const queue=getCrmQueue()
   await queue.clean(604800000,1000,'completed')
   await queue.clean(604800000,1000,'failed')
  }
  console.log('CRM: retenção diária concluída')
 }
 catch { console.error('CRM: retenção falhou; histórico não confirmado foi preservado') }
 setTimeout(()=>void ciclo(),86400000)
}
void ciclo()
