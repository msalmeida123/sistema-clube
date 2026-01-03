// Tipos do módulo de Auth

export interface Usuario {
  id: string
  auth_id: string
  nome: string
  email: string
  is_admin: boolean
  permissoes: string[]
  ativo: boolean
  created_at: string
  updated_at?: string
}

export interface LoginData {
  email: string
  senha: string
}

export interface RegistroData {
  nome: string
  email: string
  senha: string
  permissoes?: string[]
}

export interface AuthState {
  user: Usuario | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  isAdmin: boolean
}

export type Permissao = 
  | 'dashboard'
  | 'associados'
  | 'dependentes'
  | 'financeiro'
  | 'compras'
  | 'portaria'
  | 'exames'
  | 'infracoes'
  | 'eleicoes'
  | 'relatorios'
  | 'crm'
  | 'configuracoes'
  | 'usuarios'

export const TODAS_PERMISSOES: Permissao[] = [
  'dashboard',
  'associados',
  'dependentes',
  'financeiro',
  'compras',
  'portaria',
  'exames',
  'infracoes',
  'eleicoes',
  'relatorios',
  'crm',
  'configuracoes',
  'usuarios',
]

export const PERMISSOES_LABELS: Record<Permissao, string> = {
  dashboard: 'Dashboard',
  associados: 'Associados',
  dependentes: 'Dependentes',
  financeiro: 'Financeiro',
  compras: 'Compras',
  portaria: 'Portaria',
  exames: 'Exames Médicos',
  infracoes: 'Infrações',
  eleicoes: 'Eleições',
  relatorios: 'Relatórios',
  crm: 'CRM / WhatsApp',
  configuracoes: 'Configurações',
  usuarios: 'Usuários',
}
