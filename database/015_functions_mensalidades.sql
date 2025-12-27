-- =====================================================
-- FUNÇÕES DE CONVITES E MENSALIDADES
-- =====================================================

-- Gerar convites mensais para patrimoniais (executar todo dia 1)
CREATE OR REPLACE FUNCTION gerar_convites_mensais()
RETURNS INTEGER AS $$
DECLARE
  v_mes_atual DATE;
  v_qtd_convites INTEGER;
  v_count INTEGER := 0;
  r_associado RECORD;
BEGIN
  v_mes_atual := DATE_TRUNC('month', CURRENT_DATE);
  
  -- Buscar quantidade de convites da configuração
  SELECT valor::INTEGER INTO v_qtd_convites
  FROM configuracoes WHERE chave = 'convites_patrimonial_mes';
  
  v_qtd_convites := COALESCE(v_qtd_convites, 2);
  
  -- Para cada associado patrimonial ativo
  FOR r_associado IN
    SELECT id FROM associados 
    WHERE tipo_plano = 'patrimonial' AND status = 'ativo'
  LOOP
    -- Verificar se já tem convites do mês
    IF NOT EXISTS (
      SELECT 1 FROM convites 
      WHERE associado_id = r_associado.id AND mes_referencia = v_mes_atual
    ) THEN
      -- Criar convites
      FOR i IN 1..v_qtd_convites LOOP
        INSERT INTO convites (associado_id, mes_referencia, nome_convidado)
        VALUES (r_associado.id, v_mes_atual, '');
        v_count := v_count + 1;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Gerar mensalidades do mês
CREATE OR REPLACE FUNCTION gerar_mensalidades_mes(p_mes DATE)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  r_associado RECORD;
  v_valor DECIMAL(10,2);
  v_valor_dependentes DECIMAL(10,2);
  v_total_dependentes INTEGER;
  v_dia_vencimento INTEGER := 10;
BEGIN
  FOR r_associado IN
    SELECT a.id, a.tipo_plano
    FROM associados a
    WHERE a.status = 'ativo'
  LOOP
    -- Verificar se já existe mensalidade do mês
    IF NOT EXISTS (
      SELECT 1 FROM mensalidades
      WHERE associado_id = r_associado.id
        AND mes_referencia = p_mes
        AND tipo = 'clube'
    ) THEN
      -- Buscar valor do plano
      SELECT valor_mensal, taxa_dependente_extra 
      INTO v_valor, v_valor_dependentes
      FROM planos_valores
      WHERE tipo = r_associado.tipo_plano AND ativo = true
      ORDER BY vigencia_inicio DESC LIMIT 1;
      
      -- Contar dependentes extras (se familiar, cobrar taxa)
      IF r_associado.tipo_plano = 'familiar' THEN
        SELECT COUNT(*) INTO v_total_dependentes
        FROM dependentes
        WHERE associado_id = r_associado.id AND ativo = true
          AND parentesco IN ('pai', 'mae', 'sogra', 'sogro');
        
        v_valor := v_valor + (v_total_dependentes * COALESCE(v_valor_dependentes, 0));
      END IF;
      
      -- Inserir mensalidade
      INSERT INTO mensalidades (
        associado_id, tipo, mes_referencia, valor, valor_total,
        data_vencimento, status
      ) VALUES (
        r_associado.id, 'clube', p_mes, v_valor, v_valor,
        p_mes + (v_dia_vencimento - 1), 'pendente'
      );
      
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Atualizar saldo da conta bancária
CREATE OR REPLACE FUNCTION atualizar_saldo_conta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE contas_bancarias 
    SET saldo_atual = saldo_atual + NEW.valor
    WHERE id = NEW.conta_id;
  ELSE
    UPDATE contas_bancarias 
    SET saldo_atual = saldo_atual - NEW.valor
    WHERE id = NEW.conta_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER atualizar_saldo_trigger
  AFTER INSERT ON movimentacoes
  FOR EACH ROW EXECUTE FUNCTION atualizar_saldo_conta();

