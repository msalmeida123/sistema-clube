// Módulo Auth - Exports públicos

// Types
export * from './types'

// Hooks
export {
  useAuth,
  useLogin,
  useRegistro,
  useUsuarios,
  useUsuariosMutations
} from './hooks/useAuth'

// Hooks de Permissões CRUD
export {
  usePermissoesCRUD,
  usePermissaoPagina,
  useGerenciarPermissoes
} from './hooks/usePermissoesCRUD'

// Components (Providers de Context)
export { AuthProvider } from './components/AuthProvider'
export { PermissoesProvider } from './components/PermissoesProvider'

// Repository e Service (para casos avançados)
export { AuthRepository, createAuthRepository } from './repositories/auth.repository'
export { AuthService, createAuthService } from './services/auth.service'

// Repository de Permissões
export * as permissoesRepository from './repositories/permissoes.repository'
