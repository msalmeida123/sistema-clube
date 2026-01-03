// Repository Exames Médicos
import { SupabaseClient } from '@supabase/supabase-js'
import type { ExameMedico, ExameFilters, ExameFormData, StatusExame } from '../types'

export class ExamesRepository {
  constructor(private supabase: SupabaseClient) {}

  async findExames(filters?: ExameFilters): Promise<ExameMedico[]> {
    let query = this.supabase.from('exames_medicos').select('*').order('data_validade', { ascending: true })

    if (filters?.tipo_pessoa) query = query.eq('tipo_pessoa', filters.tipo_pessoa)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.pessoa_id) query = query.eq('pessoa_id', filters.pessoa_id)
    
    if (filters?.vencidos) {
      const hoje = new Date().toISOString().split('T')[0]
      query = query.lt('data_validade', hoje)
    }

    if (filters?.a_vencer) {
      const hoje = new Date()
      const limite = new Date(hoje.getTime() + filters.a_vencer * 24 * 60 * 60 * 1000)
      query = query.gte('data_validade', hoje.toISOString().split('T')[0])
        .lte('data_validade', limite.toISOString().split('T')[0])
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async findExameById(id: string): Promise<ExameMedico | null> {
    const { data, error } = await this.supabase.from('exames_medicos').select('*').eq('id', id).single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createExame(data: ExameFormData): Promise<ExameMedico> {
    const { data: created, error } = await this.supabase
      .from('exames_medicos')
      .insert({ ...data, status: 'pendente' })
      .select().single()

    if (error) throw error
    return created
  }

  async updateExame(id: string, data: Partial<ExameMedico>): Promise<ExameMedico> {
    const { data: updated, error } = await this.supabase
      .from('exames_medicos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) throw error
    return updated
  }

  async deleteExame(id: string): Promise<void> {
    const { error } = await this.supabase.from('exames_medicos').delete().eq('id', id)
    if (error) throw error
  }

  async getStats(): Promise<{ total: number; aprovados: number; vencidos: number; a_vencer_30dias: number }> {
    const hoje = new Date().toISOString().split('T')[0]
    const em30dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [total, aprovados, vencidos, aVencer] = await Promise.all([
      this.supabase.from('exames_medicos').select('*', { count: 'exact', head: true }),
      this.supabase.from('exames_medicos').select('*', { count: 'exact', head: true }).eq('status', 'aprovado'),
      this.supabase.from('exames_medicos').select('*', { count: 'exact', head: true }).lt('data_validade', hoje),
      this.supabase.from('exames_medicos').select('*', { count: 'exact', head: true })
        .gte('data_validade', hoje).lte('data_validade', em30dias)
    ])

    return {
      total: total.count || 0,
      aprovados: aprovados.count || 0,
      vencidos: vencidos.count || 0,
      a_vencer_30dias: aVencer.count || 0
    }
  }
}

export const createExamesRepository = (supabase: SupabaseClient) => new ExamesRepository(supabase)
