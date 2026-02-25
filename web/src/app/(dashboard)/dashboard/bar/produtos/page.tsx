'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { barProdutosRepository, barCategoriasRepository } from '@/modules/bar/repositories/bar.repository'
import { useToast } from '@/hooks/use-toast'
import type { BarProduto, BarProdutoFormData, BarCategoria } from '@/modules/bar/types'

const CFOP_OPCOES = [
  { value: '5102', label: '5102 - Venda de mercadoria adquirida para consumidor' },
  { value: '5405', label: '5405 - Venda ST' },
]

const NCM_SUGESTOES = [
  { ncm: '22030000', descricao: 'Cervejas de malte' },
  { ncm: '22021000', descricao: 'Água, incluindo água mineral e gaseificada' },
  { ncm: '22021900', descricao: 'Outras bebidas não alcoólicas' },
  { ncm: '22041000', descricao: 'Vinhos espumantes' },
  { ncm: '21069090', descricao: 'Outras preparações alimentícias' },
  { ncm: '19059090', descricao: 'Outros produtos de padaria' },
]

export default function BarProdutosPage() {
  const { toast } = useToast()
  const qc = useQueryClient()
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<BarProduto | null>(null)
  const [form, setForm] = useState<Partial<BarProdutoFormData>>({ ativo: true, unidade: 'UN', cfop: '5102', cst: '400' })

  const { data: produtos = [], isLoading } = useQuery({
    queryKey: ['bar-produtos', false],
    queryFn: () => barProdutosRepository.listar(false)
  })

  const { data: categorias = [] } = useQuery({
    queryKey: ['bar-categorias'],
    queryFn: () => barCategoriasRepository.listar()
  })

  const salvar = useMutation({
    mutationFn: async () => {
      if (!form.nome || !form.preco) throw new Error('Nome e preço são obrigatórios')
      const payload = form as BarProdutoFormData
      if (editando) return barProdutosRepository.atualizar(editando.id, payload)
      return barProdutosRepository.criar(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bar-produtos'] })
      setModalAberto(false)
      setEditando(null)
      setForm({ ativo: true, unidade: 'UN', cfop: '5102', cst: '400' })
      toast({ title: editando ? 'Produto atualizado' : 'Produto criado' })
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' })
  })

  const deletar = useMutation({
    mutationFn: (id: string) => barProdutosRepository.deletar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bar-produtos'] })
      toast({ title: 'Produto excluído' })
    }
  })

  function abrirEditar(p: BarProduto) {
    setEditando(p)
    setForm({
      nome: p.nome, descricao: p.descricao, preco: p.preco, preco_custo: p.preco_custo,
      categoria_id: p.categoria_id, ncm: p.ncm, cfop: p.cfop, cst: p.cst,
      unidade: p.unidade, ativo: p.ativo, controla_estoque: p.controla_estoque,
      estoque_atual: p.estoque_atual, estoque_minimo: p.estoque_minimo
    })
    setModalAberto(true)
  }

  const filtrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.categoria_nome ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package size={24} /> Produtos do Bar
          </h1>
          <p className="text-gray-500 text-sm mt-1">Cardápio e cadastro de produtos</p>
        </div>
        <Button onClick={() => { setEditando(null); setForm({ ativo: true, unidade: 'UN', cfop: '5102', cst: '400' }); setModalAberto(true) }} className="gap-2">
          <Plus size={16} /> Novo Produto
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <Input placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Produto</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Categoria</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">NCM</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Preço</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Carregando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Nenhum produto cadastrado</td></tr>
            ) : filtrados.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.nome}</td>
                <td className="px-4 py-3 text-gray-500">{p.categoria_nome || '—'}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{p.ncm || '—'}</td>
                <td className="px-4 py-3 text-right font-bold text-blue-600">R$ {p.preco.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button variant="outline" size="sm" onClick={() => abrirEditar(p)}><Pencil size={14} /></Button>
                    <Button variant="outline" size="sm" onClick={() => deletar.mutate(p.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editando ? 'Editar Produto' : 'Novo Produto'}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nome *</label>
                  <Input value={form.nome || ''} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome do produto" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Categoria</label>
                  <select
                    value={form.categoria_id || ''}
                    onChange={e => setForm(f => ({ ...f, categoria_id: e.target.value || undefined }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  >
                    <option value="">Sem categoria</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Unidade</label>
                  <select
                    value={form.unidade || 'UN'}
                    onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-1"
                  >
                    <option value="UN">UN - Unidade</option>
                    <option value="KG">KG - Quilograma</option>
                    <option value="LT">LT - Litro</option>
                    <option value="PCT">PCT - Pacote</option>
                    <option value="CX">CX - Caixa</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Preço de Venda (R$) *</label>
                  <Input type="number" step="0.01" value={form.preco || ''} onChange={e => setForm(f => ({ ...f, preco: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Preço de Custo (R$)</label>
                  <Input type="number" step="0.01" value={form.preco_custo || ''} onChange={e => setForm(f => ({ ...f, preco_custo: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>

              {/* Campos fiscais */}
              <div className="border rounded-xl p-4 space-y-3 bg-blue-50">
                <h3 className="font-semibold text-sm text-blue-800">📋 Dados Fiscais (NFC-e)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">NCM</label>
                    <div className="flex gap-1 mt-1">
                      <Input
                        placeholder="ex: 22030000"
                        value={form.ncm || ''}
                        onChange={e => setForm(f => ({ ...f, ncm: e.target.value }))}
                        maxLength={8}
                      />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {NCM_SUGESTOES.map(s => (
                        <button
                          key={s.ncm}
                          onClick={() => setForm(f => ({ ...f, ncm: s.ncm }))}
                          className="text-xs bg-white border rounded px-2 py-0.5 hover:bg-blue-100"
                          title={s.descricao}
                        >
                          {s.ncm}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">CFOP</label>
                    <select
                      value={form.cfop || '5102'}
                      onChange={e => setForm(f => ({ ...f, cfop: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-xs mt-1"
                    >
                      {CFOP_OPCOES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">CST ICMS</label>
                    <Input
                      placeholder="400"
                      value={form.cst || '400'}
                      onChange={e => setForm(f => ({ ...f, cst: e.target.value }))}
                      maxLength={3}
                    />
                    <p className="text-xs text-gray-400 mt-0.5">400 = Simples Nacional</p>
                  </div>
                </div>
              </div>

              {/* Estoque */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="controla_estoque"
                  checked={form.controla_estoque || false}
                  onChange={e => setForm(f => ({ ...f, controla_estoque: e.target.checked }))}
                />
                <label htmlFor="controla_estoque" className="text-sm">Controlar estoque</label>
              </div>
              {form.controla_estoque && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Estoque Atual</label>
                    <Input type="number" value={form.estoque_atual || ''} onChange={e => setForm(f => ({ ...f, estoque_atual: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Estoque Mínimo</label>
                    <Input type="number" value={form.estoque_minimo || ''} onChange={e => setForm(f => ({ ...f, estoque_minimo: parseFloat(e.target.value) || 0 }))} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo !== false}
                  onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                />
                <label htmlFor="ativo" className="text-sm">Produto ativo (visível no PDV)</label>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>
                {salvar.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
