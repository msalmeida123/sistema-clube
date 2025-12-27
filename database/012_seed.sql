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
     'Olá {nome}! 👋\n\nSua mensalidade do clube vence em {dias} dias (dia {vencimento}).\nValor: R$ {valor}\n\nEvite juros, pague em dia! 😊',
     ARRAY['nome', 'dias', 'vencimento', 'valor']),
    
    ('Confirmação Pagamento', 'cobranca',
     'Olá {nome}! ✅\n\nConfirmamos o recebimento do seu pagamento:\nValor: R$ {valor}\nReferência: {referencia}\n\nObrigado!',
     ARRAY['nome', 'valor', 'referencia']),
    
    ('Lembrete Exame Médico', 'saude',
     'Olá {nome}! 🏊\n\nSeu exame médico vence em {dias} dias.\nLembre-se: sem exame válido, não é possível usar as piscinas.\n\nAtualize seu exame na secretaria.',
     ARRAY['nome', 'dias']),
    
    ('Aniversário', 'relacionamento',
     'Olá {nome}! 🎂🎉\n\nO Clube deseja um Feliz Aniversário!\nQue seu dia seja repleto de alegrias!\n\nAbraços da equipe.',
     ARRAY['nome']),
    
    ('Boas Vindas', 'relacionamento',
     'Olá {nome}! 👋\n\nSeja bem-vindo(a) ao nosso clube!\nSua carteirinha já está disponível na secretaria.\n\nQualquer dúvida, estamos à disposição.',
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

