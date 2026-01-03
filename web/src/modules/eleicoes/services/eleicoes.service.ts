// Service Eleições
import type { Eleicao, EleicaoFilters, EleicaoFormData, Candidato, ResultadoEleicao } from '../types'
import { EleicoesRepository } from '../repositories/eleicoes.repository'

export class EleicoesService {
  constructor(private repository: EleicoesRepository) {}

  async listar(filters?: EleicaoFilters): Promise<Eleicao[]> {
    return this.repository.findEleicoes(filters)
  }

  async buscarPorId(id: string): Promise<Eleicao | null> {
    return this.repository.findEleicaoById(id)
  }

  async criar(data: EleicaoFormData): Promise<Eleicao> {
    if (!data.titulo?.trim()) throw new Error('Título é obrigatório')
    if (!data.data_inicio || !data.data_fim) throw new Error('Datas são obrigatórias')
    if (new Date(data.data_fim) <= new Date(data.data_inicio)) {
      throw new Error('Data fim deve ser maior que data início')
    }
    return this.repository.createEleicao(data)
  }

  async iniciar(id: string): Promise<Eleicao> {
    const eleicao = await this.repository.findEleicaoById(id)
    if (!eleicao) throw new Error('Eleição não encontrada')
    if (eleicao.status !== 'agendada') throw new Error('Eleição não pode ser iniciada')
    return this.repository.updateEleicao(id, { status: 'em_andamento' })
  }

  async encerrar(id: string): Promise<Eleicao> {
    const eleicao = await this.repository.findEleicaoById(id)
    if (!eleicao) throw new Error('Eleição não encontrada')
    if (eleicao.status !== 'em_andamento') throw new Error('Eleição não está em andamento')
    return this.repository.updateEleicao(id, { status: 'encerrada' })
  }

  async adicionarCandidato(eleicao_id: string, data: Partial<Candidato>): Promise<Candidato> {
    if (!data.nome?.trim()) throw new Error('Nome é obrigatório')
    if (!data.cargo?.trim()) throw new Error('Cargo é obrigatório')
    if (!data.numero) throw new Error('Número é obrigatório')
    return this.repository.createCandidato({ ...data, eleicao_id })
  }

  async votar(eleicao_id: string, associado_id: string, candidato_id?: string): Promise<void> {
    const eleicao = await this.repository.findEleicaoById(eleicao_id)
    if (!eleicao) throw new Error('Eleição não encontrada')
    if (eleicao.status !== 'em_andamento') throw new Error('Eleição não está em andamento')

    const jaVotou = await this.repository.verificarVotou(eleicao_id, associado_id)
    if (jaVotou) throw new Error('Você já votou nesta eleição')

    await this.repository.registrarVoto(eleicao_id, associado_id, candidato_id)
  }

  async obterResultado(id: string): Promise<ResultadoEleicao> {
    const eleicao = await this.repository.findEleicaoById(id)
    if (!eleicao) throw new Error('Eleição não encontrada')

    const candidatos = await this.repository.findCandidatos(id)
    const totalVotos = eleicao.total_votos || candidatos.reduce((sum, c) => sum + c.votos, 0) + eleicao.votos_brancos

    return {
      eleicao,
      candidatos: candidatos.map(c => ({
        ...c,
        percentual: totalVotos > 0 ? (c.votos / totalVotos) * 100 : 0
      })),
      total_votos: totalVotos,
      votos_brancos: eleicao.votos_brancos,
      participacao: 0 // TODO: calcular baseado no total de associados
    }
  }
}

export const createEleicoesService = (repository: EleicoesRepository) => new EleicoesService(repository)
