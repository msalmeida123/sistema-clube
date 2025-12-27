'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { 
  Smartphone, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  QrCode, 
  Power, 
  RotateCcw,
  Check,
  Loader2,
  Phone,
  Play
} from 'lucide-react'

type SessionStatus = {
  id?: string
  status?: string
  phone?: string
  name?: string
  pushName?: string
  connected?: boolean
  qr?: string
  qrCode?: string
}

export default function WhatsAppPage() {
  const [session, setSession] = useState<SessionStatus | null>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const supabase = createClientComponentClient()

  // Buscar status da sessão
  const buscarStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/wasender/session')
      const result = await response.json()

      console.log('Status result:', result)

      if (result.device_id) {
        setDeviceId(result.device_id)
      }

      if (result.success) {
        setSession(result.session)
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // Iniciar sessão (connect)
  const iniciarSessao = async () => {
    setLoadingAction('connect')
    try {
      const response = await fetch('/api/wasender/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' })
      })
      const result = await response.json()

      if (result.success) {
        toast.success('Sessão iniciada! Aguarde o QR Code...')
        // Aguardar um pouco e buscar QR Code
        setTimeout(buscarQRCode, 2000)
      } else {
        toast.error(result.error || 'Erro ao iniciar sessão')
      }
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoadingAction(null)
    }
  }

  // Buscar QR Code
  const buscarQRCode = async () => {
    setLoadingAction('qrcode')
    try {
      const response = await fetch('/api/wasender/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'qrcode' })
      })
      const result = await response.json()

      console.log('QR Code result:', result)

      if (result.success && result.data) {
        const qr = result.data.qr || result.data.qrCode || result.data.qrcode || ''
        setQrCode(qr)
        if (qr) {
          toast.success('QR Code gerado!')
        }
      } else if (result.error) {
        // Se o erro for de estado, sugerir iniciar sessão
        if (result.error.includes('NEED_SCAN') || result.error.includes('connect endpoint')) {
          toast.info('Clique em "Iniciar Sessão" primeiro')
        } else {
          toast.error(result.error)
        }
      }
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoadingAction(null)
    }
  }

  // Verificar se está conectado
  const isConnected = (s: SessionStatus | null) => {
    if (!s) return false
    return s.connected === true || 
           s.status === 'connected' || 
           s.status === 'CONNECTED' ||
           s.status === 'authenticated' ||
           s.status === 'ready' ||
           s.status === 'open' ||
           s.status === 'OPEN'
  }

  // Executar ação (desconectar, reiniciar)
  const executarAcao = async (action: 'disconnect' | 'restart') => {
    setLoadingAction(action)
    try {
      const response = await fetch('/api/wasender/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const result = await response.json()

      if (result.success) {
        toast.success(action === 'disconnect' ? 'Desconectado!' : 'Reiniciando...')
        setQrCode('')
        setTimeout(buscarStatus, 2000)
      } else {
        toast.error(result.error || 'Erro na operação')
      }
    } catch (error: any) {
      toast.error('Erro: ' + error.message)
    } finally {
      setLoadingAction(null)
    }
  }

  useEffect(() => {
    buscarStatus()
  }, [])

  const connected = isConnected(session)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conexão WhatsApp</h1>
          <p className="text-muted-foreground">Gerencie a conexão do WhatsApp para o CRM</p>
        </div>
        <Button variant="outline" onClick={buscarStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status da Conexão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Status da Sessão
            </CardTitle>
            <CardDescription>
              Device ID: {deviceId || 'Não configurado'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
                  {connected ? (
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <Wifi className="h-6 w-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <WifiOff className="h-6 w-6 text-red-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-lg">
                      {connected ? 'Conectado' : 'Desconectado'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {connected 
                        ? 'WhatsApp pronto para uso' 
                        : 'Inicie a sessão e escaneie o QR Code'}
                    </p>
                  </div>
                </div>

                {connected && session && (
                  <div className="space-y-2 p-4 border rounded-lg">
                    {(session.phone || session.name || session.pushName) && (
                      <>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {session.phone || 'Número não disponível'}
                          </span>
                        </div>
                        {(session.name || session.pushName) && (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className="text-sm">
                              {session.name || session.pushName}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm text-muted-foreground">Online</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {connected ? (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => executarAcao('restart')}
                        disabled={loadingAction !== null}
                        className="flex-1"
                      >
                        {loadingAction === 'restart' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-2" />
                        )}
                        Reiniciar
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => executarAcao('disconnect')}
                        disabled={loadingAction !== null}
                        className="flex-1"
                      >
                        {loadingAction === 'disconnect' ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Power className="h-4 w-4 mr-2" />
                        )}
                        Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={iniciarSessao}
                      disabled={loadingAction !== null}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {loadingAction === 'connect' ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Iniciar Sessão
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code
            </CardTitle>
            <CardDescription>
              Escaneie com o WhatsApp do seu celular
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
            {connected ? (
              <div className="text-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <Check className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-lg font-medium text-green-600">
                  WhatsApp Conectado!
                </p>
                <p className="text-sm text-muted-foreground">
                  Você já pode enviar e receber mensagens
                </p>
              </div>
            ) : qrCode ? (
              <div className="text-center space-y-4">
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <img 
                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
                </p>
                <Button variant="outline" onClick={buscarQRCode} disabled={loadingAction !== null}>
                  {loadingAction === 'qrcode' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Atualizar QR Code
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                  <QrCode className="h-12 w-12 text-gray-400" />
                </div>
                <p className="text-muted-foreground">
                  QR Code não disponível
                </p>
                <p className="text-sm text-muted-foreground">
                  Clique em "Iniciar Sessão" e depois em "Gerar QR Code"
                </p>
                <Button variant="outline" onClick={buscarQRCode} disabled={loadingAction !== null}>
                  {loadingAction === 'qrcode' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4 mr-2" />
                  )}
                  Gerar QR Code
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como conectar</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Clique no botão <strong>"Iniciar Sessão"</strong> acima</li>
            <li>Aguarde o QR Code aparecer (pode levar alguns segundos)</li>
            <li>Abra o <strong>WhatsApp</strong> no seu celular</li>
            <li>Vá em <strong>Configurações → Dispositivos conectados</strong></li>
            <li>Toque em <strong>"Conectar um dispositivo"</strong></li>
            <li>Escaneie o QR Code com a câmera</li>
            <li>Aguarde a conexão ser estabelecida</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
