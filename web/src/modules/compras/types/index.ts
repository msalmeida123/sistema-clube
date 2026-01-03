// Tipos do módulo de Compras

export type StatusCompra = 'rascunho' | 'pendente' | 'aprovada' | 'finalizada' | 'cancelada'
export type StatusPagamentoCompra = 'pendente' | 'pago' | 'parcial'

export interface Fornecedor {
  id: string
  nome: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  observacoes?: string
  ativo: boolean
  created_at: string
}

export interface Compra {
  id: string
  numero: string
  fornecedor_id?: string
  fornecedor_nome?: string
  descricao: string
  valor_total: number
  valor_pago: number
  status: StatusCompra
  status_pagamento: StatusPagamentoCompra
  data_compra: string
  data_entrega?: string
  data_pagamento?: string
  observacoes?: string
  usuario_id?: string
  usuario_nome?: string
  itens?: ItemCompra[]
  created_at: string
  updated_at?: string
}

export interface ItemCompra {
  id: string
  compra_id: string
  descricao: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  created_at: string
}

export interface CompraFilters {
  search?: string
  status?: StatusCompra
  fornecedor_id?: string
  data_inicio?: string
  data_fim?: string
}

export interface CompraFormData {
  fornecedor_id?: string
  descricao: string
  valor_total: number
  data_compra?: string
  observacoes?: string
  itens?: Omit<ItemCompra, 'id' | 'compra_id' | 'created_at'>[]
}

export interface ComprasStats {
  total_mes: number
  pendentes: number
  a_pagar: number
  quantidade_compras: number
}
