// =====================================================
// WhatsApp Provider Factory
// Cria instâncias de providers baseado na configuração
// =====================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { WhatsAppProvider, ProviderConfig, ProviderType } from './provider'
import { WaSenderProvider } from './wasender-provider'
import { MetaCloudProvider } from './meta-provider'

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Cria um provider a partir da config do banco
 */
export function createProvider(config: ProviderConfig): WhatsAppProvider {
  switch (config.tipo) {
    case 'wasender':
      return new WaSenderProvider(config)
    case 'meta':
      return new MetaCloudProvider(config)
    default:
      throw new Error(`Provider type "${config.tipo}" não suportado`)
  }
}

/**
 * Busca o provider padrão (is_default = true)
 */
export async function getDefaultProvider(): Promise<WhatsAppProvider | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  console.log('[factory] getDefaultProvider chamado', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!serviceKey,
    urlPrefix: supabaseUrl?.substring(0, 30)
  })

  const { data, error } = await getSupabase()
    .from('whatsapp_providers')
    .select('*')
    .eq('ativo', true)
    .eq('is_default', true)
    .single()

  console.log('[factory] Query default provider:', { data: data?.id, error: error?.message })

  if (!data) {
    // Fallback: buscar qualquer provider ativo
    const { data: fallback, error: fallbackError } = await getSupabase()
      .from('whatsapp_providers')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    console.log('[factory] Query fallback provider:', { data: fallback?.id, error: fallbackError?.message })

    if (!fallback) return null
    return createProvider(fallback as ProviderConfig)
  }

  return createProvider(data as ProviderConfig)
}

/**
 * Busca provider por ID
 */
export async function getProviderById(id: string): Promise<WhatsAppProvider | null> {
  const { data } = await getSupabase()
    .from('whatsapp_providers')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) return null
  return createProvider(data as ProviderConfig)
}

/**
 * Busca o provider associado a uma conversa
 * Se a conversa não tem provider, retorna o default
 */
export async function getProviderForConversation(conversaId: string): Promise<WhatsAppProvider | null> {
  const { data: conversa } = await getSupabase()
    .from('conversas_whatsapp')
    .select('provider_id')
    .eq('id', conversaId)
    .single()

  if (conversa?.provider_id) {
    const provider = await getProviderById(conversa.provider_id)
    if (provider) return provider
  }

  return getDefaultProvider()
}

/**
 * Busca provider por tipo
 */
export async function getProviderByType(tipo: ProviderType): Promise<WhatsAppProvider | null> {
  const { data } = await getSupabase()
    .from('whatsapp_providers')
    .select('*')
    .eq('tipo', tipo)
    .eq('ativo', true)
    .order('is_default', { ascending: false })
    .limit(1)
    .single()

  if (!data) return null
  return createProvider(data as ProviderConfig)
}

/**
 * Lista todos os providers ativos
 */
export async function listProviders(): Promise<ProviderConfig[]> {
  const { data } = await getSupabase()
    .from('whatsapp_providers')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  return (data || []) as ProviderConfig[]
}

/**
 * Busca provider pelo verify_token do webhook (para Meta)
 */
export async function getProviderByVerifyToken(token: string): Promise<WhatsAppProvider | null> {
  const { data } = await getSupabase()
    .from('whatsapp_providers')
    .select('*')
    .eq('tipo', 'meta')
    .eq('meta_verify_token', token)
    .eq('ativo', true)
    .single()

  if (!data) return null
  return createProvider(data as ProviderConfig)
}

/**
 * Busca provider Meta pelo phone_number_id (usado no webhook)
 */
export async function getMetaProviderByPhoneNumberId(phoneNumberId: string): Promise<WhatsAppProvider | null> {
  const { data } = await getSupabase()
    .from('whatsapp_providers')
    .select('*')
    .eq('tipo', 'meta')
    .eq('meta_phone_number_id', phoneNumberId)
    .eq('ativo', true)
    .single()

  if (!data) return null
  return createProvider(data as ProviderConfig)
}

/**
 * Função helper para enviar mensagem via provider da conversa
 * Usado pelo webhook, respostas automáticas e bot IA
 */
export async function sendMessageViaProvider(
  conversaId: string,
  telefone: string,
  mensagem: string,
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text',
  mediaUrl?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const provider = await getProviderForConversation(conversaId)
  
  if (!provider) {
    return { success: false, error: 'Nenhum provider configurado' }
  }

  return provider.sendMessage({
    to: telefone,
    text: mensagem,
    messageType,
    mediaUrl
  })
}
