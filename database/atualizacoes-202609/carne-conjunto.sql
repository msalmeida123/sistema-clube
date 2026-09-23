BEGIN;
ALTER TABLE public.carnes
 ADD COLUMN IF NOT EXISTS plano_id uuid REFERENCES public.planos(id),
 ADD COLUMN IF NOT EXISTS valor_titulo numeric(12,2),
 ADD COLUMN IF NOT EXISTS valor_mensalidade numeric(12,2),
 ADD COLUMN IF NOT EXISTS requisicao_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS carnes_requisicao_clube ON public.carnes(clube_id,requisicao_id) WHERE requisicao_id IS NOT NULL;
ALTER TABLE public.parcelas_carne
 ADD COLUMN IF NOT EXISTS valor_pago numeric(12,2),
 ADD COLUMN IF NOT EXISTS valor_titulo numeric(12,2),
 ADD COLUMN IF NOT EXISTS valor_mensalidade numeric(12,2);
DROP POLICY IF EXISTS parcelas_isolamento_clube ON public.parcelas_carne;
CREATE POLICY parcelas_isolamento_clube ON public.parcelas_carne AS RESTRICTIVE FOR ALL TO authenticated
 USING(EXISTS(SELECT 1 FROM public.carnes c WHERE c.id=carne_id AND c.clube_id=public.tema_clube_atual()))
 WITH CHECK(EXISTS(SELECT 1 FROM public.carnes c WHERE c.id=carne_id AND c.clube_id=public.tema_clube_atual()));
CREATE OR REPLACE FUNCTION public.gerar_carne_conjunto(
 p_associado uuid,p_plano uuid,p_quantidade integer,p_vencimento date,p_pagamento text,p_requisicao uuid
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE clube uuid; plano public.planos%ROWTYPE; socio public.associados%ROWTYPE;
 carne uuid; titulo_cent bigint; mensal_cent bigint; parcela_cent bigint; i integer; base date; venc date;
BEGIN
 clube:=public.tema_clube_atual();
 IF auth.uid() IS NULL OR clube IS NULL OR NOT public.sistema_pode('carnes','criar') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF p_requisicao IS NULL OR p_quantidade IS NULL OR p_quantidade NOT BETWEEN 1 AND 60 OR p_vencimento IS NULL OR p_pagamento IS NULL OR p_pagamento NOT IN ('boleto','pix','dinheiro','cartao_credito','cartao_debito','cartao','debito_automatico') THEN RAISE EXCEPTION 'Dados inválidos'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(clube::text||p_requisicao::text,0));
 SELECT id INTO carne FROM public.carnes WHERE clube_id=clube AND requisicao_id=p_requisicao;
 IF FOUND THEN RETURN carne; END IF;
 SELECT * INTO socio FROM public.associados WHERE id=p_associado AND clube_id=clube AND status='ativo' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Associado indisponível'; END IF;
 SELECT * INTO plano FROM public.planos WHERE id=p_plano AND clube_id=clube AND ativo IS TRUE FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Plano indisponível'; END IF;
 IF plano.valor_titulo IS NULL OR plano.valor_mensal IS NULL OR plano.valor_titulo<0 OR plano.valor_mensal<0 THEN RAISE EXCEPTION 'Valores inválidos'; END IF;
 titulo_cent:=round(plano.valor_titulo*100); mensal_cent:=round(plano.valor_mensal*100);
 IF titulo_cent+mensal_cent*p_quantidade<=0 THEN RAISE EXCEPTION 'Configure os valores do plano'; END IF;
 INSERT INTO public.carnes(associado_id,tipo,categoria,descricao,valor_total,quantidade_parcelas,data_primeiro_vencimento,forma_pagamento,status,ano,valor_parcela,clube_id,plano_id,valor_titulo,valor_mensalidade,requisicao_id)
 VALUES(p_associado,'titulo_mensalidade',socio.plano::text,'Título + mensalidades — '||left(plano.nome,150),(titulo_cent+mensal_cent*p_quantidade)/100.0,p_quantidade,p_vencimento,p_pagamento,'ativo',extract(year from p_vencimento), (mensal_cent+titulo_cent/p_quantidade+CASE WHEN titulo_cent%p_quantidade>0 THEN 1 ELSE 0 END)/100.0,clube,p_plano,titulo_cent/100.0,mensal_cent/100.0,p_requisicao)
 RETURNING id INTO carne;
 FOR i IN 1..p_quantidade LOOP
  parcela_cent:=titulo_cent/p_quantidade+CASE WHEN i<=titulo_cent%p_quantidade THEN 1 ELSE 0 END;
  base:=(date_trunc('month',p_vencimento)+(i-1)*interval '1 month')::date;
  venc:=base+(least(extract(day from p_vencimento)::int,extract(day from (base+interval '1 month - 1 day'))::int)-1);
  INSERT INTO public.parcelas_carne(carne_id,numero_parcela,valor,data_vencimento,status,forma_pagamento,valor_titulo,valor_mensalidade)
  VALUES(carne,i,(parcela_cent+mensal_cent)/100.0,venc,'pendente',p_pagamento,parcela_cent/100.0,mensal_cent/100.0);
 END LOOP;
 RETURN carne;
END $$;
REVOKE ALL ON FUNCTION public.gerar_carne_conjunto(uuid,uuid,integer,date,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.gerar_carne_conjunto(uuid,uuid,integer,date,text,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
