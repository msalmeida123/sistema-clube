// Tipos do módulo Portaria

export type TipoAcesso = 'entrada' | 'saida'
export type LocalAcesso = 'clube' | 'piscina' | 'academia'
export type TipoPessoa = 'associado' | 'dependente' | 'convidado' | 'funcionario'

export interface RegistroAcesso {
  id: string
  pessoa_id: string
  pessoa_nome?: string
  pessoa_foto?: string
  tipo_pessoa: TipoPessoa
  tipo: TipoAcesso
  local: LocalAcesso
  data_hora: string
  usuario_id?: string
  usuario_nome?: string
  observacao?: string
  created_at: string
}

export interface PessoaAcesso {
  id: string
  nome: string
  foto_url?: string
  tipo: TipoPessoa
  status: 'ativo' | 'inativo' | 'suspenso'
  numero_titulo?: string
  // Dados do associado titular (para dependentes)
  titular_id?: string
  titular_nome?: string
  // Validações
  pode_acessar: boolean
  motivo_bloqueio?: string
  adimplente?: boolean
  exame_valido?: boolean
}

export interface RegistroFilters {
  local?: LocalAcesso
  tipo?: TipoAcesso
  tipo_pessoa?: TipoPessoa
  data_inicio?: string
  data_fim?: string
  pessoa_id?: string
}

export interface AcessoStats {
  entradas_hoje: number
  saidas_hoje: number
  presentes_agora: number
  acessos_semana: number
}

export interface ValidacaoAcesso {
  permitido: boolean
  pessoa?: PessoaAcesso
  motivo?: string
  alertas?: string[]
}
