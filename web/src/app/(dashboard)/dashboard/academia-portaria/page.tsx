'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Dumbbell, Search, CheckCircle, XCircle, AlertCircle, 
  LogIn, LogOut, QrCode, User, Clock, Calendar, History
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

type Assinatura = {
  id: string
  data_inicio: string
  data_fim: string
  valor_mensal: number
  status: string
  plano: { nome: string; horario_acesso: string }
}

type Acesso = {
  id: string
  data_hora: string
  tipo: string
  associado: { nome: string; numero_titulo: string }
}

export default function AcademiaPortariaPage() {
  const [busca, setBusca] = useState('')
  const [associado, setAssociado] = useState<Associado | null>(null)
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
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
      if (agora - ultimoScan > 2000) {
        setUltimoScan(agora)
        buscarAssociado(busca)
      }
    }
  }, [busca])

  const carregarAcessosHoje = async () => {
    const hoje = new Date().toISOString().split('T')[0]
    
    const { data, count } = await supabase
      .from('acessos_academia')
      .select(`
        id, data_hora, tipo,
        associado:associados(nome, numero_titulo)
      `, { count: 'exact' })
      .gte('data_hora', hoje + 'T00:00:00')
      .lte('data_hora', hoje + 'T23:59:59')
      .order('data_hora', { ascending: false })
      .limit(20)

    setAcessosHoje(data || [])
    setTotalHoje(count || 0)
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
    } catch (e) {}
  }

  const buscarAssociado = async (codigo?: string) => {
    const termoBusca = codigo || busca
    if (!termoBusca.trim()) {
      toast.error('Digite um código QR, nome ou matrícula')
      return
    }

    setLoading(true)
    setAssociado(null)
    setAssinatura(null)

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
      playBeep(200, 300)
      return
    }

    setAssociado(assocData)

    const { data: assData } = await supabase
      .from('assinaturas_academia')
      .select(`
        id, data_inicio, data_fim, valor_mensal, status,
        plano:planos_academia(nome, horario_acesso)
      `)
      .eq('associado_id', assocData.id)
      .eq('status', 'ativa')
      .order('data_fim', { ascending: false })
      .limit(1)
      .single()

    setAssinatura(assData as any)
    setLoading(false)
    setBusca('')
    
    // Som de feedback
    if (assData && assData.status === 'ativa' && new Date(assData.data_fim) >= new Date()) {
      playBeep(800, 150)
    } else {
      playBeep(300, 300)
      setTimeout(() => playBeep(200, 300), 350)
    }
  }

  const registrarAcesso = async (tipo: 'entrada' | 'saida') => {
    if (!associado || !assinatura) return

    const hoje = new Date()
    const dataFim = new Date(assinatura.data_fim)
    
    if (assinatura.status !== 'ativa') {
      toast.error('Assinatura da academia não está ativa!')
      return
    }

    if (dataFim < hoje) {
      toast.error('Assinatura da academia vencida!')
      return
    }

    setRegistrando(true)

    const { error } = await supabase
      .from('acessos_academia')
      .insert({
        assinatura_id: assinatura.id,
        associado_id: associado.id,
        tipo
      })

    setRegistrando(false)

    if (error) {
      toast.error('Erro ao registrar: ' + error.message)
      return
    }

    toast.success(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada!`)
    playBeep(1000, 100)
    
    setAssociado(null)
    setAssinatura(null)
    carregarAcessosHoje()
    inputRef.current?.focus()
  }

  const getStatusInfo = () => {
    if (!associado) return null

    if (associado.status !== 'ativo') {
      return { cor: 'bg-gray-100 border-gray-300', texto: 'ASSOCIADO INATIVO', icone: XCircle, corIcone: 'text-gray-500', podeEntrar: false }
    }

    if (!assinatura) {
      return { cor: 'bg-red-100 border-red-500', texto: '🚫 SEM ASSINATURA DA ACADEMIA', icone: XCircle, corIcone: 'text-red-500', podeEntrar: false }
    }

    const hoje = new Date()
    const dataFim = new Date(assinatura.data_fim)
    const diasRestantes = Math.ceil((dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

    if (assinatura.status !== 'ativa') {
      return { cor: 'bg-gray-100 border-gray-300', texto: 'ASSINATURA INATIVA', icone: XCircle, corIcone: 'text-gray-500', podeEntrar: false }
    }

    if (dataFim < hoje) {
      return { cor: 'bg-red-100 border-red-500', texto: '🚫 ASSINATURA VENCIDA', icone: XCircle, corIcone: 'text-red-500', podeEntrar: false }
    }

    if (diasRestantes <= 7) {
      return { cor: 'bg-yellow-100 border-yellow-500', texto: `⚠️ VENCE EM ${diasRestantes} DIAS`, icone: AlertCircle, corIcone: 'text-yellow-600', podeEntrar: true }
    }

    return { cor: 'bg-green-100 border-green-500', texto: '✅ LIBERADO', icone: CheckCircle, corIcone: 'text-green-500', podeEntrar: true }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-orange-500" />
            Portaria da Academia
          </h1>
          <p className="text-muted-foreground">Controle de acesso por QR Code do associado</p>
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
            <p className="text-2xl font-bold text-orange-500">{totalHoje}</p>
            <p className="text-sm text-muted-foreground">acessos hoje</p>
          </div>
        </div>
      </div>

      {/* Busca */}
      <Card className={modoScanner ? 'border-2 border-orange-500' : ''}>
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
                className={`pl-10 h-14 text-xl ${modoScanner ? 'bg-orange-50 font-mono' : ''}`}
                autoFocus
              />
            </div>
            {!modoScanner && (
              <Button onClick={() => buscarAssociado()} disabled={loading} size="lg" className="h-14 px-8 bg-orange-600 hover:bg-orange-700">
                <Search className="h-5 w-5 mr-2" />
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            )}
          </div>
          {modoScanner && (
            <p className="text-sm text-orange-600 mt-2 text-center">
              📱 Scanner USB ativo - O foco permanece neste campo automaticamente
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resultado */}
      {associado && statusInfo && (
        <Card className={`border-4 ${statusInfo.cor}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                {associado.foto_url ? (
                  <img src={associado.foto_url} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-20 w-20 text-gray-400" />
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">{associado.nome}</h2>
                
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
                  {assinatura && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Plano:</span>
                        <span className="ml-2 font-bold">{assinatura.plano?.nome}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Válido até:</span>
                        <span className="ml-2 font-bold text-lg">{new Date(assinatura.data_fim).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Horário:</span>
                        <span className="ml-2 font-bold">{assinatura.plano?.horario_acesso || 'Livre'}</span>
                      </div>
                    </>
                  )}
                </div>

                {!assinatura && (
                  <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700 font-bold">
                    ❌ Este associado não possui assinatura ativa da academia.
                  </div>
                )}
              </div>

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
                  disabled={!statusInfo.podeEntrar || registrando}
                  size="lg"
                  variant="outline"
                  className="h-24 px-12 text-xl"
                >
                  <LogOut className="h-10 w-10 mr-3" />
                  SAÍDA
                </Button>
                <Button
                  onClick={() => { setAssociado(null); setAssinatura(null); inputRef.current?.focus() }}
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
                  <div className="text-right">
                    <p className="font-medium">
                      {new Date(acesso.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">{acesso.tipo}</p>
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
