import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sanitizeForDatabase } from '@/lib/security'

// ==========================================
// CONFIGURAÇÕES DE SEGURANÇA
// ==========================================

// Rate limiting simples (em memória - para produção use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 100 // máximo de requisições
const RATE_LIMIT_WINDOW = 60000 // janela de 1 minuto

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ==========================================
// FUNÇÕES DE SEGURANÇA
// ==========================================

// Verificar autenticação do webhook
async function verificarAutenticacao(body: any): Promise<{ valido: boolean; metodo: string }> {
  try {
    const { data: config } = await getSupabase()
      .from('config_wasender')
      .select('api_key')
      .single()

    if (!config?.api_key) {
      console.warn('⚠️ Nenhuma api_key configurada no banco - aceitando webhook')
      return { valido: true, metodo: 'sem_config' }
    }

    const sessionId = body.sessionId || 
                      body.session_id || 
                      body.apiKey || 
                      body.api_key ||
                      body.data?.sessionId ||
                      body.data?.session_id

    if (sessionId && sessionId === config.api_key) {
      return { valido: true, metodo: 'session_id' }
    }

    const { data: configFull } = await getSupabase()
      .from('config_wasender')
      .select('device_id')
      .single()
    
    const deviceId = body.deviceId || body.device_id || body.data?.deviceId || body.data?.device_id
    if (deviceId && configFull?.device_id && String(deviceId) === String(configFull.device_id)) {
      return { valido: true, metodo: 'device_id' }
    }

    return { valido: false, metodo: 'nenhum' }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error)
    return { valido: false, metodo: 'erro' }
  }
}

// Rate limiting por IP
function verificarRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

// Sanitizar entrada para prevenir XSS e injection
function sanitizarTexto(texto: string | undefined | null): string {
  if (!texto) return ''
  return sanitizeForDatabase(texto).substring(0, 10000)
}

// Validar telefone (apenas números)
function sanitizarTelefone(telefone: string | undefined | null): string {
  if (!telefone) return ''
  return telefone.replace(/\D/g, '').substring(0, 15)
}

// ==========================================
// FUNÇÕES DE NEGÓCIO
// ==========================================

async function salvarLogWebhook(payload: unknown, tipo: string, ip?: string) {
  try {
    const payloadStr = JSON.stringify(payload)
    const sanitizedPayload = sanitizeForDatabase(payloadStr).substring(0, 50000)
    
    await getSupabase()
      .from('webhook_logs')
      .insert({
        tipo: sanitizeForDatabase(tipo),
        payload: sanitizedPayload,
        created_at: new Date().toISOString()
      })
  } catch (e) {
    console.error('Erro ao salvar log:', e)
  }
}

// Verificar se já existe mensagem igual enviada recentemente (evitar duplicatas de webhook)
async function verificarDuplicataRecente(conversaId: string, conteudo: string): Promise<boolean> {
  try {
    const trintaSegundosAtras = new Date(Date.now() - 30000).toISOString()
    
    const { data } = await getSupabase()
      .from('mensagens_whatsapp')
      .select('id')
      .eq('conversa_id', conversaId)
      .eq('direcao', 'saida')
      .eq('conteudo', conteudo)
      .gte('created_at', trintaSegundosAtras)
      .limit(1)

    if (data && data.length > 0) {
      console.log(`🔄 Duplicata detectada: mensagem de saída já existe na conversa ${conversaId}`)
      return true
    }
    
    return false
  } catch (error) {
    console.error('Erro ao verificar duplicata:', error)
    return false
  }
}

// ==========================================
// FUNÇÃO PARA DECRIPTAR MÍDIA DO WASENDER - CORRIGIDA!
// ==========================================
async function decryptarMidia(messageData: any, apiKey: string): Promise<string | null> {
  try {
    // Extrair informações da mídia do messageData
    const message = messageData.message
    if (!message) {
      console.warn('⚠️ Nenhuma message encontrada no messageData')
      return null
    }

    // Identificar o tipo de mídia e extrair dados
    let mediaMessage: any = null
    let mediaType = ''
    
    if (message.imageMessage) {
      mediaMessage = message.imageMessage
      mediaType = 'imageMessage'
    } else if (message.videoMessage) {
      mediaMessage = message.videoMessage
      mediaType = 'videoMessage'
    } else if (message.audioMessage) {
      mediaMessage = message.audioMessage
      mediaType = 'audioMessage'
    } else if (message.documentMessage) {
      mediaMessage = message.documentMessage
      mediaType = 'documentMessage'
    } else if (message.stickerMessage) {
      mediaMessage = message.stickerMessage
      mediaType = 'stickerMessage'
    }

    if (!mediaMessage) {
      console.warn('⚠️ Nenhum tipo de mídia reconhecido')
      return null
    }

    // Verificar se tem mediaKey (mídia criptografada)
    if (!mediaMessage.mediaKey) {
      // Se não tem mediaKey mas tem URL direta, retornar ela
      if (mediaMessage.url) {
        console.log('✅ URL direta encontrada (não criptografada)')
        return mediaMessage.url
      }
      console.warn('⚠️ Mídia sem mediaKey e sem URL')
      return null
    }

    // Construir o payload CORRETO para a API de decrypt
    const decryptPayload = {
      data: {
        messages: {
          key: {
            id: messageData.key?.id || `msg_${Date.now()}`
          },
          message: {
            [mediaType]: {
              url: mediaMessage.url,
              mimetype: mediaMessage.mimetype,
              mediaKey: mediaMessage.mediaKey,
              fileSha256: mediaMessage.fileSha256,
              fileLength: mediaMessage.fileLength,
              fileName: mediaMessage.fileName
            }
          }
        }
      }
    }

    console.log('📦 Enviando para decrypt:', JSON.stringify(decryptPayload).substring(0, 500))

    const response = await fetch('https://www.wasenderapi.com/api/decrypt-media', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(decryptPayload),
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Erro ao decriptar mídia: ${response.status} - ${errorText}`)
      
      // Se falhou, tentar usar URL original se existir
      if (mediaMessage.url) {
        console.log('⚠️ Tentando usar URL original como fallback')
        return mediaMessage.url
      }
      return null
    }

    const result = await response.json()
    
    if (result.success && result.publicUrl) {
      console.log(`✅ Mídia decriptada: ${result.publicUrl}`)
      return result.publicUrl
    }

    console.warn('⚠️ Resposta de decrypt sem URL:', result)
    
    // Fallback para URL original
    if (mediaMessage.url) {
      return mediaMessage.url
    }
    
    return null
  } catch (error) {
    console.error('Erro ao decriptar mídia:', error)
    return null
  }
}

// Buscar foto de perfil do contato via API do WaSender
// MODIFICADO: Não atualiza automaticamente para evitar loops de realtime
async function buscarFotoPerfil(telefone: string): Promise<string | null> {
  try {
    const { data: config } = await getSupabase()
      .from('config_wasender')
      .select('api_key')
      .single()

    if (!config?.api_key) return null

    let numero = sanitizarTelefone(telefone)
    if (!numero.startsWith('55')) numero = '55' + numero

    const response = await fetch(`https://www.wasenderapi.com/api/contacts/${numero}/picture`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.api_key}`
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      console.log(`Foto de perfil não encontrada para ${numero}: ${response.status}`)
      return null
    }

    const result = await response.json()
    
    if (result.success && result.data?.imgUrl) {
      console.log(`📷 Foto encontrada para ${numero}: ${result.data.imgUrl}`)
      return result.data.imgUrl
    }
    
    return null
  } catch (error) {
    console.error('Erro ao buscar foto de perfil:', error)
    return null
  }
}

// REMOVIDO: A função atualizarFotoPerfilConversa foi removida para evitar 
// atualizações em background que causam loops no Realtime.
// A foto será atualizada apenas quando a conversa for criada.

async function transcreveAudio(audioUrl: string, apiKey: string): Promise<string | null> {
  try {
    if (!audioUrl.startsWith('http')) return null
    
    const audioResponse = await fetch(audioUrl, { 
      signal: AbortSignal.timeout(30000)
    })
    if (!audioResponse.ok) return null
    
    const audioBlob = await audioResponse.blob()
    
    if (audioBlob.size > 25 * 1024 * 1024) {
      console.warn('Áudio muito grande para transcrição')
      return null
    }
    
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.ogg')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
      signal: AbortSignal.timeout(60000)
    })
    
    if (!response.ok) return null
    const result = await response.json()
    return sanitizarTexto(result.text)
  } catch (error) {
    console.error('Erro ao transcrever:', error)
    return null
  }
}

interface ConfigIA {
  instrucoes_sistema?: string
  documento_contexto?: string
  openai_api_key: string
  modelo?: string
  temperatura?: number
  max_tokens?: number
  responder_com_ia?: boolean
  transcrever_audios?: boolean
}

async function gerarRespostaIA(mensagem: string, config: ConfigIA): Promise<string | null> {
  try {
    const systemPrompt = `${config.instrucoes_sistema || 'Você é um assistente virtual do clube.'}

DOCUMENTO DO CLUBE:
${config.documento_contexto || ''}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openai_api_key}`
      },
      body: JSON.stringify({
        model: config.modelo || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: mensagem.substring(0, 4000) }
        ],
        temperature: Math.min(Math.max(config.temperatura || 0.7, 0), 2),
        max_tokens: Math.min(config.max_tokens || 500, 2000)
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) return null
    const result = await response.json()
    return result.choices[0]?.message?.content || null
  } catch (error) {
    console.error('Erro GPT:', error)
    return null
  }
}

async function enviarMensagem(telefone: string, mensagem: string): Promise<string | false> {
  try {
    const { data: config } = await getSupabase()
      .from('config_wasender')
      .select('api_key')
      .single()

    if (!config?.api_key) return false

    let numero = sanitizarTelefone(telefone)
    if (!numero.startsWith('55')) numero = '55' + numero

    const response = await fetch('https://www.wasenderapi.com/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`
      },
      body: JSON.stringify({ 
        phone: numero, 
        message: mensagem.substring(0, 4000)
      }),
      signal: AbortSignal.timeout(30000)
    })

    const result = await response.json()
    return response.ok ? (result.messageId || 'sent') : false
  } catch (error) {
    console.error('Erro ao enviar:', error)
    return false
  }
}

async function processarComIA(
  conversaId: string,
  telefone: string,
  mensagem: string,
  tipo: string,
  mediaUrl?: string
) {
  try {
    const { data: configIA } = await getSupabase()
      .from('config_bot_ia')
      .select('*')
      .single()

    if (!configIA?.openai_api_key || !configIA?.responder_com_ia) {
      return
    }

    let textoProcessar = mensagem

    if (tipo === 'audio' && mediaUrl && configIA.transcrever_audios) {
      const transcricao = await transcreveAudio(mediaUrl, configIA.openai_api_key)
      if (transcricao) {
        textoProcessar = transcricao
        await getSupabase()
          .from('mensagens_whatsapp')
          .update({ conteudo: `🎤 Áudio transcrito:\n"${transcricao}"` })
          .eq('conversa_id', conversaId)
          .eq('tipo', 'audio')
          .order('created_at', { ascending: false })
          .limit(1)
      }
    }

    const respostaIA = await gerarRespostaIA(textoProcessar, configIA as ConfigIA)
    
    if (respostaIA) {
      await new Promise(r => setTimeout(r, 2000))
      
      const enviada = await enviarMensagem(telefone, respostaIA)
      
      if (enviada) {
        await getSupabase()
          .from('mensagens_whatsapp')
          .insert({
            conversa_id: conversaId,
            direcao: 'saida',
            conteudo: respostaIA,
            tipo: 'texto',
            status: 'enviada',
            message_id: typeof enviada === 'string' ? enviada : null
          })

        await getSupabase()
          .from('conversas_whatsapp')
          .update({ ultima_mensagem: respostaIA.substring(0, 100) })
          .eq('id', conversaId)
      }
    }
  } catch (error) {
    console.error('Erro ao processar IA:', error)
  }
}

interface RegraAutomatica {
  id: string
  gatilho_tipo: string
  palavras_chave?: string[]
  horario_inicio?: string
  horario_fim?: string
  delay_segundos: number
  resposta: string
  uso_count: number
}

async function processarRespostasAutomaticas(
  conversaId: string,
  telefone: string,
  mensagem: string,
  isPrimeiraMsg: boolean
): Promise<boolean> {
  try {
    const { data: regras } = await getSupabase()
      .from('respostas_automaticas')
      .select('*')
      .eq('ativo', true)
      .order('prioridade', { ascending: false })

    if (!regras || regras.length === 0) return false

    const mensagemLower = mensagem.toLowerCase().trim()

    for (const item of regras) {
      const regra = item as RegraAutomatica
      let deveResponder = false

      switch (regra.gatilho_tipo) {
        case 'primeira_mensagem':
          deveResponder = isPrimeiraMsg
          break
        case 'palavra_chave':
          if (regra.palavras_chave && regra.palavras_chave.length > 0) {
            deveResponder = regra.palavras_chave.some((p: string) => 
              mensagemLower.includes(p.toLowerCase())
            )
          }
          break
        case 'fora_horario': {
          const hora = new Date().toTimeString().slice(0, 5)
          if (regra.horario_inicio && regra.horario_fim) {
            deveResponder = hora < regra.horario_inicio || hora > regra.horario_fim
          }
          break
        }
      }

      if (deveResponder) {
        const delayMs = Math.min(regra.delay_segundos || 0, 30) * 1000
        if (delayMs > 0) {
          await new Promise(r => setTimeout(r, delayMs))
        }

        const enviada = await enviarMensagem(telefone, regra.resposta)
        
        if (enviada) {
          await getSupabase().from('mensagens_whatsapp').insert({
            conversa_id: conversaId,
            direcao: 'saida',
            conteudo: regra.resposta,
            tipo: 'texto',
            status: 'enviada'
          })

          await getSupabase()
            .from('respostas_automaticas')
            .update({ uso_count: (regra.uso_count || 0) + 1 })
            .eq('id', regra.id)

          return true
        }
      }
    }
    return false
  } catch (error) {
    console.error('Erro respostas automáticas:', error)
    return false
  }
}

interface DadosMensagem {
  telefone: string
  mensagem: string
  messageId: string
  tipo: string
  mediaUrl?: string
  nomeContato: string
  fromMe: boolean
  rawMessageData?: any // Para passar ao decrypt
}

interface MediaMessage {
  url?: string
  mimetype?: string
  mediaKey?: string
  fileSha256?: string
  fileLength?: string | number
  fileName?: string
  caption?: string
}

interface WebhookBody {
  event?: string
  type?: string
  action?: string
  message?: string
  body?: string
  text?: string
  content?: string
  caption?: string
  from?: string
  sender?: string
  phone?: string
  id?: string
  messageId?: string
  mediaUrl?: string
  media?: { url?: string }
  pushName?: string
  notifyName?: string
  name?: string
  ack?: number | string
  status?: string
  fromMe?: boolean
  sessionId?: string
  session_id?: string
  apiKey?: string
  api_key?: string
  deviceId?: string | number
  device_id?: string | number
  data?: {
    messages?: {
      key?: {
        id?: string
        fromMe?: boolean
        cleanedSenderPn?: string
        cleanedParticipantPn?: string
        remoteJid?: string
        senderLid?: string
      }
      messageBody?: string
      message?: {
        conversation?: string
        extendedTextMessage?: { text?: string }
        imageMessage?: MediaMessage
        videoMessage?: MediaMessage
        audioMessage?: MediaMessage
        documentMessage?: MediaMessage
        stickerMessage?: MediaMessage
      }
      pushName?: string
    }
    fromMe?: boolean
    pushName?: string
    from?: string
    sender?: string
    phone?: string
    message?: string
    body?: string
    text?: string
    content?: string
    caption?: string
    id?: string
    messageId?: string
    type?: string
    mediaUrl?: string
    media?: { url?: string }
    notifyName?: string
    name?: string
    ack?: number | string
    isFromMe?: boolean
    self?: boolean | string
    isSelf?: boolean
    direction?: string
    outgoing?: boolean
    sessionId?: string
    session_id?: string
    deviceId?: string | number
    device_id?: string | number
  }
  isFromMe?: boolean
  self?: boolean | string
  isSelf?: boolean
  direction?: string
  outgoing?: boolean
}

function extrairDadosMensagem(body: WebhookBody): DadosMensagem {
  // Função auxiliar para detectar se é mensagem enviada por nós
  const detectarFromMe = (): boolean => {
    if (body.fromMe === true) return true
    if (body.data?.fromMe === true) return true
    if (body.data?.messages?.key?.fromMe === true) return true
    if (body.isFromMe === true) return true
    if (body.data?.isFromMe === true) return true
    if (body.self === true || body.self === 'true') return true
    if (body.data?.self === true || body.data?.self === 'true') return true
    if (body.isSelf === true) return true
    if (body.data?.isSelf === true) return true
    if (body.direction === 'outgoing' || body.direction === 'out') return true
    if (body.data?.direction === 'outgoing' || body.data?.direction === 'out') return true
    if (body.outgoing === true) return true
    if (body.data?.outgoing === true) return true
    
    const event = body.event || body.type || body.action || ''
    const eventosEnviados = [
      'message.sent', 
      'messages.sent',
      'message_sent', 
      'outgoing_message',
      'message.create',
      'messages.create'
    ]
    if (eventosEnviados.includes(event.toLowerCase())) return true
    
    return false
  }

  // Formato WaSender messages.received / messages.upsert
  if (body.data?.messages) {
    const msg = body.data.messages
    const key = msg.key || {}
    const message = msg.message
    
    // Detectar tipo e extrair informações da mídia
    let tipo = 'texto'
    let mediaUrl: string | undefined
    let caption = ''
    let hasEncryptedMedia = false
    
    if (message?.imageMessage) {
      tipo = 'imagem'
      mediaUrl = message.imageMessage.url
      caption = message.imageMessage.caption || ''
      hasEncryptedMedia = !!message.imageMessage.mediaKey
    } else if (message?.videoMessage) {
      tipo = 'video'
      mediaUrl = message.videoMessage.url
      caption = message.videoMessage.caption || ''
      hasEncryptedMedia = !!message.videoMessage.mediaKey
    } else if (message?.audioMessage) {
      tipo = 'audio'
      mediaUrl = message.audioMessage.url
      hasEncryptedMedia = !!message.audioMessage.mediaKey
    } else if (message?.documentMessage) {
      tipo = 'documento'
      mediaUrl = message.documentMessage.url
      caption = message.documentMessage.fileName || ''
      hasEncryptedMedia = !!message.documentMessage.mediaKey
    } else if (message?.stickerMessage) {
      tipo = 'sticker'
      mediaUrl = message.stickerMessage.url
      hasEncryptedMedia = !!message.stickerMessage.mediaKey
    }
    
    // Para mídia, usar messageBody ou caption como mensagem
    let mensagemFinal = sanitizarTexto(
      msg.messageBody || 
      message?.conversation || 
      message?.extendedTextMessage?.text ||
      caption
    )
    
    // Se é mídia e não tem texto, criar indicador
    if (!mensagemFinal && tipo !== 'texto') {
      const tipoLabels: Record<string, string> = {
        'imagem': '📷 Imagem',
        'video': '🎥 Vídeo',
        'audio': '🎤 Áudio',
        'documento': '📄 Documento',
        'sticker': '🎨 Sticker'
      }
      mensagemFinal = tipoLabels[tipo] || '📎 Mídia'
    }
    
    return {
      telefone: sanitizarTelefone(
        key.cleanedSenderPn ||
        key.cleanedParticipantPn ||
        key.remoteJid?.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '')
      ),
      mensagem: mensagemFinal,
      messageId: key.id || '',
      tipo,
      mediaUrl: hasEncryptedMedia ? undefined : mediaUrl, // Se tem mediaKey, precisa decriptar
      nomeContato: sanitizarTexto(msg.pushName || body.data.pushName),
      fromMe: detectarFromMe(),
      rawMessageData: hasEncryptedMedia ? msg : undefined // Passar dados brutos para decrypt
    }
  }
  
  // Formato padrão
  if (body.data) {
    const data = body.data
    const tipo = data.type || 'texto'
    const mediaUrl = data.mediaUrl || data.media?.url
    
    let mensagemFinal = sanitizarTexto(data.message || data.body || data.text || data.content || data.caption)
    
    if (!mensagemFinal && mediaUrl) {
      const tipoLabels: Record<string, string> = {
        'image': '📷 Imagem',
        'imagem': '📷 Imagem',
        'video': '🎥 Vídeo',
        'audio': '🎤 Áudio',
        'ptt': '🎤 Áudio',
        'document': '📄 Documento',
        'documento': '📄 Documento'
      }
      mensagemFinal = tipoLabels[tipo] || '📎 Mídia'
    }
    
    return {
      telefone: sanitizarTelefone(
        data.from?.replace('@c.us', '') || 
        data.sender?.replace('@c.us', '') ||
        data.phone
      ),
      mensagem: mensagemFinal,
      messageId: data.id || data.messageId || '',
      tipo: tipo === 'image' ? 'imagem' : tipo === 'ptt' ? 'audio' : tipo === 'document' ? 'documento' : tipo,
      mediaUrl,
      nomeContato: sanitizarTexto(data.pushName || data.notifyName || data.name),
      fromMe: detectarFromMe()
    }
  }
  
  // Dados direto no body
  const tipo = body.type || 'texto'
  const mediaUrl = body.mediaUrl || body.media?.url
  
  let mensagemFinal = sanitizarTexto(body.message || body.body || body.text || body.content || body.caption)
  
  if (!mensagemFinal && mediaUrl) {
    const tipoLabels: Record<string, string> = {
      'image': '📷 Imagem',
      'imagem': '📷 Imagem',
      'video': '🎥 Vídeo',
      'audio': '🎤 Áudio',
      'ptt': '🎤 Áudio',
      'document': '📄 Documento',
      'documento': '📄 Documento'
    }
    mensagemFinal = tipoLabels[tipo] || '📎 Mídia'
  }
  
  return {
    telefone: sanitizarTelefone(
      body.from?.replace('@c.us', '') || 
      body.sender?.replace('@c.us', '') ||
      body.phone
    ),
    mensagem: mensagemFinal,
    messageId: body.id || body.messageId || '',
    tipo: tipo === 'image' ? 'imagem' : tipo === 'ptt' ? 'audio' : tipo === 'document' ? 'documento' : tipo,
    mediaUrl,
    nomeContato: sanitizarTexto(body.pushName || body.notifyName || body.name),
    fromMe: detectarFromMe()
  }
}

function isEventoMensagem(body: WebhookBody): boolean {
  const event = body.event || body.type || body.action
  const eventosValidos = [
    'message', 
    'message.received',
    'messages.received',
    'messages.upsert',
    'message_received',
    'incoming_message',
    'new_message'
  ]
  
  // Verificar se tem conteúdo de mensagem
  if (!event) {
    if (body.message || body.body || body.text || body.data?.message || body.data?.messages) {
      return true
    }
    // Verificar se tem mídia
    if (body.data?.messages?.message) {
      const msg = body.data.messages.message
      if (msg.imageMessage || msg.videoMessage || msg.audioMessage || msg.documentMessage || msg.stickerMessage) {
        return true
      }
    }
  }
  
  return eventosValidos.includes(event?.toLowerCase() || '')
}

// ==========================================
// HANDLERS HTTP
// ==========================================

export async function POST(request: Request) {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             headersList.get('x-real-ip') ||
             'unknown'

  try {
    // Rate limiting
    if (!verificarRateLimit(ip)) {
      console.warn(`Rate limit excedido para IP: ${ip}`)
      return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })
    }

    // Ler body
    const bodyText = await request.text()
    
    // Parse do JSON
    let body: WebhookBody
    try {
      body = JSON.parse(bodyText)
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    // Salvar payload original para debug
    await salvarLogWebhook({ 
      _ip: ip,
      _raw: body 
    }, 'webhook_raw', ip)

    // Validação de segurança
    const auth = await verificarAutenticacao(body)
    if (!auth.valido) {
      console.warn(`❌ Autenticação falhou. IP: ${ip}, Método: ${auth.metodo}`)
      await salvarLogWebhook({ 
        motivo: 'Autenticação falhou',
        ip,
        metodo: auth.metodo,
        payload_keys: Object.keys(body),
        sessionId_recebido: body.sessionId || body.session_id || 'não enviado',
        deviceId_recebido: body.deviceId || body.device_id || 'não enviado'
      }, 'auth_falhou', ip)
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Salvar log de webhook autenticado
    await salvarLogWebhook({ ...body, _auth_method: auth.metodo }, 'webhook_recebido', ip)

    // Verificar se é evento de mensagem
    if (!isEventoMensagem(body)) {
      const event = body.event || body.type
      if (event === 'message.ack' || event === 'ack' || event === 'message_status') {
        const messageId = body.data?.id || body.data?.messageId || body.id || body.messageId
        const ack = body.data?.ack || body.ack || body.status
        let status = 'enviada'
        if (ack === 2 || ack === 'delivered') status = 'entregue'
        if (ack === 3 || ack === 'read') status = 'lida'

        if (messageId) {
          await getSupabase()
            .from('mensagens_whatsapp')
            .update({ status })
            .eq('message_id', messageId)
        }
        return NextResponse.json({ success: true, type: 'ack' })
      }
      
      return NextResponse.json({ success: true, message: 'Evento ignorado' })
    }

    // Extrair e validar dados
    let { telefone, mensagem, messageId, tipo, mediaUrl, nomeContato, fromMe, rawMessageData } = extrairDadosMensagem(body)

    // Ignorar mensagens enviadas por nós
    if (fromMe) {
      console.log(`📤 Ignorando mensagem de saída (fromMe=true): ${mensagem.substring(0, 50)}...`)
      await salvarLogWebhook({ mensagem, fromMe, motivo: 'fromMe=true' }, 'ignorado_fromme', ip)
      return NextResponse.json({ 
        success: true, 
        message: 'Mensagem de saída ignorada (fromMe=true)',
        ignored: true
      })
    }

    // ==========================================
    // DECRIPTAR MÍDIA SE NECESSÁRIO - CORRIGIDO!
    // ==========================================
    if (rawMessageData && !mediaUrl && tipo !== 'texto') {
      console.log(`🔐 Mídia criptografada detectada (${tipo}), tentando decriptar...`)
      
      // Log detalhado para debug
      await salvarLogWebhook({
        tipo,
        rawMessageData: JSON.stringify(rawMessageData).substring(0, 2000),
        hasMediaKey: !!rawMessageData.message?.imageMessage?.mediaKey ||
                     !!rawMessageData.message?.videoMessage?.mediaKey ||
                     !!rawMessageData.message?.audioMessage?.mediaKey ||
                     !!rawMessageData.message?.documentMessage?.mediaKey
      }, 'debug_media_decrypt', ip)
      
      const { data: config } = await getSupabase()
        .from('config_wasender')
        .select('api_key')
        .single()

      if (config?.api_key) {
        const decryptedUrl = await decryptarMidia(rawMessageData, config.api_key)
        if (decryptedUrl) {
          mediaUrl = decryptedUrl
          console.log(`✅ Mídia decriptada com sucesso: ${mediaUrl}`)
        } else {
          console.warn('⚠️ Não foi possível decriptar a mídia')
        }
      }
    }

    // Validar dados
    if (!telefone) {
      await salvarLogWebhook({ erro: 'Telefone não encontrado', telefone, mensagem }, 'erro', ip)
      return NextResponse.json({ error: 'Telefone não encontrado' }, { status: 400 })
    }
    
    if (!mensagem && !mediaUrl && tipo === 'texto') {
      await salvarLogWebhook({ erro: 'Dados incompletos - sem mensagem ou mídia', telefone, mensagem, mediaUrl }, 'erro', ip)
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Garantir que sempre tem uma mensagem
    if (!mensagem) {
      const tipoLabels: Record<string, string> = {
        'imagem': '📷 Imagem',
        'video': '🎥 Vídeo',
        'audio': '🎤 Áudio',
        'documento': '📄 Documento',
        'sticker': '🎨 Sticker'
      }
      mensagem = tipoLabels[tipo] || '📎 Mídia'
    }

    // Buscar foto de perfil ANTES de criar a conversa (só para novas conversas)
    let fotoPerfilUrl: string | null = null
    
    // Verificar se conversa já existe
    const { data: conversaExistente } = await getSupabase()
      .from('conversas_whatsapp')
      .select('id, foto_perfil_url')
      .eq('telefone', telefone)
      .single()
    
    // Só busca foto se for nova conversa ou se não tem foto ainda
    if (!conversaExistente || !conversaExistente.foto_perfil_url) {
      fotoPerfilUrl = await buscarFotoPerfil(telefone)
    }

    // Usar function do banco para evitar duplicatas e criar conversa se necessário
    const { data: resultado, error: erroProcessamento } = await getSupabase()
      .rpc('processar_mensagem_whatsapp', {
        p_telefone: telefone,
        p_nome_contato: nomeContato || null,
        p_conteudo: mensagem,
        p_tipo: tipo,
        p_direcao: 'entrada',
        p_message_id: messageId || null,
        p_media_url: mediaUrl || null,
        p_setor_id: null,
        p_foto_perfil_url: fotoPerfilUrl // Passa a foto apenas na criação
      })

    if (erroProcessamento || !resultado || resultado.length === 0) {
      console.error('Erro ao processar mensagem:', erroProcessamento)
      await salvarLogWebhook({ erro: erroProcessamento?.message || 'Sem resultado' }, 'erro_processar', ip)
      return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 })
    }

    // Extrair dados do resultado da function
    const { conversa_id: conversaId, mensagem_id: mensagemId, is_nova_conversa: isPrimeiraMsg } = resultado[0]

    console.log(`📩 Mensagem processada: tipo=${tipo}, mediaUrl=${mediaUrl ? 'sim' : 'não'}, conversa=${conversaId}`)

    // Verificação adicional: Duplicata recente
    const isDuplicata = await verificarDuplicataRecente(conversaId, mensagem)
    if (isDuplicata) {
      console.log(`🔄 Detectada duplicata de mensagem de saída, removendo mensagem de entrada duplicada`)
      await getSupabase()
        .from('mensagens_whatsapp')
        .delete()
        .eq('id', mensagemId)
      
      await salvarLogWebhook({ mensagem, motivo: 'duplicata de saída' }, 'ignorado_duplicata', ip)
      return NextResponse.json({ 
        success: true, 
        message: 'Duplicata de mensagem de saída ignorada',
        ignored: true
      })
    }

    // REMOVIDO: Não atualiza foto em background para evitar loops de realtime

    // Processar respostas automáticas e IA (apenas para mensagens de texto ou áudio)
    if (tipo === 'texto' || tipo === 'audio') {
      processarRespostasAutomaticas(conversaId, telefone, mensagem, isPrimeiraMsg)
        .then(respondeu => {
          if (!respondeu) {
            processarComIA(conversaId, telefone, mensagem, tipo, mediaUrl)
          }
        })
        .catch(err => console.error('Erro processamento:', err))
    }

    return NextResponse.json({ 
      success: true, 
      conversa_id: conversaId,
      mensagem_id: mensagemId,
      is_nova_conversa: isPrimeiraMsg,
      tipo,
      has_media: !!mediaUrl
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro webhook:', error)
    await salvarLogWebhook({ erro: errorMessage }, 'erro_geral', ip)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('hub.challenge') || searchParams.get('challenge')
  
  if (challenge) {
    return new Response(challenge, { status: 200 })
  }
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook WhatsApp ativo',
    timestamp: new Date().toISOString()
  })
}
