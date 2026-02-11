// =====================================================
// Rota Unificada de Envio - Funciona com qualquer provider
// =====================================================

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getProviderForConversation, getDefaultProvider, getProviderById } from '@/lib/whatsapp/factory'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      to, text, messageType = 'text', mediaUrl, fileName, caption,
      conversaId, providerId,
      // Template (Meta)
      templateName, templateLanguage, templateComponents
    } = body

    if (!to) {
      return NextResponse.json({ error: 'Número é obrigatório' }, { status: 400 })
    }

    // Verificar autenticação
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Determinar provider: por ID específico, por conversa, ou default
    let provider
    if (providerId) {
      provider = await getProviderById(providerId)
    } else if (conversaId) {
      provider = await getProviderForConversation(conversaId)
    } else {
      provider = await getDefaultProvider()
    }

    if (!provider) {
      return NextResponse.json({ 
        error: 'Nenhum provider WhatsApp configurado. Vá em Configurações > WhatsApp Providers.' 
      }, { status: 400 })
    }

    // Enviar via provider
    console.log(`[whatsapp/send] Enviando via ${provider.type}:`, { to, messageType, mediaUrl: mediaUrl ? '(URL)' : undefined })
    
    const result = await provider.sendMessage({
      to,
      text,
      messageType: messageType as any,
      mediaUrl,
      fileName,
      caption,
      templateName,
      templateLanguage,
      templateComponents
    })

    if (!result.success) {
      console.error(`[whatsapp/send] Provider ${provider.type} erro:`, result.error)
      return NextResponse.json({ error: result.error || 'Erro ao enviar' }, { status: 500 })
    }

    console.log(`[whatsapp/send] Enviado OK:`, result.messageId)
    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId,
      provider: provider.type
    })
  } catch (error: any) {
    console.error('[whatsapp/send] Erro inesperado:', error)
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 })
  }
}
