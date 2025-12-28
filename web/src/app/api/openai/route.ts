import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Transcrever áudio com Whisper
async function transcreveAudio(audioUrl: string, apiKey: string): Promise<string | null> {
  try {
    // Baixar o áudio
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      console.error('Erro ao baixar áudio:', audioResponse.status)
      return null
    }
    
    const audioBlob = await audioResponse.blob()
    
    // Criar FormData para enviar ao Whisper
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.ogg')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.text()
      console.error('Erro Whisper:', error)
      return null
    }
    
    const result = await response.json()
    return result.text
  } catch (error) {
    console.error('Erro ao transcrever áudio:', error)
    return null
  }
}

// Gerar resposta com GPT
async function gerarRespostaIA(
  mensagem: string, 
  apiKey: string,
  modelo: string,
  instrucoes: string,
  contexto: string,
  temperatura: number,
  maxTokens: number
): Promise<string | null> {
  try {
    const systemPrompt = `${instrucoes}

DOCUMENTO DO CLUBE (use essas informações para responder):
${contexto}`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: mensagem }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelo,
        messages,
        temperature: temperatura,
        max_tokens: maxTokens
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erro GPT:', error)
      return null
    }

    const result = await response.json()
    return result.choices[0]?.message?.content || null
  } catch (error) {
    console.error('Erro ao gerar resposta:', error)
    return null
  }
}

// Função principal para processar mensagem com IA
async function processarMensagemComIA(
  mensagem: string,
  tipo: string,
  mediaUrl?: string
): Promise<{ resposta: string | null, transcricao?: string }> {
  const supabase = getSupabase()
  
  // Buscar configuração
  const { data: config } = await supabase
    .from('config_bot_ia')
    .select('*')
    .single()

  if (!config?.openai_api_key) {
    console.log('OpenAI API Key não configurada')
    return { resposta: null }
  }

  let textoParaProcessar = mensagem
  let transcricao: string | undefined

  // Se for áudio, transcrever primeiro
  if (tipo === 'audio' && mediaUrl && config.transcrever_audios) {
    const texto = await transcreveAudio(mediaUrl, config.openai_api_key)
    if (texto) {
      transcricao = texto
      textoParaProcessar = texto
    }
  }

  // Gerar resposta com IA
  if (config.responder_com_ia && textoParaProcessar) {
    const resposta = await gerarRespostaIA(
      textoParaProcessar,
      config.openai_api_key,
      config.modelo || 'gpt-4o-mini',
      config.instrucoes_sistema || 'Você é um assistente virtual do clube.',
      config.documento_contexto || '',
      config.temperatura || 0.7,
      config.max_tokens || 500
    )
    return { resposta, transcricao }
  }

  return { resposta: null, transcricao }
}

// API endpoint para testar
export async function POST(request: Request) {
  try {
    const { mensagem, tipo, mediaUrl } = await request.json()
    
    const resultado = await processarMensagemComIA(mensagem, tipo || 'texto', mediaUrl)
    
    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('Erro:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
