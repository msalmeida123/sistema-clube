'use client'

import { useState } from 'react'
import { Wallet, Plus, Search, ArrowUpCircle, ArrowDownCircle, CreditCard, Banknote, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useRecarregarCarteirinha, useCarteirinhaMovimentos } from '@/modules/bar/hooks/useBar'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { FormasPagamentoBar } from '@/modules/bar/types'

const supabase = createClient()

export default function CarteirinhaPage() {
  const { user } = useAuth()
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [associadoSelecionado, setAssociadoSelecionado] = useState<{ id: string; nome: string } | null>(null)
  const [valor, setValor] = useState('')
  const [forma, setForma] = useState<FormasPagamentoBar>('dinheiro')
  const [descricao, setDescricao] = useState('')

  const recarregar = useRecarregarCarteirinha()
  const { data: movimentos = [] } = useCarteirinhaMovimentos()

  const { data: associados = [] } = useQuery({
    queryKey: ['associados-select'],
    queryFn: async () => {
      const { data } = await supabase.from('associados').select('id, nome').eq('status', 'ativo').order('nome')
      return data ?? []
    }
  })

  // Buscar saldo da carteirinha por associado
  const { data: saldos = [] } = useQuery({
    queryKey: ['carteirinha-saldos-todos'],
    queryFn: async () => {
      const { data } = await supabase
        .from('carteirinha_saldo')
        .select('*, associados(nome)')
      return (data ?? []).map((s: any) => ({ ...s, associado_nome: s.associados?.nome }))
    }
  })

  const associadosFiltrados = associados.filter((a: any) =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  )

  async function handleRecarregar() {
    if (!associadoSelecionado || !valor) return
    await recarregar.mutateAsync({
      payload: {
        associado_id: associadoSelecionado.id,
        valor: parseFloat(valor),
        forma_recarga: forma,
        descricao: descricao || undefined
      },
      operadorId: user?.id ?? ''
    })
    setModalAberto(false)
    setValor('')
    setDescricao('')
    setAssociadoSelecionado(null)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet size={24} /> Carteirinha de Crédito
          </h1>
          <p className="text-gray-500 text-sm mt-1">Recarga e saldo dos associados</p>
        </div>
        <Button onClick={() => setModalAberto(true)} className="gap-2">
          <Plus size={16} /> Recarregar
        </Button>
      </div>

      {/* Saldos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {saldos.map((s: any) => (
          <div key={s.id} className="bg-white rounded-xl border p-4 space-y-2">
            <p className="font-semibold text-gray-800 truncate">{s.associado_nome}</p>
            <p className={`text-2xl font-bold ${s.saldo > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              R$ {s.saldo.toFixed(2)}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1"
              onClick={() => {
                setAssociadoSelecionado({ id: s.associado_id, nome: s.associado_nome })
                setModalAberto(true)
              }}
            >
              <Plus size={14} /> Recarregar
            </Button>
          </div>
        ))}
        {saldos.length === 0 && (
          <div className="col-span-4 text-center text-gray-400 py-12">
            Nenhuma carteirinha cadastrada. Faça a primeira recarga!
          </div>
        )}
      </div>

      {/* Histórico */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-3">Últimos Movimentos</h2>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Associado</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Tipo</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Valor</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Saldo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Descrição</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {movimentos.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Sem movimentos</td></tr>
              ) : movimentos.slice(0, 50).map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{m.associado_nome}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1 ${m.tipo === 'credito' ? 'text-green-600' : 'text-red-500'}`}>
                      {m.tipo === 'credito' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                      {m.tipo === 'credito' ? 'Recarga' : 'Consumo'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${m.tipo === 'credito' ? 'text-green-600' : 'text-red-500'}`}>
                    {m.tipo === 'credito' ? '+' : '-'}R$ {m.valor.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">R$ {m.saldo_posterior.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.descricao || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(m.created_at).toLocaleString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Recarga */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2"><Wallet size={20} /> Recarregar Carteirinha</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Associado *</label>
                {associadoSelecionado ? (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mt-1">
                    <span className="font-medium text-blue-800">{associadoSelecionado.nome}</span>
                    <button onClick={() => setAssociadoSelecionado(null)} className="text-gray-400 hover:text-red-500">×</button>
                  </div>
                ) : (
                  <div className="mt-1 space-y-2">
                    <Input placeholder="Buscar associado..." value={busca} onChange={e => setBusca(e.target.value)} />
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {associadosFiltrados.slice(0, 20).map((a: any) => (
                        <button
                          key={a.id}
                          onClick={() => { setAssociadoSelecionado({ id: a.id, nome: a.nome }); setBusca('') }}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm border-b last:border-0"
                        >
                          {a.nome}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Valor da Recarga (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  placeholder="0,00"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix'] as FormasPagamentoBar[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setForma(f)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition ${
                        forma === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {f === 'dinheiro' && <Banknote size={18} />}
                      {(f === 'cartao_credito' || f === 'cartao_debito') && <CreditCard size={18} />}
                      {f === 'pix' && <QrCode size={18} />}
                      {f === 'dinheiro' ? 'Dinheiro' : f === 'cartao_credito' ? 'Crédito' : f === 'cartao_debito' ? 'Débito' : 'PIX'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Observação (opcional)</label>
                <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Recarga mensal" className="mt-1" />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleRecarregar}
                disabled={!associadoSelecionado || !valor || recarregar.isPending}
              >
                {recarregar.isPending ? 'Processando...' : `Recarregar R$ ${parseFloat(valor || '0').toFixed(2)}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
