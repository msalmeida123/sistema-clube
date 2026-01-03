// Tipos do módulo de Auth

export interface Usuario {
  id: string
  auth_id: string
  nome: string
  email: string
  is_admin: boolean
  permissoes: string[]
  perfil_acesso_id?: string | null
  setor?: string
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

// ==========================================
// SISTEMA DE PERMISSÕES CRUD
// ==========================================

export interface PaginaSistema {
  id: string
  codigo: string
  nome: string
  descricao: string
  icone?: string
  rota: string
  pagina_pai_id?: string | null
  ordem: number
  ativo: boolean
  subpaginas?: PaginaSistema[]
}

export interface PermissaoCRUD {
  pagina_id: string
  pode_visualizar: boolean
  pode_criar: boolean
  pode_editar: boolean
  pode_excluir: boolean
}

export interface PermissaoUsuario extends PermissaoCRUD {
  id?: string
  usuario_id: string
}

export interface PermissaoPerfil extends PermissaoCRUD {
  id?: string
  perfil_id: string
}

export interface PerfilAcesso {
  id: string
  nome: string
  descricao: string
  ativo: boolean
  created_at?: string
}

export type TipoAcao = 'visualizar' | 'criar' | 'editar' | 'excluir'

// ==========================================
// PERMISSÕES SIMPLES (legado)
// ==========================================

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

// Mapeamento de rotas para códigos de página
export const ROTA_PARA_PAGINA: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/dashboard/associados': 'associados',
  '/dashboard/dependentes': 'dependentes',
  '/dashboard/financeiro': 'financeiro',
  '/dashboard/compras': 'compras',
  '/dashboard/portaria': 'portaria',
  '/dashboard/exames-medicos': 'exames',
  '/dashboard/infracoes': 'infracoes',
  '/dashboard/eleicoes': 'eleicoes',
  '/dashboard/relatorios': 'relatorios',
  '/dashboard/crm': 'crm',
  '/dashboard/whatsapp': 'crm',
  '/dashboard/configuracoes': 'configuracoes',
  '/dashboard/permissoes': 'usuarios',
  '/dashboard/planos': 'configuracoes',
  '/dashboard/quiosques': 'configuracoes',
}
