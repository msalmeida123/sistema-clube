-- Adaptacao aditiva do ClickUp + RH para o Supabase local existente.
-- Fonte: https://app.clickup.com/t/868hkc6f7
-- Mantem tipos, dados e politicas existentes. Executar o arquivo inteiro.
BEGIN;
SET LOCAL search_path = public, extensions;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(901105059454);
DO $check$ BEGIN IF to_regprocedure('public.clube_admin_local()') IS NULL THEN RAISE EXCEPTION 'Banco local incorreto: helper clube_admin_local ausente'; END IF; END $check$;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tipo_plano') THEN CREATE TYPE tipo_plano AS ENUM ('individual', 'familiar', 'patrimonial'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tipo_residencia') THEN CREATE TYPE tipo_residencia AS ENUM ('casa', 'apartamento'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_associado') THEN CREATE TYPE status_associado AS ENUM ('ativo', 'inativo', 'suspenso', 'expulso'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_pagamento') THEN CREATE TYPE status_pagamento AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tipo_lancamento') THEN CREATE TYPE tipo_lancamento AS ENUM ('mensalidade', 'taxa', 'multa', 'desconto', 'outros'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='forma_pagamento') THEN CREATE TYPE forma_pagamento AS ENUM ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='setor_usuario') THEN CREATE TYPE setor_usuario AS ENUM ('admin', 'presidente', 'vice_presidente', 'diretoria', 'financeiro', 'secretaria', 'portaria_clube', 'portaria_piscina', 'portaria_academia', 'atendimento'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tipo_acesso') THEN CREATE TYPE tipo_acesso AS ENUM ('entrada', 'saida'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='local_acesso') THEN CREATE TYPE local_acesso AS ENUM ('clube', 'piscina', 'academia'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tipo_pessoa_acesso') THEN CREATE TYPE tipo_pessoa_acesso AS ENUM ('associado', 'dependente', 'convidado', 'funcionario'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tipo_pessoa_exame') THEN CREATE TYPE tipo_pessoa_exame AS ENUM ('associado', 'dependente'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_exame') THEN CREATE TYPE status_exame AS ENUM ('pendente', 'aprovado', 'reprovado', 'vencido'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='gravidade_infracao') THEN CREATE TYPE gravidade_infracao AS ENUM ('leve', 'media', 'grave', 'gravissima'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_infracao') THEN CREATE TYPE status_infracao AS ENUM ('registrada', 'em_analise', 'julgada', 'arquivada'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tipo_penalidade') THEN CREATE TYPE tipo_penalidade AS ENUM ('advertencia', 'suspensao', 'multa', 'expulsao'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='parentesco_tipo') THEN CREATE TYPE parentesco_tipo AS ENUM ('conjuge', 'filho', 'filha', 'pai', 'mae', 'outro'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_dependente') THEN CREATE TYPE status_dependente AS ENUM ('ativo', 'inativo'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_eleicao') THEN CREATE TYPE status_eleicao AS ENUM ('agendada', 'em_andamento', 'encerrada', 'cancelada'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_compra') THEN CREATE TYPE status_compra AS ENUM ('rascunho', 'pendente', 'aprovada', 'finalizada', 'cancelada'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_pagamento_compra') THEN CREATE TYPE status_pagamento_compra AS ENUM ('pendente', 'pago', 'parcial'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_contato') THEN CREATE TYPE status_contato AS ENUM ('novo', 'em_atendimento', 'aguardando', 'finalizado'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tipo_mensagem') THEN CREATE TYPE tipo_mensagem AS ENUM ('texto', 'imagem', 'documento', 'audio', 'video'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_mensagem') THEN CREATE TYPE status_mensagem AS ENUM ('pendente', 'enviada', 'entregue', 'lida', 'erro'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='direcao_mensagem') THEN CREATE TYPE direcao_mensagem AS ENUM ('entrada', 'saida'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tipo_gatilho') THEN CREATE TYPE tipo_gatilho AS ENUM ('exato', 'contem', 'regex'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_campanha') THEN CREATE TYPE status_campanha AS ENUM ('rascunho', 'agendada', 'enviando', 'concluida', 'cancelada'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_pedido_bar') THEN CREATE TYPE status_pedido_bar AS ENUM ('aberto', 'aguardando_pagamento', 'pago', 'cancelado'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='forma_pagamento_bar') THEN CREATE TYPE forma_pagamento_bar AS ENUM ('dinheiro', 'cartao_credito', 'cartao_debito', 'pix', 'carteirinha', 'cortesia'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tipo_movimento_carteirinha') THEN CREATE TYPE tipo_movimento_carteirinha AS ENUM ('credito', 'debito'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_nfce') THEN CREATE TYPE status_nfce AS ENUM ('pendente', 'autorizada', 'cancelada', 'rejeitada', 'contingencia'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_caixa') THEN CREATE TYPE status_caixa AS ENUM ('aberto', 'fechado'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='tipo_movimento_caixa') THEN CREATE TYPE tipo_movimento_caixa AS ENUM ('sangria', 'suprimento'); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='status_carne') THEN CREATE TYPE status_carne AS ENUM ('ativo', 'quitado', 'cancelado'); END IF; END $migration$;

ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS titulo_eleitor VARCHAR(20);

ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS estado VARCHAR(2);

ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS tipo_residencia tipo_residencia;

ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS plano tipo_plano NOT NULL DEFAULT 'individual';

ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS data_associacao DATE DEFAULT CURRENT_DATE;

ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS dia_vencimento INTEGER DEFAULT 10;

ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS valor_mensalidade DECIMAL(10,2);

ALTER TABLE public.mensalidades ADD COLUMN IF NOT EXISTS referencia VARCHAR(7) NOT NULL;

ALTER TABLE public.mensalidades ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(10,2);

ALTER TABLE public.mensalidades ADD COLUMN IF NOT EXISTS desconto DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.mensalidades ADD COLUMN IF NOT EXISTS multa DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.mensalidades ADD COLUMN IF NOT EXISTS juros DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.mensalidades ADD COLUMN IF NOT EXISTS observacao TEXT;

CREATE TABLE IF NOT EXISTS lancamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
  tipo tipo_lancamento NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  data_lancamento DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE,
  data_pagamento DATE,
  status status_pagamento DEFAULT 'pendente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.carnes ADD COLUMN IF NOT EXISTS ano INTEGER NOT NULL;

ALTER TABLE public.carnes ADD COLUMN IF NOT EXISTS valor_parcela DECIMAL(10,2) NOT NULL;

ALTER TABLE public.carnes ADD COLUMN IF NOT EXISTS data_geracao DATE DEFAULT CURRENT_DATE;

ALTER TABLE public.registros_acesso ADD COLUMN IF NOT EXISTS pessoa_id UUID NOT NULL;

ALTER TABLE public.registros_acesso ADD COLUMN IF NOT EXISTS pessoa_nome VARCHAR(255);

ALTER TABLE public.registros_acesso ADD COLUMN IF NOT EXISTS pessoa_foto TEXT;

ALTER TABLE public.registros_acesso ADD COLUMN IF NOT EXISTS tipo_pessoa tipo_pessoa_acesso NOT NULL;

ALTER TABLE public.registros_acesso ADD COLUMN IF NOT EXISTS local local_acesso NOT NULL DEFAULT 'clube';

ALTER TABLE public.registros_acesso ADD COLUMN IF NOT EXISTS usuario_nome VARCHAR(255);

ALTER TABLE public.registros_acesso ADD COLUMN IF NOT EXISTS observacao TEXT;

ALTER TABLE public.registros_acesso ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.exames_medicos ADD COLUMN IF NOT EXISTS pessoa_id UUID NOT NULL;

ALTER TABLE public.exames_medicos ADD COLUMN IF NOT EXISTS tipo_pessoa tipo_pessoa_exame NOT NULL;

ALTER TABLE public.exames_medicos ADD COLUMN IF NOT EXISTS medico_nome VARCHAR(255);

ALTER TABLE public.exames_medicos ADD COLUMN IF NOT EXISTS crm_medico VARCHAR(20);

ALTER TABLE public.exames_medicos ADD COLUMN IF NOT EXISTS clinica VARCHAR(255);

ALTER TABLE public.exames_medicos ADD COLUMN IF NOT EXISTS status status_exame DEFAULT 'pendente';

ALTER TABLE public.infracoes ADD COLUMN IF NOT EXISTS gravidade gravidade_infracao NOT NULL;

ALTER TABLE public.infracoes ADD COLUMN IF NOT EXISTS evidencias_url TEXT[];

ALTER TABLE public.infracoes ADD COLUMN IF NOT EXISTS dias_suspensao INTEGER;

ALTER TABLE public.infracoes ADD COLUMN IF NOT EXISTS valor_multa DECIMAL(10,2);

ALTER TABLE public.infracoes ADD COLUMN IF NOT EXISTS data_julgamento DATE;

ALTER TABLE public.infracoes ADD COLUMN IF NOT EXISTS parecer TEXT;

ALTER TABLE public.eleicoes ADD COLUMN IF NOT EXISTS votos_brancos INTEGER DEFAULT 0;

ALTER TABLE public.eleicoes ADD COLUMN IF NOT EXISTS total_votos INTEGER DEFAULT 0;

ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS nome VARCHAR(255) NOT NULL;

ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS votos INTEGER DEFAULT 0;

ALTER TABLE public.votos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS numero VARCHAR(20) UNIQUE NOT NULL;

ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES fornecedores(id);

ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(10,2) DEFAULT 0;

ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS status_pagamento status_pagamento_compra DEFAULT 'pendente';

ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS data_entrega DATE;

ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS data_pagamento DATE;

ALTER TABLE public.compras ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES usuarios(id);

CREATE TABLE IF NOT EXISTS itens_compra (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade DECIMAL(10,3) NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  associado_id UUID REFERENCES associados(id),
  ultimo_contato TIMESTAMPTZ,
  status status_contato DEFAULT 'novo',
  etiquetas TEXT[],
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mensagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contato_id UUID NOT NULL REFERENCES contatos(id) ON DELETE CASCADE,
  tipo tipo_mensagem DEFAULT 'texto',
  conteudo TEXT NOT NULL,
  media_url TEXT,
  direcao direcao_mensagem NOT NULL,
  status status_mensagem DEFAULT 'pendente',
  enviada_por UUID REFERENCES usuarios(id),
  data_envio TIMESTAMPTZ DEFAULT NOW(),
  data_leitura TIMESTAMPTZ,
  erro_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS respostas_automaticas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gatilho VARCHAR(255) NOT NULL,
  tipo_gatilho tipo_gatilho DEFAULT 'contem',
  resposta TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  prioridade INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracao_bot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ativo BOOLEAN DEFAULT false,
  horario_inicio TIME,
  horario_fim TIME,
  dias_semana INTEGER[],
  mensagem_fora_horario TEXT,
  usar_ia BOOLEAN DEFAULT false,
  prompt_ia TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campanhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tipo VARCHAR(20) DEFAULT 'texto',
  media_url TEXT,
  status status_campanha DEFAULT 'rascunho',
  data_agendamento TIMESTAMPTZ,
  total_contatos INTEGER DEFAULT 0,
  enviadas INTEGER DEFAULT 0,
  entregues INTEGER DEFAULT 0,
  lidas INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracao_clube (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_clube VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  logo_url TEXT,
  site VARCHAR(255),
  
  dia_vencimento_padrao INTEGER DEFAULT 10,
  valor_mensalidade_individual DECIMAL(10,2),
  valor_mensalidade_familiar DECIMAL(10,2),
  valor_mensalidade_patrimonial DECIMAL(10,2),
  taxa_inscricao DECIMAL(10,2),
  
  sicoob_client_id TEXT,
  sicoob_client_secret TEXT,
  sicoob_numero_contrato TEXT,
  sicoob_ativo BOOLEAN DEFAULT false,
  
  wasender_api_key TEXT,
  wasender_device_id TEXT,
  wasender_ativo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  valor_mensal DECIMAL(10,2) NOT NULL,
  valor_inscricao DECIMAL(10,2),
  descricao TEXT,
  beneficios TEXT[],
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quiosques ADD COLUMN IF NOT EXISTS valor_hora DECIMAL(10,2);

ALTER TABLE public.quiosques ADD COLUMN IF NOT EXISTS valor_diaria DECIMAL(10,2);

ALTER TABLE public.quiosques ADD COLUMN IF NOT EXISTS fotos_url TEXT[];

ALTER TABLE public.quiosques ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS bar_categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bar_produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID REFERENCES bar_categorias(id),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  preco_custo DECIMAL(10,2),
  ncm VARCHAR(10),
  cst VARCHAR(5),
  cfop VARCHAR(5),
  unidade VARCHAR(10) DEFAULT 'UN',
  estoque_atual DECIMAL(10,3) DEFAULT 0,
  estoque_minimo DECIMAL(10,3) DEFAULT 0,
  controla_estoque BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  imagem_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bar_pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_pedido SERIAL UNIQUE NOT NULL,
  associado_id UUID REFERENCES associados(id),
  operador_id UUID REFERENCES usuarios(id),
  caixa_id UUID,
  status status_pedido_bar DEFAULT 'aberto',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  desconto DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  observacao TEXT,
  mesa VARCHAR(20),
  pago_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bar_itens_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES bar_pedidos(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES bar_produtos(id),
  produto_nome VARCHAR(255),
  produto_ncm VARCHAR(10),
  produto_cfop VARCHAR(5),
  produto_cst VARCHAR(5),
  produto_unidade VARCHAR(10),
  quantidade DECIMAL(10,3) NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  desconto DECIMAL(10,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS bar_pagamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES bar_pedidos(id) ON DELETE CASCADE,
  forma_pagamento forma_pagamento_bar NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  troco DECIMAL(10,2) DEFAULT 0,
  referencia_externa VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS carteirinha_saldo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID UNIQUE NOT NULL REFERENCES associados(id),
  saldo DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS carteirinha_movimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  associado_id UUID NOT NULL REFERENCES associados(id),
  tipo tipo_movimento_carteirinha NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  saldo_anterior DECIMAL(10,2) NOT NULL,
  saldo_posterior DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  pedido_id UUID REFERENCES bar_pedidos(id),
  operador_id UUID REFERENCES usuarios(id),
  forma_recarga forma_pagamento_bar,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bar_nfce (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES bar_pedidos(id),
  numero INTEGER,
  serie VARCHAR(5),
  chave_acesso VARCHAR(50),
  protocolo VARCHAR(20),
  status status_nfce DEFAULT 'pendente',
  xml_envio TEXT,
  xml_retorno TEXT,
  qrcode TEXT,
  url_danfe TEXT,
  mensagem_retorno TEXT,
  cpf_cnpj_consumidor VARCHAR(18),
  emitido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bar_config_nfce (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  acbr_url VARCHAR(255) NOT NULL,
  ambiente SMALLINT DEFAULT 2 CHECK (ambiente IN (1, 2)),
  cnpj_emitente VARCHAR(18),
  razao_social VARCHAR(255),
  nome_fantasia VARCHAR(255),
  inscricao_estadual VARCHAR(20),
  crt SMALLINT,
  uf VARCHAR(2),
  csc_id VARCHAR(10),
  csc_token VARCHAR(100),
  serie_nfce VARCHAR(5),
  proximo_numero INTEGER DEFAULT 1,
  ativo BOOLEAN DEFAULT true,
  
  endereco_logradouro VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_complemento VARCHAR(100),
  endereco_bairro VARCHAR(100),
  endereco_municipio VARCHAR(100),
  codigo_municipio VARCHAR(10),
  endereco_cep VARCHAR(10),
  telefone VARCHAR(20),
  
  resp_tec_cnpj VARCHAR(18),
  resp_tec_contato VARCHAR(255),
  resp_tec_email VARCHAR(255),
  resp_tec_fone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bar_caixas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operador_id UUID REFERENCES usuarios(id),
  status status_caixa DEFAULT 'aberto',
  saldo_inicial DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_vendas DECIMAL(10,2) DEFAULT 0,
  total_dinheiro DECIMAL(10,2) DEFAULT 0,
  total_cartao_credito DECIMAL(10,2) DEFAULT 0,
  total_cartao_debito DECIMAL(10,2) DEFAULT 0,
  total_pix DECIMAL(10,2) DEFAULT 0,
  total_carteirinha DECIMAL(10,2) DEFAULT 0,
  total_cortesia DECIMAL(10,2) DEFAULT 0,
  total_troco DECIMAL(10,2) DEFAULT 0,
  total_sangrias DECIMAL(10,2) DEFAULT 0,
  total_suprimentos DECIMAL(10,2) DEFAULT 0,
  saldo_final DECIMAL(10,2) DEFAULT 0,
  saldo_conferido DECIMAL(10,2),
  diferenca DECIMAL(10,2) DEFAULT 0,
  observacao_abertura TEXT,
  observacao_fechamento TEXT,
  aberto_em TIMESTAMPTZ DEFAULT NOW(),
  fechado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bar_caixa_movimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caixa_id UUID NOT NULL REFERENCES bar_caixas(id) ON DELETE CASCADE,
  tipo tipo_movimento_caixa NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  motivo TEXT,
  operador_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

  
  cep TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,

  
  cargo TEXT NOT NULL,
  departamento TEXT NOT NULL,
  tipo_contrato TEXT NOT NULL DEFAULT 'clt' CHECK (tipo_contrato IN ('clt', 'pj', 'estagiario', 'temporario', 'freelancer')),
  data_admissao DATE NOT NULL,
  data_demissao DATE,
  salario DECIMAL(10,2) NOT NULL DEFAULT 0,
  turno TEXT NOT NULL DEFAULT 'integral' CHECK (turno IN ('manha', 'tarde', 'noite', 'integral', 'escala')),
  carga_horaria_semanal INTEGER NOT NULL DEFAULT 44,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'ferias', 'afastado', 'desligado')),

  
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  tipo_conta TEXT CHECK (tipo_conta IN ('corrente', 'poupanca', 'pix')),
  chave_pix TEXT,

  
  ctps_numero TEXT,
  ctps_serie TEXT,
  pis TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

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

CREATE INDEX IF NOT EXISTS idx_associados_status ON associados(status);

CREATE INDEX IF NOT EXISTS idx_associados_cpf ON associados(cpf);

CREATE INDEX IF NOT EXISTS idx_associados_nome ON associados(nome);

CREATE INDEX IF NOT EXISTS idx_dependentes_associado ON dependentes(associado_id);

CREATE INDEX IF NOT EXISTS idx_mensalidades_associado ON mensalidades(associado_id);

CREATE INDEX IF NOT EXISTS idx_mensalidades_status ON mensalidades(status);

CREATE INDEX IF NOT EXISTS idx_mensalidades_referencia ON mensalidades(referencia);

CREATE INDEX IF NOT EXISTS idx_mensalidades_vencimento ON mensalidades(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_registros_acesso_pessoa ON registros_acesso(pessoa_id);

CREATE INDEX IF NOT EXISTS idx_registros_acesso_data ON registros_acesso(data_hora);

CREATE INDEX IF NOT EXISTS idx_registros_acesso_local ON registros_acesso(local);

CREATE INDEX IF NOT EXISTS idx_exames_pessoa ON exames_medicos(pessoa_id);

CREATE INDEX IF NOT EXISTS idx_exames_validade ON exames_medicos(data_validade);

CREATE INDEX IF NOT EXISTS idx_infracoes_associado ON infracoes(associado_id);

CREATE INDEX IF NOT EXISTS idx_infracoes_status ON infracoes(status);

CREATE INDEX IF NOT EXISTS idx_contatos_telefone ON contatos(telefone);

CREATE INDEX IF NOT EXISTS idx_contatos_status ON contatos(status);

CREATE INDEX IF NOT EXISTS idx_mensagens_contato ON mensagens(contato_id);

CREATE INDEX IF NOT EXISTS idx_mensagens_data ON mensagens(data_envio);

CREATE INDEX IF NOT EXISTS idx_funcionarios_status ON funcionarios(status);

CREATE INDEX IF NOT EXISTS idx_funcionarios_departamento ON funcionarios(departamento);

CREATE INDEX IF NOT EXISTS idx_funcionarios_cpf ON funcionarios(cpf);

CREATE INDEX IF NOT EXISTS idx_ponto_funcionario ON ponto_diario(funcionario_id);

CREATE INDEX IF NOT EXISTS idx_ponto_data ON ponto_diario(data);

CREATE INDEX IF NOT EXISTS idx_folha_funcionario ON folha_pagamento(funcionario_id);

CREATE INDEX IF NOT EXISTS idx_folha_referencia ON folha_pagamento(referencia);

CREATE INDEX IF NOT EXISTS idx_folha_status ON folha_pagamento(status);

CREATE INDEX IF NOT EXISTS idx_afastamento_funcionario ON afastamentos(funcionario_id);

CREATE INDEX IF NOT EXISTS idx_afastamento_tipo ON afastamentos(tipo);

CREATE INDEX IF NOT EXISTS idx_afastamento_status ON afastamentos(status);

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid='public.usuarios'::regclass AND conname='fk_usuarios_perfil') THEN ALTER TABLE usuarios ADD CONSTRAINT fk_usuarios_perfil
  FOREIGN KEY (perfil_acesso_id) REFERENCES perfis_acesso(id); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid='public.bar_pedidos'::regclass AND conname='fk_pedido_caixa') THEN ALTER TABLE bar_pedidos ADD CONSTRAINT fk_pedido_caixa
  FOREIGN KEY (caixa_id) REFERENCES bar_caixas(id); END IF; END $migration$;

CREATE OR REPLACE FUNCTION public.clube_clickup_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $fn$ BEGIN NEW.updated_at=now(); RETURN NEW; END $fn$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.associados'::regclass AND NOT tgisinternal AND tgname='tr_associados_updated') THEN CREATE TRIGGER tr_associados_updated BEFORE UPDATE ON public.associados FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.dependentes'::regclass AND NOT tgisinternal AND tgname='tr_dependentes_updated') THEN CREATE TRIGGER tr_dependentes_updated BEFORE UPDATE ON public.dependentes FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.mensalidades'::regclass AND NOT tgisinternal AND tgname='tr_mensalidades_updated') THEN CREATE TRIGGER tr_mensalidades_updated BEFORE UPDATE ON public.mensalidades FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.infracoes'::regclass AND NOT tgisinternal AND tgname='tr_infracoes_updated') THEN CREATE TRIGGER tr_infracoes_updated BEFORE UPDATE ON public.infracoes FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.eleicoes'::regclass AND NOT tgisinternal AND tgname='tr_eleicoes_updated') THEN CREATE TRIGGER tr_eleicoes_updated BEFORE UPDATE ON public.eleicoes FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.compras'::regclass AND NOT tgisinternal AND tgname='tr_compras_updated') THEN CREATE TRIGGER tr_compras_updated BEFORE UPDATE ON public.compras FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.contatos'::regclass AND NOT tgisinternal AND tgname='tr_contatos_updated') THEN CREATE TRIGGER tr_contatos_updated BEFORE UPDATE ON public.contatos FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.exames_medicos'::regclass AND NOT tgisinternal AND tgname='tr_exames_updated') THEN CREATE TRIGGER tr_exames_updated BEFORE UPDATE ON public.exames_medicos FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.usuarios'::regclass AND NOT tgisinternal AND tgname='tr_usuarios_updated') THEN CREATE TRIGGER tr_usuarios_updated BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.configuracao_clube'::regclass AND NOT tgisinternal AND tgname='tr_config_updated') THEN CREATE TRIGGER tr_config_updated BEFORE UPDATE ON public.configuracao_clube FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.bar_produtos'::regclass AND NOT tgisinternal AND tgname='tr_bar_produtos_updated') THEN CREATE TRIGGER tr_bar_produtos_updated BEFORE UPDATE ON public.bar_produtos FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.bar_pedidos'::regclass AND NOT tgisinternal AND tgname='tr_bar_pedidos_updated') THEN CREATE TRIGGER tr_bar_pedidos_updated BEFORE UPDATE ON public.bar_pedidos FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.bar_nfce'::regclass AND NOT tgisinternal AND tgname='tr_bar_nfce_updated') THEN CREATE TRIGGER tr_bar_nfce_updated BEFORE UPDATE ON public.bar_nfce FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.bar_config_nfce'::regclass AND NOT tgisinternal AND tgname='tr_bar_config_nfce_updated') THEN CREATE TRIGGER tr_bar_config_nfce_updated BEFORE UPDATE ON public.bar_config_nfce FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.bar_caixas'::regclass AND NOT tgisinternal AND tgname='tr_bar_caixas_updated') THEN CREATE TRIGGER tr_bar_caixas_updated BEFORE UPDATE ON public.bar_caixas FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.bar_categorias'::regclass AND NOT tgisinternal AND tgname='tr_bar_categorias_updated') THEN CREATE TRIGGER tr_bar_categorias_updated BEFORE UPDATE ON public.bar_categorias FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;

ALTER TABLE public.lancamentos ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='lancamentos' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.lancamentos TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.lancamentos FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lancamentos TO authenticated;
GRANT ALL ON public.lancamentos TO service_role;

ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='fornecedores' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.fornecedores TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.fornecedores FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;

ALTER TABLE public.itens_compra ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='itens_compra' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.itens_compra TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.itens_compra FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.itens_compra TO authenticated;
GRANT ALL ON public.itens_compra TO service_role;

ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='contatos' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.contatos TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.contatos FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.contatos TO authenticated;
GRANT ALL ON public.contatos TO service_role;

ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='mensagens' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.mensagens TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.mensagens FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.mensagens TO authenticated;
GRANT ALL ON public.mensagens TO service_role;

ALTER TABLE public.respostas_automaticas ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='respostas_automaticas' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.respostas_automaticas TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.respostas_automaticas FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.respostas_automaticas TO authenticated;
GRANT ALL ON public.respostas_automaticas TO service_role;

ALTER TABLE public.configuracao_bot ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='configuracao_bot' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.configuracao_bot TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.configuracao_bot FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.configuracao_bot TO authenticated;
GRANT ALL ON public.configuracao_bot TO service_role;

ALTER TABLE public.campanhas ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='campanhas' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.campanhas TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.campanhas FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.campanhas TO authenticated;
GRANT ALL ON public.campanhas TO service_role;

ALTER TABLE public.configuracao_clube ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='configuracao_clube' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.configuracao_clube TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.configuracao_clube FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.configuracao_clube TO authenticated;
GRANT ALL ON public.configuracao_clube TO service_role;

ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='planos' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.planos TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.planos FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.planos TO authenticated;
GRANT ALL ON public.planos TO service_role;

ALTER TABLE public.bar_categorias ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='bar_categorias' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.bar_categorias TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.bar_categorias FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bar_categorias TO authenticated;
GRANT ALL ON public.bar_categorias TO service_role;

ALTER TABLE public.bar_produtos ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='bar_produtos' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.bar_produtos TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.bar_produtos FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bar_produtos TO authenticated;
GRANT ALL ON public.bar_produtos TO service_role;

ALTER TABLE public.bar_pedidos ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='bar_pedidos' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.bar_pedidos TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.bar_pedidos FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bar_pedidos TO authenticated;
GRANT ALL ON public.bar_pedidos TO service_role;

ALTER TABLE public.bar_itens_pedido ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='bar_itens_pedido' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.bar_itens_pedido TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.bar_itens_pedido FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bar_itens_pedido TO authenticated;
GRANT ALL ON public.bar_itens_pedido TO service_role;

ALTER TABLE public.bar_pagamentos ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='bar_pagamentos' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.bar_pagamentos TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.bar_pagamentos FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bar_pagamentos TO authenticated;
GRANT ALL ON public.bar_pagamentos TO service_role;

ALTER TABLE public.carteirinha_saldo ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='carteirinha_saldo' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.carteirinha_saldo TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.carteirinha_saldo FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.carteirinha_saldo TO authenticated;
GRANT ALL ON public.carteirinha_saldo TO service_role;

ALTER TABLE public.carteirinha_movimentos ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='carteirinha_movimentos' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.carteirinha_movimentos TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.carteirinha_movimentos FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.carteirinha_movimentos TO authenticated;
GRANT ALL ON public.carteirinha_movimentos TO service_role;

ALTER TABLE public.bar_nfce ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='bar_nfce' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.bar_nfce TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.bar_nfce FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bar_nfce TO authenticated;
GRANT ALL ON public.bar_nfce TO service_role;

ALTER TABLE public.bar_config_nfce ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='bar_config_nfce' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.bar_config_nfce TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.bar_config_nfce FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bar_config_nfce TO authenticated;
GRANT ALL ON public.bar_config_nfce TO service_role;

ALTER TABLE public.bar_caixas ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='bar_caixas' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.bar_caixas TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.bar_caixas FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bar_caixas TO authenticated;
GRANT ALL ON public.bar_caixas TO service_role;

ALTER TABLE public.bar_caixa_movimentos ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='bar_caixa_movimentos' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.bar_caixa_movimentos TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.bar_caixa_movimentos FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.bar_caixa_movimentos TO authenticated;
GRANT ALL ON public.bar_caixa_movimentos TO service_role;

ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='funcionarios' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.funcionarios TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.funcionarios FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.funcionarios TO authenticated;
GRANT ALL ON public.funcionarios TO service_role;

ALTER TABLE public.ponto_diario ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='ponto_diario' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.ponto_diario TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.ponto_diario FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.ponto_diario TO authenticated;
GRANT ALL ON public.ponto_diario TO service_role;

ALTER TABLE public.folha_pagamento ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='folha_pagamento' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.folha_pagamento TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.folha_pagamento FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.folha_pagamento TO authenticated;
GRANT ALL ON public.folha_pagamento TO service_role;

ALTER TABLE public.afastamentos ENABLE ROW LEVEL SECURITY;
DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='afastamentos' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.afastamentos TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;
REVOKE ALL ON public.afastamentos FROM anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.afastamentos TO authenticated;
GRANT ALL ON public.afastamentos TO service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
