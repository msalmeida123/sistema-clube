// Tipos do módulo de Dependentes

export interface Dependente {
  id: string
  associado_id: string
  nome: string
  cpf?: string
  rg?: string
  data_nascimento?: string
  sexo?: 'M' | 'F'
  parentesco: 'conjuge' | 'filho' | 'filha' | 'pai' | 'mae' | 'outro'
  email?: string
  telefone?: string
  foto_url?: string
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at?: string
  
  // Relacionamento
  associado?: {
    id: string
    nome: string
    numero_titulo: string
  }
}

export interface DependenteFilters {
  search?: string
  associado_id?: string
  status?: Dependente['status']
  parentesco?: Dependente['parentesco']
}

export interface DependenteFormData {
  associado_id: string
  nome: string
  cpf?: string
  data_nascimento?: string
  parentesco: Dependente['parentesco']
  status?: Dependente['status']
}
