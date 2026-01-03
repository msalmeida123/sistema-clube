// Tipos do módulo de Exames Médicos

export type StatusExame = 'pendente' | 'aprovado' | 'reprovado' | 'vencido'
export type TipoPessoa = 'associado' | 'dependente'

export interface ExameMedico {
  id: string
  pessoa_id: string
  pessoa_nome?: string
  tipo_pessoa: TipoPessoa
  data_exame: string
  data_validade: string
  medico_nome?: string
  crm_medico?: string
  clinica?: string
  resultado?: string
  observacoes?: string
  arquivo_url?: string
  status: StatusExame
  created_at: string
  updated_at?: string
}

export interface ExameFilters {
  tipo_pessoa?: TipoPessoa
  status?: StatusExame
  pessoa_id?: string
  vencidos?: boolean
  a_vencer?: number // dias
}

export interface ExameFormData {
  pessoa_id: string
  tipo_pessoa: TipoPessoa
  data_exame: string
  data_validade: string
  medico_nome?: string
  crm_medico?: string
  clinica?: string
  resultado?: string
  observacoes?: string
  arquivo_url?: string
}

export interface ExamesStats {
  total: number
  aprovados: number
  vencidos: number
  a_vencer_30dias: number
}
