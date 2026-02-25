'use client'

import { useState } from 'react'
import {
  Landmark, DoorOpen, DoorClosed, ArrowDownCircle, ArrowUpCircle,
  Clock, Eye, ChevronDown, ChevronRight, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useCaixaAberto, useCaixas, useCaixaMovimentos,
  useAbrirCaixa, useFecharCaixa, useMovimentoCaixa
} from '@/modules/bar/hooks/useBar'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { BarCaixa, BarCaixaMovimento } from '@/modules/bar/types'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtData = (d: string) => new Date(d).toLocaleString('pt-BR')

export default function CaixaPage() {
  const { user } = useAuth()
  const { data: caixaAberto, isLoading } = useCaixaAberto()
  const { data: caixas = [] } = useCaixas()
  const { data: movimentos = [] } = useCaixaMovimentos(caixaAberto?.id)

  const abrirCaixa = useAbrirCaixa()
  const fecharCaixa = useFecharCaixa()
  const movimentoCaixa = useMovimentoCaixa()

  // Estados dos modais
  const [modalAbrir, setModalAbrir] = useState(false)
  const [modalFechar, setModalFechar] = useState(false)
  const [modalMovimento, setModalMovimento] = useState<'sangria' | 'suprimento' | null>(null)
  const [detalhe, setDetalhe] = useState<BarCaixa | null>(null)

  // Formulários
  const [saldoInicial, setSaldoInicial] = useState('')
  const [obsAbertura, setObsAbertura] = useState('')
  const [saldoConferido, setSaldoConferido] = useState('')
  const [obsFechamento, setObsFechamento] = useState('')
  const [valorMovimento, setValorMovimento] = useState('')
  const [motivoMovimento, setMotivoMovimento] = useState('')

  const handleAbrir = () => {
    if (!user) return
    abrirCaixa.mutate({
      operadorId: user.auth_id,
      operadorNome: user.nome,
      saldoInicial: parseFloat(saldoInicial) || 0,
      observacao: obsAbertura || undefined
    }, {
      onSuccess: () => {
        setModalAbrir(false)
        setSaldoInicial('')
        setObsAbertura('')
      }
    })
  }

  const handleFechar = () => {
    if (!caixaAberto) return
    fecharCaixa.mutate({
      caixaId: caixaAberto.id,
      saldoConferido: parseFloat(saldoConferido) || 0,
      observacao: obsFechamento || undefined
    }, {
      onSuccess: () => {
        setModalFechar(false)
        setSaldoConferido('')
        setObsFechamento('')
      }
    })
  }

  const handleMovimento = () => {
    if (!caixaAberto || !modalMovimento || !user) return
    movimentoCaixa.mutate({
      caixaId: caixaAberto.id,
      tipo: modalMovimento,
      valor: parseFloat(valorMovimento) || 0,
      motivo: motivoMovimento,
      operadorId: user.auth_id
    }, {
      onSuccess: () => {
        setModalMovimento(null)
        setValorMovimento('')
        setMotivoMovimento('')
      }
    })
  }

  if (isLoading) {
    return <div className="p-6 text-gray-400">Carregando...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Landmark className="text-amber-500" size={28} />
          <h1 className="text-2xl font-bold text-white">Controle de Caixa</h1>
        </div>

        {!caixaAberto ? (
          <Button onClick={() => setModalAbrir(true)} className="bg-green-600 hover:bg-green-700 gap-2">
            <DoorOpen size={18} />
            Abrir Caixa
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setModalMovimento('suprimento')} variant="outline" className="gap-2 border-blue-500 text-blue-400 hover:bg-blue-500/10">
              <ArrowDownCircle size={18} />
              Suprimento
            </Button>
            <Button onClick={() => setModalMovimento('sangria')} variant="outline" className="gap-2 border-orange-500 text-orange-400 hover:bg-orange-500/10">
              <ArrowUpCircle size={18} />
              Sangria
            </Button>
            <Button onClick={() => setModalFechar(true)} className="bg-red-600 hover:bg-red-700 gap-2">
              <DoorClosed size={18} />
              Fechar Caixa
            </Button>
          </div>
        )}
      </div>

      {/* Caixa Aberto - Resumo */}
      {caixaAberto && (
        <div className="bg-gray-800 rounded-xl border border-green-500/30 p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-semibold text-lg">Caixa Aberto</span>
            <span className="text-sm text-gray-400 ml-2">por {caixaAberto.operador_nome}</span>
            <span className="text-sm text-gray-500 ml-auto">Aberto em {fmtData(caixaAberto.aberto_em)}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Saldo Inicial</p>
              <p className="text-lg font-bold text-white">{fmt(caixaAberto.saldo_inicial)}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Suprimentos</p>
              <p className="text-lg font-bold text-blue-400">
                {fmt(movimentos.filter(m => m.tipo === 'suprimento').reduce((a, m) => a + m.valor, 0))}
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Sangrias</p>
              <p className="text-lg font-bold text-orange-400">
                {fmt(movimentos.filter(m => m.tipo === 'sangria').reduce((a, m) => a + m.valor, 0))}
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-400 mb-1">Movimentos</p>
              <p className="text-lg font-bold text-gray-300">{movimentos.length}</p>
            </div>
          </div>

          {/* Movimentos recentes */}
          {movimentos.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Movimentos do Caixa</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {movimentos.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-2 px-3 bg-gray-900/50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      {m.tipo === 'sangria' ? (
                        <ArrowUpCircle size={14} className="text-orange-400" />
                      ) : (
                        <ArrowDownCircle size={14} className="text-blue-400" />
                      )}
                      <span className="text-gray-300">{m.tipo === 'sangria' ? 'Sangria' : 'Suprimento'}</span>
                      {m.motivo && <span className="text-gray-500">— {m.motivo}</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={m.tipo === 'sangria' ? 'text-orange-400' : 'text-blue-400'}>
                        {m.tipo === 'sangria' ? '-' : '+'} {fmt(m.valor)}
                      </span>
                      <span className="text-gray-600 text-xs">{fmtData(m.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {caixaAberto.observacao_abertura && (
            <p className="text-xs text-gray-500 mt-2">Obs: {caixaAberto.observacao_abertura}</p>
          )}
        </div>
      )}

      {/* Sem caixa aberto */}
      {!caixaAberto && (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <Landmark className="mx-auto text-gray-600 mb-4" size={48} />
          <h2 className="text-xl text-gray-300 mb-2">Nenhum caixa aberto</h2>
          <p className="text-gray-500 mb-4">Abra um caixa para começar a registrar vendas no PDV.</p>
        </div>
      )}

      {/* Histórico de caixas */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Clock size={20} className="text-gray-400" />
          Histórico de Caixas
        </h2>
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-900">
              <tr className="text-gray-400 text-left">
                <th className="p-3">Operador</th>
                <th className="p-3">Abertura</th>
                <th className="p-3">Fechamento</th>
                <th className="p-3 text-right">Saldo Inicial</th>
                <th className="p-3 text-right">Total Vendas</th>
                <th className="p-3 text-right">Saldo Final</th>
                <th className="p-3 text-right">Diferença</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {caixas.map(c => (
                <tr key={c.id} className="hover:bg-gray-700/30">
                  <td className="p-3 text-gray-300">{c.operador_nome || '—'}</td>
                  <td className="p-3 text-gray-400">{fmtData(c.aberto_em)}</td>
                  <td className="p-3 text-gray-400">{c.fechado_em ? fmtData(c.fechado_em) : '—'}</td>
                  <td className="p-3 text-right text-gray-300">{fmt(c.saldo_inicial)}</td>
                  <td className="p-3 text-right text-green-400">{fmt(c.total_vendas)}</td>
                  <td className="p-3 text-right text-white font-medium">{fmt(c.saldo_final)}</td>
                  <td className="p-3 text-right">
                    {c.status === 'fechado' && (
                      <span className={c.diferenca === 0 ? 'text-green-400' : c.diferenca > 0 ? 'text-blue-400' : 'text-red-400'}>
                        {c.diferenca > 0 ? '+' : ''}{fmt(c.diferenca)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === 'aberto' ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/30 text-gray-400'}`}>
                      {c.status === 'aberto' ? 'Aberto' : 'Fechado'}
                    </span>
                  </td>
                  <td className="p-3">
                    {c.status === 'fechado' && (
                      <Button size="sm" variant="ghost" onClick={() => setDetalhe(c)}>
                        <Eye size={16} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {caixas.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500">Nenhum registro encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Abrir Caixa */}
      {modalAbrir && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DoorOpen className="text-green-400" size={20} />
              Abrir Caixa
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Saldo Inicial (Fundo de Troco)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={saldoInicial}
                  onChange={e => setSaldoInicial(e.target.value)}
                  className="bg-gray-900 border-gray-600"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Observação (opcional)</label>
                <Input
                  placeholder="Ex: Abertura manhã..."
                  value={obsAbertura}
                  onChange={e => setObsAbertura(e.target.value)}
                  className="bg-gray-900 border-gray-600"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setModalAbrir(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleAbrir} className="flex-1 bg-green-600 hover:bg-green-700" disabled={abrirCaixa.isPending}>
                {abrirCaixa.isPending ? 'Abrindo...' : 'Abrir Caixa'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fechar Caixa */}
      {modalFechar && caixaAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DoorClosed className="text-red-400" size={20} />
              Fechar Caixa
            </h3>
            <div className="bg-gray-900 rounded-lg p-4 mb-4 space-y-1 text-sm">
              <p className="text-gray-400">Saldo Inicial: <span className="text-white">{fmt(caixaAberto.saldo_inicial)}</span></p>
              <p className="text-gray-400">Aberto em: <span className="text-white">{fmtData(caixaAberto.aberto_em)}</span></p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Valor Conferido em Caixa (Dinheiro)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={saldoConferido}
                  onChange={e => setSaldoConferido(e.target.value)}
                  className="bg-gray-900 border-gray-600"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Observação (opcional)</label>
                <Input
                  placeholder="Ex: Fechamento noturno..."
                  value={obsFechamento}
                  onChange={e => setObsFechamento(e.target.value)}
                  className="bg-gray-900 border-gray-600"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setModalFechar(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleFechar} className="flex-1 bg-red-600 hover:bg-red-700" disabled={fecharCaixa.isPending}>
                {fecharCaixa.isPending ? 'Fechando...' : 'Fechar Caixa'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sangria / Suprimento */}
      {modalMovimento && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              {modalMovimento === 'sangria' ? (
                <><ArrowUpCircle className="text-orange-400" size={20} /> Registrar Sangria</>
              ) : (
                <><ArrowDownCircle className="text-blue-400" size={20} /> Registrar Suprimento</>
              )}
            </h3>
            {modalMovimento === 'sangria' && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 mb-4 flex items-start gap-2">
                <AlertTriangle size={16} className="text-orange-400 mt-0.5" />
                <p className="text-xs text-orange-300">Sangria é a retirada de dinheiro do caixa. Informe o valor e motivo.</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Valor</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={valorMovimento}
                  onChange={e => setValorMovimento(e.target.value)}
                  className="bg-gray-900 border-gray-600"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Motivo</label>
                <Input
                  placeholder={modalMovimento === 'sangria' ? 'Ex: Pagamento fornecedor...' : 'Ex: Troco adicional...'}
                  value={motivoMovimento}
                  onChange={e => setMotivoMovimento(e.target.value)}
                  className="bg-gray-900 border-gray-600"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setModalMovimento(null)} className="flex-1">Cancelar</Button>
              <Button
                onClick={handleMovimento}
                className={`flex-1 ${modalMovimento === 'sangria' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                disabled={!valorMovimento || parseFloat(valorMovimento) <= 0 || !motivoMovimento || movimentoCaixa.isPending}
              >
                {movimentoCaixa.isPending ? 'Salvando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhe Caixa Fechado */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg border border-gray-700 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Resumo do Caixa</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Operador</span><span className="text-white">{detalhe.operador_nome}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Abertura</span><span className="text-white">{fmtData(detalhe.aberto_em)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Fechamento</span><span className="text-white">{detalhe.fechado_em ? fmtData(detalhe.fechado_em) : '—'}</span>
              </div>
              <hr className="border-gray-700" />
              <div className="flex justify-between text-gray-400">
                <span>Saldo Inicial</span><span className="text-white">{fmt(detalhe.saldo_inicial)}</span>
              </div>
              <hr className="border-gray-700" />
              <p className="font-medium text-gray-300">Vendas por Forma de Pagamento</p>
              <div className="flex justify-between text-gray-400">
                <span>Dinheiro</span><span className="text-green-400">{fmt(detalhe.total_dinheiro)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Cartão Crédito</span><span className="text-blue-400">{fmt(detalhe.total_cartao_credito)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Cartão Débito</span><span className="text-blue-400">{fmt(detalhe.total_cartao_debito)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>PIX</span><span className="text-purple-400">{fmt(detalhe.total_pix)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Carteirinha</span><span className="text-amber-400">{fmt(detalhe.total_carteirinha)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Cortesia</span><span className="text-gray-400">{fmt(detalhe.total_cortesia)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Troco Dado</span><span className="text-red-400">-{fmt(detalhe.total_troco)}</span>
              </div>
              <hr className="border-gray-700" />
              <div className="flex justify-between text-gray-400">
                <span>Suprimentos</span><span className="text-blue-400">+{fmt(detalhe.total_suprimentos)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Sangrias</span><span className="text-orange-400">-{fmt(detalhe.total_sangrias)}</span>
              </div>
              <hr className="border-gray-700" />
              <div className="flex justify-between font-semibold text-white text-base">
                <span>Total Vendas</span><span>{fmt(detalhe.total_vendas)}</span>
              </div>
              <div className="flex justify-between font-semibold text-white text-base">
                <span>Saldo Final Esperado</span><span>{fmt(detalhe.saldo_final)}</span>
              </div>
              <div className="flex justify-between font-semibold text-white text-base">
                <span>Saldo Conferido</span><span>{fmt(detalhe.saldo_conferido ?? 0)}</span>
              </div>
              <div className={`flex justify-between font-bold text-base p-2 rounded ${detalhe.diferenca === 0 ? 'bg-green-500/10 text-green-400' : detalhe.diferenca > 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                <span>Diferença</span>
                <span>{detalhe.diferenca > 0 ? '+' : ''}{fmt(detalhe.diferenca)}</span>
              </div>
              {detalhe.observacao_abertura && (
                <p className="text-xs text-gray-500">Obs abertura: {detalhe.observacao_abertura}</p>
              )}
              {detalhe.observacao_fechamento && (
                <p className="text-xs text-gray-500">Obs fechamento: {detalhe.observacao_fechamento}</p>
              )}
            </div>
            <Button variant="outline" onClick={() => setDetalhe(null)} className="w-full mt-6">Fechar</Button>
          </div>
        </div>
      )}
    </div>
  )
}
