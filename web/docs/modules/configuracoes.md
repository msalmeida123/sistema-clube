# Módulo: Configurações

Configurações globais do clube: dados institucionais, valores de mensalidade, integrações (Sicoob, WaSender), planos e quiosques.

## Localização
`src/modules/configuracoes/`

## Status
⚠️ Sem UI própria (types/repository/service/hooks; a UI vive nas páginas em `src/app/`)

## Entidades principais
### `ConfiguracaoClube` (alias: `Configuracao`)
Dados institucionais (nome_clube, cnpj, endereço, logo, site), valores padrão de mensalidade por plano (individual/familiar/patrimonial), taxa de inscrição, dia de vencimento padrão.

Integrações embutidas:
- **Sicoob**: `sicoob_client_id`, `sicoob_client_secret`, `sicoob_numero_contrato`, `sicoob_ativo`
- **WaSender**: `wasender_api_key`, `wasender_device_id`, `wasender_ativo`

### `Plano`
nome, código, valor_mensal, valor_inscricao, benefícios, ativo.

### `Quiosque`
nome, capacidade, valor_hora, valor_diaria, fotos, disponibilidade.

Outros tipos: `ConfigFormData` (alias `ConfiguracaoFormData`), `ConfiguracaoFilters`, `SicoobConfig`, `WaSenderConfig`.

## Hooks
- `useConfiguracao`
- `usePlanos`
- `useQuiosques`

## Repository / Service
- `ConfiguracoesRepository` / `createConfiguracoesRepository`
- `ConfiguracoesService` / `createConfiguracoesService`

## Uso
```tsx
import { useConfiguracao, usePlanos, useQuiosques } from '@/modules/configuracoes'
```

## Relacionados
- `crm` / `whatsapp-crm` (config WaSender consumida pelo microserviço CRM externo, tabela `config_wasender`)
- `bar` (dados fiscais do emitente)
- `financeiro` (valores padrão de mensalidade por plano)
