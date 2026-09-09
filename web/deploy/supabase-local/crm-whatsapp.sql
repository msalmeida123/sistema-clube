BEGIN;
CREATE TABLE IF NOT EXISTS public.setores (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL,
 descricao text, cor text NOT NULL DEFAULT '#3B82F6', icone text DEFAULT 'MessageCircle',
 telefone_whatsapp text, ativo boolean NOT NULL DEFAULT true, ordem integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE OR REPLACE VIEW public.setores_whatsapp WITH (security_invoker=true) AS SELECT * FROM public.setores;
CREATE TABLE IF NOT EXISTS public.usuarios_setores (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), usuario_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
 setor_id uuid NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
 is_responsavel boolean NOT NULL DEFAULT false, UNIQUE(usuario_id,setor_id)
);
CREATE TABLE IF NOT EXISTS public.conversas_whatsapp (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), telefone text NOT NULL, nome_contato text,
 ultimo_contato timestamptz DEFAULT now(), ultima_mensagem text, status text NOT NULL DEFAULT 'aberta',
 associado_id uuid REFERENCES public.associados(id), nao_lidas integer NOT NULL DEFAULT 0,
 setor_id uuid REFERENCES public.setores(id), foto_perfil_url text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mensagens_whatsapp (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversa_id uuid NOT NULL REFERENCES public.conversas_whatsapp(id) ON DELETE CASCADE,
 direcao text NOT NULL CHECK (direcao IN ('entrada','saida')), conteudo text NOT NULL,
 tipo text NOT NULL DEFAULT 'texto', status text NOT NULL DEFAULT 'enviada', message_id text, media_url text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.templates_mensagens (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), titulo text NOT NULL, categoria text,
 conteudo text NOT NULL, variaveis text[], ativo boolean NOT NULL DEFAULT true,
 uso_count integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.transferencias_whatsapp (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversa_id uuid NOT NULL REFERENCES public.conversas_whatsapp(id) ON DELETE CASCADE,
 setor_origem_id uuid REFERENCES public.setores(id), setor_destino_id uuid NOT NULL REFERENCES public.setores(id),
 usuario_id uuid REFERENCES auth.users(id), motivo text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_conversas_setor ON public.conversas_whatsapp(setor_id,ultimo_contato DESC);
CREATE INDEX IF NOT EXISTS crm_conversas_telefone ON public.conversas_whatsapp(telefone);
CREATE INDEX IF NOT EXISTS crm_mensagens_conversa ON public.mensagens_whatsapp(conversa_id,created_at);
CREATE INDEX IF NOT EXISTS crm_mensagens_message ON public.mensagens_whatsapp(message_id);
CREATE OR REPLACE FUNCTION public.clube_crm_setor(p_setor uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.clube_admin_local() OR EXISTS (
 SELECT 1 FROM public.usuarios u JOIN public.usuarios_setores us ON us.usuario_id=u.id
 WHERE (u.auth_id=auth.uid() OR (u.auth_id IS NULL AND u.id=auth.uid())) AND u.ativo=true
 AND (p_setor IS NULL OR us.setor_id=p_setor));
$$;
REVOKE ALL ON FUNCTION public.clube_crm_setor(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clube_crm_setor(uuid) TO authenticated,service_role;
DO $$ DECLARE tabela text; BEGIN
 FOREACH tabela IN ARRAY ARRAY['setores','usuarios_setores','conversas_whatsapp','mensagens_whatsapp','templates_mensagens','transferencias_whatsapp'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',tabela);
 EXECUTE format('REVOKE ALL ON public.%I FROM anon',tabela);
 EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO authenticated',tabela);
 EXECUTE format('GRANT ALL ON public.%I TO service_role',tabela);
 EXECUTE format('DROP POLICY IF EXISTS crm_admin ON public.%I',tabela);
 EXECUTE format('CREATE POLICY crm_admin ON public.%I TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local())',tabela);
 END LOOP;
END $$;
DROP POLICY IF EXISTS crm_ler_setor ON public.setores;
CREATE POLICY crm_ler_setor ON public.setores FOR SELECT TO authenticated USING (public.clube_crm_setor(id));
DROP POLICY IF EXISTS crm_meus_setores ON public.usuarios_setores;
CREATE POLICY crm_meus_setores ON public.usuarios_setores FOR SELECT TO authenticated USING (
 EXISTS(SELECT 1 FROM public.usuarios u WHERE u.id=usuario_id AND u.ativo=true AND (u.auth_id=auth.uid() OR (u.auth_id IS NULL AND u.id=auth.uid()))));
DROP POLICY IF EXISTS crm_conversas ON public.conversas_whatsapp;
CREATE POLICY crm_conversas ON public.conversas_whatsapp TO authenticated USING(public.clube_crm_setor(setor_id)) WITH CHECK(public.clube_crm_setor(setor_id));
DROP POLICY IF EXISTS crm_mensagens ON public.mensagens_whatsapp;
CREATE POLICY crm_mensagens ON public.mensagens_whatsapp TO authenticated USING(
 EXISTS(SELECT 1 FROM public.conversas_whatsapp c WHERE c.id=conversa_id)) WITH CHECK(
 EXISTS(SELECT 1 FROM public.conversas_whatsapp c WHERE c.id=conversa_id));
DROP POLICY IF EXISTS crm_templates ON public.templates_mensagens;
CREATE POLICY crm_templates ON public.templates_mensagens TO authenticated USING(public.clube_crm_setor(NULL)) WITH CHECK(public.clube_crm_setor(NULL));
DROP POLICY IF EXISTS crm_transferencias_leitura ON public.transferencias_whatsapp;
CREATE POLICY crm_transferencias_leitura ON public.transferencias_whatsapp FOR SELECT TO authenticated USING(
 EXISTS(SELECT 1 FROM public.conversas_whatsapp c WHERE c.id=conversa_id));
DROP POLICY IF EXISTS crm_transferencias_inserir ON public.transferencias_whatsapp;
CREATE POLICY crm_transferencias_inserir ON public.transferencias_whatsapp FOR INSERT TO authenticated WITH CHECK(
 usuario_id=auth.uid() AND public.clube_crm_setor(setor_destino_id) AND EXISTS(SELECT 1 FROM public.conversas_whatsapp c WHERE c.id=conversa_id));
REVOKE ALL ON public.setores_whatsapp FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.setores_whatsapp TO authenticated,service_role;
DO $$ DECLARE tabela text; BEGIN
 IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
 FOREACH tabela IN ARRAY ARRAY['conversas_whatsapp','mensagens_whatsapp'] LOOP
 IF NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=tabela) THEN
 EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',tabela);
 END IF;
 END LOOP;
 END IF;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;

