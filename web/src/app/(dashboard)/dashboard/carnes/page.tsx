'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  FileText, Plus, Search, Calendar, User, CreditCard, Printer,
  CheckCircle, XCircle, Clock, Settings, Eye, Banknote, Receipt, Users
} from 'lucide-react'

type Carne = {
  id: string
  associado_id: string
  tipo: string
  descricao: string
  valor_total: number
  numero_parcelas: number
  valor_parcela: number
  data_primeiro_vencimento: string
  forma_pagamento: string
  status: string
  created_at: string
  associado?: { nome: string; numero_titulo: string }
  parcelas?: Parcela[]
}

type Parcela = {
  id: string
  carne_id: string
  numero_parcela: number
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  valor_pago: number | null
  status: string
}

type ConfigValor = {
  id: string
  tipo: string
  valor: number
  descricao: string
  parcelas_max: number
}

// Categorias disponíveis
const CATEGORIAS = [
  { id: 'individual', label: '👤 Individual', cor: 'blue' },
  { id: 'familiar', label: '👨‍👩‍👧‍👦 Familiar', cor: 'green' },
  { id: 'patrimonial', label: '🏆 Patrimonial', cor: 'purple' },
]

// Tipos de carnê
const TIPOS_CARNE = [
  { id: 'mensalidade', label: 'Mensalidade', icone: '📅' },
  { id: 'titulo', label: 'Título', icone: '🎫' },
  { id: 'joia', label: 'Joia (Entrada)', icone: '💎' },
]

export default function CarnesPage() {
  const [carnes, setCarnes] = useState<Carne[]>([])
  const [configValores, setConfigValores] = useState<ConfigValor[]>([])
  const [associados, setAssociados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [showParcelas, setShowParcelas] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [form, setForm] = useState({
    associado_id: '',
    categoria: 'individual',
    tipo_carne: 'mensalidade',
    numero_parcelas: 12,
    data_primeiro_vencimento: '',
    forma_pagamento: 'boleto',
    observacoes: ''
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    carregarDados()
    verificarAdmin()
    
    const proximoMes = new Date()
    proximoMes.setMonth(proximoMes.getMonth() + 1)
    proximoMes.setDate(10)
    setForm(f => ({ ...f, data_primeiro_vencimento: proximoMes.toISOString().split('T')[0] }))
  }, [])

  const verificarAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('usuarios').select('setor').eq('id', user.id).single()
      setIsAdmin(data?.setor === 'admin')
    }
  }

  const carregarDados = async () => {
    setLoading(true)
    
    const [carnesRes, configRes, assocRes] = await Promise.all([
      supabase
        .from('carnes')
        .select('*, associado:associados(nome, numero_titulo)')
        .order('created_at', { ascending: false }),
      supabase.from('config_valores').select('*').eq('ativo', true),
      supabase.from('associados').select('id, nome, numero_titulo').eq('status', 'ativo').order('nome')
    ])

    setCarnes(carnesRes.data || [])
    setConfigValores(configRes.data || [])
    setAssociados(assocRes.data || [])
    setLoading(false)
  }

  // Gerar chave do tipo (ex: mensalidade_individual)
  const getTipoChave = (tipoCarne: string, categoria: string) => {
    if (tipoCarne === 'taxa_transferencia') return 'taxa_transferencia'
    return `${tipoCarne}_${categoria}`
  }

  const getConfig = (tipoCarne: string, categoria: string) => {
    const chave = getTipoChave(tipoCarne, categoria)
    return configValores.find(c => c.tipo === chave)
  }

  const getValor = () => {
    const config = getConfig(form.tipo_carne, form.categoria)
    return config?.valor || 0
  }

  const getParcelasMax = () => {
    const config = getConfig(form.tipo_carne, form.categoria)
    return config?.parcelas_max || 12
  }

  const getDescricao = () => {
    const config = getConfig(form.tipo_carne, form.categoria)
    return config?.descricao || ''
  }

  const calcularValorParcela = () => {
    const valorTotal = getValor()
    return valorTotal / form.numero_parcelas
  }

  const gerarCarne = async () => {
    if (!form.associado_id) {
      toast.error('Selecione um associado')
      return
    }

    const valorTotal = getValor()
    if (valorTotal <= 0) {
      toast.error('Configure o valor para esta categoria primeiro')
      return
    }

    const valorParcela = valorTotal / form.numero_parcelas
    const tipoChave = getTipoChave(form.tipo_carne, form.categoria)

    const { data: novoCarne, error } = await supabase
      .from('carnes')
      .insert({
        associado_id: form.associado_id,
        tipo: tipoChave,
        descricao: getDescricao(),
        valor_total: valorTotal,
        numero_parcelas: form.numero_parcelas,
        valor_parcela: valorParcela,
        data_primeiro_vencimento: form.data_primeiro_vencimento,
        forma_pagamento: form.forma_pagamento,
        observacoes: form.observacoes
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao gerar carnê: ' + error.message)
      return
    }

    // Gerar parcelas
    const parcelas = []
    let dataVencimento = new Date(form.data_primeiro_vencimento + 'T12:00:00')
    
    for (let i = 1; i <= form.numero_parcelas; i++) {
      parcelas.push({
        carne_id: novoCarne.id,
        associado_id: form.associado_id,
        numero_parcela: i,
        valor: valorParcela,
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        status: 'pendente'
      })
      dataVencimento.setMonth(dataVencimento.getMonth() + 1)
    }

    const { error: erroParcelas } = await supabase
      .from('parcelas_carne')
      .insert(parcelas)

    if (erroParcelas) {
      toast.error('Erro ao gerar parcelas: ' + erroParcelas.message)
      return
    }

    toast.success(`Carnê gerado com ${form.numero_parcelas} parcelas!`)
    setShowForm(false)
    resetForm()
    carregarDados()
  }

  const resetForm = () => {
    const proximoMes = new Date()
    proximoMes.setMonth(proximoMes.getMonth() + 1)
    proximoMes.setDate(10)
    
    setForm({
      associado_id: '',
      categoria: 'individual',
      tipo_carne: 'mensalidade',
      numero_parcelas: 12,
      data_primeiro_vencimento: proximoMes.toISOString().split('T')[0],
      forma_pagamento: 'boleto',
      observacoes: ''
    })
  }

  const carregarParcelas = async (carneId: string) => {
    const { data } = await supabase
      .from('parcelas_carne')
      .select('*')
      .eq('carne_id', carneId)
      .order('numero_parcela')

    setCarnes(prev => prev.map(c => 
      c.id === carneId ? { ...c, parcelas: data || [] } : c
    ))
    setShowParcelas(showParcelas === carneId ? null : carneId)
  }

  const pagarParcela = async (parcela: Parcela, carneId: string) => {
    const { error } = await supabase
      .from('parcelas_carne')
      .update({
        status: 'pago',
        data_pagamento: new Date().toISOString().split('T')[0],
        valor_pago: parcela.valor,
        updated_at: new Date().toISOString()
      })
      .eq('id', parcela.id)

    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }

    // Verificar se todas as parcelas foram pagas
    const { data: todasParcelas } = await supabase
      .from('parcelas_carne')
      .select('status')
      .eq('carne_id', carneId)

    const todasPagas = todasParcelas?.every(p => p.status === 'pago')
    
    if (todasPagas) {
      await supabase
        .from('carnes')
        .update({ status: 'quitado', updated_at: new Date().toISOString() })
        .eq('id', carneId)
      toast.success('🎉 Carnê quitado!')
    } else {
      toast.success('Parcela paga!')
    }

    carregarParcelas(carneId)
    carregarDados()
  }

  const imprimirCarne = (carne: Carne) => {
    const win = window.open('', '_blank')
    if (!win) return

    const parcelas = carne.parcelas || []
    const parcelasHtml = parcelas.map(p => `
      <div class="parcela ${p.status === 'pago' ? 'pago' : ''}">
        <div class="parcela-header">
          <span class="parcela-numero">Parcela ${p.numero_parcela}/${carne.numero_parcelas}</span>
          <span class="parcela-valor">R$ ${p.valor.toFixed(2)}</span>
        </div>
        <div class="parcela-info">
          <div><strong>Associado:</strong> ${carne.associado?.nome}</div>
          <div><strong>Título:</strong> ${carne.associado?.numero_titulo}</div>
          <div><strong>Vencimento:</strong> ${new Date(p.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</div>
          <div><strong>Referente a:</strong> ${carne.descricao}</div>
        </div>
        <div class="parcela-status">${p.status === 'pago' ? '✓ PAGO' : 'PENDENTE'}</div>
      </div>
    `).join('')

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Carnê - ${carne.associado?.nome}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; }
          .resumo { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
          .resumo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .resumo-item { text-align: center; }
          .resumo-item strong { display: block; font-size: 16px; color: #333; }
          .resumo-item span { font-size: 11px; color: #666; }
          .parcelas { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .parcela { border: 1px dashed #999; padding: 15px; page-break-inside: avoid; }
          .parcela.pago { background: #e8f5e9; border-color: #4caf50; }
          .parcela-header { display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 8px; }
          .parcela-numero { font-weight: bold; }
          .parcela-valor { font-size: 18px; font-weight: bold; color: #2196f3; }
          .parcela-info { font-size: 11px; line-height: 1.6; }
          .parcela-status { text-align: right; margin-top: 10px; font-weight: bold; color: #666; }
          .parcela.pago .parcela-status { color: #4caf50; }
          @media print { .parcela { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎫 CARNÊ DE PAGAMENTO</h1>
          <p>Clube Social</p>
        </div>
        
        <div class="resumo">
          <div class="resumo-grid">
            <div class="resumo-item">
              <strong>${carne.associado?.nome}</strong>
              <span>Associado</span>
            </div>
            <div class="resumo-item">
              <strong>${carne.descricao}</strong>
              <span>Tipo</span>
            </div>
            <div class="resumo-item">
              <strong>R$ ${carne.valor_total.toFixed(2)}</strong>
              <span>Valor Total</span>
            </div>
            <div class="resumo-item">
              <strong>${carne.numero_parcelas}x R$ ${carne.valor_parcela.toFixed(2)}</strong>
              <span>Parcelamento</span>
            </div>
          </div>
        </div>

        <div class="parcelas">${parcelasHtml}</div>
        <script>window.print();</script>
      </body>
      </html>
    `)
    win.document.close()
  }

  const salvarConfigValor = async (id: string, valor: number, parcelasMax: number) => {
    const { error } = await supabase
      .from('config_valores')
      .update({ valor, parcelas_max: parcelasMax, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }
    toast.success('Valor atualizado!')
    carregarDados()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'quitado': return 'bg-green-100 text-green-600'
      case 'ativo': return 'bg-blue-100 text-blue-600'
      case 'cancelado': return 'bg-gray-100 text-gray-600'
      default: return 'bg-yellow-100 text-yellow-600'
    }
  }

  const getStatusParcelaColor = (status: string, dataVencimento: string) => {
    if (status === 'pago') return 'bg-green-100 text-green-700 border-green-300'
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const vencimento = new Date(dataVencimento + 'T00:00:00')
    if (vencimento < hoje) return 'bg-red-100 text-red-700 border-red-300'
    return 'bg-yellow-100 text-yellow-700 border-yellow-300'
  }

  const carnesFiltrados = carnes.filter(c => {
    if (!busca) return true
    return c.associado?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
           c.associado?.numero_titulo?.includes(busca) ||
           c.descricao?.toLowerCase().includes(busca.toLowerCase())
  })

  // Stats
  const stats = {
    ativos: carnes.filter(c => c.status === 'ativo').length,
    quitados: carnes.filter(c => c.status === 'quitado').length,
    valorTotal: carnes.filter(c => c.status === 'ativo').reduce((acc, c) => acc + c.valor_total, 0)
  }

  // Agrupar configs por categoria para exibição
  const getConfigsPorCategoria = (categoria: string) => {
    return configValores.filter(c => c.tipo.endsWith(`_${categoria}`))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt className="h-6 w-6 text-green-600" />
            Carnês
          </h1>
          <p className="text-muted-foreground">Geração de carnês por categoria</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowConfig(!showConfig)}>
              <Settings className="h-4 w-4 mr-2" />
              Valores
            </Button>
          )}
          <Button onClick={() => setShowForm(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Gerar Carnê
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.ativos}</p>
              <p className="text-sm text-muted-foreground">Carnês Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.quitados}</p>
              <p className="text-sm text-muted-foreground">Quitados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Banknote className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-sm text-muted-foreground">A Receber</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Config Valores por Categoria - Apenas Admin */}
      {showConfig && isAdmin && (
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração de Valores por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {CATEGORIAS.map(cat => (
                <div key={cat.id} className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                    {cat.label}
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {getConfigsPorCategoria(cat.id).map(cv => (
                      <div key={cv.id} className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium mb-2">{cv.descricao}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Valor (R$)</label>
                            <Input
                              type="number"
                              step="0.01"
                              defaultValue={cv.valor}
                              className="h-8"
                              onBlur={e => {
                                const novoValor = parseFloat(e.target.value)
                                if (novoValor !== cv.valor) {
                                  salvarConfigValor(cv.id, novoValor, cv.parcelas_max)
                                }
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Máx. Parcelas</label>
                            <Input
                              type="number"
                              defaultValue={cv.parcelas_max}
                              className="h-8"
                              onBlur={e => {
                                const novoParcelas = parseInt(e.target.value)
                                if (novoParcelas !== cv.parcelas_max) {
                                  salvarConfigValor(cv.id, cv.valor, novoParcelas)
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Novo Carnê */}
      {showForm && (
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Gerar Novo Carnê
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seleção de Categoria */}
            <div>
              <label className="text-sm font-medium mb-2 block">Categoria do Associado *</label>
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIAS.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm({ ...form, categoria: cat.id, numero_parcelas: Math.min(form.numero_parcelas, getParcelasMax()) })}
                    className={`p-4 rounded-lg border-2 text-center transition-all ${
                      form.categoria === cat.id 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{cat.label.split(' ')[0]}</span>
                    <span className="text-sm font-medium">{cat.label.split(' ').slice(1).join(' ')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de Carnê */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Carnê *</label>
              <div className="grid grid-cols-3 gap-3">
                {TIPOS_CARNE.map(tipo => {
                  const config = getConfig(tipo.id, form.categoria)
                  return (
                    <button
                      key={tipo.id}
                      type="button"
                      onClick={() => setForm({ ...form, tipo_carne: tipo.id, numero_parcelas: Math.min(form.numero_parcelas, config?.parcelas_max || 12) })}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        form.tipo_carne === tipo.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{tipo.icone}</span>
                      <span className="text-sm font-medium block">{tipo.label}</span>
                      {config && (
                        <span className="text-xs text-green-600 font-bold">
                          R$ {config.valor.toFixed(2)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Associado *</label>
                <select
                  value={form.associado_id}
                  onChange={e => setForm({ ...form, associado_id: e.target.value })}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="">Selecione...</option>
                  {associados.map(a => (
                    <option key={a.id} value={a.id}>{a.numero_titulo} - {a.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Forma de Pagamento</label>
                <select
                  value={form.forma_pagamento}
                  onChange={e => setForm({ ...form, forma_pagamento: e.target.value })}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="boleto">📄 Boleto</option>
                  <option value="cartao">💳 Cartão de Crédito</option>
                  <option value="pix">📱 PIX</option>
                  <option value="debito_automatico">🏦 Débito Automático</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Número de Parcelas</label>
                <select
                  value={form.numero_parcelas}
                  onChange={e => setForm({ ...form, numero_parcelas: parseInt(e.target.value) })}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  {Array.from({ length: getParcelasMax() }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}x de R$ {(getValor() / n).toFixed(2)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Primeiro Vencimento</label>
                <Input
                  type="date"
                  value={form.data_primeiro_vencimento}
                  onChange={e => setForm({ ...form, data_primeiro_vencimento: e.target.value })}
                />
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
              <h3 className="font-medium mb-3 text-center">📋 Resumo do Carnê</h3>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Categoria</p>
                  <p className="font-bold">{CATEGORIAS.find(c => c.id === form.categoria)?.label}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor Total</p>
                  <p className="text-xl font-bold text-green-600">
                    R$ {getValor().toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Parcelas</p>
                  <p className="text-xl font-bold">{form.numero_parcelas}x</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor Parcela</p>
                  <p className="text-xl font-bold text-blue-600">
                    R$ {calcularValorParcela().toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={gerarCarne} className="bg-green-600 hover:bg-green-700">
                <Receipt className="h-4 w-4 mr-2" />
                Gerar Carnê
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nome, título ou tipo..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de Carnês */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Associado</th>
                <th className="text-left p-3 font-medium">Tipo</th>
                <th className="text-left p-3 font-medium">Valor</th>
                <th className="text-left p-3 font-medium">Pagamento</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Carregando...</td></tr>
              ) : carnesFiltrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum carnê encontrado</td></tr>
              ) : (
                carnesFiltrados.map(c => (
                  <>
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{c.associado?.nome}</div>
                        <div className="text-sm text-muted-foreground">{c.associado?.numero_titulo}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{c.descricao}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">R$ {c.valor_total.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{c.numero_parcelas}x R$ {c.valor_parcela.toFixed(2)}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-sm">
                          {c.forma_pagamento === 'cartao' ? '💳' : c.forma_pagamento === 'pix' ? '📱' : c.forma_pagamento === 'debito_automatico' ? '🏦' : '📄'}
                          {c.forma_pagamento}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(c.status)}`}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => carregarParcelas(c.id)}
                          title="Ver Parcelas"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {c.parcelas && c.parcelas.length > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => imprimirCarne(c)}
                            title="Imprimir"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expandir Parcelas */}
                    {showParcelas === c.id && c.parcelas && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 p-4">
                          <div className="grid grid-cols-6 gap-2">
                            {c.parcelas.map(p => (
                              <div 
                                key={p.id} 
                                className={`p-3 rounded border-2 ${getStatusParcelaColor(p.status, p.data_vencimento)}`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-bold">#{p.numero_parcela}</span>
                                  {p.status === 'pago' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                </div>
                                <div className="text-lg font-bold">R$ {p.valor.toFixed(2)}</div>
                                <div className="text-xs">
                                  {new Date(p.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </div>
                                {p.status === 'pago' ? (
                                  <div className="text-xs text-green-600 mt-1">
                                    ✓ Pago em {new Date(p.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')}
                                  </div>
                                ) : (
                                  <Button 
                                    size="sm" 
                                    className="w-full mt-2 h-7 text-xs"
                                    onClick={() => pagarParcela(p, c.id)}
                                  >
                                    Pagar
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                            onClick={() => setShowParcelas(null)}
                          >
                            Fechar
                          </Button>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
