BEGIN;
CREATE TABLE IF NOT EXISTS public.dashboard_config (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 paineis text[] NOT NULL DEFAULT ARRAY['associados','dependentes','acessos','quiosques','armarios','mensalidades','inadimplencia','financeiro','conversas','alertas','setores','metricas'],
 CONSTRAINT dashboard_paineis_validos CHECK(paineis <@ ARRAY['associados','dependentes','acessos','quiosques','armarios','mensalidades','inadimplencia','financeiro','conversas','alertas','setores','metricas']::text[])
);
INSERT INTO public.dashboard_config(id) VALUES(true) ON CONFLICT DO NOTHING;
ALTER TABLE public.dashboard_config ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dashboard_config FROM anon,authenticated;
GRANT SELECT,UPDATE ON public.dashboard_config TO authenticated;
GRANT ALL ON public.dashboard_config TO service_role;
DROP POLICY IF EXISTS dashboard_ler ON public.dashboard_config;
CREATE POLICY dashboard_ler ON public.dashboard_config FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.usuarios u WHERE (u.auth_id=auth.uid() OR (u.auth_id IS NULL AND u.id=auth.uid())) AND u.ativo=true));
DROP POLICY IF EXISTS dashboard_configurar ON public.dashboard_config;
CREATE POLICY dashboard_configurar ON public.dashboard_config FOR UPDATE TO authenticated USING(public.clube_admin_local()) WITH CHECK(public.clube_admin_local());
COMMIT;
