# Módulo: Financeiro

Gestão financeira dos associados: mensalidades, carnês e lançamentos diversos.

## Localização
`src/modules/financeiro/`

## Status
✅ Completo (possui `utils/` próprio de formatação)

## Entidades principais
### `Mensalidade`
associado_id/nome, referência (`"2026-01"`), valor, valor_pago, desconto, multa, juros, data_vencimento/pagamento, `status` (`pendente | pago | atrasado | cancelado`), `forma_pagamento` (`dinheiro | pix | cartao_credito | cartao_debito | boleto | transferencia`).

### `Lancamento`
Lançamento financeiro genérico: `tipo` (`mensalidade | taxa | multa | desconto | outros`), descrição, valor, datas, status.

### `Carne`
Conjunto de parcelas (mensalidades) geradas para um associado em um ano: quantidade_parcelas, valor_parcela, valor_total, status (`ativo | quitado | cancelado`).

Outros tipos: `MensalidadeFilters`, `MensalidadeFormData`, `FinanceiroStats` (total_receber, total_recebido, total_atrasado, inadimplentes + campos de dashboard), `ResumoMensal`, `ResumoFinanceiro`.

## Hooks
- `useMensalidades`, `useMensalidade`
- `useFinanceiroStats`
- `useFinanceiroMutations`

## Components
- `MensalidadesTable`
- `FinanceiroStatsCards` (e `StatsCards`, `StatusBadge`)

## Repository / Service
- `FinanceiroRepository` / `createFinanceiroRepository`
- `FinanceiroService` / `createFinanceiroService`
- Repository específico: `mensalidades.repository.ts`

## Utils próprios
`utils/formatters.ts` — formatação de valores financeiros do módulo.

## Uso
```tsx
import { useMensalidades, useFinanceiroStats } from '@/modules/financeiro'
```

## Relacionados
- `associados` (mensalidade vinculada a um sócio)
- `configuracoes` (valores padrão de mensalidade por plano, dia de vencimento padrão)
- `portaria` (adimplência usada na validação de acesso)
