// Módulo Financeiro - Exports públicos

// Types
export * from './types'

// Hooks
export { 
  useMensalidades, 
  useMensalidade, 
  useFinanceiroStats, 
  useFinanceiroMutations 
} from './hooks/useFinanceiro'

// Components
export { MensalidadesTable } from './components/MensalidadesTable'
export { FinanceiroStatsCards } from './components/FinanceiroStatsCards'

// Repository e Service (para casos avançados)
export { FinanceiroRepository, createFinanceiroRepository } from './repositories/financeiro.repository'
export { FinanceiroService, createFinanceiroService } from './services/financeiro.service'
