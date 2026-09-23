-- Vínculo explícito de propriedade para tabelas usadas por relatórios legados.
-- Não apaga registros nem altera valores de negócio. A base atual contém um clube.
BEGIN;
LOCK TABLE public.configuracao_clube IN SHARE ROW EXCLUSIVE MODE;
DO $$
DECLARE t text; clube uuid; sem_vinculo boolean; filtro text;
BEGIN
 SELECT min(id::text)::uuid INTO clube FROM public.configuracao_clube HAVING count(*)=1;
 FOREACH t IN ARRAY ARRAY['funcionarios','compras','bar_pedidos','bar_config_nfce','dependentes','mensalidades','carnes','convites','acessos_academia','acessos_piscina','multas_sauna','reservas_quiosque','registros_acesso','uso_armarios_sauna','exames_medicos','infracoes','folha_pagamento'] LOOP
  EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS clube_id uuid REFERENCES public.configuracao_clube(id)',t);
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE clube_id IS NULL)',t) INTO sem_vinculo;
  IF sem_vinculo AND clube IS NULL THEN RAISE EXCEPTION 'Defina o vínculo dos registros legados com seus clubes antes da migração'; END IF;
  -- Backfill só de metadados: não revalida documentos antigos nem dispara notificações.
  IF clube IS NOT NULL THEN
   PERFORM set_config('session_replication_role','replica',true);
   EXECUTE format('UPDATE public.%I SET clube_id=$1 WHERE clube_id IS NULL',t) USING clube;
   PERFORM set_config('session_replication_role','origin',true);
  END IF;
  EXECUTE format('ALTER TABLE public.%I ALTER COLUMN clube_id SET DEFAULT public.tema_clube_atual()',t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(clube_id)',t||'_impressao_clube_idx',t);
  EXECUTE format('DROP TRIGGER IF EXISTS impressao_vinculo ON public.%I',t);
  -- Reutiliza a proteção existente: sessão no frontend, ator auditado no backend.
  EXECUTE format('CREATE TRIGGER impressao_vinculo BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.tema_proteger_vinculo()',t);
  EXECUTE format('DROP POLICY IF EXISTS impressao_tenant ON public.%I',t);
  filtro:='clube_id=public.tema_clube_atual()';
  -- Gerações SQL automáticas sem sessão continuam vinculadas ao titular.
  IF t=ANY(ARRAY['dependentes','mensalidades','carnes','convites','acessos_academia','acessos_piscina','multas_sauna','reservas_quiosque','registros_acesso','uso_armarios_sauna','exames_medicos','infracoes']) THEN
   filtro:=filtro||' OR (clube_id IS NULL AND EXISTS(SELECT 1 FROM public.associados a WHERE a.id=associado_id AND a.clube_id=public.tema_clube_atual()))';
  ELSIF t='folha_pagamento' THEN
   filtro:=filtro||' OR (clube_id IS NULL AND EXISTS(SELECT 1 FROM public.funcionarios f WHERE f.id=funcionario_id AND f.clube_id=public.tema_clube_atual()))';
  END IF;
  EXECUTE format('CREATE POLICY impressao_tenant ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (%s)',t,filtro);
 END LOOP;
END $$;
-- RLS continua exigindo as permissões preexistentes de módulo.
GRANT SELECT ON public.acessos_piscina, public.acessos_academia TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
