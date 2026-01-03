// Repository Compras - Responsável APENAS por acesso a dados
import { SupabaseClient } from '@supabase/supabase-js'
import type { Compra, CompraFilters, CompraFormData, Fornecedor, ItemCompra, StatusCompra } from '../types'

export class ComprasRepository {
  constructor(private supabase: SupabaseClient) {}

  // ===== COMPRAS =====

  async findCompras(filters?: CompraFilters): Promise<Compra[]> {
    let query = this.supabase
      .from('compras')
      .select(`
        *,
        fornecedores:fornecedor_id (nome),
        usuarios:usuario_id (nome)
      `)
      .order('data_compra', { ascending: false })

    if (filters?.search) {
      query = query.or(`descricao.ilike.%${filters.search}%,numero.ilike.%${filters.search}%`)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.fornecedor_id) {
      query = query.eq('fornecedor_id', filters.fornecedor_id)
    }

    if (filters?.data_inicio) {
      query = query.gte('data_compra', filters.data_inicio)
    }

    if (filters?.data_fim) {
      query = query.lte('data_compra', filters.data_fim)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(c => ({
      ...c,
      fornecedor_nome: c.fornecedores?.nome,
      usuario_nome: c.usuarios?.nome
    }))
  }

  async findCompraById(id: string): Promise<Compra | null> {
    const { data, error } = await this.supabase
      .from('compras')
      .select(`
        *,
        fornecedores:fornecedor_id (nome),
        usuarios:usuario_id (nome),
        itens_compra (*)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data ? {
      ...data,
      fornecedor_nome: data.fornecedores?.nome,
      usuario_nome: data.usuarios?.nome,
      itens: data.itens_compra
    } : null
  }

  async createCompra(data: CompraFormData & { numero: string; usuario_id?: string }): Promise<Compra> {
    const { itens, ...compraData } = data

    const { data: created, error } = await this.supabase
      .from('compras')
      .insert({
        ...compraData,
        status: 'rascunho',
        status_pagamento: 'pendente',
        valor_pago: 0,
        data_compra: compraData.data_compra || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) throw error

    // Criar itens se houver
    if (itens && itens.length > 0) {
      const itensData = itens.map(item => ({
        ...item,
        compra_id: created.id
      }))

      await this.supabase.from('itens_compra').insert(itensData)
    }

    return created
  }

  async updateCompra(id: string, data: Partial<CompraFormData>): Promise<Compra> {
    const { data: updated, error } = await this.supabase
      .from('compras')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async deleteCompra(id: string): Promise<void> {
    // Deletar itens primeiro
    await this.supabase.from('itens_compra').delete().eq('compra_id', id)
    
    const { error } = await this.supabase
      .from('compras')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ===== FORNECEDORES =====

  async findFornecedores(): Promise<Fornecedor[]> {
    const { data, error } = await this.supabase
      .from('fornecedores')
      .select('*')
      .eq('ativo', true)
      .order('nome')

    if (error) throw error
    return data || []
  }

  async createFornecedor(data: Partial<Fornecedor>): Promise<Fornecedor> {
    const { data: created, error } = await this.supabase
      .from('fornecedores')
      .insert({ ...data, ativo: true })
      .select()
      .single()

    if (error) throw error
    return created
  }

  // ===== ESTATÍSTICAS =====

  async getStats(): Promise<{
    total_mes: number
    pendentes: number
    a_pagar: number
    quantidade_compras: number
  }> {
    const mesAtual = new Date().toISOString().slice(0, 7)

    const [totalMes, pendentes, aPagar] = await Promise.all([
      this.supabase
        .from('compras')
        .select('valor_total')
        .gte('data_compra', `${mesAtual}-01`),
      this.supabase
        .from('compras')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pendente', 'aprovada']),
      this.supabase
        .from('compras')
        .select('valor_total, valor_pago')
        .eq('status_pagamento', 'pendente')
    ])

    return {
      total_mes: totalMes.data?.reduce((sum, c) => sum + (c.valor_total || 0), 0) || 0,
      pendentes: pendentes.count || 0,
      a_pagar: aPagar.data?.reduce((sum, c) => sum + (c.valor_total - c.valor_pago), 0) || 0,
      quantidade_compras: totalMes.data?.length || 0
    }
  }

  async getProximoNumero(): Promise<string> {
    const ano = new Date().getFullYear()
    const { count } = await this.supabase
      .from('compras')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${ano}-01-01`)

    return `${ano}${String((count || 0) + 1).padStart(5, '0')}`
  }
}

export const createComprasRepository = (supabase: SupabaseClient) => {
  return new ComprasRepository(supabase)
}
