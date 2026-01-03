// Módulo CRM - Exports públicos

// Types
export * from './types'

// Hooks
export { 
  useContatos, 
  useConversa,
  useContatosMutations,
  useRespostasAutomaticas,
  useConfiguracaoBot,
  useCRMStats
} from './hooks/useCRM'

// Repository e Service
export { CRMRepository, createCRMRepository } from './repositories/crm.repository'
export { CRMService, createCRMService } from './services/crm.service'
