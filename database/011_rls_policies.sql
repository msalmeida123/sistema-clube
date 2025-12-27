-- =====================================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE ACESSO
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE clube_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE associados ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames_medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE diretoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reclamacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE punicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para pegar tipo do usuário
CREATE OR REPLACE FUNCTION get_user_tipo()
RETURNS tipo_usuario AS $$
  SELECT tipo FROM usuarios WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Função para verificar se é admin ou diretoria
CREATE OR REPLACE FUNCTION is_admin_or_diretoria()
RETURNS BOOLEAN AS $$
  SELECT get_user_tipo() IN ('admin', 'presidente', 'vice_presidente', 'diretor')
$$ LANGUAGE sql SECURITY DEFINER;

-- Função para verificar se é financeiro
CREATE OR REPLACE FUNCTION is_financeiro()
RETURNS BOOLEAN AS $$
  SELECT get_user_tipo() IN ('admin', 'presidente', 'vice_presidente', 'financeiro')
$$ LANGUAGE sql SECURITY DEFINER;

-- Função para verificar se é secretaria
CREATE OR REPLACE FUNCTION is_secretaria()
RETURNS BOOLEAN AS $$
  SELECT get_user_tipo() IN ('admin', 'presidente', 'vice_presidente', 'secretaria')
$$ LANGUAGE sql SECURITY DEFINER;

-- Função para verificar se é portaria
CREATE OR REPLACE FUNCTION is_portaria()
RETURNS BOOLEAN AS $$
  SELECT get_user_tipo() IN (
    'admin', 'presidente', 'vice_presidente',
    'portaria_clube', 'portaria_piscina', 'portaria_academia'
  )
$$ LANGUAGE sql SECURITY DEFINER;

-- Função para verificar se é atendimento
CREATE OR REPLACE FUNCTION is_atendimento()
RETURNS BOOLEAN AS $$
  SELECT get_user_tipo() IN ('admin', 'presidente', 'vice_presidente', 'atendimento')
$$ LANGUAGE sql SECURITY DEFINER;

