-- =====================================================
-- PUNIÇÕES E CONVITES
-- =====================================================

-- Reclamações
CREATE TABLE reclamacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reclamante_id UUID REFERENCES associados(id),
  reclamado_id UUID NOT NULL REFERENCES associados(id),
  descricao TEXT NOT NULL,
  local_ocorrencia VARCHAR(255),
  data_ocorrencia DATE,
  status VARCHAR(50) DEFAULT 'pendente', -- pendente, em_analise, resolvida
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Punições
CREATE TABLE punicoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID NOT NULL REFERENCES associados(id),
  reclamacao_id UUID REFERENCES reclamacoes(id),
  tipo status_punicao NOT NULL,
  descricao TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE, -- NULL para expulsão definitiva
  aplicado_por UUID REFERENCES usuarios(id),
  ata_reuniao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_punicoes_associado ON punicoes(associado_id);

-- Convites (para plano patrimonial)
CREATE TABLE convites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID NOT NULL REFERENCES associados(id),
  mes_referencia DATE NOT NULL, -- primeiro dia do mês
  nome_convidado VARCHAR(255) NOT NULL,
  cpf_convidado VARCHAR(14),
  telefone_convidado VARCHAR(20),
  data_uso DATE,
  usado BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_convites_associado ON convites(associado_id);
CREATE INDEX idx_convites_mes ON convites(mes_referencia);

-- =====================================================
-- CONTROLE DE ACESSO (QR CODE)
-- =====================================================

-- Registros de Entrada
CREATE TABLE registros_entrada (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID REFERENCES associados(id),
  dependente_id UUID REFERENCES dependentes(id),
  convite_id UUID REFERENCES convites(id),
  tipo tipo_entrada NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  autorizado BOOLEAN NOT NULL,
  motivo_bloqueio TEXT,
  operador_id UUID REFERENCES usuarios(id),
  qrcode_usado VARCHAR(255)
);

CREATE INDEX idx_entradas_associado ON registros_entrada(associado_id);
CREATE INDEX idx_entradas_data ON registros_entrada(data_hora);
CREATE INDEX idx_entradas_tipo ON registros_entrada(tipo);

