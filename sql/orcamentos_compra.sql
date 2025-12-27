-- Tabela de Orçamentos de Compra
CREATE TABLE IF NOT EXISTS orcamentos_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL UNIQUE,
  descricao VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) DEFAULT 'outros',
  status VARCHAR(20) DEFAULT 'pendente',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  aprovado_por UUID REFERENCES usuarios(id),
  valor_total DECIMAL(10,2) DEFAULT 0,
  fornecedor_escolhido VARCHAR(255),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Itens do Orçamento (com 3 orçamentos de fornecedores)
CREATE TABLE IF NOT EXISTS orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES orcamentos_compra(id) ON DELETE CASCADE,
  produto VARCHAR(255) NOT NULL,
  quantidade INTEGER DEFAULT 1,
  unidade VARCHAR(10) DEFAULT 'un',
  -- Orçamento 1
  orcamento1_fornecedor VARCHAR(255),
  orcamento1_valor DECIMAL(10,2) DEFAULT 0,
  -- Orçamento 2
  orcamento2_fornecedor VARCHAR(255),
  orcamento2_valor DECIMAL(10,2) DEFAULT 0,
  -- Orçamento 3
  orcamento3_fornecedor VARCHAR(255),
  orcamento3_valor DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos_compra(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data ON orcamentos_compra(data_criacao);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento ON orcamento_itens(orcamento_id);

-- RLS
ALTER TABLE orcamentos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamento_itens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "orcamentos_compra_all" ON orcamentos_compra FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "orcamento_itens_all" ON orcamento_itens FOR ALL USING (true) WITH CHECK (true);

-- Triggers
DROP TRIGGER IF EXISTS update_orcamentos_compra_updated_at ON orcamentos_compra;
CREATE TRIGGER update_orcamentos_compra_updated_at BEFORE UPDATE ON orcamentos_compra
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orcamento_itens_updated_at ON orcamento_itens;
CREATE TRIGGER update_orcamento_itens_updated_at BEFORE UPDATE ON orcamento_itens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
