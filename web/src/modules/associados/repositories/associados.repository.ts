// Repository - Responsável APENAS por acesso a dados
import { SupabaseClient } from '@supabase/supabase-js'
import type { Associado, AssociadoFilters, AssociadoFormData } from '../types'

export class AssociadosRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(filters?: AssociadoFilters): Promise<Associado[]> {
    let query = this.supabase
      .from('associados')
      .select('*')
      .order('nome')

    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%`)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.plano) {
      query = query.eq('plano', filters.plano)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async findById(id: string): Promise<Associado | null> {
    const { data, error } = await this.supabase
      .from('associados')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async findByCpf(cpf: string): Promise<Associado | null> {
    const { data, error } = await this.supabase
      .from('associados')
      .select('*')
      .eq('cpf', cpf)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async create(data: AssociadoFormData): Promise<Associado> {
    const { data: created, error } = await this.supabase
      .from('associados')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return created
  }

  async update(id: string, data: Partial<AssociadoFormData>): Promise<Associado> {
    const { data: updated, error } = await this.supabase
      .from('associados')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('associados')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async count(status?: Associado['status']): Promise<number> {
    let query = this.supabase
      .from('associados')
      .select('*', { count: 'exact', head: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query

    if (error) throw error
    return count || 0
  }

  async getStats(): Promise<{ total: number; ativos: number; inativos: number }> {
    const [total, ativos, inativos] = await Promise.all([
      this.count(),
      this.count('ativo'),
      this.count('inativo')
    ])

    return { total, ativos, inativos }
  }
}

// Factory function para criar instância
export const createAssociadosRepository = (supabase: SupabaseClient) => {
  return new AssociadosRepository(supabase)
}
