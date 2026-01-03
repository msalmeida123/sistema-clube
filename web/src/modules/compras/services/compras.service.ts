// Service Compras - Responsável APENAS por lógica de negócio
import type { Compra, CompraFilters, CompraFormData, Fornecedor, StatusCompra } from '../types'
import { ComprasRepository } from '../repositories/compras.repository'

export class ComprasService {
  constructor(private repository: ComprasRepository) {}

  async listar(filters?: CompraFilters): Promise<Compra[]> {
    return this.repository.findCompras(filters)
  }

  async buscarPorId(id: string): Promise<Compra | null> {
    return this.repository.findCompraById(id)
  }

  async criar(data: CompraFormData, usuario_id?: string): Promise<Compra> {
    if (!data.descricao?.trim()) {
      throw new Error('Descrição é obrigatória')
    }

    if (data.valor_total <= 0) {
      throw new Error('Valor deve ser maior que zero')
    }

    const numero = await this.repository.getProximoNumero()

    return this.repository.createCompra({
      ...data,
      numero,
      usuario_id
    })
  }

  async atualizar(id: string, data: Partial<CompraFormData>): Promise<Compra> {
    return this.repository.updateCompra(id, data)
  }

  async aprovar(id: string): Promise<Compra> {
    const compra = await this.repository.findCompraById(id)
    
    if (!compra) {
      throw new Error('Compra não encontrada')
    }

    if (compra.status !== 'pendente') {
      throw new Error('Apenas compras pendentes podem ser aprovadas')
    }

    return this.repository.updateCompra(id, { status: 'aprovada' } as any)
  }

  async finalizar(id: string): Promise<Compra> {
    const compra = await this.repository.findCompraById(id)
    
    if (!compra) {
      throw new Error('Compra não encontrada')
    }

    return this.repository.updateCompra(id, { status: 'finalizada' } as any)
  }

  async cancelar(id: string, motivo?: string): Promise<Compra> {
    const compra = await this.repository.findCompraById(id)
    
    if (!compra) {
      throw new Error('Compra não encontrada')
    }

    if (compra.status === 'finalizada') {
      throw new Error('Compra finalizada não pode ser cancelada')
    }

    return this.repository.updateCompra(id, { 
      status: 'cancelada',
      observacoes: motivo ? `Cancelada: ${motivo}` : compra.observacoes
    } as any)
  }

  async registrarPagamento(id: string, valor: number): Promise<Compra> {
    const compra = await this.repository.findCompraById(id)
    
    if (!compra) {
      throw new Error('Compra não encontrada')
    }

    const novoValorPago = (compra.valor_pago || 0) + valor
    const statusPagamento = novoValorPago >= compra.valor_total ? 'pago' : 'parcial'

    return this.repository.updateCompra(id, {
      valor_pago: novoValorPago,
      status_pagamento: statusPagamento,
      data_pagamento: statusPagamento === 'pago' ? new Date().toISOString().split('T')[0] : undefined
    } as any)
  }

  async excluir(id: string): Promise<void> {
    const compra = await this.repository.findCompraById(id)
    
    if (!compra) {
      throw new Error('Compra não encontrada')
    }

    if (compra.status === 'finalizada' || compra.status === 'aprovada') {
      throw new Error('Compra aprovada ou finalizada não pode ser excluída')
    }

    return this.repository.deleteCompra(id)
  }

  // ===== FORNECEDORES =====

  async listarFornecedores(): Promise<Fornecedor[]> {
    return this.repository.findFornecedores()
  }

  async criarFornecedor(data: Partial<Fornecedor>): Promise<Fornecedor> {
    if (!data.nome?.trim()) {
      throw new Error('Nome do fornecedor é obrigatório')
    }

    return this.repository.createFornecedor(data)
  }

  // ===== ESTATÍSTICAS =====

  async obterEstatisticas() {
    return this.repository.getStats()
  }
}

export const createComprasService = (repository: ComprasRepository) => {
  return new ComprasService(repository)
}
