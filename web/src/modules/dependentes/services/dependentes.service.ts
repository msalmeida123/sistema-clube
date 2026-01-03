// Service de Dependentes
import type { Dependente, DependenteFormData, DependenteFilters } from '../types'
import { DependentesRepository } from '../repositories/dependentes.repository'

export class DependentesService {
  constructor(private repository: DependentesRepository) {}

  async listar(filters?: DependenteFilters): Promise<Dependente[]> {
    return this.repository.findAll(filters)
  }

  async buscarPorId(id: string): Promise<Dependente | null> {
    return this.repository.findById(id)
  }

  async buscarPorAssociado(associadoId: string): Promise<Dependente[]> {
    return this.repository.findByAssociado(associadoId)
  }

  async criar(data: DependenteFormData): Promise<Dependente> {
    if (!data.nome?.trim()) {
      throw new Error('Nome é obrigatório')
    }
    if (!data.associado_id) {
      throw new Error('Associado é obrigatório')
    }
    if (!data.parentesco) {
      throw new Error('Parentesco é obrigatório')
    }

    return this.repository.create(data)
  }

  async atualizar(id: string, data: Partial<DependenteFormData>): Promise<Dependente> {
    return this.repository.update(id, data)
  }

  async excluir(id: string): Promise<void> {
    return this.repository.delete(id)
  }

  async contarPorAssociado(associadoId: string): Promise<number> {
    return this.repository.count(associadoId)
  }
}

export const createDependentesService = (repository: DependentesRepository) => {
  return new DependentesService(repository)
}
