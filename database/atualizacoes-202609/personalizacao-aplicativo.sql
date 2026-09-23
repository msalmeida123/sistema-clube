-- Personalização isolada por clube. A instalação legada é vinculada somente quando
-- existe um único clube: nunca escolhe arbitrariamente entre vários tenants.
BEGIN;
INSERT INTO public.configuracao_clube(nome_clube) SELECT 'Sistema Clube' WHERE NOT EXISTS(SELECT 1 FROM public.configuracao_clube);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS clube_id uuid REFERENCES public.configuracao_clube(id);
ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS clube_id uuid REFERENCES public.configuracao_clube(id);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.configuracao_clube)=1 THEN
  UPDATE public.usuarios SET clube_id=(SELECT id FROM public.configuracao_clube) WHERE clube_id IS NULL;
  UPDATE public.associados SET clube_id=(SELECT id FROM public.configuracao_clube) WHERE clube_id IS NULL;
 ELSIF EXISTS(SELECT 1 FROM public.usuarios WHERE clube_id IS NULL) OR EXISTS(SELECT 1 FROM public.associados WHERE clube_id IS NULL) THEN
  RAISE EXCEPTION 'Vincule os registros legados aos clubes antes desta migration';
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.tema_clube_atual() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT clube_id FROM public.usuarios WHERE ativo IS TRUE AND (auth_id=auth.uid() OR (auth_id IS NULL AND id=auth.uid())) ORDER BY (auth_id=auth.uid()) DESC LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.tema_clube_atual() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tema_clube_atual() TO authenticated;
CREATE OR REPLACE FUNCTION public.tema_proteger_vinculo() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE ator uuid; clube uuid;
BEGIN
 IF auth.role()='authenticated' THEN
  clube:=public.tema_clube_atual();
  IF TG_OP='UPDATE' AND NEW.clube_id IS DISTINCT FROM OLD.clube_id THEN RAISE EXCEPTION 'Vinculo protegido'; END IF;
  IF TG_OP='INSERT' THEN
   IF clube IS NULL OR NEW.clube_id IS NOT NULL AND NEW.clube_id<>clube THEN RAISE EXCEPTION 'Vinculo protegido'; END IF;
   NEW.clube_id:=clube;
  END IF;
 ELSIF auth.role()='service_role' AND TG_OP='INSERT' AND NEW.clube_id IS NULL THEN
  ator:=NULLIF(current_setting('request.headers',true)::jsonb->>'x-clube-audit-actor','')::uuid;
  SELECT clube_id INTO clube FROM public.usuarios WHERE ativo IS TRUE AND (auth_id=ator OR id=ator) LIMIT 1;
  IF clube IS NULL AND (SELECT count(*) FROM public.configuracao_clube)=1 THEN SELECT id INTO clube FROM public.configuracao_clube; END IF;
  IF clube IS NULL THEN RAISE EXCEPTION 'Clube necessario'; END IF;
  NEW.clube_id:=clube;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS tema_vinculo ON public.usuarios;
CREATE TRIGGER tema_vinculo BEFORE INSERT OR UPDATE OF clube_id ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.tema_proteger_vinculo();
DROP TRIGGER IF EXISTS tema_vinculo ON public.associados;
CREATE TRIGGER tema_vinculo BEFORE INSERT OR UPDATE OF clube_id ON public.associados FOR EACH ROW EXECUTE FUNCTION public.tema_proteger_vinculo();
-- Políticas restritivas compõem-se com as permissões existentes e impedem que
-- um administrador mude a identidade/vínculo de um usuário de outro clube.
DROP POLICY IF EXISTS tema_isolamento ON public.usuarios;
CREATE POLICY tema_isolamento ON public.usuarios AS RESTRICTIVE FOR ALL TO authenticated USING(clube_id=public.tema_clube_atual()) WITH CHECK(clube_id=public.tema_clube_atual());
DROP POLICY IF EXISTS tema_isolamento ON public.associados;
CREATE POLICY tema_isolamento ON public.associados AS RESTRICTIVE FOR ALL TO authenticated USING(clube_id=public.tema_clube_atual()) WITH CHECK(clube_id=public.tema_clube_atual());
DROP POLICY IF EXISTS tema_isolamento ON public.configuracao_clube;
CREATE POLICY tema_isolamento ON public.configuracao_clube AS RESTRICTIVE FOR ALL TO authenticated USING(id=public.tema_clube_atual()) WITH CHECK(id=public.tema_clube_atual());
CREATE TABLE IF NOT EXISTS public.clube_personalizacao(
 clube_id uuid PRIMARY KEY REFERENCES public.configuracao_clube(id) ON DELETE CASCADE,
 cores jsonb NOT NULL,
 icones jsonb,
 versao bigint NOT NULL DEFAULT 1,
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid,
 CONSTRAINT tema_limite_icon CHECK (icones IS NULL OR octet_length(icones::text)<=4000000)
);
ALTER TABLE public.clube_personalizacao ADD COLUMN IF NOT EXISTS tem_icone boolean GENERATED ALWAYS AS (icones IS NOT NULL) STORED;
ALTER TABLE public.clube_personalizacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tema_leitura ON public.clube_personalizacao;
CREATE POLICY tema_leitura ON public.clube_personalizacao FOR SELECT TO authenticated USING(clube_id=public.tema_clube_atual());
REVOKE ALL ON public.clube_personalizacao FROM anon,authenticated;
GRANT SELECT ON public.clube_personalizacao TO authenticated;
GRANT ALL ON public.clube_personalizacao TO service_role;
CREATE TABLE IF NOT EXISTS public.clube_dominios(
 dominio text PRIMARY KEY CHECK(dominio=lower(dominio) AND dominio ~ '^[a-z0-9.-]+$'),
 clube_id uuid NOT NULL REFERENCES public.configuracao_clube(id) ON DELETE CASCADE
);
ALTER TABLE public.clube_dominios ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clube_dominios FROM anon,authenticated;
GRANT ALL ON public.clube_dominios TO service_role;
-- Domínios da instalação atual. Novos clubes precisam de domínios cadastrados pelo operador.
INSERT INTO public.clube_dominios(dominio,clube_id)
 SELECT d,id FROM public.configuracao_clube CROSS JOIN (VALUES('sistema.intellia.ia.br'),('app.intellia.ia.br')) AS dominios(d)
 WHERE (SELECT count(*) FROM public.configuracao_clube)=1 ON CONFLICT DO NOTHING;
-- Somente o backend com service_role chama a operação atômica após revalidar a sessão.
-- O ator é consultado novamente no banco; não recebe um clube do cliente.
CREATE OR REPLACE FUNCTION public.salvar_personalizacao(p_ator uuid,p_cores jsonb,p_icone_acao text,p_icones jsonb,p_versao bigint)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE clube uuid; atual bigint; nova bigint; chave text;
BEGIN
 SELECT clube_id INTO clube FROM public.usuarios WHERE (auth_id=p_ator OR (auth_id IS NULL AND id=p_ator)) AND ativo IS TRUE AND is_admin IS TRUE LIMIT 1;
 IF clube IS NULL THEN RAISE EXCEPTION 'SEM_PERMISSAO'; END IF;
 IF jsonb_typeof(p_cores)<>'object' OR (SELECT count(*) FROM jsonb_object_keys(p_cores))<>9 THEN RAISE EXCEPTION 'CORES'; END IF;
 FOREACH chave IN ARRAY ARRAY['primaria','secundaria','destaque','cabecalho','menu','textoMenu','botoes','fundo','texto'] LOOP
  IF p_cores->>chave IS NULL OR p_cores->>chave !~ '^#[0-9A-Fa-f]{6}$' THEN RAISE EXCEPTION 'CORES'; END IF;
 END LOOP;
 IF p_icone_acao NOT IN ('manter','remover','substituir') OR p_icone_acao='substituir' AND p_icones IS NULL THEN RAISE EXCEPTION 'ICONE'; END IF;
 -- Lock existe mesmo no primeiro salvamento; evita corrida de INSERT.
 PERFORM 1 FROM public.configuracao_clube WHERE id=clube FOR UPDATE;
 SELECT versao INTO atual FROM public.clube_personalizacao WHERE clube_id=clube;
 IF coalesce(atual,0)<>p_versao THEN RAISE EXCEPTION 'CONFLITO'; END IF;
 nova:=coalesce(atual,0)+1;
 INSERT INTO public.clube_personalizacao(clube_id,cores,icones,versao,updated_by)
 VALUES(clube,p_cores,CASE WHEN p_icone_acao='substituir' THEN p_icones ELSE NULL END,nova,p_ator)
 ON CONFLICT(clube_id) DO UPDATE SET cores=p_cores,
 icones=CASE WHEN p_icone_acao='manter' THEN clube_personalizacao.icones WHEN p_icone_acao='remover' THEN NULL ELSE p_icones END,
 versao=nova,updated_at=now(),updated_by=p_ator;
 RETURN nova;
END $$;
REVOKE ALL ON FUNCTION public.salvar_personalizacao(uuid,jsonb,text,jsonb,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_personalizacao(uuid,jsonb,text,jsonb,bigint) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
