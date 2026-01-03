// Repository Eleições
import { SupabaseClient } from '@supabase/supabase-js'
import type { Eleicao, EleicaoFilters, EleicaoFormData, Candidato, Voto } from '../types'

export class EleicoesRepository {
  constructor(private supabase: SupabaseClient) {}

  async findEleicoes(filters?: EleicaoFilters): Promise<Eleicao[]> {
    let query = this.supabase.from('eleicoes').select('*').order('data_inicio', { ascending: false })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.ano) {
      query = query.gte('data_inicio', `${filters.ano}-01-01`).lte('data_inicio', `${filters.ano}-12-31`)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async findEleicaoById(id: string): Promise<Eleicao | null> {
    const { data, error } = await this.supabase
      .from('eleicoes')
      .select(`*, candidatos_eleicao (*)`)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data ? { ...data, candidatos: data.candidatos_eleicao } : null
  }

  async createEleicao(data: EleicaoFormData): Promise<Eleicao> {
    const { data: created, error } = await this.supabase
      .from('eleicoes')
      .insert({ ...data, status: 'agendada', votos_brancos: 0, total_votos: 0 })
      .select().single()

    if (error) throw error
    return created
  }

  async updateEleicao(id: string, data: Partial<Eleicao>): Promise<Eleicao> {
    const { data: updated, error } = await this.supabase
      .from('eleicoes').update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()

    if (error) throw error
    return updated
  }

  async findCandidatos(eleicao_id: string): Promise<Candidato[]> {
    const { data, error } = await this.supabase
      .from('candidatos_eleicao').select('*').eq('eleicao_id', eleicao_id).order('numero')

    if (error) throw error
    return data || []
  }

  async createCandidato(data: Partial<Candidato>): Promise<Candidato> {
    const { data: created, error } = await this.supabase
      .from('candidatos_eleicao').insert({ ...data, votos: 0 }).select().single()

    if (error) throw error
    return created
  }

  async registrarVoto(eleicao_id: string, associado_id: string, candidato_id?: string): Promise<Voto> {
    const { data: voto, error } = await this.supabase
      .from('votos_eleicao')
      .insert({ eleicao_id, associado_id, candidato_id, data_voto: new Date().toISOString() })
      .select().single()

    if (error) throw error

    // Incrementar contadores
    if (candidato_id) {
      await this.supabase.rpc('incrementar_voto_candidato', { candidato_id })
    } else {
      await this.supabase.rpc('incrementar_voto_branco', { eleicao_id })
    }

    return voto
  }

  async verificarVotou(eleicao_id: string, associado_id: string): Promise<boolean> {
    const { count } = await this.supabase
      .from('votos_eleicao')
      .select('*', { count: 'exact', head: true })
      .eq('eleicao_id', eleicao_id)
      .eq('associado_id', associado_id)

    return (count || 0) > 0
  }
}

export const createEleicoesRepository = (supabase: SupabaseClient) => new EleicoesRepository(supabase)
