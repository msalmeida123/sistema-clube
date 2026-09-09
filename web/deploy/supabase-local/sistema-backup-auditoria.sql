BEGIN;
CREATE TABLE IF NOT EXISTS public.sistema_auditoria(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 criado_em timestamptz NOT NULL DEFAULT clock_timestamp(),
 usuario_id uuid, usuario_nome text NOT NULL,
 tipo text NOT NULL, acao text NOT NULL, tabela text, registro text,
 campos text[] NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS sistema_auditoria_data ON public.sistema_auditoria(criado_em DESC,id DESC);
CREATE INDEX IF NOT EXISTS sistema_auditoria_usuario ON public.sistema_auditoria(usuario_id,criado_em DESC);
ALTER TABLE public.sistema_auditoria ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sistema_auditoria FROM anon,authenticated;
GRANT SELECT ON public.sistema_auditoria TO authenticated;
GRANT ALL ON public.sistema_auditoria TO service_role;
DROP POLICY IF EXISTS auditoria_admin ON public.sistema_auditoria;
CREATE POLICY auditoria_admin ON public.sistema_auditoria FOR SELECT TO authenticated USING(public.clube_admin_local());
CREATE OR REPLACE FUNCTION public.sistema_auditar_alteracao() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE antes jsonb;depois jsonb;campos text[];uid uuid;nome text;ator text;
BEGIN
 antes:=CASE WHEN TG_OP='INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
 depois:=CASE WHEN TG_OP='DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
 SELECT array_agg(k ORDER BY k) INTO campos FROM (SELECT jsonb_object_keys(antes||depois) AS k) s WHERE antes->k IS DISTINCT FROM depois->k;
 IF TG_OP='UPDATE' AND campos IS NULL THEN RETURN NEW;END IF;
 uid:=auth.uid();
 IF auth.role()='service_role' THEN
  ator:=coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-clube-audit-actor','');
  IF ator~'^[0-9a-fA-F-]{36}$' THEN BEGIN
   SELECT coalesce(u.auth_id,u.id) INTO uid FROM usuarios u WHERE (u.auth_id=ator::uuid OR (u.auth_id IS NULL AND u.id=ator::uuid)) AND u.ativo=true LIMIT 1;
  EXCEPTION WHEN invalid_text_representation THEN uid:=NULL;END;END IF;
 END IF;
 SELECT coalesce(u.nome,u.email) INTO nome FROM usuarios u WHERE u.auth_id=uid OR (u.auth_id IS NULL AND u.id=uid) LIMIT 1;
 INSERT INTO sistema_auditoria(usuario_id,usuario_nome,tipo,acao,tabela,registro,campos)
 VALUES(uid,coalesce(nome,CASE WHEN uid IS NULL THEN 'Sistema / integração' ELSE 'Usuário autenticado' END),'alteracao',TG_OP,TG_TABLE_NAME,left(coalesce(depois->>'id',antes->>'id','Sem ID simples'),200),coalesce(campos,'{}'));
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
REVOKE ALL ON FUNCTION public.sistema_auditar_alteracao() FROM PUBLIC;
CREATE TABLE IF NOT EXISTS public.sistema_backups(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 criado_em timestamptz NOT NULL DEFAULT now(),
 usuario_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','executando','concluido','falhou')),
 iniciado_em timestamptz,finalizado_em timestamptz,heartbeat timestamptz,
 tamanho bigint,sha256 text,erro text
);
CREATE UNIQUE INDEX IF NOT EXISTS sistema_backup_unico_ativo ON public.sistema_backups((true)) WHERE status IN ('pendente','executando');
ALTER TABLE public.sistema_backups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sistema_backups FROM anon,authenticated;
GRANT SELECT ON public.sistema_backups TO authenticated;
GRANT ALL ON public.sistema_backups TO service_role;
DROP POLICY IF EXISTS backup_admin ON public.sistema_backups;
CREATE POLICY backup_admin ON public.sistema_backups FOR SELECT TO authenticated USING(public.clube_admin_local());
CREATE OR REPLACE FUNCTION public.sistema_pedir_backup() RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE novo uuid;nome text;
BEGIN
 IF NOT public.clube_admin_local() THEN RAISE EXCEPTION 'Acesso restrito ao administrador';END IF;
 INSERT INTO sistema_backups(usuario_id) VALUES(auth.uid()) RETURNING id INTO novo;
 SELECT coalesce(u.nome,u.email) INTO nome FROM usuarios u WHERE u.auth_id=auth.uid() OR (u.auth_id IS NULL AND u.id=auth.uid()) LIMIT 1;
 INSERT INTO sistema_auditoria(usuario_id,usuario_nome,tipo,acao,tabela,registro) VALUES(auth.uid(),coalesce(nome,'Administrador'),'backup','SOLICITAR','sistema_backups',novo::text);
 RETURN novo;
END $$;
REVOKE ALL ON FUNCTION public.sistema_pedir_backup() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sistema_pedir_backup() TO authenticated;
CREATE OR REPLACE FUNCTION public.sistema_registrar_acesso(p_caminho text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE nome text;
BEGIN
 IF auth.uid() IS NULL OR p_caminho!~'^/dashboard(/[A-Za-z0-9_-]+)*$' OR length(p_caminho)>250 THEN RETURN;END IF;
 SELECT coalesce(u.nome,u.email) INTO nome FROM usuarios u WHERE (u.auth_id=auth.uid() OR (u.auth_id IS NULL AND u.id=auth.uid())) AND u.ativo=true LIMIT 1;
 IF nome IS NULL THEN RETURN;END IF;
 IF EXISTS(SELECT 1 FROM sistema_auditoria WHERE usuario_id=auth.uid() AND tipo='pagina' AND criado_em>now()-interval '10 seconds' AND registro=p_caminho) THEN RETURN;END IF;
 INSERT INTO sistema_auditoria(usuario_id,usuario_nome,tipo,acao,registro) VALUES(auth.uid(),nome,'pagina','ACESSAR',p_caminho);
END $$;
REVOKE ALL ON FUNCTION public.sistema_registrar_acesso(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sistema_registrar_acesso(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.sistema_auditar_auth() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE p jsonb;uid uuid;
BEGIN
 p:=NEW.payload::jsonb;
 IF coalesce(p->>'action','') NOT IN ('login','logout','user_signedup','user_deleted','user_updated_password','token_revoked','login_failed') THEN RETURN NEW;END IF;
 IF coalesce(p->>'actor_id','')~'^[0-9a-fA-F-]{36}$' THEN BEGIN uid:=(p->>'actor_id')::uuid;EXCEPTION WHEN invalid_text_representation THEN uid:=NULL;END;END IF;
 INSERT INTO sistema_auditoria(usuario_id,usuario_nome,tipo,acao,tabela,registro) VALUES(uid,left(coalesce(nullif(p->>'actor_username',''),'Autenticação'),160),'autenticacao',left(p->>'action',60),'auth',NEW.id::text);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sistema_auditar_auth() FROM PUBLIC;
DROP TRIGGER IF EXISTS sistema_auth_audit ON auth.audit_log_entries;
CREATE TRIGGER sistema_auth_audit AFTER INSERT ON auth.audit_log_entries FOR EACH ROW EXECUTE FUNCTION public.sistema_auditar_auth();
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN ('sistema_auditoria','sistema_backups') LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS sistema_audit ON public.%I',t.tablename);
  EXECUTE format('CREATE TRIGGER sistema_audit AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.sistema_auditar_alteracao()',t.tablename);
 END LOOP;
END $$;
NOTIFY pgrst,'reload schema';
CREATE OR REPLACE FUNCTION public.sistema_registrar_download_backup(p_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE nome text;
BEGIN
 IF NOT public.clube_admin_local() THEN RAISE EXCEPTION 'Acesso restrito';END IF;
 IF NOT EXISTS(SELECT 1 FROM sistema_backups WHERE id=p_id AND status='concluido') THEN RAISE EXCEPTION 'Backup indisponível';END IF;
 SELECT coalesce(u.nome,u.email) INTO nome FROM usuarios u WHERE u.auth_id=auth.uid() OR (u.auth_id IS NULL AND u.id=auth.uid()) LIMIT 1;
 INSERT INTO sistema_auditoria(usuario_id,usuario_nome,tipo,acao,tabela,registro) VALUES(auth.uid(),coalesce(nome,'Administrador'),'backup','DOWNLOAD_SOLICITADO','sistema_backups',p_id::text);
END $$;
REVOKE ALL ON FUNCTION public.sistema_registrar_download_backup(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sistema_registrar_download_backup(uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
