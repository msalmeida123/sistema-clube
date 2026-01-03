// Repository de Acesso
import { SupabaseClient } from '@supabase/supabase-js'
import type { Acesso, AcessoFilters, AcessoFormData } from '../types'

export class AcessosRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(filters?: AcessoFilters): Promise<Acesso[]> {
    let query = this.supabase
      .from('acessos')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.ilike('nome', `%${filters.search}%`)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async findById(id: string): Promise<Acesso | null> {
    const { data, error } = await this.supabase
      .from('acessos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async create(data: AcessoFormData): Promise<Acesso> {
    const { data: created, error } = await this.supabase
      .from('acessos')
      .insert({ ...data, status: data.status || 'ativo' })
      .select()
      .single()

    if (error) throw error
    return created
  }

  async update(id: string, data: Partial<AcessoFormData>): Promise<Acesso> {
    const { data: updated, error } = await this.supabase
      .from('acessos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('acessos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('acessos')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  }
}

export const createAcessosRepository = (supabase: SupabaseClient) => {
  return new AcessosRepository(supabase)
}
