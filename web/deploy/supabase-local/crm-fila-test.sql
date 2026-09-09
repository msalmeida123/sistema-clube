BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT auth_id::text FROM public.usuarios WHERE email='admin@clube.local'),true);
INSERT INTO public.conversas_whatsapp(id,telefone) VALUES('f1000000-0000-4000-8000-000000000001','TESTE FILA');
SET LOCAL ROLE authenticated;
SELECT public.crm_enfileirar('f1000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000001','{"text":"TESTE SEM ENVIO","messageType":"text"}');
SELECT public.crm_enfileirar('f1000000-0000-4000-8000-000000000002','f1000000-0000-4000-8000-000000000001','{"text":"TESTE SEM ENVIO","messageType":"text"}');
RESET ROLE;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.crm_fila WHERE id='f1000000-0000-4000-8000-000000000002')<>1 THEN RAISE EXCEPTION 'Fila duplicada'; END IF;
 IF (SELECT count(*) FROM public.mensagens_whatsapp WHERE id='f1000000-0000-4000-8000-000000000002' AND status='na_fila')<>1 THEN RAISE EXCEPTION 'Histórico inválido'; END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','f1000000-0000-4000-8000-000000000099',true);
DO $$ BEGIN
 BEGIN
 PERFORM public.crm_enfileirar('f1000000-0000-4000-8000-000000000003','f1000000-0000-4000-8000-000000000001','{"text":"NEGADO"}');
 RAISE EXCEPTION 'Acesso indevido'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
