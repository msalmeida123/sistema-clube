// Repository Auth - Responsável APENAS por acesso a dados
import { SupabaseClient } from '@supabase/supabase-js'
import type { Usuario, RegistroData } from '../types'

export class AuthRepository {
  constructor(private supabase: SupabaseClient) {}

  // ===== AUTENTICAÇÃO =====

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    })

    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession()
    if (error) throw error
    return data.session
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (error) throw error
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword
    })
    if (error) throw error
  }

  // ===== USUÁRIOS =====

  async findUsuarioByAuthId(authId: string): Promise<Usuario | null> {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('auth_id', authId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async findUsuarioByEmail(email: string): Promise<Usuario | null> {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async findAllUsuarios(): Promise<Usuario[]> {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .order('nome')

    if (error) throw error
    return data || []
  }

  async createUsuario(data: {
    auth_id: string
    nome: string
    email: string
    is_admin?: boolean
    permissoes?: string[]
  }): Promise<Usuario> {
    const { data: created, error } = await this.supabase
      .from('usuarios')
      .insert({
        ...data,
        is_admin: data.is_admin || false,
        permissoes: data.permissoes || ['dashboard'],
        ativo: true
      })
      .select()
      .single()

    if (error) throw error
    return created
  }

  async updateUsuario(id: string, data: Partial<Usuario>): Promise<Usuario> {
    const { data: updated, error } = await this.supabase
      .from('usuarios')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async deleteUsuario(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('usuarios')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async updatePermissoes(id: string, permissoes: string[]): Promise<Usuario> {
    return this.updateUsuario(id, { permissoes })
  }
}

export const createAuthRepository = (supabase: SupabaseClient) => {
  return new AuthRepository(supabase)
}
