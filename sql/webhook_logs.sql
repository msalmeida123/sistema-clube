-- ==========================================
-- TABELA DE LOGS DO WEBHOOK (com segurança)
-- Execute no Supabase SQL Editor
-- ==========================================

-- Dropar tabela antiga se existir (cuidado em produção!)
-- DROP TABLE IF EXISTS webhook_logs;

-- Criar tabela com campos de segurança
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo VARCHAR(100) NOT NULL,
  payload TEXT,
  ip_origem VARCHAR(45), -- IPv6 pode ter até 45 caracteres
  user_agent TEXT,
  status_code INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se não existirem (para atualização)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_logs' AND column_name = 'ip_origem'
  ) THEN
    ALTER TABLE webhook_logs ADD COLUMN ip_origem VARCHAR(45);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE webhook_logs ADD COLUMN user_agent TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'webhook_logs' AND column_name = 'status_code'
  ) THEN
    ALTER TABLE webhook_logs ADD COLUMN status_code INTEGER;
  END IF;
END $$;

-- Índices para performance e busca
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_tipo ON webhook_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_ip ON webhook_logs(ip_origem);

-- RLS - apenas service role pode acessar (segurança)
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "webhook_logs_select" ON webhook_logs;
DROP POLICY IF EXISTS "webhook_logs_insert" ON webhook_logs;

-- Apenas admins podem ler logs
CREATE POLICY "webhook_logs_admin_select" ON webhook_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE auth_id = auth.uid() AND is_admin = true
    )
  );

-- Service role pode inserir (usado pelo webhook)
CREATE POLICY "webhook_logs_service_insert" ON webhook_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Função para limpar logs antigos (executar periodicamente)
CREATE OR REPLACE FUNCTION limpar_webhook_logs_antigos()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_logs 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View para análise de segurança (IPs suspeitos)
CREATE OR REPLACE VIEW webhook_ips_suspeitos AS
SELECT 
  ip_origem,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE tipo = 'bloqueado') as bloqueados,
  COUNT(*) FILTER (WHERE tipo = 'assinatura_invalida') as assinatura_invalida,
  COUNT(*) FILTER (WHERE tipo = 'erro') as erros,
  MIN(created_at) as primeira_requisicao,
  MAX(created_at) as ultima_requisicao
FROM webhook_logs
WHERE ip_origem IS NOT NULL
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_origem
HAVING COUNT(*) FILTER (WHERE tipo IN ('bloqueado', 'assinatura_invalida')) > 5
ORDER BY bloqueados DESC, total_requests DESC;

-- Comentário
COMMENT ON TABLE webhook_logs IS 'Logs de segurança do webhook WhatsApp';

SELECT 'Tabela webhook_logs atualizada com sucesso!' as resultado;
