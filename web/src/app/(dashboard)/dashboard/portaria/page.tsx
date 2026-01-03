'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
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
  const [modo, setModo] = useState<'leitor' | 'cpf' | 'nome'>('leitor')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [pontoAcesso, setPontoAcesso] = useState('')
  const [aguardandoLeitor, setAguardandoLeitor] = useState(true)
  const [userSetor, setUserSetor] = useState<string>('')
  const [pontosPermitidos, setPontosPermitidos] = useState<string[]>([])
  const [loadingUser, setLoadingUser] = useState(true)
  
  // Estados para pagamento
  const [showPagamento, setShowPagamento] = useState(false)
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'credito' | 'debito' | null>(null)
  const [pixQRCode, setPixQRCode] = useState<string | null>(null)
  const [pixCopiaCola, setPixCopiaCola] = useState<string | null>(null)
  const [processandoPagamento, setProcessandoPagamento] = useState(false)
  const [configPix, setConfigPix] = useState<ConfigPix | null>(null)
  const [pagamentoId, setPagamentoId] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClientComponentClient()

  // Carregar setor do usuário e config PIX
  useEffect(() => {
    const carregarDados = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('usuarios')
          .select('setor')
          .eq('id', user.id)
          .single()
        
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

      setLoadingUser(false)
    }
    carregarDados()
  }, [supabase])

  // Manter foco no input
  useEffect(() => {
    if (modo === 'leitor' && aguardandoLeitor && !loadingUser && !showPagamento) {
      inputRef.current?.focus()
      const interval = setInterval(() => {
        if (modo === 'leitor' && document.activeElement !== inputRef.current && !showPagamento) {
          inputRef.current?.focus()
        }
      }, 500)
      return () => clearInterval(interval)
    }
  }, [modo, aguardandoLeitor, loadingUser, showPagamento])

  // Gerar QR Code PIX (formato EMV)
  const gerarPixQRCode = (valor: number, txid: string) => {
    if (!configPix) return null

    // Simplificado - em produção use uma biblioteca própria
    const payload = gerarPayloadPix(valor, txid)
    return payload
  }

  const gerarPayloadPix = (valor: number, txid: string) => {
    if (!configPix) return ''
    
    // Payload PIX simplificado (BRCode)
    const valorFormatado = valor.toFixed(2)
    
    // Em produção, usar biblioteca como 'pix-payload' ou gerar corretamente
    // Este é um exemplo simplificado
    const pixCopiaECola = `00020126580014br.gov.bcb.pix0136${configPix.chave_pix}5204000053039865404${valorFormatado}5802BR5913${configPix.nome_beneficiario.substring(0,13)}6008${configPix.cidade.substring(0,8)}62070503***6304`
    
    return pixCopiaECola
  }

  const verificarAcesso = async (tipo: string, valor: string) => {
    if (!valor.trim()) return
    
    setLoading(true)
    setAguardandoLeitor(false)
    setResultado(null)
    setShowPagamento(false)
    
    try {
      let pessoa = null
      let tipoPessoa = 'associado'
      const valorLimpo = valor.trim()

      // VERIFICAR SE É CONVITE
      if (valorLimpo.toUpperCase().startsWith('CONV-')) {
        const { data: convite } = await supabase
          .from('convites')
          .select('*, associado:associados(nome, numero_titulo)')
          .eq('qr_code', valorLimpo.toUpperCase())
          .single()

        if (!convite) {
          setResultado({ autorizado: false, motivo: 'Convite não encontrado.' })
          playBeep(300, 300)
          return
        }

        const hoje = new Date().toISOString().split('T')[0]
        
        if (convite.status === 'cancelado') {
          setResultado({ autorizado: false, motivo: 'Este convite foi cancelado.' })
          playBeep(300, 300)
          return
        }

        if (convite.status === 'utilizado') {
          setResultado({ autorizado: false, motivo: 'Este convite já foi utilizado.' })
          playBeep(300, 300)
          return
        }

        if (convite.data_validade !== hoje) {
          setResultado({ autorizado: false, motivo: `Convite válido apenas para ${new Date(convite.data_validade + 'T00:00:00').toLocaleDateString('pt-BR')}` })
          playBeep(300, 300)
          return
        }

        await supabase
          .from('convites')
          .update({ status: 'utilizado', data_entrada: new Date().toISOString() })
          .eq('id', convite.id)

        setResultado({ 
          autorizado: true, 
          pessoa: { nome: convite.convidado_nome, tipo: 'convidado' }, 
          tipo: 'convidado' 
        })
        playBeep(800, 150)
        toast.success(`Bem-vindo(a), ${convite.convidado_nome}!`)
        return
      }

      // BUSCAR ASSOCIADO
      if (valorLimpo.toUpperCase().startsWith('SOCIO-')) {
        const { data } = await supabase
          .from('associados')
          .select('*')
          .eq('qr_code', valorLimpo.toUpperCase())
          .single()
        pessoa = data
      } else if (tipo === 'cpf') {
        const cpfLimpo = valorLimpo.replace(/\D/g, '')
        const { data } = await supabase.from('associados').select('*').eq('cpf', cpfLimpo).single()
        pessoa = data
      } else if (tipo === 'nome') {
        const { data } = await supabase.from('associados').select('*').ilike('nome', `%${valorLimpo}%`).limit(1).single()
        pessoa = data
      } else {
        // Tentar várias formas de busca
        const numeroTitulo = parseInt(valorLimpo.replace(/\D/g, '')) || 0
        if (numeroTitulo > 0) {
          const { data } = await supabase.from('associados').select('*').eq('numero_titulo', numeroTitulo).single()
          pessoa = data
        }
        if (!pessoa) {
          const cpfLimpo = valorLimpo.replace(/\D/g, '')
          if (cpfLimpo.length === 11) {
            const { data } = await supabase.from('associados').select('*').eq('cpf', cpfLimpo).single()
            pessoa = data
          }
        }
      }

      if (!pessoa) {
        setResultado({ autorizado: false, motivo: 'Pessoa não encontrada no sistema.' })
        playBeep(300, 300)
        return
      }

      if (pessoa.status !== 'ativo') {
        setResultado({ autorizado: false, motivo: `Associado ${pessoa.status}. Acesso negado.`, pessoa, tipo: tipoPessoa })
        playBeep(300, 300)
        return
      }

      // VERIFICAR MENSALIDADES EM ATRASO
      const hoje = new Date().toISOString().split('T')[0]
      const { data: mensalidadesAtrasadas } = await supabase
        .from('mensalidades')
        .select('*')
        .eq('associado_id', pessoa.id)
        .in('status', ['pendente', 'atrasado'])
        .lt('data_vencimento', hoje)
        .order('data_vencimento', { ascending: true })

      if (mensalidadesAtrasadas && mensalidadesAtrasadas.length > 0) {
        // TEM MENSALIDADES EM ATRASO - OFERECER PAGAMENTO
        setResultado({ 
          autorizado: false, 
          motivo: `${mensalidadesAtrasadas.length} mensalidade(s) em atraso. Pague agora para liberar a entrada.`,
          pessoa,
          tipo: tipoPessoa,
          mensalidadesPendentes: mensalidadesAtrasadas
        })
        playBeep(400, 200)
        return
      }

      // LIBERADO
      await supabase.from('registros_acesso').insert({
        ponto_acesso_id: pontoAcesso,
        associado_id: pessoa.id,
        tipo: 'entrada',
        forma_identificacao: tipo
      })

      setResultado({ autorizado: true, pessoa, tipo: tipoPessoa })
      playBeep(800, 150)
      toast.success(`Bem-vindo(a), ${pessoa.nome}!`)

    } catch (error: any) {
      console.error('Erro:', error)
      setResultado({ autorizado: false, motivo: 'Erro ao verificar. Tente novamente.' })
      playBeep(300, 300)
    } finally {
      setLoading(false)
      setBusca('')
    }
  }

  const iniciarPagamento = async (forma: 'pix' | 'credito' | 'debito') => {
    if (!resultado?.pessoa || !resultado?.mensalidadesPendentes) return

    setFormaPagamento(forma)
    setProcessandoPagamento(true)

    const valorTotal = resultado.mensalidadesPendentes.reduce((acc, m) => acc + m.valor, 0)
    const txid = `PORT${Date.now()}`

    // Criar registro de pagamento
    const { data: pagamento, error } = await supabase
      .from('pagamentos_portaria')
      .insert({
        associado_id: resultado.pessoa.id,
        mensalidade_id: resultado.mensalidadesPendentes[0].id,
        valor: valorTotal,
        forma_pagamento: forma,
        pix_txid: forma === 'pix' ? txid : null,
        status: 'pendente'
      })
      .select()
      .single()

    if (error) {
      toast.error('Erro ao iniciar pagamento')
      setProcessandoPagamento(false)
      return
    }

    setPagamentoId(pagamento.id)

    if (forma === 'pix') {
      // Gerar QR Code PIX
      const payload = gerarPayloadPix(valorTotal, txid)
      setPixCopiaCola(payload)
      
      // Gerar QR Code como Data URL (simplificado)
      // Em produção, usar biblioteca como 'qrcode' para gerar imagem
      setPixQRCode(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`)
      
      await supabase
        .from('pagamentos_portaria')
        .update({ pix_qrcode: payload, pix_codigo_copia_cola: payload })
        .eq('id', pagamento.id)
    }

    setShowPagamento(true)
    setProcessandoPagamento(false)
  }

  const confirmarPagamento = async () => {
    if (!resultado?.pessoa || !resultado?.mensalidadesPendentes || !pagamentoId) return

    setProcessandoPagamento(true)

    try {
      // Marcar pagamento como pago
      await supabase
        .from('pagamentos_portaria')
        .update({ 
          status: 'pago', 
          data_pagamento: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pagamentoId)

      // Marcar mensalidades como pagas
      for (const mensalidade of resultado.mensalidadesPendentes) {
        await supabase
          .from('mensalidades')
          .update({ 
            status: 'pago', 
            data_pagamento: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', mensalidade.id)
      }

      // Registrar entrada
      await supabase.from('registros_acesso').insert({
        ponto_acesso_id: pontoAcesso,
        associado_id: resultado.pessoa.id,
        tipo: 'entrada',
        forma_identificacao: 'pagamento_portaria'
      })

      // Atualizar resultado
      setResultado({ 
        autorizado: true, 
        pessoa: resultado.pessoa, 
        tipo: 'associado' 
      })
      setShowPagamento(false)
      setFormaPagamento(null)
      setPixQRCode(null)
      setPixCopiaCola(null)
      setPagamentoId(null)

      playBeep(800, 150)
      toast.success(`Pagamento confirmado! Bem-vindo(a), ${resultado.pessoa.nome}!`)

    } catch (error) {
      toast.error('Erro ao confirmar pagamento')
    } finally {
      setProcessandoPagamento(false)
    }
  }

  const cancelarPagamento = () => {
    setShowPagamento(false)
    setFormaPagamento(null)
    setPixQRCode(null)
    setPixCopiaCola(null)
    setPagamentoId(null)
  }

  const copiarPix = () => {
    if (pixCopiaCola) {
      navigator.clipboard.writeText(pixCopiaCola)
      toast.success('Código PIX copiado!')
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
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
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
              <div className="flex items-start gap-6">
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
                      {resultado.pessoa.numero_titulo && (
                        <p className="text-lg text-muted-foreground">Título: {resultado.pessoa.numero_titulo}</p>
                      )}
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

                      {/* Botões de Pagamento */}
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <Button 
                          onClick={() => iniciarPagamento('pix')}
                          className="h-16 bg-teal-600 hover:bg-teal-700"
                          disabled={processandoPagamento}
                        >
                          <QrCode className="h-6 w-6 mr-2" />
                          PIX
                        </Button>
                        <Button 
                          onClick={() => iniciarPagamento('credito')}
                          className="h-16 bg-blue-600 hover:bg-blue-700"
                          disabled={processandoPagamento}
                        >
                          <CreditCard className="h-6 w-6 mr-2" />
                          Crédito
                        </Button>
                        <Button 
                          onClick={() => iniciarPagamento('debito')}
                          className="h-16 bg-purple-600 hover:bg-purple-700"
                          disabled={processandoPagamento}
                        >
                          <Banknote className="h-6 w-6 mr-2" />
                          Débito
                        </Button>
                      </div>
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

          {/* Modal de Pagamento */}
          {showPagamento && resultado?.pessoa && (
            <div className="p-6 rounded-xl border-4 border-blue-500 bg-blue-50">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-blue-700">
                  💳 Pagamento - {formaPagamento?.toUpperCase()}
                </h2>
                <Button variant="ghost" size="sm" onClick={cancelarPagamento}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="bg-white p-4 rounded-lg mb-4">
                <p className="text-lg"><strong>Associado:</strong> {resultado.pessoa.nome}</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  Total: {formatCurrency(resultado.mensalidadesPendentes?.reduce((acc, m) => acc + m.valor, 0) || 0)}
                </p>
              </div>

              {formaPagamento === 'pix' && (
                <div className="text-center">
                  <p className="mb-4 text-lg">Escaneie o QR Code ou copie o código PIX:</p>
                  
                  {pixQRCode && (
                    <div className="bg-white p-4 rounded-lg inline-block mb-4">
                      <img src={pixQRCode} alt="QR Code PIX" className="w-64 h-64 mx-auto" />
                    </div>
                  )}

                  {pixCopiaCola && (
                    <div className="mb-4">
                      <div className="bg-gray-100 p-3 rounded text-xs font-mono break-all max-w-md mx-auto">
                        {pixCopiaCola}
                      </div>
                      <Button onClick={copiarPix} className="mt-2">
                        📋 Copiar Código PIX
                      </Button>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground mb-4">
                    Após o pagamento, clique em "Confirmar Pagamento"
                  </p>
                </div>
              )}

              {(formaPagamento === 'credito' || formaPagamento === 'debito') && (
                <div className="text-center">
                  <div className="bg-white p-6 rounded-lg mb-4">
                    <CreditCard className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                    <p className="text-lg">Passe o cartão na maquininha</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {formaPagamento === 'credito' ? 'Crédito' : 'Débito'} - {formatCurrency(resultado.mensalidadesPendentes?.reduce((acc, m) => acc + m.valor, 0) || 0)}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Após passar o cartão, clique em "Confirmar Pagamento"
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={cancelarPagamento}
                  className="h-14 px-8"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmarPagamento}
                  disabled={processandoPagamento}
                  className="h-14 px-8 bg-green-600 hover:bg-green-700"
                >
                  {processandoPagamento ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  )}
                  Confirmar Pagamento
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
