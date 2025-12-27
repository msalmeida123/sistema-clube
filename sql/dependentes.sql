-- Tabela de Dependentes de Associados
-- Execute este SQL no Supabase

CREATE TABLE IF NOT EXISTS dependentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  
  -- Dados pessoais
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  rg VARCHAR(20),
  data_nascimento DATE NOT NULL,
  
  -- Parentesco conforme Art. 20 do Estatuto
  -- conjuge, filho, filho_universitario, pai, mae, sogra, enteado, adotado
  parentesco VARCHAR(30) NOT NULL,
  
  -- Contato
  telefone VARCHAR(20),
  email VARCHAR(255),
  
  -- Foto
  foto_url TEXT,
  
  -- Documentos (para universitários, declaração da universidade)
  documento_comprobatorio_url TEXT,
  
  -- Status
  ativo BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dependentes_associado ON dependentes(associado_id);
CREATE INDEX IF NOT EXISTS idx_dependentes_cpf ON dependentes(cpf);
CREATE INDEX IF NOT EXISTS idx_dependentes_ativo ON dependentes(ativo);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_dependentes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dependentes_updated_at ON dependentes;
CREATE TRIGGER trigger_dependentes_updated_at
  BEFORE UPDATE ON dependentes
  FOR EACH ROW
  EXECUTE FUNCTION update_dependentes_updated_at();

-- RLS Policies
ALTER TABLE dependentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dependentes visíveis para usuários autenticados"
  ON dependentes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Dependentes inseríveis por usuários autenticados"
  ON dependentes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Dependentes atualizáveis por usuários autenticados"
  ON dependentes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Dependentes deletáveis por usuários autenticados"
  ON dependentes FOR DELETE
  TO authenticated
  USING (true);
