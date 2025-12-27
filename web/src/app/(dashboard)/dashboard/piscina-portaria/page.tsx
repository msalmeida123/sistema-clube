'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Waves, Search, CheckCircle, XCircle, AlertCircle, 
  LogIn, LogOut, QrCode, User, History, Stethoscope, Calendar
} from 'lucide-react'

type Associado = {
  id: string
  nome: string
  numero_titulo: string
  telefone: string
  foto_url?: string
  qr_code: string
  status: string
}

type ExameMedico = {
  id: string
  data_exame: string
  data_validade: string
  tipo_exame: string
  resultado: string
  medico_nome: string
  observacoes: string
}

type Acesso = {
  id: string
  data_hora: string
  tipo: string
  exame_valido: boolean
  associado: { nome: string; numero_titulo: string }
}

export default function PiscinaPortariaPage() {
  const [busca, setBusca] = useState('')
  const [associado, setAssociado] = useState<Associado | null>(null)
  const [exame, setExame] = useState<ExameMedico | null>(null)
  const [acessosHoje, setAcessosHoje] = useState<Acesso[]>([])
  const [loading, setLoading] = useState(false)
  const [registrando, setRegistrando] = useState(false)
  const [totalHoje, setTotalHoje] = useState(0)
  const [modoScanner, setModoScanner] = useState(true)
  const [ultimoScan, setUltimoScan] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    carregarAcessosHoje()
    // Focar no input ao carregar
    inputRef.current?.focus()
    
    // Manter foco no input (para scanner USB)
    const interval = setInterval(() => {
      if (modoScanner && document.activeElement !== inputRef.current) {
        inputRef.current?.focus()
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [modoScanner])

  // Auto-buscar quando detectar QR Code completo (scanner USB)
  useEffect(() => {
    if (busca.startsWith('SOCIO-') && busca.length >= 14) {
      const agora = Date.now()
      // Evitar buscas duplicadas em menos de 2 segundos
      if (agora - ultimoScan > 2000) {
        setUltimoScan(agora)
        buscarAssociado(busca)
      }
    }
  }, [busca])

  const carregarAcessosHoje = async () => {
    const hoje = new Date().toISOString().split('T')[0]
    
    const { data, count } = await supabase
      .from('acessos_piscina')
      .select(`
        id, data_hora, tipo, exame_valido,
        associado:associados(nome, numero_titulo)
      `, { count: 'exact' })
      .gte('data_hora', hoje + 'T00:00:00')
      .lte('data_hora', hoje + 'T23:59:59')
      .order('data_hora', { ascending: false })
      .limit(20)

    setAcessosHoje(data || [])
    setTotalHoje(count || 0)
  }

  const buscarAssociado = async (codigo?: string) => {
    const termoBusca = codigo || busca
    if (!termoBusca.trim()) {
      toast.error('Digite um código QR, nome ou matrícula')
      return
    }

    setLoading(true)
    setAssociado(null)
    setExame(null)

    // Buscar associado por QR Code, nome ou número do título
    const { data: assocData, error } = await supabase
      .from('associados')
      .select('id, nome, numero_titulo, telefone, foto_url, qr_code, status')
      .or(`qr_code.ilike.%${termoBusca}%,nome.ilike.%${termoBusca}%,numero_titulo.ilike.%${termoBusca}%`)
      .limit(1)
      .single()

    if (error || !assocData) {
      setLoading(false)
      setBusca('')
      toast.error('Associado não encontrado')
      return
    }

    setAssociado(assocData)

    // Buscar exame médico mais recente e válido
    const hoje = new Date().toISOString().split('T')[0]
    const { data: exameData } = await supabase
      .from('exames_medicos')
      .select('*')
      .eq('associado_id', assocData.id)
      .gte('data_validade', hoje)
      .eq('resultado', 'apto')
      .order('data_validade', { ascending: false })
      .limit(1)
      .single()

    setExame(exameData)
    setLoading(false)
    setBusca('')
    
    // Som de feedback
    if (exameData) {
      // Liberado - som positivo
      playBeep(800, 150)
    } else {
      // Bloqueado - som negativo
      playBeep(300, 300)
      setTimeout(() => playBeep(200, 300), 350)
    }
  }

  const playBeep = (frequency: number, duration: number) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.frequency.value = frequency
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (e) {
      // Ignorar se áudio não disponível
    }
  }

  const registrarAcesso = async (tipo: 'entrada' | 'saida') => {
    if (!associado) return

    // Verificar se associado está ativo
    if (associado.status !== 'ativo') {
      toast.error('Associado não está ativo!')
      return
    }

    // Verificar exame médico
    const exameValido = !!exame

    if (!exameValido && tipo === 'entrada') {
      toast.error('Entrada bloqueada! Exame médico vencido ou inexistente.')
      playBeep(200, 500)
      return
    }

    setRegistrando(true)

    const { error } = await supabase
      .from('acessos_piscina')
      .insert({
        associado_id: associado.id,
        tipo,
        exame_valido: exameValido
      })

    setRegistrando(false)

    if (error) {
      toast.error('Erro ao registrar: ' + error.message)
      return
    }

    toast.success(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada!`)
    playBeep(1000, 100)
    
    setAssociado(null)
    setExame(null)
    carregarAcessosHoje()
    inputRef.current?.focus()
  }

  // Registrar entrada automaticamente se liberado (modo scanner)
  const registrarEntradaAutomatica = async () => {
    if (!associado || !exame) return
    if (associado.status !== 'ativo') return
    
    setRegistrando(true)
    
    const { error } = await supabase
      .from('acessos_piscina')
      .insert({
        associado_id: associado.id,
        tipo: 'entrada',
        exame_valido: true
      })

    setRegistrando(false)

    if (!error) {
      toast.success('✅ Entrada registrada automaticamente!')
      playBeep(1000, 100)
      setTimeout(() => {
        setAssociado(null)
        setExame(null)
        carregarAcessosHoje()
      }, 2000)
    }
  }

  const getStatusInfo = () => {
    if (!associado) return null

    if (associado.status !== 'ativo') {
      return { 
        cor: 'bg-gray-100 border-gray-300', 
        texto: 'ASSOCIADO INATIVO', 
        icone: XCircle, 
        corIcone: 'text-gray-500', 
        podeEntrar: false 
      }
    }

    if (!exame) {
      return { 
        cor: 'bg-red-100 border-red-500', 
        texto: '🚫 BLOQUEADO - SEM EXAME MÉDICO', 
        icone: XCircle, 
        corIcone: 'text-red-500', 
        podeEntrar: false 
      }
    }

    const hoje = new Date()
    const dataValidade = new Date(exame.data_validade)
    const diasRestantes = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

    if (diasRestantes <= 15) {
      return { 
        cor: 'bg-yellow-100 border-yellow-500', 
        texto: `⚠️ LIBERADO - EXAME VENCE EM ${diasRestantes} DIAS`, 
        icone: AlertCircle, 
        corIcone: 'text-yellow-600', 
        podeEntrar: true 
      }
    }

    return { 
      cor: 'bg-green-100 border-green-500', 
      texto: '✅ LIBERADO', 
      icone: CheckCircle, 
      corIcone: 'text-green-500', 
      podeEntrar: true 
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Waves className="h-6 w-6 text-blue-500" />
            Portaria da Piscina
          </h1>
          <p className="text-muted-foreground">Controle de acesso com verificação de exame médico</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={modoScanner}
              onChange={e => setModoScanner(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">Modo Scanner USB</span>
          </label>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-500">{totalHoje}</p>
            <p className="text-sm text-muted-foreground">acessos hoje</p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <Card className={modoScanner ? 'border-2 border-blue-500' : ''}>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                ref={inputRef}
                placeholder={modoScanner ? "🔍 Aguardando leitura do QR Code..." : "Digite nome ou matrícula..."}
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarAssociado()}
                className={`pl-10 h-14 text-xl ${modoScanner ? 'bg-blue-50 font-mono' : ''}`}
                autoFocus
              />
            </div>
            {!modoScanner && (
              <Button onClick={() => buscarAssociado()} disabled={loading} size="lg" className="h-14 px-8 bg-blue-600 hover:bg-blue-700">
                <Search className="h-5 w-5 mr-2" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            )}
          </div>
          {modoScanner && (
            <p className="text-sm text-blue-600 mt-2 text-center">
              📱 Scanner USB ativo - O foco permanece neste campo automaticamente
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resultado da Busca */}
      {associado && statusInfo && (
        <Card className={`border-4 ${statusInfo.cor}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              {/* Foto */}
              <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                {associado.foto_url ? (
                  <img src={associado.foto_url} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-20 w-20 text-gray-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{associado.nome}</h2>
                
                {/* Status Grande */}
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-2xl font-bold mb-4 ${statusInfo.cor}`}>
                  <statusInfo.icone className={`h-8 w-8 ${statusInfo.corIcone}`} />
                  {statusInfo.texto}
                </div>

                <div className="grid grid-cols-2 gap-4 text-base">
                  <div>
                    <span className="text-muted-foreground">Matrícula:</span>
                    <span className="ml-2 font-bold text-lg">{associado.numero_titulo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">QR Code:</span>
                    <span className="ml-2 font-mono font-bold">{associado.qr_code}</span>
                  </div>
                </div>

                {/* Info do Exame */}
                <div className={`mt-4 p-4 rounded-lg border-2 ${exame ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className={`h-6 w-6 ${exame ? 'text-green-600' : 'text-red-600'}`} />
                    <span className="font-bold text-lg">Exame Médico</span>
                  </div>
                  {exame ? (
                    <div className="grid grid-cols-2 gap-3 text-base">
                      <div>
                        <span className="text-muted-foreground">Válido até:</span>
                        <span className="ml-2 font-bold text-green-600 text-lg">
                          {new Date(exame.data_validade).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Resultado:</span>
                        <span className="ml-2 font-bold uppercase text-green-600">{exame.resultado}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-red-600 font-bold text-lg">
                      ❌ EXAME MÉDICO VENCIDO OU INEXISTENTE
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de Acesso */}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => registrarAcesso('entrada')}
                  disabled={!statusInfo.podeEntrar || registrando}
                  size="lg"
                  className={`h-24 px-12 text-xl ${statusInfo.podeEntrar ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'}`}
                >
                  <LogIn className="h-10 w-10 mr-3" />
                  ENTRADA
                </Button>
                <Button
                  onClick={() => registrarAcesso('saida')}
                  disabled={registrando}
                  size="lg"
                  variant="outline"
                  className="h-24 px-12 text-xl"
                >
                  <LogOut className="h-10 w-10 mr-3" />
                  SAÍDA
                </Button>
                <Button
                  onClick={() => { setAssociado(null); setExame(null); inputRef.current?.focus() }}
                  variant="ghost"
                  className="text-gray-500"
                >
                  Limpar (ESC)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Últimos Acessos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Últimos Acessos Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {acessosHoje.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum acesso registrado hoje</p>
          ) : (
            <div className="space-y-2">
              {acessosHoje.map(acesso => (
                <div key={acesso.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {acesso.tipo === 'entrada' ? (
                      <LogIn className="h-5 w-5 text-green-500" />
                    ) : (
                      <LogOut className="h-5 w-5 text-gray-500" />
                    )}
                    <div>
                      <p className="font-medium">{acesso.associado?.nome}</p>
                      <p className="text-sm text-muted-foreground">{acesso.associado?.numero_titulo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {acesso.exame_valido ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Exame OK</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Sem Exame</span>
                    )}
                    <div className="text-right">
                      <p className="font-medium">
                        {new Date(acesso.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">{acesso.tipo}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
