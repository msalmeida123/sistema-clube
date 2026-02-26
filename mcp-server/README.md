# MCP Server - Sistema de Gestão de Clube

Servidor MCP (Model Context Protocol) que expõe todas as funcionalidades do sistema-clube para integração com LLMs como Claude.

## Funcionalidades

### 🧑‍🤝‍🧑 Associados
- `buscar_associados` - Busca com filtros (nome, CPF, status, plano)
- `obter_associado` - Detalhes por ID
- `obter_associado_por_cpf` - Busca por CPF
- `criar_associado` - Cadastro de novo sócio
- `atualizar_associado` - Atualização de dados
- `estatisticas_associados` - Stats gerais

### 👨‍👩‍👧‍👦 Dependentes
- `buscar_dependentes` - Lista com filtros
- `criar_dependente` - Cadastro de dependente

### 💰 Financeiro
- `buscar_mensalidades` - Busca com filtros
- `registrar_pagamento` - Baixa de pagamento
- `gerar_mensalidades` - Geração em lote
- `estatisticas_financeiro` - Resumo financeiro
- `listar_inadimplentes` - Devedores

### 🚪 Portaria
- `registros_acesso` - Histórico de acessos
- `validar_acesso` - Valida permissão (status + adimplência + exame)
- `registrar_acesso` - Registra entrada/saída
- `estatisticas_portaria` - Stats do dia

### 📱 CRM / WhatsApp
- `buscar_contatos_crm` - Lista contatos
- `buscar_mensagens_crm` - Histórico de conversas
- `enviar_whatsapp` - Envia mensagem via provider configurado
- `estatisticas_crm` - Stats de atendimento

### 🛒 Compras
- `buscar_compras` - Lista compras
- `buscar_fornecedores` - Lista fornecedores
- `criar_compra` - Registrar compra

### 🗳️ Eleições
- `buscar_eleicoes` - Lista eleições
- `resultado_eleicao` - Resultado detalhado

### 🏥 Exames Médicos
- `buscar_exames` - Lista exames (vencidos, a vencer)
- `registrar_exame` - Cadastrar exame

### ⚠️ Infrações
- `buscar_infracoes` - Lista infrações
- `registrar_infracao` - Registrar infração

### ⚙️ Configurações
- `listar_planos` - Planos do clube
- `listar_usuarios_sistema` - Usuários/funcionários

### 📊 Dashboard
- `resumo_geral` - Visão completa do clube

### 📋 Prompts
- `relatorio_inadimplencia` - Template de relatório de devedores
- `relatorio_diario` - Template de relatório diário
- `verificar_acesso_completo` - Verificação completa de acesso

## Instalação

### 1. Configurar ambiente

```bash
cd mcp-server
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -e .
```

### 2. Configurar variáveis

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### 3. Testar

```bash
python server.py
```

## Configuração no Claude Desktop

Adicione ao arquivo `claude_desktop_config.json`:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "sistema-clube": {
      "command": "C:\\Users\\Marcelo da Silva Alm\\projetos\\sistema-clube\\mcp-server\\.venv\\Scripts\\python.exe",
      "args": ["C:\\Users\\Marcelo da Silva Alm\\projetos\\sistema-clube\\mcp-server\\server.py"],
      "env": {
        "SUPABASE_URL": "https://fkjjjpgxkjhqkhmdpmzk.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "sua-key-aqui",
        "CLUBE_API_URL": "https://clube.mindforge.dev.br"
      }
    }
  }
}
```

## Configuração no Claude.ai (MCP remoto via SSE)

Para usar como MCP remoto, deploy o server com transporte SSE:

```python
# Altere o entrypoint no server.py:
mcp.run(transport="sse", host="0.0.0.0", port=8080)
```

## Arquitetura

```
Conexão Híbrida:
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  Claude/LLM │────▶│   MCP Server     │────▶│  Supabase    │
│             │     │   (Python)       │     │  (Postgres)  │
└─────────────┘     │                  │     └──────────────┘
                    │  - Consultas DB  │
                    │  - Validações    │     ┌──────────────┐
                    │  - Stats/Reports │────▶│  Next.js API │
                    │                  │     │  (WhatsApp)  │
                    └──────────────────┘     └──────────────┘
```

- **Supabase direto**: Consultas, CRUD, estatísticas (via service role key)
- **Next.js API**: Envio de WhatsApp (usa factory pattern com providers)
