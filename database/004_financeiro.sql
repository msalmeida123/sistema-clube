-- =============================================
-- FINANCEIRO - MENSALIDADES E PAGAMENTOS
-- =============================================

-- Planos e Valores
CREATE TABLE planos_valores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo tipo_plano NOT NULL,
    valor_mensal DECIMAL(10,2) NOT NULL,
    taxa_agregado DECIMAL(10,2) DEFAULT 0,
    valor_academia DECIMAL(10,2) DEFAULT 0,
    vigencia_inicio DATE NOT NULL,
    vigencia_fim DATE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensalidades
CREATE TABLE mensalidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    associado_id UUID NOT NULL REFERENCES associados(id) ON DELETE CASCADE,
    tipo tipo_cobranca NOT NULL,
    referencia VARCHAR(7) NOT NULL, -- formato: 2024-01
    valor DECIMAL(10,2) NOT NULL,
    valor_pago DECIMAL(10,2),
    data_vencimento DATE NOT NULL,
    data_pagamento TIMESTAMPTZ,
    status status_pagamento DEFAULT 'pendente',
    tipo_pagamento tipo_pagamento,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mensalidades_associado ON mensalidades(associado_id);
CREATE INDEX idx_mensalidades_status ON mensalidades(status);
CREATE INDEX idx_mensalidades_vencimento ON mensalidades(data_vencimento);
CREATE INDEX idx_mensalidades_referencia ON mensalidades(referencia);

-- Boletos Sicoob
CREATE TABLE boletos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mensalidade_id UUID NOT NULL REFERENCES mensalidades(id) ON DELETE CASCADE,
    nosso_numero VARCHAR(50),
    linha_digitavel VARCHAR(100),
    codigo_barras VARCHAR(100),
    url_boleto TEXT,
    data_emissao DATE DEFAULT CURRENT_DATE,
    data_vencimento DATE NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    valor_multa DECIMAL(10,2) DEFAULT 0,
    valor_juros DECIMAL(10,2) DEFAULT 0,
    status status_pagamento DEFAULT 'pendente',
    data_pagamento TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_boletos_mensalidade ON boletos(mensalidade_id);
CREATE INDEX idx_boletos_nosso_numero ON boletos(nosso_numero);

-- PIX Sicoob
CREATE TABLE pix_cobrancas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mensalidade_id UUID NOT NULL REFERENCES mensalidades(id) ON DELETE CASCADE,
    txid VARCHAR(100) UNIQUE,
    location TEXT,
    qrcode TEXT,
    qrcode_base64 TEXT,
    valor DECIMAL(10,2) NOT NULL,
    status status_pagamento DEFAULT 'pendente',
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    data_expiracao TIMESTAMPTZ,
    data_pagamento TIMESTAMPTZ,
    end_to_end_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pix_mensalidade ON pix_cobrancas(mensalidade_id);
CREATE INDEX idx_pix_txid ON pix_cobrancas(txid);
CREATE INDEX idx_pix_status ON pix_cobrancas(status);

-- Webhook Pagamentos (log de notificações Sicoob)
CREATE TABLE webhook_pagamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(20) NOT NULL, -- 'boleto' ou 'pix'
    payload JSONB NOT NULL,
    processado BOOLEAN DEFAULT false,
    erro TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

