// Repository CRM - Responsável APENAS por acesso a dados
import { SupabaseClient } from '@supabase/supabase-js'
import type { 
  Contato, ContatoFilters, ContatoFormData,
  Mensagem, MensagemFilters,
  RespostaAutomatica,
  ConfiguracaoBot,
  Campanha,
  StatusContato
} from '../types'

export class CRMRepository {
  constructor(private supabase: SupabaseClient) {}

  // ===== CONTATOS =====

  async findContatos(filters?: ContatoFilters): Promise<Contato[]> {
    let query = this.supabase
      .from('contatos_crm')
      .select(`
        *,
        associados:associado_id (nome)
      `)
      .order('ultimo_contato', { ascending: false, nullsFirst: false })

    if (filters?.search) {
      query = query.or(`nome.ilike.%${filters.search}%,telefone.ilike.%${filters.search}%`)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.associado_id) {
      query = query.eq('associado_id', filters.associado_id)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []).map(c => ({
      ...c,
      associado_nome: c.associados?.nome
    }))
  }

  async findContatoById(id: string): Promise<Contato | null> {
    const { data, error } = await this.supabase
      .from('contatos_crm')
      .select(`*, associados:associado_id (nome)`)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data ? { ...data, associado_nome: data.associados?.nome } : null
  }

  async findContatoByTelefone(telefone: string): Promise<Contato | null> {
    const { data, error } = await this.supabase
      .from('contatos_crm')
      .select('*')
      .eq('telefone', telefone.replace(/\D/g, ''))
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createContato(data: ContatoFormData): Promise<Contato> {
    const { data: created, error } = await this.supabase
      .from('contatos_crm')
      .insert({
        ...data,
        telefone: data.telefone.replace(/\D/g, ''),
        status: data.status || 'novo'
      })
      .select()
      .single()

    if (error) throw error
    return created
  }

  async updateContato(id: string, data: Partial<ContatoFormData>): Promise<Contato> {
    const { data: updated, error } = await this.supabase
      .from('contatos_crm')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async deleteContato(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('contatos_crm')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ===== MENSAGENS =====

  async findMensagens(filters?: MensagemFilters): Promise<Mensagem[]> {
    let query = this.supabase
      .from('mensagens_crm')
      .select('*')
      .order('data_envio', { ascending: true })

    if (filters?.contato_id) {
      query = query.eq('contato_id', filters.contato_id)
    }

    if (filters?.direcao) {
      query = query.eq('direcao', filters.direcao)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.data_inicio) {
      query = query.gte('data_envio', filters.data_inicio)
    }

    if (filters?.data_fim) {
      query = query.lte('data_envio', filters.data_fim)
    }

    const { data, error } = await query.limit(100)

    if (error) throw error
    return data || []
  }

  async createMensagem(data: Partial<Mensagem>): Promise<Mensagem> {
    const { data: created, error } = await this.supabase
      .from('mensagens_crm')
      .insert({
        ...data,
        data_envio: data.data_envio || new Date().toISOString(),
        status: data.status || 'pendente'
      })
      .select()
      .single()

    if (error) throw error

    // Atualizar ultimo_contato do contato
    if (data.contato_id) {
      await this.supabase
        .from('contatos_crm')
        .update({ ultimo_contato: new Date().toISOString() })
        .eq('id', data.contato_id)
    }

    return created
  }

  async updateMensagemStatus(id: string, status: Mensagem['status']): Promise<void> {
    const { error } = await this.supabase
      .from('mensagens_crm')
      .update({ status })
      .eq('id', id)

    if (error) throw error
  }

  // ===== RESPOSTAS AUTOMÁTICAS =====

  async findRespostasAutomaticas(): Promise<RespostaAutomatica[]> {
    const { data, error } = await this.supabase
      .from('respostas_automaticas')
      .select('*')
      .order('prioridade', { ascending: true })

    if (error) throw error
    return data || []
  }

  async findRespostasAtivas(): Promise<RespostaAutomatica[]> {
    const { data, error } = await this.supabase
      .from('respostas_automaticas')
      .select('*')
      .eq('ativo', true)
      .order('prioridade', { ascending: true })

    if (error) throw error
    return data || []
  }

  async createRespostaAutomatica(data: Partial<RespostaAutomatica>): Promise<RespostaAutomatica> {
    const { data: created, error } = await this.supabase
      .from('respostas_automaticas')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return created
  }

  async updateRespostaAutomatica(id: string, data: Partial<RespostaAutomatica>): Promise<RespostaAutomatica> {
    const { data: updated, error } = await this.supabase
      .from('respostas_automaticas')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async deleteRespostaAutomatica(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('respostas_automaticas')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // ===== CONFIGURAÇÃO BOT =====

  async getConfiguracaoBot(): Promise<ConfiguracaoBot | null> {
    const { data, error } = await this.supabase
      .from('configuracao_bot')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updateConfiguracaoBot(data: Partial<ConfiguracaoBot>): Promise<ConfiguracaoBot> {
    // Upsert - cria ou atualiza
    const { data: updated, error } = await this.supabase
      .from('configuracao_bot')
      .upsert(data)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  // ===== ESTATÍSTICAS =====

  async getStats(): Promise<{
    total_contatos: number
    novos_hoje: number
    em_atendimento: number
    mensagens_hoje: number
  }> {
    const hoje = new Date().toISOString().split('T')[0]

    const [totalContatos, novosHoje, emAtendimento, mensagensHoje] = await Promise.all([
      this.supabase.from('contatos_crm').select('*', { count: 'exact', head: true }),
      this.supabase.from('contatos_crm').select('*', { count: 'exact', head: true }).gte('created_at', `${hoje}T00:00:00`),
      this.supabase.from('contatos_crm').select('*', { count: 'exact', head: true }).eq('status', 'em_atendimento'),
      this.supabase.from('mensagens_crm').select('*', { count: 'exact', head: true }).gte('data_envio', `${hoje}T00:00:00`)
    ])

    return {
      total_contatos: totalContatos.count || 0,
      novos_hoje: novosHoje.count || 0,
      em_atendimento: emAtendimento.count || 0,
      mensagens_hoje: mensagensHoje.count || 0
    }
  }
}

export const createCRMRepository = (supabase: SupabaseClient) => {
  return new CRMRepository(supabase)
}

// Manter compatibilidade com exports antigos
export { CRMRepository as ContatosRepository, createCRMRepository as createContatosRepository }
