import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Cliente admin para criar usuários sem fazer login
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Verificar se o usuário atual é admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: adminCheck } = await supabase
      .from('usuarios')
      .select('is_admin')
      .eq('auth_id', currentUser.id)
      .single()

    if (!adminCheck?.is_admin) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Dados do novo usuário
    const body = await request.json()
    const { nome, email, senha, telefone, setor, is_admin, perfil_acesso_id, permissoes } = body

    if (!nome || !email || !senha) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    // Criar usuário no Auth usando admin client (não faz login)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: { nome }
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
    }

    // Criar registro na tabela usuarios
    const { error: userError } = await supabase
      .from('usuarios')
      .insert({
        auth_id: authData.user.id,
        nome,
        email,
        telefone: telefone || null,
        setor: setor || null,
        is_admin: is_admin || false,
        perfil_acesso_id: perfil_acesso_id || null,
        permissoes: permissoes || ['dashboard'],
        ativo: true
      })

    if (userError) {
      // Se falhou ao criar na tabela, deletar do auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Usuário criado com sucesso!',
      user: { id: authData.user.id, email }
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
