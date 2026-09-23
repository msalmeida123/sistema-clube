-- Armazenamento usado pelos formulários de cadastro e edição de associados.
-- Não altera fotos existentes. A leitura pública mantém compatibilidade com
-- as URLs de carteirinhas; escrita requer permissão de cadastro/edição.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fotos-associados', 'fotos-associados', true, 10485760,
 ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET file_size_limit=10485760,
 allowed_mime_types=ARRAY['image/jpeg','image/png','image/webp'];

-- Restritiva para impedir que políticas permissivas legadas abram este bucket.
DROP POLICY IF EXISTS fotos_associados_restricao ON storage.objects;
CREATE POLICY fotos_associados_restricao ON storage.objects AS RESTRICTIVE
FOR ALL TO anon, authenticated
USING (bucket_id <> 'fotos-associados' OR
 public.sistema_pode('associados','editar') OR public.sistema_pode('associados','criar'))
WITH CHECK (bucket_id <> 'fotos-associados' OR
 public.sistema_pode('associados','editar') OR public.sistema_pode('associados','criar'));

DROP POLICY IF EXISTS fotos_associados_envio ON storage.objects;
CREATE POLICY fotos_associados_envio ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='fotos-associados' AND
 (public.sistema_pode('associados','editar') OR public.sistema_pode('associados','criar')));
COMMIT;
