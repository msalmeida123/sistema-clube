BEGIN;
ALTER TABLE public.folha_pagamento ADD COLUMN IF NOT EXISTS detalhes_holerite jsonb;
CREATE OR REPLACE FUNCTION public.rh_salvar_holerite(p_id uuid,p_versao timestamptz,p_detalhes jsonb,p_observacao text) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE atual folha_pagamento;item jsonb;chave text;v numeric;pro numeric;des numeric;
BEGIN
 IF NOT public.clube_admin_local() THEN RAISE EXCEPTION 'Somente administradores podem editar a folha';END IF;
 SELECT * INTO atual FROM folha_pagamento WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Folha não encontrada';END IF;
 IF atual.status NOT IN ('rascunho','calculada') THEN RAISE EXCEPTION 'Apenas folhas em rascunho ou calculadas podem ser editadas';END IF;
 IF atual.updated_at IS DISTINCT FROM p_versao THEN RAISE EXCEPTION 'Folha alterada por outra pessoa. Reabra os detalhes.';END IF;
 IF p_detalhes IS NULL OR jsonb_typeof(p_detalhes)<>'object' OR octet_length(p_detalhes::text)>100000 THEN RAISE EXCEPTION 'Detalhes inválidos';END IF;
 IF jsonb_typeof(p_detalhes->'rubricas') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Rubricas inválidas';END IF;
 IF jsonb_array_length(p_detalhes->'rubricas') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Informe entre 1 e 100 rubricas';END IF;
 FOREACH chave IN ARRAY ARRAY['codigo_funcionario','sede','admissao','conta'] LOOP
  IF jsonb_typeof(p_detalhes->chave) IS DISTINCT FROM 'string' OR length(p_detalhes->>chave)>160 THEN RAISE EXCEPTION 'Identificação inválida';END IF;
 END LOOP;
 IF p_detalhes->>'admissao'<>'' THEN
  IF (p_detalhes->>'admissao')!~'^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'Data inválida';END IF;
  PERFORM (p_detalhes->>'admissao')::date;
 END IF;
 FOREACH chave IN ARRAY ARRAY['dependentes','base_inss','base_irrf','base_fgts','salario_contratual'] LOOP
  IF NOT(p_detalhes?chave) OR jsonb_typeof(p_detalhes->chave) NOT IN ('number','null') THEN RAISE EXCEPTION 'Base inválida';END IF;
  v:=(p_detalhes->>chave)::numeric;
  IF v<0 OR v>99999999.99 OR v<>round(v,2) OR (chave='dependentes' AND (v<>trunc(v) OR v>99)) THEN RAISE EXCEPTION 'Base ou dependentes inválidos';END IF;
 END LOOP;
 FOR item IN SELECT value FROM jsonb_array_elements(p_detalhes->'rubricas') LOOP
  IF jsonb_typeof(item)<>'object' OR coalesce(item->>'campo','') NOT IN ('salario_base','horas_extras_valor','adicional_noturno','adicional_insalubridade','adicional_periculosidade','gratificacao','comissao','outros_proventos','inss','irrf','vale_transporte','vale_refeicao','faltas_desconto','atrasos_desconto','adiantamento','outros_descontos') THEN RAISE EXCEPTION 'Rubrica inválida';END IF;
  FOREACH chave IN ARRAY ARRAY['codigo','descricao','referencia'] LOOP
   IF jsonb_typeof(item->chave) IS DISTINCT FROM 'string' OR length(item->>chave)>160 THEN RAISE EXCEPTION 'Texto da rubrica inválido';END IF;
  END LOOP;
  IF length(trim(item->>'codigo')) NOT BETWEEN 1 AND 20 OR length(trim(item->>'descricao'))=0 OR length(item->>'referencia')>40 THEN RAISE EXCEPTION 'Preencha código e descrição de cada rubrica';END IF;
  IF jsonb_typeof(item->'valor') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Valor inválido';END IF;
  v:=(item->>'valor')::numeric;
  IF v<0 OR v>99999999.99 OR v<>round(v,2) THEN RAISE EXCEPTION 'Use valores positivos com até duas casas decimais';END IF;
 END LOOP;
 IF p_observacao IS NULL OR length(p_observacao)>2000 THEN RAISE EXCEPTION 'Observação inválida';END IF;
 SELECT coalesce(sum((value->>'valor')::numeric) FILTER(WHERE value->>'campo' IN ('salario_base','horas_extras_valor','adicional_noturno','adicional_insalubridade','adicional_periculosidade','gratificacao','comissao','outros_proventos')),0),coalesce(sum((value->>'valor')::numeric) FILTER(WHERE value->>'campo' IN ('inss','irrf','vale_transporte','vale_refeicao','faltas_desconto','atrasos_desconto','adiantamento','outros_descontos')),0) INTO pro,des FROM jsonb_array_elements(p_detalhes->'rubricas');
 UPDATE folha_pagamento SET detalhes_holerite=p_detalhes,observacao=p_observacao,
 salario_base=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='salario_base'),0),
 horas_extras_valor=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='horas_extras_valor'),0),
 adicional_noturno=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='adicional_noturno'),0),
 adicional_insalubridade=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='adicional_insalubridade'),0),
 adicional_periculosidade=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='adicional_periculosidade'),0),
 gratificacao=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='gratificacao'),0),
 comissao=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='comissao'),0),
 outros_proventos=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='outros_proventos'),0),
 inss=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='inss'),0),
 irrf=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='irrf'),0),
 vale_transporte=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='vale_transporte'),0),
 vale_refeicao=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='vale_refeicao'),0),
 faltas_desconto=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='faltas_desconto'),0),
 atrasos_desconto=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='atrasos_desconto'),0),
 adiantamento=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='adiantamento'),0),
 outros_descontos=coalesce((SELECT sum((value->>'valor')::numeric) FROM jsonb_array_elements(p_detalhes->'rubricas') WHERE value->>'campo'='outros_descontos'),0),
 total_proventos=pro,total_descontos=des,salario_liquido=pro-des,updated_at=clock_timestamp() WHERE id=p_id;
END $$;
REVOKE ALL ON FUNCTION public.rh_salvar_holerite(uuid,timestamptz,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.rh_salvar_holerite(uuid,timestamptz,jsonb,text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
