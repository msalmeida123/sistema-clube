-- =============================================
-- PUNIÇÕES E RECLAMAÇÕES
-- =============================================

-- Reclamações
CREATE TABLE reclamacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reclamante_id UUID REFERENCES associados(id),
    reclamante_nome VARCHAR(255),
    reclamado_id UUID REFERENCES associados(id),
    descricao TEXT NOT NULL,
    local_ocorrencia VARCHAR(255),
    data_ocorrencia DATE,
    status VARCHAR(50) DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_analise', 'resolvida', 'arquivada')),
    registrado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reclamacoes_reclamado ON reclamacoes(reclamado_id);
CREATE INDEX idx_reclamacoes_status ON reclamacoes(status);

-- Reuniões da Diretoria (para análise de reclamações)
CREATE TABLE reunioes_diretoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_reuniao TIMESTAMPTZ NOT NULL,
    pauta TEXT,
    ata TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participantes da Reunião
CREATE TABLE reuniao_participantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reuniao_id UUID NOT NULL REFERENCES reunioes_diretoria(id) ON DELETE CASCADE,
    diretor_id UUID NOT NULL REFERENCES diretoria(id),
    presente BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Punições
CREATE TABLE punicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID NOT NULL REFERENCES associados(id),
    reclamacao_id UUID REFERENCES reclamacoes(id),
    reuniao_id UUID REFERENCES reunioes_diretoria(id),
    tipo tipo_punicao NOT NULL,
    descricao TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE, -- NULL para expulsão
    aplicado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_punicoes_associado ON punicoes(associado_id);

-- =============================================
-- CRM WHATSAPP
-- =============================================

-- Conversas WhatsApp
CREATE TABLE conversas_whatsapp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID REFERENCES associados(id),
    telefone VARCHAR(20) NOT NULL,
    nome_contato VARCHAR(255),
    ultimo_contato TIMESTAMPTZ,
    atendente_id UUID REFERENCES usuarios(id),
    status VARCHAR(50) DEFAULT 'aberta' CHECK (status IN ('aberta', 'aguardando', 'resolvida', 'arquivada')),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversas_telefone ON conversas_whatsapp(telefone);
CREATE INDEX idx_conversas_associado ON conversas_whatsapp(associado_id);
CREATE INDEX idx_conversas_status ON conversas_whatsapp(status);

-- Mensagens WhatsApp
CREATE TABLE mensagens_whatsapp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversa_id UUID NOT NULL REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
    direcao VARCHAR(10) NOT NULL CHECK (direcao IN ('entrada', 'saida')),
    conteudo TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'texto', -- texto, imagem, documento, audio
    arquivo_url TEXT,
    wasender_id VARCHAR(100),
    enviado_por UUID REFERENCES usuarios(id),
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mensagens_conversa ON mensagens_whatsapp(conversa_id);
CREATE INDEX idx_mensagens_data ON mensagens_whatsapp(created_at);

-- Templates de Mensagem
CREATE TABLE templates_mensagem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(50),
    conteudo TEXT NOT NULL,
    variaveis TEXT[], -- ex: {nome}, {valor}, {vencimento}
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automações WhatsApp
CREATE TABLE automacoes_whatsapp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- lembrete_vencimento, lembrete_exame, aniversario
    template_id UUID REFERENCES templates_mensagem(id),
    dias_antes INTEGER DEFAULT 3,
    hora_envio TIME DEFAULT '09:00',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fila de Envio
CREATE TABLE fila_whatsapp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telefone VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'texto',
    arquivo_url TEXT,
    agendado_para TIMESTAMPTZ,
    enviado BOOLEAN DEFAULT false,
    data_envio TIMESTAMPTZ,
    erro TEXT,
    automacao_id UUID REFERENCES automacoes_whatsapp(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fila_enviado ON fila_whatsapp(enviado);
CREATE INDEX idx_fila_agendado ON fila_whatsapp(agendado_para);

