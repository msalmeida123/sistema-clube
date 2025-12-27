-- =====================================================
-- CRM WHATSAPP
-- =====================================================

-- Conversas WhatsApp
CREATE TABLE whatsapp_conversas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID REFERENCES associados(id),
  telefone VARCHAR(20) NOT NULL,
  nome_contato VARCHAR(255),
  status status_conversa DEFAULT 'aberta',
  atendente_id UUID REFERENCES usuarios(id),
  ultima_mensagem_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_conversas_telefone ON whatsapp_conversas(telefone);
CREATE INDEX idx_whatsapp_conversas_status ON whatsapp_conversas(status);

-- Mensagens
CREATE TABLE whatsapp_mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversa_id UUID NOT NULL REFERENCES whatsapp_conversas(id) ON DELETE CASCADE,
  direcao VARCHAR(10) NOT NULL, -- entrada, saida
  conteudo TEXT,
  tipo VARCHAR(50) DEFAULT 'text', -- text, image, document, audio, video
  arquivo_url TEXT,
  wasender_id VARCHAR(100),
  status VARCHAR(50), -- sent, delivered, read
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_mensagens_conversa ON whatsapp_mensagens(conversa_id);

-- Templates de Mensagem
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  categoria VARCHAR(50), -- cobranca, aviso, aniversario, geral
  conteudo TEXT NOT NULL,
  variaveis TEXT[], -- ['nome', 'valor', 'vencimento']
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automações
CREATE TABLE whatsapp_automacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- vencimento, exame_medico, aniversario
  template_id UUID REFERENCES whatsapp_templates(id),
  dias_antecedencia INTEGER DEFAULT 3,
  ativo BOOLEAN DEFAULT true,
  ultima_execucao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags para conversas
CREATE TABLE whatsapp_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(50) NOT NULL,
  cor VARCHAR(7) DEFAULT '#007bff',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relação conversa-tags
CREATE TABLE whatsapp_conversa_tags (
  conversa_id UUID REFERENCES whatsapp_conversas(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES whatsapp_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (conversa_id, tag_id)
);

