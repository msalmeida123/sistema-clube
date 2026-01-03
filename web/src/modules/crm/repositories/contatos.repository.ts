// Repository de Contato
import { SupabaseClient } from '@supabase/supabase-js'
import type { Contato, ContatoFilters, ContatoFormData } from '../types'

export class ContatosRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(filters?: ContatoFilters): Promise<Contato[]> {
    let query = this.supabase
      .from('contatos')
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

  async findById(id: string): Promise<Contato | null> {
    const { data, error } = await this.supabase
      .from('contatos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async create(data: ContatoFormData): Promise<Contato> {
    const { data: created, error } = await this.supabase
      .from('contatos')
      .insert({ ...data, status: data.status || 'ativo' })
      .select()
      .single()

    if (error) throw error
    return created
  }

  async update(id: string, data: Partial<ContatoFormData>): Promise<Contato> {
    const { data: updated, error } = await this.supabase
      .from('contatos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('contatos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('contatos')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  }
}

export const createContatosRepository = (supabase: SupabaseClient) => {
  return new ContatosRepository(supabase)
}
