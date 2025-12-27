-- =====================================================
-- TABELA: Registros de Acesso (Portarias)
-- =====================================================
CREATE TABLE registros_acesso (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  associado_id UUID REFERENCES associados(id),
  dependente_id UUID REFERENCES dependentes(id),
  convidado_id UUID REFERENCES convites(id),
  
  local VARCHAR(50) NOT NULL, -- clube, piscina, academia
  tipo VARCHAR(20) NOT NULL, -- entrada, saida
  
  metodo_verificacao VARCHAR(50), -- qrcode, cpf, nome
  
  liberado BOOLEAN NOT NULL,
  motivo_bloqueio TEXT, -- Se não foi liberado
  
  usuario_portaria_id UUID REFERENCES usuarios(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Eleições
-- =====================================================
CREATE TABLE eleicoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  
  data_inicio_inscricoes DATE NOT NULL,
  data_fim_inscricoes DATE NOT NULL,
  data_inicio_votacao DATE NOT NULL,
  data_fim_votacao DATE NOT NULL,
  
  status eleicao_status DEFAULT 'agendada',
  
  mandato_anos INTEGER DEFAULT 2,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Chapas Eleitorais
-- =====================================================
CREATE TABLE chapas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleicao_id UUID NOT NULL REFERENCES eleicoes(id) ON DELETE CASCADE,
  
  numero INTEGER NOT NULL,
  nome VARCHAR(255) NOT NULL,
  proposta TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Candidatos da Chapa
-- =====================================================
CREATE TABLE candidatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapa_id UUID NOT NULL REFERENCES chapas(id) ON DELETE CASCADE,
  associado_id UUID NOT NULL REFERENCES associados(id),
  
  cargo VARCHAR(100) NOT NULL, -- presidente, vice_presidente, diretor
  
  -- Validação: patrimonial + 1 ano
  validado BOOLEAN DEFAULT false,
  motivo_invalidacao TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Votos
-- =====================================================
CREATE TABLE votos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  eleicao_id UUID NOT NULL REFERENCES eleicoes(id),
  chapa_id UUID REFERENCES chapas(id), -- NULL = voto em branco
  
  -- Não armazena quem votou para garantir sigilo
  -- Apenas registra que o voto foi computado
  hash_votante VARCHAR(64) NOT NULL, -- Hash do CPF para evitar duplicidade
  
  voto_branco BOOLEAN DEFAULT false,
  voto_nulo BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(eleicao_id, hash_votante)
);

-- =====================================================
-- TABELA: Reclamações/Ocorrências
-- =====================================================
CREATE TABLE reclamacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Quem fez a reclamação
  reclamante_id UUID REFERENCES associados(id),
  reclamante_nome VARCHAR(255), -- Se não for associado
  
  -- Sobre quem é a reclamação
  reclamado_id UUID REFERENCES associados(id),
  reclamado_dependente_id UUID REFERENCES dependentes(id),
  
  descricao TEXT NOT NULL,
  data_ocorrencia DATE NOT NULL,
  local_ocorrencia VARCHAR(255),
  
  -- Anexos (fotos, documentos)
  anexos JSONB DEFAULT '[]',
  
  status VARCHAR(50) DEFAULT 'aberta', -- aberta, em_analise, resolvida
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Punições
-- =====================================================
CREATE TABLE punicoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reclamacao_id UUID REFERENCES reclamacoes(id),
  
  associado_id UUID REFERENCES associados(id),
  dependente_id UUID REFERENCES dependentes(id),
  
  tipo punicao_tipo NOT NULL,
  descricao TEXT NOT NULL,
  
  -- Para suspensão
  data_inicio DATE,
  data_fim DATE,
  
  -- Reunião da diretoria
  data_reuniao DATE,
  ata_reuniao_url TEXT,
  
  aplicado_por UUID REFERENCES usuarios(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Conversas WhatsApp (CRM)
-- =====================================================
CREATE TABLE conversas_whatsapp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  associado_id UUID REFERENCES associados(id),
  telefone VARCHAR(20) NOT NULL,
  nome_contato VARCHAR(255),
  
  status conversa_status DEFAULT 'aberta',
  
  atendente_id UUID REFERENCES usuarios(id),
  
  tags JSONB DEFAULT '[]',
  
  ultima_mensagem_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Mensagens WhatsApp
-- =====================================================
CREATE TABLE mensagens_whatsapp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversa_id UUID NOT NULL REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
  
  direcao VARCHAR(10) NOT NULL, -- entrada, saida
  conteudo TEXT NOT NULL,
  tipo VARCHAR(50) DEFAULT 'text', -- text, image, document, audio
  
  arquivo_url TEXT,
  
  -- Se for mensagem de saída
  enviado_por UUID REFERENCES usuarios(id),
  
  -- Status de entrega
  wasender_message_id VARCHAR(255),
  status VARCHAR(50), -- sent, delivered, read
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Templates de Mensagens
-- =====================================================
CREATE TABLE templates_mensagem (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100), -- cobranca, aviso, boas_vindas, etc
  conteudo TEXT NOT NULL,
  
  ativo BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Logs de Auditoria
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  usuario_id UUID REFERENCES usuarios(id),
  acao VARCHAR(100) NOT NULL,
  tabela VARCHAR(100),
  registro_id UUID,
  
  dados_anteriores JSONB,
  dados_novos JSONB,
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
