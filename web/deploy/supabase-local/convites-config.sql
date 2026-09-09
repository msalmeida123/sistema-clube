BEGIN;
CREATE TABLE IF NOT EXISTS public.config_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valor_convite numeric(10,2) NOT NULL DEFAULT 30 CHECK (valor_convite >= 0),
  limite_convites_mes integer NOT NULL DEFAULT 2 CHECK (limite_convites_mes > 0),
  intervalo_dias_convidado integer NOT NULL DEFAULT 90 CHECK (intervalo_dias_convidado >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.config_convites(valor_convite,limite_convites_mes,intervalo_dias_convidado)
SELECT 30,2,90 WHERE NOT EXISTS (SELECT 1 FROM public.config_convites);
ALTER TABLE public.config_convites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS admin_local ON public.config_convites;
CREATE POLICY admin_local ON public.config_convites TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local());
REVOKE ALL ON public.config_convites FROM anon;
GRANT SELECT,UPDATE ON public.config_convites TO authenticated;
GRANT ALL ON public.config_convites TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
