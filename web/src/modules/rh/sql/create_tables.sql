-- ============================================
-- MÓDULO RH - Tabelas para Supabase
-- Sistema Clube - Recursos Humanos
-- ============================================

-- 1. FUNCIONÁRIOS
CREATE TABLE IF NOT EXISTS funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  rg TEXT,
  data_nascimento DATE,
  sexo TEXT CHECK (sexo IN ('M', 'F')),
  estado_civil TEXT,
  email TEXT,
  telefone TEXT,
  celular TEXT,
  foto_url TEXT,

  -- Endereço
  cep TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,

  -- Dados profissionais
  cargo TEXT NOT NULL,
  departamento TEXT NOT NULL,
  tipo_contrato TEXT NOT NULL DEFAULT 'clt' CHECK (tipo_contrato IN ('clt', 'pj', 'estagiario', 'temporario', 'freelancer')),
  data_admissao DATE NOT NULL,
  data_demissao DATE,
  salario DECIMAL(10,2) NOT NULL DEFAULT 0,
  turno TEXT NOT NULL DEFAULT 'integral' CHECK (turno IN ('manha', 'tarde', 'noite', 'integral', 'escala')),
  carga_horaria_semanal INTEGER NOT NULL DEFAULT 44,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias', 'afastado', 'desligado')),

  -- Dados bancários
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo_conta TEXT CHECK (tipo_conta IN ('corrente', 'poupanca', 'pix')),
  chave_pix TEXT,

  -- Documentos trabalhistas
  ctps_numero TEXT,
  ctps_serie TEXT,
  pis TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_funcionarios_status ON funcionarios(status);
CREATE INDEX IF NOT EXISTS idx_funcionarios_departamento ON funcionarios(departamento);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON funcionarios(cpf);

-- 2. PONTO DIÁRIO
CREATE TABLE IF NOT EXISTS ponto_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  entrada TEXT,
  saida_almoco TEXT,
  retorno_almoco TEXT,
  saida TEXT,
  horas_trabalhadas DECIMAL(5,2) DEFAULT 0,
  horas_extras DECIMAL(5,2) DEFAULT 0,
  atraso_minutos INTEGER DEFAULT 0,
  falta BOOLEAN DEFAULT FALSE,
  justificativa TEXT,
  abonado BOOLEAN DEFAULT FALSE,
  registrado_por UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(funcionario_id, data)
);

CREATE INDEX IF NOT EXISTS idx_ponto_funcionario ON ponto_diario(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_ponto_data ON ponto_diario(data);

-- 3. FOLHA DE PAGAMENTO
CREATE TABLE IF NOT EXISTS folha_pagamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  referencia TEXT NOT NULL,
  salario_base DECIMAL(10,2) NOT NULL DEFAULT 0,
  horas_extras_valor DECIMAL(10,2) DEFAULT 0,
  adicional_noturno DECIMAL(10,2) DEFAULT 0,
  adicional_insalubridade DECIMAL(10,2) DEFAULT 0,
  adicional_periculosidade DECIMAL(10,2) DEFAULT 0,
  gratificacao DECIMAL(10,2) DEFAULT 0,
  comissao DECIMAL(10,2) DEFAULT 0,
  outros_proventos DECIMAL(10,2) DEFAULT 0,
  total_proventos DECIMAL(10,2) NOT NULL DEFAULT 0,
  inss DECIMAL(10,2) DEFAULT 0,
  irrf DECIMAL(10,2) DEFAULT 0,
  vale_transporte DECIMAL(10,2) DEFAULT 0,
  vale_refeicao DECIMAL(10,2) DEFAULT 0,
  faltas_desconto DECIMAL(10,2) DEFAULT 0,
  atrasos_desconto DECIMAL(10,2) DEFAULT 0,
  adiantamento DECIMAL(10,2) DEFAULT 0,
  outros_descontos DECIMAL(10,2) DEFAULT 0,
  total_descontos DECIMAL(10,2) NOT NULL DEFAULT 0,
  salario_liquido DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'calculada', 'aprovada', 'paga', 'cancelada')),
  data_pagamento DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_folha_funcionario ON folha_pagamento(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_folha_referencia ON folha_pagamento(referencia);
CREATE INDEX IF NOT EXISTS idx_folha_status ON folha_pagamento(status);

-- 4. AFASTAMENTOS
CREATE TABLE IF NOT EXISTS afastamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('ferias', 'licenca_medica', 'licenca_maternidade', 'licenca_paternidade', 'afastamento_inss', 'falta_justificada', 'falta_injustificada', 'folga', 'outro')),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_totais INTEGER NOT NULL,
  motivo TEXT,
  documento_url TEXT,
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'aprovado', 'em_andamento', 'concluido', 'rejeitado', 'cancelado')),
  aprovado_por TEXT,
  data_aprovacao DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_afastamento_funcionario ON afastamentos(funcionario_id);
CREATE INDEX IF NOT EXISTS idx_afastamento_tipo ON afastamentos(tipo);
CREATE INDEX IF NOT EXISTS idx_afastamento_status ON afastamentos(status);

-- RLS
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ponto_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE folha_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE afastamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total funcionarios" ON funcionarios FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total ponto_diario" ON ponto_diario FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total folha_pagamento" ON folha_pagamento FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso total afastamentos" ON afastamentos FOR ALL USING (auth.role() = 'authenticated');
