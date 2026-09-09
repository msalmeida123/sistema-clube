BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT auth_id::text FROM usuarios WHERE email='admin@clube.local'),true);
SELECT set_config('request.jwt.claims','{"role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
UPDATE servicos_cores SET urgente='#aabbcc' WHERE id=true;
DO $$ DECLARE e sistema_auditoria; BEGIN
 SELECT * INTO e FROM sistema_auditoria WHERE tabela='servicos_cores' ORDER BY id DESC LIMIT 1;
 IF e.usuario_id IS DISTINCT FROM auth.uid() OR NOT('urgente'=ANY(e.campos)) THEN RAISE EXCEPTION 'Ator ou campo ausente';END IF;
 IF to_jsonb(e)::text LIKE '%#aabbcc%' THEN RAISE EXCEPTION 'Valor sensível copiado';END IF;
 BEGIN DELETE FROM sistema_auditoria;RAISE EXCEPTION 'Log foi removido';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
SELECT set_config('request.headers',json_build_object('x-clube-audit-actor',(SELECT auth_id::text FROM usuarios WHERE email='admin@clube.local'))::text,true);
UPDATE rh_configuracao SET senha='SEGREDO-TESTE-NAO-LOGAR';
DO $$ DECLARE e sistema_auditoria; BEGIN
 SELECT * INTO e FROM sistema_auditoria WHERE tabela='rh_configuracao' ORDER BY id DESC LIMIT 1;
 IF e.usuario_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Ator da API ausente';END IF;
 IF to_jsonb(e)::text LIKE '%SEGREDO-TESTE%' THEN RAISE EXCEPTION 'Segredo registrado';END IF;
END $$;
INSERT INTO auth.audit_log_entries(id,payload,created_at) VALUES(gen_random_uuid(),json_build_object('action','login','actor_id',auth.uid(),'actor_username','teste-auditoria'),now());
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM sistema_auditoria WHERE tipo='autenticacao' AND usuario_nome='teste-auditoria') THEN RAISE EXCEPTION 'Login ausente';END IF;END $$;
UPDATE usuarios SET is_admin=false WHERE email='admin@clube.local';
SET LOCAL ROLE authenticated;
DO $$ BEGIN IF (SELECT count(*) FROM sistema_auditoria)<>0 THEN RAISE EXCEPTION 'Não admin leu auditoria';END IF;BEGIN PERFORM sistema_pedir_backup();RAISE EXCEPTION 'Não admin gerou backup';EXCEPTION WHEN raise_exception THEN IF SQLERRM='Não admin gerou backup' THEN RAISE;END IF;END;END $$;
ROLLBACK;
