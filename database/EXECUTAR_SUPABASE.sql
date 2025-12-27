-- =============================================
-- SISTEMA DE CLUBE - SQL COMPLETO PARA SUPABASE
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================
CREATE TYPE tipo_plano AS ENUM ('individual', 'familiar', 'patrimonial');
CREATE TYPE tipo_residencia AS ENUM ('casa', 'apartamento');
CREATE TYPE status_associado AS ENUM ('ativo', 'inativo', 'suspenso', 'expulso');
CREATE TYPE status_pagamento AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');
CREATE TYPE tipo_pagamento AS ENUM ('boleto', 'pix');
CREATE TYPE tipo_cobranca AS ENUM ('mensalidade_clube', 'mensalidade_academia', 'taxa_familiar');
CREATE TYPE status_compra AS ENUM ('solicitado', 'em_cotacao', 'aprovado', 'comprado', 'cancelado');
CREATE TYPE cargo_diretoria AS ENUM ('presidente', 'vice_presidente', 'diretor', 'conselheiro');
CREATE TYPE setor_usuario AS ENUM ('admin', 'presidente', 'vice_presidente', 'diretoria', 'financeiro', 'secretaria', 'portaria_clube', 'portaria_piscina', 'portaria_academia', 'atendimento');
CREATE TYPE status_eleicao AS ENUM ('agendada', 'em_votacao', 'encerrada', 'cancelada');
CREATE TYPE tipo_punicao AS ENUM ('advertencia', 'suspensao', 'expulsao');
CREATE TYPE status_convite AS ENUM ('disponivel', 'usado', 'expirado');

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

-- Usuários do Sistema
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
    numero_titulo INTEGER UNIQUE,
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

CREATE INDEX idx_associados_cpf ON associados(cpf);
CREATE INDEX idx_associados_numero_titulo ON associados(numero_titulo);
CREATE INDEX idx_associados_nome ON associados(nome);
CREATE INDEX idx_associados_plano ON associados(plano);
CREATE INDEX idx_associados_status ON associados(status);

-- =============================================
-- DOCUMENTOS E DEPENDENTES
-- =============================================

CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
    tipo VARCHAR(100) NOT NULL,
    descricao TEXT,
    arquivo_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_documentos_associado ON documentos(associado_id);

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

CREATE TABLE exames_medicos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID REFERENCES associados(id) ON DELETE CASCADE,
    dependente_id UUID REFERENCES dependentes(id) ON DELETE CASCADE,
    agregado_id UUID REFERENCES agregados(id) ON DELETE CASCADE,
    data_exame DATE NOT NULL,
    data_validade DATE NOT NULL,
    arquivo_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_exames_associado ON exames_medicos(associado_id);
CREATE INDEX idx_exames_validade ON exames_medicos(data_validade);

-- =============================================
-- FINANCEIRO
-- =============================================

CREATE TABLE planos_valores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo tipo_plano NOT NULL,
    valor_mensal DECIMAL(10,2) NOT NULL,
    taxa_agregado DECIMAL(10,2) DEFAULT 0,
    valor_academia DECIMAL(10,2) DEFAULT 0,
    vigencia_inicio DATE NOT NULL,
    vigencia_fim DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mensalidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
    tipo tipo_cobranca NOT NULL,
    referencia VARCHAR(7) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    valor_pago DECIMAL(10,2),
    data_vencimento DATE NOT NULL,
    data_pagamento TIMESTAMPTZ,
    status status_pagamento DEFAULT 'pendente',
    tipo_pagamento tipo_pagamento,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_mensalidades_associado ON mensalidades(associado_id);
CREATE INDEX idx_mensalidades_status ON mensalidades(status);
CREATE INDEX idx_mensalidades_vencimento ON mensalidades(data_vencimento);

CREATE TABLE boletos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mensalidade_id UUID NOT NULL REFERENCES mensalidades(id) ON DELETE CASCADE,
    nosso_numero VARCHAR(50),
    linha_digitavel VARCHAR(100),
    codigo_barras VARCHAR(100),
    url_boleto TEXT,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    valor_multa DECIMAL(10,2) DEFAULT 0,
    valor_juros DECIMAL(10,2) DEFAULT 0,
    status status_pagamento DEFAULT 'pendente',
    data_pagamento TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_boletos_mensalidade ON boletos(mensalidade_id);

CREATE TABLE pix_cobrancas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mensalidade_id UUID NOT NULL REFERENCES mensalidades(id) ON DELETE CASCADE,
    txid VARCHAR(100) UNIQUE,
    location TEXT,
    qrcode TEXT,
    qrcode_base64 TEXT,
    valor DECIMAL(10,2) NOT NULL,
    status status_pagamento DEFAULT 'pendente',
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    data_expiracao TIMESTAMPTZ,
    data_pagamento TIMESTAMPTZ,
    end_to_end_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_pix_mensalidade ON pix_cobrancas(mensalidade_id);

CREATE TABLE webhook_pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL,
    processado BOOLEAN DEFAULT false,
    erro TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================
-- COMPRAS E CONTAS
-- =============================================

CREATE TABLE categorias_despesa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE centros_custo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fornecedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    cnpj VARCHAR(18),
    cpf VARCHAR(14),
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    banco VARCHAR(100),
    agencia VARCHAR(20),
    conta VARCHAR(30),
    pix VARCHAR(100),
    observacoes TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE solicitacoes_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INTEGER UNIQUE NOT NULL,
    solicitante_id UUID REFERENCES usuarios(id),
    descricao TEXT NOT NULL,
    justificativa TEXT,
    centro_custo_id UUID REFERENCES centros_custo(id),
    categoria_id UUID REFERENCES categorias_despesa(id),
    valor_estimado DECIMAL(10,2),
    status status_compra DEFAULT 'solicitado',
    data_necessidade DATE,
    aprovado_por UUID REFERENCES usuarios(id),
    data_aprovacao TIMESTAMPTZ,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cotacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitacao_id UUID NOT NULL REFERENCES solicitacoes_compra(id) ON DELETE CASCADE,
    fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),
    valor DECIMAL(10,2) NOT NULL,
    prazo_entrega INTEGER,
    condicao_pagamento TEXT,
    validade_proposta DATE,
    arquivo_url TEXT,
    observacoes TEXT,
    selecionada BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ordens_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero INTEGER UNIQUE NOT NULL,
    solicitacao_id UUID NOT NULL REFERENCES solicitacoes_compra(id),
    cotacao_id UUID NOT NULL REFERENCES cotacoes(id),
    fornecedor_id UUID NOT NULL REFERENCES fornecedores(id),
    valor_total DECIMAL(10,2) NOT NULL,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_entrega_prevista DATE,
    data_entrega_real DATE,
    nota_fiscal VARCHAR(50),
    nota_fiscal_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contas_pagar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ordem_compra_id UUID REFERENCES ordens_compra(id),
    fornecedor_id UUID REFERENCES fornecedores(id),
    descricao TEXT NOT NULL,
    categoria_id UUID REFERENCES categorias_despesa(id),
    centro_custo_id UUID REFERENCES centros_custo(id),
    valor DECIMAL(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento TIMESTAMPTZ,
    valor_pago DECIMAL(10,2),
    forma_pagamento VARCHAR(50),
    comprovante_url TEXT,
    status status_pagamento DEFAULT 'pendente',
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contas_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    banco VARCHAR(100) NOT NULL,
    agencia VARCHAR(20) NOT NULL,
    conta VARCHAR(30) NOT NULL,
    tipo VARCHAR(50),
    saldo_inicial DECIMAL(10,2) DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE movimentacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conta_id UUID NOT NULL REFERENCES contas_bancarias(id),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    categoria_id UUID REFERENCES categorias_despesa(id),
    mensalidade_id UUID REFERENCES mensalidades(id),
    conta_pagar_id UUID REFERENCES contas_pagar(id),
    data_movimentacao DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================
-- DIRETORIA E ELEIÇÕES
-- =============================================

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

CREATE TABLE chapas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eleicao_id UUID NOT NULL REFERENCES eleicoes(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    nome VARCHAR(255) NOT NULL,
    proposta TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE candidatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapa_id UUID NOT NULL REFERENCES chapas(id) ON DELETE CASCADE,
    associado_id UUID NOT NULL REFERENCES associados(id),
    cargo cargo_diretoria NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE votos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eleicao_id UUID NOT NULL REFERENCES eleicoes(id),
    chapa_id UUID REFERENCES chapas(id),
    associado_id UUID NOT NULL REFERENCES associados(id),
    data_voto TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(eleicao_id, associado_id)
);

-- =============================================
-- CONVITES
-- =============================================

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
    mes_referencia VARCHAR(7) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CONTROLE DE ACESSO
-- =============================================

CREATE TABLE pontos_acesso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('clube', 'piscina', 'academia')),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE registros_acesso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ponto_acesso_id UUID NOT NULL REFERENCES pontos_acesso(id),
    associado_id UUID REFERENCES associados(id),
    dependente_id UUID REFERENCES dependentes(id),
    agregado_id UUID REFERENCES agregados(id),
    convidado_id UUID REFERENCES convites(id),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    forma_identificacao VARCHAR(50),
    operador_id UUID REFERENCES usuarios(id),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================
-- RECLAMAÇÕES E PUNIÇÕES
-- =============================================

CREATE TABLE reclamacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reclamante_id UUID REFERENCES associados(id),
    reclamante_nome VARCHAR(255),
    reclamado_id UUID REFERENCES associados(id),
    descricao TEXT NOT NULL,
    local_ocorrencia VARCHAR(255),
    data_ocorrencia DATE,
    status VARCHAR(50) DEFAULT 'aberta',
    registrado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reunioes_diretoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_reuniao TIMESTAMPTZ NOT NULL,
    pauta TEXT,
    ata TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE punicoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID NOT NULL REFERENCES associados(id),
    reclamacao_id UUID REFERENCES reclamacoes(id),
    reuniao_id UUID REFERENCES reunioes_diretoria(id),
    tipo tipo_punicao NOT NULL,
    descricao TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    aplicado_por UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CRM WHATSAPP
-- =============================================

CREATE TABLE conversas_whatsapp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID REFERENCES associados(id),
    telefone VARCHAR(20) NOT NULL,
    nome_contato VARCHAR(255),
    ultimo_contato TIMESTAMPTZ,
    atendente_id UUID REFERENCES usuarios(id),
    status VARCHAR(50) DEFAULT 'aberta',
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mensagens_whatsapp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversa_id UUID NOT NULL REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
    direcao VARCHAR(10) NOT NULL CHECK (direcao IN ('entrada', 'saida')),
    conteudo TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'texto',
    arquivo_url TEXT,
    wasender_id VARCHAR(100),
    enviado_por UUID REFERENCES usuarios(id),
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE templates_mensagem (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(50),
    conteudo TEXT NOT NULL,
    variaveis TEXT[],
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE automacoes_whatsapp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    template_id UUID REFERENCES templates_mensagem(id),
    dias_antes INTEGER DEFAULT 3,
    hora_envio TIME DEFAULT '09:00',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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


-- =============================================
-- CARTEIRINHAS E ACADEMIA
-- =============================================

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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inscricoes_academia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID REFERENCES associados(id),
    dependente_id UUID REFERENCES dependentes(id),
    data_inicio DATE NOT NULL,
    data_fim DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LOGS E CONFIGURAÇÕES
-- =============================================

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

CREATE TABLE configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    tipo VARCHAR(50) DEFAULT 'texto',
    descricao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE config_sicoob (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id VARCHAR(255),
    client_secret TEXT,
    certificado_url TEXT,
    ambiente VARCHAR(20) DEFAULT 'sandbox',
    webhook_url TEXT,
    conta_corrente VARCHAR(50),
    agencia VARCHAR(20),
    pix_chave VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE config_wasender (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    api_key TEXT,
    device_id VARCHAR(100),
    webhook_url TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_associados_updated_at BEFORE UPDATE ON associados FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_dependentes_updated_at BEFORE UPDATE ON dependentes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_mensalidades_updated_at BEFORE UPDATE ON mensalidades FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION gerar_numero_titulo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_titulo IS NULL THEN
        NEW.numero_titulo := (SELECT COALESCE(MAX(numero_titulo), 0) + 1 FROM associados);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER associados_numero_titulo BEFORE INSERT ON associados FOR EACH ROW EXECUTE FUNCTION gerar_numero_titulo();

CREATE OR REPLACE FUNCTION gerar_qrcode_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.qrcode_hash := encode(sha256((NEW.id::text || NOW()::text)::bytea), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER carteirinhas_qrcode_hash BEFORE INSERT ON carteirinhas FOR EACH ROW EXECUTE FUNCTION gerar_qrcode_hash();
