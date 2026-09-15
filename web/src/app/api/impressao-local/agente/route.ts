import {NextRequest,NextResponse} from 'next/server'
import {createHash,timingSafeEqual} from 'node:crypto'
import {bancoImpressao} from '@/lib/impressao-local'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function POST(req:NextRequest){
 const db=bancoImpressao();const {data:c}=await db.from('impressao_local_config').select('token_hash').eq('id',true).single()
 const token=req.headers.get('authorization')?.replace(/^Bearer /,'')||''
 const hash=createHash('sha256').update(token).digest('hex')
 if(!c?.token_hash||c.token_hash.length!==64||!timingSafeEqual(Buffer.from(hash),Buffer.from(c.token_hash)))return NextResponse.json({error:'Agente não autorizado'},{status:401})
 let b:any;try{b=await req.json()}catch{return NextResponse.json({error:'Dados inválidos'},{status:400})}
 if(b?.acao==='sincronizar'){
  if(!Array.isArray(b.impressoras)||b.impressoras.length>30||b.impressoras.some((p:any)=>typeof p.nome!=='string'||p.nome.length>200||typeof p.porta!=='string'||!/^USB\d+$/i.test(p.porta)))return NextResponse.json({error:'Lista inválida'},{status:400})
  const {error}=await db.from('impressao_local_config').update({impressoras:b.impressoras.map((p:any)=>({nome:p.nome,porta:p.porta})),ultima_conexao:new Date().toISOString()}).eq('id',true)
  return NextResponse.json({ok:!error},{status:error?500:200})
 }
 if(b?.acao==='obter'){
  await db.from('impressao_local_fila').update({status:'incerto',erro:'Agente não confirmou. Confira a impressora antes de reimprimir.'}).eq('status','processando').lt('iniciado_em',new Date(Date.now()-300000).toISOString())
  const {data,error}=await db.rpc('impressao_local_obter');return NextResponse.json(error?{error:'Falha na fila'}:{trabalho:data?.[0]||null},{status:error?500:200,headers:{'Cache-Control':'no-store'}})
 }
 if(b?.acao==='concluir'&&/^[0-9a-f-]{36}$/i.test(b.id||'')&&['enviado','incerto'].includes(b.status)){
  const {error}=await db.from('impressao_local_fila').update({status:b.status,erro:typeof b.erro==='string'?b.erro.slice(0,300):null,concluido_em:new Date().toISOString()}).eq('id',b.id).eq('status','processando')
  return NextResponse.json({ok:!error},{status:error?500:200})
 }
 return NextResponse.json({error:'Operação inválida'},{status:400})
}
