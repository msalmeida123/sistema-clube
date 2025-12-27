-- =====================================================
-- SISTEMA DE GESTÃO DE CLUBE
-- Schema SQL para Supabase
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUM TYPES
-- =====================================================

-- Tipos de plano
CREATE TYPE plano_tipo AS ENUM ('individual', 'familiar', 'patrimonial');

-- Tipos de residência
CREATE TYPE residencia_tipo AS ENUM ('casa', 'apartamento');

-- Status do associado
CREATE TYPE associado_status AS ENUM ('ativo', 'inativo', 'suspenso', 'expulso');

-- Tipos de usuário do sistema
CREATE TYPE usuario_role AS ENUM (
  'admin',
  'presidente', 
  'vice_presidente',
  'diretor',
  'financeiro',
  'secretaria',
  'portaria_clube',
  'portaria_piscina',
  'portaria_academia',
  'atendimento',
  'associado'
);

-- Status de pagamento
CREATE TYPE pagamento_status AS ENUM ('pendente', 'pago', 'vencido', 'cancelado');

-- Tipo de pagamento
CREATE TYPE pagamento_tipo AS ENUM ('boleto', 'pix');

-- Status de compra
CREATE TYPE compra_status AS ENUM ('solicitada', 'cotacao', 'aprovada', 'rejeitada', 'finalizada');

-- Status de eleição
CREATE TYPE eleicao_status AS ENUM ('agendada', 'inscricoes', 'votacao', 'encerrada');

-- Tipo de punição
CREATE TYPE punicao_tipo AS ENUM ('advertencia', 'suspensao', 'expulsao');

-- Status de conversa WhatsApp
CREATE TYPE conversa_status AS ENUM ('aberta', 'pendente', 'resolvida', 'arquivada');

-- =====================================================
-- TABELA: Configuração do Clube
-- =====================================================
CREATE TABLE config_clube (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  logo_url TEXT,
  foto_clube_url TEXT, -- Para verso da carteirinha
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
  
  -- Configurações Sicoob
  sicoob_client_id TEXT,
  sicoob_client_secret TEXT,
  sicoob_pix_key TEXT,
  sicoob_conta VARCHAR(20),
  sicoob_agencia VARCHAR(10),
  
  -- Configurações WaSenderAPI
  wasender_api_key TEXT,
  wasender_device_id TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Usuários do Sistema
-- =====================================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  role usuario_role NOT NULL DEFAULT 'associado',
  ativo BOOLEAN DEFAULT true,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  associado_id UUID, -- Referência ao associado se for role 'associado'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Associados
-- =====================================================
CREATE TABLE associados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_titulo SERIAL UNIQUE,
  
  -- Dados pessoais
  nome_completo VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  rg VARCHAR(20),
  titulo_eleitor VARCHAR(20),
  data_nascimento DATE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  foto_url TEXT,
  
  -- Endereço
  cep VARCHAR(10),
  endereco VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  tipo_residencia residencia_tipo DEFAULT 'casa',
  
  -- Plano e status
  plano plano_tipo NOT NULL DEFAULT 'individual',
  status associado_status DEFAULT 'ativo',
  data_associacao DATE DEFAULT CURRENT_DATE,
  
  -- QR Code único
  qrcode_hash VARCHAR(64) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Controle academia
  academia_ativo BOOLEAN DEFAULT false,
  
  -- Controle exame médico
  exame_medico_validade DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: Dependentes
-- =====================================================
CREATE TABLE dependentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  
  nome_completo VARCHAR(255) NOT NULL,
  cpf VARCHAR(14),
  rg VARCHAR(20),
  data_nascimento DATE NOT NULL,
  parentesco VARCHAR(50) NOT NULL, -- filho, pai, mae, sogro, sogra
  foto_url TEXT,
  
  -- Controle de idade (até 21 anos ou faculdade)
  cursando_faculdade BOOLEAN DEFAULT false,
  comprovante_faculdade_url TEXT,
  
  -- QR Code único
  qrcode_hash VARCHAR(64) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Controle academia
  academia_ativo BOOLEAN DEFAULT false,
  
  -- Controle exame médico
  exame_medico_validade DATE,
  
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
