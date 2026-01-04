// Tipos do módulo Financeiro

export type StatusPagamento = 'pendente' | 'pago' | 'atrasado' | 'cancelado'
export type TipoLancamento = 'mensalidade' | 'taxa' | 'multa' | 'desconto' | 'outros'
export type FormaPagamento = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'boleto' | 'transferencia'

export interface Mensalidade {
  id: string
  associado_id: string
  associado_nome?: string
  referencia: string // "2026-01"
  valor: number
  valor_pago?: number
  desconto?: number
  multa?: number
  juros?: number
  data_vencimento: string
  data_pagamento?: string
  status: StatusPagamento
  forma_pagamento?: FormaPagamento
  observacao?: string
  created_at: string
  updated_at?: string
}

export interface Lancamento {
  id: string
  associado_id: string
  tipo: TipoLancamento
  descricao: string
  valor: number
  data_lancamento: string
  data_vencimento?: string
  data_pagamento?: string
  status: StatusPagamento
  created_at: string
}

export interface Carne {
  id: string
  associado_id: string
  associado_nome?: string
  ano: number
  quantidade_parcelas: number
  valor_parcela: number
  valor_total: number
  data_geracao: string
  status: 'ativo' | 'quitado' | 'cancelado'
  parcelas?: Mensalidade[]
  created_at: string
}

export interface MensalidadeFilters {
  search?: string
  associado_id?: string
  status?: StatusPagamento
  referencia?: string
  ano?: number
  dataInicio?: string
  dataFim?: string
  data_inicio?: string
  data_fim?: string
}

export interface MensalidadeFormData {
  associado_id: string
  referencia: string
  valor: number
  data_vencimento: string
  desconto?: number
  observacao?: string
  status?: StatusPagamento
}

export interface FinanceiroStats {
  total_receber: number
  total_recebido: number
  total_atrasado: number
  inadimplentes: number
  // Campos usados nos componentes de stats (opcionais)
  receitaMes?: number
  despesaMes?: number
  aReceber?: number
  aPagar?: number
  mensalidadesPagas?: number
  parcelasPagas?: number
  convitesMes?: number
}

export interface ResumoMensal {
  mes: string
  receita: number
  despesas: number
  saldo: number
}

export interface ResumoFinanceiro {
  // snake_case
  total_receber?: number
  total_recebido?: number
  total_atrasado?: number
  inadimplentes?: number
  adimplentes?: number
  // camelCase
  totalReceber?: number
  totalRecebido?: number
  totalAtrasado?: number
}
