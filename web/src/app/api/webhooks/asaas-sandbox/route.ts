import {NextRequest,NextResponse} from 'next/server'
import {appDb} from '@/lib/associado-app'
import {configuracaoSandbox,tokenAsaasValido,consultarPagamentoSandbox,conferirPagamentoSandbox} from '@/lib/asaas-sandbox'
export const runtime='nodejs'
export const dynamic='force-dynamic'

/** Webhook exclusivo de homologação: jamais grava em mensalidades/portarias. */
export async function POST(req:NextRequest){
 let config
 try{config=await configuracaoSandbox()}catch{return NextResponse.json({error:'Indisponível'},{status:503})}
 if(!tokenAsaasValido(req.headers.get('asaas-access-token')||'',config.webhookToken))return NextResponse.json({error:'Não autorizado'},{status:401})
 let evento
 try{
  const raw=await req.text()
  if(Buffer.byteLength(raw)>100000)return new Response(null,{status:413})
  evento=JSON.parse(raw)
  if(typeof evento.id!=='string'||evento.id.length>200||typeof evento.event!=='string'||evento.event.length>100)throw Error()
 }catch{return NextResponse.json({error:'Evento inválido'},{status:400})}
 if(!['PAYMENT_RECEIVED','PAYMENT_REFUNDED','PAYMENT_DELETED','PAYMENT_OVERDUE','PAYMENT_CONFIRMED'].includes(evento.event))return NextResponse.json({ignored:true})
 if(typeof evento.payment?.id!=='string'||!/^pay_[a-zA-Z0-9]+$/.test(evento.payment.id))return NextResponse.json({error:'Cobrança inválida'},{status:400})
 try{
  const db=appDb()
  const {data:c,error}=await db.from('asaas_sandbox_cobrancas').select('id,referencia,cliente,valor').eq('id',evento.payment.id).maybeSingle()
  if(error)throw error
  if(!c)return NextResponse.json({ignored:true})
  // Consultar a conta de testes: o corpo do webhook não é prova de pagamento.
  const p=await consultarPagamentoSandbox(config.apiKey,c.id)
  const status=conferirPagamentoSandbox(p,c)
  const {error:falha}=await db.rpc('asaas_sandbox_confirmar',{p_evento:evento.id,p_tipo:evento.event,p_cobranca:c.id,p_status:status})
  if(falha)throw falha
  return NextResponse.json({received:true})
 }catch{return NextResponse.json({error:'Tente novamente'},{status:503})}
}
