-- =====================================================
-- DEPENDENTES E DOCUMENTOS
-- =====================================================

-- Dependentes
CREATE TABLE dependentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  nome_completo VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  rg VARCHAR(20),
  data_nascimento DATE NOT NULL,
  parentesco VARCHAR(50) NOT NULL, -- filho, pai, mae, sogra, sogro
  foto_url TEXT,
  
  -- Para dependentes estudantes (até 24 anos se faculdade)
  estudante_faculdade BOOLEAN DEFAULT false,
  historico_escolar_url TEXT,
  data_validade_historico DATE,
  
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dependentes_associado ON dependentes(associado_id);
CREATE INDEX idx_dependentes_cpf ON dependentes(cpf);

-- Documentos do Associado
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID REFERENCES associados(id) ON DELETE CASCADE,
  dependente_id UUID REFERENCES dependentes(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL, -- certidao_nascimento, certidao_casamento, etc
  nome_arquivo VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  tamanho INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documentos_associado ON documentos(associado_id);
CREATE INDEX idx_documentos_dependente ON documentos(dependente_id);

-- Exames Médicos (para acesso à piscina)
CREATE TABLE exames_medicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID REFERENCES associados(id) ON DELETE CASCADE,
  dependente_id UUID REFERENCES dependentes(id) ON DELETE CASCADE,
  data_exame DATE NOT NULL,
  data_validade DATE NOT NULL, -- 3 meses após data_exame
  arquivo_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_exames_associado ON exames_medicos(associado_id);
CREATE INDEX idx_exames_validade ON exames_medicos(data_validade);

