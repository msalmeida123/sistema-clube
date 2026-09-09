BEGIN;
CREATE TABLE IF NOT EXISTS public.rh_configuracao(
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 nome text NOT NULL DEFAULT 'Control iD iDClass 373',
 ip text NOT NULL DEFAULT '',
 porta integer NOT NULL DEFAULT 443 CHECK(porta BETWEEN 1 AND 65535),
 protocolo text NOT NULL DEFAULT 'https' CHECK(protocolo IN ('http','https')),
 usuario text NOT NULL DEFAULT '',
 senha text NOT NULL DEFAULT '',
 certificado_local boolean NOT NULL DEFAULT false,
 empresa_nome text NOT NULL DEFAULT '',
 empresa_documento text NOT NULL DEFAULT ''
);
INSERT INTO public.rh_configuracao(id) VALUES(true) ON CONFLICT DO NOTHING;
ALTER TABLE public.rh_configuracao ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rh_configuracao FROM anon,authenticated;
GRANT ALL ON public.rh_configuracao TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
