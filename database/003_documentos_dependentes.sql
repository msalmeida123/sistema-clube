-- =============================================
-- DOCUMENTOS E DEPENDENTES
-- =============================================

-- Documentos dos Associados (certidões, comprovantes)
CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT,
    arquivo_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documentos_associado ON documentos(associado_id);

-- Dependentes
CREATE TABLE dependentes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    rg VARCHAR(20),
    data_nascimento DATE NOT NULL,
    parentesco VARCHAR(50) NOT NULL,
    foto_url TEXT,
    cursando_faculdade BOOLEAN DEFAULT false,
    historico_escolar_url TEXT,
    data_validade_faculdade DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dependentes_associado ON dependentes(associado_id);

-- Agregados (pai, mãe, sogra, sogro para plano familiar/patrimonial)
CREATE TABLE agregados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    rg VARCHAR(20),
    data_nascimento DATE,
    parentesco VARCHAR(50) NOT NULL CHECK (parentesco IN ('pai', 'mae', 'sogro', 'sogra')),
    foto_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agregados_associado ON agregados(associado_id);

-- Exames Médicos (obrigatório para piscina)
CREATE TABLE exames_medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID REFERENCES associados(id) ON DELETE CASCADE,
    dependente_id UUID REFERENCES dependentes(id) ON DELETE CASCADE,
    agregado_id UUID REFERENCES agregados(id) ON DELETE CASCADE,
    data_exame DATE NOT NULL,
    data_validade DATE NOT NULL,
    arquivo_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_pessoa CHECK (
        (associado_id IS NOT NULL AND dependente_id IS NULL AND agregado_id IS NULL) OR
        (associado_id IS NULL AND dependente_id IS NOT NULL AND agregado_id IS NULL) OR
        (associado_id IS NULL AND dependente_id IS NULL AND agregado_id IS NOT NULL)
    )
);

CREATE INDEX idx_exames_associado ON exames_medicos(associado_id);
CREATE INDEX idx_exames_validade ON exames_medicos(data_validade);

