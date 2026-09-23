import {NextRequest,NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {buscarUsuarioAtual} from '@/lib/usuario-atual'
import {permiteRota} from '@/lib/permissao-rota'
import {dadosSetor,setoresRelatorio} from '@/lib/relatorios-setores-servidor'
export async function GET(req:NextRequest){try{
 const db=await createRouteHandlerClient({cookies}),{data:{user}}=await db.auth.getUser()
 if(!user)return NextResponse.json({error:'Entre novamente no sistema.'},{status:401})
 const usuario=await buscarUsuarioAtual<any>(db,user.id,'ativo,is_admin,clube_id')
 if(!usuario?.ativo||!usuario.clube_id)return NextResponse.json({error:'Sem permissão para este relatório.'},{status:403})
 if(!usuario.is_admin){const {data,error}=await db.rpc('minhas_permissoes');if(error||!permiteRota(data||[],'/dashboard/relatorios-setores'))return NextResponse.json({error:'Sem permissão para este relatório.'},{status:403})}
 const p=req.nextUrl.searchParams,setor=p.get('setor')||'',inicio=p.get('inicio')||'',fim=p.get('fim')||''
 if(!setoresRelatorio.includes(setor as any)||!/^\d{4}-\d{2}-\d{2}$/.test(inicio)||!/^\d{4}-\d{2}-\d{2}$/.test(fim)||inicio>fim||!Number.isFinite(Date.parse(inicio))||!Number.isFinite(Date.parse(fim)))return NextResponse.json({error:'Informe um período válido.'},{status:400})
 const dados=await dadosSetor(db,usuario.clube_id,setor,inicio+'T00:00:00-03:00',fim+'T23:59:59.999-03:00')
 return NextResponse.json(dados,{headers:{'Cache-Control':'no-store'}})
 }catch(e){console.error('Falha no relatório por setor',e);return NextResponse.json({error:'Não foi possível carregar o relatório. Tente novamente.'},{status:503})}}
