-- Atualizar tabela clube_config com todos os campos do cadastro

-- Adicionar novos campos
ALTER TABLE clube_config ADD COLUMN IF NOT EXISTS nome_fantasia VARCHAR(255);
ALTER TABLE clube_config ADD COLUMN IF NOT EXISTS inscricao_estadual VARCHAR(50);
ALTER TABLE clube_config ADD COLUMN IF NOT EXISTS inscricao_municipal VARCHAR(50);
ALTER TABLE clube_config ADD COLUMN IF NOT EXISTS complemento VARCHAR(100);
ALTER TABLE clube_config ADD COLUMN IF NOT EXISTS telefone2 VARCHAR(20);
ALTER TABLE clube_config ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE clube_config ADD COLUMN IF NOT EXISTS data_fundacao DATE;
ALTER TABLE clube_config ADD COLUMN IF NOT EXISTS presidente VARCHAR(255);
ALTER TABLE clube_config ADD COLUMN IF NOT EXISTS vice_presidente VARCHAR(255);
ALTER TABLE clube_config ADD COLUMN IF NOT EXISTS responsavel_financeiro VARCHAR(255);

-- Inserir registro padrão se não existir
INSERT INTO clube_config (id, nome) 
VALUES ('1', 'Meu Clube')
ON CONFLICT (id) DO NOTHING;
