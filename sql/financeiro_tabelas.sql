-- Tabela de Boletos
CREATE TABLE IF NOT EXISTS boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensalidade_id UUID REFERENCES mensalidades(id) ON DELETE CASCADE,
  nosso_numero VARCHAR(50) NOT NULL,
  linha_digitavel VARCHAR(100),
  codigo_barras VARCHAR(100),
  pdf_url TEXT,
  status VARCHAR(20) DEFAULT 'emitido',
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_vencimento DATE,
  valor DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Cobranças PIX
CREATE TABLE IF NOT EXISTS pix_cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensalidade_id UUID REFERENCES mensalidades(id) ON DELETE CASCADE,
  txid VARCHAR(100) NOT NULL,
  qrcode TEXT,
  qrcode_base64 TEXT,
  valor DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'ativo',
  data_geracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_expiracao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Contas a Pagar
CREATE TABLE IF NOT EXISTS contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao VARCHAR(255) NOT NULL,
  fornecedor VARCHAR(255),
  categoria VARCHAR(50) DEFAULT 'outros',
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(20) DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_boletos_mensalidade ON boletos(mensalidade_id);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON boletos(status);
CREATE INDEX IF NOT EXISTS idx_pix_mensalidade ON pix_cobrancas(mensalidade_id);
CREATE INDEX IF NOT EXISTS idx_pix_status ON pix_cobrancas(status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_status ON contas_pagar(status);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_vencimento ON contas_pagar(data_vencimento);

-- RLS
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "boletos_all" ON boletos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "pix_cobrancas_all" ON pix_cobrancas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "contas_pagar_all" ON contas_pagar FOR ALL USING (true) WITH CHECK (true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_boletos_updated_at ON boletos;
CREATE TRIGGER update_boletos_updated_at BEFORE UPDATE ON boletos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pix_cobrancas_updated_at ON pix_cobrancas;
CREATE TRIGGER update_pix_cobrancas_updated_at BEFORE UPDATE ON pix_cobrancas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contas_pagar_updated_at ON contas_pagar;
CREATE TRIGGER update_contas_pagar_updated_at BEFORE UPDATE ON contas_pagar
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
