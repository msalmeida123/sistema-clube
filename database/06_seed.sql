-- =====================================================
-- SEED: Dados Iniciais
-- =====================================================

-- Inserir usuário ADMIN padrão
INSERT INTO usuarios (id, email, senha_hash, nome, role, ativo)
VALUES (
  uuid_generate_v4(),
  'admin@clube.com',
  crypt('admin123', gen_salt('bf')),
  'Administrador do Sistema',
  'admin',
  true
);

-- Configuração inicial do clube (exemplo)
INSERT INTO config_clube (
  nome,
  cnpj,
  endereco,
  numero,
  bairro,
  cidade,
  estado,
  cep,
  telefone,
  email
) VALUES (
  'Clube Exemplo',
  '00.000.000/0001-00',
  'Rua Exemplo',
  '123',
  'Centro',
  'Cidade',
  'SP',
  '00000-000',
  '(00) 0000-0000',
  'contato@clube.com'
);

-- Templates de mensagem WhatsApp
INSERT INTO templates_mensagem (nome, categoria, conteudo) VALUES
('Boas-vindas', 'geral', 'Olá {nome}! Seja bem-vindo(a) ao nosso clube! 🎉'),
('Lembrete Mensalidade', 'cobranca', 'Olá {nome}, sua mensalidade vence em {dias} dias. Valor: R$ {valor}'),
('Mensalidade Vencida', 'cobranca', 'Olá {nome}, sua mensalidade está em atraso. Regularize para continuar acessando o clube.'),
('Exame Médico', 'aviso', 'Olá {nome}, seu exame médico vence em {dias} dias. Renove para continuar usando a piscina.'),
('Aniversário', 'geral', 'Parabéns {nome}! 🎂 O Clube deseja um feliz aniversário!'),
('Confirmação Pagamento', 'cobranca', 'Olá {nome}, confirmamos o recebimento do seu pagamento. Obrigado!'),
('Convite Disponível', 'geral', 'Olá {nome}, seus 2 convites do mês já estão disponíveis!');

-- =====================================================
-- CRON JOBS (Supabase pg_cron)
-- =====================================================

-- Gerar convites mensais (dia 1 de cada mês às 00:00)
-- SELECT cron.schedule('gerar-convites-mensais', '0 0 1 * *', 'SELECT gerar_convites_mensais()');

-- Verificar dependentes maiores de 21 (diariamente às 01:00)
-- SELECT cron.schedule('verificar-dependentes', '0 1 * * *', 
--   'UPDATE dependentes SET ativo = false WHERE EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) >= 21 AND NOT COALESCE(cursando_faculdade, false)'
-- );
