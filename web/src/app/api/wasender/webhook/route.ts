import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'

// ==========================================
// CONFIGURAÇÕES DE SEGURANÇA
// ==========================================

// IPs permitidos do WaSender (adicione os IPs oficiais se disponíveis)
const IPS_PERMITIDOS: string[] = [
  // Adicione aqui os IPs do WaSender quando disponíveis
  // '1.2.3.4',
]

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

// Verificar secret key do webhook
function verificarWebhookSecret(request: Request, body: string): boolean {
  const webhookSecret = process.env.WASENDER_WEBHOOK_SECRET
  
  // Se não tem secret configurado, permitir (mas logar warning)
  if (!webhookSecret) {
    console.warn('⚠️ WASENDER_WEBHOOK_SECRET não configurado! Webhook sem proteção.')
    return true
  }

  // Verificar header de assinatura (WaSender pode usar diferentes headers)
  const headersList = headers()
  const signature = headersList.get('x-webhook-signature') || 
                    headersList.get('x-wasender-signature') ||
                    headersList.get('x-hub-signature-256') ||
                    headersList.get('authorization')

  if (!signature) {
    console.warn('⚠️ Requisição sem assinatura de webhook')
    return false
  }

  // Se for Bearer token simples
  if (signature.startsWith('Bearer ')) {
    return signature.replace('Bearer ', '') === webhookSecret
  }

  // Se for HMAC signature
  if (signature.startsWith('sha256=')) {
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  // Comparação direta
  return signature === webhookSecret
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

// Validar origem da requisição
function validarOrigem(): { valido: boolean; motivo?: string } {
  const headersList = headers()
  
  // Verificar IP (se lista de IPs permitidos estiver configurada)
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             headersList.get('x-real-ip') ||
             'unknown'

  // Se temos IPs permitidos configurados, verificar
  if (IPS_PERMITIDOS.length > 0 && !IPS_PERMITIDOS.includes(ip)) {
    return { valido: false, motivo: `IP não permitido: ${ip}` }
  }

  // Rate limiting
  if (!verificarRateLimit(ip)) {
    return { valido: false, motivo: 'Rate limit excedido' }
  }

  return { valido: true }
}

// Sanitizar entrada para prevenir injection
function sanitizarTexto(texto: string | undefined | null): string {
  if (!texto) return ''
  
  // Remover caracteres de controle perigosos
  return texto
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Caracteres de controle
    .substring(0, 10000) // Limitar tamanho
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
    await getSupabase()
      .from('webhook_logs')
      .insert({
        tipo,
        payload: JSON.stringify(payload).substring(0, 50000), // Limitar tamanho
        created_at: new Date().toISOString()
      })
  } catch (e) {
    console.error('Erro ao salvar log:', e)
  }
}

// Buscar foto de perfil do contato via API do WaSender
async function buscarFotoPerfil(telefone: string): Promise<string | null> {
  try {
    const { data: config } = await getSupabase()
      .from('config_wasender')
      .select('api_key')
      .single()

    if (!config?.api_key) return null

    let numero = sanitizarTelefone(telefone)
    if (!numero.startsWith('55')) numero = '55' + numero

    // API do WaSender para buscar foto de perfil
    // Endpoint: GET https://www.wasenderapi.com/api/contacts/{contactPhoneNumber}/picture
    // Response: { "success": true, "data": { "imgUrl": "https://..." } }
    const response = await fetch(`https://www.wasenderapi.com/api/contacts/${numero}/picture`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.api_key}`
      },
      signal: AbortSignal.timeout(10000) // Timeout de 10s
    })

    if (!response.ok) {
      console.log(`Foto de perfil não encontrada para ${numero}: ${response.status}`)
      return null
    }

    const result = await response.json()
    
    // A resposta vem em result.data.imgUrl conforme documentação
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

// Atualizar foto de perfil da conversa (executa em background)
async function atualizarFotoPerfilConversa(conversaId: string, telefone: string) {
  try {
    // Verificar se já tem foto
    const { data: conversa } = await getSupabase()
      .from('conversas_whatsapp')
      .select('foto_perfil_url')
      .eq('id', conversaId)
      .single()

    // Se já tem foto, não buscar novamente (pode ser atualizada manualmente depois)
    if (conversa?.foto_perfil_url) return

    // Buscar foto via API
    const fotoUrl = await buscarFotoPerfil(telefone)
    
    if (fotoUrl) {
      await getSupabase()
        .from('conversas_whatsapp')
        .update({ foto_perfil_url: fotoUrl })
        .eq('id', conversaId)
      
      console.log(`📷 Foto de perfil salva para conversa ${conversaId}`)
    }
  } catch (error) {
    console.error('Erro ao atualizar foto de perfil:', error)
  }
}

async function transcreveAudio(audioUrl: string, apiKey: string): Promise<string | null> {
  try {
    // Validar URL
    if (!audioUrl.startsWith('http')) return null
    
    const audioResponse = await fetch(audioUrl, { 
      signal: AbortSignal.timeout(30000) // Timeout de 30s
    })
    if (!audioResponse.ok) return null
    
    const audioBlob = await audioResponse.blob()
    
    // Validar tamanho (máx 25MB)
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
      signal: AbortSignal.timeout(60000) // Timeout de 60s
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
          { role: 'user', content: mensagem.substring(0, 4000) } // Limitar input
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
        message: mensagem.substring(0, 4000) // Limitar tamanho
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
  fromMe: boolean // NOVO: indica se é mensagem enviada pelo próprio sistema
}

interface WebhookBody {
  event?: string
  type?: string
  action?: string
  message?: string
  body?: string
  text?: string
  content?: string
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
  data?: {
    messages?: {
      key?: {
        id?: string
        fromMe?: boolean // IMPORTANTE: campo que indica se a mensagem foi enviada pelo sistema
        cleanedSenderPn?: string
        cleanedParticipantPn?: string
        remoteJid?: string
      }
      messageBody?: string
      message?: {
        conversation?: string
        extendedTextMessage?: { text?: string }
        imageMessage?: { url?: string }
        videoMessage?: { url?: string }
        audioMessage?: { url?: string }
        documentMessage?: { url?: string }
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
    id?: string
    messageId?: string
    type?: string
    mediaUrl?: string
    media?: { url?: string }
    notifyName?: string
    name?: string
    ack?: number | string
  }
}

function extrairDadosMensagem(body: WebhookBody): DadosMensagem {
  // Formato WaSender messages.received / messages.upsert
  if (body.data?.messages) {
    const msg = body.data.messages
    const key = msg.key || {}
    return {
      telefone: sanitizarTelefone(
        key.cleanedSenderPn ||
        key.cleanedParticipantPn ||
        key.remoteJid?.replace('@s.whatsapp.net', '').replace('@c.us', '').replace('@lid', '')
      ),
      mensagem: sanitizarTexto(
        msg.messageBody || 
        msg.message?.conversation || 
        msg.message?.extendedTextMessage?.text
      ),
      messageId: msg.key?.id || '',
      tipo: msg.message?.imageMessage ? 'imagem' : 
            msg.message?.videoMessage ? 'video' :
            msg.message?.audioMessage ? 'audio' :
            msg.message?.documentMessage ? 'documento' : 'texto',
      mediaUrl: msg.message?.imageMessage?.url || msg.message?.videoMessage?.url || 
                msg.message?.audioMessage?.url || msg.message?.documentMessage?.url,
      nomeContato: sanitizarTexto(msg.pushName || body.data.pushName),
      fromMe: key.fromMe === true // Verificar se é mensagem enviada pelo sistema
    }
  }
  
  // Formato padrão
  if (body.data) {
    const data = body.data
    return {
      telefone: sanitizarTelefone(
        data.from?.replace('@c.us', '') || 
        data.sender?.replace('@c.us', '') ||
        data.phone
      ),
      mensagem: sanitizarTexto(data.message || data.body || data.text || data.content),
      messageId: data.id || data.messageId || '',
      tipo: data.type || 'texto',
      mediaUrl: data.mediaUrl || data.media?.url,
      nomeContato: sanitizarTexto(data.pushName || data.notifyName || data.name),
      fromMe: data.fromMe === true || body.fromMe === true
    }
  }
  
  // Dados direto no body
  return {
    telefone: sanitizarTelefone(
      body.from?.replace('@c.us', '') || 
      body.sender?.replace('@c.us', '') ||
      body.phone
    ),
    mensagem: sanitizarTexto(body.message || body.body || body.text || body.content),
    messageId: body.id || body.messageId || '',
    tipo: body.type || 'texto',
    mediaUrl: body.mediaUrl || body.media?.url,
    nomeContato: sanitizarTexto(body.pushName || body.notifyName || body.name),
    fromMe: body.fromMe === true
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
  
  if (!event && (body.message || body.body || body.text || body.data?.message || body.data?.messages)) {
    return true
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
    // Validar origem
    const validacao = validarOrigem()
    if (!validacao.valido) {
      console.warn(`Requisição bloqueada: ${validacao.motivo}`)
      await salvarLogWebhook({ motivo: validacao.motivo }, 'bloqueado', ip)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Ler body como texto para verificar assinatura
    const bodyText = await request.text()
    
    // Verificar secret/assinatura do webhook
    if (!verificarWebhookSecret(request, bodyText)) {
      console.warn('Assinatura de webhook inválida')
      await salvarLogWebhook({ motivo: 'Assinatura inválida' }, 'assinatura_invalida', ip)
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    // Parse do JSON
    let body: WebhookBody
    try {
      body = JSON.parse(bodyText)
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    // Salvar log
    await salvarLogWebhook(body, 'webhook_recebido', ip)

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
    const { telefone, mensagem, messageId, tipo, mediaUrl, nomeContato, fromMe } = extrairDadosMensagem(body)

    // ==========================================
    // IMPORTANTE: Ignorar mensagens enviadas pelo próprio sistema
    // Isso evita duplicação quando o WaSender envia webhook de mensagens de saída
    // ==========================================
    if (fromMe) {
      console.log(`📤 Ignorando mensagem de saída (fromMe=true): ${mensagem.substring(0, 50)}...`)
      return NextResponse.json({ 
        success: true, 
        message: 'Mensagem de saída ignorada (fromMe=true)',
        ignored: true
      })
    }

    if (!telefone || !mensagem) {
      await salvarLogWebhook({ erro: 'Dados incompletos', telefone, mensagem }, 'erro', ip)
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // ==========================================
    // Usar function do banco para evitar duplicatas
    // A function processar_mensagem_whatsapp garante atomicidade
    // e busca/cria conversa de forma segura
    // ==========================================
    
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
        p_foto_perfil_url: null // Será buscada em background
      })

    if (erroProcessamento || !resultado || resultado.length === 0) {
      console.error('Erro ao processar mensagem:', erroProcessamento)
      await salvarLogWebhook({ erro: erroProcessamento?.message || 'Sem resultado' }, 'erro_processar', ip)
      return NextResponse.json({ error: 'Erro ao processar mensagem' }, { status: 500 })
    }

    // Extrair dados do resultado da function
    const { conversa_id: conversaId, mensagem_id: mensagemId, is_nova_conversa: isPrimeiraMsg } = resultado[0]

    // Buscar foto de perfil em background (não bloqueia resposta)
    atualizarFotoPerfilConversa(conversaId, telefone)
      .catch(err => console.error('Erro ao buscar foto:', err))

    // Processar respostas automáticas e IA (async, não bloqueia resposta)
    processarRespostasAutomaticas(conversaId, telefone, mensagem, isPrimeiraMsg)
      .then(respondeu => {
        if (!respondeu) {
          processarComIA(conversaId, telefone, mensagem, tipo, mediaUrl)
        }
      })
      .catch(err => console.error('Erro processamento:', err))

    return NextResponse.json({ 
      success: true, 
      conversa_id: conversaId,
      mensagem_id: mensagemId,
      is_nova_conversa: isPrimeiraMsg
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
