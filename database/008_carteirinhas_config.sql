-- =============================================
-- CARTEIRINHAS E QR CODES
-- =============================================

-- Carteirinhas
CREATE TABLE carteirinhas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID REFERENCES associados(id),
    dependente_id UUID REFERENCES dependentes(id),
    agregado_id UUID REFERENCES agregados(id),
    qrcode_data TEXT NOT NULL,
    qrcode_hash VARCHAR(64) UNIQUE NOT NULL,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_validade DATE NOT NULL,
    via INTEGER DEFAULT 1,
    ativa BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_pessoa_carteirinha CHECK (
        (associado_id IS NOT NULL AND dependente_id IS NULL AND agregado_id IS NULL) OR
        (associado_id IS NULL AND dependente_id IS NOT NULL AND agregado_id IS NULL) OR
        (associado_id IS NULL AND dependente_id IS NULL AND agregado_id IS NOT NULL)
    )
);

CREATE INDEX idx_carteirinhas_qrcode ON carteirinhas(qrcode_hash);
CREATE INDEX idx_carteirinhas_associado ON carteirinhas(associado_id);

-- =============================================
-- ACADEMIA
-- =============================================

-- Inscrições na Academia
CREATE TABLE inscricoes_academia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID REFERENCES associados(id),
    dependente_id UUID REFERENCES dependentes(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_pessoa_academia CHECK (
        (associado_id IS NOT NULL AND dependente_id IS NULL) OR
        (associado_id IS NULL AND dependente_id IS NOT NULL)
    )
);

CREATE INDEX idx_inscricoes_academia_associado ON inscricoes_academia(associado_id);

-- =============================================
-- LOGS E AUDITORIA
-- =============================================

-- Logs de Ações do Sistema
CREATE TABLE logs_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id),
    acao VARCHAR(100) NOT NULL,
    tabela VARCHAR(100),
    registro_id UUID,
    dados_anteriores JSONB,
    dados_novos JSONB,
    ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_usuario ON logs_sistema(usuario_id);
CREATE INDEX idx_logs_tabela ON logs_sistema(tabela);
CREATE INDEX idx_logs_data ON logs_sistema(created_at);

-- =============================================
-- CONFIGURAÇÕES DO SISTEMA
-- =============================================

-- Configurações Gerais
CREATE TABLE configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(50) DEFAULT 'texto', -- texto, numero, boolean, json
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações Sicoob
CREATE TABLE config_sicoob (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id VARCHAR(255),
    client_secret TEXT,
    certificado_url TEXT,
    ambiente VARCHAR(20) DEFAULT 'sandbox', -- sandbox, producao
    webhook_url TEXT,
    conta_corrente VARCHAR(50),
    agencia VARCHAR(20),
    pix_chave VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações WaSenderAPI
CREATE TABLE config_wasender (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key TEXT,
    device_id VARCHAR(100),
    webhook_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

