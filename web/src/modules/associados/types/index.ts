// Tipos do módulo de Associados

export interface Associado {
  id: string
  numero_titulo: string
  nome: string
  cpf: string
  rg?: string
  data_nascimento?: string
  sexo?: 'M' | 'F'
  estado_civil?: string
  profissao?: string
  email?: string
  telefone?: string
  celular?: string
  foto_url?: string
  
  // Endereço
  cep?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  
  // Dados do clube
  plano: 'individual' | 'familiar' | 'patrimonial'
  categoria?: string
  data_admissao?: string
  data_desligamento?: string
  status: 'ativo' | 'inativo' | 'suspenso' | 'expulso'
  
  // Financeiro
  dia_vencimento?: number
  valor_mensalidade?: number
  
  created_at: string
  updated_at?: string
}

export interface AssociadoFilters {
  search?: string
  status?: Associado['status']
  plano?: Associado['plano']
  limit?: number
  offset?: number
}

export interface AssociadoFormData {
  nome: string
  cpf: string
  email?: string
  telefone?: string
  plano: Associado['plano']
  status?: Associado['status']
}

export interface AssociadoStats {
  total: number
  ativos: number
  inativos: number
  inadimplentes: number
}
