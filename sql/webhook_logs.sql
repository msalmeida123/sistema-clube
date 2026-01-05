-- Tabela para debug de webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(100),
  payload TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por data
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Limpar logs antigos (manter apenas últimos 7 dias)
-- Executar periodicamente ou criar uma função scheduled
DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '7 days';
