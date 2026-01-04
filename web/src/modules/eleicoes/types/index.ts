// Tipos do módulo de Eleições

export type StatusEleicao = 'agendada' | 'em_andamento' | 'encerrada' | 'cancelada'

export interface Eleicao {
  id: string
  titulo: string
  descricao?: string
  data_inicio: string
  data_fim: string
  status: StatusEleicao
  votos_brancos: number
  total_votos: number
  candidatos?: Candidato[]
  created_at: string
  updated_at?: string
}

export interface Candidato {
  id: string
  eleicao_id: string
  nome: string
  cargo: string
  numero: number
  foto_url?: string
  proposta?: string
  votos: number
  created_at: string
}

export interface Voto {
  id: string
  eleicao_id: string
  associado_id: string
  candidato_id?: string // null = voto branco
  data_voto: string
  created_at: string
}

export interface EleicaoFilters {
  search?: string
  status?: StatusEleicao
  ano?: number
}

export interface EleicaoFormData {
  titulo: string
  descricao?: string
  data_inicio: string
  data_fim: string
}

export interface ResultadoEleicao {
  eleicao: Eleicao
  candidatos: (Candidato & { percentual: number })[]
  total_votos: number
  votos_brancos: number
  participacao: number
}
