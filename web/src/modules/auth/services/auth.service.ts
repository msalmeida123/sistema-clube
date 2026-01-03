// Service Auth - Responsável APENAS por lógica de negócio
import type { Usuario, LoginData, RegistroData, Permissao, TODAS_PERMISSOES } from '../types'
import { AuthRepository } from '../repositories/auth.repository'

export class AuthService {
  constructor(private repository: AuthRepository) {}

  // ===== AUTENTICAÇÃO =====

  async login(data: LoginData): Promise<Usuario> {
    // Validar dados
    if (!data.email?.trim()) {
      throw new Error('Email é obrigatório')
    }

    if (!data.senha?.trim()) {
      throw new Error('Senha é obrigatória')
    }

    // Fazer login
    const authData = await this.repository.signIn(data.email, data.senha)

    if (!authData.user) {
      throw new Error('Falha no login')
    }

    // Buscar dados do usuário
    const usuario = await this.repository.findUsuarioByAuthId(authData.user.id)

    if (!usuario) {
      throw new Error('Usuário não encontrado no sistema')
    }

    if (!usuario.ativo) {
      throw new Error('Usuário desativado')
    }

    return usuario
  }

  async registrar(data: RegistroData): Promise<Usuario> {
    // Validar dados
    if (!data.nome?.trim()) {
      throw new Error('Nome é obrigatório')
    }

    if (!data.email?.trim()) {
      throw new Error('Email é obrigatório')
    }

    if (!this.isValidEmail(data.email)) {
      throw new Error('Email inválido')
    }

    if (!data.senha || data.senha.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres')
    }

    // Verificar se email já existe
    const existente = await this.repository.findUsuarioByEmail(data.email)
    if (existente) {
      throw new Error('Email já cadastrado')
    }

    // Criar usuário no auth
    const authData = await this.repository.signUp(data.email, data.senha)

    if (!authData.user) {
      throw new Error('Falha ao criar usuário')
    }

    // Criar registro na tabela usuarios
    const usuario = await this.repository.createUsuario({
      auth_id: authData.user.id,
      nome: data.nome,
      email: data.email,
      permissoes: data.permissoes || ['dashboard']
    })

    return usuario
  }

  async logout(): Promise<void> {
    await this.repository.signOut()
  }

  async recuperarSenha(email: string): Promise<void> {
    if (!email?.trim()) {
      throw new Error('Email é obrigatório')
    }

    if (!this.isValidEmail(email)) {
      throw new Error('Email inválido')
    }

    await this.repository.resetPassword(email)
  }

  async alterarSenha(novaSenha: string): Promise<void> {
    if (!novaSenha || novaSenha.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres')
    }

    await this.repository.updatePassword(novaSenha)
  }

  async getUsuarioAtual(): Promise<Usuario | null> {
    const session = await this.repository.getSession()

    if (!session?.user) {
      return null
    }

    return this.repository.findUsuarioByAuthId(session.user.id)
  }

  // ===== GESTÃO DE USUÁRIOS =====

  async listarUsuarios(): Promise<Usuario[]> {
    return this.repository.findAllUsuarios()
  }

  async buscarUsuario(id: string): Promise<Usuario | null> {
    const usuarios = await this.repository.findAllUsuarios()
    return usuarios.find(u => u.id === id) || null
  }

  async criarUsuario(data: RegistroData & { is_admin?: boolean }): Promise<Usuario> {
    // Similar ao registrar, mas pode definir admin
    const authData = await this.repository.signUp(data.email, data.senha)

    if (!authData.user) {
      throw new Error('Falha ao criar usuário')
    }

    return this.repository.createUsuario({
      auth_id: authData.user.id,
      nome: data.nome,
      email: data.email,
      is_admin: data.is_admin,
      permissoes: data.permissoes || ['dashboard']
    })
  }

  async atualizarUsuario(id: string, data: Partial<Usuario>): Promise<Usuario> {
    return this.repository.updateUsuario(id, data)
  }

  async desativarUsuario(id: string): Promise<Usuario> {
    return this.repository.updateUsuario(id, { ativo: false })
  }

  async ativarUsuario(id: string): Promise<Usuario> {
    return this.repository.updateUsuario(id, { ativo: true })
  }

  async excluirUsuario(id: string): Promise<void> {
    return this.repository.deleteUsuario(id)
  }

  // ===== PERMISSÕES =====

  async atualizarPermissoes(id: string, permissoes: string[]): Promise<Usuario> {
    // Validar permissões
    const permissoesValidas = [
      'dashboard', 'associados', 'dependentes', 'financeiro', 'compras',
      'portaria', 'exames', 'infracoes', 'eleicoes', 'relatorios',
      'crm', 'configuracoes', 'usuarios'
    ]

    const permissoesInvalidas = permissoes.filter(p => !permissoesValidas.includes(p))
    if (permissoesInvalidas.length > 0) {
      throw new Error(`Permissões inválidas: ${permissoesInvalidas.join(', ')}`)
    }

    // Garantir que dashboard sempre está incluído
    if (!permissoes.includes('dashboard')) {
      permissoes.unshift('dashboard')
    }

    return this.repository.updatePermissoes(id, permissoes)
  }

  temPermissao(usuario: Usuario, permissao: string): boolean {
    if (usuario.is_admin) return true
    return usuario.permissoes?.includes(permissao) || false
  }

  temAlgumaPermissao(usuario: Usuario, permissoes: string[]): boolean {
    if (usuario.is_admin) return true
    return permissoes.some(p => usuario.permissoes?.includes(p))
  }

  // ===== HELPERS =====

  private isValidEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }
}

export const createAuthService = (repository: AuthRepository) => {
  return new AuthService(repository)
}
