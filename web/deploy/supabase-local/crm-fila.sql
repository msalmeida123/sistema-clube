BEGIN;
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


ALTER TABLE public.whatsapp_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates_meta ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whatsapp_providers,public.whatsapp_templates_meta FROM anon,authenticated;
GRANT ALL ON public.whatsapp_providers,public.whatsapp_templates_meta TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.whatsapp_providers,public.whatsapp_templates_meta TO authenticated;
DROP POLICY IF EXISTS crm_admin ON public.whatsapp_providers;
CREATE POLICY crm_admin ON public.whatsapp_providers TO authenticated USING(public.clube_admin_local()) WITH CHECK(public.clube_admin_local());
DROP POLICY IF EXISTS crm_admin ON public.whatsapp_templates_meta;
CREATE POLICY crm_admin ON public.whatsapp_templates_meta TO authenticated USING(public.clube_admin_local()) WITH CHECK(public.clube_admin_local());

ALTER TABLE public.templates_mensagens ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
CREATE TABLE IF NOT EXISTS public.crm_fila (
 id uuid PRIMARY KEY,
 conversa_id uuid NOT NULL REFERENCES public.conversas_whatsapp(id),
 usuario_id uuid NOT NULL REFERENCES auth.users(id),
 payload jsonb NOT NULL,
 status text NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','enviando','enviada','falhou','incerto')),
 erro text, provider_message_id text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_fila_pendentes ON public.crm_fila(status,created_at);
ALTER TABLE public.crm_fila ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_fila FROM anon,authenticated;
GRANT ALL ON public.crm_fila TO service_role;
CREATE OR REPLACE FUNCTION public.crm_enfileirar(p_id uuid,p_conversa uuid,p_payload jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.conversas_whatsapp; existente public.crm_fila; conteudo text;
BEGIN
 SELECT * INTO c FROM public.conversas_whatsapp WHERE id=p_conversa;
 IF c.id IS NULL OR auth.uid() IS NULL OR NOT public.clube_crm_setor(c.setor_id) THEN
 RAISE EXCEPTION 'Sem acesso à conversa' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(7391042);
 SELECT * INTO existente FROM public.crm_fila WHERE id=p_id;
 IF existente.id IS NOT NULL THEN
 IF existente.usuario_id<>auth.uid() OR existente.conversa_id<>p_conversa OR existente.payload<>p_payload THEN
 RAISE EXCEPTION 'Identificador já utilizado'; END IF;
 RETURN p_id;
 END IF;

 IF (SELECT count(*) FROM public.crm_fila WHERE status IN ('pendente','enviando')) >= 5000 THEN
 RAISE EXCEPTION 'Fila cheia; tente mais tarde'; END IF;
 IF octet_length(p_payload::text)>16000 OR coalesce(p_payload->>'messageType','text') NOT IN ('text','image','video','audio','document') THEN
 RAISE EXCEPTION 'Mensagem inválida'; END IF;
 conteudo:=coalesce(nullif(p_payload->>'text',''),nullif(p_payload->>'caption',''),'Anexo: '||coalesce(p_payload->>'fileName','arquivo'));
 INSERT INTO public.crm_fila(id,conversa_id,usuario_id,payload) VALUES(p_id,p_conversa,auth.uid(),p_payload);
 INSERT INTO public.mensagens_whatsapp(id,conversa_id,direcao,conteudo,tipo,status,media_url)
 VALUES(p_id,p_conversa,'saida',conteudo,coalesce(p_payload->>'messageType','text'),'na_fila',p_payload->>'mediaUrl');
 UPDATE public.conversas_whatsapp SET ultima_mensagem=conteudo,ultimo_contato=now() WHERE id=p_conversa;
 RETURN p_id;
END $$;
REVOKE ALL ON FUNCTION public.crm_enfileirar(uuid,uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_enfileirar(uuid,uuid,jsonb) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
