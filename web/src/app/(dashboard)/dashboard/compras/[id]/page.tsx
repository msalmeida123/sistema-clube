'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle, XCircle, ShoppingCart, Trophy, Printer, Clock, FileText } from 'lucide-react'
import Link from 'next/link'

type Item = {
  id: string
  produto: string
  quantidade: number
  unidade: string
  orcamento1_fornecedor: string
  orcamento1_valor: number
  orcamento2_fornecedor: string
  orcamento2_valor: number
  orcamento3_fornecedor: string
  orcamento3_valor: number
}

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
  observacoes: string
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
const formatDate = (date: string) => date ? new Date(date).toLocaleDateString('pt-BR') : '-'

export default function OrcamentoDetalhesPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchOrcamento()
  }, [id])

  const fetchOrcamento = async () => {
    const { data: orc } = await supabase
      .from('orcamentos_compra')
      .select('*')
      .eq('id', id)
      .single()

    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)

    setOrcamento(orc)
    setItens(itensData || [])
    setLoading(false)
  }

  const getTotalOrcamento = (num: 1 | 2 | 3) => {
    return itens.reduce((acc, item) => {
      const valor = num === 1 ? item.orcamento1_valor : num === 2 ? item.orcamento2_valor : item.orcamento3_valor
      return acc + (valor * item.quantidade)
    }, 0)
  }

  const getMelhorOrcamento = () => {
    const totais = [
      { num: 1, total: getTotalOrcamento(1), fornecedor: itens[0]?.orcamento1_fornecedor },
      { num: 2, total: getTotalOrcamento(2), fornecedor: itens[0]?.orcamento2_fornecedor },
      { num: 3, total: getTotalOrcamento(3), fornecedor: itens[0]?.orcamento3_fornecedor },
    ].filter(t => t.total > 0)

    if (totais.length === 0) return null
    return totais.reduce((min, t) => t.total < min.total ? t : min)
  }

  const aprovarOrcamento = async (fornecedorNum: 1 | 2 | 3) => {
    setActionLoading(true)
    const total = getTotalOrcamento(fornecedorNum)
    const fornecedor = fornecedorNum === 1 
      ? itens[0]?.orcamento1_fornecedor 
      : fornecedorNum === 2 
        ? itens[0]?.orcamento2_fornecedor 
        : itens[0]?.orcamento3_fornecedor

    const { error } = await supabase
      .from('orcamentos_compra')
      .update({
        status: 'aprovado',
        data_aprovacao: new Date().toISOString(),
        valor_total: total,
        fornecedor_escolhido: fornecedor,
      })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao aprovar')
    } else {
      toast.success(`Orçamento aprovado! Fornecedor: ${fornecedor || `Orçamento ${fornecedorNum}`}`)
      fetchOrcamento()
    }
    setActionLoading(false)
  }

  const reprovarOrcamento = async () => {
    if (!confirm('Deseja reprovar este orçamento?')) return
    setActionLoading(true)
    const { error } = await supabase
      .from('orcamentos_compra')
      .update({ status: 'reprovado' })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao reprovar')
    } else {
      toast.success('Orçamento reprovado')
      fetchOrcamento()
    }
    setActionLoading(false)
  }

  const marcarComoComprado = async () => {
    setActionLoading(true)
    const { error } = await supabase
      .from('orcamentos_compra')
      .update({ status: 'comprado' })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao atualizar')
    } else {
      toast.success('Marcado como comprado!')
      fetchOrcamento()
    }
    setActionLoading(false)
  }

  const imprimir = () => window.print()

  if (loading) {
    return <div className="flex justify-center p-8">Carregando...</div>
  }

  if (!orcamento) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Orçamento não encontrado</p>
        <Link href="/dashboard/compras">
          <Button className="mt-4">Voltar</Button>
        </Link>
      </div>
    )
  }

  const melhor = getMelhorOrcamento()

  const getStatusConfig = (status: string) => {
    const config: Record<string, { bg: string; icon: any; label: string }> = {
      pendente: { bg: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, label: 'Pendente de Aprovação' },
      aprovado: { bg: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, label: 'Aprovado' },
      reprovado: { bg: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, label: 'Reprovado' },
      comprado: { bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: ShoppingCart, label: 'Comprado' },
    }
    return config[status] || config.pendente
  }

  const statusConfig = getStatusConfig(orcamento.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/compras">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Orçamento {orcamento.numero}</h1>
            <p className="text-muted-foreground">{orcamento.descricao}</p>
          </div>
        </div>
        <Button variant="outline" onClick={imprimir}>
          <Printer className="h-4 w-4 mr-2" />Imprimir
        </Button>
      </div>

      {/* Status Banner */}
      <Card className={`border-2 ${statusConfig.bg}`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className="h-8 w-8" />
              <div>
                <p className="font-bold text-lg">{statusConfig.label}</p>
                {orcamento.status === 'aprovado' && orcamento.fornecedor_escolhido && (
                  <p>Fornecedor: <strong>{orcamento.fornecedor_escolhido}</strong> - {formatCurrency(orcamento.valor_total)}</p>
                )}
                {orcamento.data_aprovacao && (
                  <p className="text-sm">Aprovado em: {formatDate(orcamento.data_aprovacao)}</p>
                )}
              </div>
            </div>
            {orcamento.status === 'aprovado' && (
              <Button onClick={marcarComoComprado} disabled={actionLoading}>
                <ShoppingCart className="h-4 w-4 mr-2" />Marcar como Comprado
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="grid grid-cols-4 gap-4 print:grid-cols-2">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Número</p>
            <p className="font-bold">{orcamento.numero}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Categoria</p>
            <p className="font-bold capitalize">{orcamento.categoria?.replace('_', ' ')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Data</p>
            <p className="font-bold">{formatDate(orcamento.data_criacao)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Itens</p>
            <p className="font-bold">{itens.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Comparativo de Totais */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Orçamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((num) => {
              const total = getTotalOrcamento(num as 1 | 2 | 3)
              const fornecedor = num === 1 
                ? itens[0]?.orcamento1_fornecedor 
                : num === 2 
                  ? itens[0]?.orcamento2_fornecedor 
                  : itens[0]?.orcamento3_fornecedor
              const isMelhor = melhor?.num === num && total > 0
              const isEscolhido = orcamento.fornecedor_escolhido === fornecedor && orcamento.status !== 'pendente'

              return (
                <div 
                  key={num}
                  className={`p-4 rounded-lg text-center border-2 ${
                    isEscolhido ? 'bg-green-100 border-green-500' : 
                    isMelhor ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className="text-sm font-medium mb-1">
                    {num === 1 ? '🔵' : num === 2 ? '🟣' : '🟠'} Orçamento {num}
                  </p>
                  <p className="font-bold text-lg">{fornecedor || '-'}</p>
                  <p className="text-2xl font-bold mt-2">{total > 0 ? formatCurrency(total) : '-'}</p>
                  
                  {isMelhor && total > 0 && (
                    <span className="inline-flex items-center gap-1 mt-2 text-yellow-600 text-sm">
                      <Trophy className="h-4 w-4" /> Menor Preço
                    </span>
                  )}
                  
                  {isEscolhido && (
                    <span className="inline-flex items-center gap-1 mt-2 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" /> Escolhido
                    </span>
                  )}

                  {orcamento.status === 'pendente' && total > 0 && (
                    <Button 
                      className="mt-3 w-full" 
                      size="sm"
                      variant={isMelhor ? 'default' : 'outline'}
                      onClick={() => aprovarOrcamento(num as 1 | 2 | 3)}
                      disabled={actionLoading}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />Aprovar Este
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Itens */}
      <Card>
        <CardHeader>
          <CardTitle>Itens do Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Produto</th>
                <th className="text-center py-2 px-3">Qtd</th>
                <th className="text-center py-2 px-3">Un</th>
                <th className="text-right py-2 px-3">Orç. 1</th>
                <th className="text-right py-2 px-3">Orç. 2</th>
                <th className="text-right py-2 px-3">Orç. 3</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item) => {
                const valores = [item.orcamento1_valor, item.orcamento2_valor, item.orcamento3_valor].filter(v => v > 0)
                const menor = valores.length > 0 ? Math.min(...valores) : 0

                return (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 px-3 font-medium">{item.produto}</td>
                    <td className="py-2 px-3 text-center">{item.quantidade}</td>
                    <td className="py-2 px-3 text-center">{item.unidade}</td>
                    <td className={`py-2 px-3 text-right ${item.orcamento1_valor === menor && menor > 0 ? 'text-green-600 font-bold' : ''}`}>
                      {item.orcamento1_valor > 0 ? formatCurrency(item.orcamento1_valor) : '-'}
                    </td>
                    <td className={`py-2 px-3 text-right ${item.orcamento2_valor === menor && menor > 0 ? 'text-green-600 font-bold' : ''}`}>
                      {item.orcamento2_valor > 0 ? formatCurrency(item.orcamento2_valor) : '-'}
                    </td>
                    <td className={`py-2 px-3 text-right ${item.orcamento3_valor === menor && menor > 0 ? 'text-green-600 font-bold' : ''}`}>
                      {item.orcamento3_valor > 0 ? formatCurrency(item.orcamento3_valor) : '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-50">
                <td colSpan={3} className="py-2 px-3">TOTAL</td>
                <td className="py-2 px-3 text-right">{formatCurrency(getTotalOrcamento(1))}</td>
                <td className="py-2 px-3 text-right">{formatCurrency(getTotalOrcamento(2))}</td>
                <td className="py-2 px-3 text-right">{formatCurrency(getTotalOrcamento(3))}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      {/* Ações */}
      {orcamento.status === 'pendente' && (
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button variant="destructive" onClick={reprovarOrcamento} disabled={actionLoading} className="flex-1">
                <XCircle className="h-4 w-4 mr-2" />Reprovar Orçamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {orcamento.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{orcamento.observacoes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
