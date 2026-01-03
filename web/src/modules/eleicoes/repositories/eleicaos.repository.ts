// Repository de Eleicao
import { SupabaseClient } from '@supabase/supabase-js'
import type { Eleicao, EleicaoFilters, EleicaoFormData } from '../types'

export class EleicaosRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(filters?: EleicaoFilters): Promise<Eleicao[]> {
    let query = this.supabase
      .from('eleicaos')
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

  async findById(id: string): Promise<Eleicao | null> {
    const { data, error } = await this.supabase
      .from('eleicaos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async create(data: EleicaoFormData): Promise<Eleicao> {
    const { data: created, error } = await this.supabase
      .from('eleicaos')
      .insert({ ...data, status: data.status || 'ativo' })
      .select()
      .single()

    if (error) throw error
    return created
  }

  async update(id: string, data: Partial<EleicaoFormData>): Promise<Eleicao> {
    const { data: updated, error } = await this.supabase
      .from('eleicaos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('eleicaos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('eleicaos')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  }
}

export const createEleicaosRepository = (supabase: SupabaseClient) => {
  return new EleicaosRepository(supabase)
}
