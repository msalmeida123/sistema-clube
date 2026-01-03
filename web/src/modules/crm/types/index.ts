// Tipos do módulo CRM/WhatsApp

export type StatusMensagem = 'pendente' | 'enviada' | 'entregue' | 'lida' | 'erro'
export type TipoMensagem = 'texto' | 'imagem' | 'documento' | 'audio' | 'video'
export type StatusContato = 'novo' | 'em_atendimento' | 'aguardando' | 'finalizado'

export interface Contato {
  id: string
  nome: string
  telefone: string
  email?: string
  associado_id?: string
  associado_nome?: string
  ultimo_contato?: string
  status: StatusContato
  etiquetas?: string[]
  observacoes?: string
  created_at: string
  updated_at?: string
}

export interface Mensagem {
  id: string
  contato_id: string
  tipo: TipoMensagem
  conteudo: string
  media_url?: string
  direcao: 'entrada' | 'saida'
  status: StatusMensagem
  enviada_por?: string // usuario_id
  data_envio: string
  data_leitura?: string
  erro_msg?: string
  created_at: string
}

export interface RespostaAutomatica {
  id: string
  gatilho: string // palavra-chave ou regex
  tipo_gatilho: 'exato' | 'contem' | 'regex'
  resposta: string
  ativo: boolean
  prioridade: number
  created_at: string
}

export interface ConfiguracaoBot {
  id: string
  ativo: boolean
  horario_inicio?: string // "08:00"
  horario_fim?: string // "18:00"
  dias_semana?: number[] // [1,2,3,4,5]
  mensagem_fora_horario?: string
  usar_ia: boolean
  prompt_ia?: string
  created_at: string
}

export interface Campanha {
  id: string
  nome: string
  mensagem: string
  tipo: 'texto' | 'imagem'
  media_url?: string
  status: 'rascunho' | 'agendada' | 'enviando' | 'concluida' | 'cancelada'
  data_agendamento?: string
  total_contatos: number
  enviadas: number
  entregues: number
  lidas: number
  erros: number
  created_at: string
}

export interface ContatoFilters {
  search?: string
  status?: StatusContato
  etiqueta?: string
  associado_id?: string
}

export interface MensagemFilters {
  contato_id?: string
  direcao?: 'entrada' | 'saida'
  status?: StatusMensagem
  data_inicio?: string
  data_fim?: string
}

export interface ContatoFormData {
  nome: string
  telefone: string
  email?: string
  associado_id?: string
  status?: StatusContato
  etiquetas?: string[]
  observacoes?: string
}

export interface CRMStats {
  total_contatos: number
  novos_hoje: number
  em_atendimento: number
  mensagens_hoje: number
  tempo_medio_resposta?: number
}
