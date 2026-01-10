import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET - Listar setores
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: setores, error } = await supabase
      .from('setores_whatsapp')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, setores })
  } catch (error) {
    console.error('Erro ao listar setores:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// POST - Criar novo setor
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { nome, descricao, cor, icone } = body

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const { data: setor, error } = await supabase
      .from('setores_whatsapp')
      .insert({
        nome,
        descricao: descricao || null,
        cor: cor || '#3B82F6',
        icone: icone || 'folder'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, setor })
  } catch (error) {
    console.error('Erro ao criar setor:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
