// Módulo de RH (Recursos Humanos) - Exports públicos
// Seguindo Single Responsibility Principle

// Types
export * from './types'

// Hooks (para uso em componentes React)
export {
  useFuncionarios,
  useFuncionario,
  useFuncionarioMutations,
  usePonto,
  useFolhaPagamento,
  useAfastamentos,
  useRHStats,
} from './hooks/useRH'

// Components
export { RHDashboard } from './components/RHDashboard'
export { FuncionariosTab } from './components/FuncionariosTab'
export { FuncionarioForm } from './components/FuncionarioForm'
export { PontoTab } from './components/PontoTab'
export { FolhaTab } from './components/FolhaTab'
export { AfastamentosTab } from './components/AfastamentosTab'

// Repository e Service (para casos avançados)
export { RHRepository, createRHRepository } from './repositories/rh.repository'
export { RHService, createRHService } from './services/rh.service'
