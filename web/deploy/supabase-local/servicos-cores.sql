BEGIN;
CREATE TABLE IF NOT EXISTS public.servicos_cores (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 a_fazer text NOT NULL DEFAULT '#64748b' CHECK(a_fazer ~ '^#[0-9a-fA-F]{6}$'),
 em_andamento text NOT NULL DEFAULT '#2563eb' CHECK(em_andamento ~ '^#[0-9a-fA-F]{6}$'),
 concluido text NOT NULL DEFAULT '#059669' CHECK(concluido ~ '^#[0-9a-fA-F]{6}$'),
 urgente text NOT NULL DEFAULT '#dc2626' CHECK(urgente ~ '^#[0-9a-fA-F]{6}$')
);
INSERT INTO public.servicos_cores(id) VALUES(true) ON CONFLICT DO NOTHING;
ALTER TABLE public.servicos_cores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.servicos_cores FROM anon,authenticated;
GRANT SELECT,UPDATE ON public.servicos_cores TO authenticated;
GRANT ALL ON public.servicos_cores TO service_role;
DROP POLICY IF EXISTS servicos_cores_ler ON public.servicos_cores;
CREATE POLICY servicos_cores_ler ON public.servicos_cores FOR SELECT TO authenticated USING(public.clube_servicos_permitido());
DROP POLICY IF EXISTS servicos_cores_configurar ON public.servicos_cores;
CREATE POLICY servicos_cores_configurar ON public.servicos_cores FOR UPDATE TO authenticated USING(public.clube_admin_local()) WITH CHECK(public.clube_admin_local());
NOTIFY pgrst,'reload schema';
COMMIT;
