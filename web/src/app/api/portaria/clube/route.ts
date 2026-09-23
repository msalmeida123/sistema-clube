import {NextRequest,NextResponse} from 'next/server'
import {z} from 'zod'
import {acessoRota} from '@/lib/supabase/acesso-rota'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {consultarPortariaClube} from '@/lib/portaria-clube'
export const dynamic='force-dynamic'
const schema=z.object({tipo:z.enum(['leitor','cpf','nome']),valor:z.string().trim().min(1).max(512),escolhida:z.string().uuid().optional()}).strict()
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin')
 const site=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin
 if(origin!==site)return NextResponse.json({error:'Origem não permitida.'},{status:403})
 const acesso=await acessoRota('portaria')
 if(!acesso)return NextResponse.json({error:'Sem permissão para a Portaria Clube. Entre novamente ou solicite acesso.'},{status:403})
 let body
 try{body=schema.parse(await req.json())}catch{return NextResponse.json({error:'Consulta inválida.'},{status:400})}
 try{
  const podeReceber=Boolean(await acessoRota('financeiro','editar'))
  const resultado=await consultarPortariaClube(servicoAuditado(acesso.user.id),body,podeReceber)
  return NextResponse.json(resultado,{headers:{'Cache-Control':'no-store'}})
 }catch{return NextResponse.json({error:'Não foi possível verificar ou registrar a entrada. Tente novamente ou procure a secretaria.'},{status:503})}
}
