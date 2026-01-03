// Repository de Configuracao
import { SupabaseClient } from '@supabase/supabase-js'
import type { Configuracao, ConfiguracaoFilters, ConfiguracaoFormData } from '../types'

export class ConfiguracaosRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(filters?: ConfiguracaoFilters): Promise<Configuracao[]> {
    let query = this.supabase
      .from('configuracaos')
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

  async findById(id: string): Promise<Configuracao | null> {
    const { data, error } = await this.supabase
      .from('configuracaos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async create(data: ConfiguracaoFormData): Promise<Configuracao> {
    const { data: created, error } = await this.supabase
      .from('configuracaos')
      .insert({ ...data, status: data.status || 'ativo' })
      .select()
      .single()

    if (error) throw error
    return created
  }

  async update(id: string, data: Partial<ConfiguracaoFormData>): Promise<Configuracao> {
    const { data: updated, error } = await this.supabase
      .from('configuracaos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('configuracaos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('configuracaos')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  }
}

export const createConfiguracaosRepository = (supabase: SupabaseClient) => {
  return new ConfiguracaosRepository(supabase)
}
