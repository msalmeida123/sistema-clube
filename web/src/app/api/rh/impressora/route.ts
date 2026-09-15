import {NextRequest,NextResponse} from 'next/server'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {cookies} from 'next/headers'
import {verificarPermissao} from '@/lib/usuario-atual'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {validarImpressoraRH,testarImpressoraRH} from '@/lib/rh-impressora-rede'
export const runtime='nodejs'
export const dynamic='force-dynamic'
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})
async function autorizar(){
 const auth=await createRouteHandlerClient({cookies});const {data:{user}}=await auth.auth.getUser()
 if(!user)return {status:401}
 const p=await verificarPermissao(auth,user.id,'rh')
 if(!p.autorizado||!p.isAdmin)return {status:403}
 return {status:200,db:servicoAuditado(user.id)}
}
export async function GET(){
 const a=await autorizar();if(!a.db)return json({error:'Acesso restrito ao administrador do RH.'},a.status)
 const {data,error}=await a.db.from('rh_impressora').select('*').eq('id',true).single()
 return error?json({error:'Não foi possível carregar a impressora do RH.'},500):json(data)
}
export async function PUT(req:NextRequest){
 const a=await autorizar();if(!a.db)return json({error:'Acesso restrito ao administrador do RH.'},a.status)
 let config,versao
 try{const body=await req.json();config=validarImpressoraRH(body);versao=body.updated_at;if(typeof versao!=='string'||!Number.isFinite(Date.parse(versao)))throw Error('Recarregue a configuração antes de salvar.')}
 catch(e:any){return json({error:e.message||'Configuração inválida.'},400)}
 const {data,error}=await a.db.from('rh_impressora').update({...config,updated_at:new Date().toISOString()}).eq('id',true).eq('updated_at',versao).select('*').maybeSingle()
 if(error)return json({error:'Não foi possível salvar a impressora.'},500)
 return data?json(data):json({error:'A configuração foi alterada. Recarregue antes de salvar.'},409)
}
export async function POST(){
 const a=await autorizar();if(!a.db)return json({error:'Acesso restrito ao administrador do RH.'},a.status)
 const {data,error}=await a.db.from('rh_impressora').select('*').eq('id',true).single()
 if(error)return json({error:'Não foi possível carregar a impressora.'},500)
 if(!data.ip)return json({error:'Salve o IP da impressora antes de testar.'},400)
 try{await testarImpressoraRH(data);return json({mensagem:'Porta de rede acessível pelo servidor. O teste não envia papel nem confirma o modelo da impressora.'})}
 catch(e:any){return json({error:e.message},502)}
}
