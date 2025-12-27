-- =====================================================
-- LOGS E AUDITORIA
-- =====================================================

-- Logs de Acesso ao Sistema
CREATE TABLE logs_acesso (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id),
  acao VARCHAR(100) NOT NULL,
  tabela VARCHAR(100),
  registro_id UUID,
  dados_anteriores JSONB,
  dados_novos JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_logs_usuario ON logs_acesso(usuario_id);
CREATE INDEX idx_logs_data ON logs_acesso(created_at);
CREATE INDEX idx_logs_tabela ON logs_acesso(tabela);

-- Notificações
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID REFERENCES usuarios(id),
  associado_id UUID REFERENCES associados(id),
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(50), -- info, aviso, alerta, erro
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_associado ON notificacoes(associado_id);

-- QR Codes Gerados
CREATE TABLE qrcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID REFERENCES associados(id),
  dependente_id UUID REFERENCES dependentes(id),
  codigo VARCHAR(100) UNIQUE NOT NULL,
  tipo VARCHAR(50) DEFAULT 'carteirinha', -- carteirinha, convite, evento
  data_validade DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_qrcodes_codigo ON qrcodes(codigo);
CREATE INDEX idx_qrcodes_associado ON qrcodes(associado_id);

-- Configurações do Sistema
CREATE TABLE configuracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  descricao TEXT,
  tipo VARCHAR(50) DEFAULT 'text', -- text, number, boolean, json
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, descricao, tipo) VALUES
  ('multa_atraso_percentual', '2', 'Percentual de multa por atraso', 'number'),
  ('juros_dia_percentual', '0.033', 'Percentual de juros por dia', 'number'),
  ('dias_tolerancia', '5', 'Dias de tolerância antes de multa', 'number'),
  ('exame_medico_validade_meses', '3', 'Validade do exame médico em meses', 'number'),
  ('convites_patrimonial_mes', '2', 'Quantidade de convites mensais patrimonial', 'number'),
  ('idade_limite_dependente', '21', 'Idade limite para dependente', 'number'),
  ('idade_limite_estudante', '24', 'Idade limite para estudante universitário', 'number'),
  ('mandato_diretoria_anos', '2', 'Duração do mandato da diretoria', 'number'),
  ('tempo_minimo_candidatura_anos', '1', 'Tempo mínimo de título para candidatura', 'number'),
  ('sicoob_ambiente', 'sandbox', 'Ambiente Sicoob (sandbox/producao)', 'text'),
  ('wasender_api_url', 'https://api.wasenderapi.com', 'URL da API WaSender', 'text');

