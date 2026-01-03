// Repository Financeiro - Responsável APENAS por acesso a dados
import { SupabaseClient } from '@supabase/supabase-js'
import type { Mensalidade, MensalidadeFilters, StatusPagamento, Carne } from '../types'

export class FinanceiroRepository {
  constructor(private supabase: SupabaseClient) {}

  // ===== MENSALIDADES =====

  async findMensalidades(filters?: MensalidadeFilters): Promise<Mensalidade[]> {
    let query = this.supabase
      .from('mensalidades')
      .select(`
        *,
        associados:associado_id (nome)
      `)
      .order('data_vencimento', { ascending: false })

    if (filters?.associado_id) {
      query = query.eq('associado_id', filters.associado_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.referencia) {
      query = query.eq('referencia', filters.referencia)
    }

    if (filters?.data_inicio) {
      query = query.gte('data_vencimento', filters.data_inicio)
    }

    if (filters?.data_fim) {
      query = query.lte('data_vencimento', filters.data_fim)
    }

    const { data, error } = await query

    if (error) throw error
    
    return (data || []).map(m => ({
      ...m,
      associado_nome: m.associados?.nome
    }))
  }

  async findMensalidadeById(id: string): Promise<Mensalidade | null> {
    const { data, error } = await this.supabase
      .from('mensalidades')
      .select(`*, associados:associado_id (nome)`)
      .eq('id', id)
      .single()

    if (error) throw error
    return data ? { ...data, associado_nome: data.associados?.nome } : null
  }

  async createMensalidade(data: Partial<Mensalidade>): Promise<Mensalidade> {
    const { data: created, error } = await this.supabase
      .from('mensalidades')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return created
  }

  async updateMensalidade(id: string, data: Partial<Mensalidade>): Promise<Mensalidade> {
    const { data: updated, error } = await this.supabase
      .from('mensalidades')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async deleteMensalidade(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('mensalidades')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ===== CARNÊS =====

  async findCarnes(associado_id?: string): Promise<Carne[]> {
    let query = this.supabase
      .from('carnes')
      .select(`*, associados:associado_id (nome)`)
      .order('created_at', { ascending: false })

    if (associado_id) {
      query = query.eq('associado_id', associado_id)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(c => ({
      ...c,
      associado_nome: c.associados?.nome
    }))
  }

  async createCarne(data: Partial<Carne>): Promise<Carne> {
    const { data: created, error } = await this.supabase
      .from('carnes')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return created
  }

  // ===== ESTATÍSTICAS =====

  async getStats(): Promise<{
    total_receber: number
    total_recebido: number
    total_atrasado: number
    inadimplentes: number
  }> {
    const hoje = new Date().toISOString().split('T')[0]

    // Total a receber (pendentes)
    const { data: pendentes } = await this.supabase
      .from('mensalidades')
      .select('valor')
      .eq('status', 'pendente')

    // Total recebido (pagos do mês atual)
    const mesAtual = new Date().toISOString().slice(0, 7)
    const { data: pagos } = await this.supabase
      .from('mensalidades')
      .select('valor_pago')
      .eq('status', 'pago')
      .gte('data_pagamento', `${mesAtual}-01`)

    // Total atrasado
    const { data: atrasados } = await this.supabase
      .from('mensalidades')
      .select('valor')
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje)

    // Inadimplentes (associados únicos com atraso)
    const { data: inadimplentes } = await this.supabase
      .from('mensalidades')
      .select('associado_id')
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje)

    const uniqueInadimplentes = new Set(inadimplentes?.map(i => i.associado_id) || [])

    return {
      total_receber: pendentes?.reduce((sum, m) => sum + (m.valor || 0), 0) || 0,
      total_recebido: pagos?.reduce((sum, m) => sum + (m.valor_pago || 0), 0) || 0,
      total_atrasado: atrasados?.reduce((sum, m) => sum + (m.valor || 0), 0) || 0,
      inadimplentes: uniqueInadimplentes.size
    }
  }

  async countByStatus(status: StatusPagamento): Promise<number> {
    const { count, error } = await this.supabase
      .from('mensalidades')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)

    if (error) throw error
    return count || 0
  }
}

export const createFinanceiroRepository = (supabase: SupabaseClient) => {
  return new FinanceiroRepository(supabase)
}
