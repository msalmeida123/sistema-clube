-- Executar apenas no banco do painel central, nunca nos bancos dos clientes.
BEGIN;
CREATE TABLE IF NOT EXISTS public.gestao_planos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL CHECK(length(nome) BETWEEN 2 AND 80),
 valor_centavos integer NOT NULL CHECK(valor_centavos BETWEEN 500 AND 100000000),
 dias integer NOT NULL CHECK(dias BETWEEN 1 AND 366), ativo boolean NOT NULL DEFAULT true,
 criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.gestao_clientes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, email text NOT NULL,
 documento text NOT NULL, dominio text NOT NULL UNIQUE, instalacao uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 plano_id uuid NOT NULL REFERENCES public.gestao_planos(id),
 chave_hash text NOT NULL UNIQUE CHECK(length(chave_hash)=64),
 ambiente text NOT NULL CHECK(ambiente IN ('sandbox','production')),
 bloqueado boolean NOT NULL DEFAULT false, asaas_cliente text,
 criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.gestao_cobrancas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cliente_id uuid NOT NULL REFERENCES public.gestao_clientes(id),
 plano_nome text NOT NULL, valor_centavos integer NOT NULL CHECK(valor_centavos>=500),
 dias integer NOT NULL CHECK(dias BETWEEN 1 AND 366), ambiente text NOT NULL CHECK(ambiente IN ('sandbox','production')),
 asaas_id text UNIQUE, asaas_cliente text, status text NOT NULL DEFAULT 'PREPARANDO',
 inicio timestamptz, fim timestamptz, consultado_em timestamptz, criada_em timestamptz NOT NULL DEFAULT now(),
 CHECK((inicio IS NULL AND fim IS NULL) OR (inicio IS NOT NULL AND fim>inicio))
);
-- Uma tentativa pendente por cliente. Retentativas reutilizam a mesma referência.
CREATE UNIQUE INDEX IF NOT EXISTS gestao_cobranca_pendente ON public.gestao_cobrancas(cliente_id)
 WHERE status IN ('PREPARANDO','PENDING','OVERDUE','CONFIRMED');
ALTER TABLE public.gestao_cobrancas ADD COLUMN IF NOT EXISTS emissao_iniciada boolean NOT NULL DEFAULT false;
-- NULL preserva contratos antigos sem taxa de instalação. Novos cadastros
-- exigem a taxa na API; preço e duração são congelados na cobrança emitida.
ALTER TABLE public.gestao_clientes ADD COLUMN IF NOT EXISTS instalacao_centavos integer CHECK(instalacao_centavos BETWEEN 500 AND 100000000);
ALTER TABLE public.gestao_cobrancas ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'mensalidade' CHECK(tipo IN ('instalacao','mensalidade'));
ALTER TABLE public.gestao_cobrancas ADD COLUMN IF NOT EXISTS forma text NOT NULL DEFAULT 'PIX' CHECK(forma IN ('PIX','CREDIT_CARD','DEPOSITO'));
ALTER TABLE public.gestao_cobrancas ADD COLUMN IF NOT EXISTS instrucoes_deposito text CHECK(length(instrucoes_deposito)<=1000);
CREATE UNIQUE INDEX IF NOT EXISTS gestao_instalacao_unica ON public.gestao_cobrancas(cliente_id)
 WHERE tipo='instalacao' AND status NOT IN ('REFUNDED','DELETED');
CREATE TABLE IF NOT EXISTS public.gestao_eventos (
 id text PRIMARY KEY, cobranca_id uuid NOT NULL REFERENCES public.gestao_cobrancas(id),
 tipo text NOT NULL, criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.gestao_auditoria (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, ator uuid, acao text NOT NULL,
 cliente_id uuid, criado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gestao_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestao_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestao_cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestao_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gestao_auditoria ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gestao_planos,public.gestao_clientes,public.gestao_cobrancas,public.gestao_eventos,public.gestao_auditoria FROM anon,authenticated;
GRANT ALL ON public.gestao_planos,public.gestao_clientes,public.gestao_cobrancas,public.gestao_eventos,public.gestao_auditoria TO service_role;
GRANT USAGE ON SEQUENCE public.gestao_auditoria_id_seq TO service_role;

-- Serializa eventos da cobrança e renovações do mesmo cliente. Nunca confia em
-- um status enviado pelo navegador: o servidor consulta a API do Asaas antes.
CREATE OR REPLACE FUNCTION public.gestao_confirmar_pagamento(p_evento text,p_tipo text,p_cobranca uuid,p_status text,p_consultado timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c gestao_cobrancas%ROWTYPE; inicio_periodo timestamptz;
BEGIN
 SELECT * INTO c FROM gestao_cobrancas WHERE id=p_cobranca;
 IF NOT FOUND THEN RAISE EXCEPTION 'cobranca_inexistente'; END IF;
 PERFORM 1 FROM gestao_clientes WHERE id=c.cliente_id FOR UPDATE;
 SELECT * INTO c FROM gestao_cobrancas WHERE id=p_cobranca FOR UPDATE;
 IF c.consultado_em IS NOT NULL AND p_consultado<c.consultado_em THEN RETURN; END IF;
 IF p_status NOT IN ('PENDING','CONFIRMED','RECEIVED','OVERDUE','REFUNDED','REFUND_REQUESTED','REFUND_IN_PROGRESS','PARTIALLY_REFUNDED','DELETED') THEN RAISE EXCEPTION 'status_invalido'; END IF;
 INSERT INTO gestao_eventos(id,cobranca_id,tipo) VALUES(p_evento,p_cobranca,p_tipo) ON CONFLICT DO NOTHING;
 -- Mesmo evento pode ser reenviado; o período é atribuído uma única vez.
 IF p_status='RECEIVED' AND c.inicio IS NULL THEN
   SELECT greatest(now(),coalesce(max(fim),now())) INTO inicio_periodo FROM gestao_cobrancas
     WHERE cliente_id=c.cliente_id AND status='RECEIVED' AND id<>c.id;
   UPDATE gestao_cobrancas SET inicio=inicio_periodo,fim=inicio_periodo+make_interval(days=>c.dias),status=p_status,consultado_em=p_consultado WHERE id=c.id;
 ELSE
   UPDATE gestao_cobrancas SET status=p_status,consultado_em=p_consultado WHERE id=c.id;
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.gestao_confirmar_pagamento(text,text,uuid,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gestao_confirmar_pagamento(text,text,uuid,text,timestamptz) TO service_role;

-- Auditoria do recebimento manual: o comprovante do cliente não é confirmação.
CREATE TABLE IF NOT EXISTS public.gestao_depositos (
 cobranca_id uuid NOT NULL REFERENCES public.gestao_cobrancas(id),
 acao text NOT NULL CHECK(acao IN ('confirmar','estornar','cancelar')),
 ator uuid NOT NULL, valor_centavos integer NOT NULL,
 data_recebimento date, referencia text NOT NULL CHECK(length(referencia) BETWEEN 3 AND 200),
 registrado_em timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(cobranca_id,acao)
);
ALTER TABLE public.gestao_depositos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gestao_depositos FROM anon,authenticated;
GRANT ALL ON public.gestao_depositos TO service_role;
CREATE OR REPLACE FUNCTION public.gestao_registrar_deposito(p_cobranca uuid,p_ambiente text,p_ator uuid,p_acao text,p_valor integer,p_data date,p_referencia text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c gestao_cobrancas%ROWTYPE; alvo text;
BEGIN
 SELECT * INTO c FROM gestao_cobrancas WHERE id=p_cobranca;
 IF NOT FOUND THEN RAISE EXCEPTION 'cobranca_inexistente'; END IF;
 PERFORM 1 FROM gestao_clientes WHERE id=c.cliente_id FOR UPDATE;
 SELECT * INTO c FROM gestao_cobrancas WHERE id=p_cobranca FOR UPDATE;
 IF c.ambiente<>p_ambiente OR c.forma<>'DEPOSITO' OR c.asaas_id IS NOT NULL THEN RAISE EXCEPTION 'deposito_invalido'; END IF;
 IF p_ator IS NULL OR p_valor IS DISTINCT FROM c.valor_centavos OR p_referencia IS NULL OR length(trim(p_referencia)) NOT BETWEEN 3 AND 200 THEN RAISE EXCEPTION 'dados_divergentes'; END IF;
 IF p_acao='confirmar' THEN
  IF p_data IS NULL OR p_data>(now() AT TIME ZONE 'America/Sao_Paulo')::date THEN RAISE EXCEPTION 'data_invalida'; END IF;
  alvo:='RECEIVED';
  IF c.status NOT IN ('PENDING','RECEIVED') THEN RAISE EXCEPTION 'deposito_nao_pendente'; END IF;
 ELSIF p_acao='estornar' THEN
  alvo:='REFUNDED';
  IF c.status NOT IN ('RECEIVED','REFUNDED') THEN RAISE EXCEPTION 'deposito_nao_recebido'; END IF;
 ELSIF p_acao='cancelar' THEN
  alvo:='DELETED';
  IF c.status NOT IN ('PENDING','DELETED') THEN RAISE EXCEPTION 'deposito_nao_pendente'; END IF;
 ELSE RAISE EXCEPTION 'acao_invalida'; END IF;
 IF EXISTS(SELECT 1 FROM gestao_depositos WHERE cobranca_id=c.id AND acao=p_acao) THEN RETURN; END IF;
 INSERT INTO gestao_depositos(cobranca_id,acao,ator,valor_centavos,data_recebimento,referencia)
 VALUES(c.id,p_acao,p_ator,p_valor,p_data,trim(p_referencia));
 PERFORM gestao_confirmar_pagamento('deposito:'||c.id::text||':'||p_acao,'DEPOSITO_'||upper(p_acao),c.id,alvo,clock_timestamp());
 INSERT INTO gestao_auditoria(ator,acao,cliente_id) VALUES(p_ator,'deposito_'||p_acao,c.cliente_id);
END $$;
REVOKE ALL ON FUNCTION public.gestao_registrar_deposito(uuid,text,uuid,text,integer,date,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gestao_registrar_deposito(uuid,text,uuid,text,integer,date,text) TO service_role;

-- Somente criptograma autenticado; chave mestra fora do banco, em Docker Secret.
CREATE TABLE IF NOT EXISTS public.gestao_credenciais (
 ambiente text PRIMARY KEY CHECK(ambiente IN ('sandbox','production')),
 api_key_cifrada text NOT NULL CHECK(length(api_key_cifrada) BETWEEN 30 AND 10000),
 atualizado_por uuid NOT NULL, atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.gestao_credenciais ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.gestao_credenciais FROM anon,authenticated;
GRANT ALL ON public.gestao_credenciais TO service_role;
CREATE OR REPLACE FUNCTION public.gestao_salvar_credencial(p_ambiente text,p_cifrada text,p_ator uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO gestao_credenciais(ambiente,api_key_cifrada,atualizado_por,atualizado_em)
 VALUES(p_ambiente,p_cifrada,p_ator,now())
 ON CONFLICT(ambiente) DO UPDATE SET api_key_cifrada=excluded.api_key_cifrada,atualizado_por=excluded.atualizado_por,atualizado_em=excluded.atualizado_em;
 INSERT INTO gestao_auditoria(ator,acao) VALUES(p_ator,'atualizar_chave_asaas_'||p_ambiente);
END $$;
REVOKE ALL ON FUNCTION public.gestao_salvar_credencial(text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.gestao_salvar_credencial(text,text,uuid) TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';
