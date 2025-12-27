-- ==============================================
-- SISTEMA CLUBE - Script de Criação do Banco
-- ==============================================
-- Execute este script no Supabase SQL Editor
-- Versão: 1.0.0
-- Data: Dezembro 2024
-- ==============================================

-- ============================================
-- EXTENSÕES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELAS PRINCIPAIS
-- ============================================

-- Usuários do sistema (funcionários)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(200),
  email VARCHAR(200) UNIQUE,
  telefone VARCHAR(20),
  setor VARCHAR(50) DEFAULT 'atendimento',
  cargo VARCHAR(100),
  is_admin BOOLEAN DEFAULT false,
  perfil_acesso_id UUID,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Associados (membros do clube)
CREATE TABLE IF NOT EXISTS associados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_titulo VARCHAR(20) UNIQUE,
  nome VARCHAR(200) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  rg VARCHAR(20),
  data_nascimento DATE,
  sexo VARCHAR(20),
  estado_civil VARCHAR(30),
  profissao VARCHAR(100),
  email VARCHAR(200),
  telefone VARCHAR(20),
  celular VARCHAR(20),
  cep VARCHAR(10),
  endereco VARCHAR(200),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  uf VARCHAR(2),
  categoria VARCHAR(50) DEFAULT 'individual', -- individual, familiar, patrimonial
  tipo_socio VARCHAR(50) DEFAULT 'titular', -- titular, dependente
  status VARCHAR(20) DEFAULT 'ativo', -- ativo, inativo, suspenso, inadimplente
  data_admissao DATE DEFAULT CURRENT_DATE,
  data_desligamento DATE,
  foto_url TEXT,
  qr_code VARCHAR(50) UNIQUE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dependentes
CREATE TABLE IF NOT EXISTS dependentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  cpf VARCHAR(14),
  rg VARCHAR(20),
  data_nascimento DATE,
  sexo VARCHAR(20),
  parentesco VARCHAR(50),
  telefone VARCHAR(20),
  email VARCHAR(200),
  foto_url TEXT,
  qr_code VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SISTEMA FINANCEIRO
-- ============================================

-- Configuração de valores
CREATE TABLE IF NOT EXISTS config_valores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(100) UNIQUE NOT NULL,
  valor DECIMAL(10,2) DEFAULT 0,
  descricao VARCHAR(200),
  parcelas_max INTEGER DEFAULT 12,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mensalidades
CREATE TABLE IF NOT EXISTS mensalidades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  mes_referencia VARCHAR(7) NOT NULL, -- YYYY-MM
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(20) DEFAULT 'pendente', -- pendente, pago, atrasado, cancelado
  forma_pagamento VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(associado_id, mes_referencia)
);

-- Carnês
CREATE TABLE IF NOT EXISTS carnes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL, -- mensalidade, titulo, joia
  categoria VARCHAR(50) NOT NULL, -- individual, familiar, patrimonial
  descricao VARCHAR(200),
  valor_total DECIMAL(10,2) NOT NULL,
  quantidade_parcelas INTEGER NOT NULL,
  data_primeiro_vencimento DATE NOT NULL,
  forma_pagamento VARCHAR(50),
  status VARCHAR(20) DEFAULT 'ativo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parcelas do carnê
CREATE TABLE IF NOT EXISTS parcelas_carne (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  carne_id UUID NOT NULL REFERENCES carnes(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(20) DEFAULT 'pendente',
  forma_pagamento VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contas a pagar
CREATE TABLE IF NOT EXISTS contas_pagar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao VARCHAR(200) NOT NULL,
  fornecedor VARCHAR(200),
  categoria VARCHAR(50) DEFAULT 'geral',
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  status VARCHAR(20) DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compras
CREATE TABLE IF NOT EXISTS compras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao VARCHAR(200) NOT NULL,
  fornecedor VARCHAR(200),
  valor_total DECIMAL(10,2) NOT NULL,
  data_compra DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTROLE DE ACESSO (PORTARIAS)
-- ============================================

-- Registros de acesso
CREATE TABLE IF NOT EXISTS registros_acesso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  associado_id UUID REFERENCES associados(id),
  dependente_id UUID REFERENCES dependentes(id),
  convite_id UUID,
  portaria VARCHAR(50) NOT NULL, -- clube, academia, piscina
  tipo VARCHAR(20) NOT NULL, -- entrada, saida
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metodo VARCHAR(50), -- qrcode, manual, biometria
  observacoes TEXT,
  usuario_id UUID REFERENCES usuarios(id)
);

-- Pagamentos na portaria
CREATE TABLE IF NOT EXISTS pagamentos_portaria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  associado_id UUID REFERENCES associados(id),
  mensalidade_id UUID REFERENCES mensalidades(id),
  valor DECIMAL(10,2) NOT NULL,
  forma_pagamento VARCHAR(20), -- pix, credito, debito
  pix_qrcode TEXT,
  pix_codigo_copia_cola TEXT,
  pix_txid VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pendente',
  data_pagamento TIMESTAMP WITH TIME ZONE,
  comprovante TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuração PIX
CREATE TABLE IF NOT EXISTS config_pix (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chave_pix VARCHAR(100),
  tipo_chave VARCHAR(20), -- cpf, cnpj, email, telefone, aleatoria
  nome_beneficiario VARCHAR(100),
  cidade VARCHAR(50),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONVITES
-- ============================================

CREATE TABLE IF NOT EXISTS convites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  nome_convidado VARCHAR(200) NOT NULL,
  cpf_convidado VARCHAR(14),
  telefone_convidado VARCHAR(20),
  data_visita DATE NOT NULL,
  qr_code VARCHAR(50) UNIQUE,
  status VARCHAR(20) DEFAULT 'ativo', -- ativo, utilizado, cancelado, expirado
  data_utilizacao TIMESTAMP WITH TIME ZONE,
  valor_pago DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- QUIOSQUES
-- ============================================

CREATE TABLE IF NOT EXISTS quiosques (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER UNIQUE NOT NULL,
  nome VARCHAR(100),
  descricao TEXT,
  capacidade INTEGER DEFAULT 20,
  possui_churrasqueira BOOLEAN DEFAULT true,
  possui_banheiro BOOLEAN DEFAULT false,
  possui_pia BOOLEAN DEFAULT true,
  valor_reserva DECIMAL(10,2) DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reservas de quiosques
CREATE TABLE IF NOT EXISTS reservas_quiosque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiosque_id UUID NOT NULL REFERENCES quiosques(id) ON DELETE CASCADE,
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  data_reserva DATE NOT NULL,
  data_reserva_feita TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  hora_limite TIME DEFAULT '09:00:00',
  status VARCHAR(20) DEFAULT 'ativo', -- ativo, expirado, cancelado, utilizado
  valor_pago DECIMAL(10,2) DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quiosque_id, data_reserva)
);

-- Configuração de quiosques
CREATE TABLE IF NOT EXISTS config_quiosque (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dia_abertura_reservas INTEGER DEFAULT 5, -- 5 = sexta-feira
  hora_abertura_reservas TIME DEFAULT '08:00:00',
  hora_limite_reserva TIME DEFAULT '09:00:00',
  dias_antecedencia_max INTEGER DEFAULT 7,
  valor_padrao_reserva DECIMAL(10,2) DEFAULT 50.00,
  permite_multiplas_reservas BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EXAMES MÉDICOS
-- ============================================

CREATE TABLE IF NOT EXISTS exames_medicos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  associado_id UUID REFERENCES associados(id) ON DELETE CASCADE,
  dependente_id UUID REFERENCES dependentes(id) ON DELETE CASCADE,
  tipo_exame VARCHAR(50) NOT NULL, -- admissional, periodico, natacao
  data_exame DATE NOT NULL,
  data_validade DATE,
  resultado VARCHAR(20) DEFAULT 'pendente', -- apto, inapto, pendente
  medico VARCHAR(200),
  crm VARCHAR(20),
  observacoes TEXT,
  arquivo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INFRAÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS infracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  associado_id UUID REFERENCES associados(id) ON DELETE CASCADE,
  dependente_id UUID REFERENCES dependentes(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  descricao TEXT NOT NULL,
  data_ocorrencia DATE NOT NULL,
  local VARCHAR(100),
  testemunhas TEXT,
  penalidade VARCHAR(100),
  data_inicio_penalidade DATE,
  data_fim_penalidade DATE,
  status VARCHAR(20) DEFAULT 'ativo', -- ativo, cumprido, cancelado
  observacoes TEXT,
  registrado_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ELEIÇÕES
-- ============================================

CREATE TABLE IF NOT EXISTS eleicoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'agendada', -- agendada, em_andamento, encerrada, cancelada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidatos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  eleicao_id UUID NOT NULL REFERENCES eleicoes(id) ON DELETE CASCADE,
  associado_id UUID NOT NULL REFERENCES associados(id),
  cargo VARCHAR(100) NOT NULL,
  numero INTEGER,
  proposta TEXT,
  foto_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  eleicao_id UUID NOT NULL REFERENCES eleicoes(id) ON DELETE CASCADE,
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  associado_id UUID NOT NULL REFERENCES associados(id),
  data_voto TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(eleicao_id, associado_id)
);

-- ============================================
-- WHATSAPP / CRM
-- ============================================

CREATE TABLE IF NOT EXISTS whatsapp_sessao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  status VARCHAR(20) DEFAULT 'disconnected',
  qrcode TEXT,
  numero VARCHAR(20),
  nome VARCHAR(100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_contatos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(200),
  associado_id UUID REFERENCES associados(id),
  foto_url TEXT,
  ultimo_contato TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_mensagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contato_id UUID REFERENCES whatsapp_contatos(id),
  numero VARCHAR(20) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'text', -- text, image, audio, document
  direcao VARCHAR(10) NOT NULL, -- entrada, saida
  status VARCHAR(20) DEFAULT 'enviada',
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_respostas_automaticas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gatilho VARCHAR(200) NOT NULL,
  resposta TEXT NOT NULL,
  tipo_match VARCHAR(20) DEFAULT 'contains', -- exact, contains, startswith
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  conteudo TEXT NOT NULL,
  variaveis TEXT[], -- {nome}, {titulo}, {valor}
  categoria VARCHAR(50),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS whatsapp_campanhas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  mensagem TEXT NOT NULL,
  filtro_status VARCHAR(50),
  filtro_categoria VARCHAR(50),
  total_contatos INTEGER DEFAULT 0,
  enviados INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, agendada, enviando, concluida
  data_envio TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SISTEMA DE PERMISSÕES
-- ============================================

-- Páginas do sistema
CREATE TABLE IF NOT EXISTS paginas_sistema (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(100) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descricao VARCHAR(200),
  icone VARCHAR(50),
  rota VARCHAR(200) NOT NULL,
  pagina_pai_id UUID REFERENCES paginas_sistema(id),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Perfis de acesso
CREATE TABLE IF NOT EXISTS perfis_acesso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) UNIQUE NOT NULL,
  descricao VARCHAR(200),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissões do perfil
CREATE TABLE IF NOT EXISTS permissoes_perfil (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  perfil_id UUID NOT NULL REFERENCES perfis_acesso(id) ON DELETE CASCADE,
  pagina_id UUID NOT NULL REFERENCES paginas_sistema(id) ON DELETE CASCADE,
  pode_visualizar BOOLEAN DEFAULT false,
  pode_criar BOOLEAN DEFAULT false,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  UNIQUE(perfil_id, pagina_id)
);

-- Permissões individuais do usuário
CREATE TABLE IF NOT EXISTS permissoes_usuario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  pagina_id UUID NOT NULL REFERENCES paginas_sistema(id) ON DELETE CASCADE,
  pode_visualizar BOOLEAN DEFAULT false,
  pode_criar BOOLEAN DEFAULT false,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(usuario_id, pagina_id)
);

-- Adicionar foreign key do perfil no usuário
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuarios_perfil 
FOREIGN KEY (perfil_acesso_id) REFERENCES perfis_acesso(id)
ON DELETE SET NULL;

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_associados_status ON associados(status);
CREATE INDEX IF NOT EXISTS idx_associados_categoria ON associados(categoria);
CREATE INDEX IF NOT EXISTS idx_associados_qrcode ON associados(qr_code);
CREATE INDEX IF NOT EXISTS idx_dependentes_associado ON dependentes(associado_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_associado ON mensalidades(associado_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_status ON mensalidades(status);
CREATE INDEX IF NOT EXISTS idx_parcelas_carne ON parcelas_carne(carne_id);
CREATE INDEX IF NOT EXISTS idx_registros_acesso_data ON registros_acesso(data_hora);
CREATE INDEX IF NOT EXISTS idx_convites_data ON convites(data_visita);
CREATE INDEX IF NOT EXISTS idx_reservas_quiosque_data ON reservas_quiosque(data_reserva);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_contato ON whatsapp_mensagens(contato_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_usuario ON permissoes_usuario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permissoes_perfil ON permissoes_perfil(perfil_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE associados ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensalidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE carnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas_carne ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos_portaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiosques ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas_quiosque ENABLE ROW LEVEL SECURITY;
ALTER TABLE exames_medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE infracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eleicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessao ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_respostas_automaticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE paginas_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis_acesso ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes_perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_valores ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_quiosque ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (usuários autenticados)
CREATE POLICY "Acesso usuarios" ON usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso associados" ON associados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso dependentes" ON dependentes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso mensalidades" ON mensalidades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso carnes" ON carnes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso parcelas_carne" ON parcelas_carne FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso contas_pagar" ON contas_pagar FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso compras" ON compras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso registros_acesso" ON registros_acesso FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso pagamentos_portaria" ON pagamentos_portaria FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso convites" ON convites FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso quiosques" ON quiosques FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso reservas_quiosque" ON reservas_quiosque FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso exames_medicos" ON exames_medicos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso infracoes" ON infracoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso eleicoes" ON eleicoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso candidatos" ON candidatos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso votos" ON votos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso whatsapp_sessao" ON whatsapp_sessao FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso whatsapp_contatos" ON whatsapp_contatos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso whatsapp_mensagens" ON whatsapp_mensagens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso whatsapp_respostas" ON whatsapp_respostas_automaticas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso whatsapp_templates" ON whatsapp_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso whatsapp_campanhas" ON whatsapp_campanhas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso paginas_sistema" ON paginas_sistema FOR ALL TO authenticated USING (true);
CREATE POLICY "Acesso perfis_acesso" ON perfis_acesso FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso permissoes_perfil" ON permissoes_perfil FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso permissoes_usuario" ON permissoes_usuario FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso config_valores" ON config_valores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso config_pix" ON config_pix FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso config_quiosque" ON config_quiosque FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Valores por categoria
INSERT INTO config_valores (tipo, valor, descricao, parcelas_max) VALUES
('mensalidade_individual', 120.00, 'Mensalidade Individual', 12),
('mensalidade_familiar', 200.00, 'Mensalidade Familiar', 12),
('mensalidade_patrimonial', 180.00, 'Mensalidade Patrimonial', 12),
('titulo_individual', 3000.00, 'Título Individual', 12),
('titulo_familiar', 8000.00, 'Título Familiar', 18),
('titulo_patrimonial', 15000.00, 'Título Patrimonial', 24),
('joia_individual', 500.00, 'Joia Individual', 3),
('joia_familiar', 1000.00, 'Joia Familiar', 6),
('joia_patrimonial', 2000.00, 'Joia Patrimonial', 12),
('taxa_transferencia', 500.00, 'Taxa de Transferência', 1),
('convite', 30.00, 'Valor do Convite', 1)
ON CONFLICT (tipo) DO UPDATE SET valor = EXCLUDED.valor, descricao = EXCLUDED.descricao;

-- Configuração de quiosques
INSERT INTO config_quiosque (dia_abertura_reservas, hora_abertura_reservas, hora_limite_reserva, dias_antecedencia_max, valor_padrao_reserva)
VALUES (5, '08:00:00', '09:00:00', 7, 50.00)
ON CONFLICT DO NOTHING;

-- Configuração PIX
INSERT INTO config_pix (chave_pix, tipo_chave, nome_beneficiario, cidade, ativo)
VALUES ('12345678000190', 'cnpj', 'CLUBE SOCIAL', 'SAO PAULO', true)
ON CONFLICT DO NOTHING;

-- Quiosques de exemplo
INSERT INTO quiosques (numero, nome, descricao, capacidade, possui_churrasqueira, possui_banheiro, possui_pia) VALUES
(1, 'Quiosque 1', 'Próximo à piscina', 20, true, false, true),
(2, 'Quiosque 2', 'Área central', 25, true, true, true),
(3, 'Quiosque 3', 'Próximo ao campo', 30, true, false, true),
(4, 'Quiosque 4', 'Área arborizada', 20, true, false, true),
(5, 'Quiosque 5', 'Próximo ao parquinho', 25, true, true, true)
ON CONFLICT (numero) DO NOTHING;

-- Perfis de acesso
INSERT INTO perfis_acesso (nome, descricao) VALUES
('Administrador', 'Acesso total ao sistema'),
('Presidente', 'Acesso gerencial completo'),
('Financeiro', 'Acesso ao módulo financeiro'),
('Secretaria', 'Atendimento e cadastros'),
('Portaria', 'Controle de acesso'),
('Atendimento', 'Atendimento básico')
ON CONFLICT (nome) DO NOTHING;

-- Páginas do sistema
INSERT INTO paginas_sistema (codigo, nome, descricao, icone, rota, ordem) VALUES
('dashboard', 'Dashboard', 'Painel principal', 'LayoutDashboard', '/dashboard', 1),
('associados', 'Associados', 'Gestão de associados', 'Users', '/dashboard/associados', 2),
('dependentes', 'Dependentes', 'Gestão de dependentes', 'UserPlus', '/dashboard/dependentes', 3),
('planos', 'Planos/Categorias', 'Gestão de planos', 'BadgeDollarSign', '/dashboard/planos', 4),
('academia', 'Academia', 'Controle academia', 'Dumbbell', '/dashboard/academia', 5),
('portaria_academia', 'Portaria Academia', 'Acesso academia', 'ScanLine', '/dashboard/academia-portaria', 6),
('portaria_piscina', 'Portaria Piscina', 'Acesso piscina', 'Waves', '/dashboard/piscina-portaria', 7),
('convites', 'Convites', 'Gestão de convites', 'Ticket', '/dashboard/convites', 8),
('quiosques', 'Quiosques', 'Reserva de quiosques', 'Tent', '/dashboard/quiosques', 9),
('exames', 'Exames Médicos', 'Gestão de exames', 'Stethoscope', '/dashboard/exames-medicos', 10),
('infracoes', 'Infrações', 'Gestão de infrações', 'AlertTriangle', '/dashboard/infracoes', 11),
('financeiro', 'Financeiro', 'Gestão financeira', 'Wallet', '/dashboard/financeiro', 12),
('carnes', 'Carnês', 'Geração de carnês', 'Receipt', '/dashboard/carnes', 13),
('compras', 'Compras', 'Gestão de compras', 'ShoppingCart', '/dashboard/compras', 14),
('portaria', 'Portaria Clube', 'Controle de acesso', 'DoorOpen', '/dashboard/portaria', 15),
('whatsapp', 'CRM WhatsApp', 'CRM e atendimento', 'MessageSquare', '/dashboard/crm', 16),
('whatsapp_conexao', 'Conexão WhatsApp', 'Configurar WhatsApp', 'Smartphone', '/dashboard/whatsapp', 17),
('whatsapp_respostas', 'Respostas Automáticas', 'Respostas do bot', 'Bot', '/dashboard/respostas-automaticas', 18),
('whatsapp_bot', 'Bot IA (GPT)', 'Configurar IA', 'Sparkles', '/dashboard/bot-ia', 19),
('eleicoes', 'Eleições', 'Sistema de eleições', 'Vote', '/dashboard/eleicoes', 20),
('relatorios', 'Relatórios', 'Relatórios gerais', 'FileText', '/dashboard/relatorios', 21),
('usuarios', 'Usuários', 'Gestão de usuários', 'Users', '/dashboard/usuarios', 22),
('permissoes', 'Permissões', 'Gestão de permissões', 'Shield', '/dashboard/permissoes', 23),
('configuracoes', 'Configurações', 'Configurações do sistema', 'Settings', '/dashboard/configuracoes', 24)
ON CONFLICT (codigo) DO UPDATE SET nome = EXCLUDED.nome, rota = EXCLUDED.rota, ordem = EXCLUDED.ordem;

-- Permissões do perfil Administrador (acesso total)
INSERT INTO permissoes_perfil (perfil_id, pagina_id, pode_visualizar, pode_criar, pode_editar, pode_excluir)
SELECT 
  (SELECT id FROM perfis_acesso WHERE nome = 'Administrador'),
  id, true, true, true, true
FROM paginas_sistema
ON CONFLICT (perfil_id, pagina_id) DO UPDATE SET
  pode_visualizar = true, pode_criar = true, pode_editar = true, pode_excluir = true;

-- Sessão WhatsApp
INSERT INTO whatsapp_sessao (status) VALUES ('disconnected') ON CONFLICT DO NOTHING;

-- ============================================
-- FUNÇÃO PARA CRIAR USUÁRIO ADMIN
-- ============================================
-- Execute após criar o primeiro usuário no Auth:
-- UPDATE usuarios SET is_admin = true WHERE id = 'SEU-USER-ID';

-- ============================================
-- FIM DO SCRIPT
-- ============================================
