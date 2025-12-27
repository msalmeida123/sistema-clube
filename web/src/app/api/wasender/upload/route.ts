import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 })
    }

    // Buscar configuração do WaSender
    const supabase = createRouteHandlerClient({ cookies })
    const { data: config } = await supabase
      .from('config_wasender')
      .select('api_key')
      .single()

    if (!config?.api_key) {
      return NextResponse.json({ error: 'API Key do WaSender não configurada' }, { status: 400 })
    }

    // Converter arquivo para base64
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')

    // Determinar o tipo de mídia
    const mimeType = file.type
    let mediaType = 'document'
    if (mimeType.startsWith('image/')) mediaType = 'image'
    else if (mimeType.startsWith('video/')) mediaType = 'video'
    else if (mimeType.startsWith('audio/')) mediaType = 'audio'

    console.log('Upload WaSender:', { fileName: file.name, mimeType, mediaType, size: file.size })

    // Upload via WaSender API
    const response = await fetch('https://api.wasenderapi.com/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`
      },
      body: JSON.stringify({
        file: base64,
        fileName: file.name,
        mimeType: mimeType
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Erro WaSender Upload:', result)
      return NextResponse.json({ 
        error: result.message || result.error || 'Erro ao fazer upload' 
      }, { status: response.status })
    }

    console.log('Upload WaSender Response:', result)

    // Retornar URL do arquivo
    const fileUrl = result.data?.url || result.url || result.data?.fileUrl || result.fileUrl
    
    return NextResponse.json({ 
      success: true, 
      url: fileUrl,
      fileName: file.name,
      mediaType: mediaType,
      mimeType: mimeType
    })

  } catch (error: any) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
