// Service Exames Médicos
import type { ExameMedico, ExameFilters, ExameFormData } from '../types'
import { ExamesRepository } from '../repositories/exames.repository'

export class ExamesService {
  constructor(private repository: ExamesRepository) {}

  async listar(filters?: ExameFilters): Promise<ExameMedico[]> {
    return this.repository.findExames(filters)
  }

  async buscarPorId(id: string): Promise<ExameMedico | null> {
    return this.repository.findExameById(id)
  }

  async criar(data: ExameFormData): Promise<ExameMedico> {
    if (!data.pessoa_id) throw new Error('Pessoa é obrigatória')
    if (!data.data_exame) throw new Error('Data do exame é obrigatória')
    if (!data.data_validade) throw new Error('Data de validade é obrigatória')
    if (new Date(data.data_validade) <= new Date(data.data_exame)) {
      throw new Error('Data de validade deve ser posterior à data do exame')
    }
    return this.repository.createExame(data)
  }

  async aprovar(id: string, resultado?: string): Promise<ExameMedico> {
    return this.repository.updateExame(id, { status: 'aprovado', resultado })
  }

  async reprovar(id: string, motivo?: string): Promise<ExameMedico> {
    return this.repository.updateExame(id, { status: 'reprovado', observacoes: motivo })
  }

  async atualizar(id: string, data: Partial<ExameFormData>): Promise<ExameMedico> {
    return this.repository.updateExame(id, data)
  }

  async excluir(id: string): Promise<void> {
    return this.repository.deleteExame(id)
  }

  async obterEstatisticas() {
    return this.repository.getStats()
  }

  async listarVencidos(): Promise<ExameMedico[]> {
    return this.repository.findExames({ vencidos: true })
  }

  async listarAVencer(dias: number = 30): Promise<ExameMedico[]> {
    return this.repository.findExames({ a_vencer: dias })
  }
}

export const createExamesService = (repository: ExamesRepository) => new ExamesService(repository)
