// Módulo de Associados - Exports públicos
// Seguindo Single Responsibility Principle

// Types
export * from './types'

// Hooks (para uso em componentes React)
export { useAssociados, useAssociado, useAssociadoMutations } from './hooks/useAssociados'

// Components (para uso em páginas)
export { AssociadosTable } from './components/AssociadosTable'
export { AssociadoSearch } from './components/AssociadoSearch'

// Repository e Service (para casos avançados)
export { AssociadosRepository, createAssociadosRepository } from './repositories/associados.repository'
export { AssociadosService, createAssociadosService } from './services/associados.service'
