-- =====================================================
-- FUNCTIONS E TRIGGERS
-- =====================================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas com updated_at
CREATE TRIGGER update_clube_config_updated_at
  BEFORE UPDATE ON clube_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_associados_updated_at
  BEFORE UPDATE ON associados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_dependentes_updated_at
  BEFORE UPDATE ON dependentes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- VALIDAR CANDIDATO ELEIÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION validar_candidato()
RETURNS TRIGGER AS $$
DECLARE
  v_plano tipo_plano;
  v_data_associacao DATE;
  v_anos_titulo INTEGER;
BEGIN
  -- Buscar dados do associado
  SELECT tipo_plano, data_associacao 
  INTO v_plano, v_data_associacao
  FROM associados WHERE id = NEW.associado_id;
  
  -- Verificar se é patrimonial
  IF v_plano != 'patrimonial' THEN
    RAISE EXCEPTION 'Candidato deve ser sócio patrimonial';
  END IF;
  
  -- Verificar tempo mínimo (1 ano)
  v_anos_titulo := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_data_associacao));
  IF v_anos_titulo < 1 THEN
    RAISE EXCEPTION 'Candidato deve ter no mínimo 1 ano de título patrimonial';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validar_candidato_trigger
  BEFORE INSERT ON candidatos
  FOR EACH ROW EXECUTE FUNCTION validar_candidato();

-- =====================================================
-- VALIDAR VOTO ELEIÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION validar_voto()
RETURNS TRIGGER AS $$
DECLARE
  v_plano tipo_plano;
  v_data_associacao DATE;
  v_anos_titulo INTEGER;
BEGIN
  -- Buscar dados do associado
  SELECT tipo_plano, data_associacao 
  INTO v_plano, v_data_associacao
  FROM associados WHERE id = NEW.associado_id;
  
  -- Verificar se é patrimonial
  IF v_plano != 'patrimonial' THEN
    RAISE EXCEPTION 'Apenas sócios patrimoniais podem votar';
  END IF;
  
  -- Verificar tempo mínimo (1 ano)
  v_anos_titulo := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_data_associacao));
  IF v_anos_titulo < 1 THEN
    RAISE EXCEPTION 'Votante deve ter no mínimo 1 ano de título patrimonial';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validar_voto_trigger
  BEFORE INSERT ON votos
  FOR EACH ROW EXECUTE FUNCTION validar_voto();

