import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { escapeHtml } from '@/lib/security'
import { verificarPermissao } from '@/lib/usuario-atual'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // Este handler usa a service role key (ignora RLS): exige sessão válida e
    // permissão do módulo, senão qualquer logado leria o pedido de qualquer um.
    const auth = createRouteHandlerClient({ cookies })
    const { data: { user } } = await auth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { autorizado } = await verificarPermissao(auth, user.id, 'bar')
    if (!autorizado) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const pedidoId = req.nextUrl.searchParams.get('pedido_id')
    if (!pedidoId) return NextResponse.json({ error: 'pedido_id obrigatório' }, { status: 400 })

    // Busca pedido com itens e pagamentos
    const { data: pedido, error } = await supabase
      .from('bar_pedidos')
      .select(`
        *,
        bar_itens_pedido (*),
        bar_pagamentos (*)
      `)
      .eq('id', pedidoId)
      .single()

    if (error || !pedido) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Busca config do clube para nome
    const { data: configNfce } = await supabase
      .from('bar_config_nfce')
      .select('nome_fantasia, razao_social, cnpj_emitente')
      .limit(1)
      .maybeSingle()

    // Todo texto vindo do banco é escapado antes de entrar no HTML (o comprovante
    // é servido como text/html na própria origem da aplicação).
    const nomeEstabelecimento = escapeHtml(
      configNfce?.nome_fantasia || configNfce?.razao_social || 'Bar / Restaurante'
    )
    const cnpj = escapeHtml(configNfce?.cnpj_emitente || '')

    // Gera HTML do comprovante (formato térmico 80mm)
    const itens = (pedido.bar_itens_pedido || []) as any[]
    const pagamentos = (pedido.bar_pagamentos || []) as any[]

    const formasLabel: Record<string, string> = {
      dinheiro: 'Dinheiro',
      cartao_credito: 'Cartão Crédito',
      cartao_debito: 'Cartão Débito',
      pix: 'PIX',
      carteirinha: 'Carteirinha',
      cortesia: 'Cortesia'
    }

    const fmt = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const dataFormatada = new Date(pedido.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    const itensHtml = itens.map(i => `
      <tr>
        <td style="text-align:left">${Number(i.quantidade)}x ${escapeHtml(i.nome_produto)}</td>
        <td style="text-align:right">${fmt(i.preco_unitario)}</td>
        <td style="text-align:right">${fmt(i.subtotal)}</td>
      </tr>
    `).join('')

    const pagamentosHtml = pagamentos.map((p: any) => `
      <tr>
        <td>${formasLabel[p.forma_pagamento] || escapeHtml(p.forma_pagamento)}</td>
        <td style="text-align:right">${fmt(p.valor)}</td>
      </tr>
      ${p.troco > 0 ? `<tr><td style="color:#666">  Troco</td><td style="text-align:right;color:#666">-${fmt(p.troco)}</td></tr>` : ''}
    `).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Comprovante #${escapeHtml(String(pedido.numero || pedido.id.slice(0, 8)))}</title>
<style>
  @media print {
    @page { margin: 0; size: 80mm auto; }
    body { margin: 0; }
    .no-print { display: none !important; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    width: 80mm;
    margin: 0 auto;
    padding: 4mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider {
    border-top: 1px dashed #000;
    margin: 6px 0;
  }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  .header { margin-bottom: 8px; }
  .header h2 { font-size: 14px; margin-bottom: 2px; }
  .total-line { font-size: 16px; font-weight: bold; }
  .footer { margin-top: 10px; font-size: 10px; color: #666; }
  .btn-print {
    display: block;
    width: 100%;
    padding: 12px;
    margin: 16px 0;
    background: #f59e0b;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
  }
  .btn-print:hover { background: #d97706; }
</style>
</head>
<body>
  <button class="btn-print no-print" onclick="window.print()">🖨️ Imprimir Comprovante</button>

  <div class="header center">
    <h2>${nomeEstabelecimento}</h2>
    ${cnpj ? `<div style="font-size:10px">CNPJ: ${cnpj}</div>` : ''}
    <div style="font-size:10px">COMPROVANTE NÃO FISCAL</div>
  </div>

  <div class="divider"></div>

  <table>
    <tr>
      <td>Pedido:</td>
      <td style="text-align:right"><strong>#${escapeHtml(String(pedido.numero || pedido.id.slice(0, 8).toUpperCase()))}</strong></td>
    </tr>
    <tr>
      <td>Data:</td>
      <td style="text-align:right">${dataFormatada}</td>
    </tr>
    ${pedido.associado_nome ? `<tr><td>Cliente:</td><td style="text-align:right">${escapeHtml(pedido.associado_nome)}</td></tr>` : ''}
  </table>

  <div class="divider"></div>

  <table>
    <tr style="font-weight:bold;border-bottom:1px solid #ccc">
      <td>Item</td>
      <td style="text-align:right">Unit.</td>
      <td style="text-align:right">Total</td>
    </tr>
    ${itensHtml}
  </table>

  <div class="divider"></div>

  ${pedido.desconto > 0 ? `
  <table>
    <tr><td>Subtotal</td><td style="text-align:right">${fmt(pedido.subtotal)}</td></tr>
    <tr><td>Desconto</td><td style="text-align:right">-${fmt(pedido.desconto)}</td></tr>
  </table>
  <div class="divider"></div>
  ` : ''}

  <table>
    <tr class="total-line">
      <td>TOTAL</td>
      <td style="text-align:right">R$ ${fmt(pedido.total)}</td>
    </tr>
  </table>

  <div class="divider"></div>

  <div style="font-weight:bold;margin-bottom:4px">Pagamento</div>
  <table>
    ${pagamentosHtml}
  </table>

  <div class="divider"></div>

  <div class="footer center">
    <p>Obrigado pela preferência!</p>
    <p>${dataFormatada}</p>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro interno' }, { status: 500 })
  }
}
