-- =====================================================
-- FINANCEIRO - MENSALIDADES E PAGAMENTOS
-- =====================================================

-- Planos e Valores
CREATE TABLE planos_valores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo tipo_plano NOT NULL,
  valor_mensal DECIMAL(10,2) NOT NULL,
  taxa_dependente_extra DECIMAL(10,2) DEFAULT 0,
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mensalidade Academia
CREATE TABLE academia_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  valor_mensal DECIMAL(10,2) NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fim DATE,
  ativo BOOLEAN DEFAULT true
);

-- Mensalidades Geradas
CREATE TABLE mensalidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID NOT NULL REFERENCES associados(id),
  tipo VARCHAR(50) NOT NULL, -- clube, academia
  mes_referencia DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  valor_multa DECIMAL(10,2) DEFAULT 0,
  valor_juros DECIMAL(10,2) DEFAULT 0,
  valor_total DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  status status_pagamento DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mensalidades_associado ON mensalidades(associado_id);
CREATE INDEX idx_mensalidades_status ON mensalidades(status);
CREATE INDEX idx_mensalidades_vencimento ON mensalidades(data_vencimento);

-- Pagamentos (Boleto/PIX)
CREATE TABLE pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mensalidade_id UUID NOT NULL REFERENCES mensalidades(id),
  tipo tipo_pagamento NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  
  -- Dados do Boleto
  codigo_barras VARCHAR(100),
  linha_digitavel VARCHAR(100),
  nosso_numero VARCHAR(50),
  
  -- Dados do PIX
  pix_copia_cola TEXT,
  pix_qrcode TEXT,
  txid VARCHAR(100),
  
  -- Controle
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_vencimento DATE,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  status status_pagamento DEFAULT 'pendente',
  
  -- Retorno Sicoob
  sicoob_id VARCHAR(100),
  webhook_payload JSONB
);

CREATE INDEX idx_pagamentos_mensalidade ON pagamentos(mensalidade_id);
CREATE INDEX idx_pagamentos_txid ON pagamentos(txid);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);

