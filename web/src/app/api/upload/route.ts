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

    const supabase = createRouteHandlerClient({ cookies })

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const fileName = `${timestamp}-${Math.random().toString(36).substr(2, 9)}.${ext}`
    const filePath = `whatsapp-media/${fileName}`

    // Converter File para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Erro no upload:', error)
      return NextResponse.json({ error: 'Erro ao fazer upload: ' + error.message }, { status: 500 })
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    })

  } catch (error: any) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
