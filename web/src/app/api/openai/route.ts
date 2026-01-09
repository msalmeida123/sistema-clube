import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// ==========================================
// CONFIGURAÇÕES DE SEGURANÇA
// ==========================================

// Rate limiting por usuário (em memória - para produção use Redis)
const userRateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 20 // máximo de requisições por usuário
const RATE_LIMIT_WINDOW = 60000 // janela de 1 minuto

// Limite de tokens por requisição
const MAX_INPUT_LENGTH = 4000
const MAX_OUTPUT_TOKENS = 2000

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ==========================================
// FUNÇÕES DE SEGURANÇA
// ==========================================

function verificarRateLimitUsuario(userId: string): { permitido: boolean; restante: number } {
  const now = Date.now()
  const record = userRateLimitMap.get(userId)

  if (!record || now > record.resetTime) {
    userRateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { permitido: true, restante: RATE_LIMIT_MAX - 1 }
  }

  if (record.count >= RATE_LIMIT_MAX) {
    const tempoRestante = Math.ceil((record.resetTime - now) / 1000)
    return { permitido: false, restante: 0 }
  }

  record.count++
  return { permitido: true, restante: RATE_LIMIT_MAX - record.count }
}

// Sanitizar e limitar input
function sanitizarMensagem(mensagem: string): string {
  if (!mensagem) return ''
  
  return mensagem
    .substring(0, MAX_INPUT_LENGTH)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remover caracteres de controle
}

// ==========================================
// FUNÇÕES DE NEGÓCIO
// ==========================================

async function transcreveAudio(audioUrl: string, apiKey: string): Promise<string | null> {
  try {
    // Validar URL
    if (!audioUrl || !audioUrl.startsWith('http')) {
      console.error('URL de áudio inválida')
      return null
    }

    const audioResponse = await fetch(audioUrl, {
      signal: AbortSignal.timeout(30000)
    })
    
    if (!audioResponse.ok) {
      console.error('Erro ao baixar áudio:', audioResponse.status)
      return null
    }
    
    const audioBlob = await audioResponse.blob()
    
    // Validar tamanho (máx 25MB - limite do Whisper)
    if (audioBlob.size > 25 * 1024 * 1024) {
      console.error('Áudio muito grande para transcrição')
      return null
    }
    
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.ogg')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData,
      signal: AbortSignal.timeout(60000)
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
    // Validar e limitar parâmetros
    const temperaturaSegura = Math.min(Math.max(temperatura || 0.7, 0), 2)
    const maxTokensSeguro = Math.min(maxTokens || 500, MAX_OUTPUT_TOKENS)
    
    const systemPrompt = `${instrucoes || 'Você é um assistente virtual do clube.'}

DOCUMENTO DO CLUBE (use essas informações para responder):
${contexto || ''}`

    const messages = [
      { role: 'system', content: systemPrompt.substring(0, 8000) },
      { role: 'user', content: sanitizarMensagem(mensagem) }
    ]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelo || 'gpt-4o-mini',
        messages,
        temperature: temperaturaSegura,
        max_tokens: maxTokensSeguro
      }),
      signal: AbortSignal.timeout(30000)
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

async function processarMensagemComIA(
  mensagem: string,
  tipo: string,
  mediaUrl?: string
): Promise<{ resposta: string | null; transcricao?: string; erro?: string }> {
  const supabaseAdmin = getSupabaseAdmin()
  
  // Buscar configuração
  const { data: config, error: configError } = await supabaseAdmin
    .from('config_bot_ia')
    .select('*')
    .single()

  if (configError || !config?.openai_api_key) {
    return { resposta: null, erro: 'Bot IA não configurado' }
  }

  let textoParaProcessar = sanitizarMensagem(mensagem)
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

// ==========================================
// HANDLER HTTP
// ==========================================

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login para usar o assistente IA.' },
        { status: 401 }
      )
    }

    // Verificar rate limit do usuário
    const rateLimit = verificarRateLimitUsuario(user.id)
    
    if (!rateLimit.permitido) {
      return NextResponse.json(
        { 
          error: 'Limite de requisições excedido. Aguarde um minuto.',
          retryAfter: 60
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': '0'
          }
        }
      )
    }

    // Verificar se usuário tem permissão de CRM
    const { data: userData } = await supabase
      .from('usuarios')
      .select('is_admin, permissoes')
      .eq('id', user.id)
      .single()

    const temPermissao = userData?.is_admin || 
                         userData?.permissoes?.includes('crm') ||
                         userData?.permissoes?.includes('configuracoes')

    if (!temPermissao) {
      return NextResponse.json(
        { error: 'Você não tem permissão para usar o assistente IA.' },
        { status: 403 }
      )
    }

    // Processar requisição
    const body = await request.json()
    const { mensagem, tipo, mediaUrl } = body

    if (!mensagem && tipo !== 'audio') {
      return NextResponse.json(
        { error: 'Mensagem é obrigatória' },
        { status: 400 }
      )
    }

    // Processar com IA
    const resultado = await processarMensagemComIA(
      mensagem || '', 
      tipo || 'texto', 
      mediaUrl
    )

    // Log de uso (para auditoria)
    console.log(`OpenAI API usada por ${user.email} - tipo: ${tipo || 'texto'}`)
    
    return NextResponse.json({
      ...resultado,
      rateLimitRestante: rateLimit.restante
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimit.restante.toString()
      }
    })

  } catch (error: any) {
    console.error('Erro na API OpenAI:', error)
    return NextResponse.json(
      { error: 'Erro interno no servidor' },
      { status: 500 }
    )
  }
}

// Informações sobre limites da API
export async function GET() {
  return NextResponse.json({
    limites: {
      maxInputLength: MAX_INPUT_LENGTH,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      rateLimitMax: RATE_LIMIT_MAX,
      rateLimitWindowSeconds: RATE_LIMIT_WINDOW / 1000
    },
    mensagem: 'API protegida. Requer autenticação.'
  })
}
