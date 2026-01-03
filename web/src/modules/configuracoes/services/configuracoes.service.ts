// Service Configurações
import type { ConfiguracaoClube, Plano, Quiosque, SicoobConfig, WaSenderConfig } from '../types'
import { ConfiguracoesRepository } from '../repositories/configuracoes.repository'

export class ConfiguracoesService {
  constructor(private repository: ConfiguracoesRepository) {}

  // ===== CONFIGURAÇÕES GERAIS =====

  async obterConfiguracao(): Promise<ConfiguracaoClube | null> {
    return this.repository.getConfiguracao()
  }

  async atualizarConfiguracao(data: Partial<ConfiguracaoClube>): Promise<ConfiguracaoClube> {
    return this.repository.updateConfiguracao(data)
  }

  async configurarSicoob(config: SicoobConfig): Promise<ConfiguracaoClube> {
    return this.repository.updateConfiguracao({
      sicoob_client_id: config.client_id,
      sicoob_client_secret: config.client_secret,
      sicoob_numero_contrato: config.numero_contrato,
      sicoob_ativo: true
    })
  }

  async configurarWaSender(config: WaSenderConfig): Promise<ConfiguracaoClube> {
    return this.repository.updateConfiguracao({
      wasender_api_key: config.api_key,
      wasender_device_id: config.device_id,
      wasender_ativo: true
    })
  }

  // ===== PLANOS =====

  async listarPlanos(): Promise<Plano[]> {
    return this.repository.findPlanos()
  }

  async buscarPlano(id: string): Promise<Plano | null> {
    return this.repository.findPlanoById(id)
  }

  async criarPlano(data: Partial<Plano>): Promise<Plano> {
    if (!data.nome?.trim()) throw new Error('Nome é obrigatório')
    if (!data.codigo?.trim()) throw new Error('Código é obrigatório')
    if (!data.valor_mensal || data.valor_mensal <= 0) throw new Error('Valor mensal é obrigatório')
    return this.repository.createPlano(data)
  }

  async atualizarPlano(id: string, data: Partial<Plano>): Promise<Plano> {
    return this.repository.updatePlano(id, data)
  }

  async excluirPlano(id: string): Promise<void> {
    return this.repository.deletePlano(id)
  }

  // ===== QUIOSQUES =====

  async listarQuiosques(): Promise<Quiosque[]> {
    return this.repository.findQuiosques()
  }

  async buscarQuiosque(id: string): Promise<Quiosque | null> {
    return this.repository.findQuiosqueById(id)
  }

  async criarQuiosque(data: Partial<Quiosque>): Promise<Quiosque> {
    if (!data.nome?.trim()) throw new Error('Nome é obrigatório')
    return this.repository.createQuiosque(data)
  }

  async atualizarQuiosque(id: string, data: Partial<Quiosque>): Promise<Quiosque> {
    return this.repository.updateQuiosque(id, data)
  }

  async excluirQuiosque(id: string): Promise<void> {
    return this.repository.deleteQuiosque(id)
  }
}

export const createConfiguracoesService = (repository: ConfiguracoesRepository) => new ConfiguracoesService(repository)
