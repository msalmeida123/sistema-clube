import {NextRequest,NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {buscarUsuarioAtual} from '@/lib/usuario-atual'
import {permiteRota} from '@/lib/permissao-rota'
export async function GET(req:NextRequest){try{
 const db=await createRouteHandlerClient({cookies}),{data:{user}}=await db.auth.getUser()
 if(!user)return NextResponse.json({error:'Entre novamente no sistema.'},{status:401})
 const usuario=await buscarUsuarioAtual<any>(db,user.id,'ativo,is_admin,clube_id')
 const rota=req.nextUrl.searchParams.get('rota')||''
 if(!usuario?.ativo||!usuario.clube_id||!rota.startsWith('/dashboard'))return NextResponse.json({error:'Sem permissão para imprimir este relatório.'},{status:403})
 if(!usuario.is_admin){const {data,error}=await db.rpc('minhas_permissoes');if(error||!permiteRota(data||[],rota))return NextResponse.json({error:'Sem permissão para imprimir este relatório.'},{status:403})}
 const {data:clube}=await db.from('configuracao_clube').select('nome_clube,logo_url,cnpj').eq('id',usuario.clube_id).maybeSingle()
 return NextResponse.json({ok:true,clube},{headers:{'Cache-Control':'no-store'}})
 }catch(e){console.error('Autorização de impressão falhou',e);return NextResponse.json({error:'Não foi possível preparar a impressão.'},{status:503})}}
