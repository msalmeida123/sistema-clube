-- =====================================================
-- COMPRAS E COTAÇÕES
-- =====================================================

-- Solicitações de Compra
CREATE TABLE solicitacoes_compra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitante_id UUID NOT NULL REFERENCES usuarios(id),
  centro_custo_id UUID REFERENCES centros_custo(id),
  descricao TEXT NOT NULL,
  justificativa TEXT,
  urgencia VARCHAR(20) DEFAULT 'normal', -- baixa, normal, alta, urgente
  status status_cotacao DEFAULT 'pendente',
  data_necessidade DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cotações (mínimo 3 por solicitação)
CREATE TABLE cotacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes_compra(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),
  valor DECIMAL(10,2) NOT NULL,
  prazo_entrega INTEGER, -- dias
  condicao_pagamento TEXT,
  validade_proposta DATE,
  arquivo_url TEXT,
  observacoes TEXT,
  selecionada BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_cotacoes_solicitacao ON cotacoes(solicitacao_id);

-- Aprovações de Compra
CREATE TABLE aprovacoes_compra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes_compra(id),
  cotacao_id UUID REFERENCES cotacoes(id),
  aprovador_id UUID NOT NULL REFERENCES usuarios(id),
  aprovado BOOLEAN NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ordens de Compra
CREATE TABLE ordens_compra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero SERIAL UNIQUE,
  solicitacao_id UUID NOT NULL REFERENCES solicitacoes_compra(id),
  cotacao_id UUID NOT NULL REFERENCES cotacoes(id),
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),
  valor_total DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'emitida', -- emitida, enviada, entregue, cancelada
  data_emissao DATE DEFAULT CURRENT_DATE,
  data_entrega DATE,
  nota_fiscal VARCHAR(100),
  nota_fiscal_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movimentações Financeiras (Fluxo de Caixa)
CREATE TABLE movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conta_id UUID NOT NULL REFERENCES contas_bancarias(id),
  tipo VARCHAR(20) NOT NULL, -- entrada, saida
  categoria_id UUID REFERENCES categorias_financeiras(id),
  centro_custo_id UUID REFERENCES centros_custo(id),
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_movimentacao DATE NOT NULL,
  
  -- Referências opcionais
  mensalidade_id UUID REFERENCES mensalidades(id),
  conta_pagar_id UUID REFERENCES contas_pagar(id),
  ordem_compra_id UUID REFERENCES ordens_compra(id),
  
  comprovante_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_movimentacoes_conta ON movimentacoes(conta_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes(data_movimentacao);

