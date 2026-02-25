'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Palmtree, Plus, CheckCircle, X, Eye, Calendar } from 'lucide-react'
import { useAfastamentos, useFuncionarios } from '../hooks/useRH'
import type { TipoAfastamento, StatusAfastamento, AfastamentoFormData, Afastamento } from '../types'

const formatDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-'

const TIPO_LABELS: Record<TipoAfastamento, string> = {
  ferias: 'Férias',
  licenca_medica: 'Licença Médica',
  licenca_maternidade: 'Licença Maternidade',
  licenca_paternidade: 'Licença Paternidade',
  afastamento_inss: 'Afastamento INSS',
  falta_justificada: 'Falta Justificada',
  falta_injustificada: 'Falta Injustificada',
  folga: 'Folga',
  outro: 'Outro',
}

const STATUS_COLORS: Record<StatusAfastamento, string> = {
  solicitado: 'bg-yellow-100 text-yellow-800',
  aprovado: 'bg-green-100 text-green-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  concluido: 'bg-gray-100 text-gray-800',
  rejeitado: 'bg-red-100 text-red-800',
  cancelado: 'bg-slate-100 text-slate-800',
}

const STATUS_LABELS: Record<StatusAfastamento, string> = {
  solicitado: 'Solicitado',
  aprovado: 'Aprovado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado',
}

export function AfastamentosTab() {
  const [tipoFilter, setTipoFilter] = useState<TipoAfastamento | ''>('')
  const [statusFilter, setStatusFilter] = useState<StatusAfastamento | ''>('')

  const { afastamentos, loading, criar, aprovar, rejeitar, concluir, recarregar } = useAfastamentos({
    tipo: tipoFilter || undefined,
    status: statusFilter || undefined,
  })
  const { funcionarios } = useFuncionarios({ status: 'ativo' })

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AfastamentoFormData>({
    funcionario_id: '',
    tipo: 'ferias',
    data_inicio: '',
    data_fim: '',
    motivo: '',
    observacao: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await criar(form)
      toast.success('Afastamento registrado!')
      setShowForm(false)
      setForm({ funcionario_id: '', tipo: 'ferias', data_inicio: '', data_fim: '', motivo: '', observacao: '' })
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar')
    }
  }

  const handleAprovar = async (id: string) => {
    try {
      await aprovar(id, 'admin') // TODO: pegar ID do usuário logado
      toast.success('Afastamento aprovado!')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleRejeitar = async (id: string) => {
    const obs = prompt('Motivo da rejeição:')
    try {
      await rejeitar(id, obs || undefined)
      toast.success('Afastamento rejeitado')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleConcluir = async (id: string) => {
    try {
      await concluir(id)
      toast.success('Afastamento concluído! Funcionário reativado.')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palmtree className="h-5 w-5 text-amber-600" />
              Novo Afastamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Funcionário *</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.funcionario_id}
                  onChange={(e) => setForm(p => ({ ...p, funcionario_id: e.target.value }))}
                  required
                >
                  <option value="">Selecione</option>
                  {funcionarios.map(f => (
                    <option key={f.id} value={f.id}>{f.nome} - {f.cargo}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Tipo *</Label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.tipo}
                  onChange={(e) => setForm(p => ({ ...p, tipo: e.target.value as TipoAfastamento }))}
                >
                  {Object.entries(TIPO_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Data Início *</Label>
                <Input type="date" value={form.data_inicio} onChange={(e) => setForm(p => ({ ...p, data_inicio: e.target.value }))} required />
              </div>
              <div>
                <Label>Data Fim *</Label>
                <Input type="date" value={form.data_fim} onChange={(e) => setForm(p => ({ ...p, data_fim: e.target.value }))} required />
              </div>
              <div>
                <Label>Motivo</Label>
                <Input value={form.motivo || ''} onChange={(e) => setForm(p => ({ ...p, motivo: e.target.value }))} />
              </div>
              <div>
                <Label>Observação</Label>
                <Input value={form.observacao || ''} onChange={(e) => setForm(p => ({ ...p, observacao: e.target.value }))} />
              </div>
              <div className="md:col-span-2 lg:col-span-3 flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit">Registrar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Tipo</label>
          <select className="border rounded-md px-3 py-2 text-sm" value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value as TipoAfastamento | '')}>
            <option value="">Todos</option>
            {Object.entries(TIPO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Status</label>
          <select className="border rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusAfastamento | '')}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="sm:ml-auto sm:self-end">
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4 mr-2" /> Novo Afastamento
          </Button>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : afastamentos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">Nenhum afastamento encontrado</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Funcionário</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-center p-3">Período</th>
                <th className="text-center p-3 hidden sm:table-cell">Dias</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {afastamentos.map(af => (
                <tr key={af.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-medium">{af.funcionario?.nome || '-'}</p>
                    <p className="text-xs text-gray-500">{af.funcionario?.cargo}</p>
                  </td>
                  <td className="p-3">{TIPO_LABELS[af.tipo]}</td>
                  <td className="p-3 text-center text-xs">
                    {formatDate(af.data_inicio)} - {formatDate(af.data_fim)}
                  </td>
                  <td className="p-3 text-center hidden sm:table-cell">{af.dias_totais}</td>
                  <td className="p-3 text-center">
                    <Badge className={STATUS_COLORS[af.status]}>{STATUS_LABELS[af.status]}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      {af.status === 'solicitado' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleAprovar(af.id)} title="Aprovar">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleRejeitar(af.id)} title="Rejeitar">
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      {af.status === 'aprovado' && (
                        <Button variant="ghost" size="sm" onClick={() => handleConcluir(af.id)} title="Concluir">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
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
