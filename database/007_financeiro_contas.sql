-- =====================================================
-- FINANCEIRO - CONTAS E FORNECEDORES
-- =====================================================

-- Contas Bancárias
CREATE TABLE contas_bancarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  banco VARCHAR(100) NOT NULL,
  agencia VARCHAR(20) NOT NULL,
  conta VARCHAR(30) NOT NULL,
  tipo VARCHAR(50), -- corrente, poupanca
  saldo_atual DECIMAL(15,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  principal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Centro de Custos
CREATE TABLE centros_custo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true
);

INSERT INTO centros_custo (nome) VALUES 
  ('Administrativo'),
  ('Piscina'),
  ('Academia'),
  ('Manutenção'),
  ('Eventos'),
  ('Limpeza');

-- Categorias Financeiras
CREATE TABLE categorias_financeiras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- receita, despesa
  ativo BOOLEAN DEFAULT true
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
  contato_nome VARCHAR(255),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);

-- Contas a Pagar
CREATE TABLE contas_pagar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fornecedor_id UUID REFERENCES fornecedores(id),
  categoria_id UUID REFERENCES categorias_financeiras(id),
  centro_custo_id UUID REFERENCES centros_custo(id),
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status status_pagamento DEFAULT 'pendente',
  comprovante_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contas a Receber (outras que não mensalidades)
CREATE TABLE contas_receber (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID REFERENCES associados(id),
  categoria_id UUID REFERENCES categorias_financeiras(id),
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_recebimento DATE,
  status status_pagamento DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

