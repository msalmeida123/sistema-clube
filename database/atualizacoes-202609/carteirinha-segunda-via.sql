BEGIN;
CREATE OR REPLACE FUNCTION public.renovar_qr_associado(p_associado uuid,p_qr_anterior text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE clube uuid; atual text; novo text;
BEGIN
 clube:=public.tema_clube_atual();
 IF auth.uid() IS NULL OR clube IS NULL OR NOT public.sistema_pode('associados','editar') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 SELECT qr_code INTO atual FROM public.associados WHERE id=p_associado AND clube_id=clube FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Associado indisponível'; END IF;
 IF coalesce(atual,'')<>coalesce(p_qr_anterior,'') THEN RAISE EXCEPTION 'Carteirinha alterada. Atualize a página.'; END IF;
 novo:='SOCIO-'||gen_random_uuid()::text;
 UPDATE public.associados SET qr_code=novo WHERE id=p_associado AND clube_id=clube;
 RETURN novo;
END $$;
REVOKE ALL ON FUNCTION public.renovar_qr_associado(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.renovar_qr_associado(uuid,text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
