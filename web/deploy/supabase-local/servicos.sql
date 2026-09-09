BEGIN;
CREATE TABLE IF NOT EXISTS public.servicos_tarefas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 titulo text NOT NULL CHECK(length(trim(titulo)) BETWEEN 3 AND 160),
 descricao text NOT NULL DEFAULT '' CHECK(length(descricao)<=2000),
 data date NOT NULL,
 responsavel_id uuid REFERENCES public.usuarios(id) ON DELETE SET NULL,
 prioridade text NOT NULL DEFAULT 'normal' CHECK(prioridade IN ('baixa','normal','alta')),
 status text NOT NULL DEFAULT 'a_fazer' CHECK(status IN ('a_fazer','em_andamento','concluido')),
 criado_por uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS servicos_tarefas_periodo ON public.servicos_tarefas(data,id);
CREATE OR REPLACE FUNCTION public.clube_servicos_permitido() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM usuarios WHERE (auth_id=auth.uid() OR (auth_id IS NULL AND id=auth.uid())) AND ativo=true AND (is_admin=true OR 'servicos'=ANY(permissoes)));
$$;
REVOKE ALL ON FUNCTION public.clube_servicos_permitido() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.clube_servicos_permitido() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.servicos_preparar_tarefa() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF (TG_OP='INSERT' OR NEW.responsavel_id IS DISTINCT FROM OLD.responsavel_id) AND NEW.responsavel_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM usuarios WHERE id=NEW.responsavel_id AND ativo=true AND (is_admin=true OR 'servicos'=ANY(permissoes))) THEN RAISE EXCEPTION 'Responsável sem acesso a serviços'; END IF;
 NEW.updated_at:=clock_timestamp();
 IF TG_OP='UPDATE' THEN NEW.criado_por:=OLD.criado_por;NEW.created_at:=OLD.created_at;
 ELSE NEW.criado_por:=auth.uid(); END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS servicos_preparar_tarefa ON public.servicos_tarefas;
CREATE TRIGGER servicos_preparar_tarefa BEFORE INSERT OR UPDATE ON public.servicos_tarefas FOR EACH ROW EXECUTE FUNCTION public.servicos_preparar_tarefa();
ALTER TABLE public.servicos_tarefas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.servicos_tarefas FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.servicos_tarefas TO authenticated;
GRANT ALL ON public.servicos_tarefas TO service_role;
DROP POLICY IF EXISTS servicos_acesso ON public.servicos_tarefas;
CREATE POLICY servicos_acesso ON public.servicos_tarefas TO authenticated USING(public.clube_servicos_permitido()) WITH CHECK(public.clube_servicos_permitido());
CREATE OR REPLACE FUNCTION public.servicos_responsaveis() RETURNS TABLE(id uuid,nome text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT id,nome::text FROM usuarios WHERE public.clube_servicos_permitido() AND ativo=true AND (is_admin=true OR 'servicos'=ANY(permissoes)) ORDER BY nome;
$$;
REVOKE ALL ON FUNCTION public.servicos_responsaveis() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.servicos_responsaveis() TO authenticated,service_role;
COMMIT;
