BEGIN;
INSERT INTO public.usuarios(id,nome,ativo,is_admin) VALUES('f0000000-0000-4000-8000-000000000001','TESTE CRM TRANSACAO',true,false);
INSERT INTO public.setores(id,nome) VALUES ('f0000000-0000-4000-8000-000000000002','TESTE SETOR A'),('f0000000-0000-4000-8000-000000000003','TESTE SETOR B');
INSERT INTO public.usuarios_setores(usuario_id,setor_id) VALUES ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002');
INSERT INTO public.conversas_whatsapp(id,telefone,setor_id) VALUES ('f0000000-0000-4000-8000-000000000004','TESTE A','f0000000-0000-4000-8000-000000000002'),('f0000000-0000-4000-8000-000000000005','TESTE B','f0000000-0000-4000-8000-000000000003');
INSERT INTO public.mensagens_whatsapp(conversa_id,direcao,conteudo) VALUES ('f0000000-0000-4000-8000-000000000004','entrada','teste'),('f0000000-0000-4000-8000-000000000005','entrada','teste');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','f0000000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.setores_whatsapp) <> 1 THEN RAISE EXCEPTION 'view sem isolamento'; END IF;
 IF (SELECT count(*) FROM public.conversas_whatsapp WHERE telefone LIKE 'TESTE %') <> 1 THEN RAISE EXCEPTION 'conversas sem isolamento'; END IF;
 IF (SELECT count(*) FROM public.mensagens_whatsapp WHERE conteudo='teste') <> 1 THEN RAISE EXCEPTION 'mensagens sem isolamento'; END IF;
 BEGIN
 INSERT INTO public.mensagens_whatsapp(conversa_id,direcao,conteudo) VALUES ('f0000000-0000-4000-8000-000000000005','saida','NEGADO');
 RAISE EXCEPTION 'insercao indevida permitida';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
UPDATE public.usuarios SET ativo=false WHERE id='f0000000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.conversas_whatsapp WHERE telefone LIKE 'TESTE %') THEN RAISE EXCEPTION 'usuario inativo com acesso'; END IF;
END $$;
ROLLBACK;
