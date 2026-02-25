// Repository - Responsável APENAS por acesso a dados do RH
import { SupabaseClient } from '@supabase/supabase-js'
import type {
  Funcionario, FuncionarioFilters, FuncionarioFormData,
  PontoDiario, PontoFilters,
  FolhaPagamento, FolhaFilters, FolhaFormData,
  Afastamento, AfastamentoFilters, AfastamentoFormData,
  StatusFuncionario
} from '../types'

export class RHRepository {
  constructor(private supabase: SupabaseClient) {}

  // ==================== FUNCIONÁRIOS ====================

  async findAllFuncionarios(filters?: FuncionarioFilters): Promise<Funcionario[]> {
    let query = this.supabase
      .from('funcionarios')
      .select('*')
      .order('nome')

    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,cpf.ilike.%${filters.search}%,cargo.ilike.%${filters.search}%`)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.departamento) {
      query = query.eq('departamento', filters.departamento)
    }

    if (filters?.tipo_contrato) {
      query = query.eq('tipo_contrato', filters.tipo_contrato)
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

  async findFuncionarioById(id: string): Promise<Funcionario | null> {
    const { data, error } = await this.supabase
      .from('funcionarios')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async findFuncionarioByCpf(cpf: string): Promise<Funcionario | null> {
    const { data, error } = await this.supabase
      .from('funcionarios')
      .select('*')
      .eq('cpf', cpf)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createFuncionario(data: FuncionarioFormData): Promise<Funcionario> {
    const { data: created, error } = await this.supabase
      .from('funcionarios')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return created
  }

  async updateFuncionario(id: string, data: Partial<FuncionarioFormData>): Promise<Funcionario> {
    const { data: updated, error } = await this.supabase
      .from('funcionarios')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async deleteFuncionario(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('funcionarios')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async countFuncionarios(status?: StatusFuncionario): Promise<number> {
    let query = this.supabase
      .from('funcionarios')
      .select('*', { count: 'exact', head: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query
    if (error) throw error
    return count || 0
  }

  // ==================== CONTROLE DE PONTO ====================

  async findAllPontos(filters?: PontoFilters): Promise<PontoDiario[]> {
    let query = this.supabase
      .from('ponto_diario')
      .select('*, funcionario:funcionarios(nome, cargo, departamento)')
      .order('data', { ascending: false })

    if (filters?.funcionario_id) {
      query = query.eq('funcionario_id', filters.funcionario_id)
    }

    if (filters?.data_inicio) {
      query = query.gte('data', filters.data_inicio)
    }

    if (filters?.data_fim) {
      query = query.lte('data', filters.data_fim)
    }

    if (filters?.falta !== undefined) {
      query = query.eq('falta', filters.falta)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async findPontoByFuncionarioData(funcionario_id: string, data: string): Promise<PontoDiario | null> {
    const { data: ponto, error } = await this.supabase
      .from('ponto_diario')
      .select('*, funcionario:funcionarios(nome, cargo, departamento)')
      .eq('funcionario_id', funcionario_id)
      .eq('data', data)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return ponto
  }

  async upsertPonto(ponto: Partial<PontoDiario> & { funcionario_id: string; data: string }): Promise<PontoDiario> {
    const { data, error } = await this.supabase
      .from('ponto_diario')
      .upsert(
        { ...ponto, updated_at: new Date().toISOString() },
        { onConflict: 'funcionario_id,data' }
      )
      .select('*, funcionario:funcionarios(nome, cargo, departamento)')
      .single()

    if (error) throw error
    return data
  }

  async createPonto(ponto: Partial<PontoDiario>): Promise<PontoDiario> {
    const { data, error } = await this.supabase
      .from('ponto_diario')
      .insert(ponto)
      .select('*, funcionario:funcionarios(nome, cargo, departamento)')
      .single()

    if (error) throw error
    return data
  }

  async updatePonto(id: string, ponto: Partial<PontoDiario>): Promise<PontoDiario> {
    const { data, error } = await this.supabase
      .from('ponto_diario')
      .update({ ...ponto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, funcionario:funcionarios(nome, cargo, departamento)')
      .single()

    if (error) throw error
    return data
  }

  // ==================== FOLHA DE PAGAMENTO ====================

  async findAllFolhas(filters?: FolhaFilters): Promise<FolhaPagamento[]> {
    let query = this.supabase
      .from('folha_pagamento')
      .select('*, funcionario:funcionarios(nome, cargo, departamento, banco, agencia, conta, chave_pix)')
      .order('referencia', { ascending: false })

    if (filters?.funcionario_id) {
      query = query.eq('funcionario_id', filters.funcionario_id)
    }

    if (filters?.referencia) {
      query = query.eq('referencia', filters.referencia)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async findFolhaById(id: string): Promise<FolhaPagamento | null> {
    const { data, error } = await this.supabase
      .from('folha_pagamento')
      .select('*, funcionario:funcionarios(nome, cargo, departamento, banco, agencia, conta, chave_pix)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createFolha(data: FolhaFormData & { total_proventos: number; total_descontos: number; salario_liquido: number }): Promise<FolhaPagamento> {
    const { data: created, error } = await this.supabase
      .from('folha_pagamento')
      .insert({ ...data, status: 'rascunho' })
      .select('*, funcionario:funcionarios(nome, cargo, departamento, banco, agencia, conta, chave_pix)')
      .single()

    if (error) throw error
    return created
  }

  async updateFolha(id: string, data: Partial<FolhaPagamento>): Promise<FolhaPagamento> {
    const { data: updated, error } = await this.supabase
      .from('folha_pagamento')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, funcionario:funcionarios(nome, cargo, departamento, banco, agencia, conta, chave_pix)')
      .single()

    if (error) throw error
    return updated
  }

  async deleteFolha(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('folha_pagamento')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==================== FÉRIAS E AFASTAMENTOS ====================

  async findAllAfastamentos(filters?: AfastamentoFilters): Promise<Afastamento[]> {
    let query = this.supabase
      .from('afastamentos')
      .select('*, funcionario:funcionarios(nome, cargo, departamento)')
      .order('data_inicio', { ascending: false })

    if (filters?.funcionario_id) {
      query = query.eq('funcionario_id', filters.funcionario_id)
    }

    if (filters?.tipo) {
      query = query.eq('tipo', filters.tipo)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.data_inicio) {
      query = query.gte('data_inicio', filters.data_inicio)
    }

    if (filters?.data_fim) {
      query = query.lte('data_fim', filters.data_fim)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async findAfastamentoById(id: string): Promise<Afastamento | null> {
    const { data, error } = await this.supabase
      .from('afastamentos')
      .select('*, funcionario:funcionarios(nome, cargo, departamento)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createAfastamento(data: AfastamentoFormData & { dias_totais: number }): Promise<Afastamento> {
    const { data: created, error } = await this.supabase
      .from('afastamentos')
      .insert({ ...data, status: 'solicitado' })
      .select('*, funcionario:funcionarios(nome, cargo, departamento)')
      .single()

    if (error) throw error
    return created
  }

  async updateAfastamento(id: string, data: Partial<Afastamento>): Promise<Afastamento> {
    const { data: updated, error } = await this.supabase
      .from('afastamentos')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, funcionario:funcionarios(nome, cargo, departamento)')
      .single()

    if (error) throw error
    return updated
  }

  async deleteAfastamento(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('afastamentos')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ==================== STATS ====================

  async getStats(): Promise<{ total: number; ativos: number; inativos: number; em_ferias: number; afastados: number }> {
    const [total, ativos, inativos, em_ferias, afastados] = await Promise.all([
      this.countFuncionarios(),
      this.countFuncionarios('ativo'),
      this.countFuncionarios('inativo'),
      this.countFuncionarios('ferias'),
      this.countFuncionarios('afastado')
    ])

    return { total, ativos, inativos, em_ferias, afastados }
  }

  async getTotalFolhaMes(referencia: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('folha_pagamento')
      .select('salario_liquido')
      .eq('referencia', referencia)
      .in('status', ['calculada', 'aprovada', 'paga'])

    if (error) throw error
    return (data || []).reduce((acc, f) => acc + (f.salario_liquido || 0), 0)
  }

  async getDepartamentoStats(): Promise<{ nome: string; quantidade: number }[]> {
    const { data, error } = await this.supabase
      .from('funcionarios')
      .select('departamento')
      .eq('status', 'ativo')

    if (error) throw error

    const contagem: Record<string, number> = {}
    ;(data || []).forEach(f => {
      contagem[f.departamento] = (contagem[f.departamento] || 0) + 1
    })

    return Object.entries(contagem)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
  }
}

// Factory function
export const createRHRepository = (supabase: SupabaseClient) => {
  return new RHRepository(supabase)
}
