-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Segurança por Setor
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE config_clube ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE associados ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE diretoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reclamacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE punicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Função auxiliar para verificar role do usuário
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS usuario_role AS $$
BEGIN
  RETURN (
    SELECT role FROM usuarios 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é admin ou direção
CREATE OR REPLACE FUNCTION is_admin_or_direcao()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('admin', 'presidente', 'vice_presidente', 'diretor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é financeiro
CREATE OR REPLACE FUNCTION is_financeiro()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('admin', 'presidente', 'vice_presidente', 'diretor', 'financeiro');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é secretaria
CREATE OR REPLACE FUNCTION is_secretaria()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role() IN ('admin', 'presidente', 'vice_presidente', 'diretor', 'secretaria');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se é portaria
CREATE OR REPLACE FUNCTION is_portaria()
RETURNS BOOLEAN AS $$
DECLARE
  user_role usuario_role;
BEGIN
  user_role := get_user_role();
  RETURN user_role IN (
    'admin', 'presidente', 'vice_presidente', 'diretor',
    'portaria_clube', 'portaria_piscina', 'portaria_academia'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLICIES: Config do Clube
-- =====================================================
CREATE POLICY "Config: Admin pode tudo"
  ON config_clube FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Config: Todos podem ver"
  ON config_clube FOR SELECT
  USING (true);

-- =====================================================
-- POLICIES: Usuários
-- =====================================================
CREATE POLICY "Usuarios: Admin pode tudo"
  ON usuarios FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "Usuarios: Ver próprio perfil"
  ON usuarios FOR SELECT
  USING (id = auth.uid());

-- =====================================================
-- POLICIES: Associados
-- =====================================================
-- Secretaria e direção podem ver e editar
CREATE POLICY "Associados: Secretaria pode tudo"
  ON associados FOR ALL
  USING (is_secretaria());

-- Portaria pode ver (para validar acesso)
CREATE POLICY "Associados: Portaria pode ver"
  ON associados FOR SELECT
  USING (is_portaria());

-- Associado pode ver próprio cadastro
CREATE POLICY "Associados: Ver próprio cadastro"
  ON associados FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.id = auth.uid() 
      AND usuarios.associado_id = associados.id
    )
  );

-- =====================================================
-- POLICIES: Dependentes
-- =====================================================
CREATE POLICY "Dependentes: Secretaria pode tudo"
  ON dependentes FOR ALL
  USING (is_secretaria());

CREATE POLICY "Dependentes: Portaria pode ver"
  ON dependentes FOR SELECT
  USING (is_portaria());

-- =====================================================
-- POLICIES: Documentos
-- =====================================================
CREATE POLICY "Documentos: Secretaria pode tudo"
  ON documentos FOR ALL
  USING (is_secretaria());

-- =====================================================
-- POLICIES: Mensalidades (Financeiro)
-- =====================================================
CREATE POLICY "Mensalidades: Financeiro pode tudo"
  ON mensalidades FOR ALL
  USING (is_financeiro());

-- Portaria pode ver status para validar acesso
CREATE POLICY "Mensalidades: Portaria pode ver status"
  ON mensalidades FOR SELECT
  USING (is_portaria());

-- =====================================================
-- POLICIES: Contas a Pagar (Financeiro)
-- =====================================================
CREATE POLICY "ContasPagar: Financeiro pode tudo"
  ON contas_pagar FOR ALL
  USING (is_financeiro());

-- =====================================================
-- POLICIES: Fornecedores (Financeiro)
-- =====================================================
CREATE POLICY "Fornecedores: Financeiro pode tudo"
  ON fornecedores FOR ALL
  USING (is_financeiro());

-- =====================================================
-- POLICIES: Compras e Orçamentos (Financeiro)
-- =====================================================
CREATE POLICY "Compras: Financeiro pode tudo"
  ON compras FOR ALL
  USING (is_financeiro());

CREATE POLICY "Orcamentos: Financeiro pode tudo"
  ON orcamentos FOR ALL
  USING (is_financeiro());

-- =====================================================
-- POLICIES: Registros de Acesso
-- =====================================================
CREATE POLICY "RegistrosAcesso: Portaria pode inserir"
  ON registros_acesso FOR INSERT
  USING (is_portaria());

CREATE POLICY "RegistrosAcesso: Admin e direção podem ver"
  ON registros_acesso FOR SELECT
  USING (is_admin_or_direcao());

-- =====================================================
-- POLICIES: WhatsApp (Atendimento)
-- =====================================================
CREATE POLICY "WhatsApp: Atendimento pode tudo"
  ON conversas_whatsapp FOR ALL
  USING (
    get_user_role() IN ('admin', 'presidente', 'vice_presidente', 'diretor', 'atendimento')
  );

CREATE POLICY "MensagensWpp: Atendimento pode tudo"
  ON mensagens_whatsapp FOR ALL
  USING (
    get_user_role() IN ('admin', 'presidente', 'vice_presidente', 'diretor', 'atendimento')
  );

-- =====================================================
-- POLICIES: Eleições
-- =====================================================
CREATE POLICY "Eleicoes: Admin e direção podem gerenciar"
  ON eleicoes FOR ALL
  USING (is_admin_or_direcao());

CREATE POLICY "Eleicoes: Todos podem ver"
  ON eleicoes FOR SELECT
  USING (true);

-- =====================================================
-- POLICIES: Audit Logs
-- =====================================================
CREATE POLICY "AuditLogs: Apenas Admin pode ver"
  ON audit_logs FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "AuditLogs: Sistema pode inserir"
  ON audit_logs FOR INSERT
  USING (true);
