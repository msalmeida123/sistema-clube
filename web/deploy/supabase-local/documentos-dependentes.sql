BEGIN;
ALTER TABLE public.dependentes
 ADD COLUMN IF NOT EXISTS certidao_nascimento_path text,
 ADD COLUMN IF NOT EXISTS certidao_casamento_path text,
 ADD COLUMN IF NOT EXISTS documento_complementar_path text,
 ADD COLUMN IF NOT EXISTS comprovante_matricula_path text,
 ADD COLUMN IF NOT EXISTS instituicao_ensino text,
 ADD COLUMN IF NOT EXISTS matricula_valida_ate date;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('documentos-dependentes','documentos-dependentes',false,10485760,ARRAY['application/pdf','image/jpeg','image/png'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=10485760,allowed_mime_types=EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS documentos_dependentes_leitura ON storage.objects;
CREATE POLICY documentos_dependentes_leitura ON storage.objects FOR SELECT TO authenticated
 USING (bucket_id='documentos-dependentes' AND public.clube_admin_local());
DROP POLICY IF EXISTS documentos_dependentes_envio ON storage.objects;
CREATE POLICY documentos_dependentes_envio ON storage.objects FOR INSERT TO authenticated
 WITH CHECK (bucket_id='documentos-dependentes' AND public.clube_admin_local() AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE OR REPLACE FUNCTION public.validar_documentos_dependente() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE hoje date := (now() AT TIME ZONE 'America/Sao_Paulo')::date; filho boolean; caminho text;
BEGIN
 filho := NEW.parentesco IN ('filho','filha','filho_universitario','enteado','adotado');
 IF NEW.data_nascimento > hoje THEN RAISE EXCEPTION 'Data de nascimento inválida'; END IF;
 FOREACH caminho IN ARRAY ARRAY[NEW.certidao_nascimento_path,NEW.certidao_casamento_path,NEW.documento_complementar_path,NEW.comprovante_matricula_path] LOOP
  IF caminho IS NOT NULL AND NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='documentos-dependentes' AND name=caminho) THEN
   RAISE EXCEPTION 'Documento não encontrado no armazenamento privado';
  END IF;
 END LOOP;
 IF NEW.status='ativo' THEN
  IF filho AND (NEW.data_nascimento IS NULL OR nullif(NEW.certidao_nascimento_path,'') IS NULL) THEN RAISE EXCEPTION 'Informe nascimento e certidão de nascimento'; END IF;
  IF NEW.parentesco IN ('conjuge','enteado') AND nullif(NEW.certidao_casamento_path,'') IS NULL THEN RAISE EXCEPTION 'Anexe a certidão de casamento'; END IF;
  IF NEW.parentesco IN ('pai','mae','sogra','adotado') AND nullif(NEW.documento_complementar_path,'') IS NULL THEN RAISE EXCEPTION 'Anexe o documento complementar'; END IF;
  IF NEW.parentesco IN ('pai','mae') AND (NEW.data_nascimento IS NULL OR extract(year FROM age(hoje,NEW.data_nascimento)) < 60) THEN RAISE EXCEPTION 'Idade mínima: 60 anos'; END IF;
  IF filho AND (NEW.parentesco='filho_universitario' OR extract(year FROM age(hoje,NEW.data_nascimento)) > 21) THEN
   IF nullif(NEW.comprovante_matricula_path,'') IS NULL OR NEW.matricula_valida_ate IS NULL OR NEW.matricula_valida_ate < hoje OR nullif(trim(NEW.instituicao_ensino),'') IS NULL THEN
    RAISE EXCEPTION 'Após os 21 anos, informe faculdade e comprovante de matrícula válido';
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS dependentes_validar_documentos ON public.dependentes;
CREATE TRIGGER dependentes_validar_documentos BEFORE INSERT OR UPDATE ON public.dependentes
 FOR EACH ROW EXECUTE FUNCTION public.validar_documentos_dependente();
NOTIFY pgrst, 'reload schema';
COMMIT;
