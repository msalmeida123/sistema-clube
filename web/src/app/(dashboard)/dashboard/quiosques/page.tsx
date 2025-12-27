'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Tent, Plus, Calendar, Clock, User, Printer, Settings, Search,
  CheckCircle, XCircle, AlertTriangle, Trash2, Edit, Save, X,
  Users, Flame, Bath, Droplets, MapPin, Lock, Unlock
} from 'lucide-react'

type Quiosque = {
  id: string
  numero: number
  nome: string
  descricao: string
  capacidade: number
  possui_churrasqueira: boolean
  possui_banheiro: boolean
  possui_pia: boolean
  valor_reserva: number
  ativo: boolean
}

type Reserva = {
  id: string
  quiosque_id: string
  associado_id: string
  data_reserva: string
  data_reserva_feita: string
  hora_limite: string
  status: string
  valor_pago: number
  observacoes: string
  quiosque?: Quiosque
  associado?: { nome: string; numero_titulo: string; telefone: string; cpf: string }
}

type ConfigQuiosque = {
  id: string
  dia_abertura_reservas: number
  hora_abertura_reservas: string
  hora_limite_reserva: string
  dias_antecedencia_max: number
  valor_padrao_reserva: number
  permite_multiplas_reservas: boolean
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function QuiosquesPage() {
  const [tab, setTab] = useState<'reservar' | 'minhas' | 'todas' | 'quiosques' | 'config'>('reservar')
  const [quiosques, setQuiosques] = useState<Quiosque[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [minhasReservas, setMinhasReservas] = useState<Reserva[]>([])
  const [config, setConfig] = useState<ConfigQuiosque | null>(null)
  const [associados, setAssociados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [reservasAbertas, setReservasAbertas] = useState(false)
  const [proximaAbertura, setProximaAbertura] = useState<Date | null>(null)
  
  // Form de reserva
  const [dataReserva, setDataReserva] = useState('')
  const [quiosqueSelecionado, setQuiosqueSelecionado] = useState<string>('')
  const [associadoSelecionado, setAssociadoSelecionado] = useState<string>('')
  const [observacoes, setObservacoes] = useState('')
  
  // Form de quiosque
  const [showFormQuiosque, setShowFormQuiosque] = useState(false)
  const [editandoQuiosque, setEditandoQuiosque] = useState<Quiosque | null>(null)
  const [formQuiosque, setFormQuiosque] = useState({
    numero: '',
    nome: '',
    descricao: '',
    capacidade: '20',
    possui_churrasqueira: true,
    possui_banheiro: false,
    possui_pia: true,
    valor_reserva: '0'
  })

  const [busca, setBusca] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    carregarDados()
    verificarAdmin()
    
    // Verificar status das reservas a cada minuto
    const interval = setInterval(verificarStatusReservas, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (config) {
      verificarAberturaReservas()
    }
  }, [config])

  const verificarAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('usuarios').select('is_admin, setor').eq('id', user.id).single()
      setIsAdmin(data?.is_admin || ['admin', 'presidente', 'vice_presidente', 'diretoria'].includes(data?.setor))
    }
  }

  const carregarDados = async () => {
    setLoading(true)

    // Carregar quiosques
    const { data: quiosquesData } = await supabase
      .from('quiosques')
      .select('*')
      .order('numero')
    setQuiosques(quiosquesData || [])

    // Carregar configuração
    const { data: configData } = await supabase
      .from('config_quiosque')
      .select('*')
      .single()
    setConfig(configData)

    // Carregar todas as reservas ativas
    const hoje = new Date().toISOString().split('T')[0]
    const { data: reservasData } = await supabase
      .from('reservas_quiosque')
      .select('*, quiosque:quiosques(*), associado:associados(nome, numero_titulo, telefone, cpf)')
      .gte('data_reserva', hoje)
      .in('status', ['ativo', 'utilizado'])
      .order('data_reserva')
    setReservas(reservasData || [])

    // Carregar minhas reservas
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userData } = await supabase
        .from('usuarios')
        .select('associado_id')
        .eq('id', user.id)
        .single()

      if (userData?.associado_id) {
        const { data: minhasData } = await supabase
          .from('reservas_quiosque')
          .select('*, quiosque:quiosques(*)')
          .eq('associado_id', userData.associado_id)
          .order('data_reserva', { ascending: false })
          .limit(20)
        setMinhasReservas(minhasData || [])
        setAssociadoSelecionado(userData.associado_id)
      }
    }

    // Carregar associados (para admin)
    const { data: assocData } = await supabase
      .from('associados')
      .select('id, nome, numero_titulo')
      .eq('status', 'ativo')
      .order('nome')
    setAssociados(assocData || [])

    await verificarStatusReservas()
    setLoading(false)
  }

  const verificarAberturaReservas = () => {
    if (!config) return

    const agora = new Date()
    const diaAtual = agora.getDay()
    const horaAtual = agora.toTimeString().slice(0, 8)

    // Verificar se é o dia de abertura e passou da hora
    if (diaAtual === config.dia_abertura_reservas && horaAtual >= config.hora_abertura_reservas) {
      setReservasAbertas(true)
    } else {
      setReservasAbertas(false)
      
      // Calcular próxima abertura
      let diasAteAbertura = config.dia_abertura_reservas - diaAtual
      if (diasAteAbertura <= 0) diasAteAbertura += 7
      if (diasAteAbertura === 0 && horaAtual < config.hora_abertura_reservas) diasAteAbertura = 0
      
      const proxima = new Date(agora)
      proxima.setDate(proxima.getDate() + diasAteAbertura)
      const [h, m] = config.hora_abertura_reservas.split(':')
      proxima.setHours(parseInt(h), parseInt(m), 0, 0)
      setProximaAbertura(proxima)
    }
  }

  const verificarStatusReservas = async () => {
    // Expirar reservas onde passou das 9h do dia reservado
    const agora = new Date()
    const hoje = agora.toISOString().split('T')[0]
    const horaAtual = agora.toTimeString().slice(0, 8)

    const { data: reservasHoje } = await supabase
      .from('reservas_quiosque')
      .select('id, hora_limite')
      .eq('data_reserva', hoje)
      .eq('status', 'ativo')

    for (const reserva of (reservasHoje || [])) {
      if (horaAtual >= reserva.hora_limite) {
        await supabase
          .from('reservas_quiosque')
          .update({ status: 'expirado', updated_at: new Date().toISOString() })
          .eq('id', reserva.id)
      }
    }
  }

  const getQuiosquesDisponiveis = (data: string) => {
    const reservadosIds = reservas
      .filter(r => r.data_reserva === data && r.status === 'ativo')
      .map(r => r.quiosque_id)
    
    return quiosques.filter(q => q.ativo && !reservadosIds.includes(q.id))
  }

  const fazerReserva = async () => {
    if (!dataReserva || !quiosqueSelecionado || !associadoSelecionado) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    // Verificar se reservas estão abertas (exceto admin)
    if (!isAdmin && !reservasAbertas) {
      toast.error('As reservas ainda não estão abertas!')
      return
    }

    // Verificar se quiosque ainda está disponível
    const disponivel = getQuiosquesDisponiveis(dataReserva).find(q => q.id === quiosqueSelecionado)
    if (!disponivel) {
      toast.error('Este quiosque já foi reservado para esta data!')
      return
    }

    const quiosque = quiosques.find(q => q.id === quiosqueSelecionado)

    const { data: reserva, error } = await supabase
      .from('reservas_quiosque')
      .insert({
        quiosque_id: quiosqueSelecionado,
        associado_id: associadoSelecionado,
        data_reserva: dataReserva,
        hora_limite: config?.hora_limite_reserva || '09:00:00',
        valor_pago: quiosque?.valor_reserva || config?.valor_padrao_reserva || 0,
        observacoes,
        status: 'ativo'
      })
      .select('*, quiosque:quiosques(*), associado:associados(nome, numero_titulo, telefone, cpf)')
      .single()

    if (error) {
      if (error.code === '23505') {
        toast.error('Este quiosque já está reservado para esta data!')
      } else {
        toast.error('Erro ao fazer reserva: ' + error.message)
      }
      return
    }

    toast.success('Reserva realizada com sucesso!')
    
    // Imprimir comprovante
    if (reserva) {
      imprimirComprovante(reserva)
    }

    // Limpar form e recarregar
    setDataReserva('')
    setQuiosqueSelecionado('')
    setObservacoes('')
    carregarDados()
  }

  const cancelarReserva = async (reservaId: string) => {
    if (!confirm('Deseja realmente cancelar esta reserva?')) return

    const { error } = await supabase
      .from('reservas_quiosque')
      .update({ status: 'cancelado', updated_at: new Date().toISOString() })
      .eq('id', reservaId)

    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }

    toast.success('Reserva cancelada!')
    carregarDados()
  }

  const imprimirComprovante = (reserva: Reserva) => {
    const win = window.open('', '_blank')
    if (!win) return

    const dataFormatada = new Date(reserva.data_reserva + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reserva Quiosque ${reserva.quiosque?.numero}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .container { max-width: 400px; margin: 0 auto; border: 3px solid #333; padding: 20px; }
          .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 15px; margin-bottom: 15px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { color: #666; }
          .quiosque-numero { font-size: 72px; font-weight: bold; text-align: center; color: #2563eb; margin: 20px 0; }
          .quiosque-nome { text-align: center; font-size: 20px; margin-bottom: 20px; }
          .info { margin-bottom: 15px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .info-label { color: #666; font-size: 12px; }
          .info-value { font-weight: bold; }
          .destaque { background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .destaque-titulo { font-size: 12px; color: #92400e; margin-bottom: 5px; }
          .destaque-valor { font-size: 24px; font-weight: bold; color: #92400e; }
          .aviso { background: #fee2e2; padding: 10px; border-radius: 8px; text-align: center; margin-top: 15px; font-size: 12px; color: #991b1b; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #666; border-top: 2px dashed #333; padding-top: 15px; }
          @media print { body { padding: 0; } .container { border: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏕️ RESERVA DE QUIOSQUE</h1>
            <p>Clube Social</p>
          </div>

          <div class="quiosque-numero">${reserva.quiosque?.numero}</div>
          <div class="quiosque-nome">${reserva.quiosque?.nome || 'Quiosque ' + reserva.quiosque?.numero}</div>

          <div class="info">
            <div class="info-row">
              <span class="info-label">ASSOCIADO</span>
              <span class="info-value">${reserva.associado?.nome}</span>
            </div>
            <div class="info-row">
              <span class="info-label">TÍTULO</span>
              <span class="info-value">${reserva.associado?.numero_titulo}</span>
            </div>
          </div>

          <div class="destaque">
            <div class="destaque-titulo">DATA DA RESERVA</div>
            <div class="destaque-valor">${dataFormatada}</div>
          </div>

          <div class="info">
            <div class="info-row">
              <span class="info-label">CAPACIDADE</span>
              <span class="info-value">${reserva.quiosque?.capacidade} pessoas</span>
            </div>
            <div class="info-row">
              <span class="info-label">CHURRASQUEIRA</span>
              <span class="info-value">${reserva.quiosque?.possui_churrasqueira ? '✅ Sim' : '❌ Não'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">RESERVA ATÉ</span>
              <span class="info-value">${reserva.hora_limite?.slice(0, 5) || '09:00'}</span>
            </div>
          </div>

          <div class="aviso">
            ⚠️ A reserva é válida até às <strong>${reserva.hora_limite?.slice(0, 5) || '09:00'}</strong> do dia reservado.<br>
            Após este horário, o quiosque ficará liberado.
          </div>

          <div class="footer">
            <p>Reserva realizada em ${new Date().toLocaleString('pt-BR')}</p>
            <p>Código: ${reserva.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `)
    win.document.close()
  }

  // CRUD de Quiosques
  const salvarQuiosque = async () => {
    const dados = {
      numero: parseInt(formQuiosque.numero),
      nome: formQuiosque.nome || `Quiosque ${formQuiosque.numero}`,
      descricao: formQuiosque.descricao,
      capacidade: parseInt(formQuiosque.capacidade) || 20,
      possui_churrasqueira: formQuiosque.possui_churrasqueira,
      possui_banheiro: formQuiosque.possui_banheiro,
      possui_pia: formQuiosque.possui_pia,
      valor_reserva: parseFloat(formQuiosque.valor_reserva) || 0
    }

    let error
    if (editandoQuiosque) {
      const result = await supabase
        .from('quiosques')
        .update({ ...dados, updated_at: new Date().toISOString() })
        .eq('id', editandoQuiosque.id)
      error = result.error
    } else {
      const result = await supabase.from('quiosques').insert(dados)
      error = result.error
    }

    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }

    toast.success(editandoQuiosque ? 'Quiosque atualizado!' : 'Quiosque adicionado!')
    setShowFormQuiosque(false)
    setEditandoQuiosque(null)
    resetFormQuiosque()
    carregarDados()
  }

  const editarQuiosque = (q: Quiosque) => {
    setEditandoQuiosque(q)
    setFormQuiosque({
      numero: q.numero.toString(),
      nome: q.nome || '',
      descricao: q.descricao || '',
      capacidade: q.capacidade.toString(),
      possui_churrasqueira: q.possui_churrasqueira,
      possui_banheiro: q.possui_banheiro,
      possui_pia: q.possui_pia,
      valor_reserva: q.valor_reserva.toString()
    })
    setShowFormQuiosque(true)
  }

  const excluirQuiosque = async (id: string) => {
    if (!confirm('Deseja excluir este quiosque?')) return

    const { error } = await supabase.from('quiosques').delete().eq('id', id)
    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }

    toast.success('Quiosque excluído!')
    carregarDados()
  }

  const toggleAtivoQuiosque = async (q: Quiosque) => {
    const { error } = await supabase
      .from('quiosques')
      .update({ ativo: !q.ativo, updated_at: new Date().toISOString() })
      .eq('id', q.id)

    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }

    toast.success(q.ativo ? 'Quiosque desativado!' : 'Quiosque ativado!')
    carregarDados()
  }

  const resetFormQuiosque = () => {
    setFormQuiosque({
      numero: '',
      nome: '',
      descricao: '',
      capacidade: '20',
      possui_churrasqueira: true,
      possui_banheiro: false,
      possui_pia: true,
      valor_reserva: '0'
    })
  }

  const salvarConfig = async () => {
    if (!config) return

    const { error } = await supabase
      .from('config_quiosque')
      .update({
        ...config,
        updated_at: new Date().toISOString()
      })
      .eq('id', config.id)

    if (error) {
      toast.error('Erro: ' + error.message)
      return
    }

    toast.success('Configurações salvas!')
    verificarAberturaReservas()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-700'
      case 'utilizado': return 'bg-blue-100 text-blue-700'
      case 'expirado': return 'bg-gray-100 text-gray-600'
      case 'cancelado': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  // Datas disponíveis para reserva
  const getDatasDisponiveis = () => {
    const datas: string[] = []
    const hoje = new Date()
    const maxDias = config?.dias_antecedencia_max || 7

    for (let i = 0; i <= maxDias; i++) {
      const data = new Date(hoje)
      data.setDate(data.getDate() + i)
      // Não permitir reserva para dias passados
      if (data >= hoje) {
        datas.push(data.toISOString().split('T')[0])
      }
    }

    return datas
  }

  const tabs = [
    { id: 'reservar', label: 'Reservar', icon: Calendar },
    { id: 'minhas', label: 'Minhas Reservas', icon: User },
    ...(isAdmin ? [
      { id: 'todas', label: 'Todas Reservas', icon: Users },
      { id: 'quiosques', label: 'Gerenciar Quiosques', icon: Tent },
      { id: 'config', label: 'Configurações', icon: Settings },
    ] : [])
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tent className="h-6 w-6 text-green-600" />
            Quiosques
          </h1>
          <p className="text-muted-foreground">Reserva de quiosques do clube</p>
        </div>

        {/* Status das reservas */}
        <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
          reservasAbertas ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {reservasAbertas ? (
            <>
              <Unlock className="h-5 w-5" />
              <span className="font-medium">Reservas Abertas!</span>
            </>
          ) : (
            <>
              <Lock className="h-5 w-5" />
              <div>
                <span className="font-medium">Reservas Fechadas</span>
                {proximaAbertura && (
                  <p className="text-xs">
                    Abre: {DIAS_SEMANA[proximaAbertura.getDay()]} às {config?.hora_abertura_reservas?.slice(0, 5)}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(t => (
          <Button
            key={t.id}
            variant={tab === t.id ? 'default' : 'outline'}
            onClick={() => setTab(t.id as any)}
            className="whitespace-nowrap"
          >
            <t.icon className="h-4 w-4 mr-2" />
            {t.label}
          </Button>
        ))}
      </div>

      {/* Tab: Reservar */}
      {tab === 'reservar' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Form de Reserva */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Nova Reserva
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!reservasAbertas && !isAdmin ? (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                  <p className="font-medium">Reservas Fechadas</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    As reservas abrem toda {DIAS_SEMANA[config?.dia_abertura_reservas || 5]} às {config?.hora_abertura_reservas?.slice(0, 5)}
                  </p>
                </div>
              ) : (
                <>
                  {isAdmin && (
                    <div>
                      <label className="text-sm font-medium">Associado *</label>
                      <select
                        value={associadoSelecionado}
                        onChange={e => setAssociadoSelecionado(e.target.value)}
                        className="w-full h-10 px-3 border rounded-md mt-1"
                      >
                        <option value="">Selecione...</option>
                        {associados.map(a => (
                          <option key={a.id} value={a.id}>{a.numero_titulo} - {a.nome}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Data *</label>
                    <select
                      value={dataReserva}
                      onChange={e => { setDataReserva(e.target.value); setQuiosqueSelecionado('') }}
                      className="w-full h-10 px-3 border rounded-md mt-1"
                    >
                      <option value="">Selecione a data...</option>
                      {getDatasDisponiveis().map(d => (
                        <option key={d} value={d}>
                          {new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {dataReserva && (
                    <div>
                      <label className="text-sm font-medium">Quiosque Disponível *</label>
                      <select
                        value={quiosqueSelecionado}
                        onChange={e => setQuiosqueSelecionado(e.target.value)}
                        className="w-full h-10 px-3 border rounded-md mt-1"
                      >
                        <option value="">Selecione...</option>
                        {getQuiosquesDisponiveis(dataReserva).map(q => (
                          <option key={q.id} value={q.id}>
                            Quiosque {q.numero} - {q.nome} ({q.capacidade} pessoas)
                          </option>
                        ))}
                      </select>
                      {getQuiosquesDisponiveis(dataReserva).length === 0 && (
                        <p className="text-sm text-red-500 mt-1">Nenhum quiosque disponível para esta data</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Observações</label>
                    <Input
                      value={observacoes}
                      onChange={e => setObservacoes(e.target.value)}
                      placeholder="Ex: Aniversário do João"
                    />
                  </div>

                  <Button 
                    onClick={fazerReserva} 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!dataReserva || !quiosqueSelecionado || !associadoSelecionado}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Reserva
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lista de Quiosques */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {quiosques.filter(q => q.ativo).map(q => {
              const reservado = dataReserva 
                ? reservas.find(r => r.quiosque_id === q.id && r.data_reserva === dataReserva && r.status === 'ativo')
                : null

              return (
                <Card 
                  key={q.id} 
                  className={`cursor-pointer transition-all ${
                    quiosqueSelecionado === q.id 
                      ? 'ring-2 ring-green-500 bg-green-50' 
                      : reservado 
                        ? 'opacity-50 bg-red-50' 
                        : 'hover:shadow-md'
                  }`}
                  onClick={() => !reservado && dataReserva && setQuiosqueSelecionado(q.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-green-600">{q.numero}</span>
                        <span className="font-medium">{q.nome}</span>
                      </div>
                      {reservado ? (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Reservado</span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Disponível</span>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{q.descricao}</p>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                        <Users className="h-3 w-3" /> {q.capacidade}
                      </span>
                      {q.possui_churrasqueira && (
                        <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          <Flame className="h-3 w-3" /> Churrasqueira
                        </span>
                      )}
                      {q.possui_banheiro && (
                        <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          <Bath className="h-3 w-3" /> Banheiro
                        </span>
                      )}
                      {q.possui_pia && (
                        <span className="flex items-center gap-1 bg-cyan-100 text-cyan-700 px-2 py-1 rounded">
                          <Droplets className="h-3 w-3" /> Pia
                        </span>
                      )}
                    </div>

                    {reservado && (
                      <div className="mt-3 pt-3 border-t text-sm">
                        <p className="font-medium">Reservado por: {reservado.associado?.nome}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Tab: Minhas Reservas */}
      {tab === 'minhas' && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Quiosque</th>
                  <th className="text-left p-3 font-medium">Data</th>
                  <th className="text-left p-3 font-medium">Reserva até</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {minhasReservas.map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">Quiosque {r.quiosque?.numero}</div>
                      <div className="text-sm text-muted-foreground">{r.quiosque?.nome}</div>
                    </td>
                    <td className="p-3">
                      {new Date(r.data_reserva + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                    </td>
                    <td className="p-3">{r.hora_limite?.slice(0, 5)}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(r.status)}`}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => imprimirComprovante(r)} title="Imprimir">
                        <Printer className="h-4 w-4" />
                      </Button>
                      {r.status === 'ativo' && (
                        <Button variant="ghost" size="sm" onClick={() => cancelarReserva(r.id)} title="Cancelar" className="text-red-600">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {minhasReservas.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma reserva encontrada</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tab: Todas Reservas (Admin) */}
      {tab === 'todas' && isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-10" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Quiosque</th>
                  <th className="text-left p-3 font-medium">Associado</th>
                  <th className="text-left p-3 font-medium">Data</th>
                  <th className="text-left p-3 font-medium">Reserva até</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {reservas.filter(r => 
                  !busca || 
                  r.associado?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                  r.quiosque?.nome?.toLowerCase().includes(busca.toLowerCase())
                ).map(r => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium">Quiosque {r.quiosque?.numero}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{r.associado?.nome}</div>
                      <div className="text-sm text-muted-foreground">{r.associado?.numero_titulo}</div>
                    </td>
                    <td className="p-3">
                      {new Date(r.data_reserva + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3">{r.hora_limite?.slice(0, 5)}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(r.status)}`}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => imprimirComprovante(r)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      {r.status === 'ativo' && (
                        <Button variant="ghost" size="sm" onClick={() => cancelarReserva(r.id)} className="text-red-600">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tab: Gerenciar Quiosques (Admin) */}
      {tab === 'quiosques' && isAdmin && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { resetFormQuiosque(); setEditandoQuiosque(null); setShowFormQuiosque(true) }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Quiosque
            </Button>
          </div>

          {showFormQuiosque && (
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle>{editandoQuiosque ? 'Editar' : 'Novo'} Quiosque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Número *</label>
                    <Input type="number" value={formQuiosque.numero} onChange={e => setFormQuiosque({...formQuiosque, numero: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Nome</label>
                    <Input value={formQuiosque.nome} onChange={e => setFormQuiosque({...formQuiosque, nome: e.target.value})} placeholder="Ex: Quiosque do Lago" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Capacidade</label>
                    <Input type="number" value={formQuiosque.capacidade} onChange={e => setFormQuiosque({...formQuiosque, capacidade: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Input value={formQuiosque.descricao} onChange={e => setFormQuiosque({...formQuiosque, descricao: e.target.value})} placeholder="Localização, características..." />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Valor Reserva</label>
                    <Input type="number" step="0.01" value={formQuiosque.valor_reserva} onChange={e => setFormQuiosque({...formQuiosque, valor_reserva: e.target.value})} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formQuiosque.possui_churrasqueira} onChange={e => setFormQuiosque({...formQuiosque, possui_churrasqueira: e.target.checked})} className="rounded" />
                    <Flame className="h-4 w-4 text-orange-500" /> Churrasqueira
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formQuiosque.possui_banheiro} onChange={e => setFormQuiosque({...formQuiosque, possui_banheiro: e.target.checked})} className="rounded" />
                    <Bath className="h-4 w-4 text-blue-500" /> Banheiro
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formQuiosque.possui_pia} onChange={e => setFormQuiosque({...formQuiosque, possui_pia: e.target.checked})} className="rounded" />
                    <Droplets className="h-4 w-4 text-cyan-500" /> Pia
                  </label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowFormQuiosque(false); setEditandoQuiosque(null) }}>Cancelar</Button>
                  <Button onClick={salvarQuiosque} className="bg-green-600 hover:bg-green-700">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-3 gap-4">
            {quiosques.map(q => (
              <Card key={q.id} className={!q.ativo ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl font-bold text-green-600">{q.numero}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => editarQuiosque(q)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleAtivoQuiosque(q)}>
                        {q.ativo ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => excluirQuiosque(q.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <p className="font-medium">{q.nome}</p>
                  <p className="text-sm text-muted-foreground">{q.descricao}</p>
                  <div className="flex flex-wrap gap-1 mt-2 text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded">{q.capacidade} pessoas</span>
                    {q.possui_churrasqueira && <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">Churrasqueira</span>}
                    {q.possui_banheiro && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Banheiro</span>}
                  </div>
                  {!q.ativo && <span className="text-xs text-red-500 font-medium">DESATIVADO</span>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Configurações (Admin) */}
      {tab === 'config' && isAdmin && config && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Reserva
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Dia de Abertura das Reservas</label>
                <select
                  value={config.dia_abertura_reservas}
                  onChange={e => setConfig({...config, dia_abertura_reservas: parseInt(e.target.value)})}
                  className="w-full h-10 px-3 border rounded-md mt-1"
                >
                  {DIAS_SEMANA.map((dia, i) => (
                    <option key={i} value={i}>{dia}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Hora de Abertura</label>
                <Input
                  type="time"
                  value={config.hora_abertura_reservas}
                  onChange={e => setConfig({...config, hora_abertura_reservas: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Hora Limite da Reserva (no dia)</label>
                <Input
                  type="time"
                  value={config.hora_limite_reserva}
                  onChange={e => setConfig({...config, hora_limite_reserva: e.target.value})}
                />
                <p className="text-xs text-muted-foreground mt-1">Após este horário, o quiosque fica liberado</p>
              </div>
              <div>
                <label className="text-sm font-medium">Dias de Antecedência Máxima</label>
                <Input
                  type="number"
                  value={config.dias_antecedencia_max}
                  onChange={e => setConfig({...config, dias_antecedencia_max: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Valor Padrão da Reserva</label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.valor_padrao_reserva}
                  onChange={e => setConfig({...config, valor_padrao_reserva: parseFloat(e.target.value)})}
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.permite_multiplas_reservas}
                    onChange={e => setConfig({...config, permite_multiplas_reservas: e.target.checked})}
                    className="rounded"
                  />
                  Permitir múltiplas reservas por associado
                </label>
              </div>
            </div>

            <Button onClick={salvarConfig} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
