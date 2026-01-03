// Service de Contato
import type { Contato, ContatoFormData, ContatoFilters } from '../types'
import { ContatosRepository } from '../repositories/contatos.repository'

export class ContatosService {
  constructor(private repository: ContatosRepository) {}

  async listar(filters?: ContatoFilters): Promise<Contato[]> {
    return this.repository.findAll(filters)
  }

  async buscarPorId(id: string): Promise<Contato | null> {
    return this.repository.findById(id)
  }

  async criar(data: ContatoFormData): Promise<Contato> {
    // TODO: Adicionar validações
    return this.repository.create(data)
  }

  async atualizar(id: string, data: Partial<ContatoFormData>): Promise<Contato> {
    return this.repository.update(id, data)
  }

  async excluir(id: string): Promise<void> {
    return this.repository.delete(id)
  }
}

export const createContatosService = (repository: ContatosRepository) => {
  return new ContatosService(repository)
}
