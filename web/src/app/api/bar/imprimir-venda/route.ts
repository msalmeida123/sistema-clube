import {NextRequest, NextResponse} from 'next/server'
import {randomUUID} from 'node:crypto'
import {autorizarImpressao} from '@/lib/bar-impressao-auth'
import {POST as imprimirRede} from '../imprimir/route'
import {POST as imprimirUSB} from '../impressao-local/route'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
 const auth = await autorizarImpressao()
 if (!auth.db) return NextResponse.json({error:'Sem permissão'}, {status:auth.status})
 let body
 try { body = await req.json() } catch { return NextResponse.json({error:'Dados inválidos'}, {status:400}) }
 const {pedido_id, destino, reimpressao = false} = body || {}
 if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pedido_id || '') || !['cozinha','balcao','automatico'].includes(destino) || typeof reimpressao !== 'boolean') return NextResponse.json({error:'Pedido inválido'}, {status:400})
 const subRequest = (dados: object) => new NextRequest(req.url, {method:'POST', headers:req.headers, body:JSON.stringify(dados)})
 if (destino === 'balcao') return imprimirUSB(subRequest({pedido_id,destino,reimpressao}))
 const {data:rede,error} = await auth.db.from('bar_impressora').select('ativo').eq('id','cozinha').maybeSingle()
 if (error) return NextResponse.json({error:'Não foi possível consultar a impressora da cozinha.'}, {status:503})
 if (!rede?.ativo) return imprimirUSB(subRequest({pedido_id,destino,reimpressao}))
 const enviarCozinha = () => imprimirRede(subRequest({pedido_id, reimpressao, id:reimpressao ? randomUUID() : pedido_id}))
 if (destino === 'cozinha') return enviarCozinha()
 const {data:pedido,error:pedidoError} = await auth.db.from('bar_pedidos').select('status,bar_itens_pedido(enviar_cozinha)').eq('id',pedido_id).single()
 if (pedidoError || pedido?.status !== 'pago') return NextResponse.json({error:'Pedido pago não encontrado.'}, {status:409})
 const {data:usb,error:usbError} = await auth.db.from('impressao_local_config').select('automatico,balcao').eq('id',true).maybeSingle()
 const mensagens: string[] = []
 let falhou = false
 async function registrar(nome: string, enviar: () => Promise<Response>) {
  try { const r = await enviar(); const d = await r.json(); mensagens.push(`${nome}: ${d.error || d.mensagem}`); if (!r.ok) falhou = true }
  catch { falhou = true; mensagens.push(`${nome}: não foi possível confirmar o envio. Confira a impressora antes de repetir.`) }
 }
 if (pedido.bar_itens_pedido?.some((item: {enviar_cozinha:boolean}) => item.enviar_cozinha)) await registrar('Cozinha (rede)', enviarCozinha)
 if (usbError) { falhou = true; mensagens.push('Balcão: não foi possível consultar a configuração USB.') }
 else if (usb?.automatico && usb.balcao) await registrar('Balcão (USB)', () => imprimirUSB(subRequest({pedido_id,destino:'balcao',reimpressao})))
 const mensagem = mensagens.join(' ') || 'Nenhuma impressão automática configurada para os itens deste pedido.'
 return NextResponse.json(falhou ? {error:mensagem} : {mensagem}, {status:falhou ? 502 : 200})
}
