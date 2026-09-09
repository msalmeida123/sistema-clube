// Repository de Dependentes
import { SupabaseClient } from '@supabase/supabase-js'
import type { Dependente, DependenteFilters, DependenteFormData } from '../types'

export class DependentesRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(filters?: DependenteFilters): Promise<Dependente[]> {
    let query = this.supabase
      .from('dependentes')
      .select(`
        *,
        associado:associados(id, nome, numero_titulo)
      `)
      .order('nome')

    if (filters?.search) {
      const termo = filters.search.trim()
      const {data: titulares,error: erroTitulares}=await this.supabase.from('associados').select('id').eq('numero_titulo',termo)
      if(erroTitulares) throw erroTitulares
      if(titulares?.length) query=query.in('associado_id',titulares.map(t=>t.id))
      else {
        const cpf=termo.replace(/[.\-\s]/g,'')
        query=/^\d{11}$/.test(cpf)?query.eq('cpf',cpf):query.ilike('nome','%'+termo.replace(/[%_]/g,'')+'%')
      }
    }
    if (filters?.associado_id) {
      query = query.eq('associado_id', filters.associado_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.parentesco) {
      query = query.eq('parentesco', filters.parentesco)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async findById(id: string): Promise<Dependente | null> {
    const { data, error } = await this.supabase
      .from('dependentes')
      .select(`*, associado:associados(id, nome, numero_titulo)`)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async findByAssociado(associadoId: string): Promise<Dependente[]> {
    const { data, error } = await this.supabase
      .from('dependentes')
      .select('*')
      .eq('associado_id', associadoId)
      .order('nome')

    if (error) throw error
    return data || []
  }

  async create(data: DependenteFormData): Promise<Dependente> {
    const { data: created, error } = await this.supabase
      .from('dependentes')
      .insert({ ...data, status: data.status || 'ativo' })
      .select()
      .single()

    if (error) throw error
    return created
  }

  async update(id: string, data: Partial<DependenteFormData>): Promise<Dependente> {
    const { data: updated, error } = await this.supabase
      .from('dependentes')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('dependentes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async count(associadoId?: string): Promise<number> {
    let query = this.supabase
      .from('dependentes')
      .select('*', { count: 'exact', head: true })

    if (associadoId) {
      query = query.eq('associado_id', associadoId)
    }

    const { count, error } = await query
    if (error) throw error
    return count || 0
  }
}

export const createDependentesRepository = (supabase: SupabaseClient) => {
  return new DependentesRepository(supabase)
}
