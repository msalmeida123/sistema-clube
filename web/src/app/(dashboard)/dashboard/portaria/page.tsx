'use client'
import {FotoPortaria} from '@/components/FotoPortaria'
import {atenderConvite} from '@/components/AtendimentoConvidado'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import PagamentoMensalidade from '@/components/PagamentoMensalidade'
import {PixSandboxPortaria} from '@/components/PixSandboxPortaria'
import { buscarUsuarioAtual } from '@/lib/usuario-atual'
import { PaginaProtegida } from '@/components/ui/permissao'
import { 
  QrCode, Search, CheckCircle, XCircle, User, Usb, AlertTriangle,
  CreditCard, Smartphone, DollarSign, Loader2, X, Banknote
} from 'lucide-react'

type Resultado = {
  autorizado: boolean
  motivo?: string
  pessoa?: any
  tipo?: string
  mensalidadesPendentes?: any[]
}

type ConfigPix = {
  chave_pix: string
  tipo_chave: string
  nome_beneficiario: string
  cidade: string
}

// Mapeamento de setores para pontos de acesso
const SETOR_PARA_PONTO: Record<string, string[]> = {
  'admin': ['clube'],
  'presidente': ['clube'],
  'vice_presidente': ['clube'],
  'diretoria': ['clube'],
  'portaria_clube': ['clube'],
  'portaria_piscina': ['clube'],
  'portaria_academia': ['clube'],
  '': ['clube'],
}

const PONTOS_ACESSO = [
  { id: 'clube', label: '🏛️ Sede Social' },
]

export default function PortariaPage() {
  const [opcoesPessoas, setOpcoesPessoas] = useState<any[]>([])
  const [modo, setModo] = useState<'leitor' | 'cpf' | 'nome'>('leitor')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [pontoAcesso, setPontoAcesso] = useState('')
  const [aguardandoLeitor, setAguardandoLeitor] = useState(true)
  const [userSetor, setUserSetor] = useState<string>('')
  const [pontosPermitidos, setPontosPermitidos] = useState<string[]>([])
  const [loadingUser, setLoadingUser] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState('')
  
  // Estados para pagamento
  const [showPagamento, setShowPagamento] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'credito' | 'debito' | null>(null)
  const [pixQRCode, setPixQRCode] = useState<string | null>(null)
  const [pixCopiaCola, setPixCopiaCola] = useState<string | null>(null)
  const [processandoPagamento, setProcessandoPagamento] = useState(false)
  const [configPix, setConfigPix] = useState<ConfigPix | null>(null)
  const [pagamentoId, setPagamentoId] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const ultimaConsulta = useRef({tipo:'leitor',valor:''})
  const [supabase] = useState(() => createClientComponentClient())

  // Carregar setor do usuário e config PIX
  useEffect(() => {
    const carregarDados = async () => {
      try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const userData = await buscarUsuarioAtual<{ setor: string | null }>(
          supabase,
          user.id,
          'setor'
        )

        if (userData) {
          const setor = userData.setor || 'admin'
          setUserSetor(setor)
          const pontos = SETOR_PARA_PONTO[setor] || SETOR_PARA_PONTO['admin']
          setPontosPermitidos(pontos)
          if (pontos.length > 0) setPontoAcesso(pontos[0])
        } else {
          setUserSetor('admin')
          setPontosPermitidos(['clube'])
          setPontoAcesso('clube')
        }
      } else {
        setUserSetor('admin')
        setPontosPermitidos(['clube'])
        setPontoAcesso('clube')
      }

      // Carregar config PIX
      const { data: pixConfig } = await supabase
        .from('config_pix')
        .select('*')
        .eq('ativo', true)
        .single()
      
      if (pixConfig) setConfigPix(pixConfig)

      } catch {
        setPontosPermitidos([])
        setErroCarregamento('Não foi possível carregar sua sessão. Recarregue a página ou entre novamente.')
      } finally { setLoadingUser(false) }
    }
    carregarDados()
  }, [supabase])

  // Manter foco no input
  useEffect(() => {
    if (modo === 'leitor' && aguardandoLeitor && !loadingUser && !showPagamento) {
      inputRef.current?.focus()
      const interval = setInterval(() => {
        if (modo === 'leitor' && document.activeElement !== inputRef.current && !showPagamento && !document.querySelector('[data-pagamento-modal]')) {
          inputRef.current?.focus()
        }
      }, 500)
      return () => clearInterval(interval)
    }
  }, [modo, aguardandoLeitor, loadingUser, showPagamento])

  const verificarAcesso = async (tipo: string, valor: string, escolhida?: any) => {
    if (!valor.trim() || loading) return
    
    setLoading(true)
    setAguardandoLeitor(false)
    setResultado(null)
    setShowPagamento(false)
    
    try {
      setOpcoesPessoas([])
      const valorLimpo = valor.trim()

      // VERIFICAR SE É CONVITE
      if (valorLimpo.toUpperCase().startsWith('CONV-')) {
        try {
          const convite=await atenderConvite(valorLimpo,'clube_entrada',{requisicao:crypto.randomUUID()})
          setResultado({autorizado:true,pessoa:{nome:convite.nome,tipo:'convidado'},tipo:'convidado'})
          playBeep(800,150)
          toast.success('Entrada no clube registrada. Para a piscina, apresente este QR no exame médico.')
        } catch(e:any) {
          setResultado({autorizado:false,motivo:e.message})
          playBeep(300,300)
        }
        return
      }

      const resposta = await fetch('/api/portaria/clube', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({tipo:escolhida ? ultimaConsulta.current.tipo : tipo,valor:escolhida ? ultimaConsulta.current.valor : valorLimpo,...(escolhida?{escolhida:escolhida.id}:{})})
      })
      const dados=await resposta.json()
      if(!resposta.ok)throw Error(dados.error || 'Não foi possível verificar o acesso.')
      if(dados.opcoes?.length){ultimaConsulta.current={tipo,valor:valorLimpo};setOpcoesPessoas(dados.opcoes);return}
      setResultado(dados)
      playBeep(dados.autorizado?800:300,dados.autorizado?150:300)
      if(dados.autorizado)toast.success(`Bem-vindo(a), ${dados.pessoa.nome}!`)

    } catch (error: any) {
      console.error('Erro:', error)
      setResultado({ autorizado: false, motivo: error.message || 'Erro ao verificar. Tente novamente.' })
      playBeep(300, 300)
    } finally {
      setLoading(false)
      setBusca('')
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
    } catch (e) {}
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!busca.trim()) return
    verificarAcesso(modo === 'leitor' ? 'leitor' : modo, busca)
  }

  const limparResultado = () => {
    setResultado(null)
    setOpcoesPessoas([])
    setBusca('')
    setAguardandoLeitor(true)
    setShowPagamento(false)
    setFormaPagamento(null)
    setPixQRCode(null)
    setPixCopiaCola(null)
    setPagamentoId(null)
    inputRef.current?.focus()
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (erroCarregamento) return <div className="p-6 space-y-4" role="alert"><p>{erroCarregamento}</p><Button onClick={()=>window.location.reload()}>Tentar novamente</Button></div>

  if (pontosPermitidos.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-6">
        <Card className="border-red-300">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">Você não tem permissão para acessar a portaria.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PaginaProtegida codigoPagina="portaria">
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <PixSandboxPortaria setor="clube"/>
      {opcoesPessoas.length>0 && <Card><CardContent className="pt-4 space-y-2"><p>Selecione quem está entrando:</p>{opcoesPessoas.map(p=><Button key={p.tipo+p.id} variant="outline" disabled={loading} onClick={()=>verificarAcesso('leitor',p.id,p)}>{p.nome} — {p.tipo}</Button>)}</CardContent></Card>}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-2xl">
              <Usb className="h-7 w-7" /> 
              <QrCode className="h-7 w-7" /> 
              Controle de Acesso - Portaria
            </div>
            <div className="text-sm font-normal text-muted-foreground">
              Ponto: <span className="font-medium">{PONTOS_ACESSO.find(p => p.id === pontoAcesso)?.label}</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção do Ponto */}
          {pontosPermitidos.length > 1 && (
            <div className="flex gap-3">
              {PONTOS_ACESSO.filter(p => pontosPermitidos.includes(p.id)).map((p) => (
                <Button
                  key={p.id}
                  variant={pontoAcesso === p.id ? 'default' : 'outline'}
                  onClick={() => setPontoAcesso(p.id)}
                  className="flex-1"
                >
                  {p.label}
                </Button>
              ))}
            </div>
          )}

          {/* Campo de Busca */}
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  placeholder="Escaneie o QR Code ou digite o número do título..."
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                  className="h-16 text-2xl text-center font-mono"
                  disabled={loading || showPagamento}
                />
              </div>
              <Button type="submit" size="lg" className="h-16 px-8" disabled={loading || showPagamento}>
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Search className="h-6 w-6" />}
              </Button>
            </div>
          </form>

          {/* Resultado */}
          {resultado && !showPagamento && (
            <div className={`p-6 rounded-xl border-4 ${
              resultado.autorizado 
                ? 'bg-green-50 border-green-500' 
                : resultado.mensalidadesPendentes 
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-red-50 border-red-500'
            }`}>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {resultado.pessoa && resultado.tipo!=='convidado' && <FotoPortaria key={`${resultado.pessoa.id}-${resultado.pessoa.foto_url}`} url={resultado.pessoa.foto_url} nome={resultado.pessoa.nome} tipo={resultado.tipo}/> }
                {/* Ícone */}
                <div className={`p-4 rounded-full ${
                  resultado.autorizado ? 'bg-green-500' : resultado.mensalidadesPendentes ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {resultado.autorizado ? (
                    <CheckCircle className="h-12 w-12 text-white" />
                  ) : resultado.mensalidadesPendentes ? (
                    <AlertTriangle className="h-12 w-12 text-white" />
                  ) : (
                    <XCircle className="h-12 w-12 text-white" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h2 className={`text-3xl font-bold ${
                    resultado.autorizado ? 'text-green-700' : resultado.mensalidadesPendentes ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {resultado.autorizado ? '✅ ACESSO LIBERADO' : resultado.mensalidadesPendentes ? '⚠️ PAGAMENTO PENDENTE' : '🚫 ACESSO NEGADO'}
                  </h2>
                  
                  {resultado.pessoa && (
                    <div className="mt-2">
                      <p className="text-2xl font-semibold">{resultado.pessoa.nome}</p>
                      {resultado.tipo!=='convidado' && <dl className="mt-3 grid gap-2 text-lg">
                        <div><dt className="inline text-muted-foreground">Título: </dt><dd className="inline font-semibold">{resultado.pessoa.numero_titulo || 'Não informado'}</dd></div>
                        <div><dt className="inline text-muted-foreground">Vínculo: </dt><dd className="inline font-semibold">{resultado.tipo==='dependente'?'Dependente':'Titular'}</dd></div>
                        <div><dt className="inline text-muted-foreground">Categoria: </dt><dd className="inline font-semibold capitalize">{resultado.pessoa.plano || 'Não informada'}</dd></div>
                      </dl>}
                    </div>
                  )}
                  
                  {resultado.motivo && !resultado.autorizado && (
                    <p className="mt-2 text-lg">{resultado.motivo}</p>
                  )}

                  {/* Mensalidades Pendentes */}
                  {resultado.mensalidadesPendentes && resultado.mensalidadesPendentes.length > 0 && (
                    <div className="mt-4 p-4 bg-white rounded-lg">
                      <h3 className="font-bold mb-2">Mensalidades em atraso:</h3>
                      <div className="space-y-1">
                        {resultado.mensalidadesPendentes.map(m => (
                          <div key={m.id} className="flex justify-between text-sm">
                            <span>{m.referencia}</span>
                            <span className="font-medium">{formatCurrency(m.valor)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span className="text-red-600">
                            {formatCurrency(resultado.mensalidadesPendentes.reduce((acc, m) => acc + m.valor, 0))}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3 mt-4">{resultado.mensalidadesPendentes.map(m=><PagamentoMensalidade key={m.id} mensalidade={m} onPago={()=>{limparResultado();toast.info('Pagamento salvo. Leia a carteirinha novamente para validar a entrada.')}}/>)}</div>
                      <p className="mt-2 text-sm">PIX automático Sicoob aguarda ativação da integração bancária.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={limparResultado} size="lg">
                  Nova Consulta
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
    </PaginaProtegida>
  )
}
