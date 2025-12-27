-- =====================================================
-- DIRETORIA E ELEIÇÕES
-- =====================================================

-- Cargos da Diretoria
CREATE TABLE cargos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  pode_candidatar BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true
);

-- Inserir cargos padrão
INSERT INTO cargos (nome, descricao, ordem) VALUES 
  ('Presidente', 'Presidente do Clube', 1),
  ('Vice-Presidente', 'Vice-Presidente do Clube', 2),
  ('Diretor Financeiro', 'Diretor de Finanças', 3),
  ('Diretor de Patrimônio', 'Diretor de Patrimônio', 4),
  ('Diretor Social', 'Diretor de Eventos Sociais', 5),
  ('Diretor de Esportes', 'Diretor de Esportes', 6);

-- Membros da Diretoria Atual
CREATE TABLE diretoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID NOT NULL REFERENCES associados(id),
  cargo_id UUID NOT NULL REFERENCES cargos(id),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  convites_especiais INTEGER DEFAULT 0, -- convites extras para diretores
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_diretoria_associado ON diretoria(associado_id);
CREATE INDEX idx_diretoria_ativo ON diretoria(ativo);

-- Eleições
CREATE TABLE eleicoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  status status_eleicao DEFAULT 'agendada',
  mandato_anos INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chapas das Eleições
CREATE TABLE chapas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleicao_id UUID NOT NULL REFERENCES eleicoes(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  nome VARCHAR(255) NOT NULL,
  proposta TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Candidatos (membros da chapa)
CREATE TABLE candidatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapa_id UUID NOT NULL REFERENCES chapas(id) ON DELETE CASCADE,
  associado_id UUID NOT NULL REFERENCES associados(id),
  cargo_id UUID NOT NULL REFERENCES cargos(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votos
CREATE TABLE votos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleicao_id UUID NOT NULL REFERENCES eleicoes(id),
  chapa_id UUID REFERENCES chapas(id), -- NULL = voto em branco
  associado_id UUID NOT NULL REFERENCES associados(id),
  data_voto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(eleicao_id, associado_id) -- cada associado vota uma vez por eleição
);

CREATE INDEX idx_votos_eleicao ON votos(eleicao_id);

