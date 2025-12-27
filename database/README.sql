-- =============================================
-- SISTEMA DE CLUBE - SCRIPT COMPLETO
-- Execute este arquivo no Supabase SQL Editor
-- =============================================

-- Execute os arquivos na ordem:
-- 001_schema.sql (ENUMs)
-- 002_tabelas_principais.sql
-- 003_documentos_dependentes.sql
-- 004_financeiro.sql
-- 005_compras_contas.sql
-- 006_acesso_eleicoes.sql
-- 007_punicoes_crm.sql
-- 008_carteirinhas_config.sql
-- 009_rls_funcoes.sql
-- 010_rls_policies.sql
-- 011_triggers_funcoes.sql
-- 012_seed.sql

-- =============================================
-- STORAGE BUCKETS (executar via Supabase Dashboard)
-- =============================================

-- Criar os seguintes buckets no Storage:
-- 1. fotos-associados (público)
-- 2. documentos (privado)
-- 3. exames-medicos (privado)
-- 4. historicos-escolares (privado)
-- 5. notas-fiscais (privado)
-- 6. cotacoes (privado)
-- 7. clube-assets (público) - logo, foto do clube

-- =============================================
-- CONFIGURAÇÃO INICIAL
-- =============================================

-- Após executar todos os scripts:
-- 1. Criar usuário admin no Supabase Auth
-- 2. Inserir o usuário na tabela 'usuarios' com setor='admin'
-- 3. Configurar dados do clube na tabela 'clube_config'
-- 4. Configurar integração Sicoob em 'config_sicoob'
-- 5. Configurar WaSenderAPI em 'config_wasender'
