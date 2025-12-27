-- Atualizar tabela de usuários para sistema de permissões individuais

-- Adicionar coluna is_admin
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Adicionar coluna permissoes (array de strings)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permissoes TEXT[] DEFAULT ARRAY['dashboard'];

-- Remover coluna setor se existir (não é mais necessária)
ALTER TABLE usuarios DROP COLUMN IF EXISTS setor;

-- Atualizar usuário admin existente
UPDATE usuarios SET is_admin = true, permissoes = ARRAY[
  'dashboard', 'associados', 'dependentes', 'financeiro', 'compras', 
  'portaria', 'exames', 'infracoes', 'eleicoes', 'relatorios', 
  'crm', 'configuracoes', 'usuarios'
] WHERE email = 'the.marcelo.ms@gmail.com';
