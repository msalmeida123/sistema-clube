import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// POST - Transferir conversa para outro setor
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { conversa_id, setor_id, motivo } = body

    if (!conversa_id || !setor_id) {
      return NextResponse.json(
        { error: 'conversa_id e setor_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar o setor atual da conversa
    const { data: conversa, error: erroConversa } = await supabase
      .from('conversas_whatsapp')
      .select('id, setor_id, telefone, nome_contato')
      .eq('id', conversa_id)
      .single()

    if (erroConversa || !conversa) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
    }

    // Verificar se o setor destino existe
    const { data: setorDestino, error: erroSetor } = await supabase
      .from('setores_whatsapp')
      .select('id, nome')
      .eq('id', setor_id)
      .single()

    if (erroSetor || !setorDestino) {
      return NextResponse.json({ error: 'Setor não encontrado' }, { status: 404 })
    }

    // Obter usuário logado
    const { data: { user } } = await supabase.auth.getUser()

    // Registrar a transferência no histórico
    const { error: erroHistorico } = await supabase
      .from('transferencias_whatsapp')
      .insert({
        conversa_id,
        setor_origem_id: conversa.setor_id || null,
        setor_destino_id: setor_id,
        usuario_id: user?.id || null,
        motivo: motivo || null
      })

    if (erroHistorico) {
      console.error('Erro ao registrar transferência:', erroHistorico)
    }

    // Atualizar o setor da conversa
    const { error: erroUpdate } = await supabase
      .from('conversas_whatsapp')
      .update({ setor_id })
      .eq('id', conversa_id)

    if (erroUpdate) {
      return NextResponse.json({ error: erroUpdate.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Conversa transferida para ${setorDestino.nome}`,
      setor: setorDestino
    })
  } catch (error) {
    console.error('Erro ao transferir conversa:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// GET - Buscar histórico de transferências de uma conversa
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const conversa_id = searchParams.get('conversa_id')

    if (!conversa_id) {
      return NextResponse.json({ error: 'conversa_id é obrigatório' }, { status: 400 })
    }

    const { data: transferencias, error } = await supabase
      .from('transferencias_whatsapp')
      .select(`
        id,
        motivo,
        created_at,
        setor_origem:setor_origem_id(id, nome, cor),
        setor_destino:setor_destino_id(id, nome, cor)
      `)
      .eq('conversa_id', conversa_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, transferencias })
  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
