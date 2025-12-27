-- =====================================================
-- SEED - DADOS INICIAIS
-- =====================================================

-- Categorias Financeiras
INSERT INTO categorias_financeiras (nome, tipo) VALUES
  ('Mensalidade Clube', 'receita'),
  ('Mensalidade Academia', 'receita'),
  ('Taxa de Inscrição', 'receita'),
  ('Eventos', 'receita'),
  ('Aluguel de Espaços', 'receita'),
  ('Doações', 'receita'),
  ('Outros Receitas', 'receita'),
  ('Salários', 'despesa'),
  ('Energia Elétrica', 'despesa'),
  ('Água', 'despesa'),
  ('Internet/Telefone', 'despesa'),
  ('Manutenção Piscina', 'despesa'),
  ('Manutenção Geral', 'despesa'),
  ('Material de Limpeza', 'despesa'),
  ('Material de Escritório', 'despesa'),
  ('Produtos Químicos', 'despesa'),
  ('Equipamentos', 'despesa'),
  ('Seguros', 'despesa'),
  ('Impostos', 'despesa'),
  ('Serviços Terceirizados', 'despesa'),
  ('Outras Despesas', 'despesa');

-- Tags WhatsApp
INSERT INTO whatsapp_tags (nome, cor) VALUES
  ('Urgente', '#dc3545'),
  ('Financeiro', '#28a745'),
  ('Reclamação', '#ffc107'),
  ('Informação', '#17a2b8'),
  ('Resolvido', '#6c757d');

-- Templates WhatsApp
INSERT INTO whatsapp_templates (nome, categoria, conteudo, variaveis) VALUES
  ('Lembrete Vencimento', 'cobranca', 
   'Olá {{nome}}! Sua mensalidade vence em {{dias}} dias. Valor: R$ {{valor}}. Evite juros, pague em dia! 🎯',
   ARRAY['nome', 'dias', 'valor']),
  
  ('Mensalidade Atrasada', 'cobranca',
   'Olá {{nome}}, identificamos uma mensalidade em atraso ({{mes_ref}}). Valor atualizado: R$ {{valor}}. Regularize sua situação para continuar aproveitando o clube! 📋',
   ARRAY['nome', 'mes_ref', 'valor']),
  
  ('Pagamento Confirmado', 'cobranca',
   'Pagamento confirmado! ✅ Olá {{nome}}, recebemos seu pagamento de R$ {{valor}} ref. {{mes_ref}}. Obrigado!',
   ARRAY['nome', 'valor', 'mes_ref']),
  
  ('Exame Médico Vencendo', 'aviso',
   'Olá {{nome}}! Seu exame médico vence em {{dias}} dias. Renove para continuar usando a piscina. 🏊',
   ARRAY['nome', 'dias']),
  
  ('Aniversário', 'aniversario',
   'Feliz aniversário, {{nome}}! 🎂🎉 O Clube deseja um dia maravilhoso! Venha comemorar conosco!',
   ARRAY['nome']),
  
  ('Boas Vindas', 'geral',
   'Bem-vindo ao Clube, {{nome}}! 🎉 Seu título nº {{titulo}} já está ativo. Qualquer dúvida, estamos à disposição!',
   ARRAY['nome', 'titulo']);

-- Automações WhatsApp
INSERT INTO whatsapp_automacoes (nome, tipo, dias_antecedencia, ativo) VALUES
  ('Lembrete 3 dias antes vencimento', 'vencimento', 3, true),
  ('Lembrete 1 dia antes vencimento', 'vencimento', 1, true),
  ('Lembrete exame médico 7 dias', 'exame_medico', 7, true),
  ('Aniversário do associado', 'aniversario', 0, true);

-- Planos e Valores (exemplo)
INSERT INTO planos_valores (tipo, valor_mensal, taxa_dependente_extra, vigencia_inicio) VALUES
  ('individual', 150.00, 0, '2024-01-01'),
  ('familiar', 250.00, 50.00, '2024-01-01'),
  ('patrimonial', 400.00, 0, '2024-01-01');

-- Academia
INSERT INTO academia_config (valor_mensal, vigencia_inicio) VALUES
  (80.00, '2024-01-01');

