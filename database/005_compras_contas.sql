-- =============================================
-- CONTAS E COMPRAS
-- =============================================

-- Categorias de Despesa
CREATE TABLE categorias_despesa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Centro de Custo
CREATE TABLE centros_custo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fornecedores
CREATE TABLE fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(18),
    cpf VARCHAR(14),
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    banco VARCHAR(100),
    agencia VARCHAR(20),
    conta VARCHAR(30),
    pix VARCHAR(100),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX idx_fornecedores_nome ON fornecedores(razao_social);

-- Solicitações de Compra
CREATE TABLE solicitacoes_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INTEGER UNIQUE NOT NULL,
    solicitante_id UUID NOT NULL REFERENCES usuarios(id),
    descricao TEXT NOT NULL,
    justificativa TEXT,
    centro_custo_id UUID REFERENCES centros_custo(id),
    categoria_id UUID REFERENCES categorias_despesa(id),
    valor_estimado DECIMAL(10,2),
    status status_compra DEFAULT 'solicitado',
    data_necessidade DATE,
    aprovado_por UUID REFERENCES usuarios(id),
    data_aprovacao TIMESTAMPTZ,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_solicitacoes_status ON solicitacoes_compra(status);
CREATE INDEX idx_solicitacoes_numero ON solicitacoes_compra(numero);

-- Cotações (3 obrigatórias)
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cotacoes_solicitacao ON cotacoes(solicitacao_id);

-- Ordens de Compra
CREATE TABLE ordens_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INTEGER UNIQUE NOT NULL,
    solicitacao_id UUID NOT NULL REFERENCES solicitacoes_compra(id),
    cotacao_id UUID NOT NULL REFERENCES cotacoes(id),
    fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),
    valor_total DECIMAL(10,2) NOT NULL,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_entrega_prevista DATE,
    data_entrega_real DATE,
    nota_fiscal VARCHAR(50),
    nota_fiscal_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contas a Pagar
CREATE TABLE contas_pagar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ordem_compra_id UUID REFERENCES ordens_compra(id),
    fornecedor_id UUID REFERENCES fornecedores(id),
    descricao TEXT NOT NULL,
    categoria_id UUID REFERENCES categorias_despesa(id),
    centro_custo_id UUID REFERENCES centros_custo(id),
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento TIMESTAMPTZ,
    valor_pago DECIMAL(10,2),
    forma_pagamento VARCHAR(50),
    comprovante_url TEXT,
    status status_pagamento DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contas_pagar_status ON contas_pagar(status);
CREATE INDEX idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);

-- Contas Bancárias
CREATE TABLE contas_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    banco VARCHAR(100) NOT NULL,
    agencia VARCHAR(20) NOT NULL,
    conta VARCHAR(30) NOT NULL,
    tipo VARCHAR(50),
    saldo_inicial DECIMAL(10,2) DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Movimentações Bancárias
CREATE TABLE movimentacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conta_id UUID NOT NULL REFERENCES contas_bancarias(id),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    categoria_id UUID REFERENCES categorias_despesa(id),
    mensalidade_id UUID REFERENCES mensalidades(id),
    conta_pagar_id UUID REFERENCES contas_pagar(id),
    data_movimentacao DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movimentacoes_conta ON movimentacoes(conta_id);
CREATE INDEX idx_movimentacoes_data ON movimentacoes(data_movimentacao);

