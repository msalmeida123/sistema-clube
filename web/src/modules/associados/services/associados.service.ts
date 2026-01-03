// Service - Responsável APENAS por lógica de negócio
import type { Associado, AssociadoFormData, AssociadoFilters } from '../types'
import { AssociadosRepository } from '../repositories/associados.repository'

export class AssociadosService {
  constructor(private repository: AssociadosRepository) {}

  // Validação de CPF
  private validarCPF(cpf: string): boolean {
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) return false
    if (/^(\d)\1+$/.test(cpfLimpo)) return false
    
    let soma = 0
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (10 - i)
    }
    let resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(cpfLimpo.charAt(9))) return false
    
    soma = 0
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i)) * (11 - i)
    }
    resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(cpfLimpo.charAt(10))) return false
    
    return true
  }

  // Gerar número de título
  private async gerarNumeroTitulo(): Promise<string> {
    const ano = new Date().getFullYear()
    const associados = await this.repository.findAll()
    const ultimoNumero = associados.length + 1
    return `${ano}${String(ultimoNumero).padStart(5, '0')}`
  }

  // Listar associados com filtros
  async listar(filters?: AssociadoFilters): Promise<Associado[]> {
    return this.repository.findAll(filters)
  }

  // Buscar por ID
  async buscarPorId(id: string): Promise<Associado | null> {
    return this.repository.findById(id)
  }

  // Criar novo associado
  async criar(data: AssociadoFormData): Promise<Associado> {
    // Validar CPF
    if (!this.validarCPF(data.cpf)) {
      throw new Error('CPF inválido')
    }

    // Verificar se CPF já existe
    const existente = await this.repository.findByCpf(data.cpf.replace(/\D/g, ''))
    if (existente) {
      throw new Error('CPF já cadastrado')
    }

    // Validar dados obrigatórios
    if (!data.nome?.trim()) {
      throw new Error('Nome é obrigatório')
    }

    // Criar com número de título
    const numeroTitulo = await this.gerarNumeroTitulo()
    
    return this.repository.create({
      ...data,
      cpf: data.cpf.replace(/\D/g, ''),
      status: data.status || 'ativo',
    })
  }

  // Atualizar associado
  async atualizar(id: string, data: Partial<AssociadoFormData>): Promise<Associado> {
    // Validar CPF se foi alterado
    if (data.cpf && !this.validarCPF(data.cpf)) {
      throw new Error('CPF inválido')
    }

    return this.repository.update(id, {
      ...data,
      cpf: data.cpf?.replace(/\D/g, ''),
    })
  }

  // Desativar associado
  async desativar(id: string): Promise<Associado> {
    return this.repository.update(id, { status: 'inativo' })
  }

  // Reativar associado
  async reativar(id: string): Promise<Associado> {
    return this.repository.update(id, { status: 'ativo' })
  }

  // Suspender associado
  async suspender(id: string): Promise<Associado> {
    return this.repository.update(id, { status: 'suspenso' })
  }

  // Excluir associado
  async excluir(id: string): Promise<void> {
    // Verificar se pode excluir (regra de negócio)
    const associado = await this.repository.findById(id)
    if (!associado) {
      throw new Error('Associado não encontrado')
    }

    // Não permitir excluir se tiver pendências financeiras
    // TODO: Implementar verificação de pendências

    return this.repository.delete(id)
  }

  // Obter estatísticas
  async obterEstatisticas() {
    return this.repository.getStats()
  }

  // Verificar se associado está adimplente
  async verificarAdimplencia(id: string): Promise<boolean> {
    // TODO: Implementar verificação de adimplência
    return true
  }
}

// Factory function
export const createAssociadosService = (repository: AssociadosRepository) => {
  return new AssociadosService(repository)
}
