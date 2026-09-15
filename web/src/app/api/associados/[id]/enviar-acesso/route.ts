import {NextRequest,NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {z} from 'zod'
import {fetchInterno} from '@/lib/supabase/fetch-interno'
import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import {buscarUsuarioAtual} from '@/lib/usuario-atual'
import {limite} from '@/lib/associado-app'
import {enviarAcessoAssociado} from '@/lib/enviar-acesso-associado'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(req:NextRequest,{params}: {params:Promise<{id:string}>}) {
  const origin=req.headers.get('origin')
  const expected=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin
  if(origin!==expected) return NextResponse.json({error:'Origem não permitida.'},{status:403})
  if(!z.string().uuid().safeParse((await params).id).success) return NextResponse.json({error:'Associado inválido.'},{status:400})
  const session=await createRouteHandlerClient({cookies},{options:{global:{fetch:fetchInterno}}})
  const {data:{user},error:authError}=await session.auth.getUser()
  if(authError||!user) return NextResponse.json({error:'Entre novamente no sistema.'},{status:401})
  const actor=await buscarUsuarioAtual(session,user.id,'is_admin,ativo')
  if(actor?.ativo!==true) return NextResponse.json({error:'Sem permissão.'},{status:403})
  if(!actor.is_admin) {
    const {data,error}=await session.rpc('sistema_pode',{codigo:'associados',acao:'editar'})
    if(error||data!==true) return NextResponse.json({error:'É necessário ter permissão para editar associados.'},{status:403})
  }
  const db=servicoAuditado(user.id)
  const {data:a,error}=await db.from('associados').select('id,email').eq('id',(await params).id).maybeSingle()
  if(error) return NextResponse.json({error:'Não foi possível consultar o associado.'},{status:500})
  if(!a) return NextResponse.json({error:'Associado não encontrado.'},{status:404})
  if(!a.email) return NextResponse.json({error:'Cadastre o e-mail do associado antes de enviar.'},{status:400})
  try {
    await limite(db,'enviar-acesso-usuario:'+user.id,20)
    await limite(db,'enviar-acesso-associado:'+a.id,5)
    await enviarAcessoAssociado(db,a)
    return NextResponse.json({ok:true,message:'Senha temporária enviada ao e-mail cadastrado. Validade: uma hora.'})
  } catch(e) {
    return NextResponse.json({error:e instanceof Error?e.message:'Não foi possível enviar o acesso.'},{status:400})
  }
}
