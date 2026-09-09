import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import type { SendMessagePayload, SendMessageResult } from './provider'

export async function enfileirarAutomatico(conversaId:string,payload:SendMessagePayload):Promise<SendMessageResult> {
 const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})
 const id=randomUUID()
 const {error}=await db.rpc('crm_enfileirar_automatico',{p_id:id,p_conversa:conversaId,p_payload:payload})
 if(error) return {success:false,error:'Não foi possível salvar a resposta na fila'}
 return {success:true,messageId:id}
}
