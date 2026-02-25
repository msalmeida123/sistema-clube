'use client'

import { useState } from 'react'
import { ClipboardList, Search, Eye, XCircle, Receipt, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBarPedidos, useEmitirNFCe } from '@/modules/bar/hooks/useBar'
import type { StatusPedido, BarPedido } from '@/modules/bar/types'

const STATUS_LABEL: Record<StatusPedido, string> = {
  aberto: 'Aberto',
  aguardando_pagamento: 'Aguardando',
  pago: 'Pago',
  cancelado: 'Cancelado'
}

const STATUS_COR: Record<StatusPedido, string> = {
  aberto: 'bg-yellow-100 text-yellow-700',
  aguardando_pagamento: 'bg-orange-100 text-orange-700',
  pago: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-500'
}

const FORMAS_LABEL: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão Crédito',
  cartao_debito: 'Cartão Débito',
  pix: 'PIX',
  carteirinha: 'Carteirinha',
  cortesia: 'Cortesia'
}

export default function BarPedidosPage() {
  const [filtroStatus, setFiltroStatus] = useState<StatusPedido | ''>('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [detalhe, setDetalhe] = useState<BarPedido | null>(null)
  const [cpfNFCe, setCpfNFCe] = useState('')

  const { data: pedidos = [], isLoading } = useBarPedidos({
    status: filtroStatus || undefined,
    data_inicio: dataInicio || undefined,
    data_fim: dataFim || undefined
  })

  const emitirNFCe = useEmitirNFCe()

  const totalVendas = pedidos.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.total, 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ClipboardList size={24} /> Pedidos do Bar
        </h1>
        <p className="text-gray-500 text-sm mt-1">Histórico de vendas</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value as StatusPedido | '')}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_LABEL) as StatusPedido[]).map(s => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-40" />
        <span className="text-gray-400 text-sm">até</span>
        <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-40" />
        <div className="ml-auto text-sm text-gray-500">
          {pedidos.filter(p => p.status === 'pago').length} vendas •{' '}
          <span className="font-bold text-green-600">R$ {totalVendas.toFixed(2)}</span>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">#</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Associado</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Pagamento</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Total</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Data</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Carregando...</td></tr>
            ) : pedidos.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Nenhum pedido encontrado</td></tr>
            ) : pedidos.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-500">#{p.numero_pedido}</td>
                <td className="px-4 py-3 text-gray-700">{p.associado_nome || <span className="text-gray-300">—</span>}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {p.pagamentos?.map(pg => FORMAS_LABEL[pg.forma_pagamento] || pg.forma_pagamento).join(' + ') || '—'}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-800">R$ {p.total.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COR[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(p.created_at).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <Button variant="outline" size="sm" onClick={() => setDetalhe(p)}>
                    <Eye size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Pedido #{detalhe.numero_pedido}</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COR[detalhe.status]}`}>
                {STATUS_LABEL[detalhe.status]}
              </span>
            </div>
            <div className="p-6 space-y-4">
              {detalhe.associado_nome && (
                <p className="text-sm text-gray-600">Associado: <span className="font-medium">{detalhe.associado_nome}</span></p>
              )}
              <p className="text-sm text-gray-400">{new Date(detalhe.created_at).toLocaleString('pt-BR')}</p>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Itens</h3>
                <table className="w-full text-sm">
                  <tbody className="divide-y">
                    {(detalhe.itens ?? []).map((item, i) => (
                      <tr key={i}>
                        <td className="py-2">{item.produto_nome}</td>
                        <td className="py-2 text-right text-gray-500">{item.quantidade}x</td>
                        <td className="py-2 text-right font-medium">R$ {item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>R$ {detalhe.subtotal.toFixed(2)}</span></div>
                {detalhe.desconto > 0 && <div className="flex justify-between text-gray-500"><span>Desconto</span><span>-R$ {detalhe.desconto.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>R$ {detalhe.total.toFixed(2)}</span></div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Pagamentos</h3>
                {(detalhe.pagamentos ?? []).map((p, i) => (
                  <div key={i} className="flex justify-between text-sm text-gray-600 py-1">
                    <span>{FORMAS_LABEL[p.forma_pagamento] || p.forma_pagamento}</span>
                    <span className="font-medium">R$ {p.valor.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {detalhe.status === 'pago' && (
                <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-blue-800 flex items-center gap-2"><Receipt size={16} /> Emitir NFC-e</h3>
                  <Input
                    placeholder="CPF/CNPJ do consumidor (opcional)"
                    value={cpfNFCe}
                    onChange={e => setCpfNFCe(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    onClick={async () => {
                      await emitirNFCe.mutateAsync({ pedidoId: detalhe.id, cpfCnpj: cpfNFCe || undefined })
                      setDetalhe(null)
                    }}
                    disabled={emitirNFCe.isPending}
                  >
                    {emitirNFCe.isPending ? 'Emitindo...' : 'Emitir NFC-e'}
                  </Button>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDetalhe(null)}>Fechar</Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(`/api/bar/comprovante?pedido_id=${detalhe.id}`, '_blank')}
              >
                <Printer size={16} />
                Comprovante
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
