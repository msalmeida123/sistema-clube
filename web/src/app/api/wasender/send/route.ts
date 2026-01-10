import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to, text, messageType, mediaUrl, fileName, caption } = body

    if (!to) {
      return NextResponse.json({ error: 'Número é obrigatório' }, { status: 400 })
    }

    // Buscar configuração do WaSender
    const supabase = createRouteHandlerClient({ cookies })
    const { data: config } = await supabase
      .from('config_wasender')
      .select('api_key, device_id')
      .single()

    if (!config?.api_key) {
      return NextResponse.json({ error: 'API Key do WaSender não configurada' }, { status: 400 })
    }

    // Montar payload baseado no tipo de mensagem
    let payload: any = { to }

    switch (messageType) {
      case 'image':
        if (!mediaUrl) {
          return NextResponse.json({ error: 'URL da imagem é obrigatória' }, { status: 400 })
        }
        payload.imageUrl = mediaUrl
        if (caption) payload.caption = caption
        break

      case 'video':
        if (!mediaUrl) {
          return NextResponse.json({ error: 'URL do vídeo é obrigatória' }, { status: 400 })
        }
        payload.videoUrl = mediaUrl
        if (caption) payload.caption = caption
        break

      case 'audio':
        if (!mediaUrl) {
          return NextResponse.json({ error: 'URL do áudio é obrigatória' }, { status: 400 })
        }
        payload.audioUrl = mediaUrl
        break

      case 'document':
        if (!mediaUrl) {
          return NextResponse.json({ error: 'URL do documento é obrigatória' }, { status: 400 })
        }
        payload.documentUrl = mediaUrl
        if (fileName) payload.fileName = fileName
        break

      case 'text':
      default:
        if (!text) {
          return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
        }
        payload.text = text
        break
    }

    console.log('Enviando mensagem WaSender:', { to, messageType, payload })

    // Enviar mensagem via WaSender API
    const response = await fetch('https://www.wasenderapi.com/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Erro WaSender:', result)
      return NextResponse.json({ 
        error: result.message || result.error || 'Erro ao enviar mensagem' 
      }, { status: response.status })
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
