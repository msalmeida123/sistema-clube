// ============================================================
// TIPOS DO MÓDULO BAR
// ============================================================

export type StatusPedido = 'aberto' | 'aguardando_pagamento' | 'pago' | 'cancelado'
export type FormasPagamentoBar = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix' | 'carteirinha' | 'cortesia'
export type TipoMovimentoCarteirinha = 'credito' | 'debito'
export type StatusNFCe = 'pendente' | 'autorizada' | 'cancelada' | 'rejeitada' | 'contingencia'
export type AmbienteNFCe = 1 | 2  // 1=Produção, 2=Homologação

export interface BarCategoria {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  ordem: number
  created_at: string
  updated_at: string
}

export interface BarCategoriaFormData {
  nome: string
  descricao?: string
  ativo?: boolean
  ordem?: number
}

export interface BarProduto {
  id: string
  categoria_id?: string
  categoria_nome?: string
  nome: string
  descricao?: string
  preco: number
  preco_custo?: number
  ncm?: string
  cst?: string
  cfop?: string
  unidade?: string
  estoque_atual?: number
  estoque_minimo?: number
  controla_estoque?: boolean
  ativo: boolean
  imagem_url?: string
  created_at: string
  updated_at: string
}

export interface BarProdutoFormData {
  categoria_id?: string
  nome: string
  descricao?: string
  preco: number
  preco_custo?: number
  ncm?: string
  cst?: string
  cfop?: string
  unidade?: string
  estoque_atual?: number
  estoque_minimo?: number
  controla_estoque?: boolean
  ativo?: boolean
}

export interface BarItemPedido {
  id?: string
  pedido_id?: string
  produto_id: string
  produto_nome: string
  produto_ncm?: string
  produto_cfop?: string
  produto_cst?: string
  produto_unidade?: string
  quantidade: number
  preco_unitario: number
  desconto?: number
  subtotal: number
}

export interface BarPagamento {
  id?: string
  pedido_id?: string
  forma_pagamento: FormasPagamentoBar
  valor: number
  troco?: number
  referencia_externa?: string
}

export interface BarPedido {
  id: string
  numero_pedido: number
  associado_id?: string
  associado_nome?: string
  operador_id?: string
  status: StatusPedido
  subtotal: number
  desconto: number
  total: number
  observacao?: string
  mesa?: string
  itens?: BarItemPedido[]
  pagamentos?: BarPagamento[]
  created_at: string
  updated_at: string
  pago_em?: string
}

export interface ItemCarrinho {
  produto: BarProduto
  quantidade: number
  preco_unitario: number
  subtotal: number
}

export interface CriarPedidoPayload {
  associado_id?: string
  itens: {
    produto_id: string
    produto_nome: string
    produto_ncm?: string
    produto_cfop?: string
    produto_cst?: string
    produto_unidade?: string
    quantidade: number
    preco_unitario: number
    subtotal: number
  }[]
  pagamentos: {
    forma_pagamento: FormasPagamentoBar
    valor: number
    troco?: number
    referencia_externa?: string
  }[]
  subtotal: number
  desconto: number
  total: number
  observacao?: string
  mesa?: string
}

export interface CarteirinhaSaldo {
  id: string
  associado_id: string
  saldo: number
  updated_at: string
}

export interface CarteirinhaMovimento {
  id: string
  associado_id: string
  associado_nome?: string
  tipo: TipoMovimentoCarteirinha
  valor: number
  saldo_anterior: number
  saldo_posterior: number
  descricao?: string
  pedido_id?: string
  operador_id?: string
  forma_recarga?: FormasPagamentoBar
  created_at: string
}

export interface RecargaCarteirinhaPayload {
  associado_id: string
  valor: number
  forma_recarga: FormasPagamentoBar
  descricao?: string
}

export interface BarNFCe {
  id: string
  pedido_id: string
  numero?: number
  serie?: string
  chave_acesso?: string
  protocolo?: string
  status: StatusNFCe
  xml_envio?: string
  xml_retorno?: string
  qrcode?: string
  url_danfe?: string
  mensagem_retorno?: string
  cpf_cnpj_consumidor?: string
  emitido_em?: string
  created_at: string
  updated_at: string
}

export interface BarConfigNFCe {
  id: string
  acbr_url: string
  ambiente: AmbienteNFCe
  cnpj_emitente?: string
  razao_social?: string
  nome_fantasia?: string
  inscricao_estadual?: string
  crt?: number
  uf?: string
  csc_id?: string
  csc_token?: string
  serie_nfce?: string
  proximo_numero?: number
  ativo: boolean
  // Endereço do emitente (obrigatório para NFC-e)
  endereco_logradouro?: string
  endereco_numero?: string
  endereco_complemento?: string
  endereco_bairro?: string
  endereco_municipio?: string
  codigo_municipio?: string
  endereco_cep?: string
  telefone?: string
  // Responsável técnico (opcional)
  resp_tec_cnpj?: string
  resp_tec_contato?: string
  resp_tec_email?: string
  resp_tec_fone?: string
  created_at: string
  updated_at: string
}

export interface BarConfigNFCeFormData {
  acbr_url: string
  ambiente: AmbienteNFCe
  cnpj_emitente?: string
  razao_social?: string
  nome_fantasia?: string
  inscricao_estadual?: string
  crt?: number
  uf?: string
  csc_id?: string
  csc_token?: string
  serie_nfce?: string
  ativo?: boolean
  // Endereço do emitente
  endereco_logradouro?: string
  endereco_numero?: string
  endereco_complemento?: string
  endereco_bairro?: string
  endereco_municipio?: string
  codigo_municipio?: string
  endereco_cep?: string
  telefone?: string
  // Responsável técnico
  resp_tec_cnpj?: string
  resp_tec_contato?: string
  resp_tec_email?: string
  resp_tec_fone?: string
}

export interface BarPedidoFiltros {
  status?: StatusPedido
  associado_id?: string
  data_inicio?: string
  data_fim?: string
  search?: string
  caixa_id?: string
}

// ── CONTROLE DE CAIXA ─────────────────────────────────────────
export type StatusCaixa = 'aberto' | 'fechado'
export type TipoMovimentoCaixa = 'sangria' | 'suprimento'

export interface BarCaixa {
  id: string
  operador_id?: string
  operador_nome?: string
  status: StatusCaixa
  saldo_inicial: number
  total_vendas: number
  total_dinheiro: number
  total_cartao_credito: number
  total_cartao_debito: number
  total_pix: number
  total_carteirinha: number
  total_cortesia: number
  total_troco: number
  total_sangrias: number
  total_suprimentos: number
  saldo_final: number
  saldo_conferido?: number
  diferenca: number
  observacao_abertura?: string
  observacao_fechamento?: string
  aberto_em: string
  fechado_em?: string
  created_at: string
  updated_at: string
}

export interface AbrirCaixaPayload {
  saldo_inicial: number
  observacao?: string
}

export interface FecharCaixaPayload {
  saldo_conferido: number
  observacao?: string
}

export interface BarCaixaMovimento {
  id: string
  caixa_id: string
  tipo: TipoMovimentoCaixa
  valor: number
  motivo?: string
  operador_id?: string
  created_at: string
}

export interface MovimentoCaixaPayload {
  tipo: TipoMovimentoCaixa
  valor: number
  motivo?: string
}
