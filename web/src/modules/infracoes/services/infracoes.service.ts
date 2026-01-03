// Service Infrações
import type { Infracao, InfracaoFilters, InfracaoFormData, TipoPenalidade } from '../types'
import { InfracoesRepository } from '../repositories/infracoes.repository'

export class InfracoesService {
  constructor(private repository: InfracoesRepository) {}

  async listar(filters?: InfracaoFilters): Promise<Infracao[]> {
    return this.repository.findInfracoes(filters)
  }

  async buscarPorId(id: string): Promise<Infracao | null> {
    return this.repository.findInfracaoById(id)
  }

  async registrar(data: InfracaoFormData, registrado_por?: string): Promise<Infracao> {
    if (!data.associado_id) throw new Error('Associado é obrigatório')
    if (!data.descricao?.trim()) throw new Error('Descrição é obrigatória')
    if (!data.data_ocorrencia) throw new Error('Data da ocorrência é obrigatória')
    return this.repository.createInfracao({ ...data, registrado_por })
  }

  async iniciarAnalise(id: string): Promise<Infracao> {
    return this.repository.updateInfracao(id, { status: 'em_analise' })
  }

  async julgar(id: string, penalidade: TipoPenalidade, parecer: string, opcoes?: { dias_suspensao?: number; valor_multa?: number }): Promise<Infracao> {
    const infracao = await this.repository.findInfracaoById(id)
    if (!infracao) throw new Error('Infração não encontrada')

    return this.repository.updateInfracao(id, {
      status: 'julgada',
      penalidade,
      parecer,
      data_julgamento: new Date().toISOString().split('T')[0],
      dias_suspensao: opcoes?.dias_suspensao,
      valor_multa: opcoes?.valor_multa
    })
  }

  async arquivar(id: string, motivo: string): Promise<Infracao> {
    return this.repository.updateInfracao(id, { status: 'arquivada', parecer: `Arquivada: ${motivo}` })
  }

  async excluir(id: string): Promise<void> {
    const infracao = await this.repository.findInfracaoById(id)
    if (infracao?.status === 'julgada') throw new Error('Infração julgada não pode ser excluída')
    return this.repository.deleteInfracao(id)
  }

  async obterEstatisticas() {
    return this.repository.getStats()
  }
}

export const createInfracoesService = (repository: InfracoesRepository) => new InfracoesService(repository)
