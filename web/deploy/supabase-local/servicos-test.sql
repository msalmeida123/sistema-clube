BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT auth_id::text FROM usuarios WHERE email='admin@clube.local'),true);
SET LOCAL ROLE authenticated;
INSERT INTO servicos_tarefas(id,titulo,data,responsavel_id) VALUES('f8000000-0000-4000-8000-000000000001','TESTE SERVICO','2026-09-08',(SELECT id FROM usuarios WHERE email='admin@clube.local'));
DO $$ DECLARE antiga timestamptz;n integer; BEGIN
 SELECT updated_at INTO antiga FROM servicos_tarefas WHERE id='f8000000-0000-4000-8000-000000000001';
 UPDATE servicos_tarefas SET data='2026-09-09',status='em_andamento' WHERE id='f8000000-0000-4000-8000-000000000001' AND updated_at=antiga;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 THEN RAISE EXCEPTION 'Movimentação falhou';END IF;
 UPDATE servicos_tarefas SET status='concluido' WHERE id='f8000000-0000-4000-8000-000000000001' AND updated_at=antiga;
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'Edição antiga sobrescreveu alteração';END IF;
END $$;
RESET ROLE;
UPDATE usuarios SET is_admin=false,permissoes=ARRAY['servicos'] WHERE email='admin@clube.local';
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF NOT clube_servicos_permitido() THEN RAISE EXCEPTION 'Módulo não reconhecido';END IF;
 IF (SELECT count(*) FROM servicos_tarefas WHERE id='f8000000-0000-4000-8000-000000000001')<>1 THEN RAISE EXCEPTION 'Usuário não lê tarefa';END IF;
END $$;
UPDATE servicos_tarefas SET status='concluido' WHERE id='f8000000-0000-4000-8000-000000000001';
RESET ROLE;
UPDATE usuarios SET permissoes=ARRAY['crm'] WHERE email='admin@clube.local';
SET LOCAL ROLE authenticated;
DO $$ DECLARE n integer; BEGIN
 IF (SELECT count(*) FROM servicos_tarefas)<>0 THEN RAISE EXCEPTION 'Usuário CRM lê serviços';END IF;
 DELETE FROM servicos_tarefas WHERE id='f8000000-0000-4000-8000-000000000001';GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'Usuário sem módulo excluiu tarefa';END IF;
 BEGIN INSERT INTO servicos_tarefas(titulo,data)VALUES('SEM PERMISSAO','2026-09-08');RAISE EXCEPTION 'Inserção indevida';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM * FROM servicos_tarefas;RAISE EXCEPTION 'Anônimo leu tarefas';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
ROLLBACK;
