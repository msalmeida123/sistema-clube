const fs=require('fs'),cp=require('child_process');const base='deploy/supabase-local/';const migration=fs.readFileSync(base+'migracao-clickup-local.sql','utf8').replace(/COMMIT;\s*$/,'');const again=migration.replace(/^BEGIN;$/m,'');
const assertions=`
DO $test$ BEGIN
 IF EXISTS (SELECT FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity) THEN RAISE EXCEPTION 'Tabela publica sem RLS'; END IF;
 IF (SELECT count(*) FROM public.paginas_sistema) <> 25 THEN RAISE EXCEPTION 'Dados iniciais alterados'; END IF;
END $test$;
INSERT INTO auth.users (id,email) VALUES ('00000000-0000-4000-8000-000000009001','migration-test@invalid.local');
INSERT INTO public.usuarios (id,auth_id,nome,email,is_admin,ativo) VALUES ('00000000-0000-4000-8000-000000009001','00000000-0000-4000-8000-000000009001','Teste transacional','migration-test@invalid.local',true,true);
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009001',true);
SET LOCAL ROLE authenticated;
INSERT INTO public.bar_categorias(nome) VALUES ('Teste transacional');
DO $test$ BEGIN IF (SELECT count(*) FROM public.bar_categorias WHERE nome='Teste transacional') <> 1 THEN RAISE EXCEPTION 'Admin nao consegue ler'; END IF; END $test$;
RESET ROLE;
UPDATE public.usuarios SET ativo=false WHERE id='00000000-0000-4000-8000-000000009001';
SET LOCAL ROLE authenticated;
DO $test$ BEGIN
 IF EXISTS (SELECT FROM public.bar_categorias) THEN RAISE EXCEPTION 'Inativo pode ler'; END IF;
 BEGIN INSERT INTO public.bar_categorias(nome) VALUES ('Nao permitido'); RAISE EXCEPTION 'Inativo pode inserir'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $test$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $test$ BEGIN BEGIN PERFORM * FROM public.bar_categorias; RAISE EXCEPTION 'Anon pode ler'; EXCEPTION WHEN insufficient_privilege THEN NULL; END; END $test$;
RESET ROLE;
ROLLBACK;
`;
fs.writeFileSync(base+'verificar-migracao.sql',assertions);
const r=cp.spawnSync('docker',['exec','-i','clube-supabase-db','psql','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],{input:migration+'\n'+again+'\n'+assertions,encoding:'utf8',maxBuffer:4e6});fs.writeFileSync(base+'validacao-reaplicacao.log',r.stdout+'\n'+r.stderr);console.log('Reaplicacao + RLS (ROLLBACK), exit:',r.status);if(r.status)console.log(r.stderr.slice(-2200));else console.log('Admin ativo permitido; admin inativo e anon bloqueados; dados preservados.');process.exitCode=r.status;
