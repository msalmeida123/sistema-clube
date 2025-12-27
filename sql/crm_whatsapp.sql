-- Tabelas para CRM WhatsApp

-- Conversas
CREATE TABLE IF NOT EXISTS conversas_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telefone VARCHAR(20) NOT NULL,
  nome_contato VARCHAR(255),
  ultimo_contato TIMESTAMP WITH TIME ZONE,
  ultima_mensagem TEXT,
  status VARCHAR(20) DEFAULT 'aberta', -- aberta, aguardando, resolvida
  associado_id UUID REFERENCES associados(id),
  nao_lidas INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mensagens
CREATE TABLE IF NOT EXISTS mensagens_whatsapp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id UUID NOT NULL REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
  direcao VARCHAR(10) NOT NULL, -- entrada, saida
  conteudo TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'texto', -- texto, imagem, audio, documento
  status VARCHAR(20) DEFAULT 'enviada', -- pendente, enviada, entregue, lida, erro
  message_id VARCHAR(100), -- ID da mensagem no WhatsApp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_conversas_telefone ON conversas_whatsapp(telefone);
CREATE INDEX IF NOT EXISTS idx_conversas_ultimo_contato ON conversas_whatsapp(ultimo_contato DESC);
CREATE INDEX IF NOT EXISTS idx_conversas_associado ON conversas_whatsapp(associado_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON mensagens_whatsapp(conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_created ON mensagens_whatsapp(created_at);

-- RLS
ALTER TABLE conversas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_whatsapp ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "conversas_all" ON conversas_whatsapp;
CREATE POLICY "conversas_all" ON conversas_whatsapp FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "mensagens_all" ON mensagens_whatsapp;
CREATE POLICY "mensagens_all" ON mensagens_whatsapp FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_conversa_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversa ON conversas_whatsapp;
CREATE TRIGGER trigger_update_conversa
  BEFORE UPDATE ON conversas_whatsapp
  FOR EACH ROW
  EXECUTE FUNCTION update_conversa_timestamp();

-- Habilitar Realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE mensagens_whatsapp;
ALTER PUBLICATION supabase_realtime ADD TABLE conversas_whatsapp;
