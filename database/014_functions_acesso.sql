-- =====================================================
-- FUNÇÕES DE CONTROLE DE ACESSO
-- =====================================================

-- Verificar se associado pode entrar no clube
CREATE OR REPLACE FUNCTION verificar_acesso_clube(p_associado_id UUID)
RETURNS TABLE (
  autorizado BOOLEAN,
  motivo TEXT
) AS $$
DECLARE
  v_status status_associado;
  v_mensalidade_status status_pagamento;
BEGIN
  -- Verificar status do associado
  SELECT status INTO v_status FROM associados WHERE id = p_associado_id;
  
  IF v_status IS NULL THEN
    RETURN QUERY SELECT false, 'Associado não encontrado';
    RETURN;
  END IF;
  
  IF v_status != 'ativo' THEN
    RETURN QUERY SELECT false, 'Associado ' || v_status::TEXT;
    RETURN;
  END IF;
  
  -- Verificar mensalidade em dia
  SELECT m.status INTO v_mensalidade_status
  FROM mensalidades m
  WHERE m.associado_id = p_associado_id
    AND m.tipo = 'clube'
    AND m.data_vencimento <= CURRENT_DATE
  ORDER BY m.data_vencimento DESC
  LIMIT 1;
  
  IF v_mensalidade_status = 'pendente' OR v_mensalidade_status = 'atrasado' THEN
    RETURN QUERY SELECT false, 'Mensalidade em atraso';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Acesso liberado';
END;
$$ LANGUAGE plpgsql;

-- Verificar se pode entrar na piscina (clube + exame médico)
CREATE OR REPLACE FUNCTION verificar_acesso_piscina(p_associado_id UUID, p_dependente_id UUID DEFAULT NULL)
RETURNS TABLE (
  autorizado BOOLEAN,
  motivo TEXT
) AS $$
DECLARE
  v_acesso_clube RECORD;
  v_exame_valido BOOLEAN;
  v_pessoa_id UUID;
BEGIN
  -- Primeiro verificar acesso ao clube
  SELECT * INTO v_acesso_clube FROM verificar_acesso_clube(p_associado_id);
  
  IF NOT v_acesso_clube.autorizado THEN
    RETURN QUERY SELECT v_acesso_clube.autorizado, v_acesso_clube.motivo;
    RETURN;
  END IF;
  
  -- Verificar exame médico
  v_pessoa_id := COALESCE(p_dependente_id, p_associado_id);
  
  SELECT EXISTS(
    SELECT 1 FROM exames_medicos
    WHERE (associado_id = p_associado_id OR dependente_id = p_dependente_id)
      AND data_validade >= CURRENT_DATE
  ) INTO v_exame_valido;
  
  IF NOT v_exame_valido THEN
    RETURN QUERY SELECT false, 'Exame médico vencido ou não cadastrado';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Acesso liberado';
END;
$$ LANGUAGE plpgsql;

-- Verificar se pode entrar na academia (mensalidade academia)
CREATE OR REPLACE FUNCTION verificar_acesso_academia(p_associado_id UUID)
RETURNS TABLE (
  autorizado BOOLEAN,
  motivo TEXT
) AS $$
DECLARE
  v_mensalidade_academia status_pagamento;
BEGIN
  -- Verificar mensalidade da academia
  SELECT m.status INTO v_mensalidade_academia
  FROM mensalidades m
  WHERE m.associado_id = p_associado_id
    AND m.tipo = 'academia'
    AND m.data_vencimento <= CURRENT_DATE
  ORDER BY m.data_vencimento DESC
  LIMIT 1;
  
  IF v_mensalidade_academia IS NULL THEN
    RETURN QUERY SELECT false, 'Não matriculado na academia';
    RETURN;
  END IF;
  
  IF v_mensalidade_academia = 'pendente' OR v_mensalidade_academia = 'atrasado' THEN
    RETURN QUERY SELECT false, 'Mensalidade da academia em atraso';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Acesso liberado';
END;
$$ LANGUAGE plpgsql;

