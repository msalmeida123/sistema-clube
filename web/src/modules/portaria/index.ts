// Módulo Portaria - Exports públicos

// Types
export * from './types'

// Hooks
export { usePortaria, useValidacaoAcesso, useRegistroAcesso } from './hooks/usePortaria'

// Components
export { QRScanner } from './components/QRScanner'
export { ValidacaoCard } from './components/ValidacaoCard'
export { RegistrosRecentes } from './components/RegistrosRecentes'

// Repository e Service (para casos avançados)
export { PortariaRepository, createPortariaRepository } from './repositories/portaria.repository'
export { PortariaService, createPortariaService } from './services/portaria.service'
