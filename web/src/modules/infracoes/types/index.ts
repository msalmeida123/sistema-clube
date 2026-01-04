// Tipos do módulo de Infrações

export type GravidadeInfracao = 'leve' | 'media' | 'grave' | 'gravissima'
export type StatusInfracao = 'registrada' | 'em_analise' | 'julgada' | 'arquivada'
export type TipoPenalidade = 'advertencia' | 'suspensao' | 'multa' | 'expulsao'

export interface Infracao {
  id: string
  associado_id: string
  associado_nome?: string
  data_ocorrencia: string
  local?: string
  descricao: string
  gravidade: GravidadeInfracao
  status: StatusInfracao
  testemunhas?: string
  evidencias_url?: string[]
  penalidade?: TipoPenalidade
  dias_suspensao?: number
  valor_multa?: number
  data_julgamento?: string
  parecer?: string
  registrado_por?: string
  created_at: string
  updated_at?: string
}

export interface InfracaoFilters {
  search?: string
  associado_id?: string
  gravidade?: GravidadeInfracao
  status?: StatusInfracao
  data_inicio?: string
  data_fim?: string
}

export interface InfracaoFormData {
  associado_id: string
  data_ocorrencia: string
  local?: string
  descricao: string
  gravidade: GravidadeInfracao
  testemunhas?: string
}

export interface InfracoesStats {
  total: number
  pendentes: number
  este_mes: number
  por_gravidade: Record<GravidadeInfracao, number>
}
