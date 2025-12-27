-- Tabela de Eleições
CREATE TABLE IF NOT EXISTS eleicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'agendada',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Chapas
CREATE TABLE IF NOT EXISTS chapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleicao_id UUID NOT NULL REFERENCES eleicoes(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  nome VARCHAR(255) NOT NULL,
  presidente VARCHAR(255) NOT NULL,
  vice_presidente VARCHAR(255),
  secretario VARCHAR(255),
  tesoureiro VARCHAR(255),
  votos INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Votos (para controle de quem já votou)
CREATE TABLE IF NOT EXISTS votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eleicao_id UUID NOT NULL REFERENCES eleicoes(id) ON DELETE CASCADE,
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  chapa_id UUID NOT NULL REFERENCES chapas(id) ON DELETE CASCADE,
  data_voto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(eleicao_id, associado_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_eleicoes_status ON eleicoes(status);
CREATE INDEX IF NOT EXISTS idx_chapas_eleicao ON chapas(eleicao_id);
CREATE INDEX IF NOT EXISTS idx_votos_eleicao ON votos(eleicao_id);
CREATE INDEX IF NOT EXISTS idx_votos_associado ON votos(associado_id);

-- RLS
ALTER TABLE eleicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "eleicoes_all" ON eleicoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "chapas_all" ON chapas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "votos_all" ON votos FOR ALL USING (true) WITH CHECK (true);

-- Função para incrementar voto
CREATE OR REPLACE FUNCTION incrementar_voto(chapa_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE chapas SET votos = votos + 1 WHERE id = chapa_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
