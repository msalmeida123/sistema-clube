import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Buscar configuração do WaSender
    const { data: config } = await supabase
      .from('config_wasender')
      .select('api_key, device_id')
      .single()

    if (!config?.api_key) {
      return NextResponse.json({ error: 'API Key do WaSender não configurada' }, { status: 400 })
    }

    // Buscar contatos via WaSender API
    const response = await fetch(`https://api.wasenderapi.com/api/contacts?deviceId=${config.device_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.api_key}`
      }
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Erro WaSender:', result)
      return NextResponse.json({ 
        error: result.message || 'Erro ao buscar contatos' 
      }, { status: response.status })
    }

    return NextResponse.json({ success: true, contacts: result.data || result.contacts || result })

  } catch (error: any) {
    console.error('Erro ao buscar contatos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST para importar contatos para o banco
export async function POST(request: Request) {
  try {
    const { contacts } = await request.json()
    
    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({ error: 'Lista de contatos inválida' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    let importados = 0
    let existentes = 0

    for (const contato of contacts) {
      const telefone = contato.number || contato.phone || contato.id?.replace('@c.us', '')
      if (!telefone) continue

      const telefoneFormatado = telefone.replace(/\D/g, '')
      
      // Verificar se já existe
      const { data: existente } = await supabase
        .from('conversas_whatsapp')
        .select('id')
        .eq('telefone', telefoneFormatado)
        .single()

      if (existente) {
        existentes++
        continue
      }

      // Criar conversa
      const { error } = await supabase
        .from('conversas_whatsapp')
        .insert({
          telefone: telefoneFormatado,
          nome_contato: contato.name || contato.pushName || contato.notify || null,
          status: 'aberta',
          nao_lidas: 0
        })

      if (!error) importados++
    }

    return NextResponse.json({ 
      success: true, 
      importados, 
      existentes,
      total: contacts.length 
    })

  } catch (error: any) {
    console.error('Erro ao importar contatos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
