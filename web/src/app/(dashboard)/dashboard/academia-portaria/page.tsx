'use client'
import {formatarDataCalendario} from '@/lib/data-calendario'

import PagamentoMensalidade from '@/components/PagamentoMensalidade'
import {PixSandboxPortaria} from '@/components/PixSandboxPortaria'
import { hojeBrasil } from '@/lib/documentos-dependente'
import { codigoCarteirinha } from '@/lib/carteirinha-qr'
import { useState, useEffect, useRef } from 'react'
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
  associado: { nome: string; numero_titulo: string } | null
}

export default function AcademiaPortariaPage() {
  const [financeiroOk,setFinanceiroOk]=useState(false)
  const [pendencias,setPendencias]=useState<any[]>([])
  const [opcoes, setOpcoes] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [associado, setAssociado] = useState<Associado | null>(null)
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [acessosHoje, setAcessosHoje] = useState<Acesso[]>([])
  const [loading, setLoading] = useState(false)
  const [registrando, setRegistrando] = useState(false)
  const [paginaHistorico,setPaginaHistorico]=useState(1)
  const [temMaisHistorico,setTemMaisHistorico]=useState(false)
  const [carregandoHistorico,setCarregandoHistorico]=useState(false)
  const [totalHoje, setTotalHoje] = useState(0)
  const [modoScanner, setModoScanner] = useState(true)
  const [ultimoScan, setUltimoScan] = useState<number>(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const travaRegistro = useRef(false)
  const travaBusca = useRef(false)
  async function consultarAcademia(body?:object,pagina=1){
    const r=await fetch(`/api/portaria/academia${body?'':`?pagina=${pagina}&limite=20`}`,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'})
    const d=await r.json();if(!r.ok)throw Error(d.error||'Falha ao consultar a academia.');return d
  }

  useEffect(() => {
    carregarAcessosHoje()
    inputRef.current?.focus()
    
    // Manter foco no input (para scanner USB)
    const interval = setInterval(() => {
      if (modoScanner && document.activeElement !== inputRef.current && !document.querySelector('[data-pagamento-modal]')) {
        inputRef.current?.focus()
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [modoScanner])

  const carregarAcessosHoje = async (pagina=1) => {
    setCarregandoHistorico(true)
    try{const d=await consultarAcademia(undefined,pagina);setAcessosHoje(d.acessos);setTotalHoje(d.total);setPaginaHistorico(d.pagina);setTemMaisHistorico(d.temMais)}
    catch(e:any){toast.error(e.message)}finally{setCarregandoHistorico(false)}
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

  const buscarAssociado = async (codigo?:string) => {
    if(travaBusca.current)return
    const valor=(codigo||busca).trim()
    if(!valor)return
    travaBusca.current=true;setLoading(true);setBusca('')
    setAssociado(null);setAssinatura(null);setFinanceiroOk(false);setPendencias([]);setOpcoes([])
    try{
      const d=await consultarAcademia({acao:'buscar',valor})
      if(d.opcoes){setOpcoes(d.opcoes);return}
      setAssociado(d.associado);setAssinatura(d.assinatura);setFinanceiroOk(d.financeiroOk);setPendencias(d.pendencias||[])
      playBeep(d.financeiroOk&&d.associado.status==='ativo'?800:300,150)
    }catch(e:any){toast.error(e.message)}finally{travaBusca.current=false;setLoading(false)}
  }

  const registrarAcesso = async (tipo:'entrada'|'saida') => {
    if(!associado||travaRegistro.current)return
    travaRegistro.current=true;setRegistrando(true)
    try{
      await consultarAcademia({acao:'registrar',associado_id:associado.id,tipo})
      toast.success(`${tipo==='entrada'?'Entrada':'Saída'} registrada!`);playBeep(1000,100)
      setAssociado(null);setAssinatura(null);await carregarAcessosHoje();inputRef.current?.focus()
    }catch(e:any){toast.error(e.message);playBeep(200,300)}
    finally{travaRegistro.current=false;setRegistrando(false)}
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

    if (assinatura.data_fim < hojeBrasil() || assinatura.data_inicio > hojeBrasil()) {
      return { cor: 'bg-red-100 border-red-500', texto: '🚫 ASSINATURA VENCIDA', icone: XCircle, corIcone: 'text-red-500', podeEntrar: false }
    }

    if (!financeiroOk) return {cor:'bg-red-100 border-red-500',texto:'MENSALIDADE DA ACADEMIA PENDENTE',icone:XCircle,corIcone:'text-red-500',podeEntrar:false}
    if (diasRestantes <= 7) {
      return { cor: 'bg-yellow-100 border-yellow-500', texto: `⚠️ VENCE EM ${diasRestantes} DIAS`, icone: AlertCircle, corIcone: 'text-yellow-600', podeEntrar: true }
    }

    return { cor: 'bg-green-100 border-green-500', texto: '✅ LIBERADO', icone: CheckCircle, corIcone: 'text-green-500', podeEntrar: true }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
                maxLength={512}
                onFocus={e=>{if(modoScanner)e.currentTarget.select()}}
                disabled={loading}
                placeholder={modoScanner ? "QR Code ou número do título..." : "Nome, CPF ou número do título..."}
                value={busca}
                onChange={e => setBusca(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarAssociado()}
                className={`pl-10 h-14 text-xl ${modoScanner ? 'bg-orange-50 font-mono' : ''}`}
                autoFocus
              />
            </div>
            {(
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
      <PixSandboxPortaria setor="academia"/>
      {associado && pendencias.length>0 && <Card><CardContent className="p-4 space-y-3"><h2>Mensalidades da academia</h2>{pendencias.map(m=><PagamentoMensalidade key={m.id} mensalidade={m} onPago={()=>{setAssociado(null);setAssinatura(null);setPendencias([]);toast.info('Leia novamente a carteirinha para verificar a liberação.')}}/>)}</CardContent></Card>}
      {associado && statusInfo && (
        <Card className={`border-4 ${statusInfo.cor}`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                {associado.foto_url ? (
                  <img src={associado.foto_url} alt="Foto" className="w-full h-full object-contain object-center bg-gray-100" />
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

                <div className="grid gap-4 text-base grid-cols-1 sm:grid-cols-2">
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
                        <span className="ml-2 font-bold text-lg">{formatarDataCalendario(assinatura.data_fim)}</span>
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
      {opcoes.length>0 && <Card><CardContent className="pt-4 space-y-2"><p>Selecione o associado:</p>{opcoes.map(p=><Button key={p.id} variant="outline" onClick={()=>buscarAssociado(codigoCarteirinha(p.id,p.qr_code))}>{p.nome} — Título {p.numero_titulo}</Button>)}</CardContent></Card>}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Últimos Acessos Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-3">
            <Button variant="outline" disabled={carregandoHistorico||paginaHistorico<=1} onClick={()=>carregarAcessosHoje(paginaHistorico-1)}>Anterior</Button>
            <span>Página {paginaHistorico}</span>
            <Button variant="outline" disabled={carregandoHistorico||!temMaisHistorico} onClick={()=>carregarAcessosHoje(paginaHistorico+1)}>Próxima</Button>
          </div>
          {acessosHoje.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum acesso registrado hoje</p>
          ) : (
            <div className="space-y-2">
              {acessosHoje.map(acesso => (
                <div key={acesso.id} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg">
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
