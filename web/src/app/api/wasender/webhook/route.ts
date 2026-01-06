import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Salvar log do webhook para debug
async function salvarLogWebhook(payload: any, tipo: string) {
  try {
    await getSupabase()
      .from('webhook_logs')
      .insert({
        tipo,
        payload: JSON.stringify(payload),
        created_at: new Date().toISOString()
      })
  } catch (e) {
    console.error('Erro ao salvar log:', e)
  }
}

// Transcrever áudio com Whisper
async function transcreveAudio(audioUrl: string, apiKey: string): Promise<string | null> {
  try {
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) return null
    
    const audioBlob = await audioResponse.blob()
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.ogg')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData
    })
    
    if (!response.ok) return null
    const result = await response.json()
    return result.text
  } catch (error) {
    console.error('Erro ao transcrever:', error)
    return null
  }
}

// Gerar resposta com GPT
async function gerarRespostaIA(mensagem: string, config: any): Promise<string | null> {
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
          { role: 'user', content: mensagem }
        ],
        temperature: config.temperatura || 0.7,
        max_tokens: config.max_tokens || 500
      })
    })

    if (!response.ok) return null
    const result = await response.json()
    return result.choices[0]?.message?.content || null
  } catch (error) {
    console.error('Erro GPT:', error)
    return null
  }
}

// Enviar mensagem via WaSender
async function enviarMensagem(telefone: string, mensagem: string): Promise<string | false> {
  try {
    const { data: config } = await getSupabase()
      .from('config_wasender')
      .select('api_key')
      .single()

    if (!config?.api_key) return false

    let numero = telefone.replace(/\D/g, '')
    if (!numero.startsWith('55')) numero = '55' + numero

    const response = await fetch('https://api.wasenderapi.com/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`
      },
      body: JSON.stringify({ phone: numero, message: mensagem })
    })

    const result = await response.json()
    console.log('Mensagem enviada:', result)
    return response.ok ? (result.messageId || true) : false
  } catch (error) {
    console.error('Erro ao enviar:', error)
    return false
  }
}

// Processar com IA
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
      console.log('Bot IA não ativado')
      return
    }

    let textoProcessar = mensagem
    let transcricao: string | null = null

    // Transcrever áudio se necessário
    if (tipo === 'audio' && mediaUrl && configIA.transcrever_audios) {
      transcricao = await transcreveAudio(mediaUrl, configIA.openai_api_key)
      if (transcricao) {
        textoProcessar = transcricao
        // Salvar transcrição como nota
        await getSupabase()
          .from('mensagens_whatsapp')
          .update({ conteudo: `🎤 Áudio transcrito:\n"${transcricao}"` })
          .eq('conversa_id', conversaId)
          .eq('tipo', 'audio')
          .order('created_at', { ascending: false })
          .limit(1)
      }
    }

    // Gerar resposta com IA
    const respostaIA = await gerarRespostaIA(textoProcessar, configIA)
    
    if (respostaIA) {
      // Delay para simular digitação
      await new Promise(r => setTimeout(r, 2000))
      
      const enviada = await enviarMensagem(telefone, respostaIA)
      
      if (enviada) {
        // Salvar resposta no banco
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

        console.log(`Resposta IA enviada para ${telefone}`)
      }
    }
  } catch (error) {
    console.error('Erro ao processar IA:', error)
  }
}

// Processar respostas automáticas (regras simples)
async function processarRespostasAutomaticas(
  conversaId: string,
  telefone: string,
  mensagem: string,
  isPrimeiraMsg: boolean
) {
  try {
    const { data: regras } = await getSupabase()
      .from('respostas_automaticas')
      .select('*')
      .eq('ativo', true)
      .order('prioridade', { ascending: false })

    if (!regras || regras.length === 0) return false

    const mensagemLower = mensagem.toLowerCase().trim()

    for (const regra of regras) {
      let deveResponder = false

      switch (regra.gatilho_tipo) {
        case 'primeira_mensagem':
          deveResponder = isPrimeiraMsg
          break
        case 'palavra_chave':
          if (regra.palavras_chave?.length > 0) {
            deveResponder = regra.palavras_chave.some((p: string) => 
              mensagemLower.includes(p.toLowerCase())
            )
          }
          break
        case 'fora_horario':
          const hora = new Date().toTimeString().slice(0, 5)
          if (regra.horario_inicio && regra.horario_fim) {
            deveResponder = hora < regra.horario_inicio || hora > regra.horario_fim
          }
          break
      }

      if (deveResponder) {
        if (regra.delay_segundos > 0) {
          await new Promise(r => setTimeout(r, regra.delay_segundos * 1000))
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

          console.log(`Resposta automática "${regra.nome}" enviada`)
          return true // Parar após primeira resposta
        }
      }
    }
    return false
  } catch (error) {
    console.error('Erro respostas automáticas:', error)
    return false
  }
}

// Extrair dados da mensagem (suporta múltiplos formatos do WaSender)
function extrairDadosMensagem(body: any) {
  // Formato WaSender messages.received: { event, data: { messages: { key, messageBody, message } } }
  if (body.data?.messages) {
    const msg = body.data.messages
    const key = msg.key || {}
    return {
      telefone: key.cleanedSenderPn?.replace(/\D/g, '') ||
                key.cleanedParticipantPn?.replace(/\D/g, '') ||
                key.remoteJid?.replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, ''),
      mensagem: msg.messageBody || msg.message?.conversation || msg.message?.extendedTextMessage?.text,
      messageId: key.id,
      tipo: msg.message?.imageMessage ? 'imagem' : 
            msg.message?.videoMessage ? 'video' :
            msg.message?.audioMessage ? 'audio' :
            msg.message?.documentMessage ? 'documento' : 'texto',
      mediaUrl: msg.message?.imageMessage?.url || msg.message?.videoMessage?.url || 
                msg.message?.audioMessage?.url || msg.message?.documentMessage?.url,
      nomeContato: msg.pushName || body.data.pushName
    }
  }
  
  // Formato 1: { event, data: { from, message, ... } }
  if (body.data) {
    const data = body.data
    return {
      telefone: data.from?.replace('@c.us', '').replace(/\D/g, '') || 
                data.sender?.replace('@c.us', '').replace(/\D/g, '') ||
                data.phone?.replace(/\D/g, ''),
      mensagem: data.message || data.body || data.text || data.content,
      messageId: data.id || data.messageId || data.message_id,
      tipo: data.type || data.messageType || 'texto',
      mediaUrl: data.mediaUrl || data.media?.url || data.file?.url,
      nomeContato: data.pushName || data.notifyName || data.name || data.senderName
    }
  }
  
  // Formato 2: Dados direto no body
  return {
    telefone: body.from?.replace('@c.us', '').replace(/\D/g, '') || 
              body.sender?.replace('@c.us', '').replace(/\D/g, '') ||
              body.phone?.replace(/\D/g, ''),
    mensagem: body.message || body.body || body.text || body.content,
    messageId: body.id || body.messageId || body.message_id,
    tipo: body.type || body.messageType || 'texto',
    mediaUrl: body.mediaUrl || body.media?.url || body.file?.url,
    nomeContato: body.pushName || body.notifyName || body.name || body.senderName
  }
}

// Verificar se é evento de mensagem recebida
function isEventoMensagem(body: any): boolean {
  const event = body.event || body.type || body.action
  const eventosValidos = [
    'message', 
    'message.received',
    'messages.received',  // WaSender envia com 's'
    'messages.upsert',
    'message_received',
    'incoming_message',
    'new_message'
  ]
  
  // Se não tem evento definido mas tem dados de mensagem, considerar válido
  if (!event && (body.message || body.body || body.text || body.data?.message)) {
    return true
  }
  
  return eventosValidos.includes(event?.toLowerCase())
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('=== WEBHOOK RECEBIDO ===')
    console.log(JSON.stringify(body, null, 2))
    
    // Salvar log para debug
    await salvarLogWebhook(body, 'webhook_recebido')

    // Verificar se é evento de mensagem
    if (!isEventoMensagem(body)) {
      // Verificar se é status de mensagem
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
      
      console.log('Evento ignorado:', body.event || body.type || 'sem evento')
      return NextResponse.json({ success: true, message: 'Evento ignorado' })
    }

    // Extrair dados da mensagem
    const { telefone, mensagem, messageId, tipo, mediaUrl, nomeContato } = extrairDadosMensagem(body)

    console.log('Dados extraídos:', { telefone, mensagem, messageId, tipo, nomeContato })

    if (!telefone || !mensagem) {
      console.log('Dados incompletos - telefone:', telefone, 'mensagem:', mensagem)
      await salvarLogWebhook({ erro: 'Dados incompletos', telefone, mensagem }, 'erro')
      return NextResponse.json({ error: 'Dados incompletos', telefone, mensagem }, { status: 400 })
    }

    let isPrimeiraMsg = false

    // Buscar ou criar conversa
    let { data: conversa } = await getSupabase()
      .from('conversas_whatsapp')
      .select('id, nao_lidas')
      .eq('telefone', telefone)
      .single()

    if (!conversa) {
      isPrimeiraMsg = true
      const { data: nova, error } = await getSupabase()
        .from('conversas_whatsapp')
        .insert({
          telefone,
          nome_contato: nomeContato || null,
          status: 'aberta',
          nao_lidas: 1,
          ultimo_contato: new Date().toISOString(),
          ultima_mensagem: mensagem.substring(0, 100)
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar conversa:', error)
        await salvarLogWebhook({ erro: error.message }, 'erro_conversa')
        return NextResponse.json({ error: 'Erro criar conversa' }, { status: 500 })
      }
      conversa = nova
      console.log('Nova conversa criada:', conversa?.id)
    } else {
      await getSupabase()
        .from('conversas_whatsapp')
        .update({
          ultimo_contato: new Date().toISOString(),
          ultima_mensagem: mensagem.substring(0, 100),
          nao_lidas: (conversa.nao_lidas || 0) + 1,
          nome_contato: nomeContato || undefined // Atualiza nome se disponível
        })
        .eq('id', conversa.id)
      console.log('Conversa atualizada:', conversa.id)
    }

    if (!conversa) {
      return NextResponse.json({ error: 'Erro ao obter conversa' }, { status: 500 })
    }

    // Salvar mensagem
    const { error: msgError } = await getSupabase().from('mensagens_whatsapp').insert({
      conversa_id: conversa.id,
      direcao: 'entrada',
      conteudo: mensagem,
      tipo,
      status: 'recebida',
      message_id: messageId,
      media_url: mediaUrl
    })

    if (msgError) {
      console.error('Erro ao salvar mensagem:', msgError)
    } else {
      console.log('Mensagem salva com sucesso')
    }

    // Processar respostas (async - não bloqueia o retorno)
    processarRespostasAutomaticas(conversa.id, telefone, mensagem, isPrimeiraMsg)
      .then(respondeu => {
        if (!respondeu) {
          processarComIA(conversa.id, telefone, mensagem, tipo, mediaUrl)
        }
      })
      .catch(err => console.error('Erro processamento:', err))

    return NextResponse.json({ 
      success: true, 
      conversa_id: conversa.id,
      mensagem_recebida: mensagem.substring(0, 50)
    })
  } catch (error: any) {
    console.error('Erro webhook:', error)
    await salvarLogWebhook({ erro: error.message, stack: error.stack }, 'erro_geral')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  // Verificação de webhook (alguns serviços exigem)
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('hub.challenge') || searchParams.get('challenge')
  
  if (challenge) {
    return new Response(challenge, { status: 200 })
  }
  
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook WhatsApp ativo',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: 'POST /api/wasender/webhook',
      test: 'GET /api/wasender/webhook'
    }
  })
}
