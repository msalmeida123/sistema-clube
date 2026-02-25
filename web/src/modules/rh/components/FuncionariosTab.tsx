'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, Plus, Eye, Edit, Trash2, UserMinus, Filter } from 'lucide-react'
import { useFuncionarios, useFuncionarioMutations } from '../hooks/useRH'
import { FuncionarioForm } from './FuncionarioForm'
import { DEPARTAMENTOS, type Funcionario, type StatusFuncionario, type FuncionarioFormData } from '../types'

const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
const formatDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '-'

const STATUS_COLORS: Record<StatusFuncionario, string> = {
  ativo: 'bg-green-100 text-green-800',
  inativo: 'bg-gray-100 text-gray-800',
  ferias: 'bg-amber-100 text-amber-800',
  afastado: 'bg-red-100 text-red-800',
  desligado: 'bg-slate-100 text-slate-800',
}

const STATUS_LABELS: Record<StatusFuncionario, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  ferias: 'Férias',
  afastado: 'Afastado',
  desligado: 'Desligado',
}

const CONTRATO_LABELS: Record<string, string> = {
  clt: 'CLT',
  pj: 'PJ',
  estagiario: 'Estagiário',
  temporario: 'Temporário',
  freelancer: 'Freelancer',
}

export function FuncionariosTab() {
  const { funcionarios, loading, buscar, filtrarPorStatus, filtrarPorDepartamento, recarregar, filters } = useFuncionarios()
  const mutations = useFuncionarioMutations()
  
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list')
  const [selected, setSelected] = useState<Funcionario | null>(null)
  const [searchText, setSearchText] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (text: string) => {
    setSearchText(text)
    buscar(text)
  }

  const handleNew = () => {
    setSelected(null)
    setView('form')
  }

  const handleEdit = (func: Funcionario) => {
    setSelected(func)
    setView('form')
  }

  const handleView = (func: Funcionario) => {
    setSelected(func)
    setView('detail')
  }

  const handleSubmit = async (data: FuncionarioFormData) => {
    try {
      if (selected) {
        await mutations.atualizar(selected.id, data)
        toast.success('Funcionário atualizado!')
      } else {
        await mutations.criar(data)
        toast.success('Funcionário cadastrado!')
      }
      setView('list')
      recarregar()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar funcionário')
    }
  }

  const handleDelete = async (func: Funcionario) => {
    if (!confirm(`Deseja realmente excluir ${func.nome}?`)) return
    try {
      await mutations.excluir(func.id)
      toast.success('Funcionário excluído!')
      recarregar()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir')
    }
  }

  const handleDesligar = async (func: Funcionario) => {
    if (!confirm(`Confirma o desligamento de ${func.nome}?`)) return
    try {
      await mutations.desligar(func.id)
      toast.success('Funcionário desligado!')
      recarregar()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao desligar')
    }
  }

  // ---- FORM VIEW ----
  if (view === 'form') {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {selected ? `Editar: ${selected.nome}` : 'Novo Funcionário'}
        </h3>
        <FuncionarioForm
          funcionario={selected}
          onSubmit={handleSubmit}
          onCancel={() => setView('list')}
          loading={mutations.loading}
        />
      </div>
    )
  }

  // ---- DETAIL VIEW ----
  if (view === 'detail' && selected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{selected.nome}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(selected)}>
              <Edit className="h-4 w-4 mr-1" /> Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setView('list')}>Voltar</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold text-sm text-gray-500">Dados Pessoais</h4>
              <p><strong>CPF:</strong> {selected.cpf}</p>
              <p><strong>Email:</strong> {selected.email || '-'}</p>
              <p><strong>Telefone:</strong> {selected.telefone || selected.celular || '-'}</p>
              <p><strong>Nascimento:</strong> {formatDate(selected.data_nascimento || '')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold text-sm text-gray-500">Dados Profissionais</h4>
              <p><strong>Cargo:</strong> {selected.cargo}</p>
              <p><strong>Departamento:</strong> {selected.departamento}</p>
              <p><strong>Contrato:</strong> {CONTRATO_LABELS[selected.tipo_contrato] || selected.tipo_contrato}</p>
              <p><strong>Admissão:</strong> {formatDate(selected.data_admissao)}</p>
              <p><strong>Salário:</strong> {formatCurrency(selected.salario)}</p>
              <p><strong>Status:</strong> <Badge className={STATUS_COLORS[selected.status]}>{STATUS_LABELS[selected.status]}</Badge></p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold text-sm text-gray-500">Dados Bancários</h4>
              <p><strong>Banco:</strong> {selected.banco || '-'}</p>
              <p><strong>Agência:</strong> {selected.agencia || '-'}</p>
              <p><strong>Conta:</strong> {selected.conta || '-'}</p>
              <p><strong>PIX:</strong> {selected.chave_pix || '-'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ---- LIST VIEW ----
  return (
    <div className="space-y-4">
      {/* Barra de busca e ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, CPF ou cargo..."
            className="pl-10"
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" /> Filtros
        </Button>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" /> Novo Funcionário
        </Button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Status</label>
            <select
              className="border rounded-md px-3 py-1.5 text-sm"
              value={filters.status || ''}
              onChange={(e) => filtrarPorStatus(e.target.value as StatusFuncionario || undefined)}
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Departamento</label>
            <select
              className="border rounded-md px-3 py-1.5 text-sm"
              value={filters.departamento || ''}
              onChange={(e) => filtrarPorDepartamento(e.target.value || undefined)}
            >
              <option value="">Todos</option>
              {DEPARTAMENTOS.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      ) : funcionarios.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum funcionário encontrado</p>
          <Button className="mt-4" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" /> Cadastrar Primeiro Funcionário
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3 hidden md:table-cell">Cargo</th>
                <th className="text-left p-3 hidden lg:table-cell">Departamento</th>
                <th className="text-left p-3 hidden lg:table-cell">Contrato</th>
                <th className="text-right p-3 hidden md:table-cell">Salário</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {funcionarios.map(func => (
                <tr key={func.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{func.nome}</p>
                      <p className="text-xs text-gray-500 md:hidden">{func.cargo} - {func.departamento}</p>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">{func.cargo}</td>
                  <td className="p-3 hidden lg:table-cell">{func.departamento}</td>
                  <td className="p-3 hidden lg:table-cell">{CONTRATO_LABELS[func.tipo_contrato]}</td>
                  <td className="p-3 text-right hidden md:table-cell">{formatCurrency(func.salario)}</td>
                  <td className="p-3 text-center">
                    <Badge className={STATUS_COLORS[func.status]}>{STATUS_LABELS[func.status]}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleView(func)} title="Visualizar">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(func)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {func.status === 'ativo' && (
                        <Button variant="ghost" size="sm" onClick={() => handleDesligar(func)} title="Desligar">
                          <UserMinus className="h-4 w-4 text-amber-600" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(func)} title="Excluir">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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
