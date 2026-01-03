// Service Financeiro - Responsável APENAS por lógica de negócio
import type { Mensalidade, MensalidadeFilters, FormaPagamento, Carne } from '../types'
import { FinanceiroRepository } from '../repositories/financeiro.repository'

export class FinanceiroService {
  constructor(private repository: FinanceiroRepository) {}

  // ===== MENSALIDADES =====

  async listarMensalidades(filters?: MensalidadeFilters): Promise<Mensalidade[]> {
    return this.repository.findMensalidades(filters)
  }

  async buscarMensalidade(id: string): Promise<Mensalidade | null> {
    return this.repository.findMensalidadeById(id)
  }

  async gerarMensalidade(
    associado_id: string,
    valor: number,
    referencia: string,
    data_vencimento: string
  ): Promise<Mensalidade> {
    // Validar referência (formato YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(referencia)) {
      throw new Error('Referência deve estar no formato YYYY-MM')
    }

    // Validar valor
    if (valor <= 0) {
      throw new Error('Valor deve ser maior que zero')
    }

    return this.repository.createMensalidade({
      associado_id,
      valor,
      referencia,
      data_vencimento,
      status: 'pendente'
    })
  }

  async registrarPagamento(
    id: string,
    valor_pago: number,
    forma_pagamento: FormaPagamento,
    data_pagamento?: string
  ): Promise<Mensalidade> {
    const mensalidade = await this.repository.findMensalidadeById(id)
    
    if (!mensalidade) {
      throw new Error('Mensalidade não encontrada')
    }

    if (mensalidade.status === 'pago') {
      throw new Error('Mensalidade já está paga')
    }

    if (mensalidade.status === 'cancelado') {
      throw new Error('Mensalidade está cancelada')
    }

    // Calcular se há diferença
    const valorTotal = mensalidade.valor + (mensalidade.multa || 0) + (mensalidade.juros || 0) - (mensalidade.desconto || 0)
    
    if (valor_pago < valorTotal) {
      // Pagamento parcial - manter como pendente
      return this.repository.updateMensalidade(id, {
        valor_pago,
        forma_pagamento,
        data_pagamento: data_pagamento || new Date().toISOString().split('T')[0],
        observacao: `Pagamento parcial: R$ ${valor_pago.toFixed(2)} de R$ ${valorTotal.toFixed(2)}`
      })
    }

    return this.repository.updateMensalidade(id, {
      valor_pago,
      forma_pagamento,
      data_pagamento: data_pagamento || new Date().toISOString().split('T')[0],
      status: 'pago'
    })
  }

  async aplicarDesconto(id: string, desconto: number, motivo?: string): Promise<Mensalidade> {
    const mensalidade = await this.repository.findMensalidadeById(id)
    
    if (!mensalidade) {
      throw new Error('Mensalidade não encontrada')
    }

    if (desconto < 0 || desconto > mensalidade.valor) {
      throw new Error('Desconto inválido')
    }

    return this.repository.updateMensalidade(id, {
      desconto,
      observacao: motivo || `Desconto aplicado: R$ ${desconto.toFixed(2)}`
    })
  }

  async cancelarMensalidade(id: string, motivo: string): Promise<Mensalidade> {
    const mensalidade = await this.repository.findMensalidadeById(id)
    
    if (!mensalidade) {
      throw new Error('Mensalidade não encontrada')
    }

    if (mensalidade.status === 'pago') {
      throw new Error('Não é possível cancelar mensalidade já paga')
    }

    return this.repository.updateMensalidade(id, {
      status: 'cancelado',
      observacao: `Cancelado: ${motivo}`
    })
  }

  async calcularMultaJuros(mensalidade: Mensalidade): Promise<{ multa: number; juros: number }> {
    const hoje = new Date()
    const vencimento = new Date(mensalidade.data_vencimento)
    
    if (hoje <= vencimento) {
      return { multa: 0, juros: 0 }
    }

    const diasAtraso = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24))
    
    // Multa de 2% após vencimento
    const multa = mensalidade.valor * 0.02
    
    // Juros de 1% ao mês (proporcional aos dias)
    const juros = mensalidade.valor * (0.01 / 30) * diasAtraso

    return { 
      multa: Math.round(multa * 100) / 100, 
      juros: Math.round(juros * 100) / 100 
    }
  }

  // ===== CARNÊS =====

  async gerarCarne(
    associado_id: string,
    ano: number,
    quantidade_parcelas: number,
    valor_parcela: number,
    dia_vencimento: number = 10
  ): Promise<Carne> {
    if (quantidade_parcelas < 1 || quantidade_parcelas > 12) {
      throw new Error('Quantidade de parcelas deve ser entre 1 e 12')
    }

    if (valor_parcela <= 0) {
      throw new Error('Valor da parcela deve ser maior que zero')
    }

    const valor_total = quantidade_parcelas * valor_parcela

    // Criar carnê
    const carne = await this.repository.createCarne({
      associado_id,
      ano,
      quantidade_parcelas,
      valor_parcela,
      valor_total,
      data_geracao: new Date().toISOString(),
      status: 'ativo'
    })

    // Gerar mensalidades
    for (let i = 0; i < quantidade_parcelas; i++) {
      const mes = String(i + 1).padStart(2, '0')
      const referencia = `${ano}-${mes}`
      const data_vencimento = `${ano}-${mes}-${String(dia_vencimento).padStart(2, '0')}`

      await this.repository.createMensalidade({
        associado_id,
        valor: valor_parcela,
        referencia,
        data_vencimento,
        status: 'pendente'
      })
    }

    return carne
  }

  async listarCarnes(associado_id?: string): Promise<Carne[]> {
    return this.repository.findCarnes(associado_id)
  }

  // ===== RELATÓRIOS =====

  async obterEstatisticas() {
    return this.repository.getStats()
  }

  async listarInadimplentes(): Promise<Mensalidade[]> {
    const hoje = new Date().toISOString().split('T')[0]
    return this.repository.findMensalidades({
      status: 'pendente',
      data_fim: hoje
    })
  }

  async calcularResumoMensal(ano: number, mes: number) {
    const referencia = `${ano}-${String(mes).padStart(2, '0')}`
    const mensalidades = await this.repository.findMensalidades({ referencia })

    const receita = mensalidades
      .filter(m => m.status === 'pago')
      .reduce((sum, m) => sum + (m.valor_pago || 0), 0)

    const pendente = mensalidades
      .filter(m => m.status === 'pendente')
      .reduce((sum, m) => sum + m.valor, 0)

    return {
      referencia,
      total_esperado: mensalidades.reduce((sum, m) => sum + m.valor, 0),
      receita,
      pendente,
      quantidade_pagas: mensalidades.filter(m => m.status === 'pago').length,
      quantidade_pendentes: mensalidades.filter(m => m.status === 'pendente').length
    }
  }
}

export const createFinanceiroService = (repository: FinanceiroRepository) => {
  return new FinanceiroService(repository)
}
