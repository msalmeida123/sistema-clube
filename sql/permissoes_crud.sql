-- ==========================================
-- SISTEMA DE PERMISSÕES CRUD
-- Execute no Supabase SQL Editor
-- ==========================================

-- 1. Tabela de Páginas do Sistema
CREATE TABLE IF NOT EXISTS paginas_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  icone VARCHAR(50),
  rota VARCHAR(200),
  pagina_pai_id UUID REFERENCES paginas_sistema(id),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Perfis de Acesso
CREATE TABLE IF NOT EXISTS perfis_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Permissões do Perfil
CREATE TABLE IF NOT EXISTS permissoes_perfil (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES perfis_acesso(id) ON DELETE CASCADE,
  pagina_id UUID NOT NULL REFERENCES paginas_sistema(id) ON DELETE CASCADE,
  pode_visualizar BOOLEAN DEFAULT false,
  pode_criar BOOLEAN DEFAULT false,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(perfil_id, pagina_id)
);

-- 4. Tabela de Permissões do Usuário
CREATE TABLE IF NOT EXISTS permissoes_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pagina_id UUID NOT NULL REFERENCES paginas_sistema(id) ON DELETE CASCADE,
  pode_visualizar BOOLEAN DEFAULT false,
  pode_criar BOOLEAN DEFAULT false,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, pagina_id)
);

-- 5. Adicionar coluna perfil_acesso_id na tabela usuarios (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'usuarios' AND column_name = 'perfil_acesso_id'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN perfil_acesso_id UUID REFERENCES perfis_acesso(id);
  END IF;
END $$;

-- 6. Inserir Páginas do Sistema
INSERT INTO paginas_sistema (codigo, nome, descricao, icone, rota, ordem) VALUES
('dashboard', 'Dashboard', 'Página inicial com resumo', 'LayoutDashboard', '/dashboard', 1),
('associados', 'Associados', 'Gerenciamento de associados', 'Users', '/dashboard/associados', 2),
('dependentes', 'Dependentes', 'Gerenciamento de dependentes', 'UserPlus', '/dashboard/dependentes', 3),
('financeiro', 'Financeiro', 'Mensalidades e cobranças', 'DollarSign', '/dashboard/financeiro', 4),
('compras', 'Compras', 'Controle de compras', 'ShoppingCart', '/dashboard/compras', 5),
('portaria', 'Portaria', 'Controle de acesso', 'DoorOpen', '/dashboard/portaria', 6),
('exames', 'Exames Médicos', 'Gestão de exames médicos', 'Stethoscope', '/dashboard/exames-medicos', 7),
('infracoes', 'Infrações', 'Registro de infrações', 'AlertTriangle', '/dashboard/infracoes', 8),
('eleicoes', 'Eleições', 'Sistema de votação', 'Vote', '/dashboard/eleicoes', 9),
('relatorios', 'Relatórios', 'Relatórios gerenciais', 'FileText', '/dashboard/relatorios', 10),
('crm', 'CRM / WhatsApp', 'Comunicação com associados', 'MessageSquare', '/dashboard/crm', 11),
('configuracoes', 'Configurações', 'Configurações do sistema', 'Settings', '/dashboard/configuracoes', 12),
('usuarios', 'Usuários', 'Gerenciamento de usuários', 'Shield', '/dashboard/permissoes', 13)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone,
  rota = EXCLUDED.rota,
  ordem = EXCLUDED.ordem;

-- 7. Criar Perfis Padrão
INSERT INTO perfis_acesso (nome, descricao) VALUES
('Administrador', 'Acesso total ao sistema'),
('Portaria', 'Acesso apenas à portaria'),
('Financeiro', 'Acesso ao módulo financeiro'),
('Atendimento', 'Acesso a associados e CRM')
ON CONFLICT DO NOTHING;

-- 8. Índices para performance
CREATE INDEX IF NOT EXISTS idx_permissoes_usuario_usuario ON permissoes_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_usuario_pagina ON permissoes_usuario(pagina_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_perfil_perfil ON permissoes_perfil(perfil_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_perfil_pagina ON permissoes_perfil(pagina_id);
CREATE INDEX IF NOT EXISTS idx_paginas_sistema_codigo ON paginas_sistema(codigo);

-- 9. RLS Policies
ALTER TABLE paginas_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes_usuario ENABLE ROW LEVEL SECURITY;

-- Policies para leitura (todos autenticados podem ler)
CREATE POLICY IF NOT EXISTS "Paginas visíveis para autenticados" ON paginas_sistema
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Perfis visíveis para autenticados" ON perfis_acesso
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Permissoes perfil visíveis para autenticados" ON permissoes_perfil
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Permissoes usuario visíveis para autenticados" ON permissoes_usuario
  FOR SELECT TO authenticated USING (true);

-- Policies para escrita (apenas admins - via service_role ou verificação is_admin)
CREATE POLICY IF NOT EXISTS "Admins podem modificar paginas" ON paginas_sistema
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY IF NOT EXISTS "Admins podem modificar perfis" ON perfis_acesso
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY IF NOT EXISTS "Admins podem modificar permissoes_perfil" ON permissoes_perfil
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND is_admin = true)
  );

CREATE POLICY IF NOT EXISTS "Admins podem modificar permissoes_usuario" ON permissoes_usuario
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND is_admin = true)
  );

-- 10. Dar permissões ao perfil Portaria
DO $$
DECLARE
  v_perfil_id UUID;
  v_pagina_id UUID;
BEGIN
  -- Buscar ID do perfil Portaria
  SELECT id INTO v_perfil_id FROM perfis_acesso WHERE nome = 'Portaria' LIMIT 1;
  
  IF v_perfil_id IS NOT NULL THEN
    -- Buscar ID da página Portaria
    SELECT id INTO v_pagina_id FROM paginas_sistema WHERE codigo = 'portaria' LIMIT 1;
    
    IF v_pagina_id IS NOT NULL THEN
      INSERT INTO permissoes_perfil (perfil_id, pagina_id, pode_visualizar, pode_criar, pode_editar, pode_excluir)
      VALUES (v_perfil_id, v_pagina_id, true, true, true, false)
      ON CONFLICT (perfil_id, pagina_id) DO UPDATE SET
        pode_visualizar = true,
        pode_criar = true,
        pode_editar = true;
    END IF;
    
    -- Dashboard também
    SELECT id INTO v_pagina_id FROM paginas_sistema WHERE codigo = 'dashboard' LIMIT 1;
    IF v_pagina_id IS NOT NULL THEN
      INSERT INTO permissoes_perfil (perfil_id, pagina_id, pode_visualizar, pode_criar, pode_editar, pode_excluir)
      VALUES (v_perfil_id, v_pagina_id, true, false, false, false)
      ON CONFLICT (perfil_id, pagina_id) DO UPDATE SET pode_visualizar = true;
    END IF;
  END IF;
END $$;

SELECT 'Tabelas de permissões criadas com sucesso!' as resultado;
