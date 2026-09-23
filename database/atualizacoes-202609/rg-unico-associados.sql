-- Executar com --single-transaction e ON_ERROR_STOP.
LOCK TABLE public.associados IN SHARE ROW EXCLUSIVE MODE;
DO $$ BEGIN
 IF EXISTS(SELECT upper(regexp_replace(coalesce(rg,''),'[^0-9A-Za-z]','','g'))
 FROM public.associados
 WHERE upper(regexp_replace(coalesce(rg,''),'[^0-9A-Za-z]','','g'))<>''
 GROUP BY upper(regexp_replace(coalesce(rg,''),'[^0-9A-Za-z]','','g')) HAVING count(*)>1)
 THEN RAISE EXCEPTION 'Existem RGs repetidos. Confira o diagnóstico. Nenhum cadastro foi alterado.';END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS associados_rg_unico
 ON public.associados ((upper(regexp_replace(coalesce(rg,''),'[^0-9A-Za-z]','','g'))))
 WHERE upper(regexp_replace(coalesce(rg,''),'[^0-9A-Za-z]','','g'))<>'';
NOTIFY pgrst,'reload schema';
