// Módulo Auth - Exports públicos

// Types
export * from './types'

// Hooks
export { 
  useAuth, 
  AuthProvider,
  useLogin, 
  useRegistro, 
  useUsuarios, 
  useUsuariosMutations 
} from './hooks/useAuth'

// Hooks de Permissões CRUD
export {
  usePermissoesCRUD,
  usePermissaoPagina,
  useGerenciarPermissoes,
  PermissoesProvider
} from './hooks/usePermissoesCRUD'

// Repository e Service (para casos avançados)
export { AuthRepository, createAuthRepository } from './repositories/auth.repository'
export { AuthService, createAuthService } from './services/auth.service'

// Repository de Permissões
export * as permissoesRepository from './repositories/permissoes.repository'
