// Service de Mensalidade
import type { Mensalidade, MensalidadeFormData, MensalidadeFilters } from '../types'
import { MensalidadesRepository } from '../repositories/mensalidades.repository'

export class MensalidadesService {
  constructor(private repository: MensalidadesRepository) {}

  async listar(filters?: MensalidadeFilters): Promise<Mensalidade[]> {
    return this.repository.findAll(filters)
  }

  async buscarPorId(id: string): Promise<Mensalidade | null> {
    return this.repository.findById(id)
  }

  async criar(data: MensalidadeFormData): Promise<Mensalidade> {
    // TODO: Adicionar validações
    return this.repository.create(data)
  }

  async atualizar(id: string, data: Partial<MensalidadeFormData>): Promise<Mensalidade> {
    return this.repository.update(id, data)
  }

  async excluir(id: string): Promise<void> {
    return this.repository.delete(id)
  }
}

export const createMensalidadesService = (repository: MensalidadesRepository) => {
  return new MensalidadesService(repository)
}
