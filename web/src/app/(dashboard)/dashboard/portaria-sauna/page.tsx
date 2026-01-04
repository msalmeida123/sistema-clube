'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Droplets, Search, Key, CreditCard, User, Clock, AlertTriangle,
  CheckCircle, XCircle, Loader2, QrCode, LogIn, LogOut, Settings
} from 'lucide-react'


type Armario = {
  id: string
  numero: number
  status: string
  qr_code: string
}

type UsoArmario = {
  id: string
  armario_id: string
  associado_id: string | null
  dependente_id: string | null
  carteirinha_retida: boolean
  chave_entregue: boolean
  data_entrada: string
  data_saida: string | null
  chave_devolvida: boolean
  chave_perdida: boolean
  valor_multa: number
  armario?: Armario
  associado?: { id: string; nome: string; cpf: string }
  dependente?: { id: string; nome: string }
}

type Pessoa = {
  id: string
  nome: string
  cpf: string
  tipo: 'associado' | 'dependente'
  status: string
}

export default function PortariaSaunaPage() {
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [tab, setTab] = useState<'entrada' | 'saida' | 'armarios' | 'multas'>('entrada')
  const [armarios, setArmarios] = useState<Armario[]>([])
  const [armariosDisponiveis, setArmariosDisponiveis] = useState<Armario[]>([])
  const [usosAtivos, setUsosAtivos] = useState<UsoArmario[]>([])
  const [loading, setLoading] = useState(true)
  const [buscando, setBuscando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  
  // Entrada
  const [busca, setBusca] = useState('')
  const [pessoa, setPessoa] = useState<Pessoa | null>(null)
  const [armarioSelecionado, setArmarioSelecionado] = useState<Armario | null>(null)
  const [qrCode, setQrCode] = useState('')
  
  // Saída
  const [usoParaSaida, setUsoParaSaida] = useState<UsoArmario | null>(null)
  const [chavePerdida, setChavePerdida] = useState(false)
  const [valorMulta, setValorMulta] = useState('50.00')
  const [modalSaida, setModalSaida] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    // Carregar usuário logado
    const carregarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('id')
          .eq('auth_id', user.id)
          .single()
        if (userData) setUsuarioId(userData.id)
      }
    }
    carregarUsuario()
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)

    // Carregar todos os armários
    const { data: armariosData } = await supabase
      .from('armarios_sauna')
      .select('*')
      .order('numero')

    setArmarios(armariosData || [])
    setArmariosDisponiveis((armariosData || []).filter(a => a.status === 'disponivel'))

    // Carregar usos ativos
    const { data: usosData } = await supabase
      .from('uso_armarios_sauna')
      .select(`
        *,
        armario:armarios_sauna(*),
        associado:associados(id, nome, cpf),
        dependente:dependentes(id, nome)
      `)
      .is('data_saida', null)
      .order('data_entrada', { ascending: false })

    setUsosAtivos(usosData || [])
    setLoading(false)
  }

  const buscarPessoa = async () => {
    if (!busca.trim()) {
      toast.error('Digite o CPF ou código do cartão')
      return
    }

    setBuscando(true)
    setPessoa(null)

    // Buscar associado
    const { data: associado } = await supabase
      .from('associados')
      .select('id, nome, cpf, status')
      .or(`cpf.eq.${busca},codigo_cartao.eq.${busca}`)
      .single()

    if (associado) {
      setPessoa({
        id: associado.id,
        nome: associado.nome,
        cpf: associado.cpf,
        tipo: 'associado',
        status: associado.status,
      })
      setBuscando(false)
      return
    }

    // Buscar dependente
    const { data: dependente } = await supabase
      .from('dependentes')
      .select('id, nome, cpf, status')
      .or(`cpf.eq.${busca},codigo_cartao.eq.${busca}`)
      .single()

    if (dependente) {
      setPessoa({
        id: dependente.id,
        nome: dependente.nome,
        cpf: dependente.cpf || '',
        tipo: 'dependente',
        status: dependente.status,
      })
      setBuscando(false)
      return
    }

    toast.error('Nenhum associado ou dependente encontrado')
    setBuscando(false)
  }

  const buscarPorQRCode = async () => {
    if (!qrCode.trim()) {
      toast.error('Digite ou escaneie o QR Code')
      return
    }

    const armario = armarios.find(a => a.qr_code === qrCode)
    
    if (armario) {
      if (armario.status === 'disponivel') {
        setArmarioSelecionado(armario)
        toast.success(`Armário ${armario.numero} selecionado`)
      } else {
        toast.error(`Armário ${armario.numero} está ${armario.status}`)
      }
    } else {
      toast.error('QR Code não encontrado')
    }
    setQrCode('')
  }

  const registrarEntrada = async () => {
    if (!pessoa || !armarioSelecionado) {
      toast.error('Selecione a pessoa e o armário')
      return
    }

    if (pessoa.status !== 'ativo') {
      toast.error('Pessoa com cadastro inativo')
      return
    }

    // Verificar se já está usando um armário
    const usoExistente = usosAtivos.find(u => 
      (pessoa.tipo === 'associado' && u.associado_id === pessoa.id) ||
      (pessoa.tipo === 'dependente' && u.dependente_id === pessoa.id)
    )

    if (usoExistente) {
      toast.error('Esta pessoa já está usando um armário')
      return
    }

    setSalvando(true)

    // Registrar uso
    const { error: usoError } = await supabase
      .from('uso_armarios_sauna')
      .insert({
        armario_id: armarioSelecionado.id,
        associado_id: pessoa.tipo === 'associado' ? pessoa.id : null,
        dependente_id: pessoa.tipo === 'dependente' ? pessoa.id : null,
        carteirinha_retida: true,
        chave_entregue: true,
        usuario_entrada_id: usuarioId,
      })

    if (usoError) {
      toast.error('Erro: ' + usoError.message)
      setSalvando(false)
      return
    }

    // Atualizar status do armário
    await supabase
      .from('armarios_sauna')
      .update({ status: 'ocupado', updated_at: new Date().toISOString() })
      .eq('id', armarioSelecionado.id)

    toast.success(`Entrada registrada! ${pessoa.nome} - Armário ${armarioSelecionado.numero}`)

    // Limpar e recarregar
    setPessoa(null)
    setArmarioSelecionado(null)
    setBusca('')
    carregarDados()
    setSalvando(false)
  }

  const abrirModalSaida = (uso: UsoArmario) => {
    setUsoParaSaida(uso)
    setChavePerdida(false)
    setValorMulta('50.00')
    setModalSaida(true)
  }

  const registrarSaida = async () => {
    if (!usoParaSaida) return

    setSalvando(true)

    // Atualizar uso
    const { error: usoError } = await supabase
      .from('uso_armarios_sauna')
      .update({
        data_saida: new Date().toISOString(),
        chave_devolvida: !chavePerdida,
        chave_perdida: chavePerdida,
        valor_multa: chavePerdida ? parseFloat(valorMulta) : 0,
        usuario_saida_id: usuarioId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', usoParaSaida.id)

    if (usoError) {
      toast.error('Erro: ' + usoError.message)
      setSalvando(false)
      return
    }

    // Liberar armário
    await supabase
      .from('armarios_sauna')
      .update({ 
        status: chavePerdida ? 'manutencao' : 'disponivel',
        updated_at: new Date().toISOString()
      })
      .eq('id', usoParaSaida.armario?.id)

    // Se chave perdida, criar multa
    if (chavePerdida && usoParaSaida.associado?.id) {
      await supabase
        .from('multas_sauna')
        .insert({
          uso_armario_id: usoParaSaida.id,
          associado_id: usoParaSaida.associado.id,
          valor: parseFloat(valorMulta),
          descricao: `Chave perdida - Armário ${usoParaSaida.armario?.numero}`,
          status: 'pendente',
        })

      toast.warning(`Saída com multa de R$ ${valorMulta}`)
    } else {
      toast.success('Saída registrada com sucesso!')
    }

    setModalSaida(false)
    setUsoParaSaida(null)
    carregarDados()
    setSalvando(false)
  }

  const formatarHora = (data: string) => {
    return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const getStatusCor = (status: string) => {
    switch (status) {
      case 'disponivel': return 'bg-green-100 text-green-700 border-green-300'
      case 'ocupado': return 'bg-red-100 text-red-700 border-red-300'
      case 'manutencao': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Droplets className="h-6 w-6 text-blue-600" />
            Portaria Sauna
          </h1>
          <p className="text-muted-foreground">Controle de armários e chaves</p>
        </div>
        <Button variant="outline" onClick={carregarDados}>
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{armariosDisponiveis.length}</div>
              <div className="text-sm text-muted-foreground">Disponíveis</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{usosAtivos.length}</div>
              <div className="text-sm text-muted-foreground">Em Uso</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {armarios.filter(a => a.status === 'manutencao').length}
              </div>
              <div className="text-sm text-muted-foreground">Manutenção</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{armarios.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('entrada')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'entrada' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <LogIn className="h-4 w-4 inline mr-2" />
          Entrada
        </button>
        <button
          onClick={() => setTab('saida')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'saida' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <LogOut className="h-4 w-4 inline mr-2" />
          Saída ({usosAtivos.length})
        </button>
        <button
          onClick={() => setTab('armarios')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'armarios' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Key className="h-4 w-4 inline mr-2" />
          Armários
        </button>
      </div>

      {/* Tab Entrada */}
      {tab === 'entrada' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Identificar Pessoa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                1. Identificar Pessoa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="CPF ou código do cartão"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscarPessoa()}
                />
                <Button onClick={buscarPessoa} disabled={buscando}>
                  {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {pessoa && (
                <div className={`p-4 rounded-lg border-2 ${
                  pessoa.status === 'ativo' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-bold">
                        {pessoa.nome.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{pessoa.nome}</div>
                      <div className="text-sm text-gray-500">
                        {pessoa.tipo === 'associado' ? '👤 Associado' : '👥 Dependente'}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      pessoa.status === 'ativo' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                    }`}>
                      {pessoa.status}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selecionar Armário */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                2. Selecionar Armário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="QR Code do armário"
                  value={qrCode}
                  onChange={e => setQrCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && buscarPorQRCode()}
                />
                <Button onClick={buscarPorQRCode} variant="secondary">
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-gray-500">Ou selecione:</div>
              
              <div className="grid grid-cols-10 gap-2 max-h-48 overflow-y-auto">
                {armariosDisponiveis.map(armario => (
                  <button
                    key={armario.id}
                    onClick={() => setArmarioSelecionado(armario)}
                    className={`h-10 rounded font-medium transition-colors ${
                      armarioSelecionado?.id === armario.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {armario.numero}
                  </button>
                ))}
              </div>

              {armarioSelecionado && (
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <span className="text-blue-700 font-medium">
                    Armário selecionado: {armarioSelecionado.numero}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirmar */}
          <Card className="col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Carteirinha será retida
                  </span>
                  <span className="flex items-center gap-1">
                    <Key className="h-4 w-4" />
                    Chave será entregue
                  </span>
                </div>
                <Button 
                  size="lg"
                  onClick={registrarEntrada}
                  disabled={!pessoa || !armarioSelecionado || pessoa.status !== 'ativo' || salvando}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {salvando ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirmar Entrada
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Saída */}
      {tab === 'saida' && (
        <Card>
          <CardHeader>
            <CardTitle>Armários em Uso</CardTitle>
          </CardHeader>
          <CardContent>
            {usosAtivos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum armário em uso no momento
              </div>
            ) : (
              <div className="space-y-3">
                {usosAtivos.map(uso => (
                  <div
                    key={uso.id}
                    onClick={() => abrirModalSaida(uso)}
                    className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-full bg-orange-200 flex items-center justify-center">
                      <span className="text-orange-700 font-bold text-lg">
                        {uso.armario?.numero}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {uso.associado?.nome || uso.dependente?.nome}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Entrada: {formatarHora(uso.data_entrada)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <CreditCard className="h-4 w-4 text-blue-500" />
                      <Key className="h-4 w-4 text-yellow-500" />
                    </div>
                    <Button variant="outline" size="sm">
                      Registrar Saída
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab Armários */}
      {tab === 'armarios' && (
        <Card>
          <CardHeader>
            <CardTitle>Todos os Armários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-200"></div>
                <span className="text-sm">Disponível</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-200"></div>
                <span className="text-sm">Ocupado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-200"></div>
                <span className="text-sm">Manutenção</span>
              </div>
            </div>
            <div className="grid grid-cols-10 gap-2">
              {armarios.map(armario => (
                <div
                  key={armario.id}
                  className={`h-12 rounded flex items-center justify-center font-medium border ${getStatusCor(armario.status)}`}
                >
                  {armario.numero}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Saída */}
      {modalSaida && usoParaSaida && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Registrar Saída
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="font-semibold">
                  {usoParaSaida.associado?.nome || usoParaSaida.dependente?.nome}
                </div>
                <div className="text-sm text-gray-500">
                  Armário: {usoParaSaida.armario?.numero}
                </div>
                <div className="text-sm text-gray-500">
                  Entrada: {formatarHora(usoParaSaida.data_entrada)}
                </div>
              </div>

              <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer ${
                chavePerdida ? 'border-red-500 bg-red-50' : 'border-gray-200'
              }`}>
                <input
                  type="checkbox"
                  checked={chavePerdida}
                  onChange={e => setChavePerdida(e.target.checked)}
                  className="h-5 w-5"
                />
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-5 w-5 ${chavePerdida ? 'text-red-500' : 'text-gray-400'}`} />
                  <span className={chavePerdida ? 'text-red-700 font-medium' : ''}>
                    Chave perdida
                  </span>
                </div>
              </label>

              {chavePerdida && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Valor da multa (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorMulta}
                    onChange={e => setValorMulta(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setModalSaida(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={registrarSaida}
                  disabled={salvando}
                  className={`flex-1 ${chavePerdida ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                >
                  {salvando ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : chavePerdida ? (
                    <AlertTriangle className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {chavePerdida ? 'Confirmar com Multa' : 'Confirmar Saída'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
