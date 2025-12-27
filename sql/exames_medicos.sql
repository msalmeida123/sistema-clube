-- Tabela de Exames Médicos
-- Execute este SQL no Supabase

CREATE TABLE IF NOT EXISTS exames_medicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  data_exame DATE NOT NULL,
  data_validade DATE NOT NULL,
  medico_nome VARCHAR(255) NOT NULL,
  crm VARCHAR(50) NOT NULL,
  tipo_exame VARCHAR(50) DEFAULT 'piscina', -- piscina, academia, admissional, periodico
  resultado VARCHAR(50) DEFAULT 'apto', -- apto, apto_restricao, inapto
  observacoes TEXT,
  arquivo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_exames_associado ON exames_medicos(associado_id);
CREATE INDEX IF NOT EXISTS idx_exames_validade ON exames_medicos(data_validade);
CREATE INDEX IF NOT EXISTS idx_exames_tipo ON exames_medicos(tipo_exame);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_exames_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_exames_updated_at ON exames_medicos;
CREATE TRIGGER trigger_exames_updated_at
  BEFORE UPDATE ON exames_medicos
  FOR EACH ROW
  EXECUTE FUNCTION update_exames_updated_at();

-- RLS
ALTER TABLE exames_medicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exames acesso total" ON exames_medicos FOR ALL TO authenticated USING (true) WITH CHECK (true);
