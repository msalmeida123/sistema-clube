-- Aplicar em transacao. Nao altera selecoes explicitas existentes.
DO $migration$
DECLARE original text; atualizado text;
BEGIN
 original := pg_get_functiondef('public.sistema_pode(text,text)'::regprocedure);
 atualizado := replace(original, 'WHEN codigo IN (''portaria_academia'',''portaria_piscina'',''academia'') THEN ''portaria'' ', '');
 IF atualizado = original AND position('''portaria_academia'',''portaria_piscina'',''academia''' in original)>0 THEN
  RAISE EXCEPTION 'Definicao inesperada de sistema_pode. Revisar antes de aplicar.';
 END IF;
 IF atualizado <> original THEN EXECUTE atualizado; END IF;
END $migration$;

CREATE OR REPLACE FUNCTION public.sistema_salvar_permissoes(p_tipo text,p_alvo uuid,p_regras jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $fn$
DECLARE n integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM usuarios WHERE (auth_id=auth.uid() OR (auth_id IS NULL AND id=auth.uid())) AND ativo IS TRUE AND is_admin IS TRUE) THEN
  RAISE EXCEPTION 'Somente administradores ativos podem alterar permissoes' USING ERRCODE='42501';
 END IF;
 IF p_tipo IS NULL OR p_tipo NOT IN ('usuario','perfil') OR p_alvo IS NULL OR p_regras IS NULL OR jsonb_typeof(p_regras)<>'array' THEN RAISE EXCEPTION 'Parametros invalidos'; END IF;
 IF jsonb_array_length(p_regras)>500 THEN RAISE EXCEPTION 'Quantidade de paginas invalida'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_regras) j WHERE jsonb_typeof(j)<>'object' OR NOT(j ? 'pagina_id') OR jsonb_typeof(j->'pagina_id')<>'string') THEN RAISE EXCEPTION 'Pagina invalida'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_regras) j CROSS JOIN unnest(ARRAY['pode_visualizar','pode_criar','pode_editar','pode_excluir']) k WHERE NOT(j ? k) OR jsonb_typeof(j->k)<>'boolean') THEN RAISE EXCEPTION 'Permissoes invalidas'; END IF;
 SELECT count(DISTINCT (j->>'pagina_id')::uuid) INTO n FROM jsonb_array_elements(p_regras) j;
 IF n<>jsonb_array_length(p_regras) THEN RAISE EXCEPTION 'Paginas repetidas'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_regras) j WHERE NOT EXISTS(SELECT 1 FROM paginas_sistema p WHERE p.id=(j->>'pagina_id')::uuid AND p.ativo)) THEN RAISE EXCEPTION 'Pagina inexistente ou inativa'; END IF;
 -- Persistir tambem recusas explicitas: nenhuma marcacao nao pode restaurar permissao legada.
 IF p_tipo='usuario' THEN
  PERFORM 1 FROM usuarios WHERE id=p_alvo FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Usuario nao encontrado'; END IF;
  DELETE FROM permissoes_usuario WHERE usuario_id=p_alvo;
  INSERT INTO permissoes_usuario(usuario_id,pagina_id,pode_visualizar,pode_criar,pode_editar,pode_excluir)
  SELECT p_alvo,p.id,coalesce(r.pode_visualizar,false),coalesce(r.pode_visualizar AND r.pode_criar,false),coalesce(r.pode_visualizar AND r.pode_editar,false),coalesce(r.pode_visualizar AND r.pode_excluir,false)
  FROM paginas_sistema p LEFT JOIN jsonb_to_recordset(p_regras) r(pagina_id uuid,pode_visualizar boolean,pode_criar boolean,pode_editar boolean,pode_excluir boolean) ON r.pagina_id=p.id WHERE p.ativo;
 ELSE
  PERFORM 1 FROM perfis_acesso WHERE id=p_alvo FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfil nao encontrado'; END IF;
  DELETE FROM permissoes_perfil WHERE perfil_id=p_alvo;
  INSERT INTO permissoes_perfil(perfil_id,pagina_id,pode_visualizar,pode_criar,pode_editar,pode_excluir)
  SELECT p_alvo,p.id,coalesce(r.pode_visualizar,false),coalesce(r.pode_visualizar AND r.pode_criar,false),coalesce(r.pode_visualizar AND r.pode_editar,false),coalesce(r.pode_visualizar AND r.pode_excluir,false)
  FROM paginas_sistema p LEFT JOIN jsonb_to_recordset(p_regras) r(pagina_id uuid,pode_visualizar boolean,pode_criar boolean,pode_editar boolean,pode_excluir boolean) ON r.pagina_id=p.id WHERE p.ativo;
 END IF;
END $fn$;
REVOKE ALL ON FUNCTION public.sistema_salvar_permissoes(text,uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sistema_salvar_permissoes(text,uuid,jsonb) TO authenticated;
NOTIFY pgrst, 'reload schema';
