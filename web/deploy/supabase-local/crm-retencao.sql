BEGIN;
ALTER TABLE public.conversas_whatsapp ADD COLUMN IF NOT EXISTS preservar_historico boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS crm_mensagens_paginacao ON public.mensagens_whatsapp(conversa_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS crm_mensagens_retencao ON public.mensagens_whatsapp(created_at);
INSERT INTO storage.buckets(id,name,public) VALUES('crm-arquivo','crm-arquivo',false) ON CONFLICT(id) DO NOTHING;
DROP POLICY IF EXISTS crm_arquivo_privado ON storage.objects;
CREATE POLICY crm_arquivo_privado ON storage.objects AS RESTRICTIVE TO anon,authenticated USING(bucket_id<>'crm-arquivo') WITH CHECK(bucket_id<>'crm-arquivo');

-- Identificadores pequenos permanecem após o arquivamento para impedir reentregas.
CREATE TABLE IF NOT EXISTS public.crm_recebidas (
 conversa_id uuid NOT NULL REFERENCES public.conversas_whatsapp(id) ON DELETE CASCADE,
 message_id text NOT NULL, PRIMARY KEY(conversa_id,message_id)
);
ALTER TABLE public.crm_recebidas ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.crm_recebidas FROM anon,authenticated;
INSERT INTO public.crm_recebidas SELECT DISTINCT conversa_id,message_id FROM public.mensagens_whatsapp
 WHERE direcao='entrada' AND nullif(message_id,'') IS NOT NULL ON CONFLICT DO NOTHING;
CREATE OR REPLACE FUNCTION public.crm_deduplicar_recebida() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.direcao='entrada' AND nullif(NEW.message_id,'') IS NOT NULL THEN
  INSERT INTO crm_recebidas VALUES(NEW.conversa_id,NEW.message_id) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN NULL; END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS crm_deduplicar_recebida ON public.mensagens_whatsapp;
CREATE TRIGGER crm_deduplicar_recebida BEFORE INSERT ON public.mensagens_whatsapp FOR EACH ROW EXECUTE FUNCTION public.crm_deduplicar_recebida();

CREATE OR REPLACE FUNCTION public.crm_lote_arquivo() RETURNS SETOF jsonb
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('mensagem',to_jsonb(m),'fila',to_jsonb(f))
 FROM mensagens_whatsapp m JOIN conversas_whatsapp c ON c.id=m.conversa_id
 LEFT JOIN crm_fila f ON f.id=m.id
 WHERE m.created_at < now()-interval '90 days' AND NOT c.preservar_historico
 AND m.status IN ('enviada','entregue','lida','recebida','sent','delivered','read')
 AND (f.id IS NULL OR (f.status='enviada' AND f.updated_at < now()-interval '90 days'))
 ORDER BY m.created_at,m.id LIMIT 100;
$$;
-- Exclusão revalida o conteúdo e bloqueia os registros: uma alteração posterior
-- ao arquivo impede a remoção. Falhas, pendências e conversas preservadas ficam.
CREATE OR REPLACE FUNCTION public.crm_confirmar_arquivo(p_lote jsonb) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; m mensagens_whatsapp; f crm_fila; manter boolean; total integer:=0;
BEGIN
 IF jsonb_typeof(p_lote) <> 'array' OR jsonb_array_length(p_lote)>100 THEN RAISE EXCEPTION 'Lote inválido'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_lote) LOOP
  SELECT preservar_historico INTO manter FROM conversas_whatsapp WHERE id=(item->'mensagem'->>'conversa_id')::uuid FOR UPDATE;
  IF manter IS DISTINCT FROM false THEN CONTINUE; END IF;
  SELECT * INTO f FROM crm_fila WHERE id=(item->'mensagem'->>'id')::uuid FOR UPDATE;
  SELECT * INTO m FROM mensagens_whatsapp WHERE id=(item->'mensagem'->>'id')::uuid FOR UPDATE;
  IF m.id IS NULL OR to_jsonb(m) IS DISTINCT FROM item->'mensagem' THEN CONTINUE; END IF;
  IF m.created_at >= now()-interval '90 days' OR m.status NOT IN ('enviada','entregue','lida','recebida','sent','delivered','read') THEN CONTINUE; END IF;
  IF f.id IS NOT NULL THEN
   IF to_jsonb(f) IS DISTINCT FROM item->'fila' OR f.status<>'enviada' OR f.updated_at>=now()-interval '90 days' THEN CONTINUE; END IF;
   DELETE FROM crm_fila WHERE id=f.id;
  ELSIF item->'fila' <> 'null'::jsonb THEN CONTINUE;
  END IF;
  DELETE FROM mensagens_whatsapp WHERE id=m.id;
  total:=total+1;
 END LOOP;
 RETURN total;
END $$;
REVOKE ALL ON FUNCTION public.crm_lote_arquivo(),public.crm_confirmar_arquivo(jsonb),public.crm_deduplicar_recebida() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.crm_lote_arquivo(),public.crm_confirmar_arquivo(jsonb) TO service_role;
COMMIT;
