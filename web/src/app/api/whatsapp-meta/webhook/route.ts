// =====================================================
// Meta WhatsApp Cloud API - Webhook Handler
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
// =====================================================

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { sanitizeForDatabase } from '@/lib/security'
import { getMetaProviderByPhoneNumberId } from '@/lib/whatsapp/factory'
import { MetaCloudProvider } from '@/lib/whatsapp/meta-provider'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function verificarRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 })
    return true
  }
  if (record.count >= 200) return false
  record.count++
  return true
}

function sanitizarTexto(texto: string | undefined | null): string {
  if (!texto) return ''
  return sanitizeForDatabase(texto).substring(0, 10000)
}

function sanitizarTelefone(telefone: string | undefined | null): string {
  if (!telefone) return ''
  return telefone.replace(/\D/g, '').substring(0, 15)
}

async function salvarLogWebhook(payload: unknown, tipo: string) {
  try {
    const payloadStr = JSON.stringify(payload)
    await getSupabase()
      .from('webhook_logs')
      .insert({
        tipo: sanitizeForDatabase(tipo),
        payload: sanitizeForDatabase(payloadStr).substring(0, 50000),
        created_at: new Date().toISOString()
      })
  } catch (e) {
    console.error('Erro ao salvar log:', e)
  }
}

// ==========================================
// EXTRAIR DADOS DA MENSAGEM META
// ==========================================

interface MetaMessageData {
  telefone: string
  mensagem: string
  messageId: string
  tipo: string
  mediaId?: string
  nomeContato: string
  phoneNumberId: string
  timestamp: string
  // Dados de referência (reply)
  referenciaMessageId?: string
  // Dados de localização
  latitude?: number
  longitude?: number
  // Dados de contato compartilhado
  contactName?: string
  contactPhone?: string
}

function extrairMensagemMeta(message: any, contact: any, phoneNumberId: string): MetaMessageData | null {
  if (!message || !contact) return null

  const telefone = sanitizarTelefone(message.from)
  const nomeContato = sanitizarTexto(contact.profile?.name || '')
  const messageId = message.id || ''
  const timestamp = message.timestamp || ''

  let tipo = 'texto'
  let mensagem = ''
  let mediaId: string | undefined

  // Referência (resposta a mensagem)
  const referenciaMessageId = message.context?.id

  switch (message.type) {
    case 'text':
      tipo = 'texto'
      mensagem = sanitizarTexto(message.text?.body)
      break

    case 'image':
      tipo = 'imagem'
      mediaId = message.image?.id
      mensagem = sanitizarTexto(message.image?.caption) || '📷 Imagem'
      break

    case 'video':
      tipo = 'video'
      mediaId = message.video?.id
      mensagem = sanitizarTexto(message.video?.caption) || '🎥 Vídeo'
      break

    case 'audio':
      tipo = 'audio'
      mediaId = message.audio?.id
      mensagem = '🎤 Áudio'
      break

    case 'document':
      tipo = 'documento'
      mediaId = message.document?.id
      mensagem = sanitizarTexto(message.document?.caption || message.document?.filename) || '📄 Documento'
      break

    case 'sticker':
      tipo = 'sticker'
      mediaId = message.sticker?.id
      mensagem = '🎨 Sticker'
      break

    case 'location':
      tipo = 'texto'
      mensagem = `📍 Localização: ${message.location?.latitude}, ${message.location?.longitude}`
      if (message.location?.name) mensagem += ` (${message.location.name})`
      break

    case 'contacts':
      tipo = 'texto'
      const shared = message.contacts?.[0]
      mensagem = `👤 Contato: ${shared?.name?.formatted_name || 'Sem nome'}`
      if (shared?.phones?.[0]?.phone) mensagem += ` - ${shared.phones[0].phone}`
      break

    case 'reaction':
      // Reações não são salvas como mensagens
      return null

    case 'interactive':
      tipo = 'texto'
      const reply = message.interactive?.button_reply || message.interactive?.list_reply
      mensagem = sanitizarTexto(reply?.title || reply?.id) || '📋 Resposta interativa'
      break

    case 'order':
      tipo = 'texto'
      const order = message.order
      const items = order?.product_items?.length || 0
      mensagem = `🛒 Pedido: ${items} item(ns)`
      break

    case 'button':
      tipo = 'texto'
      mensagem = sanitizarTexto(message.button?.text) || '🔘 Botão'
      break

    default:
      tipo = 'texto'
      mensagem = `📎 ${message.type || 'Mensagem'}`
      break
  }

  if (!telefone || !mensagem) return null

  return {
    telefone,
    mensagem,
    messageId,
    tipo,
    mediaId,
    nomeContato,
    phoneNumberId,
    timestamp,
    referenciaMessageId
  }
}

// ==========================================
// PROCESSAR STATUS DE MENSAGEM
// ==========================================

async function processarStatus(status: any) {
  const messageId = status.id
  const statusType = status.status // sent, delivered, read, failed
  
  if (!messageId) return

  let statusDb = 'enviada'
  if (statusType === 'delivered') statusDb = 'entregue'
  if (statusType === 'read') statusDb = 'lida'
  if (statusType === 'failed') statusDb = 'falhou'

  await getSupabase()
    .from('mensagens_whatsapp')
    .update({ status: statusDb })
    .eq('message_id', messageId)

  // Se falhou, salvar erro
  if (statusType === 'failed' && status.errors?.length > 0) {
    await salvarLogWebhook({
      messageId,
      errors: status.errors,
      tipo: 'meta_message_failed'
    }, 'meta_msg_falhou')
  }
}

// ==========================================
// DOWNLOAD DE MÍDIA META
// ==========================================

async function downloadMediaUrl(mediaId: string, provider: MetaCloudProvider): Promise<string | null> {
  try {
    const result = await provider.downloadMedia(mediaId)
    return result?.url || null
  } catch (error) {
    console.error('Erro download mídia Meta:', error)
    return null
  }
}

// ==========================================
// GET - Verificação do Webhook (Challenge)
// ==========================================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('📩 Meta Webhook Verification:', { mode, token: token?.substring(0, 10) + '...' })

  if (mode === 'subscribe' && token) {
    // Buscar provider com esse verify_token
    const { data: provider } = await getSupabase()
      .from('whatsapp_providers')
      .select('id, meta_verify_token')
      .eq('tipo', 'meta')
      .eq('meta_verify_token', token)
      .eq('ativo', true)
      .single()

    if (provider) {
      console.log('✅ Webhook verificado para provider:', provider.id)
      
      // Atualizar status
      await getSupabase()
        .from('whatsapp_providers')
        .update({ status: 'webhook_ativo', ultimo_check: new Date().toISOString() })
        .eq('id', provider.id)

      return new Response(challenge, { status: 200 })
    }

    console.warn('❌ Verify token não encontrado:', token)
    return NextResponse.json({ error: 'Token inválido' }, { status: 403 })
  }

  return NextResponse.json({ 
    status: 'ok', 
    message: 'Meta WhatsApp Webhook ativo',
    timestamp: new Date().toISOString()
  })
}

// ==========================================
// POST - Receber Mensagens e Status
// ==========================================

export async function POST(request: Request) {
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  try {
    if (!verificarRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit' }, { status: 429 })
    }

    const body = await request.json()

    // Log raw webhook
    await salvarLogWebhook({ _ip: ip, _raw: body }, 'meta_webhook_raw')

    // Verificar estrutura Meta
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ success: true, message: 'Ignorado (não é WhatsApp)' })
    }

    // Processar cada entry
    for (const entry of (body.entry || [])) {
      for (const change of (entry.changes || [])) {
        const value = change.value
        if (!value || change.field !== 'messages') continue

        const phoneNumberId = value.metadata?.phone_number_id
        if (!phoneNumberId) continue

        // Buscar provider correspondente
        const provider = await getMetaProviderByPhoneNumberId(phoneNumberId) as MetaCloudProvider | null

        // Processar status de mensagens
        if (value.statuses?.length > 0) {
          for (const status of value.statuses) {
            await processarStatus(status)
          }
        }

        // Processar mensagens recebidas
        if (value.messages?.length > 0) {
          for (const message of value.messages) {
            const contact = value.contacts?.find((c: any) => c.wa_id === message.from) || value.contacts?.[0]

            const dados = extrairMensagemMeta(message, contact, phoneNumberId)
            if (!dados) continue

            console.log(`📩 Meta Webhook: telefone=${dados.telefone}, tipo=${dados.tipo}, msg="${dados.mensagem?.substring(0, 50)}"`)

            // Download de mídia se necessário
            let mediaUrl: string | null = null
            if (dados.mediaId && provider) {
              mediaUrl = await downloadMediaUrl(dados.mediaId, provider)
            }

            // Buscar provider_id do banco
            let providerId: string | null = null
            if (provider) {
              providerId = provider.config.id
            }

            // Salvar mensagem usando a mesma function do banco
            const { data: resultado, error: erroProcessamento } = await getSupabase()
              .rpc('processar_mensagem_whatsapp', {
                p_telefone: dados.telefone,
                p_nome_contato: dados.nomeContato || null,
                p_conteudo: dados.mensagem,
                p_tipo: dados.tipo,
                p_direcao: 'entrada',
                p_message_id: dados.messageId || null,
                p_media_url: mediaUrl || null,
                p_setor_id: null,
                p_foto_perfil_url: null
              })

            if (erroProcessamento || !resultado || resultado.length === 0) {
              console.error('Erro ao processar mensagem Meta:', erroProcessamento)
              await salvarLogWebhook({ erro: erroProcessamento?.message, dados }, 'meta_erro_processar')
              continue
            }

            const { conversa_id: conversaId, mensagem_id: mensagemId, is_nova_conversa: isPrimeiraMsg } = resultado[0]

            // Associar provider_id à conversa se não tiver
            if (providerId) {
              await getSupabase()
                .from('conversas_whatsapp')
                .update({ provider_id: providerId })
                .eq('id', conversaId)
                .is('provider_id', null)
            }

            // Marcar como lida na Meta
            if (provider && dados.messageId) {
              (provider as MetaCloudProvider).markAsRead(dados.messageId)
                .catch(err => console.error('Erro markAsRead:', err))
            }

            console.log(`✅ Meta msg salva: conversa=${conversaId}, msg=${mensagemId}`)

            // Processar respostas automáticas e IA (reutilizar lógica existente)
            if (dados.tipo === 'texto' || dados.tipo === 'audio') {
              processarAutomacoes(conversaId, dados.telefone, dados.mensagem, isPrimeiraMsg, providerId)
                .catch(err => console.error('Erro automações:', err))
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro webhook Meta:', error)
    await salvarLogWebhook({ erro: error.message }, 'meta_erro_geral')
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ==========================================
// AUTOMAÇÕES (Respostas automáticas + IA)
// ==========================================

async function processarAutomacoes(
  conversaId: string,
  telefone: string,
  mensagem: string,
  isPrimeiraMsg: boolean,
  providerId: string | null
) {
  try {
    // Buscar regras de respostas automáticas
    const { data: regras } = await getSupabase()
      .from('respostas_automaticas')
      .select('*')
      .eq('ativo', true)
      .order('prioridade', { ascending: false })

    if (!regras || regras.length === 0) {
      // Tentar IA
      await processarIA(conversaId, telefone, mensagem, providerId)
      return
    }

    const mensagemLower = mensagem.toLowerCase().trim()
    let respondeu = false

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
        if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs))

        // Enviar via provider correto
        const { sendMessageViaProvider } = await import('@/lib/whatsapp/factory')
        const result = await sendMessageViaProvider(conversaId, telefone, regra.resposta)

        if (result.success) {
          await getSupabase().from('mensagens_whatsapp').insert({
            conversa_id: conversaId,
            direcao: 'saida',
            conteudo: regra.resposta,
            tipo: 'texto',
            status: 'enviada',
            message_id: result.messageId || null
          })

          await getSupabase()
            .from('respostas_automaticas')
            .update({ uso_count: (regra.uso_count || 0) + 1 })
            .eq('id', regra.id)

          respondeu = true
          break
        }
      }
    }

    if (!respondeu) {
      await processarIA(conversaId, telefone, mensagem, providerId)
    }
  } catch (error) {
    console.error('Erro automações Meta:', error)
  }
}

async function processarIA(conversaId: string, telefone: string, mensagem: string, providerId: string | null) {
  try {
    const { data: configIA } = await getSupabase()
      .from('config_bot_ia')
      .select('*')
      .single()

    if (!configIA?.openai_api_key || !configIA?.responder_com_ia) return

    const systemPrompt = `${configIA.instrucoes_sistema || 'Você é um assistente virtual do clube.'}

DOCUMENTO DO CLUBE:
${configIA.documento_contexto || ''}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${configIA.openai_api_key}`
      },
      body: JSON.stringify({
        model: configIA.modelo || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: mensagem.substring(0, 4000) }
        ],
        temperature: Math.min(Math.max(configIA.temperatura || 0.7, 0), 2),
        max_tokens: Math.min(configIA.max_tokens || 500, 2000)
      }),
      signal: AbortSignal.timeout(30000)
    })

    if (!response.ok) return
    const result = await response.json()
    const respostaIA = result.choices[0]?.message?.content

    if (respostaIA) {
      await new Promise(r => setTimeout(r, 2000))

      const { sendMessageViaProvider } = await import('@/lib/whatsapp/factory')
      const enviada = await sendMessageViaProvider(conversaId, telefone, respostaIA)

      if (enviada.success) {
        await getSupabase().from('mensagens_whatsapp').insert({
          conversa_id: conversaId,
          direcao: 'saida',
          conteudo: respostaIA,
          tipo: 'texto',
          status: 'enviada',
          message_id: enviada.messageId || null
        })

        await getSupabase()
          .from('conversas_whatsapp')
          .update({ ultima_mensagem: respostaIA.substring(0, 100) })
          .eq('id', conversaId)
      }
    }
  } catch (error) {
    console.error('Erro IA Meta:', error)
  }
}
