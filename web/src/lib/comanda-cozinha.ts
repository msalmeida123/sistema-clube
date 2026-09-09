import { escapeHtml } from './security'

interface PedidoComanda {
  numero_pedido: number
  cliente_nome?: string
  mesa?: string
  observacao?: string
  created_at: string
  bar_itens_pedido: { enviar_cozinha?: boolean; quantidade: number; produto_nome: string }[]
}

export function gerarComandaCozinha(pedido: PedidoComanda): string {
  const itens = pedido.bar_itens_pedido.filter(i => i.enviar_cozinha === true)
  if (!itens.length) throw new Error('Este pedido não contém itens para a cozinha')
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Cozinha #${Number(pedido.numero_pedido)}</title>
  <style>@page{size:80mm auto;margin:4mm}body{font:16px monospace;max-width:72mm;margin:0 auto;color:#000;background:#fff;overflow-wrap:anywhere}h1{font-size:24px}li{margin:12px 0}ul{padding-left:24px}.obs{white-space:pre-wrap;border-top:1px dashed;padding-top:10px}@media print{button,.aviso{display:none}}</style></head><body>
  <button onclick="window.print()">Imprimir na cozinha</button><p class="aviso">Selecione a impressora da cozinha. Reimpressões não representam um novo pedido.</p>
  <h1>COZINHA</h1><h2>Mesa: ${escapeHtml(pedido.mesa || 'Balcão')}</h2>
  <p>Pedido #${Number(pedido.numero_pedido)}</p><p>Cliente: ${escapeHtml(pedido.cliente_nome || 'Consumidor final')}</p>
  <p>${escapeHtml(new Date(pedido.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))}</p>
  <ul>${itens.map(i => `<li><strong>${Number(i.quantidade)}x</strong> ${escapeHtml(i.produto_nome)}</li>`).join('')}</ul>
  ${pedido.observacao ? `<p class="obs">Observações: ${escapeHtml(pedido.observacao)}</p>` : ''}
  <p>COMANDA DE PREPARO • NÃO FISCAL</p></body></html>`
}
