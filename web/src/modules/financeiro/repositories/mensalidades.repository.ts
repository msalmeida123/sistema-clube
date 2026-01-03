// Repository de Mensalidades
import { SupabaseClient } from '@supabase/supabase-js'
import type { Mensalidade, MensalidadeFilters, ResumoFinanceiro } from '../types'

export class MensalidadesRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(filters?: MensalidadeFilters): Promise<Mensalidade[]> {
    let query = this.supabase
      .from('mensalidades')
      .select(`
        *,
        associado:associados(id, nome, numero_titulo, email)
      `)
      .order('data_vencimento', { ascending: false })

    if (filters?.search) {
      query = query.or(`associado.nome.ilike.%${filters.search}%,associado.numero_titulo.ilike.%${filters.search}%`)
    }
    if (filters?.associado_id) {
      query = query.eq('associado_id', filters.associado_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.referencia) {
      query = query.eq('referencia', filters.referencia)
    }
    if (filters?.ano) {
      query = query.ilike('referencia', `${filters.ano}-%`)
    }
    if (filters?.dataInicio) {
      query = query.gte('data_vencimento', filters.dataInicio)
    }
    if (filters?.dataFim) {
      query = query.lte('data_vencimento', filters.dataFim)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async findById(id: string): Promise<Mensalidade | null> {
    const { data, error } = await this.supabase
      .from('mensalidades')
      .select(`*, associado:associados(id, nome, numero_titulo, email)`)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async findByAssociado(associadoId: string): Promise<Mensalidade[]> {
    const { data, error } = await this.supabase
      .from('mensalidades')
      .select('*')
      .eq('associado_id', associadoId)
      .order('referencia', { ascending: false })

    if (error) throw error
    return data || []
  }

  async findAtrasadas(): Promise<Mensalidade[]> {
    const hoje = new Date().toISOString().split('T')[0]
    
    const { data, error } = await this.supabase
      .from('mensalidades')
      .select(`*, associado:associados(id, nome, numero_titulo, email)`)
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje)
      .order('data_vencimento')

    if (error) throw error
    return data || []
  }

  async create(data: Partial<Mensalidade>): Promise<Mensalidade> {
    const { data: created, error } = await this.supabase
      .from('mensalidades')
      .insert({ ...data, status: data.status || 'pendente' })
      .select()
      .single()

    if (error) throw error
    return created
  }

  async createMany(mensalidades: Partial<Mensalidade>[]): Promise<Mensalidade[]> {
    const { data: created, error } = await this.supabase
      .from('mensalidades')
      .insert(mensalidades)
      .select()

    if (error) throw error
    return created || []
  }

  async update(id: string, data: Partial<Mensalidade>): Promise<Mensalidade> {
    const { data: updated, error } = await this.supabase
      .from('mensalidades')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('mensalidades')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async getResumo(ano?: number): Promise<ResumoFinanceiro> {
    const anoFiltro = ano || new Date().getFullYear()
    
    const { data, error } = await this.supabase
      .from('mensalidades')
      .select('valor, valor_pago, status')
      .ilike('referencia', `${anoFiltro}-%`)

    if (error) throw error

    const resumo: ResumoFinanceiro = {
      totalReceber: 0,
      totalRecebido: 0,
      totalAtrasado: 0,
      inadimplentes: 0,
      adimplentes: 0,
    }

    const associadosStatus = new Map<string, boolean>()

    data?.forEach(m => {
      resumo.totalReceber += m.valor || 0
      resumo.totalRecebido += m.valor_pago || 0
      
      if (m.status === 'atrasado') {
        resumo.totalAtrasado += m.valor || 0
      }
    })

    return resumo
  }
}

export const createMensalidadesRepository = (supabase: SupabaseClient) => {
  return new MensalidadesRepository(supabase)
}
