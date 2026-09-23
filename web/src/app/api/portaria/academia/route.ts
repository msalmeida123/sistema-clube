import {paginacao} from '@/lib/paginacao'
import {NextRequest,NextResponse} from 'next/server'
import {z} from 'zod'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {buscarAcademia,registrarAcademia,historicoAcademia} from '@/lib/portaria-academia'
export const dynamic='force-dynamic'
const schema=z.discriminatedUnion('acao',[
 z.object({acao:z.literal('buscar'),valor:z.string().trim().min(1).max(512)}).strict(),
 z.object({acao:z.literal('registrar'),associado_id:z.string().uuid(),tipo:z.enum(['entrada','saida'])}).strict()
])
const resposta=(data:object,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}})
export async function GET(req:Request){
 const acesso=await acessoRota('portaria_academia')
 if(!acesso)return resposta({error:'Sem permissão para a Portaria Academia.'},403)
 let pagina,limite;try{({pagina,limite}=paginacao(req.url))}catch{return resposta({error:'Paginação inválida.'},400)}
 try{return resposta(await historicoAcademia(servicoAuditado(acesso.user.id),pagina,limite))}catch{return resposta({error:'Não foi possível carregar os acessos da academia.'},503)}
}
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin)return resposta({error:'Origem não permitida.'},403)
 const acesso=await acessoRota('portaria_academia')
 if(!acesso)return resposta({error:'Sem permissão para a Portaria Academia.'},403)
 let body
 try{body=schema.parse(await req.json())}catch{return resposta({error:'Solicitação inválida.'},400)}
 try{
  const db=servicoAuditado(acesso.user.id)
  const result=body.acao==='buscar'?await buscarAcademia(db,body.valor,Boolean(await acessoRota('financeiro','editar'))):await registrarAcademia(db,body.associado_id,body.tipo)
  return resposta(result,'error' in result?409:200)
 }catch{return resposta({error:'Não foi possível consultar ou registrar o acesso. Tente novamente.'},503)}
}
