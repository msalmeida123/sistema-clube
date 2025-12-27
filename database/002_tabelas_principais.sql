-- =============================================
-- TABELAS PRINCIPAIS
-- =============================================

-- Configurações do Clube
CREATE TABLE clube_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    logo_url TEXT,
    foto_clube_url TEXT,
    endereco TEXT,
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    telefone VARCHAR(20),
    email VARCHAR(255),
    site VARCHAR(255),
    instagram VARCHAR(255),
    facebook VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usuários do Sistema (autenticação via Supabase Auth)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    setor setor_usuario NOT NULL,
    ativo BOOLEAN DEFAULT true,
    associado_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Associados
CREATE TABLE associados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_titulo INTEGER UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(20),
    titulo_eleitor VARCHAR(20),
    email VARCHAR(255),
    telefone VARCHAR(20),
    cep VARCHAR(10),
    endereco TEXT,
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    tipo_residencia tipo_residencia,
    foto_url TEXT,
    plano tipo_plano NOT NULL DEFAULT 'individual',
    status status_associado DEFAULT 'ativo',
    data_associacao DATE DEFAULT CURRENT_DATE,
    data_nascimento DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca rápida
CREATE INDEX idx_associados_cpf ON associados(cpf);
CREATE INDEX idx_associados_numero_titulo ON associados(numero_titulo);
CREATE INDEX idx_associados_nome ON associados(nome);
CREATE INDEX idx_associados_plano ON associados(plano);
CREATE INDEX idx_associados_status ON associados(status);

