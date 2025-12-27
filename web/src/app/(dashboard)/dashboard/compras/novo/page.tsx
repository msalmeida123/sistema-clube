'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Save, Plus, Trash2, Trophy } from 'lucide-react'
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

const gerarId = () => Math.random().toString(36).substring(2, 9)

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(false)
  
  const [form, setForm] = useState({
    descricao: '',
    categoria: 'manutencao',
    observacoes: '',
  })

  const [itens, setItens] = useState<Item[]>([
    {
      id: gerarId(),
      produto: '',
      quantidade: 1,
      unidade: 'un',
      orcamento1_fornecedor: '',
      orcamento1_valor: 0,
      orcamento2_fornecedor: '',
      orcamento2_valor: 0,
      orcamento3_fornecedor: '',
      orcamento3_valor: 0,
    }
  ])

  const adicionarItem = () => {
    setItens([...itens, {
      id: gerarId(),
      produto: '',
      quantidade: 1,
      unidade: 'un',
      orcamento1_fornecedor: '',
      orcamento1_valor: 0,
      orcamento2_fornecedor: '',
      orcamento2_valor: 0,
      orcamento3_fornecedor: '',
      orcamento3_valor: 0,
    }])
  }

  const removerItem = (id: string) => {
    if (itens.length === 1) {
      toast.error('O orçamento precisa ter pelo menos 1 item')
      return
    }
    setItens(itens.filter(i => i.id !== id))
  }

  const atualizarItem = (id: string, campo: string, valor: any) => {
    setItens(itens.map(i => i.id === id ? { ...i, [campo]: valor } : i))
  }

  const getMenorValor = (item: Item) => {
    const valores = [
      { fornecedor: item.orcamento1_fornecedor, valor: item.orcamento1_valor },
      { fornecedor: item.orcamento2_fornecedor, valor: item.orcamento2_valor },
      { fornecedor: item.orcamento3_fornecedor, valor: item.orcamento3_valor },
    ].filter(v => v.valor > 0)

    if (valores.length === 0) return null
    return valores.reduce((min, v) => v.valor < min.valor ? v : min)
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

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.descricao) {
      toast.error('Informe a descrição do orçamento')
      return
    }

    if (itens.some(i => !i.produto)) {
      toast.error('Preencha o nome de todos os produtos')
      return
    }

    const temOrcamento = itens.some(i => i.orcamento1_valor > 0 || i.orcamento2_valor > 0 || i.orcamento3_valor > 0)
    if (!temOrcamento) {
      toast.error('Preencha pelo menos um orçamento')
      return
    }

    setLoading(true)

    try {
      const melhor = getMelhorOrcamento()
      const numero = `ORC-${Date.now().toString().slice(-8)}`

      // Criar orçamento
      const { data: orcamento, error: orcError } = await supabase
        .from('orcamentos_compra')
        .insert({
          numero,
          descricao: form.descricao,
          categoria: form.categoria,
          observacoes: form.observacoes,
          status: 'pendente',
          valor_total: melhor?.total || 0,
          fornecedor_escolhido: melhor?.fornecedor || null,
        })
        .select()
        .single()

      if (orcError) throw orcError

      // Criar itens
      const itensParaSalvar = itens.map(item => ({
        orcamento_id: orcamento.id,
        produto: item.produto,
        quantidade: item.quantidade,
        unidade: item.unidade,
        orcamento1_fornecedor: item.orcamento1_fornecedor,
        orcamento1_valor: item.orcamento1_valor,
        orcamento2_fornecedor: item.orcamento2_fornecedor,
        orcamento2_valor: item.orcamento2_valor,
        orcamento3_fornecedor: item.orcamento3_fornecedor,
        orcamento3_valor: item.orcamento3_valor,
      }))

      const { error: itensError } = await supabase
        .from('orcamento_itens')
        .insert(itensParaSalvar)

      if (itensError) throw itensError

      toast.success('Orçamento criado com sucesso!')
      router.push('/dashboard/compras')
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const melhorOrcamento = getMelhorOrcamento()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/compras">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">Novo Orçamento de Compra</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Orçamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Descrição *</Label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Material de limpeza para piscina"
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <select
                  className="w-full h-10 border rounded-md px-3"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                >
                  <option value="manutencao">Manutenção</option>
                  <option value="limpeza">Limpeza</option>
                  <option value="escritorio">Escritório</option>
                  <option value="esportes">Esportes</option>
                  <option value="eventos">Eventos</option>
                  <option value="alimentacao">Alimentação</option>
                  <option value="equipamentos">Equipamentos</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Input
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Itens com 3 Orçamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Itens e Orçamentos</CardTitle>
            <CardDescription>
              Adicione os produtos e preencha os valores de até 3 fornecedores diferentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {itens.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Item {index + 1}</h4>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removerItem(item.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                {/* Dados do Produto */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label>Produto *</Label>
                    <Input
                      value={item.produto}
                      onChange={(e) => atualizarItem(item.id, 'produto', e.target.value)}
                      placeholder="Nome do produto"
                    />
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => atualizarItem(item.id, 'quantidade', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <select
                      className="w-full h-10 border rounded-md px-3"
                      value={item.unidade}
                      onChange={(e) => atualizarItem(item.id, 'unidade', e.target.value)}
                    >
                      <option value="un">Unidade</option>
                      <option value="cx">Caixa</option>
                      <option value="pc">Pacote</option>
                      <option value="kg">Kg</option>
                      <option value="lt">Litro</option>
                      <option value="mt">Metro</option>
                      <option value="m2">m²</option>
                    </select>
                  </div>
                </div>

                {/* 3 Orçamentos */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Orçamento 1 */}
                  <div className={`p-3 rounded-lg border-2 ${melhorOrcamento?.num === 1 && item.orcamento1_valor > 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600">Orçamento 1</span>
                      {getMenorValor(item)?.valor === item.orcamento1_valor && item.orcamento1_valor > 0 && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Fornecedor"
                        value={item.orcamento1_fornecedor}
                        onChange={(e) => atualizarItem(item.id, 'orcamento1_fornecedor', e.target.value)}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Valor unit."
                        value={item.orcamento1_valor || ''}
                        onChange={(e) => atualizarItem(item.id, 'orcamento1_valor', parseFloat(e.target.value) || 0)}
                      />
                      {item.orcamento1_valor > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Total: {formatCurrency(item.orcamento1_valor * item.quantidade)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Orçamento 2 */}
                  <div className={`p-3 rounded-lg border-2 ${melhorOrcamento?.num === 2 && item.orcamento2_valor > 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-purple-600">Orçamento 2</span>
                      {getMenorValor(item)?.valor === item.orcamento2_valor && item.orcamento2_valor > 0 && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Fornecedor"
                        value={item.orcamento2_fornecedor}
                        onChange={(e) => atualizarItem(item.id, 'orcamento2_fornecedor', e.target.value)}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Valor unit."
                        value={item.orcamento2_valor || ''}
                        onChange={(e) => atualizarItem(item.id, 'orcamento2_valor', parseFloat(e.target.value) || 0)}
                      />
                      {item.orcamento2_valor > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Total: {formatCurrency(item.orcamento2_valor * item.quantidade)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Orçamento 3 */}
                  <div className={`p-3 rounded-lg border-2 ${melhorOrcamento?.num === 3 && item.orcamento3_valor > 0 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-orange-600">Orçamento 3</span>
                      {getMenorValor(item)?.valor === item.orcamento3_valor && item.orcamento3_valor > 0 && (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Fornecedor"
                        value={item.orcamento3_fornecedor}
                        onChange={(e) => atualizarItem(item.id, 'orcamento3_fornecedor', e.target.value)}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Valor unit."
                        value={item.orcamento3_valor || ''}
                        onChange={(e) => atualizarItem(item.id, 'orcamento3_valor', parseFloat(e.target.value) || 0)}
                      />
                      {item.orcamento3_valor > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Total: {formatCurrency(item.orcamento3_valor * item.quantidade)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={adicionarItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />Adicionar Item
            </Button>
          </CardContent>
        </Card>

        {/* Resumo dos Totais */}
        <Card>
          <CardHeader>
            <CardTitle>Comparativo de Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg text-center ${melhorOrcamento?.num === 1 ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50'}`}>
                <p className="text-sm text-muted-foreground">Orçamento 1</p>
                <p className="text-xl font-bold">{formatCurrency(getTotalOrcamento(1))}</p>
                {itens[0]?.orcamento1_fornecedor && (
                  <p className="text-xs text-muted-foreground">{itens[0].orcamento1_fornecedor}</p>
                )}
                {melhorOrcamento?.num === 1 && (
                  <span className="inline-flex items-center gap-1 mt-2 text-green-600 text-sm">
                    <Trophy className="h-4 w-4" /> Menor Preço
                  </span>
                )}
              </div>
              <div className={`p-4 rounded-lg text-center ${melhorOrcamento?.num === 2 ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50'}`}>
                <p className="text-sm text-muted-foreground">Orçamento 2</p>
                <p className="text-xl font-bold">{formatCurrency(getTotalOrcamento(2))}</p>
                {itens[0]?.orcamento2_fornecedor && (
                  <p className="text-xs text-muted-foreground">{itens[0].orcamento2_fornecedor}</p>
                )}
                {melhorOrcamento?.num === 2 && (
                  <span className="inline-flex items-center gap-1 mt-2 text-green-600 text-sm">
                    <Trophy className="h-4 w-4" /> Menor Preço
                  </span>
                )}
              </div>
              <div className={`p-4 rounded-lg text-center ${melhorOrcamento?.num === 3 ? 'bg-green-100 border-2 border-green-500' : 'bg-gray-50'}`}>
                <p className="text-sm text-muted-foreground">Orçamento 3</p>
                <p className="text-xl font-bold">{formatCurrency(getTotalOrcamento(3))}</p>
                {itens[0]?.orcamento3_fornecedor && (
                  <p className="text-xs text-muted-foreground">{itens[0].orcamento3_fornecedor}</p>
                )}
                {melhorOrcamento?.num === 3 && (
                  <span className="inline-flex items-center gap-1 mt-2 text-green-600 text-sm">
                    <Trophy className="h-4 w-4" /> Menor Preço
                  </span>
                )}
              </div>
            </div>

            {melhorOrcamento && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-800">
                  <Trophy className="h-5 w-5 inline mr-2" />
                  <strong>Melhor opção: {melhorOrcamento.fornecedor || `Orçamento ${melhorOrcamento.num}`}</strong>
                  {' - '}Economia de {formatCurrency(Math.max(getTotalOrcamento(1), getTotalOrcamento(2), getTotalOrcamento(3)) - melhorOrcamento.total)} em relação ao maior valor
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-4">
          <Link href="/dashboard/compras" className="flex-1">
            <Button type="button" variant="outline" className="w-full">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Orçamento'}
          </Button>
        </div>
      </form>
    </div>
  )
}
