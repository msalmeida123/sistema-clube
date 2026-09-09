BEGIN;
INSERT INTO conversas_whatsapp(id,telefone) VALUES('f7000000-0000-4000-8000-000000000001','TESTE RETENCAO');
INSERT INTO mensagens_whatsapp(id,conversa_id,direcao,conteudo,status,message_id,created_at) VALUES
 ('f7000000-0000-4000-8000-000000000011','f7000000-0000-4000-8000-000000000001','entrada','antiga','recebida','teste-retencao-1',now()-interval '100 days'),
 ('f7000000-0000-4000-8000-000000000012','f7000000-0000-4000-8000-000000000001','entrada','recente','recebida',null,now()),
 ('f7000000-0000-4000-8000-000000000013','f7000000-0000-4000-8000-000000000001','saida','incerta','incerto',null,now()-interval '100 days');
INSERT INTO mensagens_whatsapp(conversa_id,direcao,conteudo,message_id) VALUES('f7000000-0000-4000-8000-000000000001','entrada','duplicada','teste-retencao-1');
DO $$ DECLARE lote jsonb; n integer; BEGIN
 IF (SELECT count(*) FROM mensagens_whatsapp WHERE conversa_id='f7000000-0000-4000-8000-000000000001')<>3 THEN RAISE EXCEPTION 'Duplicação'; END IF;
 SELECT jsonb_agg(x) INTO lote FROM crm_lote_arquivo() x WHERE x->'mensagem'->>'conversa_id'='f7000000-0000-4000-8000-000000000001';
 IF jsonb_array_length(lote)<>1 THEN RAISE EXCEPTION 'Elegibilidade incorreta'; END IF;
 UPDATE conversas_whatsapp SET preservar_historico=true WHERE id='f7000000-0000-4000-8000-000000000001';
 IF crm_confirmar_arquivo(lote)<>0 THEN RAISE EXCEPTION 'Preservação ignorada'; END IF;
 UPDATE conversas_whatsapp SET preservar_historico=false WHERE id='f7000000-0000-4000-8000-000000000001';
 UPDATE mensagens_whatsapp SET conteudo='alterada' WHERE id='f7000000-0000-4000-8000-000000000011';
 IF crm_confirmar_arquivo(lote)<>0 THEN RAISE EXCEPTION 'Alteração não arquivada apagada'; END IF;
 SELECT jsonb_agg(x) INTO lote FROM crm_lote_arquivo() x WHERE x->'mensagem'->>'conversa_id'='f7000000-0000-4000-8000-000000000001';
 IF crm_confirmar_arquivo(lote)<>1 THEN RAISE EXCEPTION 'Limpeza falhou'; END IF;
END $$;
INSERT INTO mensagens_whatsapp(conversa_id,direcao,conteudo,message_id) VALUES('f7000000-0000-4000-8000-000000000001','entrada','reentrega após arquivo','teste-retencao-1');
DO $$ BEGIN
 IF (SELECT count(*) FROM mensagens_whatsapp WHERE conversa_id='f7000000-0000-4000-8000-000000000001')<>2 THEN RAISE EXCEPTION 'Reentrega após arquivo'; END IF;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN
 PERFORM crm_lote_arquivo();
 RAISE EXCEPTION 'Acesso indevido';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END $$;
ROLLBACK;
