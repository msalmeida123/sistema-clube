'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Ticket, Plus, Search, QrCode, Calendar, User, Phone,
  CheckCircle, XCircle, Clock, Settings, AlertTriangle, Printer
} from 'lucide-react'

type Convite = {
  id: string
  associado_id: string
  convidado_nome: string
  convidado_cpf: string
  convidado_telefone: string
  data_validade: string
  qr_code: string
  valor_pago: number
  status: string
  data_entrada: string | null
  created_at: string
  associado?: { nome: string; numero_titulo: string }
}

type ConfigConvites = {
  id: string
  valor_convite: number
  limite_convites_mes: number
  intervalo_dias_convidado: number
}

export default function ConvitesPage() {
  const [convites, setConvites] = useState<Convite[]>([])
  const [config, setConfig] = useState<ConfigConvites | null>(null)
  const [associados, setAssociados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [isAdmin, setIsAdmin] = useState(false)
  
  const [form, setForm] = useState({
    associado_id: '',
    convidado_nome: '',
    convidado_cpf: '',
    convidado_telefone: '',
    data_validade: new Date().toISOString().split('T')[0]
  })

  const [formConfig, setFormConfig] = useState({
    valor_convite: 30,
    limite_convites_mes: 2,
    intervalo_dias_convidado: 90
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    carregarDados()
    verificarAdmin()
  }, [])

  const verificarAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userData } = await supabase
        .from('usuarios')
        .select('setor')
        .eq('id', user.id)
        .single()
      
      setIsAdmin(userData?.setor === 'admin')
    }
  }

  const carregarDados = async () => {
    setLoading(true)
    
    const [convitesRes, configRes, assocRes] = await Promise.all([
      supabase
        .from('convites')
        .select('*, associado:associados(nome, numero_titulo)')
        .order('created_at', { ascending: false }),
      supabase.from('config_convites').select('*').limit(1).single(),
      supabase.from('associados').select('id, nome, numero_titulo').order('nome')
    ])

    setConvites(convitesRes.data || [])
    if (configRes.data) {
      setConfig(configRes.data)
      setFormConfig({
        valor_convite: configRes.data.valor_convite,
        limite_convites_mes: configRes.data.limite_convites_mes,
        intervalo_dias_convidado: configRes.data.intervalo_dias_convidado
      })
    }
    setAssociados(assocRes.data || [])
    setLoading(false)
  }

  const formatarCPF = (valor: string) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 3) return nums
    if (nums.length <= 6) return `${nums.slice(0,3)}.${nums.slice(3)}`
    if (nums.length <= 9) return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6)}`
    return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6,9)}-${nums.slice(9)}`
  }

  const formatarTelefone = (valor: string) => {
    const nums = valor.replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 2) return nums
    if (nums.length <= 7) return `(${nums.slice(0,2)}) ${nums.slice(2)}`
    return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`
  }

  const verificarLimiteConvites = async (associadoId: string) => {
    if (!config) return { permitido: false, motivo: 'Configuração não encontrada' }

    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const { count } = await supabase
      .from('convites')
      .select('*', { count: 'exact', head: true })
      .eq('associado_id', associadoId)
      .gte('created_at', inicioMes.toISOString())
      .neq('status', 'cancelado')

    if ((count || 0) >= config.limite_convites_mes) {
      return { 
        permitido: false, 
        motivo: `Limite de ${config.limite_convites_mes} convites por mês atingido` 
      }
    }

    return { permitido: true, restantes: config.limite_convites_mes - (count || 0) }
  }

  const verificarIntervaloConvidado = async (cpf: string) => {
    if (!config) return { permitido: false, motivo: 'Configuração não encontrada' }

    const cpfLimpo = cpf.replace(/\D/g, '')
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - config.intervalo_dias_convidado)

    const { data } = await supabase
      .from('convites')
      .select('data_validade, status')
      .eq('convidado_cpf', cpfLimpo)
      .in('status', ['pago', 'utilizado'])
      .gte('data_validade', dataLimite.toISOString().split('T')[0])
      .order('data_validade', { ascending: false })
      .limit(1)

    if (data && data.length > 0) {
      const ultimaVisita = new Date(data[0].data_validade)
      const proximaPermitida = new Date(ultimaVisita)
      proximaPermitida.setDate(proximaPermitida.getDate() + config.intervalo_dias_convidado)
      
      return { 
        permitido: false, 
        motivo: `Este CPF só pode ser convidado novamente a partir de ${proximaPermitida.toLocaleDateString('pt-BR')}` 
      }
    }

    return { permitido: true }
  }

  const criarConvite = async () => {
    if (!form.associado_id || !form.convidado_nome || !form.convidado_cpf) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Verificar limite de convites do associado
    const limiteCheck = await verificarLimiteConvites(form.associado_id)
    if (!limiteCheck.permitido) {
      toast.error(limiteCheck.motivo)
      return
    }

    // Verificar intervalo do convidado
    const intervaloCheck = await verificarIntervaloConvidado(form.convidado_cpf)
    if (!intervaloCheck.permitido) {
      toast.error(intervaloCheck.motivo)
      return
    }

    // Verificar se data é hoje ou futura
    const dataConvite = new Date(form.data_validade)
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    if (dataConvite < hoje) {
      toast.error('A data do convite não pode ser no passado')
      return
    }

    // Criar convite
    const { data: novoConvite, error } = await supabase
      .from('convites')
      .insert({
        associado_id: form.associado_id,
        convidado_nome: form.convidado_nome.toUpperCase(),
        convidado_cpf: form.convidado_cpf.replace(/\D/g, ''),
        convidado_telefone: form.convidado_telefone.replace(/\D/g, ''),
        data_validade: form.data_validade,
        valor_pago: config?.valor_convite || 0,
        status: 'pago' // Considerando pago ao criar
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao criar convite: ' + error.message)
      return
    }

    // Gerar QR Code
    const qrCode = 'CONV-' + novoConvite.id.substring(0, 8).toUpperCase()
    await supabase
      .from('convites')
      .update({ qr_code: qrCode })
      .eq('id', novoConvite.id)

    toast.success('Convite criado com sucesso!')
    setShowForm(false)
    setForm({
      associado_id: '',
      convidado_nome: '',
      convidado_cpf: '',
      convidado_telefone: '',
      data_validade: new Date().toISOString().split('T')[0]
    })
    carregarDados()
  }

  const salvarConfig = async () => {
    const { error } = await supabase
      .from('config_convites')
      .update({
        valor_convite: formConfig.valor_convite,
        limite_convites_mes: formConfig.limite_convites_mes,
        intervalo_dias_convidado: formConfig.intervalo_dias_convidado,
        updated_at: new Date().toISOString()
      })
      .eq('id', config?.id)

    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
      return
    }

    toast.success('Configurações salvas!')
    setShowConfig(false)
    carregarDados()
  }

  const cancelarConvite = async (id: string) => {
    if (!confirm('Cancelar este convite?')) return

    const { error } = await supabase
      .from('convites')
      .update({ status: 'cancelado', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }

    toast.success('Convite cancelado')
    carregarDados()
  }

  const imprimirConvite = (convite: Convite) => {
    const win = window.open('', '_blank')
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Convite - ${convite.convidado_nome}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .convite { border: 2px solid #333; padding: 30px; max-width: 500px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #333; }
          .header p { margin: 5px 0; color: #666; }
          .info { margin: 15px 0; }
          .info label { font-weight: bold; color: #666; }
          .info span { display: block; font-size: 18px; margin-top: 5px; }
          .qrcode { text-align: center; margin: 30px 0; padding: 20px; background: #f5f5f5; }
          .qrcode-text { font-family: monospace; font-size: 24px; font-weight: bold; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ccc; }
          .validade { background: #e8f5e9; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .validade strong { font-size: 20px; color: #2e7d32; }
        </style>
      </head>
      <body>
        <div class="convite">
          <div class="header">
            <h1>🎫 CONVITE</h1>
            <p>Clube Social</p>
          </div>
          
          <div class="info">
            <label>Convidado:</label>
            <span>${convite.convidado_nome}</span>
          </div>
          
          <div class="info">
            <label>CPF:</label>
            <span>${formatarCPF(convite.convidado_cpf)}</span>
          </div>
          
          <div class="info">
            <label>Convidado por:</label>
            <span>${convite.associado?.nome || '-'} (${convite.associado?.numero_titulo || '-'})</span>
          </div>
          
          <div class="validade">
            <label>Válido para:</label><br>
            <strong>${new Date(convite.data_validade + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</strong>
          </div>
          
          <div class="qrcode">
            <p>Apresente este código na portaria:</p>
            <div class="qrcode-text">${convite.qr_code}</div>
          </div>
          
          <div class="footer">
            <p>Este convite é válido apenas para a data indicada.</p>
            <p>Documento com foto é obrigatório na entrada.</p>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `)
    win.document.close()
  }

  const getStatusColor = (status: string, dataValidade: string) => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const data = new Date(dataValidade + 'T00:00:00')
    
    if (status === 'cancelado') return 'bg-gray-100 text-gray-600'
    if (status === 'utilizado') return 'bg-green-100 text-green-600'
    if (data < hoje) return 'bg-red-100 text-red-600'
    if (status === 'pago') return 'bg-blue-100 text-blue-600'
    return 'bg-yellow-100 text-yellow-600'
  }

  const getStatusLabel = (status: string, dataValidade: string) => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const data = new Date(dataValidade + 'T00:00:00')
    
    if (status === 'cancelado') return 'Cancelado'
    if (status === 'utilizado') return 'Utilizado'
    if (data < hoje) return 'Expirado'
    if (status === 'pago') return 'Válido'
    return 'Pendente'
  }

  const convitesFiltrados = convites.filter(c => {
    const matchBusca = !busca || 
      c.convidado_nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.convidado_cpf.includes(busca.replace(/\D/g, '')) ||
      c.associado?.nome?.toLowerCase().includes(busca.toLowerCase())
    
    const statusAtual = getStatusLabel(c.status, c.data_validade).toLowerCase()
    const matchStatus = filtroStatus === 'todos' || statusAtual === filtroStatus

    return matchBusca && matchStatus
  })

  // Stats
  const stats = {
    hoje: convites.filter(c => c.data_validade === new Date().toISOString().split('T')[0] && c.status === 'pago').length,
    mes: convites.filter(c => {
      const d = new Date(c.data_validade)
      const agora = new Date()
      return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()
    }).length,
    utilizados: convites.filter(c => c.status === 'utilizado').length
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6 text-purple-500" />
            Convites
          </h1>
          <p className="text-muted-foreground">Gerenciamento de convites para visitantes</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowConfig(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          )}
          <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Convite
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.hoje}</p>
              <p className="text-sm text-muted-foreground">Para Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Ticket className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.mes}</p>
              <p className="text-sm text-muted-foreground">Este Mês</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.utilizados}</p>
              <p className="text-sm text-muted-foreground">Utilizados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="text-2xl">💰</div>
            <div>
              <p className="text-2xl font-bold">R$ {config?.valor_convite?.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-muted-foreground">Valor/Convite</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Config Modal - Apenas Admin */}
      {showConfig && isAdmin && (
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Convites
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Valor do Convite (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formConfig.valor_convite}
                  onChange={e => setFormConfig({ ...formConfig, valor_convite: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Limite por Mês (por associado)</label>
                <Input
                  type="number"
                  value={formConfig.limite_convites_mes}
                  onChange={e => setFormConfig({ ...formConfig, limite_convites_mes: parseInt(e.target.value) || 2 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Intervalo Mínimo (dias)</label>
                <Input
                  type="number"
                  value={formConfig.intervalo_dias_convidado}
                  onChange={e => setFormConfig({ ...formConfig, intervalo_dias_convidado: parseInt(e.target.value) || 90 })}
                />
                <p className="text-xs text-muted-foreground mt-1">Mesmo CPF só pode ser convidado após este período</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowConfig(false)}>Cancelar</Button>
              <Button onClick={salvarConfig}>Salvar Configurações</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Novo Convite */}
      {showForm && (
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Convite
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Associado Responsável *</label>
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
                <label className="text-sm font-medium">Data do Convite *</label>
                <Input
                  type="date"
                  value={form.data_validade}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm({ ...form, data_validade: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Convite válido apenas para este dia</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados do Convidado
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome Completo *</label>
                  <Input
                    placeholder="Nome do convidado"
                    value={form.convidado_nome}
                    onChange={e => setForm({ ...form, convidado_nome: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CPF *</label>
                  <Input
                    placeholder="000.000.000-00"
                    value={form.convidado_cpf}
                    onChange={e => setForm({ ...form, convidado_cpf: formatarCPF(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={form.convidado_telefone}
                    onChange={e => setForm({ ...form, convidado_telefone: formatarTelefone(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Valor do convite:</strong> R$ {config?.valor_convite?.toFixed(2) || '0.00'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Limite: {config?.limite_convites_mes || 2} convites por mês | 
                Mesmo convidado: mínimo {config?.intervalo_dias_convidado || 90} dias entre visitas
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={criarConvite} className="bg-purple-600 hover:bg-purple-700">
                <Ticket className="h-4 w-4 mr-2" />
                Criar Convite
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, CPF ou associado..."
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
          <option value="válido">Válidos</option>
          <option value="utilizado">Utilizados</option>
          <option value="expirado">Expirados</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Convidado</th>
                <th className="text-left p-3 font-medium">Associado</th>
                <th className="text-left p-3 font-medium">Data</th>
                <th className="text-left p-3 font-medium">QR Code</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Carregando...</td></tr>
              ) : convitesFiltrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum convite encontrado</td></tr>
              ) : (
                convitesFiltrados.map(c => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">{c.convidado_nome}</div>
                      <div className="text-sm text-muted-foreground">{formatarCPF(c.convidado_cpf)}</div>
                    </td>
                    <td className="p-3">
                      <div>{c.associado?.nome}</div>
                      <div className="text-sm text-muted-foreground">{c.associado?.numero_titulo}</div>
                    </td>
                    <td className="p-3">
                      {new Date(c.data_validade + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{c.qr_code}</span>
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(c.status, c.data_validade)}`}>
                        {getStatusLabel(c.status, c.data_validade)}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      {c.status === 'pago' && new Date(c.data_validade + 'T00:00:00') >= new Date(new Date().toISOString().split('T')[0]) && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => imprimirConvite(c)} title="Imprimir">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => cancelarConvite(c.id)} className="text-red-500" title="Cancelar">
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
