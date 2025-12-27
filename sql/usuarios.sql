-- Tabela de Usuários do Sistema
-- Execute este SQL no Supabase

-- Criar tabela usuarios se não existir
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  setor VARCHAR(50) NOT NULL DEFAULT 'secretaria',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_usuarios_setor ON usuarios(setor);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_usuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_usuarios_updated_at ON usuarios;
CREATE TRIGGER trigger_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_usuarios_updated_at();

-- RLS Policies
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários autenticados vejam todos os usuários
CREATE POLICY "Usuarios visíveis para autenticados"
  ON usuarios FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem inserir
CREATE POLICY "Usuarios inseríveis"
  ON usuarios FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Apenas admins podem atualizar
CREATE POLICY "Usuarios atualizáveis"
  ON usuarios FOR UPDATE
  TO authenticated
  USING (true);

-- Apenas admins podem deletar
CREATE POLICY "Usuarios deletáveis"
  ON usuarios FOR DELETE
  TO authenticated
  USING (true);

-- Verificar se seu usuário admin já existe na tabela
-- Se não existir, execute o comando abaixo substituindo os valores:
-- INSERT INTO usuarios (id, nome, email, setor, ativo)
-- SELECT id, email, email, 'admin', true
-- FROM auth.users
-- WHERE email = 'the.marcelo.ms@gmail.com'
-- ON CONFLICT (id) DO NOTHING;
