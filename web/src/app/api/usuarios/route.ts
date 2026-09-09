import {servicoAuditado} from '@/lib/supabase/servico-auditado'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { sanitizeObject, isValidEmail, validatePassword, sanitizeForDatabase } from '@/lib/security'

export async function POST(request: Request) {
  try {
    // Verificar se a service role key está configurada
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ 
        error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' 
      }, { status: 500 })
    }

    // Cliente admin para criar usuários sem fazer login
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

    const supabaseAdmin=servicoAuditado(currentUser.id)
    // Dados do novo usuário - sanitização XSS
    const rawBody = await request.json()
    
    if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
      return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
    }
    // Senhas são credenciais opacas: não remover HTML, espaços ou caracteres.
    const { senha, ...dados } = rawBody
    if (typeof senha !== 'string' || !senha) {
      return NextResponse.json({ error: 'Senha deve ser uma string não vazia' }, { status: 400 })
    }
    const body = sanitizeObject(dados)
    const { nome, email, telefone, setor, is_admin, perfil_acesso_id, permissoes } = body

    // Validações
    if (!nome || !email || !senha) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 })
    }

    // Valida email
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 })
    }

    // Valida força da senha
    const passwordValidation = validatePassword(senha)
    if (!passwordValidation.valid) {
      return NextResponse.json({ 
        error: passwordValidation.errors.join('. '),
        strength: passwordValidation.strength
      }, { status: 400 })
    }

    // Valida nome (mínimo 3 caracteres, máximo 100)
    const sanitizedNome = sanitizeForDatabase(nome)
    if (sanitizedNome.length < 3 || sanitizedNome.length > 100) {
      return NextResponse.json({ error: 'Nome deve ter entre 3 e 100 caracteres' }, { status: 400 })
    }

    // Valida permissões (deve ser array de strings)
    if (permissoes && !Array.isArray(permissoes)) {
      return NextResponse.json({ error: 'Permissões devem ser um array' }, { status: 400 })
    }

    // Criar usuário no Auth usando admin client (não faz login)
    // O Supabase Auth já faz hash da senha automaticamente usando bcrypt
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: senha,
      email_confirm: true, // Confirma email automaticamente
      user_metadata: { nome: sanitizedNome }
    })

    if (authError) {
      // Traduz erros comuns
      const errorMessages: Record<string, string> = {
        'User already registered': 'Este email já está cadastrado',
        'Password should be at least 6 characters': 'Senha deve ter pelo menos 6 caracteres',
        'Unable to validate email address': 'Email inválido'
      }
      const message = errorMessages[authError.message] || authError.message
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
    }

    // Criar registro na tabela usuarios com dados sanitizados
    const { error: userError } = await supabase
      .from('usuarios')
      .insert({
        auth_id: authData.user.id,
        nome: sanitizedNome,
        email: email.toLowerCase().trim(),
        telefone: telefone ? sanitizeForDatabase(telefone) : null,
        setor: setor ? sanitizeForDatabase(setor) : null,
        is_admin: Boolean(is_admin),
        perfil_acesso_id: perfil_acesso_id || null,
        permissoes: Array.isArray(permissoes) ? permissoes.map(p => sanitizeForDatabase(p)) : ['dashboard'],
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
      user: { id: authData.user.id, email: email.toLowerCase().trim() }
    })

  } catch (error: any) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// GET - Listar usuários (para admins)
export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
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

    const { data, error } = await supabase
      .from('usuarios')
      .select('*, perfil:perfis_acesso(nome)')
      .order('nome')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ users: data })
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
