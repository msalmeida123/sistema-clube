-- =============================================
-- ROW LEVEL SECURITY (RLS) - POLÍTICAS DE SEGURANÇA
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE clube_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE associados ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE agregados ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames_medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_valores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pix_cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pontos_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE diretoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reclamacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE punicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE carteirinhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes_academia ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_sistema ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FUNÇÃO HELPER PARA VERIFICAR SETOR DO USUÁRIO
-- =============================================

CREATE OR REPLACE FUNCTION get_user_setor()
RETURNS setor_usuario AS $$
BEGIN
    RETURN (
        SELECT setor FROM usuarios WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_or_diretoria()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_setor() IN ('admin', 'presidente', 'vice_presidente', 'diretoria');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_financeiro()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_setor() IN ('admin', 'presidente', 'vice_presidente', 'financeiro');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_secretaria()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_setor() IN ('admin', 'presidente', 'vice_presidente', 'diretoria', 'secretaria');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_portaria()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_setor() IN ('admin', 'presidente', 'vice_presidente', 'diretoria', 'portaria_clube', 'portaria_piscina', 'portaria_academia');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_atendimento()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_setor() IN ('admin', 'presidente', 'vice_presidente', 'diretoria', 'atendimento');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

