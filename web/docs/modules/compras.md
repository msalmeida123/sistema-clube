# Módulo: Compras

Controle de compras e fornecedores do clube.

## Localização
`src/modules/compras/`

## Status
⚠️ Sem UI própria (types/repository/service/hooks; a UI vive nas páginas em `src/app/`)

## Entidades principais
### `Fornecedor`
nome, cnpj, telefone, email, endereco, observacoes, ativo.

### `Compra`
número, fornecedor_id/nome, descrição, valor_total, valor_pago, `status` (`rascunho | pendente | aprovada | finalizada | cancelada`), `status_pagamento` (`pendente | pago | parcial`), datas de compra/entrega/pagamento, itens.

### `ItemCompra`
descrição, quantidade, valor_unitario, valor_total, vinculado a `compra_id`.

Outros tipos: `CompraFilters`, `CompraFormData`, `ComprasStats` (total_mes, pendentes, a_pagar, quantidade_compras).

## Hooks
- `useCompras`, `useCompra`, `useComprasMutations`
- `useFornecedores`
- `useComprasStats`

## Repository / Service
- `ComprasRepository` / `createComprasRepository`
- `ComprasService` / `createComprasService`

## Uso
```tsx
import { useCompras, useFornecedores } from '@/modules/compras'
```

## Relacionados
- `bar` (compra de insumos/produtos revendidos no bar, indiretamente)
- `financeiro` (compras a pagar entram no fluxo de caixa do clube)
