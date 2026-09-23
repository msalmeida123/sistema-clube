-- Não preenche nem apaga dados históricos. A regra vale para novos cadastros
-- e para alterações dos campos de cadastro abaixo.
CREATE OR REPLACE FUNCTION public.campo_obrigatorio_associado(d jsonb) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE campo text; campos text[]:=ARRAY['tipo_cadastro','nome','email','telefone','foto_url','cep','tipo_residencia','endereco','numero','bairro','cidade','estado','plano','status'];
BEGIN
 IF d->>'tipo_cadastro'='pj' THEN
  campos:=campos||ARRAY['cnpj','nome_fantasia'];
 ELSE
  campos:=campos||ARRAY['cpf','rg','titulo_eleitor','data_nascimento','empresa_associada_id'];
 END IF;
 FOREACH campo IN ARRAY campos LOOP
  IF coalesce(d->>campo,'') !~ '[^[:space:]]' THEN RETURN campo; END IF;
 END LOOP;
 RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION public.exigir_cadastro_associado_completo() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE campo text;
BEGIN
 campo:=public.campo_obrigatorio_associado(to_jsonb(NEW));
 IF campo IS NOT NULL THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='cadastro_obrigatorio:'||campo; END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS zzz_cadastro_associado_obrigatorio ON public.associados;
CREATE TRIGGER zzz_cadastro_associado_obrigatorio BEFORE INSERT OR UPDATE OF
 tipo_cadastro,nome,email,telefone,foto_url,cep,tipo_residencia,endereco,numero,complemento,bairro,cidade,estado,plano,status,cnpj,nome_fantasia,cpf,rg,titulo_eleitor,data_nascimento,empresa_associada_id
ON public.associados FOR EACH ROW EXECUTE FUNCTION public.exigir_cadastro_associado_completo();
NOTIFY pgrst,'reload schema';
