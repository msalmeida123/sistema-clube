import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const entrada = z.object({
 requestId: z.string().uuid(), conversaId: z.string().uuid(),
 text: z.string().max(4000).optional(), messageType: z.enum(['text','image','video','audio','document']).default('text'),
 mediaUrl: z.string().url().max(4000).optional(), fileName: z.string().max(255).optional(), caption: z.string().max(1000).optional()
}).superRefine((v,ctx)=>{
 if(v.messageType==='text' ? !v.text?.trim() : !v.mediaUrl?.startsWith('https://') && !v.mediaUrl?.startsWith('http://'))
 ctx.addIssue({code:'custom',message:'Informe a mensagem ou o endereço do anexo'})
})
export async function POST(request: Request) {
 try {
  const parsed=entrada.safeParse(await request.json())
  if(!parsed.success) return NextResponse.json({error:'Mensagem inválida'},{status:400})
  const supabase=createRouteHandlerClient({cookies})
  const {data:{user}}=await supabase.auth.getUser()
  if(!user) return NextResponse.json({error:'Não autenticado'},{status:401})
  const {requestId,conversaId,...payload}=parsed.data
  const {data,error}=await supabase.rpc('crm_enfileirar',{p_id:requestId,p_conversa:conversaId,p_payload:payload})
  if(error) return NextResponse.json({error:'Não foi possível incluir na fila. Confira seu acesso à conversa.'},{status:403})
  // O banco é a origem durável. O worker recupera pendências mesmo se Redis estiver fora.
  return NextResponse.json({success:true,queued:true,messageId:data},{status:202})
 } catch { return NextResponse.json({error:'Não foi possível incluir a mensagem na fila'},{status:503}) }
}
