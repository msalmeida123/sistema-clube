-- =============================================
-- SISTEMA DE CLUBE - SCHEMA COMPLETO
-- Banco: Supabase (PostgreSQL)
-- =============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- ENUMS
-- =============================================

-- Tipos de plano
CREATE TYPE tipo_plano AS ENUM ('individual', 'familiar', 'patrimonial');

-- Tipos de residência
CREATE TYPE tipo_residencia AS ENUM ('casa', 'apartamento');

-- Status do associado
CREATE TYPE status_associado AS ENUM ('ativo', 'inativo', 'suspenso', 'expulso');

-- Status de pagamento
CREATE TYPE status_pagamento AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');

-- Tipo de pagamento
CREATE TYPE tipo_pagamento AS ENUM ('boleto', 'pix');

-- Tipo de cobrança
CREATE TYPE tipo_cobranca AS ENUM ('mensalidade_clube', 'mensalidade_academia', 'taxa_familiar');

-- Status da compra
CREATE TYPE status_compra AS ENUM ('solicitado', 'em_cotacao', 'aprovado', 'comprado', 'cancelado');

-- Cargos da diretoria
CREATE TYPE cargo_diretoria AS ENUM ('presidente', 'vice_presidente', 'diretor', 'conselheiro');

-- Setores do sistema
CREATE TYPE setor_usuario AS ENUM ('admin', 'presidente', 'vice_presidente', 'diretoria', 'financeiro', 'secretaria', 'portaria_clube', 'portaria_piscina', 'portaria_academia', 'atendimento');

-- Status da eleição
CREATE TYPE status_eleicao AS ENUM ('agendada', 'em_votacao', 'encerrada', 'cancelada');

-- Tipo de punição
CREATE TYPE tipo_punicao AS ENUM ('advertencia', 'suspensao', 'expulsao');

-- Status do convite
CREATE TYPE status_convite AS ENUM ('disponivel', 'usado', 'expirado');

