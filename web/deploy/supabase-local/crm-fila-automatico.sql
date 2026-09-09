ALTER TABLE public.crm_fila ALTER COLUMN usuario_id DROP NOT NULL;
CREATE OR REPLACE FUNCTION public.crm_enfileirar_automatico(p_id uuid,p_conversa uuid,p_payload jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE conteudo text;
BEGIN
 IF auth.role()<>'service_role' THEN RAISE EXCEPTION 'Restrito ao servidor' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(7391042);
 IF EXISTS(SELECT 1 FROM public.crm_fila WHERE id=p_id) THEN RETURN p_id; END IF;
 IF (SELECT count(*) FROM public.crm_fila WHERE status IN ('pendente','enviando'))>=5000 THEN RAISE EXCEPTION 'Fila cheia'; END IF;
 conteudo:=coalesce(p_payload->>'text',p_payload->>'caption','Anexo');
 INSERT INTO public.crm_fila(id,conversa_id,payload) VALUES(p_id,p_conversa,p_payload);
 INSERT INTO public.mensagens_whatsapp(id,conversa_id,direcao,conteudo,tipo,status,media_url)
 VALUES(p_id,p_conversa,'saida',conteudo,coalesce(p_payload->>'messageType','text'),'na_fila',p_payload->>'mediaUrl');
 UPDATE public.conversas_whatsapp SET ultima_mensagem=left(conteudo,100),ultimo_contato=now() WHERE id=p_conversa;
 RETURN p_id;
END $$;
REVOKE ALL ON FUNCTION public.crm_enfileirar_automatico(uuid,uuid,jsonb) FROM PUBLIC,authenticated,anon;
GRANT EXECUTE ON FUNCTION public.crm_enfileirar_automatico(uuid,uuid,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
