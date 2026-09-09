BEGIN;
SELECT set_config('request.jwt.claim.sub',(SELECT auth_id::text FROM public.usuarios WHERE email='admin@clube.local'),true);
SET LOCAL ROLE authenticated;
UPDATE dashboard_config SET paineis=ARRAY['conversas','alertas','setores','metricas'] WHERE id=true;
DO $$ BEGIN
 IF (SELECT cardinality(paineis) FROM dashboard_config WHERE id=true)<>4 THEN RAISE EXCEPTION 'Admin não salvou'; END IF;
END $$;
RESET ROLE;
UPDATE usuarios SET is_admin=false WHERE email='admin@clube.local';
SET LOCAL ROLE authenticated;
DO $$ DECLARE n integer; BEGIN
 IF (SELECT count(*) FROM dashboard_config)<>1 THEN RAISE EXCEPTION 'Usuário não lê configuração'; END IF;
 UPDATE dashboard_config SET paineis=ARRAY[]::text[];
 GET DIAGNOSTICS n=ROW_COUNT;
 IF n<>0 THEN RAISE EXCEPTION 'Não-admin alterou configuração'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM * FROM dashboard_config; RAISE EXCEPTION 'Anônimo leu configuração';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
