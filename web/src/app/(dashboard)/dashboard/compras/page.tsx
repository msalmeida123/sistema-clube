'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { PaginaProtegida, ComPermissao } from '@/components/ui/permissao'
import { Plus, Search, Eye, Trash2, CheckCircle, Clock, XCircle, ShoppingCart, FileText } from 'lucide-react'
import Link from 'next/link'

type Orcamento = {
  id: string
  numero: string
  descricao: string
  categoria: string
  status: string
  data_criacao: string
  data_aprovacao: string | null
  aprovado_por: string | null
  valor_total: number
  fornecedor_escolhido: string | null
  itens?: any[]
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
const formatDate = (date: string) => date ? new Date(date).toLocaleDateString('pt-BR') : '-'

export default function ComprasPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchOrcamentos()
  }, [filtroStatus])

  const fetchOrcamentos = async () => {
    setLoading(true)
    let query = supabase
      .from('orcamentos_compra')
      .select('*, orcamento_itens(*)')
      .order('data_criacao', { ascending: false })
    
    if (filtroStatus !== 'todos') {
      query = query.eq('status', filtroStatus)
    }

    const { data, error } = await query.limit(100)
    
    if (error) {
      console.error('Erro:', error)
    } else {
      setOrcamentos(data || [])
    }
    setLoading(false)
  }

  const excluirOrcamento = async (id: string) => {
    if (!confirm('Deseja excluir este orçamento?')) return
    
    const { error } = await supabase.from('orcamentos_compra').delete().eq('id', id)
    if (error) {
      toast.error('Erro ao excluir')
    } else {
      toast.success('Orçamento excluído!')
      fetchOrcamentos()
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; icon: any; label: string }> = {
      pendente: { bg: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      aprovado: { bg: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aprovado' },
      reprovado: { bg: 'bg-red-100 text-red-800', icon: XCircle, label: 'Reprovado' },
      comprado: { bg: 'bg-blue-100 text-blue-800', icon: ShoppingCart, label: 'Comprado' },
    }
    const c = config[status] || config.pendente
    const Icon = c.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.bg}`}>
        <Icon className="h-3 w-3" />{c.label}
      </span>
    )
  }

  const stats = {
    total: orcamentos.length,
    pendentes: orcamentos.filter(o => o.status === 'pendente').length,
    aprovados: orcamentos.filter(o => o.status === 'aprovado').length,
    valorTotal: orcamentos.filter(o => o.status === 'aprovado').reduce((acc, o) => acc + (o.valor_total || 0), 0)
  }

  const orcamentosFiltrados = orcamentos.filter(o => 
    busca === '' || 
    o.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
    o.numero?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <PaginaProtegida codigoPagina="compras">
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Compras e Orçamentos</h1>
        <ComPermissao codigoPagina="compras" acao="criar">
          <Link href="/dashboard/compras/novo">
            <Button><Plus className="h-4 w-4 mr-2" />Novo Orçamento</Button>
          </Link>
        </ComPermissao>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aprovados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Valor Aprovado</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.valorTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-10" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <select 
          value={filtroStatus} 
          onChange={(e) => setFiltroStatus(e.target.value)} 
          className="h-10 border rounded-md px-3"
        >
          <option value="todos">Todos os Status</option>
          <option value="pendente">Pendente</option>
          <option value="aprovado">Aprovado</option>
          <option value="reprovado">Reprovado</option>
          <option value="comprado">Comprado</option>
        </select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-center py-8">Carregando...</p>
          ) : orcamentosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
              <Link href="/dashboard/compras/novo">
                <Button className="mt-4"><Plus className="h-4 w-4 mr-2" />Criar Orçamento</Button>
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Número</th>
                  <th className="text-left py-3 px-4">Descrição</th>
                  <th className="text-left py-3 px-4">Categoria</th>
                  <th className="text-left py-3 px-4">Itens</th>
                  <th className="text-left py-3 px-4">Melhor Preço</th>
                  <th className="text-left py-3 px-4">Data</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamentosFiltrados.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-sm">{o.numero}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{o.descricao}</p>
                      {o.fornecedor_escolhido && (
                        <p className="text-xs text-green-600">Fornecedor: {o.fornecedor_escolhido}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize">{o.categoria?.replace('_', ' ')}</td>
                    <td className="py-3 px-4">{o.itens?.length || 0} itens</td>
                    <td className="py-3 px-4 font-medium">{formatCurrency(o.valor_total)}</td>
                    <td className="py-3 px-4">{formatDate(o.data_criacao)}</td>
                    <td className="py-3 px-4">{getStatusBadge(o.status)}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <Link href={`/dashboard/compras/${o.id}`}>
                          <Button size="sm" variant="outline"><Eye className="h-3 w-3" /></Button>
                        </Link>
                        <ComPermissao codigoPagina="compras" acao="excluir">
                          {o.status === 'pendente' && (
                            <Button size="sm" variant="ghost" onClick={() => excluirOrcamento(o.id)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          )}
                        </ComPermissao>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
    </PaginaProtegida>
  )
}
