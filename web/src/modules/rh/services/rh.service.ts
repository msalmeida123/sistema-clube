// Service - Responsável APENAS por lógica de negócio do RH
import type {
  Funcionario, FuncionarioFormData, FuncionarioFilters,
  PontoDiario, PontoFilters, ResumoPonto,
  FolhaPagamento, FolhaFilters, FolhaFormData,
  Afastamento, AfastamentoFilters, AfastamentoFormData,
  RHStats
} from '../types'
import { RHRepository } from '../repositories/rh.repository'

export class RHService {
  constructor(private repository: RHRepository) {}

  // ==================== VALIDAÇÕES ====================

  private validarCPF(cpf: string): boolean {
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) return false
    if (/^(\d)\1+$/.test(cpfLimpo)) return false

    let soma = 0
    for (let i = 0; i < 9; i++) soma += parseInt(cpfLimpo.charAt(i)) * (10 - i)
    let resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(cpfLimpo.charAt(9))) return false

    soma = 0
    for (let i = 0; i < 10; i++) soma += parseInt(cpfLimpo.charAt(i)) * (11 - i)
    resto = (soma * 10) % 11
    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(cpfLimpo.charAt(10))) return false

    return true
  }

  private calcularDiasEntreDatas(inicio: string, fim: string): number {
    const dataInicio = new Date(inicio + 'T00:00:00')
    const dataFim = new Date(fim + 'T00:00:00')
    const diff = dataFim.getTime() - dataInicio.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  private calcularHorasTrabalhadas(entrada?: string, saida_almoco?: string, retorno_almoco?: string, saida?: string): number {
    if (!entrada || !saida) return 0

    const toMinutos = (hora: string) => {
      const [h, m] = hora.split(':').map(Number)
      return h * 60 + m
    }

    let minutos = toMinutos(saida) - toMinutos(entrada)

    // Descontar almoço
    if (saida_almoco && retorno_almoco) {
      minutos -= (toMinutos(retorno_almoco) - toMinutos(saida_almoco))
    }

    return Math.max(0, minutos / 60)
  }

  // ==================== FUNCIONÁRIOS ====================

  async listarFuncionarios(filters?: FuncionarioFilters): Promise<Funcionario[]> {
    return this.repository.findAllFuncionarios(filters)
  }

  async buscarFuncionarioPorId(id: string): Promise<Funcionario | null> {
    return this.repository.findFuncionarioById(id)
  }

  async criarFuncionario(data: FuncionarioFormData): Promise<Funcionario> {
    if (!this.validarCPF(data.cpf)) {
      throw new Error('CPF inválido')
    }

    const existente = await this.repository.findFuncionarioByCpf(data.cpf.replace(/\D/g, ''))
    if (existente) {
      throw new Error('CPF já cadastrado')
    }

    if (!data.nome?.trim()) throw new Error('Nome é obrigatório')
    if (!data.cargo?.trim()) throw new Error('Cargo é obrigatório')
    if (!data.departamento?.trim()) throw new Error('Departamento é obrigatório')
    if (!data.data_admissao) throw new Error('Data de admissão é obrigatória')
    if (data.salario <= 0) throw new Error('Salário deve ser maior que zero')

    return this.repository.createFuncionario({
      ...data,
      cpf: data.cpf.replace(/\D/g, ''),
      status: data.status || 'ativo',
    })
  }

  async atualizarFuncionario(id: string, data: Partial<FuncionarioFormData>): Promise<Funcionario> {
    if (data.cpf && !this.validarCPF(data.cpf)) {
      throw new Error('CPF inválido')
    }

    return this.repository.updateFuncionario(id, {
      ...data,
      cpf: data.cpf?.replace(/\D/g, ''),
    })
  }

  async desligarFuncionario(id: string, data_demissao?: string): Promise<Funcionario> {
    return this.repository.updateFuncionario(id, {
      status: 'desligado',
    } as any)
  }

  async excluirFuncionario(id: string): Promise<void> {
    const funcionario = await this.repository.findFuncionarioById(id)
    if (!funcionario) throw new Error('Funcionário não encontrado')
    return this.repository.deleteFuncionario(id)
  }

  // ==================== CONTROLE DE PONTO ====================

  async listarPontos(filters?: PontoFilters): Promise<PontoDiario[]> {
    return this.repository.findAllPontos(filters)
  }

  async registrarPonto(funcionario_id: string, data: string, campo: 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida', hora: string): Promise<PontoDiario> {
    // Verificar se já existe registro para o dia
    const existente = await this.repository.findPontoByFuncionarioData(funcionario_id, data)

    if (existente) {
      // Atualizar registro existente
      const update: Partial<PontoDiario> = { [campo]: hora }
      
      // Calcular horas trabalhadas quando tiver entrada e saída
      const entrada = campo === 'entrada' ? hora : existente.entrada
      const saida = campo === 'saida' ? hora : existente.saida
      const saida_almoco = campo === 'saida_almoco' ? hora : existente.saida_almoco
      const retorno_almoco = campo === 'retorno_almoco' ? hora : existente.retorno_almoco

      if (entrada && saida) {
        update.horas_trabalhadas = this.calcularHorasTrabalhadas(entrada, saida_almoco, retorno_almoco, saida)
        update.falta = false
      }

      return this.repository.updatePonto(existente.id, update)
    } else {
      // Criar novo registro
      return this.repository.createPonto({
        funcionario_id,
        data,
        [campo]: hora,
        falta: false,
        abonado: false,
      })
    }
  }

  async marcarFalta(funcionario_id: string, data: string, justificativa?: string): Promise<PontoDiario> {
    return this.repository.upsertPonto({
      funcionario_id,
      data,
      falta: true,
      justificativa,
      horas_trabalhadas: 0,
      abonado: false,
    })
  }

  async abonarFalta(id: string): Promise<PontoDiario> {
    return this.repository.updatePonto(id, { abonado: true })
  }

  async getResumoPonto(funcionario_id: string, mes: string): Promise<ResumoPonto> {
    const [ano, mesNum] = mes.split('-').map(Number)
    const dataInicio = `${ano}-${String(mesNum).padStart(2, '0')}-01`
    const ultimoDia = new Date(ano, mesNum, 0).getDate()
    const dataFim = `${ano}-${String(mesNum).padStart(2, '0')}-${ultimoDia}`

    const pontos = await this.repository.findAllPontos({
      funcionario_id,
      data_inicio: dataInicio,
      data_fim: dataFim,
    })

    const funcionario = await this.repository.findFuncionarioById(funcionario_id)

    return {
      funcionario_id,
      nome: funcionario?.nome || '',
      dias_trabalhados: pontos.filter(p => !p.falta && p.horas_trabalhadas).length,
      total_horas: pontos.reduce((acc, p) => acc + (p.horas_trabalhadas || 0), 0),
      horas_extras: pontos.reduce((acc, p) => acc + (p.horas_extras || 0), 0),
      faltas: pontos.filter(p => p.falta && !p.abonado).length,
      atrasos: pontos.filter(p => (p.atraso_minutos || 0) > 0).length,
    }
  }

  // ==================== FOLHA DE PAGAMENTO ====================

  async listarFolhas(filters?: FolhaFilters): Promise<FolhaPagamento[]> {
    return this.repository.findAllFolhas(filters)
  }

  async buscarFolhaPorId(id: string): Promise<FolhaPagamento | null> {
    return this.repository.findFolhaById(id)
  }

  async calcularFolha(data: FolhaFormData): Promise<FolhaPagamento> {
    const total_proventos = (data.salario_base || 0) +
      (data.horas_extras_valor || 0) +
      (data.adicional_noturno || 0) +
      (data.adicional_insalubridade || 0) +
      (data.adicional_periculosidade || 0) +
      (data.gratificacao || 0) +
      (data.comissao || 0) +
      (data.outros_proventos || 0)

    const total_descontos = (data.inss || 0) +
      (data.irrf || 0) +
      (data.vale_transporte || 0) +
      (data.vale_refeicao || 0) +
      (data.faltas_desconto || 0) +
      (data.atrasos_desconto || 0) +
      (data.adiantamento || 0) +
      (data.outros_descontos || 0)

    const salario_liquido = total_proventos - total_descontos

    return this.repository.createFolha({
      ...data,
      horas_extras_valor: data.horas_extras_valor || 0,
      adicional_noturno: data.adicional_noturno || 0,
      adicional_insalubridade: data.adicional_insalubridade || 0,
      adicional_periculosidade: data.adicional_periculosidade || 0,
      gratificacao: data.gratificacao || 0,
      comissao: data.comissao || 0,
      outros_proventos: data.outros_proventos || 0,
      inss: data.inss || 0,
      irrf: data.irrf || 0,
      vale_transporte: data.vale_transporte || 0,
      vale_refeicao: data.vale_refeicao || 0,
      faltas_desconto: data.faltas_desconto || 0,
      atrasos_desconto: data.atrasos_desconto || 0,
      adiantamento: data.adiantamento || 0,
      outros_descontos: data.outros_descontos || 0,
      total_proventos,
      total_descontos,
      salario_liquido,
    })
  }

  async aprovarFolha(id: string): Promise<FolhaPagamento> {
    const folha = await this.repository.findFolhaById(id)
    if (!folha) throw new Error('Folha não encontrada')
    if (folha.status !== 'calculada' && folha.status !== 'rascunho') {
      throw new Error('Folha não pode ser aprovada neste status')
    }
    return this.repository.updateFolha(id, { status: 'aprovada' })
  }

  async marcarFolhaComoPaga(id: string, data_pagamento?: string): Promise<FolhaPagamento> {
    const folha = await this.repository.findFolhaById(id)
    if (!folha) throw new Error('Folha não encontrada')
    if (folha.status !== 'aprovada') {
      throw new Error('Folha precisa estar aprovada para ser paga')
    }
    return this.repository.updateFolha(id, {
      status: 'paga',
      data_pagamento: data_pagamento || new Date().toISOString().split('T')[0],
    })
  }

  async gerarFolhaMensal(referencia: string): Promise<FolhaPagamento[]> {
    // Buscar todos funcionários ativos
    const funcionarios = await this.repository.findAllFuncionarios({ status: 'ativo' })
    const folhas: FolhaPagamento[] = []

    for (const func of funcionarios) {
      // Verificar se já existe folha para o mês
      const existentes = await this.repository.findAllFolhas({
        funcionario_id: func.id,
        referencia,
      })

      if (existentes.length > 0) continue

      // Calcular INSS simplificado
      const inss = this.calcularINSS(func.salario)
      const irrf = this.calcularIRRF(func.salario - inss)

      const folha = await this.calcularFolha({
        funcionario_id: func.id,
        referencia,
        salario_base: func.salario,
        inss,
        irrf,
      })

      folhas.push(folha)
    }

    return folhas
  }

  private calcularINSS(salario: number): number {
    // Faixas INSS 2025 (simplificado)
    if (salario <= 1518.00) return salario * 0.075
    if (salario <= 2793.88) return salario * 0.09
    if (salario <= 4190.83) return salario * 0.12
    if (salario <= 8157.41) return salario * 0.14
    return 951.63 // Teto
  }

  private calcularIRRF(baseCalculo: number): number {
    // Faixas IRRF 2025 (simplificado)
    if (baseCalculo <= 2259.20) return 0
    if (baseCalculo <= 2826.65) return baseCalculo * 0.075 - 169.44
    if (baseCalculo <= 3751.05) return baseCalculo * 0.15 - 381.44
    if (baseCalculo <= 4664.68) return baseCalculo * 0.225 - 662.77
    return baseCalculo * 0.275 - 896.00
  }

  // ==================== FÉRIAS E AFASTAMENTOS ====================

  async listarAfastamentos(filters?: AfastamentoFilters): Promise<Afastamento[]> {
    return this.repository.findAllAfastamentos(filters)
  }

  async buscarAfastamentoPorId(id: string): Promise<Afastamento | null> {
    return this.repository.findAfastamentoById(id)
  }

  async criarAfastamento(data: AfastamentoFormData): Promise<Afastamento> {
    if (!data.funcionario_id) throw new Error('Funcionário é obrigatório')
    if (!data.data_inicio) throw new Error('Data de início é obrigatória')
    if (!data.data_fim) throw new Error('Data de fim é obrigatória')

    if (new Date(data.data_fim) < new Date(data.data_inicio)) {
      throw new Error('Data de fim deve ser posterior à data de início')
    }

    // Verificar conflito de datas
    const existentes = await this.repository.findAllAfastamentos({
      funcionario_id: data.funcionario_id,
      status: 'aprovado',
    })

    const conflito = existentes.some(a => {
      const inicioExistente = new Date(a.data_inicio)
      const fimExistente = new Date(a.data_fim)
      const novoInicio = new Date(data.data_inicio)
      const novoFim = new Date(data.data_fim)
      return novoInicio <= fimExistente && novoFim >= inicioExistente
    })

    if (conflito) {
      throw new Error('Já existe um afastamento aprovado neste período')
    }

    const dias_totais = this.calcularDiasEntreDatas(data.data_inicio, data.data_fim)

    return this.repository.createAfastamento({ ...data, dias_totais })
  }

  async aprovarAfastamento(id: string, aprovado_por: string): Promise<Afastamento> {
    const afastamento = await this.repository.findAfastamentoById(id)
    if (!afastamento) throw new Error('Afastamento não encontrado')
    if (afastamento.status !== 'solicitado') {
      throw new Error('Apenas solicitações podem ser aprovadas')
    }

    // Atualizar status do funcionário se for férias
    if (afastamento.tipo === 'ferias') {
      await this.repository.updateFuncionario(afastamento.funcionario_id, { status: 'ferias' } as any)
    } else if (['licenca_medica', 'afastamento_inss', 'licenca_maternidade', 'licenca_paternidade'].includes(afastamento.tipo)) {
      await this.repository.updateFuncionario(afastamento.funcionario_id, { status: 'afastado' } as any)
    }

    return this.repository.updateAfastamento(id, {
      status: 'aprovado',
      aprovado_por,
      data_aprovacao: new Date().toISOString().split('T')[0],
    })
  }

  async rejeitarAfastamento(id: string, observacao?: string): Promise<Afastamento> {
    return this.repository.updateAfastamento(id, {
      status: 'rejeitado',
      observacao,
    })
  }

  async concluirAfastamento(id: string): Promise<Afastamento> {
    const afastamento = await this.repository.findAfastamentoById(id)
    if (!afastamento) throw new Error('Afastamento não encontrado')

    // Reativar funcionário
    await this.repository.updateFuncionario(afastamento.funcionario_id, { status: 'ativo' } as any)

    return this.repository.updateAfastamento(id, { status: 'concluido' })
  }

  // ==================== ESTATÍSTICAS ====================

  async obterEstatisticas(): Promise<RHStats> {
    const stats = await this.repository.getStats()
    const departamentos = await this.repository.getDepartamentoStats()

    const referencia = new Date().toISOString().slice(0, 7)
    const total_folha_mes = await this.repository.getTotalFolhaMes(referencia)

    return {
      ...stats,
      total_funcionarios: stats.total,
      total_folha_mes,
      departamentos,
    }
  }
}

// Factory function
export const createRHService = (repository: RHRepository) => {
  return new RHService(repository)
}
