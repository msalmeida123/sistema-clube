'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { DollarSign, FileText, CheckCircle, CreditCard, Plus, Eye } from 'lucide-react'
import { useFolhaPagamento, useFuncionarios } from '../hooks/useRH'
import type { FolhaPagamento, StatusFolha } from '../types'

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const STATUS_FOLHA_COLORS: Record<StatusFolha, string> = {
  rascunho: 'bg-gray-100 text-gray-800',
  calculada: 'bg-blue-100 text-blue-800',
  aprovada: 'bg-green-100 text-green-800',
  paga: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-red-100 text-red-800',
}

const STATUS_FOLHA_LABELS: Record<StatusFolha, string> = {
  rascunho: 'Rascunho',
  calculada: 'Calculada',
  aprovada: 'Aprovada',
  paga: 'Paga',
  cancelada: 'Cancelada',
}

export function FolhaTab() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [referencia, setReferencia] = useState(currentMonth)
  const [statusFilter, setStatusFilter] = useState<StatusFolha | ''>('')
  const [selectedFolha, setSelectedFolha] = useState<FolhaPagamento | null>(null)
  
  const { folhas, loading, gerarFolhaMensal, aprovar, marcarComoPaga, recarregar } = useFolhaPagamento({
    referencia,
    status: statusFilter || undefined,
  })

  const handleGerar = async () => {
    if (!confirm(`Gerar folha de pagamento para ${referencia}?`)) return
    try {
      const result = await gerarFolhaMensal(referencia)
      toast.success(`${result.length} folha(s) gerada(s)!`)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao gerar folha')
    }
  }

  const handleAprovar = async (id: string) => {
    try {
      await aprovar(id)
      toast.success('Folha aprovada!')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handlePagar = async (id: string) => {
    if (!confirm('Confirma o pagamento?')) return
    try {
      await marcarComoPaga(id)
      toast.success('Pagamento registrado!')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Totais
  const totalProventos = folhas.reduce((acc, f) => acc + f.total_proventos, 0)
  const totalDescontos = folhas.reduce((acc, f) => acc + f.total_descontos, 0)
  const totalLiquido = folhas.reduce((acc, f) => acc + f.salario_liquido, 0)

  // Detail view
  if (selectedFolha) {
    const f = selectedFolha
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Detalhes - {f.funcionario?.nome}</h3>
          <Button variant="outline" size="sm" onClick={() => setSelectedFolha(null)}>Voltar</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm text-green-600">Proventos</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Salário Base</span><span>{formatCurrency(f.salario_base)}</span></div>
              {f.horas_extras_valor > 0 && <div className="flex justify-between"><span>Horas Extras</span><span>{formatCurrency(f.horas_extras_valor)}</span></div>}
              {f.adicional_noturno > 0 && <div className="flex justify-between"><span>Ad. Noturno</span><span>{formatCurrency(f.adicional_noturno)}</span></div>}
              {f.adicional_insalubridade > 0 && <div className="flex justify-between"><span>Insalubridade</span><span>{formatCurrency(f.adicional_insalubridade)}</span></div>}
              {f.adicional_periculosidade > 0 && <div className="flex justify-between"><span>Periculosidade</span><span>{formatCurrency(f.adicional_periculosidade)}</span></div>}
              {f.gratificacao > 0 && <div className="flex justify-between"><span>Gratificação</span><span>{formatCurrency(f.gratificacao)}</span></div>}
              {f.comissao > 0 && <div className="flex justify-between"><span>Comissão</span><span>{formatCurrency(f.comissao)}</span></div>}
              {f.outros_proventos > 0 && <div className="flex justify-between"><span>Outros</span><span>{formatCurrency(f.outros_proventos)}</span></div>}
              <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total</span><span className="text-green-600">{formatCurrency(f.total_proventos)}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-red-600">Descontos</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {f.inss > 0 && <div className="flex justify-between"><span>INSS</span><span>{formatCurrency(f.inss)}</span></div>}
              {f.irrf > 0 && <div className="flex justify-between"><span>IRRF</span><span>{formatCurrency(f.irrf)}</span></div>}
              {f.vale_transporte > 0 && <div className="flex justify-between"><span>V. Transporte</span><span>{formatCurrency(f.vale_transporte)}</span></div>}
              {f.vale_refeicao > 0 && <div className="flex justify-between"><span>V. Refeição</span><span>{formatCurrency(f.vale_refeicao)}</span></div>}
              {f.faltas_desconto > 0 && <div className="flex justify-between"><span>Faltas</span><span>{formatCurrency(f.faltas_desconto)}</span></div>}
              {f.atrasos_desconto > 0 && <div className="flex justify-between"><span>Atrasos</span><span>{formatCurrency(f.atrasos_desconto)}</span></div>}
              {f.adiantamento > 0 && <div className="flex justify-between"><span>Adiantamento</span><span>{formatCurrency(f.adiantamento)}</span></div>}
              {f.outros_descontos > 0 && <div className="flex justify-between"><span>Outros</span><span>{formatCurrency(f.outros_descontos)}</span></div>}
              <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Total</span><span className="text-red-600">{formatCurrency(f.total_descontos)}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm text-blue-600">Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Cargo</span><span>{f.funcionario?.cargo}</span></div>
              <div className="flex justify-between"><span>Departamento</span><span>{f.funcionario?.departamento}</span></div>
              <div className="flex justify-between"><span>Referência</span><span>{f.referencia}</span></div>
              <div className="flex justify-between"><span>Status</span><Badge className={STATUS_FOLHA_COLORS[f.status]}>{STATUS_FOLHA_LABELS[f.status]}</Badge></div>
              <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
                <span>Líquido</span>
                <span className="text-blue-600">{formatCurrency(f.salario_liquido)}</span>
              </div>
              <div className="flex gap-2 mt-4">
                {f.status === 'rascunho' && <Button size="sm" className="flex-1" onClick={() => handleAprovar(f.id)}>Aprovar</Button>}
                {f.status === 'aprovada' && <Button size="sm" className="flex-1" onClick={() => handlePagar(f.id)}>Pagar</Button>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total Proventos</p><p className="text-xl font-bold text-green-600">{formatCurrency(totalProventos)}</p></div>
            <DollarSign className="h-8 w-8 text-green-200" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total Descontos</p><p className="text-xl font-bold text-red-600">{formatCurrency(totalDescontos)}</p></div>
            <DollarSign className="h-8 w-8 text-red-200" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div><p className="text-xs text-gray-500">Total Líquido</p><p className="text-xl font-bold text-blue-600">{formatCurrency(totalLiquido)}</p></div>
            <DollarSign className="h-8 w-8 text-blue-200" />
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Referência</label>
          <Input type="month" value={referencia} onChange={(e) => setReferencia(e.target.value)} className="w-44" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Status</label>
          <select className="border rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFolha | '')}>
            <option value="">Todos</option>
            {Object.entries(STATUS_FOLHA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="sm:ml-auto sm:self-end">
          <Button onClick={handleGerar}>
            <Plus className="h-4 w-4 mr-2" /> Gerar Folha do Mês
          </Button>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : folhas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhuma folha para este período</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Funcionário</th>
                <th className="text-right p-3 hidden md:table-cell">Proventos</th>
                <th className="text-right p-3 hidden md:table-cell">Descontos</th>
                <th className="text-right p-3">Líquido</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {folhas.map(folha => (
                <tr key={folha.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-medium">{folha.funcionario?.nome || '-'}</p>
                    <p className="text-xs text-gray-500">{folha.funcionario?.cargo} - {folha.funcionario?.departamento}</p>
                  </td>
                  <td className="p-3 text-right hidden md:table-cell text-green-600">{formatCurrency(folha.total_proventos)}</td>
                  <td className="p-3 text-right hidden md:table-cell text-red-600">{formatCurrency(folha.total_descontos)}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrency(folha.salario_liquido)}</td>
                  <td className="p-3 text-center">
                    <Badge className={STATUS_FOLHA_COLORS[folha.status]}>{STATUS_FOLHA_LABELS[folha.status]}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedFolha(folha)} title="Detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {folha.status === 'rascunho' && (
                        <Button variant="ghost" size="sm" onClick={() => handleAprovar(folha.id)} title="Aprovar">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {folha.status === 'aprovada' && (
                        <Button variant="ghost" size="sm" onClick={() => handlePagar(folha.id)} title="Pagar">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
