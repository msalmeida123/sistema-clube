-- Teste transacional: não mantém clientes nem pagamentos no banco.
BEGIN;
DO $$
DECLARE p uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); f timestamptz; n integer;
BEGIN
 INSERT INTO gestao_planos(id,nome,valor_centavos,dias) VALUES(p,'Teste depósito',9900,30);
 INSERT INTO gestao_clientes(id,nome,email,documento,dominio,plano_id,chave_hash,ambiente,instalacao_centavos)
 VALUES(c,'Teste depósito','teste@example.com','12345678909',c::text||'.example.com',p,encode(sha256(c::text::bytea),'hex'),'sandbox',50000);
 INSERT INTO gestao_cobrancas(id,cliente_id,tipo,forma,plano_nome,valor_centavos,dias,ambiente,status)
 VALUES(b,c,'instalacao','DEPOSITO','Teste',50000,30,'sandbox','PENDING');
 -- Tentativas rejeitadas devem deixar situação, período e auditoria intactos.
 BEGIN
  PERFORM gestao_registrar_deposito(b,'sandbox',a,'confirmar',49999,current_date,'teste-valor');
  RAISE EXCEPTION 'teste_falhou_valor' USING ERRCODE='ZX001';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
 BEGIN
  PERFORM gestao_registrar_deposito(b,'production',a,'confirmar',50000,current_date,'teste-ambiente');
  RAISE EXCEPTION 'teste_falhou_ambiente' USING ERRCODE='ZX001';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
 UPDATE gestao_cobrancas SET forma='PIX' WHERE id=b;
 BEGIN
  PERFORM gestao_registrar_deposito(b,'sandbox',a,'confirmar',50000,current_date,'teste-forma');
  RAISE EXCEPTION 'teste_falhou_forma' USING ERRCODE='ZX001';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
 UPDATE gestao_cobrancas SET forma='DEPOSITO' WHERE id=b;
 IF EXISTS(SELECT 1 FROM gestao_depositos WHERE cobranca_id=b) OR EXISTS(SELECT 1 FROM gestao_cobrancas WHERE id=b AND inicio IS NOT NULL) THEN RAISE EXCEPTION 'tentativa_rejeitada_alterou_dados'; END IF;
 PERFORM gestao_registrar_deposito(b,'sandbox',a,'confirmar',50000,(now() AT TIME ZONE 'America/Sao_Paulo')::date,'teste-extrato');
 SELECT fim INTO f FROM gestao_cobrancas WHERE id=b AND status='RECEIVED' AND fim-inicio=interval '30 days';
 IF f IS NULL THEN RAISE EXCEPTION 'sem_liberacao_30_dias'; END IF;
 PERFORM gestao_registrar_deposito(b,'sandbox',a,'confirmar',50000,(now() AT TIME ZONE 'America/Sao_Paulo')::date,'teste-extrato');
 IF (SELECT fim FROM gestao_cobrancas WHERE id=b)<>f THEN RAISE EXCEPTION 'dias_duplicados'; END IF;
 SELECT count(*) INTO n FROM gestao_depositos WHERE cobranca_id=b;
 IF n<>1 THEN RAISE EXCEPTION 'auditoria_duplicada'; END IF;
 PERFORM gestao_registrar_deposito(b,'sandbox',a,'estornar',50000,NULL,'Correção de lançamento');
 IF (SELECT status FROM gestao_cobrancas WHERE id=b)<>'REFUNDED' THEN RAISE EXCEPTION 'estorno_nao_revogou'; END IF;
 IF has_function_privilege('authenticated','public.gestao_registrar_deposito(uuid,text,uuid,text,integer,date,text)','EXECUTE') THEN RAISE EXCEPTION 'rpc_exposta'; END IF;
 IF has_table_privilege('authenticated','public.gestao_depositos','SELECT') THEN RAISE EXCEPTION 'historico_exposto'; END IF;
 RAISE NOTICE 'PASS: forma, valor, ambiente, 30 dias, idempotência, auditoria, estorno e permissões.';
END $$;
ROLLBACK;
