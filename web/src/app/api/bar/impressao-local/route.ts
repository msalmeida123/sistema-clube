import {NextRequest,NextResponse} from 'next/server'
import {autorizarImpressao} from '@/lib/bar-impressao-auth'
import {conteudoLocal} from '@/lib/impressao-local'
export const dynamic='force-dynamic'
export async function GET(){
 const a=await autorizarImpressao(true);if(!a.db)return NextResponse.json({error:'Sem permissão'},{status:a.status})
 const {data:config}=await a.db.from('impressao_local_config').select('cozinha,balcao,papel,protocolo,cortar,automatico,impressoras,ultima_conexao').eq('id',true).maybeSingle()
 const {data:fila}=await a.db.from('impressao_local_fila').select('id,destino,impressora,status,erro,criado_em,pedido_id').order('criado_em',{ascending:false}).limit(15)
 return NextResponse.json({config,fila:fila||[]},{headers:{'Cache-Control':'no-store'}})
}
export async function PUT(req:NextRequest){
 const a=await autorizarImpressao(true);if(!a.db)return NextResponse.json({error:'Sem permissão'},{status:a.status})
 let b:any;try{b=await req.json()}catch{return NextResponse.json({error:'Dados inválidos'},{status:400})}
 const {data:c}=await a.db.from('impressao_local_config').select('impressoras').eq('id',true).single()
 const nomes=(c?.impressoras||[]).map((p:any)=>p.nome)
 if(![58,80].includes(b.papel)||!['texto','escpos'].includes(b.protocolo)||typeof b.cortar!=='boolean'||typeof b.automatico!=='boolean'||![b.cozinha,b.balcao].every(v=>typeof v==='string'&&(v===''||nomes.includes(v))))return NextResponse.json({error:'Selecione impressoras USB detectadas e o papel.'},{status:400})
 const {error}=await a.db.from('impressao_local_config').update({cozinha:b.cozinha,balcao:b.balcao,papel:b.papel,protocolo:b.protocolo,cortar:b.cortar,automatico:b.automatico}).eq('id',true)
 return NextResponse.json(error?{error:'Não foi possível salvar'}:{ok:true},{status:error?500:200})
}
export async function POST(req:NextRequest){
 let b:any;try{b=await req.json()}catch{return NextResponse.json({error:'Dados inválidos'},{status:400})}
 const a=await autorizarImpressao(b?.teste===true);if(!a.db)return NextResponse.json({error:'Sem permissão'},{status:a.status})
 const db=a.db;const {data:c}=await db.from('impressao_local_config').select('*').eq('id',true).single()
 if(!c)return NextResponse.json({error:'Instale o agente local de impressão.'},{status:503})
 if(!['cozinha','balcao','automatico'].includes(b?.destino))return NextResponse.json({error:'Destino inválido'},{status:400})
 if(b.destino==='automatico'&&!c.automatico)return NextResponse.json({mensagem:'Impressão automática desativada.'})
 let pedido:any
 if(b.teste===true){pedido={numero_pedido:0,mesa:'TESTE',cliente_nome:'TESTE - NAO PREPARAR',created_at:new Date().toISOString(),subtotal:0,total:0,bar_itens_pedido:[{produto_nome:'TESTE DE IMPRESSAO USB',quantidade:1,preco_unitario:0,subtotal:0,enviar_cozinha:true}]}}
 else{
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.pedido_id||''))return NextResponse.json({error:'Pedido inválido'},{status:400})
  const r=await db.from('bar_pedidos').select('*,bar_itens_pedido(*),bar_pagamentos(*)').eq('id',b.pedido_id).single();pedido=r.data
  if(!pedido||pedido.status!=='pago')return NextResponse.json({error:'Finalize o pagamento antes de imprimir.'},{status:409})
 }
 const destinos=b.destino==='automatico'?['balcao','cozinha'].filter(d=>c[d]&&(d!=='cozinha'||pedido.bar_itens_pedido?.some((i:any)=>i.enviar_cozinha))):[b.destino]
 const ids=[]
 for(const destino of destinos){
  if(!c[destino])return NextResponse.json({error:`Configure a impressora do destino ${destino}.`},{status:409})
  let bytes;try{bytes=conteudoLocal(c,pedido,destino,b.reimpressao===true)}catch(e:any){return NextResponse.json({error:e.message},{status:422})}
  const {data,error}=await db.from('impressao_local_fila').insert({pedido_id:b.teste===true?null:pedido.id,destino,impressora:c[destino],conteudo:bytes.toString('base64'),reimpressao:b.reimpressao===true,operador_id:a.user!.id}).select('id').single()
  if(error&&error.code!=='23505')return NextResponse.json({error:'Não foi possível registrar a impressão. Confira a fila antes de repetir.'},{status:500})
  if(data)ids.push(data.id)
 }
 return NextResponse.json({ids,mensagem:ids.length?'Impressão registrada na fila USB. Confira o papel.':'Nenhuma nova via enviada. Confira a fila; para outra via, use Reimprimir.'})
}
