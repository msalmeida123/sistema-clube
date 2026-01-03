// Service de Acesso
import type { Acesso, AcessoFormData, AcessoFilters } from '../types'
import { AcessosRepository } from '../repositories/acessos.repository'

export class AcessosService {
  constructor(private repository: AcessosRepository) {}

  async listar(filters?: AcessoFilters): Promise<Acesso[]> {
    return this.repository.findAll(filters)
  }

  async buscarPorId(id: string): Promise<Acesso | null> {
    return this.repository.findById(id)
  }

  async criar(data: AcessoFormData): Promise<Acesso> {
    // TODO: Adicionar validações
    return this.repository.create(data)
  }

  async atualizar(id: string, data: Partial<AcessoFormData>): Promise<Acesso> {
    return this.repository.update(id, data)
  }

  async excluir(id: string): Promise<void> {
    return this.repository.delete(id)
  }
}

export const createAcessosService = (repository: AcessosRepository) => {
  return new AcessosService(repository)
}
