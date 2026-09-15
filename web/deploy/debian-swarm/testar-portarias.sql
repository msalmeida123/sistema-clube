SAVEPOINT teste_portarias;
DO $test$
DECLARE admin_id uuid; operador_id uuid; piscina uuid; regras jsonb;
BEGIN
 SELECT id INTO piscina FROM public.paginas_sistema WHERE codigo='portaria_piscina' AND ativo;
 IF piscina IS NULL THEN RAISE EXCEPTION 'Pagina da piscina nao encontrada'; END IF;
 INSERT INTO public.usuarios(nome,is_admin,ativo) VALUES ('Teste transacional permissoes admin',true,true) RETURNING id INTO admin_id;
 INSERT INTO public.usuarios(nome,is_admin,ativo,permissoes) VALUES ('Teste transacional piscina',false,true,ARRAY['portaria']) RETURNING id INTO operador_id;
 PERFORM set_config('request.jwt.claim.sub',operador_id::text,true);
 IF public.sistema_pode('portaria_piscina') OR public.sistema_pode('portaria_academia') THEN RAISE EXCEPTION 'Portaria legada ainda libera outras portarias'; END IF;
 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 regras=jsonb_build_array(jsonb_build_object('pagina_id',piscina,'pode_visualizar',true,'pode_criar',false,'pode_editar',false,'pode_excluir',false));
 PERFORM public.sistema_salvar_permissoes('usuario',operador_id,regras);
 PERFORM set_config('request.jwt.claim.sub',operador_id::text,true);
 IF NOT public.sistema_pode('portaria_piscina') OR public.sistema_pode('portaria_academia') OR public.sistema_pode('portaria') OR public.sistema_pode('portaria_sauna') OR public.sistema_pode('portaria_piscina','criar') THEN RAISE EXCEPTION 'Isolamento da piscina falhou'; END IF;
 BEGIN
  PERFORM public.sistema_salvar_permissoes('usuario',operador_id,'[]');
  RAISE EXCEPTION 'Operador conseguiu modificar permissoes';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
 PERFORM set_config('request.jwt.claim.sub',admin_id::text,true);
 PERFORM public.sistema_salvar_permissoes('usuario',operador_id,'[]');
 PERFORM set_config('request.jwt.claim.sub',operador_id::text,true);
 IF public.sistema_pode('portaria') OR public.sistema_pode('portaria_piscina') THEN RAISE EXCEPTION 'Desmarcar tudo restaurou permissoes antigas'; END IF;
 RAISE NOTICE 'Testes de isolamento, autorizacao e remocao de permissoes passaram.';
END $test$;
ROLLBACK TO SAVEPOINT teste_portarias;
RELEASE SAVEPOINT teste_portarias;
