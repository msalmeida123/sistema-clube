import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Transcrever Ã¡udio com Whisper
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
    const systemPrompt = `${config.instrucoes_sistema || 'VocÃª Ã© um assistente virtual do clube.'}

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
    const { data: configIA } = await supabase
      .from('config_bot_ia')
      .select('*')
      .single()

    if (!configIA?.openai_api_key || !configIA?.responder_com_ia) {
      console.log('Bot IA nÃ£o ativado')
      return
    }

    let textoProcessar = mensagem
    let transcricao: string | null = null

    // Transcrever Ã¡udio se necessÃ¡rio
    if (tipo === 'audio' && mediaUrl && configIA.transcrever_audios) {
      transcricao = await transcreveAudio(mediaUrl, configIA.openai_api_key)
      if (transcricao) {
        textoProcessar = transcricao
        // Salvar transcriÃ§Ã£o como nota
        await supabase
          .from('mensagens_whatsapp')
          .update({ conteudo: `ðŸŽ¤ Ãudio transcrito:\n"${transcricao}"` })
          .eq('conversa_id', conversaId)
          .eq('tipo', 'audio')
          .order('created_at', { ascending: false })
          .limit(1)
      }
    }

    // Gerar resposta com IA
    const respostaIA = await gerarRespostaIA(textoProcessar, configIA)
    
    if (respostaIA) {
      // Delay para simular digitaÃ§Ã£o
      await new Promise(r => setTimeout(r, 2000))
      
      const enviada = await enviarMensagem(telefone, respostaIA)
      
      if (enviada) {
        // Salvar resposta no banco
        await supabase
          .from('mensagens_whatsapp')
          .insert({
            conversa_id: conversaId,
            direcao: 'saida',
            conteudo: respostaIA,
            tipo: 'texto',
            status: 'enviada',
            message_id: typeof enviada === 'string' ? enviada : null
          })

        await supabase
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

// Processar respostas automÃ¡ticas (regras simples)
async function processarRespostasAutomaticas(
  conversaId: string,
  telefone: string,
  mensagem: string,
  isPrimeiraMsg: boolean
) {
  try {
    const { data: regras } = await supabase
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

          await supabase
            .from('respostas_automaticas')
            .update({ uso_count: (regra.uso_count || 0) + 1 })
            .eq('id', regra.id)

          console.log(`Resposta automÃ¡tica "${regra.nome}" enviada`)
          return true // Parar apÃ³s primeira resposta
        }
      }
    }
    return false
  } catch (error) {
    console.error('Erro respostas automÃ¡ticas:', error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Webhook recebido:', JSON.stringify(body, null, 2))

    const { event, data } = body

    if (event === 'message' || event === 'message.received') {
      const telefone = data.from?.replace('@c.us', '').replace(/\D/g, '') || data.sender
      const mensagem = data.message || data.body || data.text
      const messageId = data.id || data.messageId
      const tipo = data.type || 'texto'
      const mediaUrl = data.mediaUrl || data.media?.url

      if (!telefone || !mensagem) {
        return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
      }

      let isPrimeiraMsg = false

      // Buscar ou criar conversa
      let { data: conversa } = await supabase
        .from('conversas_whatsapp')
        .select('id, nao_lidas')
        .eq('telefone', telefone)
        .single()

      if (!conversa) {
        isPrimeiraMsg = true
        const { data: nova, error } = await supabase
          .from('conversas_whatsapp')
          .insert({
            telefone,
            nome_contato: data.pushName || data.notifyName || null,
            status: 'aberta',
            nao_lidas: 1,
            ultimo_contato: new Date().toISOString(),
            ultima_mensagem: mensagem.substring(0, 100)
          })
          .select()
          .single()

        if (error || !nova) return NextResponse.json({ error: 'Erro criar conversa' }, { status: 500 })
        conversa = nova
      } else {
        await supabase
          .from('conversas_whatsapp')
          .update({
            ultimo_contato: new Date().toISOString(),
            ultima_mensagem: mensagem.substring(0, 100),
            nao_lidas: (conversa.nao_lidas || 0) + 1
          })
          .eq('id', conversa.id)
      }

      // Garantir que conversa existe
      if (!conversa) {
        return NextResponse.json({ error: 'Erro ao obter conversa' }, { status: 500 })
      }

      // Salvar mensagem
      await getSupabase().from('mensagens_whatsapp').insert({
        conversa_id: conversa.id,
        direcao: 'entrada',
        conteudo: mensagem,
        tipo,
        status: 'recebida',
        message_id: messageId,
        media_url: mediaUrl
      })

      // Processar respostas (async)
      // Primeiro tenta regras automÃ¡ticas, se nÃ£o der match usa IA
      processarRespostasAutomaticas(conversa.id, telefone, mensagem, isPrimeiraMsg)
        .then(respondeu => {
          if (!respondeu) {
            // Se nenhuma regra automÃ¡tica respondeu, usar IA
            processarComIA(conversa.id, telefone, mensagem, tipo, mediaUrl)
          }
        })
        .catch(err => console.error('Erro processamento:', err))

      return NextResponse.json({ success: true, conversa_id: conversa.id })
    }

    // Status de mensagem
    if (event === 'message.ack' || event === 'ack') {
      const messageId = data.id || data.messageId
      const ack = data.ack
      let status = 'enviada'
      if (ack === 2) status = 'entregue'
      if (ack === 3) status = 'lida'

      await supabase
        .from('mensagens_whatsapp')
        .update({ status })
        .eq('message_id', messageId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true, message: 'Evento ignorado' })
  } catch (error: any) {
    console.error('Erro webhook:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Webhook ativo' })
}
