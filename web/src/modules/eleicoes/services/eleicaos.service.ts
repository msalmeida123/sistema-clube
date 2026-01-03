// Service de Eleicao
import type { Eleicao, EleicaoFormData, EleicaoFilters } from '../types'
import { EleicaosRepository } from '../repositories/eleicaos.repository'

export class EleicaosService {
  constructor(private repository: EleicaosRepository) {}

  async listar(filters?: EleicaoFilters): Promise<Eleicao[]> {
    return this.repository.findAll(filters)
  }

  async buscarPorId(id: string): Promise<Eleicao | null> {
    return this.repository.findById(id)
  }

  async criar(data: EleicaoFormData): Promise<Eleicao> {
    // TODO: Adicionar validações
    return this.repository.create(data)
  }

  async atualizar(id: string, data: Partial<EleicaoFormData>): Promise<Eleicao> {
    return this.repository.update(id, data)
  }

  async excluir(id: string): Promise<void> {
    return this.repository.delete(id)
  }
}

export const createEleicaosService = (repository: EleicaosRepository) => {
  return new EleicaosService(repository)
}
