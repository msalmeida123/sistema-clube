'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Dumbbell, Plus, Trash2, Edit, Save, X, Users, Calendar,
  Clock, Award, CheckCircle, XCircle, AlertCircle, Search, QrCode
} from 'lucide-react'

type PlanoAcademia = {
  id: string
  nome: string
  descricao: string | null
  valor_mensalidade: number
  valor_matricula: number
  duracao_meses: number
  desconto_percentual: number
  horario_acesso: string | null
  inclui_personal: boolean
  inclui_avaliacao: boolean
  inclui_armario: boolean
  ativo: boolean
  ordem: number
}

type Assinatura = {
  id: string
  associado_id: string
  plano_id: string
  data_inicio: string
  data_fim: string
  valor_mensal: number
  dia_vencimento: number
  status: string
  matricula_paga: boolean
  observacoes: string | null
  associado?: { nome: string; numero_titulo: string; telefone: string; qr_code: string }
  plano?: { nome: string }
}

export default function AcademiaPage() {
  const [tab, setTab] = useState<'planos' | 'assinaturas'>('assinaturas')
  const [planos, setPlanos] = useState<PlanoAcademia[]>([])
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [associados, setAssociados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFormPlano, setShowFormPlano] = useState(false)
  const [showFormAssinatura, setShowFormAssinatura] = useState(false)
  const [editandoPlano, setEditandoPlano] = useState<PlanoAcademia | null>(null)
  const [editandoAssinatura, setEditandoAssinatura] = useState<Assinatura | null>(null)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todas')

  const [formPlano, setFormPlano] = useState({
    nome: '', descricao: '', valor_mensalidade: 0, valor_matricula: 0,
    duracao_meses: 1, desconto_percentual: 0, horario_acesso: '6h às 22h',
    inclui_personal: false, inclui_avaliacao: true, inclui_armario: false, ativo: true, ordem: 0
  })

  const [formAssinatura, setFormAssinatura] = useState({
    associado_id: '', plano_id: '', data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '', valor_mensal: 0, dia_vencimento: 10, status: 'ativa',
    matricula_paga: false, observacoes: ''
  })

  const supabase = createClientComponentClient()

  const carregarDados = async () => {
    setLoading(true)
    
    const [planosRes, assinaturasRes, associadosRes] = await Promise.all([
      supabase.from('planos_academia').select('*').order('ordem'),
      supabase.from('assinaturas_academia').select(`
        *, 
        associado:associados(nome, numero_titulo, telefone, qr_code),
        plano:planos_academia(nome)
      `).order('created_at', { ascending: false }),
      supabase.from('associados').select('id, nome, numero_titulo, telefone').order('nome')
    ])

    setPlanos(planosRes.data || [])
    setAssinaturas(assinaturasRes.data || [])
    setAssociados(associadosRes.data || [])
    setLoading(false)
  }

  useEffect(() => { carregarDados() }, [])

  // Atualizar data_fim e valor quando selecionar plano
  useEffect(() => {
    if (formAssinatura.plano_id && formAssinatura.data_inicio) {
      const plano = planos.find(p => p.id === formAssinatura.plano_id)
      if (plano) {
        const inicio = new Date(formAssinatura.data_inicio)
        const fim = new Date(inicio)
        fim.setMonth(fim.getMonth() + plano.duracao_meses)
        
        setFormAssinatura(f => ({
          ...f,
          data_fim: fim.toISOString().split('T')[0],
          valor_mensal: plano.valor_mensalidade
        }))
      }
    }
  }, [formAssinatura.plano_id, formAssinatura.data_inicio, planos])

  const resetFormPlano = () => {
    setFormPlano({
      nome: '', descricao: '', valor_mensalidade: 0, valor_matricula: 0,
      duracao_meses: 1, desconto_percentual: 0, horario_acesso: '6h às 22h',
      inclui_personal: false, inclui_avaliacao: true, inclui_armario: false, ativo: true, ordem: planos.length
    })
    setEditandoPlano(null)
    setShowFormPlano(false)
  }

  const resetFormAssinatura = () => {
    setFormAssinatura({
      associado_id: '', plano_id: '', data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '', valor_mensal: 0, dia_vencimento: 10, status: 'ativa',
      matricula_paga: false, observacoes: ''
    })
    setEditandoAssinatura(null)
    setShowFormAssinatura(false)
  }

  const editarPlano = (p: PlanoAcademia) => {
    setEditandoPlano(p)
    setFormPlano({ ...p, descricao: p.descricao || '', horario_acesso: p.horario_acesso || '' })
    setShowFormPlano(true)
  }

  const editarAssinatura = (a: Assinatura) => {
    setEditandoAssinatura(a)
    setFormAssinatura({
      associado_id: a.associado_id,
      plano_id: a.plano_id,
      data_inicio: a.data_inicio,
      data_fim: a.data_fim,
      valor_mensal: a.valor_mensal,
      dia_vencimento: a.dia_vencimento,
      status: a.status,
      matricula_paga: a.matricula_paga,
      observacoes: a.observacoes || ''
    })
    setShowFormAssinatura(true)
  }

  const salvarPlano = async () => {
    if (!formPlano.nome.trim()) { toast.error('Nome obrigatório'); return }

    const dados = { ...formPlano, updated_at: new Date().toISOString() }

    if (editandoPlano) {
      const { error } = await supabase.from('planos_academia').update(dados).eq('id', editandoPlano.id)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Plano atualizado!')
    } else {
      const { error } = await supabase.from('planos_academia').insert(dados)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Plano criado!')
    }
    resetFormPlano()
    carregarDados()
  }

  const salvarAssinatura = async () => {
    if (!formAssinatura.associado_id || !formAssinatura.plano_id) {
      toast.error('Selecione associado e plano')
      return
    }

    const dados = { ...formAssinatura, updated_at: new Date().toISOString() }

    if (editandoAssinatura) {
      const { error } = await supabase.from('assinaturas_academia').update(dados).eq('id', editandoAssinatura.id)
      if (error) { toast.error('Erro: ' + error.message); return }
      toast.success('Assinatura atualizada!')
    } else {
      // Criar assinatura e gerar QR Code
      const { data: novaAssinatura, error } = await supabase
        .from('assinaturas_academia')
        .insert(dados)
        .select()
        .single()
      
      if (error) { toast.error('Erro: ' + error.message); return }
      
      // Gerar QR Code único
      const qrCode = 'ACAD-' + novaAssinatura.id.substring(0, 8).toUpperCase()
      await supabase
        .from('assinaturas_academia')
        .update({ qr_code: qrCode })
        .eq('id', novaAssinatura.id)
      
      toast.success('Assinatura criada!')
    }
    resetFormAssinatura()
    carregarDados()
  }

  const excluirPlano = async (id: string) => {
    if (!confirm('Excluir este plano?')) return
    await supabase.from('planos_academia').delete().eq('id', id)
    toast.success('Plano excluído!')
    carregarDados()
  }

  const excluirAssinatura = async (id: string) => {
    if (!confirm('Excluir esta assinatura?')) return
    await supabase.from('assinaturas_academia').delete().eq('id', id)
    toast.success('Assinatura excluída!')
    carregarDados()
  }

  const formatarMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const formatarData = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  const getStatusColor = (status: string, dataFim: string) => {
    if (new Date(dataFim) < new Date()) return 'bg-red-100 text-red-700'
    if (status === 'ativa') return 'bg-green-100 text-green-700'
    if (status === 'suspensa') return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status: string, dataFim: string) => {
    if (new Date(dataFim) < new Date()) return 'Vencida'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const assinaturasFiltradas = assinaturas.filter(a => {
    const matchBusca = !busca || 
      a.associado?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      a.associado?.numero_titulo?.includes(busca)
    
    const isVencida = new Date(a.data_fim) < new Date()
    const matchStatus = filtroStatus === 'todas' || 
      (filtroStatus === 'vencidas' && isVencida) ||
      (filtroStatus === 'ativas' && a.status === 'ativa' && !isVencida) ||
      (filtroStatus === a.status && !isVencida)
    
    return matchBusca && matchStatus
  })

  const stats = {
    ativas: assinaturas.filter(a => a.status === 'ativa' && new Date(a.data_fim) >= new Date()).length,
    vencidas: assinaturas.filter(a => new Date(a.data_fim) < new Date()).length,
    total: assinaturas.length
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-orange-500" />
            Academia
          </h1>
          <p className="text-muted-foreground">Gerencie planos e assinaturas da academia</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.ativas}</p>
              <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{stats.vencidas}</p>
              <p className="text-sm text-muted-foreground">Vencidas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total de Assinaturas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('assinaturas')}
          className={`px-4 py-2 font-medium ${tab === 'assinaturas' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Assinaturas
        </button>
        <button
          onClick={() => setTab('planos')}
          className={`px-4 py-2 font-medium ${tab === 'planos' ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500'}`}
        >
          <Award className="h-4 w-4 inline mr-2" />
          Planos
        </button>
      </div>

      {/* Tab: Assinaturas */}
      {tab === 'assinaturas' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="h-10 px-3 border rounded-md"
            >
              <option value="todas">Todas</option>
              <option value="ativas">Ativas</option>
              <option value="vencidas">Vencidas</option>
              <option value="suspensa">Suspensas</option>
              <option value="cancelada">Canceladas</option>
            </select>
            <Button onClick={() => { resetFormAssinatura(); setShowFormAssinatura(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Assinatura
            </Button>
          </div>

          {/* Form Assinatura */}
          {showFormAssinatura && (
            <Card>
              <CardHeader>
                <CardTitle>{editandoAssinatura ? 'Editar' : 'Nova'} Assinatura</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Associado *</label>
                    <select
                      value={formAssinatura.associado_id}
                      onChange={e => setFormAssinatura({ ...formAssinatura, associado_id: e.target.value })}
                      className="w-full h-10 px-3 border rounded-md"
                    >
                      <option value="">Selecione...</option>
                      {associados.map(a => (
                        <option key={a.id} value={a.id}>{a.numero_titulo} - {a.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Plano *</label>
                    <select
                      value={formAssinatura.plano_id}
                      onChange={e => setFormAssinatura({ ...formAssinatura, plano_id: e.target.value })}
                      className="w-full h-10 px-3 border rounded-md"
                    >
                      <option value="">Selecione...</option>
                      {planos.filter(p => p.ativo).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} - {formatarMoeda(p.valor_mensalidade)}/mês ({p.duracao_meses} meses)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Data Início</label>
                    <Input
                      type="date"
                      value={formAssinatura.data_inicio}
                      onChange={e => setFormAssinatura({ ...formAssinatura, data_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Data Fim</label>
                    <Input
                      type="date"
                      value={formAssinatura.data_fim}
                      onChange={e => setFormAssinatura({ ...formAssinatura, data_fim: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Valor Mensal (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formAssinatura.valor_mensal}
                      onChange={e => setFormAssinatura({ ...formAssinatura, valor_mensal: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dia Vencimento</label>
                    <Input
                      type="number"
                      min={1}
                      max={28}
                      value={formAssinatura.dia_vencimento}
                      onChange={e => setFormAssinatura({ ...formAssinatura, dia_vencimento: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <select
                      value={formAssinatura.status}
                      onChange={e => setFormAssinatura({ ...formAssinatura, status: e.target.value })}
                      className="w-full h-10 px-3 border rounded-md"
                    >
                      <option value="ativa">Ativa</option>
                      <option value="suspensa">Suspensa</option>
                      <option value="cancelada">Cancelada</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formAssinatura.matricula_paga}
                        onChange={e => setFormAssinatura({ ...formAssinatura, matricula_paga: e.target.checked })}
                        className="h-4 w-4"
                      />
                      Matrícula Paga
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Observações</label>
                  <Input
                    placeholder="Observações..."
                    value={formAssinatura.observacoes}
                    onChange={e => setFormAssinatura({ ...formAssinatura, observacoes: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetFormAssinatura}>Cancelar</Button>
                  <Button onClick={salvarAssinatura}>
                    <Save className="h-4 w-4 mr-2" />
                    {editandoAssinatura ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista Assinaturas */}
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Associado</th>
                    <th className="text-left p-3 font-medium">Plano</th>
                    <th className="text-left p-3 font-medium">QR Code</th>
                    <th className="text-left p-3 font-medium">Período</th>
                    <th className="text-left p-3 font-medium">Valor</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8">Carregando...</td></tr>
                  ) : assinaturasFiltradas.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma assinatura encontrada</td></tr>
                  ) : (
                    assinaturasFiltradas.map(a => (
                      <tr key={a.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="font-medium">{a.associado?.nome}</div>
                          <div className="text-sm text-muted-foreground">{a.associado?.numero_titulo}</div>
                        </td>
                        <td className="p-3">{a.plano?.nome}</td>
                        <td className="p-3">
                          {a.qr_code ? (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(a.qr_code || '')
                                toast.success('QR Code copiado!')
                              }}
                              className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-mono hover:bg-orange-200"
                              title="Clique para copiar"
                            >
                              <QrCode className="h-3 w-3" />
                              {a.qr_code}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {formatarData(a.data_inicio)} até {formatarData(a.data_fim)}
                          </div>
                        </td>
                        <td className="p-3 font-medium">{formatarMoeda(a.valor_mensal)}</td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(a.status, a.data_fim)}`}>
                            {getStatusLabel(a.status, a.data_fim)}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => editarAssinatura(a)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => excluirAssinatura(a.id)} className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Planos */}
      {tab === 'planos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetFormPlano(); setShowFormPlano(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </div>

          {/* Form Plano */}
          {showFormPlano && (
            <Card>
              <CardHeader>
                <CardTitle>{editandoPlano ? 'Editar' : 'Novo'} Plano</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome *</label>
                    <Input
                      placeholder="Ex: Mensal, Trimestral, Anual..."
                      value={formPlano.nome}
                      onChange={e => setFormPlano({ ...formPlano, nome: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Input
                      placeholder="Descrição do plano..."
                      value={formPlano.descricao}
                      onChange={e => setFormPlano({ ...formPlano, descricao: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Mensalidade (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formPlano.valor_mensalidade}
                      onChange={e => setFormPlano({ ...formPlano, valor_mensalidade: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Matrícula (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formPlano.valor_matricula}
                      onChange={e => setFormPlano({ ...formPlano, valor_matricula: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duração (meses)</label>
                    <select
                      value={formPlano.duracao_meses}
                      onChange={e => setFormPlano({ ...formPlano, duracao_meses: parseInt(e.target.value) })}
                      className="w-full h-10 px-3 border rounded-md"
                    >
                      <option value={1}>1 mês</option>
                      <option value={3}>3 meses</option>
                      <option value={6}>6 meses</option>
                      <option value={12}>12 meses</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Desconto (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formPlano.desconto_percentual}
                      onChange={e => setFormPlano({ ...formPlano, desconto_percentual: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Horário de Acesso</label>
                    <Input
                      placeholder="Ex: 6h às 22h"
                      value={formPlano.horario_acesso}
                      onChange={e => setFormPlano({ ...formPlano, horario_acesso: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formPlano.inclui_personal} onChange={e => setFormPlano({ ...formPlano, inclui_personal: e.target.checked })} className="h-4 w-4" />
                      Personal
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formPlano.inclui_avaliacao} onChange={e => setFormPlano({ ...formPlano, inclui_avaliacao: e.target.checked })} className="h-4 w-4" />
                      Avaliação
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formPlano.inclui_armario} onChange={e => setFormPlano({ ...formPlano, inclui_armario: e.target.checked })} className="h-4 w-4" />
                      Armário
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={formPlano.ativo} onChange={e => setFormPlano({ ...formPlano, ativo: e.target.checked })} className="h-4 w-4" />
                      Ativo
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetFormPlano}>Cancelar</Button>
                  <Button onClick={salvarPlano}>
                    <Save className="h-4 w-4 mr-2" />
                    {editandoPlano ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista Planos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planos.map(p => (
              <Card key={p.id} className={!p.ativo ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-lg">{p.nome}</h3>
                      {p.descricao && <p className="text-sm text-muted-foreground">{p.descricao}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                      {p.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mensalidade:</span>
                      <span className="font-bold text-green-600">{formatarMoeda(p.valor_mensalidade)}</span>
                    </div>
                    {p.valor_matricula > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Matrícula:</span>
                        <span>{formatarMoeda(p.valor_matricula)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duração:</span>
                      <span>{p.duracao_meses} {p.duracao_meses === 1 ? 'mês' : 'meses'}</span>
                    </div>
                    {p.desconto_percentual > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Desconto:</span>
                        <span className="text-orange-600">{p.desconto_percentual}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Horário:</span>
                      <span>{p.horario_acesso || 'Livre'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs mb-3">
                    {p.inclui_personal && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">Personal</span>}
                    {p.inclui_avaliacao && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Avaliação</span>}
                    {p.inclui_armario && <span className="bg-gray-100 px-2 py-1 rounded">Armário</span>}
                  </div>

                  <div className="flex gap-1 pt-3 border-t">
                    <Button variant="ghost" size="sm" onClick={() => editarPlano(p)}>
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => excluirPlano(p.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
