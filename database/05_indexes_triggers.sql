-- =====================================================
-- INDEXES para Performance
-- =====================================================

-- Associados
CREATE INDEX idx_associados_cpf ON associados(cpf);
CREATE INDEX idx_associados_numero_titulo ON associados(numero_titulo);
CREATE INDEX idx_associados_plano ON associados(plano);
CREATE INDEX idx_associados_status ON associados(status);
CREATE INDEX idx_associados_qrcode ON associados(qrcode_hash);

-- Dependentes
CREATE INDEX idx_dependentes_associado ON dependentes(associado_id);
CREATE INDEX idx_dependentes_qrcode ON dependentes(qrcode_hash);

-- Mensalidades
CREATE INDEX idx_mensalidades_associado ON mensalidades(associado_id);
CREATE INDEX idx_mensalidades_status ON mensalidades(status);
CREATE INDEX idx_mensalidades_vencimento ON mensalidades(data_vencimento);
CREATE INDEX idx_mensalidades_referencia ON mensalidades(mes_referencia, ano_referencia);

-- Registros de Acesso
CREATE INDEX idx_registros_acesso_data ON registros_acesso(created_at);
CREATE INDEX idx_registros_acesso_local ON registros_acesso(local);
CREATE INDEX idx_registros_acesso_associado ON registros_acesso(associado_id);

-- WhatsApp
CREATE INDEX idx_conversas_telefone ON conversas_whatsapp(telefone);
CREATE INDEX idx_conversas_status ON conversas_whatsapp(status);
CREATE INDEX idx_mensagens_conversa ON mensagens_whatsapp(conversa_id);

-- =====================================================
-- FUNCTIONS e TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER trigger_updated_at_config_clube
  BEFORE UPDATE ON config_clube
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_updated_at_usuarios
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_updated_at_associados
  BEFORE UPDATE ON associados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_updated_at_dependentes
  BEFORE UPDATE ON dependentes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_updated_at_mensalidades
  BEFORE UPDATE ON mensalidades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Função: Validar candidato (patrimonial + 1 ano)
-- =====================================================
CREATE OR REPLACE FUNCTION validar_candidato()
RETURNS TRIGGER AS $$
DECLARE
  associado_plano plano_tipo;
  data_associacao DATE;
  tempo_associado INTERVAL;
BEGIN
  -- Buscar dados do associado
  SELECT plano, associados.data_associacao 
  INTO associado_plano, data_associacao
  FROM associados 
  WHERE id = NEW.associado_id;
  
  -- Verificar se é patrimonial
  IF associado_plano != 'patrimonial' THEN
    NEW.validado := false;
    NEW.motivo_invalidacao := 'Apenas associados com plano PATRIMONIAL podem se candidatar';
    RETURN NEW;
  END IF;
  
  -- Verificar se tem mais de 1 ano de associação
  tempo_associado := CURRENT_DATE - data_associacao;
  IF tempo_associado < INTERVAL '1 year' THEN
    NEW.validado := false;
    NEW.motivo_invalidacao := 'É necessário ter mais de 1 ano de título patrimonial';
    RETURN NEW;
  END IF;
  
  NEW.validado := true;
  NEW.motivo_invalidacao := NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_candidato
  BEFORE INSERT OR UPDATE ON candidatos
  FOR EACH ROW EXECUTE FUNCTION validar_candidato();

-- =====================================================
-- Função: Verificar idade do dependente
-- =====================================================
CREATE OR REPLACE FUNCTION verificar_idade_dependente()
RETURNS TRIGGER AS $$
DECLARE
  idade INTEGER;
BEGIN
  idade := EXTRACT(YEAR FROM AGE(CURRENT_DATE, NEW.data_nascimento));
  
  -- Se maior de 21 e não está cursando faculdade, desativar
  IF idade >= 21 AND NOT COALESCE(NEW.cursando_faculdade, false) THEN
    NEW.ativo := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_verificar_idade_dependente
  BEFORE INSERT OR UPDATE ON dependentes
  FOR EACH ROW EXECUTE FUNCTION verificar_idade_dependente();

-- =====================================================
-- Função: Verificar acesso ao clube
-- =====================================================
CREATE OR REPLACE FUNCTION verificar_acesso(
  p_qrcode VARCHAR,
  p_local VARCHAR
)
RETURNS TABLE (
  liberado BOOLEAN,
  motivo TEXT,
  pessoa_nome VARCHAR,
  pessoa_tipo VARCHAR,
  foto_url TEXT
) AS $$
DECLARE
  v_associado RECORD;
  v_dependente RECORD;
  v_mensalidade_ok BOOLEAN;
  v_exame_ok BOOLEAN;
  v_academia_ok BOOLEAN;
BEGIN
  -- Buscar associado pelo QR Code
  SELECT * INTO v_associado FROM associados WHERE qrcode_hash = p_qrcode;
  
  IF v_associado IS NOT NULL THEN
    -- Verificar status
    IF v_associado.status != 'ativo' THEN
      RETURN QUERY SELECT false, 'Associado ' || v_associado.status::TEXT, v_associado.nome_completo, 'associado'::VARCHAR, v_associado.foto_url;
      RETURN;
    END IF;
    
    -- Verificar mensalidade do clube
    SELECT EXISTS (
      SELECT 1 FROM mensalidades 
      WHERE associado_id = v_associado.id 
      AND tipo = 'clube'
      AND status = 'pago'
      AND mes_referencia = EXTRACT(MONTH FROM CURRENT_DATE)
      AND ano_referencia = EXTRACT(YEAR FROM CURRENT_DATE)
    ) INTO v_mensalidade_ok;
    
    IF NOT v_mensalidade_ok THEN
      RETURN QUERY SELECT false, 'Mensalidade do clube em atraso', v_associado.nome_completo, 'associado'::VARCHAR, v_associado.foto_url;
      RETURN;
    END IF;
    
    -- Verificar específico por local
    IF p_local = 'piscina' THEN
      IF v_associado.exame_medico_validade IS NULL OR v_associado.exame_medico_validade < CURRENT_DATE THEN
        RETURN QUERY SELECT false, 'Exame médico vencido ou não cadastrado', v_associado.nome_completo, 'associado'::VARCHAR, v_associado.foto_url;
        RETURN;
      END IF;
    ELSIF p_local = 'academia' THEN
      -- Verificar mensalidade da academia
      SELECT EXISTS (
        SELECT 1 FROM mensalidades 
        WHERE associado_id = v_associado.id 
        AND tipo = 'academia'
        AND status = 'pago'
        AND mes_referencia = EXTRACT(MONTH FROM CURRENT_DATE)
        AND ano_referencia = EXTRACT(YEAR FROM CURRENT_DATE)
      ) INTO v_academia_ok;
      
      IF NOT v_academia_ok THEN
        RETURN QUERY SELECT false, 'Mensalidade da academia em atraso', v_associado.nome_completo, 'associado'::VARCHAR, v_associado.foto_url;
        RETURN;
      END IF;
    END IF;
    
    -- Acesso liberado
    RETURN QUERY SELECT true, 'Acesso liberado'::TEXT, v_associado.nome_completo, 'associado'::VARCHAR, v_associado.foto_url;
    RETURN;
  END IF;
  
  -- Buscar dependente pelo QR Code
  SELECT d.*, a.id as titular_id, a.status as titular_status 
  INTO v_dependente 
  FROM dependentes d
  JOIN associados a ON d.associado_id = a.id
  WHERE d.qrcode_hash = p_qrcode;
  
  IF v_dependente IS NOT NULL THEN
    -- Verificações similares para dependente...
    IF NOT v_dependente.ativo THEN
      RETURN QUERY SELECT false, 'Dependente inativo', v_dependente.nome_completo, 'dependente'::VARCHAR, v_dependente.foto_url;
      RETURN;
    END IF;
    
    -- Verificar mensalidade do titular
    SELECT EXISTS (
      SELECT 1 FROM mensalidades 
      WHERE associado_id = v_dependente.titular_id 
      AND tipo = 'clube'
      AND status = 'pago'
      AND mes_referencia = EXTRACT(MONTH FROM CURRENT_DATE)
      AND ano_referencia = EXTRACT(YEAR FROM CURRENT_DATE)
    ) INTO v_mensalidade_ok;
    
    IF NOT v_mensalidade_ok THEN
      RETURN QUERY SELECT false, 'Mensalidade do titular em atraso', v_dependente.nome_completo, 'dependente'::VARCHAR, v_dependente.foto_url;
      RETURN;
    END IF;
    
    RETURN QUERY SELECT true, 'Acesso liberado'::TEXT, v_dependente.nome_completo, 'dependente'::VARCHAR, v_dependente.foto_url;
    RETURN;
  END IF;
  
  -- Não encontrado
  RETURN QUERY SELECT false, 'QR Code não encontrado'::TEXT, NULL::VARCHAR, NULL::VARCHAR, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Função: Gerar convites mensais (patrimonial)
-- =====================================================
CREATE OR REPLACE FUNCTION gerar_convites_mensais()
RETURNS void AS $$
DECLARE
  v_associado RECORD;
  v_mes INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
  v_ano INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
BEGIN
  -- Para cada associado patrimonial ativo
  FOR v_associado IN 
    SELECT id FROM associados 
    WHERE plano = 'patrimonial' AND status = 'ativo'
  LOOP
    -- Verificar se já tem convites do mês
    IF NOT EXISTS (
      SELECT 1 FROM convites 
      WHERE associado_id = v_associado.id 
      AND mes_referencia = v_mes 
      AND ano_referencia = v_ano
    ) THEN
      -- Criar 2 convites
      INSERT INTO convites (associado_id, mes_referencia, ano_referencia, nome_convidado)
      VALUES 
        (v_associado.id, v_mes, v_ano, 'Convite 1'),
        (v_associado.id, v_mes, v_ano, 'Convite 2');
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
