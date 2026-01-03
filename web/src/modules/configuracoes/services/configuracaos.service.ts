// Service de Configuracao
import type { Configuracao, ConfiguracaoFormData, ConfiguracaoFilters } from '../types'
import { ConfiguracaosRepository } from '../repositories/configuracaos.repository'

export class ConfiguracaosService {
  constructor(private repository: ConfiguracaosRepository) {}

  async listar(filters?: ConfiguracaoFilters): Promise<Configuracao[]> {
    return this.repository.findAll(filters)
  }

  async buscarPorId(id: string): Promise<Configuracao | null> {
    return this.repository.findById(id)
  }

  async criar(data: ConfiguracaoFormData): Promise<Configuracao> {
    // TODO: Adicionar validações
    return this.repository.create(data)
  }

  async atualizar(id: string, data: Partial<ConfiguracaoFormData>): Promise<Configuracao> {
    return this.repository.update(id, data)
  }

  async excluir(id: string): Promise<void> {
    return this.repository.delete(id)
  }
}

export const createConfiguracaosService = (repository: ConfiguracaosRepository) => {
  return new ConfiguracaosService(repository)
}
