BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT auth_id::text FROM usuarios WHERE email='admin@clube.local'),true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE n integer; BEGIN
 UPDATE servicos_cores SET urgente='#a855f7' WHERE id=true;GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>1 OR (SELECT urgente FROM servicos_cores WHERE id=true)<>'#a855f7' THEN RAISE EXCEPTION 'Admin não salvou';END IF;
 BEGIN UPDATE servicos_cores SET urgente='red';RAISE EXCEPTION 'Cor inválida aceita';EXCEPTION WHEN check_violation THEN NULL;END;
END $$;
RESET ROLE;
UPDATE usuarios SET is_admin=false,permissoes=ARRAY['servicos'] WHERE email='admin@clube.local';
SET LOCAL ROLE authenticated;
DO $$ DECLARE n integer; BEGIN
 IF (SELECT urgente FROM servicos_cores WHERE id=true)<>'#a855f7' THEN RAISE EXCEPTION 'Equipe não lê cores';END IF;
 UPDATE servicos_cores SET urgente='#000000';GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'Não administrador alterou cores';END IF;
END $$;
RESET ROLE;
UPDATE usuarios SET permissoes=ARRAY['crm'] WHERE email='admin@clube.local';
SET LOCAL ROLE authenticated;
DO $$ BEGIN IF (SELECT count(*) FROM servicos_cores)<>0 THEN RAISE EXCEPTION 'Sem módulo leu cores';END IF;END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN BEGIN PERFORM * FROM servicos_cores;RAISE EXCEPTION 'Anônimo leu';EXCEPTION WHEN insufficient_privilege THEN NULL;END;END $$;
ROLLBACK;
