BEGIN;
CREATE TABLE IF NOT EXISTS public.bar_impressora (
  id text PRIMARY KEY CHECK (id = 'cozinha'),
  nome text NOT NULL DEFAULT 'Cozinha',
  ip text NOT NULL DEFAULT '',
  porta integer NOT NULL DEFAULT 9100 CHECK (porta BETWEEN 9100 AND 9109),
  colunas integer NOT NULL DEFAULT 48 CHECK (colunas IN (32,48)),
  protocolo text NOT NULL DEFAULT 'texto' CHECK (protocolo IN ('texto','escpos')),
  cortar boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bar_impressora(id) VALUES ('cozinha') ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.bar_impressoes (
  id uuid PRIMARY KEY,
  pedido_id uuid NOT NULL REFERENCES public.bar_pedidos(id),
  reimpressao boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'enviando' CHECK (status IN ('enviando','enviado','incerto')),
  operador_auth_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS bar_primeira_impressao ON public.bar_impressoes(pedido_id) WHERE reimpressao = false;
ALTER TABLE public.bar_impressora ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bar_impressoes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bar_impressora, public.bar_impressoes FROM anon, authenticated;
GRANT ALL ON public.bar_impressora, public.bar_impressoes TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
