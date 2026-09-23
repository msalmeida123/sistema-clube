import {NextRequest} from 'next/server'
import {appDb} from '@/lib/associado-app'
import {tokenAsaasValido} from '@/lib/asaas-sandbox'
import {configGestao,respostaGestao,erroGestao,sincronizarCobranca} from '@/lib/gestao-licencas/servidor'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(req:NextRequest){try{
 const cfg=await configGestao()
 if(!tokenAsaasValido(req.headers.get('asaas-access-token')||'',cfg.webhookToken))return respostaGestao({error:'Não autorizado.'},401)
 const raw=await req.text();if(raw.length>100000)return respostaGestao({error:'Evento muito grande.'},413)
 let e;try{e=JSON.parse(raw)}catch{return respostaGestao({error:'Evento inválido.'},400)}
 if(typeof e.id!=='string'||e.id.length>200||typeof e.event!=='string'||e.event.length>100||!/^pay_[a-zA-Z0-9]+$/.test(e.payment?.id||''))return respostaGestao({error:'Evento inválido.'},400)
 if(!e.event.startsWith('PAYMENT_'))return respostaGestao({ignored:true})
 const db=appDb()
 const {data:c,error}=await db.from('gestao_cobrancas').select('*').eq('asaas_id',e.payment.id).eq('ambiente',cfg.ambiente).maybeSingle()
 if(error)throw error
 if(!c){
  // A notificação pode chegar antes da resposta da emissão ser persistida.
  // Nunca aceitar o corpo como prova; sinalizar retry para referências locais.
  if(typeof e.payment.externalReference==='string'&&e.payment.externalReference.startsWith('licenca:'))return respostaGestao({error:'Cobrança em conciliação.'},503)
  return respostaGestao({ignored:true})
 }
 await sincronizarCobranca(db,cfg,c,e.id,e.event)
 return respostaGestao({received:true})
 }catch(e){return erroGestao(e)}}
