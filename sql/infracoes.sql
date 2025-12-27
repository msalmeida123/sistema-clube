-- Tabela de Infrações de Associados
-- Execute este SQL no Supabase

CREATE TABLE IF NOT EXISTS infracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  
  -- Dados da ocorrência
  data_ocorrencia TIMESTAMP WITH TIME ZONE NOT NULL,
  local_ocorrencia VARCHAR(255) NOT NULL,
  descricao_fato TEXT NOT NULL,
  
  -- Testemunhas
  testemunha1_nome VARCHAR(255),
  testemunha1_contato VARCHAR(100),
  testemunha2_nome VARCHAR(255),
  testemunha2_contato VARCHAR(100),
  
  -- Artigos do estatuto infringidos
  artigos_infringidos TEXT[],
  
  -- Gravidade sugerida pela secretaria
  gravidade_sugerida VARCHAR(20) CHECK (gravidade_sugerida IN ('leve', 'media', 'grave', 'gravissima')),
  
  -- Registrado por (secretaria)
  registrado_por UUID REFERENCES auth.users(id),
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status do processo
  status VARCHAR(30) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'julgado', 'arquivado')),
  
  -- Decisão da diretoria
  analisado_por UUID REFERENCES auth.users(id),
  data_analise TIMESTAMP WITH TIME ZONE,
  penalidade_aplicada VARCHAR(30) CHECK (penalidade_aplicada IN ('admoestacao', 'suspensao', 'eliminacao', 'expulsao', 'absolvido')),
  dias_suspensao INTEGER,
  parecer_diretoria TEXT,
  
  -- Notificação ao associado
  data_notificacao TIMESTAMP WITH TIME ZONE,
  notificado BOOLEAN DEFAULT FALSE,
  
  -- Recurso
  apresentou_defesa BOOLEAN DEFAULT FALSE,
  data_defesa TIMESTAMP WITH TIME ZONE,
  texto_defesa TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_infracoes_associado ON infracoes(associado_id);
CREATE INDEX IF NOT EXISTS idx_infracoes_status ON infracoes(status);
CREATE INDEX IF NOT EXISTS idx_infracoes_data ON infracoes(data_ocorrencia);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_infracoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_infracoes_updated_at ON infracoes;
CREATE TRIGGER trigger_infracoes_updated_at
  BEFORE UPDATE ON infracoes
  FOR EACH ROW
  EXECUTE FUNCTION update_infracoes_updated_at();

-- RLS Policies
ALTER TABLE infracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Infrações visíveis para usuários autenticados"
  ON infracoes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Infrações inseríveis por usuários autenticados"
  ON infracoes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Infrações atualizáveis por usuários autenticados"
  ON infracoes FOR UPDATE
  TO authenticated
  USING (true);
