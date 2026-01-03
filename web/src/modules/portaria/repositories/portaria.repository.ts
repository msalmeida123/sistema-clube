// Repository Portaria - Responsável APENAS por acesso a dados
import { SupabaseClient } from '@supabase/supabase-js'
import type { RegistroAcesso, RegistroFilters, LocalAcesso, TipoAcesso, TipoPessoa } from '../types'

export class PortariaRepository {
  constructor(private supabase: SupabaseClient) {}

  // ===== REGISTROS DE ACESSO =====

  async findRegistros(filters?: RegistroFilters): Promise<RegistroAcesso[]> {
    let query = this.supabase
      .from('registros_acesso')
      .select('*')
      .order('data_hora', { ascending: false })
      .limit(100)

    if (filters?.local) {
      query = query.eq('local', filters.local)
    }

    if (filters?.tipo) {
      query = query.eq('tipo', filters.tipo)
    }

    if (filters?.tipo_pessoa) {
      query = query.eq('tipo_pessoa', filters.tipo_pessoa)
    }

    if (filters?.data_inicio) {
      query = query.gte('data_hora', filters.data_inicio)
    }

    if (filters?.data_fim) {
      query = query.lte('data_hora', filters.data_fim)
    }

    if (filters?.pessoa_id) {
      query = query.eq('pessoa_id', filters.pessoa_id)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async createRegistro(data: {
    pessoa_id: string
    pessoa_nome: string
    pessoa_foto?: string
    tipo_pessoa: TipoPessoa
    tipo: TipoAcesso
    local: LocalAcesso
    usuario_id?: string
    usuario_nome?: string
    observacao?: string
  }): Promise<RegistroAcesso> {
    const { data: created, error } = await this.supabase
      .from('registros_acesso')
      .insert({
        ...data,
        data_hora: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return created
  }

  // ===== BUSCA DE PESSOAS =====

  async findAssociadoByQRCode(qrcode: string) {
    // QR Code pode ser o ID ou número do título
    const { data, error } = await this.supabase
      .from('associados')
      .select('id, nome, foto_url, status, numero_titulo')
      .or(`id.eq.${qrcode},numero_titulo.eq.${qrcode}`)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async findDependenteByQRCode(qrcode: string) {
    const { data, error } = await this.supabase
      .from('dependentes')
      .select(`
        id, nome, foto_url, status,
        associados:associado_id (id, nome, status)
      `)
      .eq('id', qrcode)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async findAssociadoById(id: string) {
    const { data, error } = await this.supabase
      .from('associados')
      .select('id, nome, foto_url, status, numero_titulo')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  // ===== VERIFICAÇÕES =====

  async checkAdimplencia(associado_id: string): Promise<boolean> {
    const hoje = new Date().toISOString().split('T')[0]
    
    const { count } = await this.supabase
      .from('mensalidades')
      .select('*', { count: 'exact', head: true })
      .eq('associado_id', associado_id)
      .eq('status', 'pendente')
      .lt('data_vencimento', hoje)

    return (count || 0) === 0
  }

  async checkExameMedico(pessoa_id: string, tipo_pessoa: TipoPessoa): Promise<boolean> {
    const tabela = tipo_pessoa === 'associado' ? 'exames_associados' : 'exames_dependentes'
    const campo = tipo_pessoa === 'associado' ? 'associado_id' : 'dependente_id'
    
    const hoje = new Date().toISOString().split('T')[0]

    const { data } = await this.supabase
      .from(tabela)
      .select('data_validade')
      .eq(campo, pessoa_id)
      .eq('status', 'aprovado')
      .gte('data_validade', hoje)
      .limit(1)

    return (data?.length || 0) > 0
  }

  async getUltimoRegistro(pessoa_id: string, local: LocalAcesso): Promise<RegistroAcesso | null> {
    const { data, error } = await this.supabase
      .from('registros_acesso')
      .select('*')
      .eq('pessoa_id', pessoa_id)
      .eq('local', local)
      .order('data_hora', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // ===== ESTATÍSTICAS =====

  async getStats(local: LocalAcesso): Promise<{
    entradas_hoje: number
    saidas_hoje: number
    presentes_agora: number
  }> {
    const hoje = new Date().toISOString().split('T')[0]

    const { count: entradas } = await this.supabase
      .from('registros_acesso')
      .select('*', { count: 'exact', head: true })
      .eq('local', local)
      .eq('tipo', 'entrada')
      .gte('data_hora', `${hoje}T00:00:00`)

    const { count: saidas } = await this.supabase
      .from('registros_acesso')
      .select('*', { count: 'exact', head: true })
      .eq('local', local)
      .eq('tipo', 'saida')
      .gte('data_hora', `${hoje}T00:00:00`)

    return {
      entradas_hoje: entradas || 0,
      saidas_hoje: saidas || 0,
      presentes_agora: (entradas || 0) - (saidas || 0)
    }
  }
}

export const createPortariaRepository = (supabase: SupabaseClient) => {
  return new PortariaRepository(supabase)
}
