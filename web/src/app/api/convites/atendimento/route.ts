import {NextRequest,NextResponse} from 'next/server'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {cookies} from 'next/headers'
import {verificarPermissao} from '@/lib/usuario-atual'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
export const dynamic='force-dynamic'
export async function POST(req:NextRequest){
 const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}})
 if(req.headers.get('origin')!==new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin)return json({error:'Origem não permitida.'},403)
 const auth=await createRouteHandlerClient({cookies});const {data:{user}}=await auth.auth.getUser()
 if(!user)return json({error:'Entre no sistema.'},401)
 let b:any
 try{b=await req.json()}catch{return json({error:'Dados inválidos.'},400)}
 if(!b||typeof b.qr!=='string'||!/^CONV-[A-Z0-9-]{1,100}$/i.test(b.qr.trim())||!['consultar','clube_entrada','exame','piscina_entrada','piscina_saida'].includes(b.acao))return json({error:'Leia o QR Code do convite.'},400)
 const codigos=b.acao==='consultar'?['portaria','portaria_piscina','exames']:b.acao==='exame'?['exames']:b.acao==='clube_entrada'?['portaria']:['portaria_piscina']
 let permitido=false
 for(const codigo of codigos){if((await verificarPermissao(auth,user.id,codigo)).autorizado){permitido=true;break}}
 if(!permitido)return json({error:'Sem permissão para esta operação.'},403)
 if(b.acao!=='consultar'&&(typeof b.requisicao!=='string'||! /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.requisicao)))return json({error:'Operação inválida.'},400)
 if(b.acao==='exame'&&(!['apto','inapto'].includes(b.resultado)||typeof b.medico!=='string'||b.medico.trim().length<2||b.medico.length>120||typeof b.crm!=='string'||b.crm.trim().length<2||b.crm.length>30))return json({error:'Informe resultado, médico e CRM.'},400)
 const {data,error}=await servicoAuditado(user.id).rpc('atender_convite',{p_qr:b.qr.trim().toUpperCase(),p_acao:b.acao,p_operador:user.id,p_requisicao:b.acao==='consultar'?null:b.requisicao,p_resultado:b.acao==='exame'?b.resultado:null,p_medico:b.acao==='exame'?b.medico:null,p_crm:b.acao==='exame'?b.crm:null})
 return error?json({error:error.code==='P0001'?error.message:'Não foi possível atender o convite.'},error.code==='P0001'?409:500):json(data)
}
