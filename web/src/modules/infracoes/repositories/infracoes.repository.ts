// Repository Infrações
import { SupabaseClient } from '@supabase/supabase-js'
import type { Infracao, InfracaoFilters, InfracaoFormData } from '../types'

export class InfracoesRepository {
  constructor(private supabase: SupabaseClient) {}

  async findInfracoes(filters?: InfracaoFilters): Promise<Infracao[]> {
    let query = this.supabase.from('infracoes')
      .select(`*, associados:associado_id (nome)`)
      .order('data_ocorrencia', { ascending: false })

    if (filters?.associado_id) query = query.eq('associado_id', filters.associado_id)
    if (filters?.gravidade) query = query.eq('gravidade', filters.gravidade)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.data_inicio) query = query.gte('data_ocorrencia', filters.data_inicio)
    if (filters?.data_fim) query = query.lte('data_ocorrencia', filters.data_fim)

    const { data, error } = await query
    if (error) throw error
    return (data || []).map(i => ({ ...i, associado_nome: i.associados?.nome }))
  }

  async findInfracaoById(id: string): Promise<Infracao | null> {
    const { data, error } = await this.supabase.from('infracoes')
      .select(`*, associados:associado_id (nome)`)
      .eq('id', id).single()

    if (error && error.code !== 'PGRST116') throw error
    return data ? { ...data, associado_nome: data.associados?.nome } : null
  }

  async createInfracao(data: InfracaoFormData & { registrado_por?: string }): Promise<Infracao> {
    const { data: created, error } = await this.supabase.from('infracoes')
      .insert({ ...data, status: 'registrada' }).select().single()

    if (error) throw error
    return created
  }

  async updateInfracao(id: string, data: Partial<Infracao>): Promise<Infracao> {
    const { data: updated, error } = await this.supabase.from('infracoes')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) throw error
    return updated
  }

  async deleteInfracao(id: string): Promise<void> {
    const { error } = await this.supabase.from('infracoes').delete().eq('id', id)
    if (error) throw error
  }

  async getStats(): Promise<{ total: number; pendentes: number; este_mes: number }> {
    const mesAtual = new Date().toISOString().slice(0, 7)
    const [total, pendentes, esteMes] = await Promise.all([
      this.supabase.from('infracoes').select('*', { count: 'exact', head: true }),
      this.supabase.from('infracoes').select('*', { count: 'exact', head: true }).in('status', ['registrada', 'em_analise']),
      this.supabase.from('infracoes').select('*', { count: 'exact', head: true }).gte('data_ocorrencia', `${mesAtual}-01`)
    ])
    return { total: total.count || 0, pendentes: pendentes.count || 0, este_mes: esteMes.count || 0 }
  }
}

export const createInfracoesRepository = (supabase: SupabaseClient) => new InfracoesRepository(supabase)
