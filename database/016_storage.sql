-- =====================================================
-- STORAGE BUCKETS (SUPABASE)
-- =====================================================

-- Criar buckets para upload de arquivos
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('fotos-associados', 'fotos-associados', true),
  ('fotos-dependentes', 'fotos-dependentes', true),
  ('documentos', 'documentos', false),
  ('exames-medicos', 'exames-medicos', false),
  ('cotacoes', 'cotacoes', false),
  ('notas-fiscais', 'notas-fiscais', false),
  ('comprovantes', 'comprovantes', false),
  ('clube-config', 'clube-config', true),
  ('carteirinhas', 'carteirinhas', false);

-- Políticas de Storage

-- Fotos de associados (públicas para leitura)
CREATE POLICY "fotos_associados_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'fotos-associados');

CREATE POLICY "fotos_associados_auth_upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'fotos-associados' AND auth.role() = 'authenticated');

-- Documentos (só secretaria e admin)
CREATE POLICY "documentos_auth_access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'documentos' AND 
  (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'presidente', 'vice_presidente', 'secretaria')
);

-- Exames médicos (secretaria e portaria piscina)
CREATE POLICY "exames_auth_access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'exames-medicos' AND 
  (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'presidente', 'vice_presidente', 'secretaria', 'portaria_piscina')
);

-- Cotações e notas (só financeiro)
CREATE POLICY "financeiro_docs_access"
ON storage.objects FOR ALL
USING (
  bucket_id IN ('cotacoes', 'notas-fiscais', 'comprovantes') AND 
  (SELECT tipo FROM usuarios WHERE id = auth.uid()) IN ('admin', 'presidente', 'vice_presidente', 'financeiro')
);

-- Config do clube (público leitura, admin escrita)
CREATE POLICY "clube_config_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'clube-config');

CREATE POLICY "clube_config_admin_write"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'clube-config' AND 
  (SELECT tipo FROM usuarios WHERE id = auth.uid()) = 'admin'
);

