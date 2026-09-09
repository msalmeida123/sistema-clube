import { NextRequest, NextResponse } from 'next/server'
import { autorizarImpressao } from '@/lib/bar-impressao-auth'
import { validarImpressora, bytesComanda, enviarBytes } from '@/lib/impressora-rede'
export const runtime = 'nodejs'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  let body
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Pedido inválido' }, { status:400 }) }
  const teste = body?.teste === true
  const auth = await autorizarImpressao(teste)
  if (auth.status !== 200) return NextResponse.json({ error:'Sem permissão' }, { status:auth.status })
  const db = auth.db!
  const { data: config, error: configError } = await db.from('bar_impressora').select('*').eq('id','cozinha').single()
  if (configError || !config?.ativo) return NextResponse.json({ error:'Configure e ative a impressora em Impressora da Cozinha.' }, { status:503 })
  let validada
  try { validada = validarImpressora(config) } catch { return NextResponse.json({ error:'Configuração da impressora inválida' }, { status:503 }) }
  let bytes: Buffer
  if (teste) bytes = bytesComanda(validada)
  else {
    if (!uuid.test(body?.pedido_id || '') || !uuid.test(body?.id || '') || typeof body?.reimpressao !== 'boolean') return NextResponse.json({ error:'Pedido de impressão inválido' }, { status:400 })
    const { data: pedido, error } = await db.from('bar_pedidos').select('*, bar_itens_pedido(*)').eq('id',body.pedido_id).single()
    if (error || !pedido) return NextResponse.json({ error:'Pedido não encontrado' }, { status:404 })
    if (pedido.status !== 'pago') return NextResponse.json({ error:'Somente pedidos pagos podem ser enviados' }, { status:409 })
    try { bytes = bytesComanda(validada, pedido, body.reimpressao) } catch (e: any) { return NextResponse.json({ error:e.message }, { status:422 }) }
    const { error: reserva } = await db.from('bar_impressoes').insert({ id:body.id, pedido_id:pedido.id, reimpressao:body.reimpressao, operador_auth_id:auth.user!.id })
    if (reserva) return NextResponse.json({ error:reserva.code === '23505' ? 'Envio já registrado. Confira a cozinha; para outra via, use Reimprimir no histórico.' : 'Não foi possível registrar a impressão. Nada foi enviado.' }, { status:409 })
  }
  try {
    await enviarBytes(validada.ip, validada.porta, bytes)
  } catch (e: any) {
    if (!teste) await db.from('bar_impressoes').update({ status:'incerto' }).eq('id',body.id)
    return NextResponse.json({ error:e.message }, { status:502 })
  }
  if (!teste) {
    const { error } = await db.from('bar_impressoes').update({ status:'enviado' }).eq('id',body.id)
    if (error) return NextResponse.json({ error:'Dados enviados, mas não foi possível atualizar o registro. Confira a cozinha antes de reimprimir.' }, { status:502 })
  }
  return NextResponse.json({ sucesso:true, mensagem:'Dados enviados à impressora. Confira a saída do papel.' })
}
