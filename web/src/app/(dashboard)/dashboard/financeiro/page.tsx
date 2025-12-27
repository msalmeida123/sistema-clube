'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  CreditCard, DollarSign, AlertCircle, CheckCircle, Search, Plus, Eye, 
  Trash2, X, TrendingUp, TrendingDown, Calendar, Users, Receipt,
  Ticket, ShoppingCart, FileText, Wallet, PiggyBank, BarChart3,
  ChevronDown, ChevronUp, Filter, Download, Printer
} from 'lucide-react'

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
const formatDate = (date: string) => date ? new Date(date + 'T00:00:00').toLocaleDateString('pt-BR') : '-'

type Mensalidade = {
  id: string
  associado_id: string
  tipo: string
  referencia: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: string
  associado?: { nome: string; numero_titulo: string }
}

type Parcela = {
  id: string
  carne_id: string
  associado_id: string
  numero_parcela: number
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: string
  carne?: { tipo: string; descricao: string }
  associado?: { nome: string; numero_titulo: string }
}

type Convite = {
  id: string
  associado_id: string
  convidado_nome: string
  valor_pago: number
  data_validade: string
  status: string
  associado?: { nome: string; numero_titulo: string }
}

type ContaPagar = {
  id: string
  descricao: string
  fornecedor: string
  categoria: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  status: string
}

type Compra = {
  id: string
  descricao: string
  fornecedor: string
  valor_total: number
  data_compra: string
  status: string
}

export default function FinanceiroPage() {
  const [tab, setTab] = useState<'dashboard' | 'mensalidades' | 'carnes' | 'convites' | 'contas' | 'compras'>('dashboard')
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([])
  const [parcelas, setParcelas] = useState<Parcela[]>([])
  const [convites, setConvites] = useState<Convite[]>([])
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    receitaMes: 0,
    despesaMes: 0,
    aReceber: 0,
    aPagar: 0,
    inadimplentes: 0,
    mensalidadesPagas: 0,
    parcelasPagas: 0,
    convitesMes: 0
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    if (tab === 'mensalidades') carregarMensalidades()
    if (tab === 'carnes') carregarParcelas()
    if (tab === 'convites') carregarConvites()
    if (tab === 'contas') carregarContasPagar()
    if (tab === 'compras') carregarCompras()
  }, [tab, filtroStatus, filtroPeriodo])

  const carregarDados = async () => {
    setLoading(true)
    
    const hoje = new Date()
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0]
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0]

    // Mensalidades do mês
    const { data: mensalidadesMes } = await supabase
      .from('mensalidades')
      .select('valor, status, data_pagamento')
      .gte('data_vencimento', inicioMes)
      .lte('data_vencimento', fimMes)

    // Parcelas do mês
    const { data: parcelasMes } = await supabase
      .from('parcelas_carne')
      .select('valor, status, data_pagamento')
      .gte('data_vencimento', inicioMes)
      .lte('data_vencimento', fimMes)

    // Convites do mês
    const { data: convitesMes } = await supabase
      .from('convites')
      .select('valor_pago, status')
      .gte('data_validade', inicioMes)
      .lte('data_validade', fimMes)
      .in('status', ['pago', 'utilizado'])

    // Contas a pagar do mês
    const { data: contasMes } = await supabase
      .from('contas_pagar')
      .select('valor, status')
      .gte('data_vencimento', inicioMes)
      .lte('data_vencimento', fimMes)

    // Mensalidades atrasadas
    const { count: inadimplentes } = await supabase
      .from('mensalidades')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'atrasado')

    // Calcular stats
    const receitaMensalidades = (mensalidadesMes || [])
      .filter(m => m.status === 'pago')
      .reduce((acc, m) => acc + (m.valor || 0), 0)

    const receitaParcelas = (parcelasMes || [])
      .filter(p => p.status === 'pago')
      .reduce((acc, p) => acc + (p.valor || 0), 0)

    const receitaConvites = (convitesMes || [])
      .reduce((acc, c) => acc + (c.valor_pago || 0), 0)

    const despesas = (contasMes || [])
      .filter(c => c.status === 'pago')
      .reduce((acc, c) => acc + (c.valor || 0), 0)

    const aReceber = (mensalidadesMes || [])
      .filter(m => m.status !== 'pago')
      .reduce((acc, m) => acc + (m.valor || 0), 0) +
      (parcelasMes || [])
      .filter(p => p.status !== 'pago')
      .reduce((acc, p) => acc + (p.valor || 0), 0)

    const aPagar = (contasMes || [])
      .filter(c => c.status !== 'pago')
      .reduce((acc, c) => acc + (c.valor || 0), 0)

    setStats({
      receitaMes: receitaMensalidades + receitaParcelas + receitaConvites,
      despesaMes: despesas,
      aReceber,
      aPagar,
      inadimplentes: inadimplentes || 0,
      mensalidadesPagas: (mensalidadesMes || []).filter(m => m.status === 'pago').length,
      parcelasPagas: (parcelasMes || []).filter(p => p.status === 'pago').length,
      convitesMes: (convitesMes || []).length
    })

    setLoading(false)
  }

  const carregarMensalidades = async () => {
    let query = supabase
      .from('mensalidades')
      .select('*, associado:associados(nome, numero_titulo)')
      .order('data_vencimento', { ascending: false })

    if (filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus)
    }

    const { data } = await query.limit(200)
    setMensalidades(data || [])
  }

  const carregarParcelas = async () => {
    let query = supabase
      .from('parcelas_carne')
      .select('*, carne:carnes(tipo, descricao), associado:associados(nome, numero_titulo)')
      .order('data_vencimento', { ascending: false })

    if (filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus)
    }

    const { data } = await query.limit(200)
    setParcelas(data || [])
  }

  const carregarConvites = async () => {
    let query = supabase
      .from('convites')
      .select('*, associado:associados(nome, numero_titulo)')
      .in('status', ['pago', 'utilizado'])
      .order('data_validade', { ascending: false })

    const { data } = await query.limit(200)
    setConvites(data || [])
  }

  const carregarContasPagar = async () => {
    let query = supabase
      .from('contas_pagar')
      .select('*')
      .order('data_vencimento', { ascending: true })

    if (filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus)
    }

    const { data } = await query.limit(200)
    setContasPagar(data || [])
  }

  const carregarCompras = async () => {
    const { data } = await supabase
      .from('compras')
      .select('*')
      .order('data_compra', { ascending: false })
      .limit(200)

    setCompras(data || [])
  }

  const marcarComoPago = async (tabela: string, id: string) => {
    const { error } = await supabase
      .from(tabela)
      .update({ 
        status: 'pago', 
        data_pagamento: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }

    toast.success('Marcado como pago!')
    carregarDados()
    
    if (tab === 'mensalidades') carregarMensalidades()
    if (tab === 'carnes') carregarParcelas()
    if (tab === 'contas') carregarContasPagar()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'bg-green-100 text-green-700'
      case 'pendente': return 'bg-yellow-100 text-yellow-700'
      case 'atrasado': return 'bg-red-100 text-red-700'
      case 'cancelado': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const filtrarPorBusca = (items: any[], campos: string[]) => {
    if (!busca) return items
    return items.filter(item => 
      campos.some(campo => {
        const valor = campo.split('.').reduce((obj, key) => obj?.[key], item)
        return valor?.toString().toLowerCase().includes(busca.toLowerCase())
      })
    )
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'mensalidades', label: 'Mensalidades', icon: Calendar },
    { id: 'carnes', label: 'Carnês/Parcelas', icon: Receipt },
    { id: 'convites', label: 'Convites', icon: Ticket },
    { id: 'contas', label: 'Contas a Pagar', icon: FileText },
    { id: 'compras', label: 'Compras', icon: ShoppingCart },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-green-600" />
            Financeiro
          </h1>
          <p className="text-muted-foreground">Gestão financeira centralizada</p>
        </div>
        <Button variant="outline" onClick={carregarDados}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
              tab === t.id 
                ? 'bg-white shadow text-green-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {/* Cards Principais */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Receita do Mês</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.receitaMes)}</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Despesas do Mês</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.despesaMes)}</p>
                  </div>
                  <TrendingDown className="h-10 w-10 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">A Receber</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.aReceber)}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">A Pagar</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats.aPagar)}</p>
                  </div>
                  <CreditCard className="h-10 w-10 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cards Secundários */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.mensalidadesPagas}</p>
                  <p className="text-sm text-muted-foreground">Mensalidades Pagas</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Receipt className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.parcelasPagas}</p>
                  <p className="text-sm text-muted-foreground">Parcelas Pagas</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Ticket className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.convitesMes}</p>
                  <p className="text-sm text-muted-foreground">Convites no Mês</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inadimplentes}</p>
                  <p className="text-sm text-muted-foreground">Inadimplentes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Saldo */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground">Saldo do Mês (Receitas - Despesas)</p>
                  <p className={`text-4xl font-bold ${stats.receitaMes - stats.despesaMes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.receitaMes - stats.despesaMes)}
                  </p>
                </div>
                <PiggyBank className={`h-16 w-16 ${stats.receitaMes - stats.despesaMes >= 0 ? 'text-green-200' : 'text-red-200'}`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mensalidades */}
      {tab === 'mensalidades' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou número do título..."
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
              <option value="todos">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="pago">Pagos</option>
              <option value="atrasado">Atrasados</option>
            </select>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Associado</th>
                    <th className="text-left p-3 font-medium">Referência</th>
                    <th className="text-left p-3 font-medium">Valor</th>
                    <th className="text-left p-3 font-medium">Vencimento</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarPorBusca(mensalidades, ['associado.nome', 'associado.numero_titulo', 'referencia']).map(m => (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{m.associado?.nome || '-'}</div>
                        <div className="text-sm text-muted-foreground">{m.associado?.numero_titulo}</div>
                      </td>
                      <td className="p-3">{m.referencia}</td>
                      <td className="p-3 font-medium">{formatCurrency(m.valor)}</td>
                      <td className="p-3">{formatDate(m.data_vencimento)}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(m.status)}`}>
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {m.status !== 'pago' && (
                          <Button 
                            size="sm" 
                            onClick={() => marcarComoPago('mensalidades', m.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {mensalidades.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma mensalidade encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Carnês/Parcelas */}
      {tab === 'carnes' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome ou número do título..."
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
              <option value="todos">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="pago">Pagos</option>
            </select>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/carnes'}>
              <Plus className="h-4 w-4 mr-2" />
              Gerar Carnê
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Associado</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Parcela</th>
                    <th className="text-left p-3 font-medium">Valor</th>
                    <th className="text-left p-3 font-medium">Vencimento</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarPorBusca(parcelas, ['associado.nome', 'associado.numero_titulo', 'carne.descricao']).map(p => (
                    <tr key={p.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{p.associado?.nome || '-'}</div>
                        <div className="text-sm text-muted-foreground">{p.associado?.numero_titulo}</div>
                      </td>
                      <td className="p-3">{p.carne?.descricao || '-'}</td>
                      <td className="p-3">#{p.numero_parcela}</td>
                      <td className="p-3 font-medium">{formatCurrency(p.valor)}</td>
                      <td className="p-3">{formatDate(p.data_vencimento)}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(p.status)}`}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {p.status !== 'pago' && (
                          <Button 
                            size="sm" 
                            onClick={() => marcarComoPago('parcelas_carne', p.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {parcelas.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma parcela encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Convites */}
      {tab === 'convites' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome do convidado ou associado..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/convites'}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Convite
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Convidado</th>
                    <th className="text-left p-3 font-medium">Associado Responsável</th>
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Valor Pago</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarPorBusca(convites, ['convidado_nome', 'associado.nome']).map(c => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{c.convidado_nome}</td>
                      <td className="p-3">
                        <div>{c.associado?.nome || '-'}</div>
                        <div className="text-sm text-muted-foreground">{c.associado?.numero_titulo}</div>
                      </td>
                      <td className="p-3">{formatDate(c.data_validade)}</td>
                      <td className="p-3 font-medium text-green-600">{formatCurrency(c.valor_pago)}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${
                          c.status === 'utilizado' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {convites.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum convite encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contas a Pagar */}
      {tab === 'contas' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por descrição ou fornecedor..."
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
              <option value="todos">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="pago">Pagos</option>
              <option value="atrasado">Atrasados</option>
            </select>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Descrição</th>
                    <th className="text-left p-3 font-medium">Fornecedor</th>
                    <th className="text-left p-3 font-medium">Categoria</th>
                    <th className="text-left p-3 font-medium">Valor</th>
                    <th className="text-left p-3 font-medium">Vencimento</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-right p-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarPorBusca(contasPagar, ['descricao', 'fornecedor', 'categoria']).map(c => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{c.descricao}</td>
                      <td className="p-3">{c.fornecedor}</td>
                      <td className="p-3 capitalize">{c.categoria}</td>
                      <td className="p-3 font-medium text-red-600">{formatCurrency(c.valor)}</td>
                      <td className="p-3">{formatDate(c.data_vencimento)}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(c.status)}`}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {c.status !== 'pago' && (
                          <Button 
                            size="sm" 
                            onClick={() => marcarComoPago('contas_pagar', c.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {contasPagar.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma conta encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compras */}
      {tab === 'compras' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por descrição ou fornecedor..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/compras'}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Compra
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Descrição</th>
                    <th className="text-left p-3 font-medium">Fornecedor</th>
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Valor Total</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrarPorBusca(compras, ['descricao', 'fornecedor']).map(c => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{c.descricao}</td>
                      <td className="p-3">{c.fornecedor}</td>
                      <td className="p-3">{formatDate(c.data_compra)}</td>
                      <td className="p-3 font-medium">{formatCurrency(c.valor_total)}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(c.status)}`}>
                          {c.status?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {compras.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma compra encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
