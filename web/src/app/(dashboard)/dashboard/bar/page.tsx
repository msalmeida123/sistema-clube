'use client'

import { useState } from 'react'
import { ShoppingCart, CreditCard, Wallet, Banknote, QrCode, Gift, Plus, Minus, Trash2, Search, User, Receipt, RefreshCw, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBarProdutos, useCarrinho, useFinalizarVenda, useCarteirinhaSaldo, useEmitirNFCe } from '@/modules/bar/hooks/useBar'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import type { BarCategoria, BarProduto, FormasPagamentoBar, ItemCarrinho } from '@/modules/bar/types'

// Labels das formas de pagamento
const FORMAS_LABEL: Record<FormasPagamentoBar, string> = {
  dinheiro: 'Dinheiro',
  cartao_credito: 'Crédito',
  cartao_debito: 'Débito',
  pix: 'PIX',
  carteirinha: 'Carteirinha',
  cortesia: 'Cortesia'
}

const FORMAS_ICONE: Record<FormasPagamentoBar, React.ReactNode> = {
  dinheiro: <Banknote size={18} />,
  cartao_credito: <CreditCard size={18} />,
  cartao_debito: <CreditCard size={18} />,
  pix: <QrCode size={18} />,
  carteirinha: <Wallet size={18} />,
  cortesia: <Gift size={18} />
}

interface PagamentoModal {
  forma: FormasPagamentoBar
  valor: number
}

export default function BarPDVPage() {
  const { user } = useAuth()
  const { categorias, produtos, isLoading } = useBarProdutos(true)
  const { carrinho, adicionarItem, removerItem, alterarQuantidade, limparCarrinho, subtotal } = useCarrinho()
  const finalizarVenda = useFinalizarVenda()
  const emitirNFCe = useEmitirNFCe()

  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [associadoId, setAssociadoId] = useState('')
  const [associadoBusca, setAssociadoBusca] = useState('')
  const [pagamentos, setPagamentos] = useState<PagamentoModal[]>([])
  const [formaSelecionada, setFormaSelecionada] = useState<FormasPagamentoBar>('dinheiro')
  const [valorFormaPag, setValorFormaPag] = useState('')
  const [showPagamento, setShowPagamento] = useState(false)
  const [pedidoCriado, setPedidoCriado] = useState<string | null>(null)
  const [cpfNFCe, setCpfNFCe] = useState('')
  const [desconto, setDesconto] = useState(0)

  const { data: saldoCarteirinha } = useCarteirinhaSaldo(associadoId || undefined)

  // Produtos filtrados
  const produtosFiltrados = produtos.filter(p => {
    const matchCategoria = !categoriaAtiva || p.categoria_id === categoriaAtiva
    const matchBusca = !busca || p.nome.toLowerCase().includes(busca.toLowerCase())
    return matchCategoria && matchBusca
  })

  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0)
  const totalComDesconto = subtotal - desconto
  const restante = totalComDesconto - totalPago
  const troco = totalPago > totalComDesconto ? totalPago - totalComDesconto : 0

  function adicionarPagamento() {
    const valor = parseFloat(valorFormaPag)
    if (!valor || valor <= 0) return

    // Não pode exceder o total restante (exceto dinheiro — pode ter troco)
    const maxValor = formaSelecionada === 'dinheiro' ? valor : Math.min(valor, restante)

    // Verifica saldo da carteirinha
    if (formaSelecionada === 'carteirinha') {
      const saldo = saldoCarteirinha?.saldo ?? 0
      if (valor > saldo) {
        alert(`Saldo insuficiente. Disponível: R$ ${saldo.toFixed(2)}`)
        return
      }
    }

    setPagamentos(prev => {
      // Se já tem essa forma, substitui
      const existente = prev.findIndex(p => p.forma === formaSelecionada)
      if (existente >= 0) {
        const novo = [...prev]
        novo[existente] = { forma: formaSelecionada, valor: maxValor }
        return novo
      }
      return [...prev, { forma: formaSelecionada, valor: maxValor }]
    })
    setValorFormaPag('')
  }

  function removerPagamento(forma: FormasPagamentoBar) {
    setPagamentos(prev => prev.filter(p => p.forma !== forma))
  }

  async function handleFinalizar() {
    if (carrinho.length === 0) return
    if (restante > 0.01) {
      alert(`Falta pagar R$ ${restante.toFixed(2)}`)
      return
    }

    const payload = {
      associado_id: associadoId || undefined,
      itens: carrinho.map(item => ({
        produto_id: item.produto.id,
        produto_nome: item.produto.nome,
        produto_ncm: item.produto.ncm,
        produto_cfop: item.produto.cfop,
        produto_cst: item.produto.cst,
        produto_unidade: item.produto.unidade,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.subtotal
      })),
      pagamentos: pagamentos.map(p => ({
        forma_pagamento: p.forma,
        valor: p.valor,
        troco: p.forma === 'dinheiro' ? troco : 0
      })),
      subtotal,
      desconto,
      total: totalComDesconto
    }

    const pedido = await finalizarVenda.mutateAsync({ payload, operadorId: user?.id ?? '' })
    setPedidoCriado(pedido.id)
    setShowPagamento(false)
  }

  async function handleNovoPedido() {
    limparCarrinho()
    setPagamentos([])
    setAssociadoId('')
    setAssociadoBusca('')
    setDesconto(0)
    setPedidoCriado(null)
    setCpfNFCe('')
  }

  async function handleEmitirNFCe() {
    if (!pedidoCriado) return
    await emitirNFCe.mutateAsync({ pedidoId: pedidoCriado, cpfCnpj: cpfNFCe || undefined })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-96 text-gray-500">Carregando cardápio...</div>
  }

  // ── TELA DE SUCESSO ──────────────────────────────────────────
  if (pedidoCriado) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <Receipt className="text-green-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-green-600">Venda Finalizada!</h2>
        <p className="text-gray-500">Pedido registrado com sucesso</p>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <div className="flex gap-2">
            <Input
              placeholder="CPF/CNPJ para NF (opcional)"
              value={cpfNFCe}
              onChange={e => setCpfNFCe(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleEmitirNFCe}
              disabled={emitirNFCe.isPending}
              variant="outline"
              className="gap-2"
            >
              <Receipt size={16} />
              {emitirNFCe.isPending ? 'Emitindo...' : 'Emitir NFC-e'}
            </Button>
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.open(`/api/bar/comprovante?pedido_id=${pedidoCriado}`, '_blank')}
          >
            <Printer size={16} />
            Imprimir Comprovante
          </Button>

          <Button onClick={handleNovoPedido} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <RefreshCw size={18} />
            Nova Venda
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] gap-0 bg-gray-50">
      {/* ── LADO ESQUERDO: CARDÁPIO ─────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header cardápio */}
        <div className="bg-white border-b px-4 py-3 flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Buscar produto..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Categorias */}
        <div className="bg-white border-b px-4 py-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setCategoriaAtiva(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              !categoriaAtiva ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {categorias.filter(c => c.ativo).map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoriaAtiva(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                categoriaAtiva === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.nome}
            </button>
          ))}
        </div>

        {/* Grid de produtos */}
        <div className="flex-1 overflow-y-auto p-4">
          {produtosFiltrados.length === 0 ? (
            <div className="text-center text-gray-400 py-20">Nenhum produto encontrado</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {produtosFiltrados.map(produto => (
                <button
                  key={produto.id}
                  onClick={() => adicionarItem(produto)}
                  className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-blue-400 hover:shadow-md transition group"
                >
                  <div className="w-full aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-3xl overflow-hidden">
                    {produto.imagem_url ? (
                      <img src={produto.imagem_url} alt={produto.nome} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      getCategoriaEmoji(produto.categoria_nome)
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">{produto.nome}</p>
                  <p className="text-blue-600 font-bold mt-1">R$ {produto.preco.toFixed(2)}</p>
                  {produto.controla_estoque && (
                    <p className={`text-xs mt-1 ${(produto.estoque_atual ?? 0) <= (produto.estoque_minimo ?? 0) ? 'text-red-500' : 'text-gray-400'}`}>
                      Estoque: {produto.estoque_atual ?? 0}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LADO DIREITO: CARRINHO ──────────────────────────── */}
      <div className="w-96 bg-white border-l flex flex-col shadow-xl">
        {/* Associado */}
        <div className="px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-400" />
            <Input
              placeholder="CPF ou nome do associado (opcional)"
              value={associadoBusca}
              onChange={e => setAssociadoBusca(e.target.value)}
              className="text-sm h-8"
            />
          </div>
          {saldoCarteirinha && (
            <p className="text-xs text-green-600 mt-1 font-medium">
              💳 Saldo carteirinha: R$ {saldoCarteirinha.saldo.toFixed(2)}
            </p>
          )}
        </div>

        {/* Título carrinho */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart size={18} />
            Carrinho
            {carrinho.length > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {carrinho.length}
              </span>
            )}
          </h3>
          {carrinho.length > 0 && (
            <button onClick={limparCarrinho} className="text-red-400 hover:text-red-600 text-xs">
              Limpar
            </button>
          )}
        </div>

        {/* Itens do carrinho */}
        <div className="flex-1 overflow-y-auto">
          {carrinho.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2">
              <ShoppingCart size={48} />
              <p className="text-sm">Carrinho vazio</p>
            </div>
          ) : (
            <ul className="divide-y">
              {carrinho.map(item => (
                <li key={item.produto.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.produto.nome}</p>
                    <p className="text-xs text-gray-400">R$ {item.preco_unitario.toFixed(2)} un.</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => alterarQuantidade(item.produto.id, item.quantidade - 1)}
                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantidade}</span>
                    <button
                      onClick={() => adicionarItem(item.produto)}
                      className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removerItem(item.produto.id)}
                      className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 ml-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-gray-800 w-16 text-right">
                    R$ {item.subtotal.toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totais e pagamento */}
        <div className="border-t p-4 space-y-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>Desconto</span>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">R$</span>
              <input
                type="number"
                min={0}
                max={subtotal}
                value={desconto || ''}
                onChange={e => setDesconto(Math.min(parseFloat(e.target.value) || 0, subtotal))}
                className="w-20 text-right border rounded px-2 py-0.5 text-sm"
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="flex justify-between font-bold text-lg text-gray-800 pt-1 border-t">
            <span>Total</span>
            <span>R$ {totalComDesconto.toFixed(2)}</span>
          </div>

          {/* Área de pagamento */}
          {showPagamento ? (
            <div className="space-y-3">
              {/* Formas de pagamento */}
              <div className="grid grid-cols-3 gap-1">
                {(Object.keys(FORMAS_LABEL) as FormasPagamentoBar[]).map(forma => (
                  <button
                    key={forma}
                    onClick={() => {
                      setFormaSelecionada(forma)
                      if (forma !== 'dinheiro') {
                        setValorFormaPag(restante.toFixed(2))
                      }
                    }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium border transition ${
                      formaSelecionada === forma
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {FORMAS_ICONE[forma]}
                    {FORMAS_LABEL[forma]}
                  </button>
                ))}
              </div>

              {/* Valor */}
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Valor"
                  value={valorFormaPag}
                  onChange={e => setValorFormaPag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && adicionarPagamento()}
                />
                <Button onClick={adicionarPagamento} variant="outline">+</Button>
              </div>

              {/* Pagamentos adicionados */}
              {pagamentos.length > 0 && (
                <div className="space-y-1">
                  {pagamentos.map(p => (
                    <div key={p.forma} className="flex justify-between items-center text-sm bg-green-50 px-3 py-1.5 rounded">
                      <span className="flex items-center gap-1 text-green-700">
                        {FORMAS_ICONE[p.forma]} {FORMAS_LABEL[p.forma]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-700">R$ {p.valor.toFixed(2)}</span>
                        <button onClick={() => removerPagamento(p.forma)} className="text-red-400 hover:text-red-600">×</button>
                      </div>
                    </div>
                  ))}
                  {troco > 0 && (
                    <div className="flex justify-between text-sm font-bold text-orange-600 px-3">
                      <span>Troco</span>
                      <span>R$ {troco.toFixed(2)}</span>
                    </div>
                  )}
                  {restante > 0.01 && (
                    <div className="flex justify-between text-sm font-bold text-red-500 px-3">
                      <span>Falta</span>
                      <span>R$ {restante.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowPagamento(false)}>
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleFinalizar}
                  disabled={restante > 0.01 || finalizarVenda.isPending || carrinho.length === 0}
                >
                  {finalizarVenda.isPending ? 'Finalizando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-bold"
              disabled={carrinho.length === 0}
              onClick={() => setShowPagamento(true)}
            >
              Ir para Pagamento →
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function getCategoriaEmoji(categoria?: string): string {
  if (!categoria) return '🍽️'
  const lower = categoria.toLowerCase()
  if (lower.includes('cerveja')) return '🍺'
  if (lower.includes('bebida') || lower.includes('suco') || lower.includes('água')) return '🥤'
  if (lower.includes('destilado') || lower.includes('whisky') || lower.includes('vodka')) return '🥃'
  if (lower.includes('almoço') || lower.includes('refeição') || lower.includes('prato')) return '🍽️'
  if (lower.includes('lanche') || lower.includes('sanduíche') || lower.includes('petisco')) return '🥪'
  if (lower.includes('sobremesa') || lower.includes('doce')) return '🍰'
  return '🍽️'
}
