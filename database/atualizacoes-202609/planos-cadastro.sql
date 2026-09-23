BEGIN;
LOCK TABLE public.configuracao_clube IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE public.planos
 ADD COLUMN IF NOT EXISTS valor_titulo numeric NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS valor_mensalidade_dependente numeric NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS max_dependentes integer NOT NULL DEFAULT 5,
 ADD COLUMN IF NOT EXISTS permite_piscina boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS permite_academia boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS permite_quadras boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS permite_salao_festas boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS permite_restaurante boolean NOT NULL DEFAULT true,
 ADD COLUMN IF NOT EXISTS dia_vencimento integer NOT NULL DEFAULT 10,
 ADD COLUMN IF NOT EXISTS multa_atraso numeric NOT NULL DEFAULT 2,
 ADD COLUMN IF NOT EXISTS juros_dia numeric NOT NULL DEFAULT 0.033,
 ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS cor text NOT NULL DEFAULT '#3B82F6',
 ADD COLUMN IF NOT EXISTS updated_at timestamptz,
 ADD COLUMN IF NOT EXISTS clube_id uuid REFERENCES public.configuracao_clube(id);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.planos WHERE clube_id IS NULL) THEN
  IF (SELECT count(*) FROM public.configuracao_clube)<>1 THEN
   RAISE EXCEPTION 'Vincular planos existentes ao clube antes de prosseguir';
  END IF;
  UPDATE public.planos SET clube_id=(SELECT id FROM public.configuracao_clube) WHERE clube_id IS NULL;
 END IF;
END $$;
ALTER TABLE public.planos ALTER COLUMN clube_id SET DEFAULT public.tema_clube_atual();
CREATE INDEX IF NOT EXISTS planos_clube_idx ON public.planos(clube_id);
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS planos_isolamento_clube ON public.planos;
CREATE POLICY planos_isolamento_clube ON public.planos AS RESTRICTIVE FOR ALL TO authenticated
 USING(clube_id=public.tema_clube_atual()) WITH CHECK(clube_id=public.tema_clube_atual());
DROP TRIGGER IF EXISTS planos_proteger_clube ON public.planos;
CREATE TRIGGER planos_proteger_clube BEFORE INSERT OR UPDATE ON public.planos
 FOR EACH ROW EXECUTE FUNCTION public.tema_proteger_vinculo();
NOTIFY pgrst, 'reload schema';
COMMIT;
