ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS tipo_cadastro text NOT NULL DEFAULT 'pf';
ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS cnpj varchar(14);
ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS nome_fantasia varchar(200);
ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS empresa_associada_id uuid REFERENCES public.associados(id);
CREATE OR REPLACE FUNCTION public.cnpj_clube_valido(v text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
DECLARE n text:=upper(regexp_replace(coalesce(v,''),'[./[:space:]-]','','g')); base text; etapa int; i int; peso int; soma int; resto int;
BEGIN
 IF n !~ '^[A-Z0-9]{12}[0-9]{2}$' OR n ~ '^(.)\1{13}$' THEN RETURN false; END IF;
 base:=left(n,12);
 FOR etapa IN 0..1 LOOP
  soma:=0;
  FOR i IN 1..length(base) LOOP
   peso:=((length(base)-i)%8)+2;
   soma:=soma+(ascii(substr(base,i,1))-48)*peso;
  END LOOP;
  resto:=soma%11;base:=base||CASE WHEN resto<2 THEN '0' ELSE (11-resto)::text END;
 END LOOP;
 RETURN base=n;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS associados_cnpj_unico ON public.associados(cnpj) WHERE cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS associados_empresa_vinculada ON public.associados(empresa_associada_id) WHERE empresa_associada_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.validar_empresa_associada() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.tipo_cadastro NOT IN ('pf','pj') THEN RAISE EXCEPTION 'Tipo de cadastro inválido' USING ERRCODE='23514'; END IF;
 NEW.cnpj:=nullif(upper(regexp_replace(coalesce(NEW.cnpj,''),'[./[:space:]-]','','g')),'');
 IF NEW.tipo_cadastro='pj' THEN
  IF NOT public.cnpj_clube_valido(NEW.cnpj) THEN RAISE EXCEPTION 'CNPJ inválido' USING ERRCODE='23514'; END IF;
  IF nullif(NEW.cpf,'') IS NOT NULL OR NEW.empresa_associada_id IS NOT NULL THEN RAISE EXCEPTION 'Empresa deve usar CNPJ e não pode ser vinculada como funcionário' USING ERRCODE='23514'; END IF;
 ELSE
  IF NEW.cnpj IS NOT NULL THEN RAISE EXCEPTION 'Pessoa física deve usar CPF' USING ERRCODE='23514'; END IF;
 END IF;
 IF NEW.empresa_associada_id IS NOT NULL THEN
  PERFORM 1 FROM public.associados WHERE id=NEW.empresa_associada_id AND tipo_cadastro='pj' AND id<>NEW.id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Selecione uma empresa cadastrada como pessoa jurídica' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='UPDATE' AND OLD.tipo_cadastro='pj' AND NEW.tipo_cadastro<>'pj' AND EXISTS(SELECT 1 FROM public.associados WHERE empresa_associada_id=NEW.id) THEN
  RAISE EXCEPTION 'Desvincule os funcionários antes de mudar o tipo da empresa' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.validar_empresa_associada() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS validar_empresa_associada ON public.associados;
CREATE TRIGGER validar_empresa_associada BEFORE INSERT OR UPDATE ON public.associados FOR EACH ROW EXECUTE FUNCTION public.validar_empresa_associada();
NOTIFY pgrst,'reload schema';
