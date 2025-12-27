'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  CreditCard, Plus, Trash2, Edit, Save, X, Check,
  Waves, Dumbbell, Goal, PartyPopper, UtensilsCrossed, Users
} from 'lucide-react'

type Plano = {
  id: string
  nome: string
  descricao: string | null
  valor_titulo: number
  valor_mensalidade: number
  valor_mensalidade_dependente: number
  max_dependentes: number
  beneficios: string[] | null
  permite_piscina: boolean
  permite_academia: boolean
  permite_quadras: boolean
  permite_salao_festas: boolean
  permite_restaurante: boolean
  dia_vencimento: number
  multa_atraso: number
  juros_dia: number
  ativo: boolean
  ordem: number
  cor: string
}

const corPadrao = '#3B82F6'
const coresDisponiveis = [
  '#22C55E', '#3B82F6', '#A855F7', '#F59E0B', '#EF4444', 
  '#EC4899', '#06B6D4', '#6B7280', '#14B8A6', '#8B5CF6'
]

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Plano | null>(null)
  const [novoBeneficio, setNovoBeneficio] = useState('')
  
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    valor_titulo: 0,
    valor_mensalidade: 0,
    valor_mensalidade_dependente: 0,
    max_dependentes: 5,
    beneficios: [] as string[],
    permite_piscina: true,
    permite_academia: true,
    permite_quadras: true,
    permite_salao_festas: true,
    permite_restaurante: true,
    dia_vencimento: 10,
    multa_atraso: 2.00,
    juros_dia: 0.033,
    ativo: true,
    ordem: 0,
    cor: corPadrao
  })

  const supabase = createClientComponentClient()

  const carregarPlanos = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('categorias_planos')
      .select('*')
      .order('ordem', { ascending: true })
    setPlanos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarPlanos()
  }, [])

  const resetForm = () => {
    setForm({
      nome: '',
      descricao: '',
      valor_titulo: 0,
      valor_mensalidade: 0,
      valor_mensalidade_dependente: 0,
      max_dependentes: 5,
      beneficios: [],
      permite_piscina: true,
      permite_academia: true,
      permite_quadras: true,
      permite_salao_festas: true,
      permite_restaurante: true,
      dia_vencimento: 10,
      multa_atraso: 2.00,
      juros_dia: 0.033,
      ativo: true,
      ordem: planos.length,
      cor: corPadrao
    })
    setEditando(null)
    setShowForm(false)
  }

  const editar = (p: Plano) => {
    setEditando(p)
    setForm({
      nome: p.nome,
      descricao: p.descricao || '',
      valor_titulo: p.valor_titulo,
      valor_mensalidade: p.valor_mensalidade,
      valor_mensalidade_dependente: p.valor_mensalidade_dependente,
      max_dependentes: p.max_dependentes,
      beneficios: p.beneficios || [],
      permite_piscina: p.permite_piscina,
      permite_academia: p.permite_academia,
      permite_quadras: p.permite_quadras,
      permite_salao_festas: p.permite_salao_festas,
      permite_restaurante: p.permite_restaurante,
      dia_vencimento: p.dia_vencimento,
      multa_atraso: p.multa_atraso,
      juros_dia: p.juros_dia,
      ativo: p.ativo,
      ordem: p.ordem,
      cor: p.cor || corPadrao
    })
    setShowForm(true)
  }

  const salvar = async () => {
    if (!form.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    const dados = {
      ...form,
      updated_at: new Date().toISOString()
    }

    if (editando) {
      const { error } = await supabase
        .from('categorias_planos')
        .update(dados)
        .eq('id', editando.id)

      if (error) {
        toast.error('Erro: ' + error.message)
        return
      }
      toast.success('Plano atualizado!')
    } else {
      const { error } = await supabase
        .from('categorias_planos')
        .insert(dados)

      if (error) {
        toast.error('Erro: ' + error.message)
        return
      }
      toast.success('Plano criado!')
    }

    resetForm()
    carregarPlanos()
  }

  const excluir = async (id: string) => {
    if (!confirm('Excluir este plano? Associados vinculados ficarão sem categoria.')) return

    const { error } = await supabase
      .from('categorias_planos')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }
    toast.success('Plano excluído!')
    carregarPlanos()
  }

  const toggleAtivo = async (p: Plano) => {
    await supabase
      .from('categorias_planos')
      .update({ ativo: !p.ativo })
      .eq('id', p.id)
    carregarPlanos()
  }

  const adicionarBeneficio = () => {
    if (novoBeneficio.trim()) {
      setForm({ ...form, beneficios: [...form.beneficios, novoBeneficio.trim()] })
      setNovoBeneficio('')
    }
  }

  const removerBeneficio = (idx: number) => {
    setForm({ ...form, beneficios: form.beneficios.filter((_, i) => i !== idx) })
  }

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Planos e Categorias
          </h1>
          <p className="text-muted-foreground">Gerencie os planos de associação do clube</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editando ? 'Editar' : 'Novo'} Plano</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Nome do Plano *</label>
                <Input
                  placeholder="Ex: Titular, Contribuinte, Atleta..."
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cor</label>
                <div className="flex gap-1 mt-2">
                  {coresDisponiveis.map(cor => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setForm({ ...form, cor })}
                      className={`w-6 h-6 rounded-full border-2 ${form.cor === cor ? 'border-gray-800' : 'border-transparent'}`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Input
                placeholder="Descrição do plano..."
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
              />
            </div>

            {/* Valores */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Valor do Título (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor_titulo}
                  onChange={e => setForm({ ...form, valor_titulo: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">Valor de adesão</p>
              </div>
              <div>
                <label className="text-sm font-medium">Mensalidade (R$) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor_mensalidade}
                  onChange={e => setForm({ ...form, valor_mensalidade: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">Valor mensal do titular</p>
              </div>
              <div>
                <label className="text-sm font-medium">Mensalidade Dependente (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor_mensalidade_dependente}
                  onChange={e => setForm({ ...form, valor_mensalidade_dependente: parseFloat(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground mt-1">Por dependente</p>
              </div>
              <div>
                <label className="text-sm font-medium">Máx. Dependentes</label>
                <Input
                  type="number"
                  value={form.max_dependentes}
                  onChange={e => setForm({ ...form, max_dependentes: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Configurações financeiras */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Dia Vencimento</label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={form.dia_vencimento}
                  onChange={e => setForm({ ...form, dia_vencimento: parseInt(e.target.value) || 10 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Multa Atraso (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.multa_atraso}
                  onChange={e => setForm({ ...form, multa_atraso: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Juros ao Dia (%)</label>
                <Input
                  type="number"
                  step="0.001"
                  value={form.juros_dia}
                  onChange={e => setForm({ ...form, juros_dia: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Permissões */}
            <div>
              <label className="text-sm font-medium mb-2 block">Permissões de Acesso</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.permite_piscina} onChange={e => setForm({ ...form, permite_piscina: e.target.checked })} className="h-4 w-4" />
                  <Waves className="h-4 w-4 text-blue-500" /> Piscina
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.permite_academia} onChange={e => setForm({ ...form, permite_academia: e.target.checked })} className="h-4 w-4" />
                  <Dumbbell className="h-4 w-4 text-orange-500" /> Academia
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.permite_quadras} onChange={e => setForm({ ...form, permite_quadras: e.target.checked })} className="h-4 w-4" />
                  <Goal className="h-4 w-4 text-green-500" /> Quadras
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.permite_salao_festas} onChange={e => setForm({ ...form, permite_salao_festas: e.target.checked })} className="h-4 w-4" />
                  <PartyPopper className="h-4 w-4 text-purple-500" /> Salão de Festas
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.permite_restaurante} onChange={e => setForm({ ...form, permite_restaurante: e.target.checked })} className="h-4 w-4" />
                  <UtensilsCrossed className="h-4 w-4 text-red-500" /> Restaurante
                </label>
              </div>
            </div>

            {/* Benefícios */}
            <div>
              <label className="text-sm font-medium mb-2 block">Benefícios</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Adicionar benefício..."
                  value={novoBeneficio}
                  onChange={e => setNovoBeneficio(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), adicionarBeneficio())}
                />
                <Button type="button" variant="outline" onClick={adicionarBeneficio}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.beneficios.map((b, idx) => (
                  <span key={idx} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    {b}
                    <button type="button" onClick={() => removerBeneficio(idx)} className="text-red-500 hover:text-red-700">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Status e Ordem */}
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.ativo} onChange={e => setForm({ ...form, ativo: e.target.checked })} className="h-4 w-4" />
                Plano Ativo
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Ordem:</label>
                <Input
                  type="number"
                  className="w-20"
                  value={form.ordem}
                  onChange={e => setForm({ ...form, ordem: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={salvar}>
                <Save className="h-4 w-4 mr-2" />
                {editando ? 'Atualizar' : 'Criar'} Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">Carregando...</p>
        ) : planos.length === 0 ? (
          <Card className="col-span-full p-8 text-center text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum plano cadastrado</p>
          </Card>
        ) : (
          planos.map(p => (
            <Card key={p.id} className={`overflow-hidden ${!p.ativo ? 'opacity-60' : ''}`}>
              <div className="h-2" style={{ backgroundColor: p.cor }} />
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{p.nome}</h3>
                    {p.descricao && <p className="text-sm text-muted-foreground">{p.descricao}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${p.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Título:</span>
                    <span className="font-semibold">{formatarMoeda(p.valor_titulo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mensalidade:</span>
                    <span className="font-semibold text-green-600">{formatarMoeda(p.valor_mensalidade)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Por Dependente:</span>
                    <span className="font-semibold">{formatarMoeda(p.valor_mensalidade_dependente)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Máx. Dependentes:</span>
                    <span>{p.max_dependentes}</span>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  {p.permite_piscina && <Waves className="h-4 w-4 text-blue-500" title="Piscina" />}
                  {p.permite_academia && <Dumbbell className="h-4 w-4 text-orange-500" title="Academia" />}
                  {p.permite_quadras && <Goal className="h-4 w-4 text-green-500" title="Quadras" />}
                  {p.permite_salao_festas && <PartyPopper className="h-4 w-4 text-purple-500" title="Salão" />}
                  {p.permite_restaurante && <UtensilsCrossed className="h-4 w-4 text-red-500" title="Restaurante" />}
                </div>

                {p.beneficios && p.beneficios.length > 0 && (
                  <div className="text-xs text-muted-foreground mb-3">
                    {p.beneficios.slice(0, 2).map((b, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500" /> {b}
                      </div>
                    ))}
                    {p.beneficios.length > 2 && <span>+{p.beneficios.length - 2} mais...</span>}
                  </div>
                )}

                <div className="flex gap-1 pt-3 border-t">
                  <Button variant="ghost" size="sm" onClick={() => editar(p)}>
                    <Edit className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleAtivo(p)}>
                    {p.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => excluir(p.id)} className="text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
