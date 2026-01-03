// Módulo Infrações - Exports públicos
export * from './types'
export { useInfracoes, useInfracao, useInfracoesMutations, useInfracoesStats } from './hooks/useInfracoes'
export { InfracoesRepository, createInfracoesRepository } from './repositories/infracoes.repository'
export { InfracoesService, createInfracoesService } from './services/infracoes.service'
