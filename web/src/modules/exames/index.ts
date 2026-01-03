// Módulo Exames Médicos - Exports públicos
export * from './types'
export { useExames, useExame, useExamesMutations, useExamesStats } from './hooks/useExames'
export { ExamesRepository, createExamesRepository } from './repositories/exames.repository'
export { ExamesService, createExamesService } from './services/exames.service'
