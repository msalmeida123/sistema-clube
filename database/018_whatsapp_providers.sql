-- =====================================================
-- WHATSAPP PROVIDERS - Suporte Multi-Provider
-- Permite usar WaSender e Meta Cloud API simultaneamente
-- =====================================================

-- Tabela de providers (cada número pode usar provider diferente)
CREATE TABLE IF NOT EXISTS whatsapp_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('wasender', 'meta')),
  ativo BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Config WaSender
  wasender_api_key TEXT,
  wasender_device_id TEXT,
  wasender_personal_token TEXT,
  
  -- Config Meta Cloud API
  meta_app_id TEXT,
  meta_app_secret TEXT,
  meta_access_token TEXT,
  meta_phone_number_id TEXT,
  meta_waba_id TEXT,
  meta_verify_token TEXT,
  meta_catalog_id TEXT,
  
  -- Metadados
  telefone VARCHAR(20),
  nome_exibicao VARCHAR(100),
  status VARCHAR(20) DEFAULT 'desconectado',
  ultimo_check TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_providers_tipo ON whatsapp_providers(tipo);
CREATE INDEX IF NOT EXISTS idx_whatsapp_providers_ativo ON whatsapp_providers(ativo);

-- Templates da Meta (templates aprovados pelo WhatsApp)
CREATE TABLE IF NOT EXISTS whatsapp_templates_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES whatsapp_providers(id) ON DELETE CASCADE,
  template_name VARCHAR(512) NOT NULL,
  template_id VARCHAR(100),
  language VARCHAR(10) DEFAULT 'pt_BR',
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'PENDING',
  components JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_meta_provider ON whatsapp_templates_meta(provider_id);
CREATE INDEX IF NOT EXISTS idx_templates_meta_status ON whatsapp_templates_meta(status);

-- Adicionar provider_id nas conversas (nullable para manter compatibilidade)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'conversas_whatsapp' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE conversas_whatsapp ADD COLUMN provider_id UUID REFERENCES whatsapp_providers(id);
    CREATE INDEX idx_conversas_provider ON conversas_whatsapp(provider_id);
  END IF;
END $$;

-- Migrar config existente do WaSender para a nova tabela
DO $$ 
DECLARE
  v_api_key TEXT;
  v_device_id TEXT;
  v_personal_token TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Verificar se tabela config_wasender existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'config_wasender'
  ) INTO v_exists;
  
  IF v_exists THEN
    -- Buscar config atual
    SELECT api_key, device_id, personal_token 
    INTO v_api_key, v_device_id, v_personal_token
    FROM config_wasender 
    LIMIT 1;
    
    -- Se tem config e não existe provider ainda, migrar
    IF v_api_key IS NOT NULL AND NOT EXISTS (SELECT 1 FROM whatsapp_providers WHERE tipo = 'wasender') THEN
      INSERT INTO whatsapp_providers (nome, tipo, ativo, is_default, wasender_api_key, wasender_device_id, wasender_personal_token, status)
      VALUES ('WaSender Principal', 'wasender', true, true, v_api_key, v_device_id, v_personal_token, 'conectado');
    END IF;
  END IF;
END $$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_providers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_whatsapp_providers_updated ON whatsapp_providers;
CREATE TRIGGER tr_whatsapp_providers_updated
  BEFORE UPDATE ON whatsapp_providers
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_providers_updated_at();

-- Garantir que só pode ter um provider default por vez
CREATE OR REPLACE FUNCTION ensure_single_default_provider()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE whatsapp_providers SET is_default = false WHERE id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_single_default_provider ON whatsapp_providers;
CREATE TRIGGER tr_single_default_provider
  BEFORE INSERT OR UPDATE ON whatsapp_providers
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_provider();

-- RLS
ALTER TABLE whatsapp_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_providers_all" ON whatsapp_providers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "whatsapp_templates_meta_all" ON whatsapp_templates_meta FOR ALL USING (true) WITH CHECK (true);

-- Comentários
COMMENT ON TABLE whatsapp_providers IS 'Configurações dos providers WhatsApp (WaSender e Meta Cloud API)';
COMMENT ON TABLE whatsapp_templates_meta IS 'Templates aprovados da Meta WhatsApp Business API';
COMMENT ON COLUMN whatsapp_providers.tipo IS 'wasender ou meta';
COMMENT ON COLUMN whatsapp_providers.is_default IS 'Provider padrão para novas conversas';
