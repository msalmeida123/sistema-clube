// Repository Configurações
import { SupabaseClient } from '@supabase/supabase-js'
import type { ConfiguracaoClube, Plano, Quiosque, SicoobConfig, WaSenderConfig } from '../types'

export class ConfiguracoesRepository {
  constructor(private supabase: SupabaseClient) {}

  // ===== CONFIGURAÇÕES GERAIS =====

  async getConfiguracao(): Promise<ConfiguracaoClube | null> {
    const { data, error } = await this.supabase.from('configuracoes_clube').select('*').single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updateConfiguracao(data: Partial<ConfiguracaoClube>): Promise<ConfiguracaoClube> {
    const { data: updated, error } = await this.supabase.from('configuracoes_clube')
      .upsert({ ...data, updated_at: new Date().toISOString() }).select().single()

    if (error) throw error
    return updated
  }

  // ===== PLANOS =====

  async findPlanos(): Promise<Plano[]> {
    const { data, error } = await this.supabase.from('planos').select('*').order('valor_mensal')
    if (error) throw error
    return data || []
  }

  async findPlanoById(id: string): Promise<Plano | null> {
    const { data, error } = await this.supabase.from('planos').select('*').eq('id', id).single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createPlano(data: Partial<Plano>): Promise<Plano> {
    const { data: created, error } = await this.supabase.from('planos')
      .insert({ ...data, ativo: true }).select().single()

    if (error) throw error
    return created
  }

  async updatePlano(id: string, data: Partial<Plano>): Promise<Plano> {
    const { data: updated, error } = await this.supabase.from('planos')
      .update(data).eq('id', id).select().single()

    if (error) throw error
    return updated
  }

  async deletePlano(id: string): Promise<void> {
    const { error } = await this.supabase.from('planos').delete().eq('id', id)
    if (error) throw error
  }

  // ===== QUIOSQUES =====

  async findQuiosques(): Promise<Quiosque[]> {
    const { data, error } = await this.supabase.from('quiosques').select('*').order('nome')
    if (error) throw error
    return data || []
  }

  async findQuiosqueById(id: string): Promise<Quiosque | null> {
    const { data, error } = await this.supabase.from('quiosques').select('*').eq('id', id).single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createQuiosque(data: Partial<Quiosque>): Promise<Quiosque> {
    const { data: created, error } = await this.supabase.from('quiosques')
      .insert({ ...data, disponivel: true }).select().single()

    if (error) throw error
    return created
  }

  async updateQuiosque(id: string, data: Partial<Quiosque>): Promise<Quiosque> {
    const { data: updated, error } = await this.supabase.from('quiosques')
      .update(data).eq('id', id).select().single()

    if (error) throw error
    return updated
  }

  async deleteQuiosque(id: string): Promise<void> {
    const { error } = await this.supabase.from('quiosques').delete().eq('id', id)
    if (error) throw error
  }
}

export const createConfiguracoesRepository = (supabase: SupabaseClient) => new ConfiguracoesRepository(supabase)
