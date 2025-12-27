-- =============================================
-- TRIGGERS E FUNÇÕES
-- =============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
CREATE TRIGGER update_associados_updated_at BEFORE UPDATE ON associados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_dependentes_updated_at BEFORE UPDATE ON dependentes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_agregados_updated_at BEFORE UPDATE ON agregados
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_mensalidades_updated_at BEFORE UPDATE ON mensalidades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- FUNÇÕES DE VALIDAÇÃO
-- =============================================

-- Verificar se associado pode votar (patrimonial + 1 ano)
CREATE OR REPLACE FUNCTION pode_votar(p_associado_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_plano tipo_plano;
    v_data_associacao DATE;
BEGIN
    SELECT plano, data_associacao INTO v_plano, v_data_associacao
    FROM associados WHERE id = p_associado_id;
    
    RETURN v_plano = 'patrimonial' 
        AND v_data_associacao <= CURRENT_DATE - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Verificar se associado pode se candidatar (patrimonial + 1 ano)
CREATE OR REPLACE FUNCTION pode_candidatar(p_associado_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN pode_votar(p_associado_id);
END;
$$ LANGUAGE plpgsql;

-- Verificar se dependente ainda é válido (< 21 anos ou faculdade)
CREATE OR REPLACE FUNCTION dependente_valido(p_dependente_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_data_nascimento DATE;
    v_cursando_faculdade BOOLEAN;
    v_data_validade_faculdade DATE;
BEGIN
    SELECT data_nascimento, cursando_faculdade, data_validade_faculdade
    INTO v_data_nascimento, v_cursando_faculdade, v_data_validade_faculdade
    FROM dependentes WHERE id = p_dependente_id;
    
    -- Menor de 21 anos
    IF AGE(CURRENT_DATE, v_data_nascimento) < INTERVAL '21 years' THEN
        RETURN true;
    END IF;
    
    -- Cursando faculdade com comprovante válido
    IF v_cursando_faculdade AND v_data_validade_faculdade >= CURRENT_DATE THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Verificar exame médico válido
CREATE OR REPLACE FUNCTION exame_medico_valido(
    p_associado_id UUID DEFAULT NULL,
    p_dependente_id UUID DEFAULT NULL,
    p_agregado_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM exames_medicos
        WHERE (associado_id = p_associado_id OR p_associado_id IS NULL)
        AND (dependente_id = p_dependente_id OR p_dependente_id IS NULL)
        AND (agregado_id = p_agregado_id OR p_agregado_id IS NULL)
        AND data_validade >= CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Verificar mensalidade em dia
CREATE OR REPLACE FUNCTION mensalidade_em_dia(p_associado_id UUID, p_tipo tipo_cobranca DEFAULT 'mensalidade_clube')
RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM mensalidades
        WHERE associado_id = p_associado_id
        AND tipo = p_tipo
        AND status IN ('pendente', 'atrasado')
        AND data_vencimento < CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Verificar se pode entrar no clube
CREATE OR REPLACE FUNCTION pode_entrar_clube(p_associado_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_status status_associado;
BEGIN
    SELECT status INTO v_status FROM associados WHERE id = p_associado_id;
    
    RETURN v_status = 'ativo' AND mensalidade_em_dia(p_associado_id, 'mensalidade_clube');
END;
$$ LANGUAGE plpgsql;

-- Verificar se pode entrar na piscina
CREATE OR REPLACE FUNCTION pode_entrar_piscina(
    p_associado_id UUID DEFAULT NULL,
    p_dependente_id UUID DEFAULT NULL,
    p_agregado_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar se está ativo e mensalidade em dia
    IF p_associado_id IS NOT NULL THEN
        IF NOT pode_entrar_clube(p_associado_id) THEN
            RETURN false;
        END IF;
    END IF;
    
    -- Verificar exame médico
    RETURN exame_medico_valido(p_associado_id, p_dependente_id, p_agregado_id);
END;
$$ LANGUAGE plpgsql;

-- Verificar se pode entrar na academia
CREATE OR REPLACE FUNCTION pode_entrar_academia(p_associado_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT pode_entrar_clube(p_associado_id) THEN
        RETURN false;
    END IF;
    
    -- Verificar mensalidade da academia
    RETURN mensalidade_em_dia(p_associado_id, 'mensalidade_academia');
END;
$$ LANGUAGE plpgsql;

-- Contar convites do mês
CREATE OR REPLACE FUNCTION convites_disponiveis_mes(p_associado_id UUID, p_mes VARCHAR(7))
RETURNS INTEGER AS $$
DECLARE
    v_plano tipo_plano;
    v_usados INTEGER;
    v_limite INTEGER := 0;
BEGIN
    SELECT plano INTO v_plano FROM associados WHERE id = p_associado_id;
    
    IF v_plano = 'patrimonial' THEN
        v_limite := 2;
    END IF;
    
    SELECT COUNT(*) INTO v_usados
    FROM convites
    WHERE associado_id = p_associado_id
    AND mes_referencia = p_mes;
    
    RETURN v_limite - v_usados;
END;
$$ LANGUAGE plpgsql;

-- Gerar número do título automaticamente
CREATE OR REPLACE FUNCTION gerar_numero_titulo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_titulo IS NULL THEN
        NEW.numero_titulo := (SELECT COALESCE(MAX(numero_titulo), 0) + 1 FROM associados);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER associados_numero_titulo
    BEFORE INSERT ON associados
    FOR EACH ROW EXECUTE FUNCTION gerar_numero_titulo();

-- Gerar hash QR Code para carteirinha
CREATE OR REPLACE FUNCTION gerar_qrcode_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.qrcode_hash := encode(sha256(
        (NEW.associado_id::text || NEW.dependente_id::text || NEW.agregado_id::text || NOW()::text)::bytea
    ), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER carteirinhas_qrcode_hash
    BEFORE INSERT ON carteirinhas
    FOR EACH ROW EXECUTE FUNCTION gerar_qrcode_hash();

