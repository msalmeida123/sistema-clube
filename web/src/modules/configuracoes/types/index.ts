// Tipos do módulo de Configurações

// Alias para compatibilidade com hooks gerados
export type Configuracao = ConfiguracaoClube
export type ConfiguracaoFormData = ConfigFormData
export interface ConfiguracaoFilters {
  search?: string
}

export interface ConfiguracaoClube {
  id: string
  nome_clube: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  cidade?: string
  estado?: string
  cep?: string
  logo_url?: string
  site?: string
  
  // Configurações financeiras
  dia_vencimento_padrao: number
  valor_mensalidade_individual?: number
  valor_mensalidade_familiar?: number
  valor_mensalidade_patrimonial?: number
  taxa_inscricao?: number
  
  // Integração Sicoob
  sicoob_client_id?: string
  sicoob_client_secret?: string
  sicoob_numero_contrato?: string
  sicoob_ativo: boolean
  
  // Integração WaSender
  wasender_api_key?: string
  wasender_device_id?: string
  wasender_ativo: boolean
  
  created_at: string
  updated_at?: string
}

export interface Plano {
  id: string
  nome: string
  codigo: string
  valor_mensal: number
  valor_inscricao?: number
  descricao?: string
  beneficios?: string[]
  ativo: boolean
  created_at: string
}

export interface Quiosque {
  id: string
  nome: string
  descricao?: string
  capacidade?: number
  valor_hora?: number
  valor_diaria?: number
  fotos_url?: string[]
  disponivel: boolean
  created_at: string
}

export interface ConfigFormData {
  nome_clube?: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  dia_vencimento_padrao?: number
}

export interface SicoobConfig {
  client_id: string
  client_secret: string
  numero_contrato: string
}

export interface WaSenderConfig {
  api_key: string
  device_id: string
}
