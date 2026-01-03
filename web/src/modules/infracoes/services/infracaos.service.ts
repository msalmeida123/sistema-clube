// Service de Infracao
import type { Infracao, InfracaoFormData, InfracaoFilters } from '../types'
import { InfracaosRepository } from '../repositories/infracaos.repository'

export class InfracaosService {
  constructor(private repository: InfracaosRepository) {}

  async listar(filters?: InfracaoFilters): Promise<Infracao[]> {
    return this.repository.findAll(filters)
  }

  async buscarPorId(id: string): Promise<Infracao | null> {
    return this.repository.findById(id)
  }

  async criar(data: InfracaoFormData): Promise<Infracao> {
    // TODO: Adicionar validações
    return this.repository.create(data)
  }

  async atualizar(id: string, data: Partial<InfracaoFormData>): Promise<Infracao> {
    return this.repository.update(id, data)
  }

  async excluir(id: string): Promise<void> {
    return this.repository.delete(id)
  }
}

export const createInfracaosService = (repository: InfracaosRepository) => {
  return new InfracaosService(repository)
}
