'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { PaginaProtegida } from '@/components/ui/permissao'
import { 
  FileText, Users, DollarSign, Calendar, Download, Printer, 
  TrendingUp, TrendingDown, BarChart3, PieChart, UserCheck,
  AlertTriangle, CreditCard, ShoppingCart, Vote
} from 'lucide-react'

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
const formatDate = (date: string) => date ? new Date(date).toLocaleDateString('pt-BR') : '-'

export default function RelatoriosPage() {
  const [tab, setTab] = useState<'associados' | 'financeiro' | 'acessos' | 'geral'>('associados')
  const [periodo, setPeriodo] = useState({ inicio: '', fim: '' })
  const [loading, setLoading] = useState(false)
  const [dados, setDados] = useState<any>(null)
  const supabase = createClientComponentClient()

  // Stats gerais
  const [stats, setStats] = useState({
    totalAssociados: 0,
    associadosAtivos: 0,
    associadosInativos: 0,
    totalDependentes: 0,
    mensalidadesPendentes: 0,
    mensalidadesAtrasadas: 0,
    receitaMes: 0,
    inadimplencia: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    // Associados
    const { count: totalAssociados } = await supabase.from('associados').select('*', { count: 'exact', head: true })
    const { count: associadosAtivos } = await supabase.from('associados').select('*', { count: 'exact', head: true }).eq('status', 'ativo')
    const { count: associadosInativos } = await supabase.from('associados').select('*', { count: 'exact', head: true }).neq('status', 'ativo')
    const { count: totalDependentes } = await supabase.from('dependentes').select('*', { count: 'exact', head: true })

    // Financeiro
    const { count: mensalidadesPendentes } = await supabase.from('mensalidades').select('*', { count: 'exact', head: true }).eq('status', 'pendente')
    const { count: mensalidadesAtrasadas } = await supabase.from('mensalidades').select('*', { count: 'exact', head: true }).eq('status', 'atrasado')
    
    const mesAtual = new Date().toISOString().slice(0, 7)
    const { data: receitaData } = await supabase
      .from('mensalidades')
      .select('valor')
      .eq('status', 'pago')
      .gte('data_pagamento', `${mesAtual}-01`)

    const receitaMes = receitaData?.reduce((acc, m) => acc + (m.valor || 0), 0) || 0

    setStats({
      totalAssociados: totalAssociados || 0,
      associadosAtivos: associadosAtivos || 0,
      associadosInativos: associadosInativos || 0,
      totalDependentes: totalDependentes || 0,
      mensalidadesPendentes: mensalidadesPendentes || 0,
      mensalidadesAtrasadas: mensalidadesAtrasadas || 0,
      receitaMes,
      inadimplencia: totalAssociados ? ((mensalidadesAtrasadas || 0) / totalAssociados * 100) : 0,
    })
  }

  const gerarRelatorioAssociados = async (tipo: string) => {
    setLoading(true)
    try {
      let query = supabase.from('associados').select('*')

      if (tipo === 'ativos') query = query.eq('status', 'ativo')
      if (tipo === 'inativos') query = query.neq('status', 'ativo')
      if (tipo === 'aniversariantes') {
        const mesAtual = new Date().getMonth() + 1
        // Busca todos e filtra no cliente
      }

      const { data, error } = await query.order('nome')
      if (error) throw error

      let resultado = data || []

      if (tipo === 'aniversariantes') {
        const mesAtual = new Date().getMonth() + 1
        resultado = resultado.filter(a => {
          if (!a.data_nascimento) return false
          const mes = new Date(a.data_nascimento).getMonth() + 1
          return mes === mesAtual
        })
      }

      setDados({ tipo: 'associados', subtipo: tipo, lista: resultado })
      toast.success(`${resultado.length} registros encontrados`)
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const gerarRelatorioFinanceiro = async (tipo: string) => {
    setLoading(true)
    try {
      let query = supabase.from('mensalidades').select('*, associados(nome, numero_titulo)')

      if (tipo === 'pendentes') query = query.eq('status', 'pendente')
      if (tipo === 'atrasados') query = query.eq('status', 'atrasado')
      if (tipo === 'pagos') query = query.eq('status', 'pago')

      if (periodo.inicio) query = query.gte('data_vencimento', periodo.inicio)
      if (periodo.fim) query = query.lte('data_vencimento', periodo.fim)

      const { data, error } = await query.order('data_vencimento', { ascending: false })
      if (error) throw error

      setDados({ tipo: 'financeiro', subtipo: tipo, lista: data || [] })
      toast.success(`${data?.length || 0} registros encontrados`)
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const gerarRelatorioAcessos = async () => {
    setLoading(true)
    try {
      let query = supabase.from('registros_acesso').select('*, associados(nome, numero_titulo), pontos_acesso(nome)')

      if (periodo.inicio) query = query.gte('data_hora', periodo.inicio)
      if (periodo.fim) query = query.lte('data_hora', periodo.fim + 'T23:59:59')

      const { data, error } = await query.order('data_hora', { ascending: false }).limit(500)
      if (error) throw error

      setDados({ tipo: 'acessos', lista: data || [] })
      toast.success(`${data?.length || 0} registros encontrados`)
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const imprimir = () => window.print()

  const exportarCSV = () => {
    if (!dados?.lista?.length) {
      toast.error('Nenhum dado para exportar')
      return
    }

    let csv = ''
    const lista = dados.lista

    if (dados.tipo === 'associados') {
      csv = 'Nome,CPF,Título,Status,Plano,Telefone,Email\n'
      lista.forEach((a: any) => {
        csv += `"${a.nome}","${a.cpf || ''}","${a.numero_titulo || ''}","${a.status}","${a.plano}","${a.telefone || ''}","${a.email || ''}"\n`
      })
    } else if (dados.tipo === 'financeiro') {
      csv = 'Associado,Título,Referência,Valor,Vencimento,Status\n'
      lista.forEach((m: any) => {
        csv += `"${m.associados?.nome || ''}","${m.associados?.numero_titulo || ''}","${m.referencia}","${m.valor}","${m.data_vencimento}","${m.status}"\n`
      })
    } else if (dados.tipo === 'acessos') {
      csv = 'Data/Hora,Associado,Título,Local,Tipo,Resultado\n'
      lista.forEach((r: any) => {
        csv += `"${r.data_hora}","${r.associados?.nome || ''}","${r.associados?.numero_titulo || ''}","${r.pontos_acesso?.nome || ''}","${r.tipo}","${r.resultado}"\n`
      })
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `relatorio_${dados.tipo}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    toast.success('Arquivo CSV exportado!')
  }

  const tabs = [
    { id: 'associados', label: 'Associados', icon: Users },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
    { id: 'acessos', label: 'Acessos', icon: Calendar },
    { id: 'geral', label: 'Resumo Geral', icon: BarChart3 },
  ]

  return (
    <PaginaProtegida codigoPagina="relatorios">
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        {dados && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={imprimir}>
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="h-4 w-4 mr-2" />Exportar CSV
            </Button>
          </div>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4 print:hidden">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Associados Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.associadosAtivos}</div>
            <p className="text-xs text-muted-foreground">de {stats.totalAssociados} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Dependentes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDependentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Receita do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.receitaMes)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Inadimplência</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inadimplencia.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{stats.mensalidadesAtrasadas} atrasadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b print:hidden">
        {tabs.map((t) => (
          <button 
            key={t.id} 
            onClick={() => { setTab(t.id as any); setDados(null) }} 
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${tab === t.id ? 'border-primary text-primary' : 'border-transparent'}`}
          >
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das Tabs */}
      <div className="print:hidden">
        {/* Tab Associados */}
        {tab === 'associados' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => gerarRelatorioAssociados('todos')}>
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Todos os Associados</p>
                <p className="text-sm text-muted-foreground">Lista completa</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => gerarRelatorioAssociados('ativos')}>
              <CardContent className="pt-6 text-center">
                <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Associados Ativos</p>
                <p className="text-sm text-muted-foreground">{stats.associadosAtivos} registros</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => gerarRelatorioAssociados('inativos')}>
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="font-medium">Inativos/Suspensos</p>
                <p className="text-sm text-muted-foreground">{stats.associadosInativos} registros</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => gerarRelatorioAssociados('aniversariantes')}>
              <CardContent className="pt-6 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <p className="font-medium">Aniversariantes do Mês</p>
                <p className="text-sm text-muted-foreground">Mês atual</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Financeiro */}
        {tab === 'financeiro' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtro por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div>
                    <Label>Data Início</Label>
                    <Input type="date" value={periodo.inicio} onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })} />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input type="date" value={periodo.fim} onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => gerarRelatorioFinanceiro('todos')}>
                <CardContent className="pt-6 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Todas Mensalidades</p>
                  <p className="text-sm text-muted-foreground">Lista completa</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => gerarRelatorioFinanceiro('pendentes')}>
                <CardContent className="pt-6 text-center">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="font-medium">Pendentes</p>
                  <p className="text-sm text-muted-foreground">{stats.mensalidadesPendentes} registros</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => gerarRelatorioFinanceiro('atrasados')}>
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="font-medium">Atrasados</p>
                  <p className="text-sm text-muted-foreground">{stats.mensalidadesAtrasadas} registros</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => gerarRelatorioFinanceiro('pagos')}>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="font-medium">Pagos</p>
                  <p className="text-sm text-muted-foreground">No período</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab Acessos */}
        {tab === 'acessos' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Filtro por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div>
                    <Label>Data Início</Label>
                    <Input type="date" value={periodo.inicio} onChange={(e) => setPeriodo({ ...periodo, inicio: e.target.value })} />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input type="date" value={periodo.fim} onChange={(e) => setPeriodo({ ...periodo, fim: e.target.value })} />
                  </div>
                  <Button onClick={gerarRelatorioAcessos} disabled={loading}>
                    {loading ? 'Gerando...' : 'Gerar Relatório'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Resumo Geral */}
        {tab === 'geral' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Associados por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Ativos</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div className="bg-green-500 h-3 rounded-full" style={{ width: `${stats.totalAssociados ? (stats.associadosAtivos / stats.totalAssociados * 100) : 0}%` }} />
                      </div>
                      <span className="font-medium">{stats.associadosAtivos}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Inativos/Outros</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-3">
                        <div className="bg-red-500 h-3 rounded-full" style={{ width: `${stats.totalAssociados ? (stats.associadosInativos / stats.totalAssociados * 100) : 0}%` }} />
                      </div>
                      <span className="font-medium">{stats.associadosInativos}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Situação Financeira</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Mensalidades Pendentes</span>
                    <span className="font-medium text-yellow-600">{stats.mensalidadesPendentes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mensalidades Atrasadas</span>
                    <span className="font-medium text-red-600">{stats.mensalidadesAtrasadas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Receita do Mês</span>
                    <span className="font-medium text-green-600">{formatCurrency(stats.receitaMes)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Taxa de Inadimplência</span>
                    <span className="font-bold text-red-600">{stats.inadimplencia.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Resultado do Relatório */}
      {dados && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              Resultado: {dados.tipo === 'associados' ? 'Associados' : dados.tipo === 'financeiro' ? 'Financeiro' : 'Registros de Acesso'}
              {dados.subtipo && ` - ${dados.subtipo}`}
            </CardTitle>
            <CardDescription>{dados.lista?.length || 0} registros encontrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {dados.tipo === 'associados' && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Nome</th>
                      <th className="text-left py-2 px-3">CPF</th>
                      <th className="text-left py-2 px-3">Título</th>
                      <th className="text-left py-2 px-3">Plano</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-left py-2 px-3">Telefone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.lista?.map((a: any) => (
                      <tr key={a.id} className="border-b">
                        <td className="py-2 px-3 font-medium">{a.nome}</td>
                        <td className="py-2 px-3">{a.cpf || '-'}</td>
                        <td className="py-2 px-3">{a.numero_titulo || '-'}</td>
                        <td className="py-2 px-3 capitalize">{a.plano}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${a.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="py-2 px-3">{a.telefone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {dados.tipo === 'financeiro' && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Associado</th>
                      <th className="text-left py-2 px-3">Título</th>
                      <th className="text-left py-2 px-3">Referência</th>
                      <th className="text-right py-2 px-3">Valor</th>
                      <th className="text-left py-2 px-3">Vencimento</th>
                      <th className="text-left py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.lista?.map((m: any) => (
                      <tr key={m.id} className="border-b">
                        <td className="py-2 px-3 font-medium">{m.associados?.nome || '-'}</td>
                        <td className="py-2 px-3">{m.associados?.numero_titulo || '-'}</td>
                        <td className="py-2 px-3">{m.referencia}</td>
                        <td className="py-2 px-3 text-right">{formatCurrency(m.valor)}</td>
                        <td className="py-2 px-3">{formatDate(m.data_vencimento)}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            m.status === 'pago' ? 'bg-green-100 text-green-800' : 
                            m.status === 'atrasado' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {dados.tipo === 'acessos' && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Data/Hora</th>
                      <th className="text-left py-2 px-3">Associado</th>
                      <th className="text-left py-2 px-3">Título</th>
                      <th className="text-left py-2 px-3">Local</th>
                      <th className="text-left py-2 px-3">Tipo</th>
                      <th className="text-left py-2 px-3">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.lista?.map((r: any) => (
                      <tr key={r.id} className="border-b">
                        <td className="py-2 px-3">{new Date(r.data_hora).toLocaleString('pt-BR')}</td>
                        <td className="py-2 px-3 font-medium">{r.associados?.nome || '-'}</td>
                        <td className="py-2 px-3">{r.associados?.numero_titulo || '-'}</td>
                        <td className="py-2 px-3">{r.pontos_acesso?.nome || '-'}</td>
                        <td className="py-2 px-3 capitalize">{r.tipo}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${r.resultado === 'liberado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {r.resultado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
    </PaginaProtegida>
  )
}
