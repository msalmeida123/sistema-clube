-- Seed ficticio local. IDs fixos; reaplicacao nao sobrescreve testes existentes.
BEGIN;
SET LOCAL TIME ZONE 'America/Sao_Paulo';
DO $$ BEGIN IF to_regprocedure('public.clube_admin_local()') IS NULL THEN RAISE EXCEPTION 'Banco local esperado nao encontrado'; END IF; END $$;
INSERT INTO planos(id,nome,codigo,valor_mensal,descricao) VALUES
('10000000-0000-4000-8000-000000000001','TESTE - Plano individual','TESTE-INDIVIDUAL',100,'Dados ficticios para testes locais') ON CONFLICT DO NOTHING;
INSERT INTO associados(id,numero_titulo,nome,cpf,status,qr_code,categoria,plano,valor_mensalidade,email,observacoes) VALUES
('10000000-0000-4000-8000-000000000011','990001','TESTE - Ana Em Dia', '11111111111','ativo','SOCIO-TESTE-990001','individual','individual',100,'ana@example.invalid','SEED LOCAL - FICTICIO'),
('10000000-0000-4000-8000-000000000012','990002','TESTE - Bruno Em Atraso', '22222222222','ativo','SOCIO-TESTE-990002','individual','individual',100,'bruno@example.invalid','SEED LOCAL - FICTICIO'),
('10000000-0000-4000-8000-000000000013','990003','TESTE - Carla Inativa', '33333333333','inativo','SOCIO-TESTE-990003','individual','individual',100,'carla@example.invalid','SEED LOCAL - FICTICIO') ON CONFLICT DO NOTHING;
INSERT INTO dependentes(id,associado_id,nome,parentesco,status,qr_code) VALUES
('10000000-0000-4000-8000-000000000021','10000000-0000-4000-8000-000000000011','TESTE - Dependente Ana','filho','ativo','DEP-TESTE-990001') ON CONFLICT DO NOTHING;
INSERT INTO mensalidades(id,associado_id,mes_referencia,referencia,valor,data_vencimento,data_pagamento,status,valor_pago,observacoes) VALUES
('10000000-0000-4000-8000-000000000031','10000000-0000-4000-8000-000000000011',to_char(current_date,'YYYY-MM'),to_char(current_date,'YYYY-MM'),100,current_date,current_date,'pago',100,'SEED LOCAL - FICTICIO'),
('10000000-0000-4000-8000-000000000032','10000000-0000-4000-8000-000000000012',to_char(current_date-interval '1 month','YYYY-MM'),to_char(current_date-interval '1 month','YYYY-MM'),100,current_date-15,NULL,'atrasado',0,'SEED LOCAL - FICTICIO') ON CONFLICT DO NOTHING;
INSERT INTO quiosques(id,numero,nome,capacidade,valor_reserva,valor_diaria,ativo) VALUES
('10000000-0000-4000-8000-000000000041',9901,'TESTE - Quiosque Jardim',20,80,80,true) ON CONFLICT DO NOTHING;
INSERT INTO bar_categorias(id,nome,descricao) VALUES
('10000000-0000-4000-8000-000000000051','TESTE - Bebidas','SEED LOCAL - FICTICIO') ON CONFLICT DO NOTHING;
INSERT INTO bar_produtos(id,categoria_id,nome,preco,preco_custo,estoque_atual,controla_estoque,ativo) VALUES
('10000000-0000-4000-8000-000000000061','10000000-0000-4000-8000-000000000051','TESTE - Agua',5,2,100,true,true),
('10000000-0000-4000-8000-000000000062','10000000-0000-4000-8000-000000000051','TESTE - Suco',8,3,50,true,true) ON CONFLICT DO NOTHING;
INSERT INTO carteirinha_saldo(id,associado_id,saldo) VALUES
('10000000-0000-4000-8000-000000000071','10000000-0000-4000-8000-000000000011',50) ON CONFLICT DO NOTHING;
INSERT INTO carteirinha_movimentos(id,associado_id,tipo,valor,saldo_anterior,saldo_posterior,descricao) VALUES
('10000000-0000-4000-8000-000000000072','10000000-0000-4000-8000-000000000011','credito',50,0,50,'SEED LOCAL - saldo ficticio inicial') ON CONFLICT DO NOTHING;
INSERT INTO fornecedores(id,nome,email) VALUES
('10000000-0000-4000-8000-000000000081','TESTE - Fornecedor Demonstracao','fornecedor@example.invalid') ON CONFLICT DO NOTHING;
INSERT INTO funcionarios(id,nome,cpf,cargo,departamento,data_admissao,salario,email) VALUES
('10000000-0000-4000-8000-000000000091','TESTE - Funcionario Demonstracao','00000000000','Atendente','Portaria',current_date-30,2000,'funcionario@example.invalid') ON CONFLICT DO NOTHING;
COMMIT;
