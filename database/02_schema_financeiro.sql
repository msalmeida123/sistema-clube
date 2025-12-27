-- =====================================================
-- TABELA: Documentos dos Associados
-- =====================================================
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID REFERENCES associados(id) ON DELETE CASCADE,
  dependente_id UUID REFERENCES dependentes(id) ON DELETE CASCADE,
  
  tipo VARCHAR(100) NOT NULL, -- certidao_nascimento, certidao_casamento, historico_escolar, etc
  nome_arquivo VARCHAR(255) NOT NULL,
  arquivo_url TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_owner CHECK (
    (associado_id IS NOT NULL AND dependente_id IS NULL) OR
    (associado_id IS NULL AND dependente_id IS NOT NULL)
  )
);

-- =====================================================
-- TABELA: Diretoria
-- =====================================================
CREATE TABLE diretoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID NOT NULL REFERENCES associados(id),
  cargo VARCHAR(100) NOT NULL, -- presidente, vice_presidente, diretor_financeiro, etc
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  
  -- Convites especiais para diretores
  convites_mes INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Convites (Patrimonial e Diretores)
-- =====================================================
CREATE TABLE convites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID NOT NULL REFERENCES associados(id),
  
  nome_convidado VARCHAR(255) NOT NULL,
  cpf_convidado VARCHAR(14),
  data_convite DATE NOT NULL DEFAULT CURRENT_DATE,
  mes_referencia INTEGER NOT NULL, -- Mês do convite (1-12)
  ano_referencia INTEGER NOT NULL, -- Ano do convite
  
  usado BOOLEAN DEFAULT false,
  data_uso TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Mensalidades
-- =====================================================
CREATE TABLE mensalidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID NOT NULL REFERENCES associados(id),
  
  tipo VARCHAR(50) NOT NULL, -- clube, academia, taxa_familiar
  mes_referencia INTEGER NOT NULL,
  ano_referencia INTEGER NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  
  status pagamento_status DEFAULT 'pendente',
  tipo_pagamento pagamento_tipo,
  
  -- Boleto
  boleto_codigo VARCHAR(100),
  boleto_url TEXT,
  
  -- PIX
  pix_codigo VARCHAR(255),
  pix_qrcode TEXT,
  pix_txid VARCHAR(100),
  
  data_pagamento TIMESTAMP WITH TIME ZONE,
  valor_pago DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Contas a Pagar
-- =====================================================
CREATE TABLE contas_pagar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fornecedor_id UUID REFERENCES fornecedores(id),
  
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  
  centro_custo VARCHAR(100), -- piscina, academia, administrativo, etc
  categoria VARCHAR(100),
  
  nota_fiscal_url TEXT,
  comprovante_url TEXT,
  
  status pagamento_status DEFAULT 'pendente',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Fornecedores
-- =====================================================
CREATE TABLE fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razao_social VARCHAR(255) NOT NULL,
  nome_fantasia VARCHAR(255),
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  contato_nome VARCHAR(255),
  
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Solicitações de Compra
-- =====================================================
CREATE TABLE compras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  solicitante_id UUID NOT NULL REFERENCES usuarios(id),
  
  descricao TEXT NOT NULL,
  justificativa TEXT,
  valor_estimado DECIMAL(10,2),
  
  status compra_status DEFAULT 'solicitada',
  
  -- Aprovação
  aprovado_por UUID REFERENCES usuarios(id),
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  motivo_rejeicao TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Orçamentos (3 obrigatórios)
-- =====================================================
CREATE TABLE orcamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES fornecedores(id),
  
  fornecedor_nome VARCHAR(255), -- Caso não esteja cadastrado
  valor DECIMAL(10,2) NOT NULL,
  arquivo_url TEXT NOT NULL,
  observacoes TEXT,
  
  selecionado BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
