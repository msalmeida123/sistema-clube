import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: userData } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 })
    }

    // Parâmetros opcionais
    const body = await request.json().catch(() => ({}))
    const dias = body.dias_sem_contato || 30

    // Executar função de arquivamento
    const { data, error } = await supabase.rpc('arquivar_conversas_inativas', {
      dias_sem_contato: dias,
      arquivar_sem_atividade: true
    })

    if (error) {
      console.error('Erro ao arquivar conversas:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      resultado: data
    })
  } catch (error) {
    console.error('Erro na API de arquivamento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
