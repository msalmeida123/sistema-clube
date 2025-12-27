-- =============================================
-- CONTROLE DE ACESSO FÍSICO
-- =============================================

-- Pontos de Acesso (portarias)
CREATE TABLE pontos_acesso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('clube', 'piscina', 'academia')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registros de Entrada/Saída
CREATE TABLE registros_acesso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ponto_acesso_id UUID NOT NULL REFERENCES pontos_acesso(id),
    associado_id UUID REFERENCES associados(id),
    dependente_id UUID REFERENCES dependentes(id),
    agregado_id UUID REFERENCES agregados(id),
    convidado_id UUID REFERENCES convites(id),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    forma_identificacao VARCHAR(50), -- 'qrcode', 'cpf', 'nome'
    operador_id UUID REFERENCES usuarios(id),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_registros_ponto ON registros_acesso(ponto_acesso_id);
CREATE INDEX idx_registros_data ON registros_acesso(created_at);
CREATE INDEX idx_registros_associado ON registros_acesso(associado_id);

-- =============================================
-- DIRETORIA E ELEIÇÕES
-- =============================================

-- Mandatos da Diretoria
CREATE TABLE diretoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID NOT NULL REFERENCES associados(id),
    cargo cargo_diretoria NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    ativo BOOLEAN DEFAULT true,
    qtd_convites_mes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_diretoria_associado ON diretoria(associado_id);
CREATE INDEX idx_diretoria_ativo ON diretoria(ativo);

-- Eleições
CREATE TABLE eleicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    status status_eleicao DEFAULT 'agendada',
    mandato_inicio DATE NOT NULL,
    mandato_fim DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chapas
CREATE TABLE chapas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eleicao_id UUID NOT NULL REFERENCES eleicoes(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    proposta TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chapas_eleicao ON chapas(eleicao_id);

-- Candidatos da Chapa
CREATE TABLE candidatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapa_id UUID NOT NULL REFERENCES chapas(id) ON DELETE CASCADE,
    associado_id UUID NOT NULL REFERENCES associados(id),
    cargo cargo_diretoria NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_candidatos_chapa ON candidatos(chapa_id);

-- Votos
CREATE TABLE votos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eleicao_id UUID NOT NULL REFERENCES eleicoes(id),
    chapa_id UUID REFERENCES chapas(id), -- NULL = voto em branco
    associado_id UUID NOT NULL REFERENCES associados(id),
    data_voto TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(eleicao_id, associado_id)
);

CREATE INDEX idx_votos_eleicao ON votos(eleicao_id);

-- =============================================
-- CONVITES
-- =============================================

-- Convites
CREATE TABLE convites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID REFERENCES associados(id),
    diretor_id UUID REFERENCES diretoria(id),
    nome_convidado VARCHAR(255) NOT NULL,
    cpf_convidado VARCHAR(14),
    telefone_convidado VARCHAR(20),
    data_validade DATE NOT NULL,
    status status_convite DEFAULT 'disponivel',
    data_uso TIMESTAMPTZ,
    mes_referencia VARCHAR(7) NOT NULL, -- formato: 2024-01
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_convites_associado ON convites(associado_id);
CREATE INDEX idx_convites_mes ON convites(mes_referencia);
CREATE INDEX idx_convites_status ON convites(status);

