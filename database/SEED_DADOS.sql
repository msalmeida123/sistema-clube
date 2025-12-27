-- =============================================
-- SEED - DADOS INICIAIS
-- =============================================

-- Inserir pontos de acesso padrão
INSERT INTO pontos_acesso (nome, tipo) VALUES
    ('Portaria Principal', 'clube'),
    ('Piscina Adulto', 'piscina'),
    ('Piscina Infantil', 'piscina'),
    ('Academia', 'academia');

-- Inserir categorias de despesa padrão
INSERT INTO categorias_despesa (nome, descricao) VALUES
    ('Manutenção', 'Manutenção predial e equipamentos'),
    ('Limpeza', 'Materiais e serviços de limpeza'),
    ('Energia', 'Conta de luz'),
    ('Água', 'Conta de água'),
    ('Internet/Telefone', 'Telecomunicações'),
    ('Pessoal', 'Salários e encargos'),
    ('Material de Escritório', 'Papelaria e escritório'),
    ('Eventos', 'Festas e eventos do clube'),
    ('Piscina', 'Produtos químicos e manutenção'),
    ('Academia', 'Equipamentos e manutenção'),
    ('Segurança', 'Vigilância e monitoramento'),
    ('Outros', 'Despesas diversas');

-- Inserir centros de custo padrão
INSERT INTO centros_custo (nome, descricao) VALUES
    ('Administração', 'Custos administrativos'),
    ('Piscina', 'Centro aquático'),
    ('Academia', 'Academia de ginástica'),
    ('Salão de Festas', 'Eventos e festas'),
    ('Quadras', 'Quadras esportivas'),
    ('Restaurante', 'Bar e restaurante'),
    ('Manutenção Geral', 'Manutenção predial');

-- Inserir templates de mensagem padrão
INSERT INTO templates_mensagem (nome, categoria, conteudo, variaveis) VALUES
    ('Lembrete Vencimento', 'cobranca', 
     'Olá {nome}! Sua mensalidade do clube vence em {dias} dias (dia {vencimento}). Valor: R$ {valor}. Evite juros, pague em dia!',
     ARRAY['nome', 'dias', 'vencimento', 'valor']),
    ('Confirmação Pagamento', 'cobranca',
     'Olá {nome}! Confirmamos o recebimento do seu pagamento: Valor: R$ {valor} - Referência: {referencia}. Obrigado!',
     ARRAY['nome', 'valor', 'referencia']),
    ('Lembrete Exame Médico', 'saude',
     'Olá {nome}! Seu exame médico vence em {dias} dias. Lembre-se: sem exame válido, não é possível usar as piscinas.',
     ARRAY['nome', 'dias']),
    ('Aniversário', 'relacionamento',
     'Olá {nome}! O Clube deseja um Feliz Aniversário! Que seu dia seja repleto de alegrias!',
     ARRAY['nome']),
    ('Boas Vindas', 'relacionamento',
     'Olá {nome}! Seja bem-vindo(a) ao nosso clube! Sua carteirinha já está disponível na secretaria.',
     ARRAY['nome']);

-- Inserir automações padrão
INSERT INTO automacoes_whatsapp (nome, tipo, dias_antes, hora_envio, ativo) VALUES
    ('Lembrete Mensalidade 3 dias', 'lembrete_vencimento', 3, '09:00', true),
    ('Lembrete Mensalidade 1 dia', 'lembrete_vencimento', 1, '09:00', true),
    ('Lembrete Exame Médico', 'lembrete_exame', 7, '10:00', true),
    ('Aniversariantes', 'aniversario', 0, '08:00', true);

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, tipo, descricao) VALUES
    ('clube_nome', 'Nome do Clube', 'texto', 'Nome do clube'),
    ('multa_atraso_percentual', '2', 'numero', 'Percentual de multa por atraso'),
    ('juros_atraso_percentual', '1', 'numero', 'Percentual de juros ao mês'),
    ('dias_tolerancia', '5', 'numero', 'Dias de tolerância após vencimento'),
    ('convites_patrimonial', '2', 'numero', 'Quantidade de convites para patrimonial'),
    ('validade_exame_meses', '3', 'numero', 'Validade do exame médico em meses'),
    ('idade_limite_dependente', '21', 'numero', 'Idade limite para dependentes'),
    ('mandato_anos', '2', 'numero', 'Duração do mandato em anos'),
    ('tempo_minimo_eleicao', '1', 'numero', 'Anos mínimos de título para votar/candidatar');

-- Inserir valores de planos padrão
INSERT INTO planos_valores (tipo, valor_mensal, taxa_agregado, valor_academia, vigencia_inicio) VALUES
    ('individual', 150.00, 0.00, 80.00, CURRENT_DATE),
    ('familiar', 250.00, 50.00, 80.00, CURRENT_DATE),
    ('patrimonial', 350.00, 0.00, 80.00, CURRENT_DATE);

-- Inserir config inicial do clube (placeholder)
INSERT INTO clube_config (nome, cnpj) VALUES
    ('Clube Social', '00.000.000/0001-00');
