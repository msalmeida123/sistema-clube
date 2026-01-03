// Repository de Infracao
import { SupabaseClient } from '@supabase/supabase-js'
import type { Infracao, InfracaoFilters, InfracaoFormData } from '../types'

export class InfracaosRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(filters?: InfracaoFilters): Promise<Infracao[]> {
    let query = this.supabase
      .from('infracaos')
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

  async findById(id: string): Promise<Infracao | null> {
    const { data, error } = await this.supabase
      .from('infracaos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async create(data: InfracaoFormData): Promise<Infracao> {
    const { data: created, error } = await this.supabase
      .from('infracaos')
      .insert({ ...data, status: data.status || 'ativo' })
      .select()
      .single()

    if (error) throw error
    return created
  }

  async update(id: string, data: Partial<InfracaoFormData>): Promise<Infracao> {
    const { data: updated, error } = await this.supabase
      .from('infracaos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('infracaos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('infracaos')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  }
}

export const createInfracaosRepository = (supabase: SupabaseClient) => {
  return new InfracaosRepository(supabase)
}
