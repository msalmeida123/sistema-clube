-- Executar em uma única transação. Não altera nem exclui cadastros existentes.
LOCK TABLE public.associados, public.convites IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS (SELECT cpf FROM (
 SELECT regexp_replace(coalesce(cpf,''),'[^0-9]','','g') AS cpf FROM public.associados
 UNION ALL SELECT regexp_replace(coalesce(cpf_convidado,''),'[^0-9]','','g') FROM public.convites
 ) c WHERE cpf<>'' GROUP BY cpf HAVING count(*)>1) THEN
 RAISE EXCEPTION 'Há CPFs repetidos. Resolva os cadastros indicados pelo diagnóstico antes de aplicar a regra.';
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.clube_cpfs_unicos (
 cpf text PRIMARY KEY,
 origem text NOT NULL CHECK(origem IN ('associados','convites')),
 cadastro_id uuid NOT NULL,
 UNIQUE(origem,cadastro_id)
);
ALTER TABLE public.clube_cpfs_unicos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clube_cpfs_unicos FROM PUBLIC,anon,authenticated;
-- Reconstrução idempotente do índice global sob bloqueio das tabelas de origem.
DELETE FROM public.clube_cpfs_unicos;
INSERT INTO public.clube_cpfs_unicos(cpf,origem,cadastro_id)
SELECT regexp_replace(cpf,'[^0-9]','','g'),'associados',id FROM public.associados WHERE regexp_replace(coalesce(cpf,''),'[^0-9]','','g')<>''
UNION ALL
SELECT regexp_replace(cpf_convidado,'[^0-9]','','g'),'convites',id FROM public.convites WHERE regexp_replace(coalesce(cpf_convidado,''),'[^0-9]','','g')<>'';
-- Cada CPF é reservado atomicamente pela PK, inclusive em cadastros simultâneos.
CREATE OR REPLACE FUNCTION public.clube_validar_cpf_unico() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE valor text;anterior text;dono public.clube_cpfs_unicos%ROWTYPE;
BEGIN
 valor:=regexp_replace(coalesce(CASE WHEN TG_TABLE_NAME='associados' THEN to_jsonb(NEW)->>'cpf' ELSE to_jsonb(NEW)->>'cpf_convidado' END,''),'[^0-9]','','g');
 IF TG_OP='UPDATE' THEN
  anterior:=regexp_replace(coalesce(CASE WHEN TG_TABLE_NAME='associados' THEN to_jsonb(OLD)->>'cpf' ELSE to_jsonb(OLD)->>'cpf_convidado' END,''),'[^0-9]','','g');
  IF valor=anterior AND NEW.id=OLD.id THEN RETURN NEW; END IF;
  DELETE FROM public.clube_cpfs_unicos WHERE origem=TG_TABLE_NAME AND cadastro_id=OLD.id;
 END IF;
 IF valor<>'' THEN
  INSERT INTO public.clube_cpfs_unicos(cpf,origem,cadastro_id) VALUES(valor,TG_TABLE_NAME,NEW.id)
  ON CONFLICT(cpf) DO UPDATE SET cpf=EXCLUDED.cpf RETURNING * INTO dono;
  IF dono.origem<>TG_TABLE_NAME OR dono.cadastro_id<>NEW.id THEN
   RAISE EXCEPTION USING ERRCODE='23505',CONSTRAINT='cpf_unico_clube',MESSAGE='Este CPF já está cadastrado no clube. Não é permitido repetir CPF entre associados ou convites.';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.clube_liberar_cpf_excluido() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 DELETE FROM public.clube_cpfs_unicos WHERE origem=TG_TABLE_NAME AND cadastro_id=OLD.id;
 RETURN OLD;
END $$;
REVOKE ALL ON FUNCTION public.clube_validar_cpf_unico() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.clube_liberar_cpf_excluido() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS clube_cpf_unico ON public.associados;
CREATE TRIGGER clube_cpf_unico BEFORE INSERT OR UPDATE ON public.associados FOR EACH ROW EXECUTE FUNCTION public.clube_validar_cpf_unico();
DROP TRIGGER IF EXISTS clube_cpf_unico ON public.convites;
CREATE TRIGGER clube_cpf_unico BEFORE INSERT OR UPDATE ON public.convites FOR EACH ROW EXECUTE FUNCTION public.clube_validar_cpf_unico();
DROP TRIGGER IF EXISTS clube_cpf_excluido ON public.associados;
CREATE TRIGGER clube_cpf_excluido AFTER DELETE ON public.associados FOR EACH ROW EXECUTE FUNCTION public.clube_liberar_cpf_excluido();
DROP TRIGGER IF EXISTS clube_cpf_excluido ON public.convites;
CREATE TRIGGER clube_cpf_excluido AFTER DELETE ON public.convites FOR EACH ROW EXECUTE FUNCTION public.clube_liberar_cpf_excluido();
NOTIFY pgrst,'reload schema';
